"""P0-only verification. Run before branch development; never restore or overwrite files."""
from pathlib import Path
import json,hashlib,subprocess,sys
root=Path(__file__).resolve().parents[1]
mapping=json.loads((root/'docs/chapter2/workspace-map.json').read_text())
base=Path(mapping['baselineRoot']); manifest=json.loads((base.parent/'manifest.json').read_text())
frozen=json.loads((root/'docs/chapter2/frozen-files.json').read_text())
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
errors=[];checks=[]
for row in manifest['files']:
 for p,label in [(base/row['path'],'snapshot'),(root/row['path'],'original')]:
  if not p.exists() or sha(p)!=row['sha256']:errors.append(f'{label}: {row["path"]} changed/missing')
checks.append({'check':'baseline and original existing files','files':len(manifest['files'])})
for row in mapping['firstWave']:
 work=Path(row['workspaceRoot']); count=0
 for entry in manifest['files']+frozen['files']:
  p=work/entry['path']; original=root/entry['path']
  if not p.is_file() or p.is_symlink() or sha(p)!=entry['sha256']:errors.append(f'{row["name"]}: {entry["path"]} missing/shared/changed')
  elif original.exists() and p.stat().st_ino==original.stat().st_ino and p.stat().st_dev==original.stat().st_dev:errors.append(f'{row["name"]}: hard link to main {entry["path"]}')
  count+=1
 for p in (work/'public').rglob('*'):
  if p.is_symlink():errors.append(f'{row["name"]}: public symlink {p}')
 for name in ['vite','node','three']:
  if name=='node':continue
  p=work/'node_modules'/('vite/bin/vite.js' if name=='vite' else 'three/build/three.module.js')
  if not p.is_file():errors.append(f'{row["name"]}: missing dependency {name}')
 r=subprocess.run(['node','--test','src/chapter2/contracts/contract.test.js'],cwd=work,capture_output=True,text=True)
 log=Path(row['handoffRoot'])/'p0-contract-tests.log';log.write_text(r.stdout+r.stderr)
 if r.returncode:errors.append(f'{row["name"]}: contract tests failed')
 checks.append({'check':row['name'],'checkedFiles':count,'resourcesIndependent':True,'contractTestsExitCode':r.returncode,'log':str(log)})
report={'ok':not errors,'baselineId':manifest['baselineId'],'contractVersion':frozen['contractVersion'],'checks':checks,'errors':errors,'note':'P0 verification only. This script deliberately expects untouched copies; after branch work review files.json rather than rerun this baseline test.'}
(root/'docs/chapter2/ready-checks.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2));sys.exit(0 if report['ok'] else 1)
