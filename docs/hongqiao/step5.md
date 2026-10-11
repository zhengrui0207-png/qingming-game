# Step 5：正式剧情、并行目标与一次性交付

2026-09-15，代码及开发验证完成，等待用户验收；未发布，未进入 Step 6/7。此结论不等于真人试玩、首关 20 分钟验证或过桥视觉验收。

## 工程与挂接

真实源码：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。Three.js 0.180 / Vite 7.3.6，继续用 `npm run dev`；本轮因已有端口占用，Vite 自动使用 `http://127.0.0.1:5181/`。普通游览不带测试参数；`?test` 才提供样本和定位入口。没有生成模型或发起付费 API。

已阅读资料仓库中的 v1.3 执行方案、《虹桥急情》完整剧情稿 v1.0 和故事集 v1.1，检查真实文件、Git 状态与差异。源码目录没有 Git；资料仓库原有文稿改动和未跟踪资产全部保留。本步用资料仓库中的局部补丁、哈希和证据快照记录交付，不初始化或覆盖源码仓库。

开工后共享目录出现了 Step 3 的新统一交互实现。本步已适配该实现：`src/interaction/progress-adapter.js` 转发到正式 `hongqiao/runtime.js`；NPC、三物和可选文化点注册到现有 registry，沿用半径、同层、遮挡、可达性与焦点容差。输入使用既有 locks / gate / main capture 路由。`progress-book.js` 转发到唯一阅读器，不同时创建两本书册。旧基础测试对白仍可用。

`main.js` 只加运行时参数、剧情更新/启动、演出接口和 hqDialogue 的 E 路由；`updateActor` 与 `updateCamera` 函数逐字匹配合并基线。小舟原优先交互、F 地标阅读、既有碰撞与动作参数保留。并行 Step 2/3 的 world / motion / scholar / storefronts / collectibles 改动未混入本步补丁。

## 内容与状态

- `src/hongqiao/config.json` 已有的四篇 v1.1 全文继续作为唯一正文来源：老周 41 段、何伯 47 段、阿成 43 段、方娘子 35 段，共 166 段、每篇 3 小节。构建脚本逐段核对正文、小节标题及取材注，全部一致。contentVersion=2，人物创作与文化来源分区展示。阿成为曾在汴京食店做工的经历，没有改成首次进京。
- `scripts/build-hongqiao-narrative.py` / `narrative.json` 补足 HQ_00 九镜头的六列原稿（连续 30 秒）、HQ_42 四阶段、HQ_43 原文及完成卡、书生见闻、确认选项、回访引入句。`quest-config.js` / `config.js` 将 HQ_01、10、20、30、40、41、44 的正式原文与节点选择、效果接通；追问可返回，未接主任务亦可交谈授权。
- 老周 available → active/ready → completed；三位支线按 completed → collected → permitted → accepted → first。ready 由 accepted 与 requiredItems 各自数量派生，不存数组游标或独立 3/3 状态。
- 授权与拾取分离，取消无权限副作用。`completeQuest` 是唯一结算命令：再次校验 ready、各扣 1 件、写 completed、见闻、四故事 unlockedStoryIds 和 endingPending，在同一整体快照完成后通知 UI。重放 UI 事件和重复命令不再结算。背包为当前数量，图鉴及已收集实例保留。
- schemaVersion=2 整体快照继续使用原命名空间。旧 completed 自动补四故事及本关见闻，不重复扣物，不清空其他奖励。未通关旧拾取不能解锁全文。旧已读历史保留并提示故事更新；只丢弃版本失配的那篇阅读位置，其他篇的有效位置保留。
- 完成卡、I 键图鉴、NPC 回访使用同一个阅读器与位置状态；阅读到最后一段后才记录当前版本已读。
- 90 秒使用独立真实时间采样，不受移动用的物理 dt 上限影响；仅接受任务后的可操作时间计数，书册、菜单、对话、失焦暂停。提示不带惩罚；点击选定目标后才显示方向。

## 演出边界与 Step 7 接口

`window.__qingming.hongqiao.attach(adapter)` 接受 `applyState(state)`、`playIntro({config,state,finish,isCurrent})`、`playEnding(...)`、`cancel()`、`setPaused(boolean)`。只有新交付事务可以触发一次结尾入口；刷新旧 completed 只应用 passed，不重播、不重新奖励。结束/跳过回调幂等，释放本层输入锁。

本步未挂接真实演出 renderer。HQ_00 九镜头仅为完整配置及协议；HQ_42 显示明确的剧情体验版提示，提供收尾与故事入口。逻辑 shipState=passed 不表示画面中的船已经发生移动。完整开场、船路/降桅/抛绳/群演、镜头、音轨、真实模型终态留待 Step 7。原船与相机没有被本步移动或改写。

## 实际验证

