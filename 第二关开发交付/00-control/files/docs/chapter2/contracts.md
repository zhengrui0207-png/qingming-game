# 第二关 P0 冻结契约 1.0.0

2026-10-01｜真实源码在 `/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`。

## 可直接使用的文件

- `src/chapter2/contracts/index.js`：导入 contract、ids、itemDefinition、emptyChapter2Extension。数据深冻结；空扩展未进入第二关、余额和精力均0，不提前赠送。
- `src/chapter2/contracts/contract.json`：所有公共ID、数值、动作参数、区域/入口、错误码。显示名可润色，ID不随名字变化。
- `validate.js`：契约、动作、内容、锚点、扩展状态的语义验证器。验证结构/引用，业务权限仍由03服务执行，不能把通过验证等同于发奖成功。
- `types.d.ts`：共享服务、实例/收藏、交易凭证、时间记录、模块挂接与控制端口的可读取类型。
- `content.schema.json` / `scene.schema.json`：结构schema；跨引用和ready判定以JS验证器为准，不仅跑JSON结构校验。
- `docs/chapter2/templates/`：可复制草稿及合法动作例子。正文空、锚点null是明确缺项，不能作为内容/场景ready。

命令从各自游戏工作副本执行：

```sh
node scripts/validate-chapter2-contract.mjs contract
node scripts/validate-chapter2-contract.mjs content docs/chapter2/templates/content.draft.json
node scripts/validate-chapter2-contract.mjs scene docs/chapter2/templates/scene.draft.json
node scripts/validate-chapter2-contract.mjs extension
node --test src/chapter2/contracts/contract.test.js
```

实际内容/场景交付后增加 `--ready`，校验 `src/chapter2/content/content.json` / `src/chapter2/scene/anchors.json`。草稿模式通过不能宣布CONTENT_READY或SCENE_READY；人工仍须审阅考据与实际可达证据。

## 状态和完整快照

现有schema v2、键 `qingming:hongqiao:save` 与 `:backup`。03沿用src/hongqiao/persistence.js的真实存档入口，将c2动作委托到共享核心，并以兼容适配器保留全部第一关动作；不另建互相覆盖同一存档的服务。03实现v3：保留所有现有根字段及root inventory数量；追加travel和chapter2；第一关inventory借物保持原语义。只有唯一物品才建travel.instances；唯一物品数量与实例owned/borrowed同步，sold/bartered数量为0。实例永久ID不可回购重建；不得出现同一unique item的第二个实例。借用钓竿与第一关三物不可出售或换物。

普通鱼、杂物、旧铜扣数量仍进root inventory；每次获得同步更新travel.collection（首次日期、累计次数、来源）。卖掉、换掉不删收藏历史。食物购买立即吃，不进库存、不变可转售资产。三篇故事的章节ID/段落位置/内容版本另存travel，第一关storyReadingProgress、readStoryIds、四篇故事保留原样。

travel.transactions保存最近256个事务ID、指纹和结果及高水位。03补全saveEpoch（保存在完整快照中），构造 `c2:<saveEpoch>:<monotonicSequence>`，分配不代表已提交。一次事务必须复制状态、验证业务、更新数量/实例/钱/债/收藏/目标/凭证、写一次完整快照、读回确认，成功后才发布订阅。不得多个模块分写localStorage。失败不发布半成品；保留待重试动作，禁用新交易直到retrySave或取消失败候选，原存档仍可恢复。

相同ID+相同参数返回已保存结果，changed=false、duplicate=true；同ID不同参数报invalid-action；超出最近窗口但不高于已提交高水位报duplicate-transaction，不重新发奖。未提交的编号可以跳过，禁止已提交编号重用。03须证明旧档迁移、保存失败/恢复和重复点击；P0只冻结接口，不伪称业务已实现。

## 入口与回访

正式进入须hongqiao_01 completed且endingPending=false，主控在虹桥结束处接入口。第一次enterChapter2原子发8文/80精力并initialized=true；刷新、迁移、回访不再领。region_c关闭全部第二关精力扣除。leaveChapter2本轮仅允许region_c且anchorId为anchor_c2_entry（从D入口离开），再由主控返回第一关安全点；region_e为未来ID，在本轮应拒绝进入。城门前交付主线终点，不激活城内。C区安全返回坐标主控沿用第一关入口[0,.94,35]，不由D区锚点强行更换。

