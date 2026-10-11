"""Direct Tripo API runner for the approved single merchant. No automatic POST retries."""
import argparse, datetime, fcntl, hashlib, json, os, struct, urllib.request, urllib.error
from pathlib import Path
ROOT = Path(__file__).resolve().parents[3]
DOC = Path(__file__).resolve().parent
PLAN = DOC/'merchant-generation-plan-20261002.json'
LEDGER = DOC/'merchant-execution-20261002.json'
LOCK = DOC/'merchant-execution-20261002.lock'
DEST = ROOT/'public/assets/chapter2/characters/asset_c2_merchant/v1'
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def digest(b): return hashlib.sha256(b).hexdigest()
def encode(v): return json.dumps(v, ensure_ascii=False, sort_keys=True, separators=(',',':')).encode()
def save(p,v):
    t=p.with_suffix(p.suffix+'.part');t.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n');os.replace(t,p)
def clean(v):
    if isinstance(v,dict): return {k:clean(x) for k,x in v.items() if k.lower() not in ['api_key','authorization','token','file_token']}
    if isinstance(v,list): return [clean(x) for x in v]
    if isinstance(v,str) and ('https://' in v or 'http://' in v): return '[remote URL omitted]'
    return v
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None

def main():
    a=argparse.ArgumentParser();a.add_argument('action',choices=['submit','poll','download','balance']);a.add_argument('stage',nargs='?',default='generation');args=a.parse_args()
    plan=json.loads(PLAN.read_text()); assert plan['assetId']=='asset_c2_merchant'
    conf=json.loads((Path.home()/'.tripo/qingming45-api.json').read_text())
    base=conf['api_base'].rstrip('/');assert base=='https://openapi.tripo3d.ai'
    key=conf['api_key']; opener=urllib.request.build_opener(NoRedirect())
    def api(method,path,payload=None):
        req=urllib.request.Request(base+path, data=encode(payload) if payload is not None else None, method=method, headers={'Authorization':'Bearer '+key,'Content-Type':'application/json'})
        try:
            with opener.open(req,timeout=35) as response: return json.load(response)
        except urllib.error.HTTPError as e:
            try: body=json.loads(e.read())
            except Exception: body={'code':'http_error','httpStatus':e.code}
            return body
    def balance():
        result=api('GET','/v3/account/balance');assert result.get('code')==0, 'balance query failed'
        data=result['data'];return {k:data.get(k) for k in ['balance','frozen','available','available_credits','frozen_credits'] if k in data}
    with LOCK.open('a+') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        ledger=json.loads(LEDGER.read_text())
        assert ledger['approvedCreditCap']==120 and ledger['userApproval']=='确认'
        if args.action=='balance':
            b=balance();ledger['latestBalance']={'checkedAt':now(),**b};save(LEDGER,ledger);print(json.dumps(b));return
        templateStage={'rig-tripo':'rig','retarget-tripo':'retarget','idle-single':'retarget','walk-single':'retarget'}.get(args.stage,args.stage)
        template=json.loads(json.dumps(next(s for s in plan['steps'] if s['stage']==templateStage)))
        if args.stage in ['rig-tripo','retarget-tripo']:
            assert ledger.get('repair',{}).get('changes')=={'rig.spec':'tripo'}, 'unapproved repair scope'
        if args.stage=='rig-tripo': template['payload']['spec']='tripo'
        if args.stage in ['idle-single','walk-single']:
            assert ledger.get('singleAnimationRepair',{}).get('additionalCap')==20
            template['payload'].pop('animations')
            template['payload']['animation']='preset:biped:'+args.stage.split('-')[0]
            template['estimatedCredits']=[10,10]
        steps=ledger['steps']; entry=steps.get(args.stage)
        if args.action=='submit':
            assert not ledger.get('paidExecutionClosed'), 'paid execution closed; resume known downloads only'
            if entry: raise RuntimeError('Stage already recorded; query existing task, never blindly resubmit')
            if args.stage!='generation':
                assert steps.get('generation',{}).get('status')=='success', 'generation incomplete'
                assert ledger.get('bodyVisualReview',{}).get('continueToRig') is True, 'visual gate missing'
            if args.stage in ['rig','rig-tripo']:
                check=steps.get('rig-check',{});assert check.get('status')=='success'
                result=check.get('result',{}).get('output',{})
                assert result.get('riggable') is True and result.get('rig_type')=='biped', 'not biped-riggable'
            if args.stage in ['retarget','retarget-tripo','idle-single','walk-single']:
                assert steps.get('rig-tripo' if args.stage in ['retarget-tripo','idle-single','walk-single'] else 'rig',{}).get('status')=='success'
            if args.stage=='walk-single': assert steps.get('idle-single',{}).get('status')=='success', 'stop after idle failure'
            committed=sum(float(s.get('effectiveBudgetCost')) if s.get('effectiveBudgetCost') is not None else float(s.get('creditsConsumed')) if s.get('creditsConsumed') is not None else s['reservedCreditUpper'] for s in steps.values())
            assert committed+template['estimatedCredits'][1]<=120, 'budget cap reached'
            payload=json.loads(json.dumps(template['payload']))
            if payload.get('input')=='GENERATION_TASK_ID': payload['input']=steps['generation']['taskId']
            if payload.get('input')=='RIG_TASK_ID': payload['input']=steps['rig-tripo' if args.stage in ['retarget-tripo','idle-single','walk-single'] else 'rig']['taskId']
            assert all('TASK_ID' not in str(v) for v in payload.values())
            if args.stage=='generation':
                assert len(payload['prompt'])<=1024 and len(payload['negative_prompt'])<=255
                assert digest(encode(payload))==plan['requestSHA256'], 'approved request changed'
            b=balance();ledger['latestBalance']={'checkedAt':now(),**b}
            available=b.get('available',b.get('available_credits'))
            if available is None and b.get('balance') is not None: available=float(b['balance'])-float(b.get('frozen',b.get('frozen_credits',0)) or 0)
            assert available is not None and float(available)>=template['estimatedCredits'][1], 'insufficient available balance'
            entry={'status':'submitting','startedAt':now(),'endpoint':template['endpoint'],'request':payload,'requestSHA256':digest(encode(payload)), 'reservedCreditUpper':template['estimatedCredits'][1], 'creditsConsumed':None, 'taskId':None}
            steps[args.stage]=entry;save(LEDGER,ledger)
            try: result=api('POST',template['endpoint'],payload)
            except Exception as e:
                entry['status']='submission_unknown';entry['errorType']=type(e).__name__;save(LEDGER,ledger)
                print(json.dumps({'stage':args.stage,'status':entry['status'],'noAutomaticRetry':True}));return
            task=result.get('data',{}).get('task_id')
            if result.get('code')!=0:
                entry['status']='rejected';entry['rejection']=clean(result);save(LEDGER,ledger)
                print(json.dumps({'stage':args.stage,'status':'rejected','code':result.get('code'),'message':clean(result.get('message',result.get('msg')))},ensure_ascii=False));return
            if not task:
                entry['status']='submission_unknown';save(LEDGER,ledger);print(json.dumps({'status':entry['status']}));return
            entry['taskId']=task;entry['status']='submitted';entry['submittedAt']=now();save(LEDGER,ledger)
            print(json.dumps({'stage':args.stage,'taskId':task,'status':'submitted'}));return
        assert entry and entry.get('taskId'), 'no known task; no blind resubmission'
        result=api('GET','/v3/tasks/'+entry['taskId']);assert result.get('code')==0, 'task query failed'
        data=result['data'];entry['result']=clean(data);entry['status']=data.get('status');entry['progress']=data.get('progress');entry['lastCheckedAt']=now()
        if 'credits_consumed' in data: entry['creditsConsumed']=data['credits_consumed']
        save(LEDGER,ledger)
        if args.action=='download':
            assert entry['status']=='success', 'task not complete'
            output=data.get('output',{}); url=output.get('model_url') or output.get('pbr_model') or output.get('model')
            if isinstance(url,dict): url=url.get('url')
            assert isinstance(url,str) and url.startswith('https://'), 'no model URL'
            DEST.mkdir(parents=True,exist_ok=True);p=DEST/(args.stage+'.glb')
            if p.exists():
                expected=entry.get('download',{}).get('sha256');assert expected and digest(p.read_bytes())==expected, 'existing model not recorded'
            else:
                part=p.with_suffix('.glb.part')
                try:
                    with urllib.request.urlopen(url,timeout=60) as response,part.open('wb') as dest:
                        while chunk:=response.read(1024*1024): dest.write(chunk)
                    contents=part.read_bytes();magic,version,length=struct.unpack_from('<4sII',contents)
                    assert magic==b'glTF' and version==2 and length==len(contents), 'invalid GLB download'
                    os.replace(part,p)
                except Exception as e:
                    print(json.dumps({'status':'download_failed','errorType':type(e).__name__,'taskId':entry['taskId']}));return
                entry['download']={'path':str(p.relative_to(ROOT)),'sha256':digest(contents),'bytes':len(contents)};save(LEDGER,ledger)
        print(json.dumps({'stage':args.stage,'taskId':entry['taskId'],'status':entry['status'],'progress':entry.get('progress'),'creditsConsumed':entry.get('creditsConsumed'),'outputKeys':list(data.get('output',{})),'download':entry.get('download')},ensure_ascii=False))
if __name__=='__main__':
    try: main()
    except Exception as e: print(json.dumps({'runnerError':type(e).__name__,'detail':str(e) if isinstance(e,(AssertionError,RuntimeError)) else 'see local state; no automatic POST retry'},ensure_ascii=False));raise SystemExit(1)
