# 画面、人物与陈设修订 · 2026-09-16

补充复验：持续运行发现旧停让逻辑会造成全局拥堵，已修复并重新打包；最新入口与结果以 [feedback-recheck.md](feedback-recheck.md) 为准。以下保留首轮实现和验证记录。

当前工程：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。本次只做用户列出的地标关闭、人群与碰撞、马匹、对话、书卷及酒瓮/蒸笼/船货更新。沿用已读取的 v1.3 方案、完整剧情与现有实现；不扩地图，不生成主角，不部署外网，不修改另一个主角验收任务。

## 实际挂接与前后差异

| 用户反馈 | 修改及真实文件 |
| --- | --- |
| 地标介绍无法收起 | `src/storefronts.js` 添加右上 ×，记录当前条目的收起状态；离开后可再次自动显示。`src/style.css` 按钮样式。原自动触发和 F 展开阅读保留。 |
| 行人等速、并排和重复 | `src/crowd-motion.js` 配置速度、出生间隔、横向偏移和独立停留；`src/street-life.js` 保留稳定实例 ID，减少机械重复的桥上人群。92 名活动行人，慢行约 0.45–1.0、赶路约 1.35–1.85 游戏单位/秒。`public/assets/characters/npc-map.json` 保留一名风筝女孩，重复映射换成现有成人资产。 |
| 人物穿模 | 在 `src/main.js` 已算好的 `moveActor(actor,dx,dz,world)` 结果之后挂接 `streetLife.resolvePlayer`。NPC 用扫掠圆盘、楼层/高度过滤和分步更新；临近停步，受阻后尝试局部侧让。固定任务人物读实时位置。`src/npc-assets.js` 依据实际位移切换并调整步频，受阻不会持续原地 walk。 |
| 块状马与骑手错位 | `src/horse.js` 加载 Tripo 马，复用已有骑手，按马鞍变换定位。两个马实例共用资产；独立骨架与 mixer，idle/walk 淡入淡出。 |
| 对话面板和字体 | `src/hongqiao/dialogue-ui.js`、`quest-ui.css`、`portraits.js`：半透明墨绿、细金边、17px 宋体、随说话人变化的头像。五张头像直接渲染现有书生及四位 NPC；不新生成角色。`src/song-font.css` 与 `public/assets/fonts/` 内嵌 Noto Serif SC 子集和 OFL 许可。 |
| 结束后见闻书卷 | `src/hongqiao/progress-ui.js`、`progress-ui.css`：纸色卷轴边、书脊、双栏展开、上一页/下一页、页码和翻页过渡。人物故事分段翻页，保留存档阅读位置；打开页面不直接标记全篇已读。结束提示也使用纸卷样式。 |
| 酒、蒸笼、船货替换 | `src/scenery-assets.js` 与 `public/assets/scenery/placements.json`：21 家酒铺共 168 个酒瓮、11 家食铺共 55 组蒸笼、剧情船 2 组货堆。对应旧陈设按实测三角面指纹移除，保留柜台、房屋和原世界 GLB。货堆挂在真实船实体下随船移动，避开降下的桅杆，交付后的护货布位置同步。 |

主角 GLB、键位、2.7/5.2 步行/快行速度、转向插值、相机初值与跟随逻辑未改。人物碰撞带来的停步属于本次明确要求的变化。衣袖、风筝及长手持物未做逐网格物理，当前保证的是人物主体空间；局部停让不等于完整人群导航，拥挤处需要绕行。

## Tripo 产物与费用

直接使用 Tripo API，共 195 credits，没有重复生成或新主角。授权范围仅以下四类；运行包没有 API key、请求凭证或临时签名下载地址。

| 资产 | 生成任务 | 实际三角面 | 状态 |
| --- | --- | ---: | --- |
| 马 | ecf40984-7682-45e8-9afc-1be6e26031ce | 17,632 | 已生成、已绑骨、已有本地修正 idle/walk；浏览器近景检查，不代替用户视觉验收 |
| 酒瓮 | b2507955-f9d0-4ec2-9827-b17ef75cc313 | 3,937 | 静态 PBR GLB，已接入全部对应酒铺 |
| 蒸笼 | 245a815d-84ec-4364-a2d2-8426015c6e61 | 3,484 | 静态 PBR GLB，已接入对应食铺 |
| 船货 | ad01d39c-673f-444b-b494-5327f1c7e445 | 4,948 | 静态 PBR GLB，作为船子节点移动 |

马的 Tripo 绑骨任务为 `8e563d54-59b2-45ed-ae8c-7b011687eabb`；自动动作任务 `4e8d0c71-6a68-43cb-ac1d-3a370462c3c4` 返回的动作出现变形，未直接投入运行。`scripts/repair-horse-actions.mjs` 在同一 Tripo 网格/骨架上烘焙本地修正动作 `Idle_Local`、`Walk_Local`，没有再次付费。原始下载与失败动作留在本地 output 供排查，不进入交付包。详细任务、费用、哈希见 `public/assets/scenery/asset-manifest.json`。

