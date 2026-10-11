from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[3]
baseline=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/baselines/2026-10-01-core-ready-v1/manifest.json')
manifest=json.loads(baseline.read_text());original={f['path']:f['sha256']for f in manifest['files']}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
changed=[p for p,h in original.items()if not(root/p).is_file()or sha(root/p)!=h]
added=[str(p.relative_to(root))for p in root.rglob('*')if p.is_file()and'node_modules'not in p.parts and'dist'not in p.parts and str(p.relative_to(root))not in original]
allowed=lambda p:p.startswith('src/chapter2/fishing/')or p.startswith('docs/chapter2/fishing/')or p in ['chapter2-fishing-preview.html','docs/chapter2/THIS-WORKSPACE.md']
frozen=json.loads((root/'docs/chapter2/frozen-files.json').read_text())
bad_frozen=[row['path']for row in frozen['files']if sha(root/row['path'])!=row['sha256']]
main=Path(manifest['sourceRoot']);main_changed=[p for p,h in original.items()if not(main/p).is_file()or sha(main/p)!=h]
report={'baselineId':manifest['baselineId'],'baselineFiles':len(original),'changedBaselineFiles':changed,'unexpectedAddedFiles':[p for p in added if not allowed(p)],'frozenFiles':len(frozen['files']),'changedFrozenFiles':bad_frozen,'realMainChangedSinceAcceptedBaseline':main_changed,'exception':'THIS-WORKSPACE.md由主控创建的本副本归属，不属于04交付'}
report['passed']=not(changed or report['unexpectedAddedFiles']or bad_frozen or main_changed)
(root/'docs/chapter2/fishing/scope-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False));raise SystemExit(0 if report['passed']else 1)
