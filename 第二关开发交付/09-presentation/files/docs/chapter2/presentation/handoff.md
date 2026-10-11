# 09 演出、音效与表现交付

2026-10-05｜契约1.0.0｜09唯一副本基线2026-10-01-core-ready-v1。

**PRESENTATION_READY：独立模块已就绪。** 12秒入区、16秒结局的六镜头可运行，保留01正式对白；直接读取真实03核心、正式内容和实测D锚点。主控公共status未改。这里的ready只指09独立模块，不指正式人物资产、真实main装配或真人验收；四位NPC和运输架手部关键帧是明确程序化原型。

## 可审查交付

- `files/` 按原相对路径保存本次源码、8个真实PCM音效文件、文档、检查脚本、日志、截图和短视频。`files.json` 给相对路径、baseSHA256（新文件为null）、新SHA256、大小与类型；`source.patch`为新增文本源码/文档的统一补丁，二进制资源按清单复制。
- `src/chapter2/presentation/index.js` 为生产可导入入口；timeline/controller/staging/audio/feedback 分别负责取样、借镜头与ack、局部动作与恢复、声音混音、保存成功反馈。不复制03 reducer，不写钱包或另建经济存档。
- `shots.md` 每镜头有精确时间、景别、机位/看向/FOV、动作、原文字幕、声效与切点。`integration.md` 列主控完整挂接与错误/恢复约定。`sound-manifest.json` 及 `sound-source-audit.json` 保存来源、授权范围、音量、SHA；无云采购，无把第一关旁白重用为本关NPC台词。
- `ready.json`、`verification.md` 为就绪范围/实际验证/未覆盖项；`output/playwright` 有6张逐镜截图、异常恢复截图和实际录屏。

## 实测结果

全部213项Node测试通过：基线173项＋09新增40项，0失败。真实浏览器117/117断言通过，覆盖镜头切点及任意取样时刻略过、两条核心报酬路线、4次反复回顾、真实失焦/刷新、存档失败同ID重试、开书、抢占、静音、资源404、双dispose、按钮焦点下Esc、窗口变化和退出后的原移动实走。

11个效果文件在浏览器实际HTTP加载/decode并通过同一主控音频通道输出，逐个有analyser记录；缺舌铜铃不响。12份声音来源SHA均一致。实际电影录屏约28秒，VP9 1280×800＋Opus 48kHz双声道；由真实画布24fps＋同一master采集，未拼入外部/伪造声轨。视频不含HTML字幕层，字幕以真实逐镜截图核验。

真阿青40骨骼、cart__wheel0/cart__wheel1实际分件已参与镜头；握绳段实测手绳距离<0.001米，结局松手后保留自然距离。六镜头截图检查后修正了杂货铺墙面遮挡和茶盏被手臂覆盖的机位；片末只收束到D区exit[-78,.94,-43]，不扩建E区。

最新普通加载控制台0错误/0警告；资源404故意故障单独记录。215份只读依赖基线、21份冻结文件哈希全部一致。main、契约、真实服务、第一关移动/相机/地标、公共progress、依赖清单均未改；无Git初始化或worktree。没有整目录覆盖、清正式档、写其它副本或发布线上。

## 预览与实际命令

在09工作副本运行：

```sh
npm run dev -- --port 5289 --strictPort
node --test src/chapter2/presentation/presentation.test.js src/chapter2/presentation/audio.test.js
node src/chapter2/presentation/build-preview.mjs
python3 docs/chapter2/presentation/audit-scope.py
```

预览：`http://127.0.0.1:5289/chapter2-presentation-preview.html?test&chapter2&session=presentation09`。完整全量测试及浏览器重跑命令见verification.md；隔离键 `qingming:dev:chapter2:presentation09`，照片/视频准备按钮用明确DEV手工已通关fixture，再按真实服务完成任务，不是真人流程。09预览origin正式键从不存在到仍不存在；未写其他origin的个人游戏存档。

## 主控接收与未覆盖

主控接入src/chapter2/presentation/**，读integration.md后在自己拥有的main中提供原P0相机、语义输入、演员mixer暂停及已有音频master/静音适配；只向同一核心发一份tick。任务先结算、演出后只ack；回顾无核心动作。04浮子下沉/收线、05交易/补给和06试拉绳选择一个声音所有者，不重复播放。正式07书本由ports.openBook接入，不用验收页书本替代。

未覆盖：08四位NPC真实骨架/服装/专用动作与04握杆；正式城门外观；实际main入口/第一关电影回归及全模块锁和音频协作；正式资产替换后的遮挡与手部；移动端/参考设备性能；真人听感与首次通关时长。主控完成这些挂接和复测后自行更新公共PRESENTATION_READY/INTEGRATION_READY。不会因打开第一关入口而宣布第二关可玩。