1. `node --test src/hongqiao/state.test.js src/hongqiao/quest.test.js src/hongqiao/presentation.test.js src/world.test.js src/motion/*.test.js src/interaction/core.test.js`：59/59，通过。覆盖原物品存档、所有六顺序、计数与幂等、旧档阅读版本、失败保存、演出入口/过期回调/九个跳过检查点、移动及统一交互。
2. `npm run build`：成功。保留已有 >500 kB 包体提示；未为此改动工程结构。
3. Chrome 正式对白六种拾取顺序：何→成→方、何→方→成、成→何→方、成→方→何、方→何→成、方→成→何，全部通过。最后一组先集齐后接任务立即 ready。每一步授权与拾取均用真实 E/按钮；仅路线定位及起始样本使用 DEV 入口，不冒充手工走完全程。
4. 浏览器检查授权后、部分拾取、ready、completed/endingPending 的实际刷新；取消对白、追问返回、Esc、取消交付选项及按住 E 不结算；重复交付和 refreshUI 不改变奖励；交付三件为 0，图鉴与实例记录仍保留。
5. 完成卡 → 图鉴 → 老周回访共享同篇阅读位置；老周全文 41 段/3 节。中途关闭未标已读，到末段后已读为 v2，刷新仍保留。注入旧 completed 档，四篇补齐、无关道具 7 件及旧奖励保留；老周旧位置重置、何伯 v2 第 3 段位置保留，界面显示“故事已更新”。
6. 损坏主存档后真实刷新：恢复完整备份并保留损坏记录。注入 QuotaExceededError 后通过正式“交给您”交付：内存完整 completed、四故事已解锁，界面显示保存失败；恢复存储并点击重试，再刷新，扣物与奖励一致。这些不只是检查 setItem 被调用。
7. 浏览器图鉴/操作菜单/真实跨标签失焦暂停计数。阈值测试用 DEV 将计时推进至接近 90 秒，再由真实帧触发提示；记录为 90.9532 秒。未选择目标无方向，点击何伯后显示方向。本项是阈值与暂停逻辑测试，没有冒充连续 90 秒真人等候。
8. Step 7 模拟 adapter：九镜头配置传入，开场/结尾各调用一次；Esc 跳过、重复 finish、重复结算/事件不会再次结尾；终态 passed、输入锁释放。模拟回调不属于真实动画验证。
9. 故意延迟缆绳 GLB、阻断竹篙 GLB：两件均能授权后拾取占位物。缆绳晚到结果为 discarded-collected / visible=false；竹篙为 placeholder / visible=false。背包各 1，没有复活。
10. 复用 Step 3 的浏览器脚本在当前合并入口重测 28/28：基础对白 E 门闩/明确选项/取消，嵌套 I、关闭下层仍保留上层锁，实时 NPC 与焦点容差、层高过滤、旧虹桥自动卡片/F、失焦恢复、移动和相机拖动。另测上下船 E 恢复。该记录验证当前合并工程，不替代另一任务自己的最终签字。
11. 普通入口（不带 test）实际载入并截图；无 DEV 面板和 __hqProgress 调试入口。

证据目录：`output/playwright/step5/`。关键结构化证据为 routes-evidence.json、stories-and-faults-evidence.json、guidance-and-interface-evidence.json、late-assets-evidence.json、merged-step3-verification.json、normal-entry-evidence.json。截图包含完成卡、演出占位提示、故事更新、保存失败、主动导引及普通入口。

Console / Network：六路线正常流程 pageerror=0、失败请求=0；当前合并 Step 3 回归 Console/Network=0。损坏存档与保存失败测试各有 1 条预期错误；竹篙故障注入有 1 次 ERR_FAILED 与 1 条回退占位警告。正常入口日志另存 normal-console.json / normal-network.json，故障日志与通过结论分开。三物及原有模型正常加载均有 HTTP 200 响应记录。

实际失败也保留：初次并行接线缺少 npcPrototype/旧适配器不支持 update 导致启动错误，接入统一注册表后修复；Playwright CLI 会话回到空白页及等待超时，改用独立 Chrome 进程；一次测试误把 getWorld 的对象当数组，修正断言后完整重跑；headed 会话未真实失焦的测试不计通过，关闭焦点模拟的 headless 跨标签测试确认 document.hasFocus=false 后通过。没有把这些失败算成验收通过。

未覆盖：真人首玩耗时、手机触控/Safari、正式 NPC 外观差异、连续完整 90 秒无输入等待、真实开场/过桥演出/音频与相机恢复，以及全部装饰几何的遮挡。既有相机贴近屋檐的局部遮挡未顺手重写。

## 文件与记录

核心变更：`src/hongqiao/{config.js,quest-config.js,narrative.json,quest-logic.js,state.js,persistence.js,runtime.js,npcs.js,dialogue-ui.js,tracker.js,presentation.js,quest-ui.css,progress-ui.js,debug.js}`，`src/interaction/{progress-adapter.js,progress-book.js}`，`src/main.js`；测试 `quest.test.js`、`presentation.test.js`，文稿核对脚本 `scripts/build-hongqiao-narrative.py`。

资料仓库交付：`docs/hongqiao/step5.md`、`step5.patch`、`step5-file-hashes.json`、`step5-verification.json`、`step5-save-samples.json`、`step5-evidence/`。补丁以保留并行 Step 3 的合并基线为前提，使用前检查哈希；不整文件回退覆盖其他任务。相关提交见同目录 `step5-commit.md`。
