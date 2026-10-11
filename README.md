# 汴河入画 · 人物朝向与远景闪变修复

当前修复：NPC 按实际位移朝向；近远景共用骨骼动画并增加切换缓冲，修复 45 个派生远景网格。35 秒虹桥采样未发现倒向移动或快速反复切换；该拥挤镜头约 14 FPS，性能尚未验收。详见 [docs/hongqiao/npc-motion-fix.md](docs/hongqiao/npc-motion-fix.md)。

此前修复：对话框居中并适配低矮窗口，风物志出处改为页内原文摘录、取消外跳和底部提示。结果见 [docs/hongqiao/ui-reading-fix.md](docs/hongqiao/ui-reading-fix.md)。

此前继续修复人群运行一段时间后拥堵的问题，具体前后对照见 [docs/hongqiao/feedback-recheck.md](docs/hongqiao/feedback-recheck.md)。此前加入地标关闭按钮、错落快慢行人及人物阻挡、宋体透明对话与头像、翻页书卷，并使用 Tripo 新马匹、酒瓮、蒸笼和船货。主角、移动键位、移动速度、转向和相机参数沿用原工程。

本节为当前合并工程的运行方式。**本步只生成本地产物，没有部署或更新外网。** 下方旧版公网地址、旧打包脚本和发布记录均为历史信息，不能代表本次产物。

## 环境与精确命令

工程路径：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。Node.js 22.12+（或 20.19+）、npm；打包和无依赖静态服务另需 Python 3。使用工程现有的 package-lock.json 锁定依赖；首次安装需要访问 npm，之后运行交付包不需要 Node/npm。

```sh
cd "/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game"
npm ci
npm run dev -- --strictPort
```

开发地址为 http://127.0.0.1:5178/ 。端口占用时使用 `npm run dev -- --port 5179 --strictPort`，不要误把另一端口的旧 dist 当作本次源码。

生成生产构建与精简交付包：

```sh
npm run build -- --base=./ --outDir=output/npc-motion-build
python3 scripts/package-release.py --source output/npc-motion-build --target output/release-npc-motion-verified/qingming
```

- `output/npc-motion-build/` 是 Vite 原始生产构建，含 public 中的附加文件。
- **`output/release-npc-motion-verified/qingming/` 是最终交付目录**，按明确清单收集模型、纹理、人物目录、三物、Draco 解码器、剧情船与音频、新陈设、头像和嵌入宋体；`release-manifest.json` 记录大小、SHA-256、构建命令和源码哈希。
- 打包脚本发现目标已存在会停止，保护已验证版本。重建时使用新的目标，如 `--target output/release-feedback-next/qingming`；不要把新旧文件混在同一发布目录。
- 不使用历史 `scripts/package-ecs.py` 打包当前版本：其旧版清单会漏掉新资源。

## 本地验证、接收者启动与部署方式

本次非根路径服务：

```sh
python3 -m http.server 5198 --bind 127.0.0.1 --directory output/release-npc-motion-verified
```

访问 http://127.0.0.1:5198/qingming/ 。末尾 `/` 应保留（标准静态服务会自动跳转补齐）。根路径也可用同一包：

```sh
python3 -m http.server 5199 --bind 127.0.0.1 --directory output/release-npc-motion-verified/qingming
```

访问 http://127.0.0.1:5199/ 。也可使用 `npm run preview -- --port 5197 --strictPort --outDir output/release-npc-motion-verified/qingming`。`npm run build` 默认写入 dist；旧 `server.py`/双击启动器固定读取 dist，本次未更新它，因此不会自动展示 本次交付目录。

接收者只需复制整个 qingming 文件夹，在该文件夹运行 `python3 -m http.server 5198 --bind 127.0.0.1`，再访问 http://127.0.0.1:5198/ 。不要双击 index.html（file:// 的模块、fetch 与存档行为不可靠）。

获得单独部署请求后，可把该文件夹内的全部文件原样放入静态服务器的站点根目录或子目录，例如 `/qingming/`。这是纯静态站，无后端、无生成 API。服务器须正确返回 JS/CSS/GLB/JSON/JPG/PNG/WAV/WASM，`.wasm` 使用 `application/wasm`；不要把缺失资源统一回退成 index.html。index.html 建议不长期缓存；非哈希命名的 GLB/纹理也应随版本目录整体切换，避免旧缓存混用。切换版本前保留上一份完整目录及 manifest，回退时恢复整份目录，勿清除浏览器存档。

## 离线边界与资源

游戏模型、纹理、Draco JS/WASM 解码器、音频和宋体子集均随包本地提供。对话与书卷内嵌 Noto Serif SC（思源宋体风格），OFL 许可随包；当前文字已覆盖，新增字符超出子集时回退到系统宋体/serif。游戏运行不请求 Google Fonts。无需要用户填写的 API key 或生成服务凭证。首次 npm 安装需要网络；风物志的出处和古籍原文片段随代码本地提供，界面不再跳转外部网页。

