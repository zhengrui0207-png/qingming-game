from pathlib import Path
import json,hashlib,shutil
from datetime import datetime,timezone
R=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game'); W=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区'); H=Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付')
bid='2026-10-01-core-ready-v1'; B=W/'baselines'/bid; now=datetime.now(timezone.utc).isoformat()
assert '# pass 173' in (R/'docs/chapter2/control/received-tests.log').read_text()
assert json.loads((R/'docs/chapter2/control/core-scene-content-preflight.json').read_text())['ok']
for x in ['content','scene']:assert json.loads((R/f'docs/chapter2/control/{x}-validation.log').read_text())['ok']
for dirname in ['04-fishing','05-commerce','06-repair','07-book','09-presentation']:assert not (W/dirname).exists(),str(W/dirname)
mp=json.loads((R/'docs/chapter2/workspace-map.json').read_text()); wave=[]
for num,name,folder,port,prompt in [('04','04-fishing','fishing',5284,'04_河边钓鱼.md'),('05','05-commerce','commerce',5285,'05_商铺补给与精力界面.md'),('06','06-repair','repair',5286,'06_亲手修缮与报酬.md'),('07','07-book','book',5287,'07_风物志与统一书页.md'),('09','09-presentation','presentation',5289,'09_演出环境声音与表现.md')]:
 prompts=list(Path('/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词').glob(num+'_*'))
 assert len(prompts)==1
 wave.append({'task':num,'name':name,'workspaceRoot':str(W/name/'qingming-game'),'promptPath':str(prompts[0]),'handoffRoot':str(H/name),'previewPort':port,'allowedWrites':[f'src/chapter2/{folder}/**',f'docs/chapter2/{folder}/**',f'chapter2-{folder}-preview.html'],'baselineId':bid,'contractVersion':'1.0.0','independentResources':True,'createdAtUTC':now})
mp.update(version=2,secondWaveCreated=True,secondWave=wave,secondWaveBaselineRoot=str(B/'qingming-game'))
(R/'docs/chapter2/workspace-map.json').write_text(json.dumps(mp,ensure_ascii=False,indent=2)+'\n')
st=json.loads((R/'docs/chapter2/status.json').read_text());st.update(CONTENT_READY=True,SCENE_READY=True,CORE_READY=True,ASSET_AUDIT_READY=True,ASSET_READY=False,INTEGRATION_READY=False,HUMAN_PLAYTEST_DONE=False,secondWaveBaselineId=bid,secondWaveCreated=True,secondWaveStarted=['04-fishing'],checkedAtUTC=now)
st['pending']=['08正式资产/专用动作','04钓鱼/05商铺/06修缮/07风物志/09演出','00/10运行时挂接与第一关回归','11技术验收和真人试玩']
st['acceptance']={'firstWaveReceivedFiles':123,'contentReadyValidation':True,'sceneReadyValidation':True,'allNodeTests':{'passed':173,'failed':0},'actualContentAndAnchorsWithRealCorePreflight':True,'mainBuildPassed':True,'actualWorldRuntimeAssembly':False,'assetScope':'审计与方案已接收，正式模型未就绪','reports':'docs/chapter2/control/'}
(R/'docs/chapter2/status.json').write_text(json.dumps(st,ensure_ascii=False,indent=2)+'\n')
with (R/'docs/chapter2/ownership.md').open('a') as f:
 f.write('\n## 第二批分配（2026-10-01接收后）\n\n主控已接收01内容、02实测灰盒、03真实核心和08资产审计；CORE_READY基线为 '+bid+'。ASSET_READY仍false，正式整合仍未完成。以下副本只读使用已接收服务/内容/锚点，不修改它们。主控继续唯一持有实际源码与公共状态。\n\n')
 for a in wave:f.write(f"- {a['name']}：{a['workspaceRoot']}；端口{a['previewPort']}；允许写入：{', '.join(a['allowedWrites'])}；交付：{a['handoffRoot']}。\n")
 f.write('\n04只注册自己两个钓点，02不重复注册钓点；只经唯一service结算与记录风物志。04可用独立预览的真实服务/场景适配，不修改main或原相机。开发用几何与专用握杆动作缺项必须如实列出。09已分配副本但未自动启动。所有支线从当前frozen-files清单验证只读依赖。\n')
