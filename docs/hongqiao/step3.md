> 2026-09-15 最新状态：当前合并版本已完成复验，64 项自动测试、48 项浏览器检查通过，源码前后哈希一致。详见 [step3-recheck.md](step3-recheck.md)。下文保留前次并行写入期间的历史记录，旧“待协调”结论已被本次复验替代。

# Step 3：统一交互与基础对话（最终验收待并行写入协调）

本任务范围：最小测试内容、统一地标/NPC/物品接口、输入锁。未生成模型，未发布。

**当前不能标记 Step 3 最终通过。** 在 28 项浏览器主流程通过之后，另一个任务把 `src/interaction/progress-adapter.js` 覆盖为 Step 5 转发入口，并再次修改 main 的参数与按键路由。现存工程已经不是上述测试时的纯 Step 3 入口。已停止争写共享源码，并请用户协调暂停另一任务或明确合并验收范围。浏览器证据仍有效描述当时版本，但不代表当前合并版本通过。

## 真实入口与复现

工程 `/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`，Vite + Three.js。启动 `npm run dev -- --port 5179 --strictPort`；普通入口 `http://127.0.0.1:5179/`，最小测试内容 `http://127.0.0.1:5179/?test&interactionTest`。5178 原由旧 dist 服务使用，本步没有覆盖它。

查看了 v1.3 的 Step 3 条目和既有剧情/配置；遵守单步要求，剧情留到 Step 5。工程无 Git，无法提供提交号；开始前保存 `revisions/hongqiao-step3-before/`，最终差异和哈希另附。

## 挂接和前后变化

- `src/main.js`：保留 updateActor、updateCamera、移动数值、划船/上下船逻辑；原 E 的物品分支与 HUD 物品提示改为共享注册器。小舟保留原优先入口。唯一屏幕 E 操作条仍是 `#interaction`。
- `src/interaction/core.js`：注册、查询/执行、连续线段遮挡、焦点容差、键门闩、令牌锁、数据对话会话。
- `src/storefronts.js`：88 个旧历史站点经注册器的 automatic 适配取回；仍使用原 nearestHistorySite、建筑轮廓距离和 .65 容差。靠近自动卡片及 F 阅读未改成 E。
- `src/hongqiao/collectibles.js`：暴露已有实体；旧 focus API 仍保留，查询委托同一规则。取用权限和 collect 仍使用既有存储，不另建存档。
- `src/interaction/progress-adapter.js`、`progress-book.js`：Step 4 基础物品/书册适配，去掉书册独立抢占键盘的监听，由 main 的统一输入路由负责。
- `src/interaction/dialogue.js/css`：基础对话显示、逐字/全文、多句、明确按钮与 completed/cancelled 结果。
- `src/interaction/fixtures.js`：仅 DEV 且 interactionTest 时用既有 NPC 原型创建两位街坊；测试确认只增加内存计数。普通游览不出现测试人物，不接正式 NPC 个案剧情。

并行变更：本步期间另一个任务同时新增 Step 5 `hongqiao/runtime.js`、npcs/dialogue-ui/narrative/presentation/tracker 等，并在 main 增加启动/更新钩子。一度导致缺少 npcPrototype 及 update 函数的启动错误。未删除或覆盖这些剧情文件；测试通过时 main 使用 Step 3 专属基础适配器，未来剧情钩子改成可选调用；随后适配器又被另一任务覆盖为正式 runtime 转发，当前已接入对方 Step 5。Step 5 的整体接线和验收不计本报告范围。`progress-book.js` 是开始时基础书册的隔离适配副本；当前转发入口不再使用它。合并验收时须确认不会同时创建两套书册/键盘监听。

## 接口和输入约定

Interactable：`id` 唯一稳定字符串，`type` 分类，`entity` 或 `anchor` 或实时 `getPosition()`，`radius`，`enabled` 布尔/函数，`layer` 字符串/函数，`action()`，`label`，`trigger` 默认 E。实体使用 getWorldPosition，不缓存出生点。automatic 地标只参与旧适配，不抢 E 焦点。

