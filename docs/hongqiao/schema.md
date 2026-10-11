# 虹桥 Step 1 配置契约

维护入口：`src/hongqiao/config.json`。校验：`node scripts/validate-hongqiao.mjs`。单位沿用游戏世界单位，Y 向上，X 东西向，Z 正方向为南岸；`[x,y,z]` 不能当作 Blender 原生坐标直接使用。

| 字段 | 契约 |
|---|---|
| schemaVersion | 本次配置结构版本为 1，与存档 schemaVersion 不混用 |
| player / region / quest | 固定 player_scholar / region_hongqiao / hongqiao_01 |
| anchors | 稳定 id、label、position、kind、layer、measuredFrom；walk 为实测可步行地面，ship 为候选船位 |
| assets | 稳定 assetId 与真实 public 相对路径分离；模型换版不改变 NPC/物品/存档 ID |
| npcs | id、name、anchorId、assetId、storyId；调试阶段复用群众原型，不能宣称正式 NPC 外观通过 |
| items | 可复用物品定义；id、name、description、assetId |
| instances | id、itemId、anchorId、permissionId、quantity；拾取状态应记实例 ID，不能仅记物品名 |
| permissions | 稳定许可 ID 与授权 NPC；grantPermission 是明确确认后的效果 |
| dialogues | 条件分支按从上到下匹配，节点引用 nodes；lines 为剧情正文，optionalFollowup 为可选追问；取消效果为空 |
| stories | storyId、npcId、title、summary、sections[{id,title,paragraphs}]、unlockQuestId、contentVersion=2、contentType、creationLabel、sourceNotes |
| codex | 标题、正文、文化类型、sources[{title,url}] 与来源边界；从剧情稿提取，未在本步重做历史考证 |
| decorations | 顶杆、两根桥上接应绳、岸上纤绳为独立 prop ID，collectible=false，不引用任务实例 |
| scenery | 货堆/工具架预留摆位和现有布铺对应关系；状态明确待复用/待补资产，不虚报已建成 |
| interactionContract | 距离、高差、同层、视线、实时实体坐标的后续接口约定；本步不实现交互机制 |
| routes | 点序列是推荐步行路径，非强制收集顺序；estimate 以原普通行走速度 2.7 计算 |
| surveyViews | 为验证用的观察站位和现有相机参数，不覆盖游戏默认相机 |
| shipRoute | 临桥→止进→等待→通过；止进和等待连续且当前重合；候选状态不能作为演出已验证的依据 |

对话条件白名单：always、questCompleted、questAccepted、questReady、instanceCollected、hasPermission。
效果白名单：grantPermission、acceptQuest、completeQuest。此处仅声明数据，不执行授权、扣物、奖励或存档写入。

支线匹配顺序：completed → collected → permitted → accepted → first。老周：completed → ready → active → available。三件物品不限收集顺序，允许先收后接。四篇故事均绑定唯一任务完成解锁，阅读是可选项。

校验覆盖重复 ID、锚点数值、地面/碰撞、实体/资产/物品/权限/故事/任务引用、未知条件与效果、对话节点空文案、故事正文与来源、演出道具不可拾取，以及推荐路线经过原 moveActor 后能否到达。脚本还检查本地资产存在。

开发入口：`http://127.0.0.1:5179/?test&hongqiao`。普通 DEV 页面不显示测量标记；生产构建剔除测量模块。当前共享工程另一个任务的 Step 4 功能可能仍在普通页面出现，不属于本步调试层。

调试 NPC 外观为现有群众原型，无专用姿势；NPC/物品标签、脚圈、路径线可用右上角按钮隐藏。使用现有 `__qingming.setActor/setView` 做观察起点定位；真正路线验证由键盘输入完成。`__hongqiao.measure(x,z)` 射线读取真实城市网格的节点名和交点。
