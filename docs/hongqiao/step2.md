# Step 2：贴地、碰撞与 locomotion 挂接

2026-09-15。状态：本步代码与回归完成；真实 idle/walk AnimationClip 验收待资产交付。

## 挂接与改动

`src/main.js → updateActor()` 保留原按键、速度、方向计算；仍在 `actor=moveActor(actor,dx,dz,world)` 解算后落地。新增解算前后水平位移/模拟dt的速度判定，仅在步行模式下决定 moving，之后交给原书生姿态、脚下轻微起伏和行走相位。顶墙、顶栏杆、顶地图边界时按键仍可保持，但实际速度为0，切换idle。

`src/world.js` 保留原桥面公式、岸坡、水位、码头以及2D碰撞代理，扩展 supportAt 与约束：

- 只查询已定义的桥、岸、坡、码头、水域，不向整个城市网格向下乱投射，不吸附屋顶。
- 原桥层入口、高度和两侧栏杆钳制保留；桥下游泳仍是ground层，不会上桥。
- 原0.18单位子步保留；超过4096子步的异常输入直接拒绝，避免无限计算。tick原有50ms上限未改。
- 步行台阶上升≤0.45，下贴落差≤0.65，坡度≤0.85（高/水平距，约40.4°）；当前桥最陡处约0.811，原岸坡0.43，均保留可通行。
- 河水是合法游泳表面，非“无地面”；既有游泳与码头上岸规则保留，不把泳者上岸强行按步行台阶拦住。
- 地图范围外、非有限输入或未来显式 `world.groundVoids[{x,z,w,d}]` 中无支撑时拒绝位移。当前世界数据未新增空洞。
- 初始轻微重叠尝试沿碰撞体最近边界退出，接触容差0.002、最大局部恢复距离0.8；无合法候选时保留原位置，不跨地图传送。

`src/motion/config.js` 统一约束参数与书生资产动作映射。半径0.32、桥栏内缩0.38、入口内缩0.37、入口容差0.15均保持旧值。未改按键、2.7/5.2行走速度、2/3.1游泳速度、转向dt*12、相机yaw/pitch/distance/缩放规则。

`src/motion/animation.js` 通过已验收资产的明确 clipNames 创建 AnimationAction。完整idle/walk一对且 clipsAccepted=true 才启用；Action.play/fadeIn/crossFadeFrom执行0.18秒过渡，mixer在每次未暂停的角色更新中update(dt)。暂停不推进模拟动画时钟。游泳/划船继续原程序姿势，不强行重定向剪辑。

`src/scholar.js` 接入上述动作驱动。当前书生GLB有骨架但无剪辑，映射idle/walk均为null且clipsAccepted=false，所以继续使用已验收程序骨骼姿势。状态输出明确 ready=false、missing=[idle,walk]、animationSource=procedural-skeleton。没有自动选取此前被拒绝的重定向动画。

`src/motion/debug.js` 增加仅DEV + motionDebug参数启用的可关闭显示：原碰撞代理框、桥栏边界、桥面线、人物碰撞半径、上下贴地范围和当前支撑类型。面板在进入游戏后才显示，不拦截入画按钮。不是新关卡内容，不添加正式用户快捷键。

## 启动与验证

当前服务：`npm run dev -- --port 5179 --strictPort`。普通入口：http://127.0.0.1:5179/ 。测量入口：http://127.0.0.1:5179/?test&motionDebug 。保留用户5178上的Python旧版服务，本步未覆盖其dist。

实际执行：

- `npm test`：原11项世界/船只检查全部通过。
- `node --test src/motion/motion.test.js`：新增6项通过，覆盖薄障碍/大位移/斜向滑动、台阶与落差、无地面、桥层与超陡坡、初始重叠与异常输入、合成AnimationAction交叉淡入淡出与mixer推进。
- `node scripts/validate-hongqiao.mjs`：Step 1配置及推荐路径通过。
- 修改前后四组固定步长轨迹（桥、岸坡、桥栏、街道）最终状态完全一致，见 `output/playwright/hongqiao-step2/baseline-comparison.json`。
- `npm run build -- --outDir=output/hongqiao-step2-build`：成功，保留大于500kB打包警告；未发布。

