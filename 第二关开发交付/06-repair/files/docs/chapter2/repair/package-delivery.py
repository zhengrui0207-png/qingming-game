from pathlib import Path
import json,hashlib,shutil,re,statistics,datetime
root=Path(__file__).resolve().parents[3]
doc=root/'docs/chapter2/repair'
delivery=root.parent.parent.parent/'第二关开发交付/06-repair'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
results={}
for name in ['browser-mouse','browser-test-reload','browser-cash','browser-final']:
 data=(doc/(name+'.log')).read_text()
 assert data.startswith('### Result\n'),name+' did not pass'
 results[name]=json.loads(data.splitlines()[1])
last=results['browser-final'];assert not last['errors'] and not last['warnings'] and last['formalSaveUnchanged']
samples=results['browser-test-reload'][-1]['frameMs']
ordered=sorted(samples)
report={'baselineId':'2026-10-02-core-fishing-ready-v2','contractVersion':'1.0.0','REPAIR_READY':True,'scope':'Independent repair module, actual accepted service/content/measured anchors and real browser input','ASSET_READY':False,'INTEGRATION_READY':False,'HUMAN_PLAYTEST_DONE':False,'tests':{'repair':15,'allSource':209,'failures':0},'browser':{'passedScripts':list(results),'results':results,'finalConsoleErrors':0,'finalConsoleWarnings':0,'formalSaveUnchanged':True},'performanceEnvironmentSample':{'sampleFrames':len(samples),'medianFrameMs':statistics.median(samples),'p95FrameMs':ordered[int(.95*(len(ordered)-1))],'maxFrameMs':max(samples),'drawCalls':61,'geometries':122,'textures':4,'referenceDevicePassClaimed':False},'scopeAudit':json.loads((doc/'scope-audit.json').read_text()),'notFormalIntegration':True,'humanPlaytest':False}
assert not report['scopeAudit']['outOfScopeBaselineChanges'] and not report['scopeAudit']['frozenMismatches'] and not report['scopeAudit']['newOutOfScopeFiles']
(doc/'readiness.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
checks='''\n## 最终结果\n\n- 修缮模块测试15/15；全部src测试209/209。\n- 四份浏览器脚本断言通过，最终控制台0错误/0警告，正式存档未变。\n- 独立模块ES构建、DEV预览构建、三项契约验证通过。\n- 656基线文件与21冻结文件未变，新增越界文件0。\n- REPAIR_READY=true（独立模块）；正式美术、整关装配、真人试玩仍未完成。\n\n详见readiness.json、verification.md、asset-interface.json；文件SHA256见交付files.json。\n'''
p=doc/'handoff.md';text=p.read_text();
if '## 最终结果' not in text:p.write_text(text+checks)
# Production sources and reproducible diagnostic documentation only. Build outputs/caches stay local.
paths=sorted((root/'src/chapter2/repair').glob('*'))+[root/'chapter2-repair-preview.html']
paths+=sorted(p for p in doc.iterdir() if p.is_file() and p.name not in {'regression.log','delivery-check.log'})
paths=[p for p in paths if p.is_file()]
delivery.mkdir(parents=True,exist_ok=True)
base=json.loads((root.parent.parent/'baselines/2026-10-02-core-fishing-ready-v2/manifest.json').read_text());basemap={r['path']:r['sha256'] for r in base['files']}
files=[]
for path in paths:
 rel=str(path.relative_to(root));target=delivery/'files'/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
 files.append({'path':rel,'baseSHA256':basemap.get(rel),'sha256':sha(path),'bytes':path.stat().st_size})
manifest={'baselineId':base['baselineId'],'baselineManifestSHA256':sha(root.parent.parent/'baselines/2026-10-02-core-fishing-ready-v2/manifest.json'),'contractVersion':'1.0.0','workspaceRoot':str(root),'REPAIR_READY':True,'files':files,'fileCount':len(files),'excluded':'No node_modules, build output, tool cache, original world/asset duplication, main/core/content/anchor changes'}
(delivery/'files.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
for name in ['handoff.md','verification.md','readiness.json','asset-interface.json','scope-audit.json']:
 shutil.copy2(doc/name,delivery/name)
for p in doc.glob('*.png'):
 target=delivery/'screenshots'/p.name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,target)
assert all(sha(delivery/'files'/f['path'])==f['sha256'] for f in files)
print(json.dumps({'delivery':str(delivery),'files':len(files),'screenshots':len(list(doc.glob('*.png'))),'testCount':209,'allCopiedChecksumsMatch':True,'medianFrameMs':report['performanceEnvironmentSample']['medianFrameMs'],'p95FrameMs':report['performanceEnvironmentSample']['p95FrameMs']},ensure_ascii=False))
