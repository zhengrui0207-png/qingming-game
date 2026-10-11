from pathlib import Path
from datetime import datetime,timezone
import json,hashlib,shutil
R=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game');S=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图');W=S/'第二关开发工作区';H=S/'第二关开发交付';C=R/'docs/chapter2/control'
bid='2026-10-02-core-fishing-ready-v2';B=W/'baselines'/bid;backup=W/'baselines/2026-10-02-before-control-acceptance-v2';now=datetime.now(timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()if p.is_file()else None
assert '# pass 194' in(C/'accepted-v2-tests.log').read_text();assert 'built in' in(C/'accepted-v2-build.log').read_text()
for f in ['accepted-v2-browser.json','accepted-v2-commerce-service.json','accepted-v2-module-build.json']:assert json.loads((C/f).read_text())['ok']
old=json.loads((W/'baselines/2026-10-01-core-ready-v1/manifest.json').read_text());oldhash={f['path']:f['sha256']for f in old['files']}
mp=json.loads((R/'docs/chapter2/workspace-map.json').read_text());allocated=[]
for task in ['05','06']:
 a=next(a for a in mp['secondWave']if a['task']==task);root=Path(a['workspaceRoot']);changed=[p for p,h in oldhash.items()if sha(root/p)!=h];assert not changed,changed
 existing={str(p.relative_to(root))for p in root.rglob('*')if p.is_file()and'node_modules'not in p.parts};assert existing-set(oldhash)=={'docs/chapter2/THIS-WORKSPACE.md'},existing-set(oldhash)
 assert not (root/('src/chapter2/commerce'if task=='05'else'src/chapter2/repair')).exists(),'task already changed'
 a.update(baselineId=bid,previousBaselineId='2026-10-01-core-ready-v1',assigned=True,dependencyReady=True,assignedAtUTC=now,assignmentState='assigned; controller did not start task')
 allocated.append(a)
mp.update(version=3,currentBaselineId=bid,currentBaselineRoot=str(B/'qingming-game'));mp['secondWaveBaselineRoot']=str(B/'qingming-game');mp['baselineNote']='05/06已同步v2；04/07/09保留各自记录的v1，不覆盖其工作。契约与核心实现未改。'
(R/'docs/chapter2/workspace-map.json').write_text(json.dumps(mp,ensure_ascii=False,indent=2)+'\n')
st=json.loads((R/'docs/chapter2/status.json').read_text());st['p0Checks']=st.pop('checks',{});st['p0BaselineId']=st['baselineId'];st.update(clientDate='2026-10-02',baselineId=bid,secondWaveBaselineId=bid,checkedAtUTC=now,CORE_READY=True,FISHING_READY=True,COMMERCE_READY=False,REPAIR_READY=False,BOOK_READY=False,PRESENTATION_READY=False,ASSET_READY=False,INTEGRATION_READY=False,HUMAN_PLAYTEST_DONE=False)
st['checks']={'allNodeTests':{'passed':194,'failed':0},'contentReadyValidation':True,'sceneReadyValidation':True,'contractValidation':True,'mainBuildPassed':True,'mainBuildWarning':'既有包体大于500KB；不代表性能达标','fishingModuleBuildPassed':True,'browserMainRootFishingAssertions':6,'browserRealCoreSaleAssertions':3,'consoleErrors':0,'consoleWarnings':0,'formalSaveUnchanged':True}
st['pending']=['05商铺补给/06修缮/07风物志/09演出','08正式资产和专用握杆动作','00/10正式main运行时挂接、真实输入/相机/演出整合与第一关回归','11参考设备性能、真实失焦及2–3位首次玩家试玩']
st['playability']={'standaloneFishingPreview':True,'formalChapter2Main':False};st['readyScopes']={'CORE_READY':'03唯一共享服务已在真实主工程，30交付文件一致；主控本轮真实内容/锚点/交易/保存复测通过','FISHING_READY':'04独立玩法模块已接收并主工程复测；正式模型与main装配未完成'}
st['acceptance']['latest']={'atUTC':now,'verifiedCoreFiles':30,'receivedFishingFiles':50,'allNodeTests':{'passed':194,'failed':0},'mainRootBrowserChecks':9,'scope':'增量交付接收与独立DEV预览复测，不是整关正式运行时验收','reports':'docs/chapter2/control/accepted-v2-*'}
st['assignments']={a['name']:{'workspaceRoot':a['workspaceRoot'],'handoffRoot':a['handoffRoot'],'allowedWrites':a['allowedWrites'],'previewPort':a['previewPort'],'baselineId':bid,'dependencyReady':True,'startedByController':False}for a in allocated}
(R/'docs/chapter2/status.json').write_text(json.dumps(st,ensure_ascii=False,indent=2)+'\n')
with (R/'docs/chapter2/ownership.md').open('a')as f:
 f.write('\n## 05/06重确认分配（2026-10-02）\n\n03核心30交付文件已在真实工程；04钓鱼50文件已增量接收。主控复测194测试、构建和9浏览器断言通过，CORE_READY/FISHING_READY=true，仅模块就绪；整关main未装配。05/06以'+bid+'为新只读依赖基线；其他任务副本保留原版本。契约1.0.0与核心源码未更改。\n\n')
 for a in allocated:f.write(f"- {a['name']}：{a['workspaceRoot']}；写入{', '.join(a['allowedWrites'])}；端口{a['previewPort']}；交付{a['handoffRoot']}。\n")
 f.write('\n主控按清单更新05/06的只读依赖与归属metadata，不覆盖任务源码。写入权限仅上述范围，main、原移动相机、公共progress、核心、内容、锚点、冻结契约与依赖清单只读；真实状态以main docs/chapter2/status.json为准。\n')
p=R/'docs/chapter2/contracts.md';s=p.read_text();s=s.replace('2026-10-01｜真实源码', '> 以下是2026-10-01的P0接口冻结说明，包含当时未就绪的历史状态。2026-10-02当前依赖就绪与分配以status.json、workspace-map.json和ownership.md最新段落为准；接口版本仍1.0.0。\n\n2026-10-01｜真实源码',1);p.write_text(s)
fr=json.loads((R/'docs/chapter2/frozen-files.json').read_text());fr.update(baselineId=bid,capturedAtUTC=now)
for f in fr['files']:p=R/f['path'];f.update(bytes=p.stat().st_size,sha256=sha(p))
(R/'docs/chapter2/frozen-files.json').write_text(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
receipt=json.loads((C/'core-fishing-received-v2.json').read_text());receipt.update(verification='passed',acceptedAtUTC=now,allNodeTestsPassed=194,mainBuildPassed=True,browserMainRootAssertions=9);(C/'core-fishing-received-v2.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
# New immutable snapshot, with existing independent node_modules retained in 05/06.
ignore=shutil.ignore_patterns('node_modules','output','dist*','revisions','scholar-viewer','.env*','.git','.playwright-cli','__pycache__','*-dev-server.log')
B.mkdir(parents=True,exist_ok=False);shutil.copytree(R,B/'qingming-game',ignore=ignore)
files=[{'path':str(p.relative_to(B/'qingming-game')),'bytes':p.stat().st_size,'sha256':sha(p)}for p in sorted((B/'qingming-game').rglob('*'))if p.is_file()]
manifest={'baselineId':bid,'sourceRoot':str(R),'snapshotRoot':str(B/'qingming-game'),'capturedAtUTC':now,'files':files,'dependencyReady':{'CORE_READY':True,'FISHING_READY':True},'INTEGRATION_READY':False};(B/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
updates=[]
for a in allocated:
 root=Path(a['workspaceRoot']);changed=[]
 for f in files:
  src=B/'qingming-game'/f['path'];dst=root/f['path']
  if sha(dst)==f['sha256']:continue
  if dst.exists():
   assert sha(dst)==oldhash.get(f['path']),f"dependency changed: {dst}"
   bak=backup/a['name']/f['path'];bak.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(dst,bak)
  dst.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dst);assert sha(dst)==f['sha256'];changed.append(f['path'])
 own=root/'docs/chapter2/THIS-WORKSPACE.md';bak=backup/a['name']/'docs/chapter2/THIS-WORKSPACE.md';bak.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(own,bak)
 own.write_text(f"# 本副本归属：{a['name']}\n\n2026-10-02主控合入、复测后正式分配。\n\n唯一可写副本：{root}\n\n交付：{a['handoffRoot']}\n\n真实主工程只读：{R}\n\n基线：{bid}；契约1.0.0；CORE_READY与FISHING_READY已主控接收复测；正式模型与整关main未ready。\n\n允许写入：{'、'.join(a['allowedWrites'])}\n\n预览：npm run dev -- --port {a['previewPort']} --strictPort。node_modules已独立复制，无需重装。\n\n先读contracts.md、ownership.md、frozen-files.json、workspace-map.json；最新状态只读main docs/chapter2/status.json。main、核心、公共progress、内容、锚点、原移动/相机、契约与依赖清单只读。历史04 scope-audit脚本只用于04旧基线，不用它判断本副本；本基线校验以对应manifest.json与冻结清单为准。\n")
 assert all(sha(root/f['path'])==f['sha256']for f in files)
 assert all(sha(root/f['path'])==f['sha256']for f in fr['files'])
 updates.append({'task':a['name'],'changedDependencyFiles':changed,'baselineFilesVerified':len(files),'frozenFilesVerified':len(fr['files']),'ownTaskFilesOverwritten':0})
report={'clientDate':'2026-10-02','atUTC':now,'baselineId':bid,'contractVersion':'1.0.0','allocated':allocated,'updates':updates,'noWholeDirectoryOverwrite':True,'INTEGRATION_READY':False};(C/'allocations-05-06-v2.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
ctrl=H/'00-control/acceptance-v2';ctrl.mkdir(parents=True,exist_ok=True)
for name in ['status.json','workspace-map.json','ownership.md','frozen-files.json']:shutil.copy2(R/'docs/chapter2'/name,ctrl/name)
for name in ['core-fishing-received-v2.json','allocations-05-06-v2.json']:shutil.copy2(C/name,ctrl/name)
for a in allocated:
 prompt=Path(a['promptPath']);s=prompt.read_text().replace('【第二批工作分配｜CORE_READY基线 2026-10-01-core-ready-v1｜契约1.0.0】','【主控复测后正式分配｜2026-10-02｜基线 '+bid+'｜契约1.0.0】');s=s.replace('副本已包含接收后的正式内容、实测锚点和真实CORE_READY服务；','主控已合入03核心与04钓鱼，194项测试及主工程浏览器复测通过。副本已增量同步'+bid+'，包含正式内容、实测锚点、真实CORE_READY服务和FISHING_READY模块；');prompt.write_text(s)
 # Allocation notes are separate from future task delivery manifests.
for a in allocated:shutil.copy2(Path(a['workspaceRoot'])/'docs/chapter2/THIS-WORKSPACE.md',Path(a['handoffRoot'])/'assignment.md')
print(json.dumps({'baselineId':bid,'snapshotFiles':len(files),'updates':[{'task':u['task'],'changedDependencies':len(u['changedDependencyFiles'])}for u in updates]},ensure_ascii=False))
