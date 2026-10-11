# 虹桥 Step 0 / Step 1 实际工程基线

2026-09-15。真实工程：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。制作资料：`/Users/zhengrui/Documents/ChatGPT/清明上河图`。

## 工程与启动

Three.js 0.180.0、Vite ^7.3.6、ES modules。package.json 提供 `npm run dev`（127.0.0.1:5178）、`npm test`、`npm run build`。

用户提供的 5178 当前是 Python `server.py` 托管 dist，实测显示旧版游历者，不能等同当前源码。保留该服务，使用 `npm run dev -- --port 5179 --strictPort` 启动当前源码。普通入口 http://127.0.0.1:5179/ ，本步测量入口 http://127.0.0.1:5179/?test&hongqiao 。本步构建到独立 `output/hongqiao-step1-build`，未覆盖 dist 或发布。

工程和上级 3d 打印 目录未找到 AGENTS.md；资料目录及更上级的检查见原资料基线，遵守用户提供的约束。本工程不是 Git 仓库，无法取得 Git 差异或创建相关提交。未擅自初始化仓库。

修改前相关文件副本位于 `revisions/hongqiao-step1-before/`，哈希位于 `docs/hongqiao/before-hashes.json`。本步仅在 main.js 增加条件加载调试层和 update 调用；其他 main.js 差异来自同时进行的 Step 4 任务，不能用完整旧副本覆盖现在的入口来回退。

## 真实文件与调用关系

| 文件 | 入口与关系 |
|---|---|
| index.html → src/main.js | 初始化场景、renderer、camera，boot 并行加载 GLB/world.json |
| src/main.js tick | requestAnimationFrame；updateActor、街景/河流/店铺更新、updateCamera、atmosphere.render |
| src/main.js updateActor → src/world.js moveActor | 原按键、方向、2.7 普通速度/5.2 快行保持；moveActor 子步处理障碍和桥层 |
| src/world.js surfaceAt/bridgeHeight/blocked | world.json 地面、桥面、码头和碰撞代理；桥上桥下按 layer 区分 |
| src/main.js updateCamera | yaw/pitch/distance、拖动缩放、房屋遮挡探测；本步不改参数 |
| src/main.js boot → src/scholar.js createScholar | 加载 song-scholar-v2-animated.glb，40骨骼，程序姿势 idle/walk/swim/row |
| src/storefronts.js → src/history.js | 自动附近卡片，F 开详解并暂停；88处历史点，84家店 |
| src/street-life.js / life-paths.js | 原214市民、车马和背景游船动态 |
| src/river.js / atmosphere.js / landscape.js | 河流、后处理、柳树及风动 |
| public/assets/world.json | 原始桥面、出生点、商铺、码头、359条碰撞与船障碍 |
| src/hongqiao/config.json → debug.js / validate.js | 本步新增的关卡数据、开发测量、引用和可达性校验 |

开工所读 main.js 无剧情存档。本步过程中另一任务新增 runtime.js/state.js/persistence.js/collectibles.js/progress-ui.* 并修改 main.js 接入 Step 4；本任务保留这些外部改动，不宣称它们由 Step 1 实现或完成验收。

## 书生与船

已找到真实书生文件及已有报告 `output/verification-scholar-v42.json`。本地 GLB：1网格、1 skin、40骨骼、无内嵌 AnimationClip，已有报告为59582三角面。区分：已生成=是；已绑骨=是；运行时动作=程序骨骼；动作剪辑=无；已有任务验收=报告记载已验证，当前实景也成功加载，不新增“真人验收通过”结论。

船合并在城市24个静态材质网格中，不能独立移动。详细节点线索、尺寸与候选路径见 ship-clearance-plan.md；未拆船、降桅或制作抛绳动作。顶杆接触点、两处桥上抛绳点与纤夫路线仍需在可编辑船/桥模型中测量，不能伪造现有动画能力。

## 本机与实际浏览器证据

本机 Apple M5、16GiB、macOS 26.5.1。首轮 Chrome 152，1440×900，devicePixelRatio=1，渲染器现有限制像素比为1。

源码入场截图 `output/playwright/hongqiao/baseline-entry.png`；当时采样 fps=34、drawCalls=565、triangles=10112020。渲染统计包含现有多 pass，不能当成资产唯一三角面数量。

首次完整走测成功：入场路线13.549秒，何伯7.616秒，阿成19.481秒，方娘子34.310秒；包含自动化分段停顿，不等于真人首次体验时长。各路线仅起点使用测试定位，后续全部真实 KeyW 按键与现有控制器；逐段改变观察朝向来沿路行走。到点为walk/ground。所有 NPC/物品点垂直射线命中地面0.94，部分道路表面0.956；不在水面、墙内或错误桥层。

原行为复测：从南岸走上桥至 z=-1.10852、y=8.2123、layer=bridge；向侧面走被限在x=3.62；F打开虹桥历史、暂停=true；Esc关闭后走下桥回ground；鼠标拖动yaw从0变为-0.78、pitch从0.49变为0.61。此为开发者自动化，不是首次真人试玩。

首次全流程页面错误、Console warning/error、失败请求和HTTP≥400均为0。场景末尾3秒采样93帧，中位32.3ms、P95=68.6ms。达不到60fps目标；共享工程/同时其他任务运行，本步不据此做性能归因或扩大优化范围。

随后调整老周至[6,0.94,19]、观景点至[7,0.94,19]，离开桥口通道。第二次走测的入场路线到达，但截图在30秒超时；失败原始记录保存在 `output/playwright/hongqiao/verification.json`，不是全项通过报告。追加局部复测记录见 `final-check.json`，只覆盖调整点、观察视野和当前资产加载。


## 最终局部复测

使用同一 Playwright 进程，通过 Chrome DevTools 截图接口绕开 Playwright screenshot 等待超时，1280×800。`final-check.json` 无 fatal、页面错误0、失败请求0；三件实例全部 loaded。四张 final 截图已实际查看：目标货船可从 [7,0.94,19] 看见；阿成可从沿岸西侧观察，避开店铺檐架；方娘子在锦彩堂前场，动态牛车经过时会暂时遮挡，旧群众/车马行为未改。标签是可关闭开发标记，不是最终游戏UI。

调整后的0→6南岸横向路段实际按D经过，最终到 x=11.65401、z=19、walk/ground；它验证了改点所在路段，不能把按键持续时间当成准确速度测试。最终配置校验全部通过。渲染单帧读取409 draw calls、4798967三角面，视角/人数与首轮不同，不做前后性能结论。

world.js、scholar.js、storefronts.js、history.js、style.css、package.json、world.json 与 before-hashes 完全一致。main.js 本步仅增加开发挂接；其余差异来自共享工程任务。两次 screenshot 超时属于工具取证失败；首轮正常游戏回归和最终局部补验分别报告，不隐藏失败。
