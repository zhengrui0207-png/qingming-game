from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[3]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((root/'docs/chapter2/presentation/baseline-sha256.json').read_text())
changed=[p for p,h in baseline['files'].items() if not (root/p).is_file() or sha(root/p)!=h]
frozen=json.loads((root/'docs/chapter2/frozen-files.json').read_text())
frozen_changed=[r['path'] for r in frozen['files'] if sha(root/r['path'])!=r['sha256']]
new_outside=[]
for folder in ['src','docs/chapter2']:
 for p in (root/folder).rglob('*'):
  if not p.is_file():continue
  rel=p.relative_to(root).as_posix()
  if rel in baseline['files'] or rel.startswith(('src/chapter2/presentation/','docs/chapter2/presentation/')):continue
  new_outside.append(rel)
result={'baselineId':baseline['baseline'],'checkedBaselineFiles':len(baseline['files']),'changedReadOnlyFiles':changed,'frozenFilesChecked':len(frozen['files']),'changedFrozenFiles':frozen_changed,'newFilesOutsideAllowedSourcePaths':new_outside,'noGitInitialization':not (root/'.git').exists(),'packageFilesUnchanged':not any(p in changed for p in ['package.json','package-lock.json']),'pass':not(changed or frozen_changed or new_outside)}
(root/'docs/chapter2/presentation/scope-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));assert result['pass']
