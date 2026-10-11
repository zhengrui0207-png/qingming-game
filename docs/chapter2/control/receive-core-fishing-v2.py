from pathlib import Path
from datetime import datetime,timezone
import hashlib,json,shutil
R=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game');S=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图');D=S/'第二关开发交付';W=S/'第二关开发工作区'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()if p.is_file()else None
changes=[];audit=[]
for task in ['03-core','04-fishing']:
 m=json.loads((D/task/'files.json').read_text())
 for f in m['files']:
  rel=f['path'];p=Path(rel);assert not p.is_absolute()and'..'not in p.parts
  if task=='04-fishing':assert rel=='chapter2-fishing-preview.html'or rel.startswith(('src/chapter2/fishing/','docs/chapter2/fishing/'))
  src=D/task/'files'/rel;dst=R/rel;wanted=f.get('newSHA256',f.get('sha256'));assert sha(src)==wanted,str(src)
  current=sha(dst);assert current in [None,f.get('baseSHA256'),wanted],f'conflict: {dst}'
  row={'task':task,'path':rel,'beforeSHA256':current,'newSHA256':wanted,'operation':'already-received'if current==wanted else'copy'};audit.append(row)
  if current!=wanted:changes.append((src,dst,row))
backup=W/'baselines/2026-10-02-before-control-acceptance-v2';backup.mkdir(parents=True,exist_ok=False)
for name in ['status.json','workspace-map.json','ownership.md','frozen-files.json']:
 src=R/'docs/chapter2'/name;dst=backup/'main/docs/chapter2'/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst)
for src,dst,row in changes:
 if dst.exists():
  old=backup/'main'/row['path'];old.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,old)
for src,dst,row in changes:
 dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);assert sha(dst)==row['newSHA256']
report={'clientDate':'2026-10-02','atUTC':datetime.now(timezone.utc).isoformat(),'authorization':'用户要求00/10合入复测并更新就绪后分配05、提供06分配','backup':str(backup),'verifiedCoreFiles':30,'receivedFishingFiles':len(changes),'files':audit,'verification':'pending','runtimeAssembly':False}
(R/'docs/chapter2/control/core-fishing-received-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'coreVerified':30,'fishingCopied':len(changes),'backup':str(backup)},ensure_ascii=False))
