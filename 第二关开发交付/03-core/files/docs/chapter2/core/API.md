# 03 共享核心交付 · 契约 1.0.0 / schema v3

这是真实服务与 reducer，不是钱包替身。状态属于一个完整虹桥快照：根 inventory 继续承载数量，travel.instances 仅承载唯一实例。原四人三物、权限、虹桥终态、四篇故事和阅读域保留，C2 使用独立 travel 阅读域。正式 key 不变。

## 创建及接入

独立调用：`import {createSharedService} from './src/chapter2/core/service.js'`。传入 `storage`（getItem/setItem）、`ports.getFrame`、02 的 anchors 数组或 `{anchors}`、01 的正式 content。可选 now/seed 用于可重复测试；正式默认使用本地 Date 与 crypto 随机值，不读客户端 payload 的钱、精力、结果或墙钟。配置导出 configuration 就是冻结契约，不新增依赖。

既有虹桥运行时应继续使用一个 createProgressStore 实例，并加入 chapter2 参数；把这个实例通过 `asSharedService(store)` 适配后交给所有 C2 模块。适配器不新建存档、不复制 reducer。旧运行时 getState 返回可独立修改的副本，旧 retrySave 返回 boolean；C2 适配器 getState 深冻结，retrySave 返回 DispatchResult。这避免旧 DEV 书页修改状态副本的用法与 C2 不可变快照互相影响。

```js
// 由00/10改src/hongqiao/runtime.js，03未修改它。
const store = createProgressStore({
  config, storage,
  chapter2: {ports: chapter2Ports, anchors: measuredAnchors, content: chapter2Content},
});
const sharedService = asSharedService(store);
// 当前runtime内所有HQ组件仍用store；所有C2组件用sharedService。
```

主控需要改动的旧文件：src/hongqiao/runtime.js（参数与同一个 store）、src/main.js（测量锚点/内容与D区装配、每帧tick、输入锁/相机/安全回返）、公共progress/book入口（UI调用此 service，不写库存或 localStorage）。这些均只提供接入建议，没有越界修改。

`ports.getFrame()` 必须返回即时 regionId、actor{x,z,height,layer,mode}、visible、focused、operative。交易/阅读确认锁下 operative=false 正常；可达业务仍要求 visible/focused、D区、同层、水平2米内、垂直0.7米内。进入允许当前 frame 为C区或D区，但状态必须从C进入。缺失或null锚点、无人物 frame 均拒绝 not-reachable。正式可达结论须02/10实走。本服务不改玩家位置；travel.regionPositions.region_d 记录前台实际D区位置，safeAnchorId用于主控选择安全回返，C区返回继续使用[0,.94,35]，不把D区坐标套入C区。

## 调用和错误

除 tick/readStory 外，先 createTransactionId()，再 dispatch({type:'c2/动作',transactionId,payload})。一次点击只分配一个ID；重复回调、重试须复用。参数外形全部依contract.actions。

成功 `{ok:true,changed,saved:true,transactionId?,duplicate?,data}`。相同ID同参数（忽略对象键顺序）返回第一次已保存结果，changed=false、duplicate=true；参数不同 invalid-action。最近256笔之外但低于已提交高水位的ID报 duplicate-transaction。分配但未提交编号可以跳过，后续高编号提交后旧编号不能再补用。客户端伪造未分配ID、外存档epoch、非安全整数序号拒绝。

失败 `{ok:false,changed:false,saved:false,error:{code,message,retryable},transactionId?}`。业务拒绝的 saved=false 只描述该动作未成交，不表示之前的快照丢失；UI可另看 getStatus()。主要代码：chapter-locked/chapter-not-entered、not-reachable、invalid-quantity、insufficient-coins/energy、not-owned/protected-item/wrong-shop、out-of-stock/stale-offer、activity-busy/cast-pending/unknown-cast、repair-not-ready/reward-already-chosen、quest-not-ready/story-locked/invalid-position、relief-not-eligible、duplicate-transaction/invalid-action、save-pending/save-failed。具体失败信息来自 error.message，UI应直接显示；失败不发布成功订阅事件。

subscribe/subscribeWorld 返回注销函数。C2 更新顺序：复制完整状态→结构/业务校验→账本与结果→备份旧完整快照→写一个新完整快照→读回一致和解码确认→发布。旧HQ动作维持世界先消失、保存失败仍保留本页进度和通知的既有行为。不能同时创建HQ与C2两个独立store写同一个key。

## 保存失败和恢复

失败的 C2 候选保留在本页 `getPendingSnapshot()`，已提交 getState 不暴露半成品，getStatus 明示失败。新C2事务和旧HQ变更阻止到重试或取消；retrySave() 使用原候选及原ID，只发布一次。未保存钓获不允许下一杆。cancelPendingSave() 必须把此前已提交快照写回并读回确认后才解除阻止；回滚失败继续保留候选，不假称取消成功。页面被关闭时无法承诺内存候选跨崩溃保存；已写下但读回失败的完整候选可能在重载时成功恢复，不会凭同一事务重复领取。UI不能把 error 当成再次生成新ID的理由。