静态压缩脚本 `scripts/prepare-scenery.mjs`；实测拆分脚本 `scripts/extract-scenery-mask.py`、`scripts/build-scenery-mask.py`。这些是资产加工工具，依赖本机既有 Blender/GLTF 工具目录和原始下载；正常启动、构建、交付不需要运行它们。

## 实际验证

- 自动检查：71/71 通过（world、motion、interaction、hongqiao、cinema、crowd-motion），包含大位移扫掠、相向行人、大帧间隔和不同层人物。
- UI 浏览器：17/17 通过。关闭附近卡片不立即重开、离开后恢复、F 详解、按住 E 不跳句、书生头像、17px 嵌入宋体、Esc 不接取、撞到任务 NPC 停步且 idle、见闻/行囊翻页、阅读位置、风筝女孩只有一名、快慢行人共存，以及 Console/Network 检查。
- 控制回归：8/8 通过。真实键盘上下桥、斜贴栏杆并注入 700ms 卡顿、地图边界、拖动视角、浏览器真实失焦清理按键及恢复。没有通过修改相机和移动参数来绕过问题。
- 见闻书卷的隔离 UI 检查使用明确的完成状态样本；不能据此声称新存档通关。生产新档流程另记于 `output/feedback-evidence/production.json`。
- 最终生产包 9/9：新档真实键盘走完接取、三项授权与拾取、交付、结尾、四故事开放及刷新保存；没有使用传送/状态注入。耗时约 4 分钟（自动快速推进对白，不是首次真人阅读时长），拥挤处实际退让和绕行。资源请求全部在本地子路径，Console 错误 0、失败请求 0。
- 根路径与旧档兼容 7/7：根路径冷启动、不同端口隔离、v1 进行中库存/实例迁移、不提前解锁故事、v1 完成旧档保留完成与已读并解锁四故事，加载无错误。浏览器拦截所有非回环请求，仅保留本地 HTTP；不是物理关闭网卡。
- 新资产已在运行场景近景查看：马与骑手、酒铺柜台和地面酒瓮、食铺蒸笼、船货与桅杆。移除酒瓮旧几何残件后重新截图；马自动动作异常已如实修正和记录。

测试设备 Mac17,3 / Apple M5 / 16GB，macOS，Chrome 152，Playwright 驱动真实 Chromium，1280×800、DPR 1。UI 采样的繁忙视角为 28 FPS、932 draw calls、9,004,051 triangles；该采样并非独占机器的性能基准，不声明稳定 60 FPS。当前仍有场景和人物负载，移动端、Safari、低配置设备没有覆盖。

证据目录 `output/feedback-evidence/`：`verification.json`、`control-regression.json`、`unit-tests.log`、`production.json`、`compatibility.json`、`package-audit.json`。截图：`dialogue-final.png`、`scholar-dialogue.png`、`landmark-close.png`、`book-codex.png`、`book-reading.png`、`horse-rider.png`、`wine-shop.png`、`steamer-shop.png`、`ship-cargo-close.png`、`production-completion.png`、`production-stories.png`。

## 构建、来源与交付

沿用 npm/Vite 实际工程，命令及离线/存档说明见根目录 README。最终产物 `output/release-feedback-final/qingming/`，148 个清单文件，约 177.85 MB；原始 Vite 构建在 `output/feedback-build/`。有 Vite >500kB 代码包体积提示，构建成功。运行包包含本地 GLB、纹理、字体、Draco JS/WASM、音频和头像，外部史料链接仍需网络；无 Service Worker，离线游玩仍需本地 HTTP 服务。

本地子路径地址 http://127.0.0.1:5198/qingming/ ，根路径验证服务 http://127.0.0.1:5199/ 。存档以 localStorage 的协议/主机/端口为界，同来源路径共享，不自动迁移 5178 的旧档。正式启动不暴露开发传送或状态写入接口。

当前目录不是 Git 仓库。没有创建虚构提交；本次变更以 `revisions/feedback-before/`、`output/feedback-only.patch` 和 `docs/hongqiao/feedback-file-hashes.json` 记录。共享文件的补丁基线另存 `revisions/feedback-scoped-before/`：以当前共享文件移除本次修改得到，用于保留其他任务的变更，不是伪称原始备份。工作期间同目录还存在角店、人物图志和开场镜头的其他任务修改，保留在当前运行工程，未算作本次反馈实现或夹进本次修改补丁。开场动画按用户要求跳过验收，外网未发布；本记录是开发验证，等待用户检视和下一步指令。
