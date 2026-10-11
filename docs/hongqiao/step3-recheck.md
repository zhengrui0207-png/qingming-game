# Step 3 当前合并版本复验

2026-09-15：开发复验通过。用户确认前序步骤完成后，以当前正式剧情/NPC/演出合并工程重新测试，替代上一轮因并行写入而未收口的结论。不回退 Step 5 或其他已完成步骤，不重新生成主角/资产。

## 真实路径、入口与变化

工程：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。Vite 7.3.6 + Three.js 0.180.0；`npm run dev -- --port 5179 --strictPort`。本次实际监听 127.0.0.1:5179；5178 未运行，因此不能用旧地址代表本次版本。

正式入口：http://127.0.0.1:5179/ 。统一交互样本：http://127.0.0.1:5179/?test&interactionTest 。正式 NPC 测试：http://127.0.0.1:5179/?test 。测试从入场按钮开始，使用 Esc 跳过已接入开场，再验证操作。没有调用模拟入口绕过场景加载。

main.js → interaction/progress-adapter.js → hongqiao/runtime.js 为当前正式入口。NPC/物品由 runtime 注册到 interaction/core.js；旧地标经 storefronts 的 automatic 适配仍自动提示、F 阅读。main 的 E/Esc/I 路由使用同一 gate/locks；最小测试 dialogue.js 与正式 dialogue-ui.js 都纳入本轮检查。

本轮**未修改任何 src 运行时代码**。开始与结束 SHA-256 清单逐文件一致，保存在 output/playwright/hongqiao-step3-recheck/before-hashes.json 和 after-hashes.json；实际变更为测试脚本、结果、截图及文档。工程依然无 Git，无法产生工程提交号；不把别处提交当作本工程提交。

## 实际操作与结果

| 检查组 | 操作及结果 |
|---|---|
| 注册与焦点 | 地标/NPC/三物统一注册；两个临近街坊小幅移动不闪烁，超出容差正确切换；实时实体位置生效；唯一 E 操作条。 |
| 空间限制 | 真实房屋体积遮挡 NPC；桥面不能交互桥下 NPC，桥下游泳不能交互桥面 NPC；高差/异层拒绝。 |
| 基础对话 | 按住 E 不连发；开面板的 E 不跳句；E 显示全文、继续；E 不确认选择；明确按钮 completed，Esc cancelled 且无测试效果。 |
| 嵌套锁 | 对话→图鉴、历史阅读→图鉴，关闭图鉴仍暂停；关闭下层对话不会释放上层书册；关闭最后一层恢复移动/相机。 |
| 正式 NPC | 何伯开场 E 不越句、按钮等待释放；Esc 后完整任务状态不变；选项页 E 不授权；明确按钮只授取用权限，不代替拾取；老周 Esc 不接任务，明确接取按钮才激活任务。 |
| 实际拾取 | 未获许可时物品不进入焦点；许可后物品成为焦点；走近按住 E 仅拾取一次。 |
| 旧地标 | 桥面自动显示虹桥卡；F 展开原历史内容；图鉴嵌套后返回原阅读，F 关闭恢复操作。 |
| 失焦 | 禁用浏览器 focus emulation 后切换真实标签，document.hasFocus=false；返回时 E 状态清理，Esc 正常取消，无新增任务效果。 |
| 控制回归 | 浏览器键盘 W/Shift 连续从南岸过桥到北岸；上桥采样 z=13.28、y=4.26649、bridge，下桥 z=-22.33948、y=.94、ground。鼠标拖动可转视角，关闭面板后行走恢复。 |
| 视觉 | 最小对话与正式何伯选项页均保存截图；正文深色样式已在浏览器核实并目视检查。 |

自动测试 64/64：原世界、贴地/动画、交互规则、物品/存档、剧情、演出状态与时间线。浏览器统一测试 34/34 + 正式对话/过桥 14/14 = **48/48**。两次独立浏览器上下文的 Console error、pageerror、请求失败及 HTTP≥400 均为 **0**。测试上下文独立，不清空用户游玩存档。

独立构建 `npm run build -- --outDir output/hongqiao-step3-recheck-build` 成功，保留 >500kB 分包大小提示。这是构建警告，不是浏览器 Console 错误；未发布、未覆盖旧 dist。

## 设备与证据

实际机器 Mac17,3 / Apple M5 / 16 GiB；Chrome 152 headless（UA 报 MacIntel），1280×800，DPR 1。统一测试结束瞬时采样 25 FPS、1,262 draw calls、8,987,379 triangles。场景已增加正式人物与演出，不能与旧 Step 3 数字直接当作性能对比；本轮未采集帧时间分位数或开展性能验收。

证据目录：`output/playwright/hongqiao-step3-recheck/`。

- verify.mjs / verification.json：34 项统一检查，实际设备/渲染采样及 Console/Network。
- formal.mjs / formal.json：14 项正式 NPC、接取/权限/拾取与上下桥。
- unit-tests.txt / build.txt：自动测试与构建原始输出。
- 01-focus.png、02-choice.png、03-return-from-book.png、04-history.png、05-restored.png、06-choice-contrast.png、07-formal-choices.png、08-bridge-exit.png：最终截图。
- before-hashes.json / after-hashes.json：同一份源码验证证据。

复现测试：服务启动后运行 `node output/playwright/hongqiao-step3-recheck/verify.mjs` 与 `node output/playwright/hongqiao-step3-recheck/formal.mjs`；脚本使用本机现有 Playwright 包路径和 Chrome channel。截图使用 Chrome DevTools Page.captureScreenshot。测试起点由已有 DEV API 定位，后续对话/拾取/过桥使用浏览器按键、点击完成；人工未实际试玩。

## 范围限制与收口

本报告确认 Step 3 当前合并版本的开发复验，不替代用户验收。未重新跑完整第一关六种收集顺序、全套演出/船净空、移动端触控、Safari、多设备或所有装饰几何遮挡；这些不纳入本轮通过声明。真实房屋/现有碰撞体的遮挡已测，无碰撞体的装饰仍不自动构成遮挡。

前次并行覆盖、加载/点击超时保留为历史记录，不能与本次成功结果混用。当前入口保持完整合并；无需恢复旧独立 progress-book 适配。状态更新后等待下一步指令，不自动开发或发布。
