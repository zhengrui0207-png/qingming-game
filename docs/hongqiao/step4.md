# 虹桥 Step 4：权限、拾取、见闻与整体存档

2026-09-15。状态：Step 4 实现与本轮开发自测通过，等待下一步指令。浏览器验证记录见下方；不包含 Step 5 正式 NPC 对白/交付结算，不代表整关或真人试玩验收。

## 工程与挂接边界

真实工程：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。读取方案 v1.3、完整剧情稿、故事集 v1.1、现有 README 和源码。该工程及相关父目录未找到 AGENTS.md，遵循本任务提供的约束。资料目录旧 Step 0 记录中的“未找到源码”已经不适用于本次定位结果。

资料目录有 Git（起始 HEAD 19e8af0），既有改动全部保留。真实游戏工程没有 `.git`，`git status` 不能执行；未擅自初始化/搬迁工程。修改前副本和哈希在 `revisions/hongqiao-step4-before/`，本步交付补丁另存于资料仓库。补丁提交是交付快照，不声称实际游戏目录已受 Git 管理。

本次只修改两个既有文件：

- `src/main.js`：导入/初始化 progress runtime，在现有 E 入口登船分支之后调用拾取；沿用唯一交互按钮显示取物文案；见闻打开/关闭保留并恢复原暂停状态。没有改动 updateActor、updateCamera、键位、速度或相机参数。
- `src/hongqiao/debug.js`：测量模式接受 renderItems=false，避免调试预览再生成另一套可见任务道具。

新增模块：

- `src/hongqiao/state.js`：默认状态、schema 迁移/归一化、许可/拾取/段落阅读的纯函数与 ready 派生。
- `src/hongqiao/persistence.js`：完整快照存取、备份恢复、损坏记录、保存失败与重试、一次性开发 URL 清档。
- `src/hongqiao/collectibles.js`：现有三件 GLB、即时占位、可达性筛选、拾取隐藏与异步回调复查。
- `src/hongqiao/progress-ui.js`、`progress-ui.css`：数量背包、独立图鉴、故事锁定/阅读/来源、开发授权面板。
- `src/hongqiao/runtime.js`：上述模块的工程适配。
- `src/hongqiao/state.test.js`：18 项逻辑/存档/异步模型测试。

复用 `src/hongqiao/config.json` 的稳定 ID、人物、物品、锚点、来源与四篇全文。本任务没有写该配置；期间检测到另一个工作将其从 38,302 字节更新为 46,072 字节，增加货堆等配置，三物坐标和 ID 保持一致。最终校验使用更新后的真实配置；不将其算作本步成果。`src/world.js`、`src/scholar.js`、`src/storefronts.js`、`package.json`、`index.html` 的哈希与修改前一致。

Step 3 统一交互/对话模块在本工程尚未找到。本步只做现有入口的局部适配，不能将其写成 Step 3 全量验收。正式 NPC 接线仍需下一步处理。

## 状态与接线契约

主键 `qingming:hongqiao:save` 保存 schemaVersion=2 的整体 JSON：

- inventory：itemId → 非负整数持有数量。
- unlockedCodexIds：独立保存物品、人物简介和文化条目 ID，数量为零也不删除。
- permissions：取用许可 ID 集合，不等同拾取。
- worldState.collectedInstanceIds：已拾取场景实例集合。
- quests：任务对象；active + 三物数量派生 ready，不另存 3/3 计数。
- unlockedStoryIds、readStoryIds、storyReadingProgress、readContentVersions：全文权限、已读历史、小节 ID/段落序号/正文版本、已读版本分别保存。正文版本为 2。

拾取先检查许可和实例，计算完整新状态，通知世界层隐藏实例，再保存并读回比对，最后发 UI 更新。重复调用不加数量、不再发奖励。拾取只登记物品与借物人的简介；只有 completed 快照可开放四篇全文。已读只在末节末段实际进入阅读区域时写入，打开即关闭不算读完。滚动采用短防抖，并在关闭、失焦、visibilitychange/pagehide 时补存。

新增 key `qingming:hongqiao:save:backup` 保存上一次已验证的整体快照，`...:corrupt` 保留最近一次损坏输入。主档异常时恢复备份并修复主档；备份是上一版，因此可能回退最近一次操作，界面会明确提示。两份都坏时保留损坏数据、以默认内存状态运行并提示未保存，不伪装成恢复成功。

支持缺省字段与 v1 样本迁移（数组背包、顶层 collectedInstanceIds、questStatus）。已完成旧档补齐四篇解锁；旧已读保留，正文版本不符只重置该篇偏移。未完成旧档不因拾取而开放全文。未知非法结构/数量/版本拒绝直接使用并尝试备份。存储不可用、配额异常或读回不一致时，内存事务保留，UI 明示保存失败并提供重试。

开发清档 URL 为 `?test&hqReset=1`：仅 DEV + test 下删除上述三个精确 key，先移除 hqReset 再清档；保留其他参数/片段，不调用 localStorage.clear。生产环境不会执行清档。测试使用独立 5180 origin 的浏览器会话。

