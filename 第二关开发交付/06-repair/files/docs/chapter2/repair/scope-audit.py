from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[3]
base=root.parent.parent/'baselines/2026-10-02-core-fishing-ready-v2'
manifest=json.loads((base/'manifest.json').read_text())
allowed=lambda p:p.startswith(('src/chapter2/repair/','docs/chapter2/repair/')) or p=='chapter2-repair-preview.html'
# Allocator metadata is separately verified by the local frozen list; THIS-WORKSPACE is task-specific.
metadata={'docs/chapter2/THIS-WORKSPACE.md','docs/chapter2/status.json','docs/chapter2/frozen-files.json','docs/chapter2/ownership.md','docs/chapter2/workspace-map.json'}
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
checked=[];mismatches=[]
for row in manifest['files']:
 p=row['path']
 if allowed(p) or p in metadata:continue
 if not (root/p).is_file() or sha(root/p)!=row['sha256']:mismatches.append(p)
 checked.append(p)
f=json.loads((root/'docs/chapter2/frozen-files.json').read_text())
frozen=[r['path'] for r in f['files'] if sha(root/r['path'])!=r['sha256']]
known={r['path'] for r in manifest['files']}
extra=[]
for folder in ['src','public','docs','scripts']:
 for p in (root/folder).rglob('*'):
  if p.is_file():
   rel=str(p.relative_to(root))
   if rel not in known and rel not in metadata and not allowed(rel):extra.append(rel)
report={'baselineId':manifest['baselineId'],'baselineManifestSHA256':sha(base/'manifest.json'),'checkedBaselineFiles':len(checked),'outOfScopeBaselineChanges':mismatches,'frozenFilesChecked':len(f['files']),'frozenMismatches':frozen,'newOutOfScopeFiles':extra,'allocatorMetadataExclusions':sorted(metadata),'nodeModulesAndBuildCachesExcluded':True}
(root/'docs/chapter2/repair/scope-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False))
assert not mismatches and not frozen and not extra