本步通过浏览器拦截全部非回环网络，保留本地 HTTP 服务，在全新上下文中冷启动并跑流程，验证游戏不依赖外网。没有关闭整台电脑的网卡，不把该测试表述为物理断网。离线仍须启动本地 HTTP 服务；本版本无 Service Worker，不能关闭服务后依靠缓存刷新。

## 存档与来源隔离

存档写在浏览器 localStorage：`qingming:hongqiao:save`、`:backup`、`:corrupt`。它们按 **协议 + 主机 + 端口** 隔离，路径不隔离。因此 5178/5179/5198、公网地址、localhost/127.0.0.1、HTTP/HTTPS 之间不会自动迁移；同一来源的不同路径会共享这些键。不要在同一来源同时承载互不兼容的存档版本。

开发模式的测试/重置入口不进入生产包。若从旧部署迁移，先在旧来源浏览器中导出上述键的原始字符串，在新来源备份现存内容后再手动导入同名键并刷新；禁止通过上传整个浏览器资料目录搬迁。v1 正常旧档会迁移至 v2，保留进度并按已完成任务解锁故事；刷新后拾取实例不会重生。主档损坏会尝试整份备份，保存失败时应按页面提示重试，不要刷新丢弃内存进度。无服务端同步、跨设备同步或自动导入功能。

## 验证与限制

本次结果见 [docs/hongqiao/feedback.md](docs/hongqiao/feedback.md)，原始记录在 output/feedback-evidence；此前 Step 9 结果保留在 [docs/hongqiao/step9.md](docs/hongqiao/step9.md)，不将旧结果冒充本次验证。工程当前不是 Git 仓库，使用 revisions/feedback-before、局部补丁与 SHA-256 记录修改，没有虚构提交。按本次要求跳过开场动画测试，仅使用 Esc 跳过以进入游玩；不将资源加载成功视为开场镜头验收。

已知限制：较大的场景和人物资源会增加首次加载、内存/GPU负载；Vite 有 >500kB 代码包提示。行人使用错峰路线、停步和范围受限的绕行/退让，尚非完整城市导航；携带物、衣袖不做逐网格物理。马匹为 Tripo 模型和骨架，原 API 动作变形，实际运行的是同骨架上本地修正的 idle/walk，未宣称原自动动作验收通过。移动端、Safari、低配置设备与外网服务器缓存/MIME行为不在本机验证结论内。运行结果不等于真人首次游玩或全部视觉演出验收。

## 历史版本记录（非本次交付）

# 北宋书生主角上线 · V4.2

将已确认的 Tripo v2 北宋书生接入可控制主角“书生阿青”。正面保持衣襟与肩带，竹制书箱只在背后。人物高度为 2 个游戏单位、59,582 三角面、40 根骨骼。原有 214 名市民继续使用独立的实例化原型，84 家商铺与历史讲解保持原样。

- 主角文件：`public/assets/song-scholar-v2-animated.glb`，基于已确认模型绑定骨骼。
- 动作适配：`src/scholar.js`，程序驱动骨骼完成待机呼吸、行走摆臂、游泳和站立划桨，并平滑切换姿势。快行仍沿用快走动作。
- Tripo 绑定骨骼消耗 25 积分；测试待机与行走迁移动作消耗 20 积分。自动迁移动作会拉扯长袍与书箱，已归档在 `output/tripo/scholar-game/`，没有用于线上游戏。最终采用经实机检查的程序骨骼姿势；不含布料物理和手掌对桨的精确 IK。
- 自动检查：原有 11 项世界/航行检查通过；浏览器检查覆盖角色加载、骨骼变化、行走、游泳、划船、离船、回到待机与暂停。
- 发布包：`output/ecs-release-v42`；阿里云独立发布目录：`/var/www/qingming-game/releases/20260914-v4.2-scholar`。
- 公网：https://airesumejob.xyz/qingming/ 。旧 v4.1 发布目录保留，可切回。

# 柳树补全与阿里云发布 · V4.1

14棵柳树统一补齐树根、主干、分枝和连接在枝条上的垂叶；替换全部13棵旧树的5个合并批次，避免新旧树干/叶片混用。叶丛与深度阴影使用一致的风动。84家商铺、359条原有场景碰撞和历史资料未改。

