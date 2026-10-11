from pathlib import Path
import json,hashlib,shutil
from datetime import datetime,timezone
ROOT=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game')
DEL=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付')
WS=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区')
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None
batch=[]; errors=[]
for task in ['01-content','02-scene','03-core','08-assets']:
 manifest=json.loads((DEL/task/'files.json').read_text())
 for f in manifest['files']:
  rel=f['path']; src=DEL/task/'files'/rel; dst=ROOT/rel
  if '..' in Path(rel).parts or Path(rel).is_absolute(): errors.append('invalid path '+rel);continue
  expected=f.get('newSHA256',f.get('sha256')); base=f.get('baseSHA256')
  if sha(src)!=expected: errors.append('delivery hash '+str(src))
  old=sha(dst)
  if old is not None and old not in [base,expected]:errors.append('target changed '+str(dst))
  batch.append({'task':task,'path':rel,'beforeSHA256':old,'newSHA256':expected,'source':str(src)})
if errors:raise RuntimeError(json.dumps(errors,ensure_ascii=False))
backup=WS/'baselines'/'2026-10-01-first-wave-before-merge'
backup.mkdir(parents=True,exist_ok=False)
for f in batch:
 p=ROOT/f['path']
 if p.exists():
  t=backup/f['path'];t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,t)
for name in ['status.json','workspace-map.json','ownership.md','frozen-files.json']:
 p=ROOT/'docs/chapter2'/name;t=backup/'docs/chapter2'/name;t.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,t)
(backup/'merge-manifest.json').write_text(json.dumps(batch,ensure_ascii=False,indent=2)+'\n')
for f in batch:
 dst=ROOT/f['path'];dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f['source'],dst)
 assert sha(dst)==f['newSHA256']
(ROOT/'docs/chapter2/control/first-wave-received.json').write_text(json.dumps({'atUTC':datetime.now(timezone.utc).isoformat(),'authorization':'2026-10-01 user: 第一批已制作完成，接收，并创建第二批的副本','backup':str(backup),'files':batch,'status':'received; verification pending'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'copied':len(batch),'backup':str(backup)},ensure_ascii=False))