DEV直达须import.meta.env.DEV及?test&chapter2；仅使用 `qingming:dev:chapter2:<session>` 独立键，不能改正式存档或伪造其第一关通关。独立存档仍保留第一关字段结构，完成测试fixture须标来源。

D区11个锚点位置目前未实测；02负责灰盒测量、贴地、路径/遮挡/安全边界证据。入口、出口、NPC、钓点、修缮、交付和安全回返ID已经冻结；stage10才挂入正式场景。

## 动作职责与失败规则（03实现）

所有动作外形 `{type:'c2/...',transactionId,payload:{...}}`；公共参数精确见contract.actions。tick、readStory不要求外部事务ID，但仍由唯一服务保存，阅读可合并保存且关闭/离开时flush。除了这两类，UI先调用createTransactionId，只为一次点击生成一次，重试用同ID。

| 动作 | 唯一服务应执行的行为 / 主要拒绝条件 |
|---|---|
| enterChapter2 / leaveChapter2 | 通关门槛、一次性初始化、安全回返；chapter-locked、invalid-position。本轮不进入region_e。 |
| acceptQuest | 状态available→active；前置任务/人物已可交流；不能重置完成任务。首次接受quest_c2_fishing_intro时原子借给基础钓竿（唯一borrowed实例）与免费基础饵；不重复发。 |
| startCast | 核实D区、钓点距离/层级、无并行动作、足够精力；扣4并保存pendingCast（seed服务产生）。tutorial只允许教学尚未完成，relief只允许firstCastGuaranteed待消费；教学/救急保证鱼；token仅在固定支线条件成立，完成后禁重获。 |
| resolveCast | 客户端只报caught/lost/cancelled，服务依据已保存seed与mode决定物品；一次结算。lost仍耗4；cancelled不发物且不退4，避免刷重试。刷新/失焦取消遗留pending，已扣精力不再扣。成功normal/simple才累计珍稀保底；教学、token、救急不计。 |
| sell | 先检查所属店铺、全部数量/拥有/保护/任务需要；整笔成功或全不成交。鱼卖渔夫，杂物/旧铜扣/解保护藏物卖杂货铺；木牌、钓竿、虹桥借物不可售。先偿清debt再入钱包；生成凭证。 |
| buy / eat | 价格由配置读；服务验证库存、钱和条件。buy只用于藏物；eat扣钱补精力上限100，满精力不成交、不白扣钱。不能信任客户端价格。 |
| barter | 缺舌铜铃换青釉盏限1次，铃本关故事resolved且无未完持有需求；默认保护需玩家明确解除，盏不得已拥有/已售。交换移交铃同一实例、取得盏和收藏，钱不变。 |
| buyback | 原售出凭证，同一店最多最近10笔；只允许仍可回购且商店持有的物，按凭证原售出总价（不打折/套利），买回同一实例；重复凭证不能再次取物。 |
| begin / advance / cancel / completeRepair | begin一次预留18（current包含预留，其他行为可用current-reserved）；活动期间暂停自然衰减；四步按顺序且足额才complete扣18并释放预留；cancel原样释放不扣；刷新/失焦取消未完成维修、恢复预留，完整结算不回滚。 |
| chooseReward | 维修completed且未选，cash16或bell二选一；同次更新目标/奖励。现金分支后掌柜可售铃20，一次；不得白领另一支。 |
| handOffCargo / completeMain | 服务核实全部必做目标与真实交付锚点，结算一次并置结局pending。买齐三藏物、读长故事不在门槛里。 |
| advanceStory | 固定story/stage，按内容条件只能known→resolved；不能从UI直接解锁未得藏物。阶段条件由01交付、03读取。 |
| readStory | 必须已解锁，story/section/version存在且段落越界拒绝；全部阅读位置存travel，不碰虹桥已读。已读需正文尾段实际阅读确认，不由打开立即标。 |
| requestRelief / settleReliefWork | D区、coins<4且可用energy<4、无债才赊蒸饼+30/欠4；下一杆保鱼。已有欠债又耗尽允许渔夫免精力整理渔具，收入只偿债、钱包不增加；未负债不可无限领钱。 |
| toggleProtection | owned故事藏物可手动切保护；有任务需要或借物不得解除。解除保护不等于允许不合规交易。 |
| tick | 由主控真实dt/operative供给，不由小游戏计时器重复调用；自然衰减每90秒−1、不降负、不吃预留精力。 |
| ackPresentation | 演出或跳过同一确认，只改seen状态；奖励属于主线事务，不能漏奖或重发。 |

