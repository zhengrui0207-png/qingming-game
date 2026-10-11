# 04 实际验证与未覆盖

2026-10-02；在04独立工作副本执行，不在真实主工程写入钓鱼文件。

## 命令与结果

- `node --test src/chapter2/fishing/fishing.test.js`：21/21，见tests.log。注入真实03服务+正式01内容+02实测锚点，内存持久化/明确fixture只用于单元测试；不是正式整合。包含教学/工具/不足精力、普通/简易、取消、失焦/隐藏、重回调、防重复、保存失败/重试、演出抢占、固定木牌、珍稀保底、救急、同角色安全恢复、资源所有权。
- 全部20个测试文件用`node --test`执行：194/194，见all-tests.log。文件列表在日志的subtest中；包括第一关98项、契约/内容/场景/核心与新增钓鱼21项。完整可复现命令：`node --test $(rg --files src -g '*.test.js')`（当前源码路径无空格）。
- 内容/场景ready语义验证：通过，见dependency-validation.log；命令分别为`node scripts/validate-chapter2-contract.mjs content src/chapter2/content/content.json --ready`及对应scene anchors。
- esbuild实际打包index.js及CSS（write:false）：通过，无警告，见bundle-check.json；没有改变依赖或往真实main写bundle。
- `python3 docs/chapter2/fishing/audit-scope.py`：602个基线文件与21冻结文件均未改变，真实主工程也与已接收基线一致；无越界新增，见scope-audit.json。
- 本地服务：`npm run dev -- --port 5284 --strictPort`，dev-server.log；此入口仅DEV，不假称生产入口可玩。
- Playwright命令：`/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh --session=chapter2-fishing run-code <browser-01…06.js正文>`；脚本、结果均在本目录。脚本顺序依赖隔离DEV状态，单独重跑要使用新session参数并先免费借竿，不能清正式存档。
- 最终Console：0错误/0警告，见console.log；网络用`requests --static`，313行日志，所有已记录响应200/304，没有失败响应；见network-static.log。先前不适用的`network`CLI命令尝试保存在network-command-first-attempt.log，不算网络故障。

## 浏览器观察

Chrome154，macOS用户代理，viewport1200×792，设备像素比2，WebGL实际渲染上限1.5。截图是浏览器像素比输出，不能称为1080p性能验收。没有测正式多人场景P95或60fps达标，也未擅自压缩GLB宣称提帧。

37项去重后成功断言，0失败断言；一个真实标签失焦探针未覆盖，见browser-summary.json。截图11张：抛竿、咬钩、鱼获、收藏、杂物、珍稀、木牌、安全刷新、保存失败、普通模式鲤鱼、最终准备画面。

教学自然种子鱼约14.54秒；DEV种子杂物/珍稀约14.40秒；固定木牌约14.38秒；普通张力模式鲤鱼约14.39秒。以真实候鱼动画运行，无前端跳过计时；属于模块活动时间，不是主线墙钟或20分钟真人结论。

完成真实服务结算、自动登记收藏、连续多杆、正常鼠标收杆、普通模式真实空格按住/松开、漏过7秒咬钩不发物、保存失败无半奖、同候选重试只结算一次、Esc取消、DEV位置离开、DEV演出镜头抢占、native reload、同书生安全岸边、模块销毁及注销。真实浏览器刷新pagehide先取消；无pagehide的崩溃恢复由核心单元测试验证。

标签切换的自动浏览器没有变document.hidden/hasFocus，不能记为真实失焦通过。单独发送blur/focus事件的浏览器测试通过，隐藏帧/核心中断单元测试通过；实际切应用、最小化、系统失焦须主控真人设备复验。保留自动化失败尝试日志，不修改为成功：旧generic定位器未匹配canvas、标签未失焦、发送模拟blur后未对应focus。这些是测试驱动问题；最终脚本注明差异。早期证据owner为chapter2:fishing；最终已按P0统一c2/fishing，并由browser-06复验路由和释放。

## 尚未覆盖与发布条件

- 正式main的完整相机clone/yaw/pitch/distance/targetDistance/overview/focus恢复、真实09演出队列抢占及第一关运行时回归仍待00/10整合。已做的第一关测试与独立预览不能替代该项。
- 专用角色握杆/收线姿态、正式钓竿/浮子/所得GLB尚缺；目前真实旧书生+可动程序分件+所得几何替身。资产表现不能报ASSET_READY。
- 05真实商铺卖鱼/杂物、07三个书页入口与故事正文、06修缮、09演出尚未在本页整合；本页收藏是只读观察，不冒充完整风物志。核心对应行为已有第一批测试。
- Safari、移动触控、低配设备与长期自然掉落统计未测。20成功杆保底用真实服务单元测试，未跑20次浏览器真实时间；珍稀样本是明确DEV种子。
- 没有真人首次玩家试玩，也没有20分钟通关成绩或全关发布验收。

FISHING_READY仅指04可装配的独立玩法模块完成并通过真实核心/场景验证；INTEGRATION_READY、ASSET_READY和HUMAN_PLAYTEST_DONE仍false。上述资产与正式恢复验证完成前，不具备整关发布条件。