v1/v2升级到v3时备份原始 raw，而不是升级后的重新序列化版本。12份保留样本的结果见migration-report.json。P0真实浏览器样本是自动化所属origin，历史样本原来源保留；未读取用户日常个人存档。旧playing开场按原有恢复规则转为seen，避免重载后卡在遗留演出；这是预期恢复，不是清档。迁移不初始化C2、不发8文/80精力。

损坏主档→完整backup→修复主档；坏raw保留corrupt键。主/备皆损坏不写默认档冒充恢复，错误提示保留。未完成钓杆刷新/失焦取消，保留已扣4及原seed/result到lastCast；未完成维修保存步骤并释放18预留，current不增加，重新begin再预留，completed不回滚。

## 玩法精确语义

- 首次正式进入检查hongqiao_01 completed、endingPending=false。只首次发8文/80精力。C区不扣C2精力，本轮禁止进入E区。
- 教学借唯一钓竿和一份基础饵，基础饵免费持续可用，不另做消费软锁。未教学只能教学；教学caught保鱼。固定token支线须接受且教学完成；故事唯一物永不随机掉落，已取得后不能重领。
- startCast产生并保存seed与resultItemId，扣4；resolve只接受caught/lost/cancelled。lost/cancelled不退4，lost不发奖；救急杆lost按简易成功保鱼，cancelled仍放弃。只有成功normal/simple收杆消费珍稀计数，第20次成功保底，珍稀清零。教学/token/relief以及失败不消费珍稀计数。
- begin维修预留18（current包含预留），活动中暂停自然衰减，钓鱼/交易不得并行。四步顺序提交，complete一次扣18。cancel保留步骤释放预留，不增加current；现金16或铃二选一。现金分支铃20文一次出售；实物分支不再售另一只铃。
- 所有收入先还4文饭债。余额<4且可用精力<4、无债、已有借竿允许赊蒸饼+30，第一杆强制救急mode保鱼。已有债且精力<4可整理渔具直接还债，钱包不增加，无债禁止免费差事。0精力仍可走路/交谈/阅读/交易；移动由主控，不设精力门禁。
- 鱼只卖渔夫，杂物/铜扣/解保护藏物卖掌柜。重复交易行拒绝，整笔校验后全成交；正安全整数数量、乘法总额和余额均检查溢出。借竿、第一关三物、木牌不可出售。物件默认保护且有未完内容持有条件时不能解除。
- 买入只能买唯一藏物，食物即食无可售库存。铃换杯限一次，铃故事resolved且明确解除保护、无未完持有条件，转移原铃实例。原购18/卖7等价差维持契约。回购按原售出总价（P0的明确优先规则），同店最近10笔，全数回购原实例；不可多领或重建实例，不增加首次收藏计数。普通售品的店铺持有量由仍可回购的原凭证行保管，没有远程NPC耗掉玩家留存库存。
- 正式故事规则从content.storyRules读取，known在获得实物时解锁，resolved需要条件及相应NPC可达；正式正文读位置/版本/段落都校验，尾段标read。缺少正式content时故事推进/阅读明确拒绝，不提供假故事。不要求读长文或凑全藏物通关。

## 两套时间

主控每帧只dispatch一次c2/tick，seconds只传当帧前台dt，operative必须考虑书/对白/交易/演出/修缮锁。服务同时核实 frame.visible/focused/operative。内部合并至约1秒保存一次（按传入dt累计，不用墙钟追扣）；暂停、其他事务、flush之前冲掉已累计前台秒数。真实隐藏/失焦tick应传seconds:0，防止把上一个长后台间隔当成前台dt。读取/确认/演出/离线/维修不扣精力。突然崩溃可能丢失不足1秒未checkpoint的自然计时，不产生物品/奖励复制。

在隐藏、离区、dispose、书页关闭时先调用flush()；隐藏tick会取消遗留活动并记录外部打断。flush遇save-failed应保留提示及重试按钮。state.chapter2.timing含firstOperativeAt、accept:<quest>、firstCatch、firstTrade、repairCompleted、rewardChosen、handoff、endingEnded与operativeSeconds。日期由服务本地ISO生成；必要阅读/补给/演出期间墙钟不扣掉。系统墙钟回退写clockAnomalies，不按异常钟差扣精力或宣称主线耗时；20分钟必须主控另做真人测量。

## DEV预览

`chapter2-core-preview.html?test&chapter2` 仅DEV可运行，固定隔离键qingming:dev:chapter2:core-preview，正式key不动。明确标记的完成HQ fixture只写隔离存档，测试锚点不是02实测。createSharedService默认不暴露restoreFixture；只有development且隔离key才保留。生产runtime原来DEV工具由主控继续遵循其既有门禁。
