"""Verify audit deliverables and original file integrity; not a game acceptance test."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[3]
OUT=Path(__file__).resolve().parent
MAIN=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game')
def digest(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(name): return json.loads((OUT/name).read_text())

def run():
    checks={}
    for name,root in [('workspace',ROOT),('main',MAIN)]:
        rows=read(name+'-baseline.json')
        changes=[r['path'] for r in rows if not (root/r['path']).is_file() or digest(root/r['path'])!=r['sha256']]
        checks[name+'Baseline']={'checkedFiles':len(rows),'changed':changes}
    frozen=json.loads((ROOT/'docs/chapter2/frozen-files.json').read_text())['files']
    checks['frozenFiles']={'checkedFiles':len(frozen),'changed':[r['path'] for r in frozen if digest(ROOT/r['path'])!=r['sha256']]}
    c=json.loads((ROOT/'src/chapter2/contracts/contract.json').read_text())
    p=read('asset-plan.json');ids={r['assetId'] for r in p['assets']};required={r['assetId'] for r in c['npcs']+c['items']}
    assert len(ids)==len(p['assets']) and required<=ids
    assert p['actualTotalCredits']==p['approvedTotalCredits']==p['paidRequestsSubmitted']==0 and not p['ASSETS_READY']
    for a in p['assets']:
        assert a['promptSHA256']==hashlib.sha256(a['englishPrompt'].encode()).hexdigest()
        assert a['expectedCredits']['approvedCap']==a['attemptCap']['authorizedPaid']==a['actualCredits']==0
        assert not a['approvedForProduction'] and not a['artAccepted'] and not a['performanceAccepted'] and not a['tasks']
    checks['plan']={'assets':len(ids),'requiredContractAssets':len(required),'coverageComplete':True,'paidCap':0,'modelsProduced':0}
    known={r['path'] for r in read('workspace-baseline.json')}
    prefixes=['public/assets/chapter2/characters/','public/assets/chapter2/props/','public/assets/chapter2/previews/','src/chapter2/assets/','docs/chapter2/assets/']
    unexpected=[]
    for folder in ['src','docs','public','scripts']:
        for f in (ROOT/folder).rglob('*'):
            if f.is_file():
                rel=str(f.relative_to(ROOT))
                if rel not in known and not any(rel.startswith(prefix) for prefix in prefixes):unexpected.append(rel)
    checks['writeBoundary']={'unexpectedNewFiles':unexpected};assert not unexpected
    audit=read('existing-glb-audit.json');assert not audit['catalogHashMismatches']
    for row in audit['files']:assert digest(ROOT/row['path'])==row['sha256']
    checks['glb']={'checkedFiles':audit['count'],'catalogHashMismatches':audit['catalogHashMismatches'],'sourceUnchanged':True}
    browser=read('browser-review.json')['rows'];assert len(browser)==8 and len({r['assetId'] for r in browser})==8
    clips=[clip for r in browser for clip in r['animationSamples']]
    assert len(clips)==15 and all(r['decoded'] and not r['formalChapter2Accepted'] for r in browser)
    assert all(a['maxSampledWorldVertexDisplacement']>0 and a['secondCloneUnchanged'] and a['independentBoneObjects'] and not a['visualAccepted'] for a in clips)
    checks['browser']={'decodedObjects':len(browser),'sampledClips':len(clips),'realSkinChange':True,'independentClones':True,'DSceneAccepted':False}
    ref=read('reference-manifest.json')
    assert digest(Path(ref['sourceAbsolutePath']))==ref['sourceSHA256']
    for r in ref['crops']:assert digest(ROOT/r['path'])==r['sha256']
    checks['reference']={'crops':len(ref['crops']),'originalUnchanged':True}
    checks['git']={'workspaceHasGit':(ROOT/'.git').exists(),'mainHasGit':(MAIN/'.git').exists(),'gitCommandsExecuted':False}
    # A concurrent master edit is reported honestly, not silently accepted as ours.
    workspace_clean=not checks['workspaceBaseline']['changed'] and not checks['frozenFiles']['changed']
    assert workspace_clean
    result={'ASSET_AUDIT_READY':True,'ASSETS_READY':False,'formalASSET_READYChanged':False,'checks':checks}
    (OUT/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    p['ASSET_AUDIT_READY']=True
    (OUT/'asset-plan.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':run()