默认半径 1.8、高差 .8、切换容差 .22；已有物品保留半径 2、高差 .7。候选须同层、walk、有地面可达路径，且真实障碍 AABB 连续线段不遮挡。桥上/下明确分层；原移动求解只作可达性探测，不移动玩家。尚无碰撞体的纯装饰几何不作为交互遮挡，正式场景新增障碍须登记 world.colliders。

Dialogue：`id/start/nodes[]`；node 含 `id/speaker/text/next/options[]`；option 含 `id/text/condition/effects[]/next`。条件与效果由注入处理器解释，不按 NPC 名称分支。未知条件默认拒绝。E 先显示全文，再继续到下一句；选项页 E 不选择，明确点击才执行 effects。Esc 只 cancelled，无任务副作用。无选项终点读完是 completed，不隐式执行授权/交付。

统一 capture 路由记录 keydown/keyup，repeat 和未释放的同键不得重复动作；打开对话时该 E 仍为按下状态，选项按钮等释放后可用。失焦/visibilitychange 清空门闩与移动按键。I 可在对话/历史阅读上打开书册；Esc 只关闭栈顶。每层持有独立幂等 release，关闭下层不会释放上层。锁期间鼠标环顾、移动、俯瞰、缩放、回出生点被阻止；解锁后沿用原数值。

## 验证结果

以 `output/playwright/hongqiao-step3/` 中最终 JSON、截图和测试输出为准。浏览器脚本用独立 Chrome 上下文，不清除用户存档。调试定位仅设置测试起点，交互通过真实浏览器按键/点击完成。设备分辨率和 DPR、Console/Network、各断言记录在 JSON 中。

自动化不等于真人试玩或用户验收。未覆盖移动端触控、多浏览器、完整剧情流程、尚无碰撞体的所有装饰遮挡；未对另一个任务正在写入的 Step 5 代码给出验收结论。

已完成的浏览器主流程：28/28；Console error 0、失败请求/HTTP 错误 0。Chrome 152 headless，MacIntel，1280×800、DPR 1。真实跨标签失焦 document.hasFocus=false 后回到页面验证，E 状态清理和 Esc 恢复通过。截图 01–05 记录焦点、选项、嵌套返回、旧历史阅读与恢复。最终采样 15 FPS、533 draw calls、5,085,631 三角面，仅是本机自动化当时的瞬时值，不作性能提升结论。

原 updateActor 与 updateCamera 函数字符串与开始前备份完全一致（仅外围输入门控变化）。单元测试 41/41，包含原世界、贴地/动画、物品状态/存档及新增交互规则。独立 build 成功，仍有既有 >500kB 包体积提示。

期间真实失败：一次测试路径 URL 编码错误；一次并行 Step 5 参数不匹配；一次并行新增 update 钩子不兼容；随后一次 60 秒场景加载超时。均未计为通过，修复路径与适配/可选钩子后用 180 秒加载上限完整重跑取得上述结果。补充测试曾遇到 Start 点击等待超时，另行重跑记录。


补充测试尚未通过：`obstacles.json` 记录两次 Start 点击等待超时，未执行真实房屋遮挡、桥下到桥面和物品授权拾取的补充断言。对应基础规则已有单元覆盖；不能用单元测试冒充这几项浏览器验证。对白正文深色修正在主流程截图之后写入 CSS，尚未取得修正后的最终截图。

`step3.patch` / 哈希是共享目录的时间点记录，可能包含并行任务对 main/adapter 的追加，不应作为“全由本任务修改”的提交使用。覆盖证据保存在 `revisions/hongqiao-step3-before/concurrent-adapter-overwrite.js` 与 `concurrent-main-latest.js`。无 Git，无提交号，未宣布用户验收通过。