# Controller metadata is deliberately updated; retain original 01 audit as historical evidence.
p=R/'src/chapter2/content/content.test.js'; s=p.read_text().replace("const manifest=read('docs/chapter2/content/p0-input-audit.json');for(const f of manifest.frozenFiles)","const manifest=read('docs/chapter2/frozen-files.json');for(const f of manifest.files)")
s=s.replace("frozen P0 files remained unchanged during 01 content work","received modules respect the current controller frozen manifest")
p.write_text(s)
fr=json.loads((R/'docs/chapter2/frozen-files.json').read_text());fr['baselineId']=bid;fr['capturedAtUTC']=now
for f in fr['files']:
 p=R/f['path']; f['bytes']=p.stat().st_size;f['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
(R/'docs/chapter2/frozen-files.json').write_text(json.dumps(fr,ensure_ascii=False,indent=2)+'\n')
ignore=shutil.ignore_patterns('node_modules','output','dist*','revisions','scholar-viewer','.env*','.git','.playwright-cli','__pycache__')
B.mkdir(parents=True,exist_ok=False);shutil.copytree(R,B/'qingming-game',ignore=ignore)
files=[]
for p in sorted((B/'qingming-game').rglob('*')):
 if p.is_file():files.append({'path':str(p.relative_to(B/'qingming-game')),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
(B/'manifest.json').write_text(json.dumps({'baselineId':bid,'sourceRoot':str(R),'snapshotRoot':str(B/'qingming-game'),'capturedAtUTC':now,'files':files},ensure_ascii=False,indent=2)+'\n')
for a in wave:
 dst=Path(a['workspaceRoot']);dst.parent.mkdir(parents=True);shutil.copytree(B/'qingming-game',dst);shutil.copytree(R/'node_modules',dst/'node_modules',symlinks=True)
 allowed='、'.join(a['allowedWrites']);(dst/'docs/chapter2/THIS-WORKSPACE.md').write_text(f"# 本副本归属：{a['name']}\n\n副本：{dst}\n\n真实主工程只读：{R}\n\n交付：{a['handoffRoot']}\n\n基线：{bid}；契约1.0.0；CONTENT_READY/SCENE_READY/CORE_READY已由主控接收，正式资产/整合未ready。\n\n允许写入：{allowed}\n\n预览：npm run dev -- --port {a['previewPort']} --strictPort。不改main/服务/契约/公共progress/旧移动相机/依赖清单；不用其他副本写入。\n")
 hand=Path(a['handoffRoot']);hand.mkdir(parents=True,exist_ok=True);(hand/'README.md').write_text(f"# {a['name']} 交付目录\n\n副本：{dst}\n基线：{bid}；契约1.0.0；预览端口{a['previewPort']}。\n\n尚未交付该玩法；请交handoff.md、files.json、files/、实际验证/截图/未覆盖项。\n")
report={'baselineId':bid,'accepted':st['acceptance'],'secondWave':wave,'snapshotFiles':len(files),'INTEGRATION_READY':False,'ASSET_READY':False}
(R/'docs/chapter2/control/second-wave-created.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
ctrl=H/'00-control'/'second-wave';ctrl.mkdir(parents=True,exist_ok=True)
(ctrl/'handoff.md').write_text('# 第一批接收与第二批副本\n\n已按交付清单校验并增量接收123文件。内容/场景ready校验通过，173节点测试通过，真实核心搭配正式内容/实测锚点预检通过，原入口构建成功（既有>500KB警告）。\n\n公共CONTENT_READY/SCENE_READY/CORE_READY已接收；ASSET_AUDIT_READY=true，但ASSET_READY=false。未挂接第二关正式入口、未发布、未真人试玩。\n\n第二批04/05/06/07/09的路径和边界见workspace-map.json；04继续当前钓鱼任务，其他任务没有自动启动。独立副本包含真实服务、正式内容与场景；不再用P0空草稿起步。\n\n主控只调整接收后内容测试的冻结清单读取，使它按当前冻结metadata核对；原01审计证据不改。三个状态/存档文件原版及公共metadata已留增量恢复备份。主控详细验证和前置记录见真实工程docs/chapter2/control/。\n')
for name in ['status.json','workspace-map.json','ownership.md','frozen-files.json']:shutil.copy2(R/'docs/chapter2'/name,ctrl/name)
print(json.dumps({'baselineId':bid,'snapshotFiles':len(files),'secondWave':[a['workspaceRoot'] for a in wave]},ensure_ascii=False))