## 使用与下一步接口

实际命令 `npm run dev`。5178、5179 已占用，Vite 自动运行于 `http://127.0.0.1:5180/`。开发面板入口：`http://127.0.0.1:5180/?test`，点击“入画游览”，展开左上 Step 4 面板，模拟 NPC 授权，明确确认后再走近物品按 E。I 未被原工程占用，本步用于见闻/行囊，F 历史阅读和 E 上下船保留。

三物位置沿用配置：缆绳 (13, 0.94, 19)，竹篙 (29, 0.94, 19)，护货布 (-7, 0.94, 52.5)。已有 GLB 均使用；不调用 Tripo，不生成或替换书生模型。

Step 5 可通过 runtime.store.dispatch({type:'grantPermission', permissionId}) 接显式确认；取消不调用。正式交付命令须在同一个 store 增加纯状态事务，不能把 restoreFixture 当成结算接口。restoreFixture 仅在 DEV + test 的 window.__hqProgress 下暴露，用于本步已接/已交付样本验证。

## 实际验证

测试原始脚本、返回状态及截图均在 `output/playwright/step4/`。使用真实 Chrome 与本地游戏，位置切换采用工程既有 DEV setActor，实际拾取采用 E、授权采用按钮。不是真人首次游玩，也不是全线路径步行。

- 状态测试：`node --test src/hongqiao/state.test.js`，18/18 通过。包含六种顺序、重复调用、授权与收集分离、逐次重新构造 store、事务顺序、交付样本、四篇阅读位置、版本迁移、两级损坏、失败与静默丢写、清档边界、模型晚到和失败、交互距离/层级。
- 既有回归：`npm test`，原有 11/11 世界/航行测试通过。
- 配置校验：`node scripts/validate-hongqiao.mjs` 通过。
- 生产构建：`npm run build` 通过；仍有主包超过 500 kB 的 Vite 提醒，不在本步顺手重构。
- `auth-refresh-result.txt`：未授权 E 不取物；取消不授权；三次确认只得到许可；刷新前后完整状态严格一致；URL 清档参数已移除；无关存储仍在。
- `pickup-refresh-result.txt`：实际 E 拾取缆绳；按住/重复 E 和重复 dispatch 只计一次；I 开关及恢复；图鉴出现简介，四篇全文仍锁定；部分收集刷新一致。
- `ready-stories-result.txt`：E 拾取其余两件，ready 样本刷新一致，三实例都不复活；已交付样本背包归零但图鉴六条保留；四篇一起开放；阅读中段位置刷新恢复，最后一段才已读且只影响对应一篇；阅读不改变相机角度。
- `late-and-failure-result.txt`：Playwright 拦住缆绳 GLB，先 E 拾取后才放行，晚到模型被丢弃；中断护货布 GLB 后仍可取占位物；注入 QuotaExceededError 时保留数量并隐藏实例，显示失败提示；恢复写入、点重试并真实刷新，状态严格一致。

- `corrupt-recovery-result.txt`：损坏主档恢复完整备份；修复后再次刷新一致；两份都损坏时不虚报保存、不覆盖损坏主档、无关数据保留。
- `regression-result.txt`：实际 W 移动和鼠标拖动；见闻屏蔽 W/V/E；操作指南与见闻嵌套保留暂停；旧地标自动卡片及 F 阅读、嵌套恢复、E 上下船通过。
- `ordinary-page-result.txt`：不带 test 的普通页面不暴露开发 API/面板，不执行清档，移除残留 reset 参数且保持原存档，普通 I/见闻可用。
- 正常运行 `normal-console.txt`：0 errors、0 warnings；最终普通页面监听：pageerror 0、console warning/error 0、失败请求 0；三件 GLB 均 HTTP 200。故障组主动中断护货布产生 net::ERR_FAILED/占位警告，主动配额错误和损坏 JSON 产生被记录的错误，随后恢复；不将故障注入期写成零错误。
- 浏览器环境：macOS Chrome 152，视口 1200×792，DPR 2；本工程原渲染器将像素比上限设为 1，未改。未做全关性能验收。

交付快照包括源码统一补丁、修改前后哈希、存档样本和七组浏览器结构化结果；补丁已在修改前副本上通过 git apply --check。移动/相机两个函数全文与副本逐字一致。

## 未覆盖范围

正式 NPC 对话、正式交付结算、动画/过桥、完整 Step 3 焦点与输入锁体系、四篇全文逐篇视觉校对、移动端/Safari、跨标签并发存档、真人首次 20 分钟体验及全场景美术验收。本步未发布、未铺全图、未推进 Step 5。书生、NPC 与开场资产验收沿用其他任务，不在本步重做。

最终检查发现另一个工作在 01:08:35 修改了 `src/hongqiao/debug.js` 的测量标签尺寸并补充物品标签；本步跳过重复 GLB 的接口仍被保留。未覆盖该改动，已在 step4-integrity.json 单列快照后变化。本轮浏览器验证使用普通页面及 test 模式，不包含此后的 hongqiao 测量标签视觉验证。