- 公网地址（部署验证见 `output/verification-ecs-v41.json`）：https://airesumejob.xyz/qingming/
- 阿里云静态目录：`/var/www/qingming-game/current`，Nginx托管，无需PM2。
- 本地游戏仍为 http://127.0.0.1:5178/ 。
- `blender/汴河入画-v4.1.blend`：移除旧柳树后的静态街景；完整新柳树及其风动由 `src/landscape.js` 在浏览器构建。V4原始工程保留。
- 服务器版本构建：`npm run build -- --base=/qingming/ --outDir=dist-ecs`，`python3 scripts/package-ecs.py`只收集运行需要的13个文件，并生成gzip和校验清单。主场景91,595,996字节，gzip传输15,422,741字节。
- 发布脚本 `scripts/activate-ecs.py` 验证文件哈希、备份所涉及Nginx配置、校验配置后切换独立发布目录。

以下是保留的第四版说明。

# 汴河入画 · 第四版

以晓梦提供的《清明上河图》虹桥局部及既有彩色参考图为依据的可游玩 3D Demo。第四版直接优化现有项目，使用 Dream Loop 的截图对比、独立视觉评审与迭代流程，没有重做目标图。建模使用本机 Blender，浏览器以 Three.js 实时渲染；本轮 Blender MCP 未连接，因此未宣称通过 MCP 完成新增建模。

## 第四版画面更新

- 128处原有屋顶重做细筒瓦、板瓦、瓦口与檐下支撑；主街保留细分，远屋减面。复用精细房屋扩展两座前景茶舍、纸铺，共84家店。
- 生成并实际使用陶瓦、旧木、泥地和布料材质图集；加入柳叶透明贴图与风动、细水波和倒影。GTAO环境遮蔽加强檐下、衣褶和接触处层次。
- 阿青与市民改为交领长袍、宽袖、自然肩线和更细的面部；214名动态市民，新增8个不同棚型的街摊。
- 大货船增加卷帆、桅索、滑轮、舷边木框和绳盘，并调整比例与泊向；竹架前移并增高。船道避让范围同步更新。
- 保留步行、游泳、划船、缩放、暂停和历史导览；84家商铺与4个地标共88个讲解点，新茶舍、纸铺也有来源可查的讲解。

实机截图与检查记录见 `output/playwright/v4-street.png`、`output/playwright/v4-overview.png`、`output/verification-v4.json`。所有素材均打包在本地。实测帧率是当前设备、特定视角的采样，不代表所有设备。


## 开始游览

