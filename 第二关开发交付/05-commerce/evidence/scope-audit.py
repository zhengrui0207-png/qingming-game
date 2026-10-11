import pathlib,json,hashlib
root=pathlib.Path(__file__).resolve().parents[3]
expected=json.loads((root/'docs/chapter2/commerce/baseline-sha256.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
changed=[name for name,value in expected['files'].items() if not (root/name).is_file() or sha(root/name)!=value]
frozen=json.loads((root/'docs/chapter2/frozen-files.json').read_text())
frozen_changed=[row['path'] for row in frozen['files'] if sha(root/row['path'])!=row['sha256']]
main=pathlib.Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game')
paths=['src/main.js','src/hongqiao/state.js','src/hongqiao/persistence.js','src/world.js','src/interaction/core.js','src/chapter2/core/service.js','src/chapter2/core/state.js','package.json','package-lock.json']
paths=[p for p in paths if (root/p).is_file()]
main_checks=[{'path':p,'workspaceSha256':sha(root/p),'mainSha256':sha(main/p),'equal':sha(root/p)==sha(main/p)} for p in paths]
result={'baseline':expected['baseline'],'readonlyFilesChecked':len(expected['files']),'readonlyChanges':changed,'frozenChanges':frozen_changed,'mainReadOnlyComparisons':main_checks,'allowedNewPaths':['src/chapter2/commerce/**','docs/chapter2/commerce/**','chapter2-commerce-preview.html'],'gitInitialized':False}
(root/'docs/chapter2/commerce/scope-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'readonly':len(expected['files']),'changed':changed,'frozenChanged':frozen_changed},ensure_ascii=False))
if changed or frozen_changed:raise SystemExit(1)
