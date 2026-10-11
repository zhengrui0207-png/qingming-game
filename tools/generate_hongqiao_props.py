"""Direct Tripo V3 generation. Credentials stay in local private config."""
from pathlib import Path
import argparse, json, re, urllib.request, urllib.error, time, hashlib, struct, sys, fcntl
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/hongqiao_props'
IDS=['item_hq_rope','item_hq_pole','item_hq_cloth']
NAMES=['备用缆绳','长竹篙','折叠护货布']
DOC=ROOT/'虹桥道具重建清单与3D生成提示词.md'
c=json.loads((Path.home()/'.tripo/qingming45-api.json').read_text())
BASE=c['api_base'].rstrip('/')
if not BASE.endswith('/v3'): BASE+='/v3'
KEY=c['api_key']

def save(path,d):
 tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(json.dumps(d,ensure_ascii=False,indent=2));tmp.replace(path)
def api(path,body=None):
 req=urllib.request.Request(BASE+path,data=json.dumps(body).encode() if body is not None else None,headers={'Authorization':'Bearer '+KEY,'Content-Type':'application/json'})
 try:
  with urllib.request.urlopen(req,timeout=45) as r: d=json.load(r)
 except urllib.error.HTTPError as e:
  raw=e.read().decode(errors='replace').replace(KEY,'[REDACTED]')
  raise RuntimeError(f'HTTP {e.code}: {raw[:800]}') from None
 if d.get('code')!=0: raise RuntimeError(json.dumps(d,ensure_ascii=False).replace(KEY,'[REDACTED]')[:800])
 return d

def sanitize(d):
 if isinstance(d,dict): return {k:sanitize(v) for k,v in d.items() if k.lower() not in ['api_key','authorization']}
 if isinstance(d,list): return [sanitize(v) for v in d]
 if isinstance(d,str) and d.startswith('http'): return d.split('?')[0]
 return d

def inspect_glb(path):
 b=path.read_bytes();magic,ver,length=struct.unpack_from('<4sII',b)
 assert magic==b'glTF' and ver==2 and length==len(b),'Invalid GLB header'
 n,typ=struct.unpack_from('<II',b,12); assert typ==0x4E4F534A
 d=json.loads(b[20:20+n]); triangles=0
 for m in d.get('meshes',[]):
  for p in m['primitives']:
   acc=d['accessors'][p['indices']] if 'indices' in p else d['accessors'][p['attributes']['POSITION']]
   if p.get('mode',4)==4: triangles+=acc['count']//3
 return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'triangles':triangles,'meshes':len(d.get('meshes',[])),'materials':len(d.get('materials',[])),'images':len(d.get('images',[])),'external_uris':[x['uri'] for key in ['buffers','images'] for x in d.get(key,[]) if 'uri' in x and not x['uri'].startswith('data:')],'extensions':d.get('extensionsUsed',[]),'position_bounds':[{'min':d['accessors'][p['attributes']['POSITION']].get('min'),'max':d['accessors'][p['attributes']['POSITION']].get('max')} for m in d.get('meshes',[]) for p in m['primitives']]}

def download(url,path):
 # Artifact requests intentionally contain no API authorization header.
 req=urllib.request.Request(url,headers={'User-Agent':'QingmingAssetDownloader/1.0'})
 with urllib.request.urlopen(req,timeout=90) as r:
  data=r.read()
 tmp=path.with_suffix(path.suffix+'.part');tmp.write_bytes(data);tmp.replace(path)

def run(asset):
 directory=OUT/asset;directory.mkdir(parents=True,exist_ok=True)
 lock=(directory/'.lock').open('a');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
 statepath=directory/'task.json';state=json.loads(statepath.read_text()) if statepath.exists() else {}
 idx=IDS.index(asset)
 prompt=re.findall(r'```text\n(.*?)\n```',DOC.read_text(),re.S)[idx]
 assert len(prompt)<=1024
 body={'prompt':prompt,'model':'P1-20260311','face_limit':2000,'texture':True,'pbr':True,'texture_quality':'standard'}
 digest=hashlib.sha256(json.dumps(body,sort_keys=True).encode()).hexdigest()
 if state:
  assert state.get('request_sha256')==digest,'Existing task input differs; do not overwrite'
  if state.get('status')=='downloaded': print(json.dumps(state,ensure_ascii=False),flush=True);return
  if not state.get('task_id'): raise RuntimeError('Unknown submission; inspect service before submitting again')
 else:
  bal=api('/account/balance')['data']
  assert bal['balance']>=40,'Insufficient available balance'
  known=[]
  for f in OUT.glob('*/task.json'): known.append(json.loads(f.read_text()))
  assert sum(x.get('credits_consumed',40) for x in known)+40<=120,'Batch cap reached'
  state={'asset_id':asset,'name':NAMES[idx],'base_url':BASE,'request_sha256':digest,'estimated_credits':40,'balance_before':bal,'status':'submission_unknown'}
  save(directory/'request.json',body);save(statepath,state)
  response=api('/generation/text-to-model',body)
  state.update(task_id=response['data']['task_id'],status='submitted');save(statepath,state)
  print('SUBMITTED',asset,state['task_id'],flush=True)
 deadline=time.monotonic()+1800
 previous=None
 while time.monotonic()<deadline:
  response=api('/tasks/'+state['task_id']);d=response['data']
  save(directory/'response.json',sanitize(response))
  status=d['status'];marker=(status,d.get('progress'))
  state.update(status=status,progress=d.get('progress'))
  credits=d.get('credits_consumed',d.get('consumed_credit'))
  if credits is not None:state['credits_consumed']=credits
  save(statepath,state)
  if marker!=previous:print(asset,status,d.get('progress'),flush=True);previous=marker
  if status in ['failed','cancelled','banned','expired']:raise RuntimeError('Task failed; no automatic regeneration: '+json.dumps(sanitize(d),ensure_ascii=False)[:1500])
  if status=='success':
   output=d.get('output',{})
   print('OUTPUT_FIELDS',json.dumps({k:type(v).__name__ for k,v in output.items()}),flush=True)
   model=output.get('model_url') or output.get('pbr_model') or output.get('model')
   if isinstance(model,dict):model=model.get('url')
   assert model,'Model URL missing'
   download(model,directory/(asset+'.glb'))
   metrics=inspect_glb(directory/(asset+'.glb'));save(directory/'inspection.json',metrics)
   preview=output.get('rendered_image_url') or output.get('rendered_image')
   if isinstance(preview,dict):preview=preview.get('url')
   if preview:download(preview,directory/'preview.png')
   state.update(status='downloaded',model_file=str(directory/(asset+'.glb')),inspection=metrics,preview_file=str(directory/'preview.png') if preview else None)
   save(statepath,state)
   print('DONE',json.dumps(state,ensure_ascii=False),flush=True);return
  time.sleep(10)
 raise RuntimeError('Polling stopped after 30 minutes; resume existing task by rerunning')

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('asset',choices=IDS);args=p.parse_args()
 try:run(args.asset)
 except Exception as e: print(type(e).__name__+': '+str(e).replace(KEY,'[REDACTED]'),file=sys.stderr);sys.exit(1)