双击本目录的 **启动汴河入画.command**，或打开正在运行的 [本机游戏](http://127.0.0.1:5178/)。已打开旧版页面时请刷新。全部模型与贴图均保存在本地。

| 操作 | 按键 / 手势 |
| --- | --- |
| 行走、游泳 | W A S D / 方向键 |
| 快行、加速游泳 | Shift |
| 环顾、缩放 | 鼠标拖动、滚轮；触屏单指拖动、双指缩放 |
| 上下船 | 接近东侧码头小舟后按 E |
| 划船 | W / S 前后，A / D 转向 |
| 全景 / 跟随 | V |
| 暂停、继续 | Esc |
| 回到起点并召回小舟 | 底部“返回虹桥” |

走入浅滩自动游泳，游回河岸或码头自动上岸。桥面可步行，桥下可通航。背景游船会自主航行，无需登船触发；玩家操控的是东侧码头的小舟。

## 第三版保留的游戏内容

- **商铺布局**：重建 82 间不同尺寸、进退位置、朝向和屋顶高度的铺面，主街两侧改为朝街开门。加入开敞柜台、退入的货架、侧窗木格、低矮附屋；取消沿街每铺一伞的重复结构，仅在少量街摊与桥头保留伞棚。
- **七种经营内容**：茶坊、酒肆、蒸食铺、彩帛铺、米行、香药铺、纸铺。配置茶炉汤瓶、酒瓮酒幌、竹蒸笼、悬挂布匹、米袋木斗、分格药柜、纸卷书册等不同陈设。每家有可读招牌，靠近自动显示经营内容；茶炉与蒸食铺有上升蒸气。
- **人物**：移除原来合并在城市场景里的静态人群，替换为 152 名具有行为动画的人物。人物改用成人头身比例，增加交领、衣褶、面部、手指、肘膝关节；衣色、身高和斗笠有所区别。行为包含行走、挑担、看货、交谈、点茶、斟酒、饮茶、看书等，驻足人物仍有抬手、转头和呼吸动作。
- **车马**：两辆牛车、两名赶牛人、两名骑马人、两名拉车车夫，包含牲畜迈步、尾巴摆动、车轮转动与角色姿势。
- **游船和水面**：四艘游船按独立水道航行，带船夫、乘客、船桨和拖尾水迹，沿途避开固定货船和码头；前方遇到玩家小舟会等待。保留持续流动的水纹、波浪和玩家游泳水迹。

## 文件

- `blender/汴河入画-v4.blend`：第四版精细街景与地标原生模型；原生历史动画预览保留，实时游戏使用下列独立GLB及程序动画。
- `blender/游历者与市民-v4.blend`：第四版人物原型。
- `blender/街市角色与船只-v4.blend`：补UV后的动态物件与船只原型。
- `blender/汴河入画-v3.blend`：已整合街市、角色、车马、船只与文字招牌的可编辑工程，内嵌贴图，含 60 秒动画时间线。
- `blender/游历者与市民-v3.blend`：带分层关节的人物原型。
- `blender/街市角色与船只-v3.blend`：牛、马、货车、游船、斗笠和手持物原型。
- `public/assets/blender-preview-v3.png`：第三版 Blender Cycles 实际渲染。
- `public/assets/{qingming-world,a-qing,skiff,street-life}.glb`：游戏使用的真实三维模型。
- `public/assets/world.json`：店铺名称、经营内容、尺寸、朝向、碰撞与码头资料。
- `output/playwright/street-life-v3.mp4`：浏览器实际游戏动态录像。
- `output/verification-v3.json`：实际浏览器操作检查记录。
- `dist/`：已打包的本地网页游戏。

V1、V2 工程保留在 `blender/`；关键旧版源文件保留在 `revisions/`。

## 参考与复原边界

故宫对[张择端《清明上河图》](https://www.dpm.org.cn/collection/paint/228226.html)的介绍区分大店门首的彩楼欢门与小店敞棚；[故宫茶文化展中的临摹卷介绍](https://www.dpm.org.cn/subject_tea/detail/261563.html)提及茶炉、茶瓶、盏等店铺陈设。[《东京梦华录》卷二](https://ctext.org/wiki.pl?chapter=167633&if=gb&remap=gb)中记载酒店、包子、肉饼、香铺及街头饮食。店名和每间商铺的具体位置是据此进行的游戏设计补全，并非原图题记或考证结论。

本版仍是**风格化的可玩重建**，不是参考图的照片级复制。虹桥与河道方向、临桥街市和大货船等主要元素保留，但建筑个体、人物服装、植物、河岸线尚未逐一按画面精确复原。仅覆盖虹桥周边；店前廊下可接近，后部房间未开放，没有交易经济、剧情任务或多人功能。行人与车马使用预设路线和程序动画，尚未实现复杂人群避让或完整生活模拟。

游戏里的交互与连续动态由浏览器负责；Blender 时间线是供建模与动画继续编辑的预览，不运行游戏控制逻辑。

## 验证与开发

11 项自动检查通过：包括桥面通行、桥下游泳、水陆转换、建筑阻挡、船只驾驶、上下船、航线连续性、十分钟航行中的船体与固定障碍关系、动态船只阻挡。

17项浏览器交互检查全部通过，覆盖行走、入水、上岸、上下船、划行、人群和四艘游船移动、暂停冻结、历史讲解及资料链接、缩放与移动端阅读布局；页面错误为0。生产地址确认加载第四版，未暴露开发测试传送接口。当前设备街景独立采样50–60 FPS，综合交互流程采样36–60 FPS，尚非全程稳定60帧。

```sh
npm install
npm run dev
npm test
npm run build
```

第三版建模脚本依次为 `rebuild_v3.py`、`build_life_v3.py`、`build_humans_v3.py`、`polish_v3.py`、`finalize_v3.py`。重建脚本以保留的 V2 文件为起点，后续脚本有阶段依赖；请在独立文件副本上运行，避免重复叠加模型。

## 历史讲解更新

靠近 84 间商铺、虹桥、两处码头或街口构架，会自动出现“建筑”“风俗”两段历史介绍。按 **F** 或点击“展开阅读”查看详解与逐段资料链接，阅读期间游戏暂停；按 F、Esc 或关闭按钮返回。

正文据 11 个古籍、故宫藏品介绍、专题展览和研究资料页面编写；按七种业态提供 14 个市井专题，另有建筑形制与地标专题。讲解文本和出处整理在 `docs/历史讲解与资料来源.md`；游戏内容维护在 `src/history.js`。店名、陈设和位置的设计补全与史料内容分开说明，正文可离线阅读。

## Dream Loop 工作记录

安装的 Skill：`/Users/zhengrui/.codex/skills/dream-loop/SKILL.md`，来源 https://github.com/achimala/dream-loop 。

对比图、自审、独立评审和构建记录在 `.dream-loop/`（已加入忽略列表）。旧源码、旧世界与人物等可回退资产在 `revisions/v3-dream-loop/`。第四版是现有项目的视觉优化，尚未达到参考图的照片级复原，独立评审的原始分数和未通过项保留在工作记录中，没有将其包装成通过8分验收。

新建模脚本为 `build_humans_v4.py`、`refine_v4.py`、`detail_barge_v4.py`、`foreground_v4.py`、`landmarks_v4.py`；它们有阶段输入依赖，不能随意在最终文件上重跑较早阶段，否则会覆盖后续修改。