## 浏览器实际结果

本机Apple M5、16GiB、macOS 26.5.1；Chrome152，1280×800、像素比1。

`output/playwright/hongqiao-step2/verification.json` 记录17项全部通过：

| 操作 | 结果 |
|---|---|
| 打开/关闭碰撞地面调试 | 可关闭，入画按钮可正常点击 |
| 从南岸按W上桥 | layer=bridge，桥顶高度约8.24 |
| 桥上W+D斜走 | 沿桥前进，x限制在3.62 |
| 栏杆处持续按D | x保持3.62，角色idle |
| F打开虹桥历史/ESC关闭 | 原历史打开并暂停，关闭后可继续 |
| 按S下桥 | 回到ground/walk，高度0.94 |
| 持续按W顶建筑墙 | 实际位置被挡，角色idle |
| 按W撞街摊代理 | 停在代理外侧 |
| 岸坡下行与返回 | 按连续坡面贴地，返回0.94 |
| 从水中穿桥下 | ground/swim，高度-0.58，未吸上桥 |
| 持续朝地图边缘移动 | x≤84，停下后idle |
| 触发blur事件后等待 | 清空按键，位置不漂移 |
| 主线程阻塞900ms后恢复 | 桥栏未穿过，停止后idle |
| 实际鼠标拖动100×20px | yaw变化-0.6，pitch变化+0.08，与原规则一致 |
| 按键有实际位移 / 松键 | walk → idle，mixerTime持续更新 |

页面错误0、Console警告/错误0、失败请求0、HTTP错误0。截图见同目录 ground-debug.png、bridge.png、wall-idle.png；顶墙截图的屋檐遮挡是原相机表现，数值和动画状态取自实际运行页面。

另用有界面的Chrome打开第二标签页，关闭测试工具的focus emulation后实测焦点由true→false→true；保持W未释放时，失焦后自动idle，返回前后位置完全相同。`focus-check.json` ok=true，普通入口debugAbsent=true。没有声称完成操作系统级所有应用切换测试；document.hidden在该环境中未变化，验证的是实际focus/blur。

## 修复和未覆盖项

首次新测试发现animation.js一个括号错误，已修复并重跑6项测试与构建。首次浏览器发现调试面板遮挡入画按钮，已改为入画后显示，重跑17项全部通过。首次标签切换被工具的focus emulation影响，未真实失焦，该记录单独保留为focus-emulation-not-switched.json；关闭模拟后复测通过。

真实动作：现有程序骨骼idle/walk按实际位移工作已验证；已验收GLB的idle/walk AnimationClip仍缺失。合成剪辑测试仅证明Action与mixer接口，不等于衣袍/书箱/脚滑的真实剪辑验收。无付费生成、无模型替换。

新台阶、空洞、异常坡度等使用最小合成世界进行逻辑测试，未向正式地图添加这些障碍。原世界的真实桥、岸坡、街摊、建筑和地图边缘已浏览器验证。不宣称任意未来模型的碰撞都自动正确；仍须维护可行走表面和障碍代理。

## 文件与回退

修改：src/main.js、src/world.js、src/scholar.js。新增：src/motion/config.js、animation.js、debug.js、motion.test.js。文档、截图及检查脚本见本目录与 output/playwright/hongqiao-step2。

工程仍没有Git仓库，未制造提交号。相关开工副本：`revisions/hongqiao-step2-before/`；哈希：`step2-before-hashes.json`；可审查差异：`step2.patch`。回退应仅逆向应用本步差异并移除本步模块，不能覆盖另一个任务的共享入口。

storefronts.js、history.js、style.css、world.json、package.json哈希未变；updateCamera、interact、clearInput源码逐段一致。Step 4既有代码保留，本步没有修改任务、背包与存档。停止于本步，等待下一步指令。