卖物、换物、买回有真实库存/实例检查。动作结构验证器不能替代这些业务条件。not-reachable由注入ports.getFrame与测量锚点决定；单元测试可使用明确fixture，但不能写成正式可达证明。

## 内容结构及允许分工

01复制content.draft.json填写四人介绍、4项任务、4目标、对白、三篇故事与来源。nodes为 `{id,text,choices:[{id,text,nextNodeId:null|nodeId,action?:{type,payload},requires?:Condition[]}]}`；public entryNodeId不变，其余节点以node_c2_开头且全局唯一。正文是sections数组（稳定id/title/paragraphs字符串数组）；不把正文藏在Markdown链接里。三个本关故事各有来历、人物经历和本关小结，续篇可选。来源有id/title/url/locator/kind，kind为primary/painting/research/fiction；historicalNote明确事实、解读和虚构。

条件kind为questStatus{questId,status}、goalCompleted{goalId}、storyStage{storyId,stageId}、itemOwned{itemId,quantity}、repairStatus{repairId,status}、rewardChoice{choice}。条件仅决定对白展示，最终业务服务再校验。01在content.json的storyRules数组交付：各story stable stage条件组合（all数组Condition），03加载，不新增任意执行脚本。需要新公共动作先在handoff提出契约改动，不自行发钱包。

02复制scene.draft.json测量，填写每anchor.position[x,y,z]/layer/surfaceEvidence；从entry到其余十锚点给真实waypoints和walkEvidence，记录boundaryEvidence及colliders。合同ready验证只证明结构齐全，截图/实走另审。

## 装配、输入、活动与相机

模块统一 `create(context)→{update(dt,frame),cancel(reason),dispose(),getState()}`，dispose可重复，释放自己的registry注销函数、UI订阅、锁、相机借用、音频和新增scene对象。03只负责service；00/10装配context，其camera/ports/input此阶段为冻结接口、尚未接入main。

沿用src/interaction/core.js真实registry与locks/gate。E触发注册实体，automatic地标仍走原逻辑；模块不创建window键盘/指针监听。局部按钮监听自行dispose。ports.input.subscribe由主控分发去重的confirm/cancel等语义键，仅最上层锁所属owner收到（owner用c2/<module>）；Escape取消后等按键松开，不能透传同一次按键重开。gate只读held/keys，不能清全局状态。locks.acquire返回幂等release，不能关掉别人的锁。

camera.borrow只有一个借用者，忙时返回null；先保存camera.clone、yaw、pitch、distance、targetDistance、overview、focus，再允许lease.setPose，lease.release逐项恢复并按现窗口更新aspect和投影。正常结束、跳过、Esc、失焦、隐藏、离区、dispose均恢复，和现cinema capture/restore一致。重叠模态不在未恢复时再采样相机。

ports.getFrame给actor、region、visible/focused/operative、wallNow。主控每帧只向service发一次tick；operative要求D区、可操作、聚焦可见、无任何书/对白/交易/修缮/演出锁。失焦不补算后台dt。精力0仍可走路、对话、交易和读书。

墙钟独立记录firstOperative、accept、firstCatch、firstTrade、repairCompleted、rewardChosen、handoff、endingEnded和外部打断；由唯一服务生成本地ISO时间，不准客户端伪造。第一可操作→首次交付包含必要阅读/补给/演出（保留墙钟，不因为暂停精力扣除而删去）；可操作秒数另列。通关可选长文不纳入主线必须时间。系统时钟跳变记录异常，真人20分钟结果在11实测。

## 变更与就绪

P0_READY只指冻结契约、基线和独立副本能供第一批开工。CONTENT_READY、SCENE_READY、CORE_READY、ASSET_READY均当前false。新增字段兼容可升1.0.x；破坏ID/动作/快照约定要升minor并给所有受影响任务迁移表，主控同步后开下一批。禁止各分支暗改同名contract文件。
