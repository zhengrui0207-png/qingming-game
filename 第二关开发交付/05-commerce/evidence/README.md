# 05 商铺、补给与精力界面

基线：2026-10-02-core-fishing-ready-v2；契约：1.0.0。

实现文件仅位于 `src/chapter2/commerce`，独立入口为 `chapter2-commerce-preview.html`。直接调用已验收的 CORE_READY 服务；没有第二份钱包、库存、精力计时器、价格表或 reducer。

## 挂接

```js
import {create as createCommerce} from './chapter2/commerce/index.js';
const commerce = createCommerce(context);
// context.service 必须是与钓鱼/修缮/风物志共用的同一个服务。
// 每帧（按 P0 的 visible/focused/operative 定义）：
commerce.update(dt, frame);
// 离开区域或演出接管：
commerce.cancel('region-leave');
// 卸载（可重复）：
commerce.dispose();
```

必需端口：`service`、`world`（D区碰撞覆盖层）、`registry`、`locks`、`camera.borrow`、`ports.getFrame`、`ports.input.subscribe`。可选 `toast`、`ports.navigate(anchorId)`、`ports.openBook`。沿用 P0 相机租约，不修改镜头姿态；取消/关闭释放自身租约，恢复借用前完整视角。模块只读取 gate，不清除全局按键状态。

默认注册三项：`npc_c2_fisher`→`shop_c2_fish`→`anchor_c2_fisher`；`npc_c2_merchant`→`shop_c2_general`→`anchor_c2_merchant`；`npc_c2_food_vendor`→`shop_c2_food`→`anchor_c2_food_vendor`。站位直接读取实测 anchors.json。进入与确认都用现有 `canInteract` 检查层级、步行状态、距离、遮挡和 `moveActor` 可达；CORE_READY 再核实服务距离与活动条件。

若 10 已注册三个 NPC 的正式对白，创建时传 `{registerNPCs:false}`，对白中 `openShop` intent 交接调用 `commerce.open(shopId,tab?)`，先释放对白锁。不要再注册同一 NPC，亦不要把灰盒 scene 的通用 anchor 注册与商铺 action 并存。全部交互依然面对面；公开 open 接口不能绕过距离/锁/镜头检查。

输入仅分发给最上层 `c2/commerce` 锁：`cancel` 关闭，`confirm` 只在待确认页提交。宿主的 Escape 必须优先于 INPUT/SELECT 的一般输入过滤；Enter/Space 让原生聚焦按钮处理，避免同一个按键又走 semantic confirm。Tab 焦点环在局部 dialog 内。主控继续提供唯一的 core tick；商铺持锁时 operative=false，从而暂停自然衰减，阅读/演出/失焦暂停仍由宿主与共享服务负责。

HUD 显示已保存余额/精力/欠账，低于20提供饭铺导航；欠账且不足4显示鲁七偿债差事导航。还债为 core 的卖物收入先抵欠账与 `settleReliefWork`，契约没有另设手动 payDebt 动作。不要在主控另扣一次债款。

## 事务及失败

预览金额和恢复量只描述当前快照，成交仍由核心验证。一个报价分配一个幂等 ID；取消报价不 dispatch。成功进入收据页，必须显式返回铺面才能再买卖，连续点击不会重发。

保存失败不显示乐观收入。核心保留候选进度，菜单和 HUD 明确提示“本页保留，请勿刷新”，只调用同一服务 `retrySave()`。关闭/失焦不取消已经确认的待保存交易；关闭后重试不会重开菜单。新交易在 pending 期间被禁用。模块不会自动 flush 或取消 pending，不接管其他模块待保存动作；主控重试/flush 时也须检查结果。候选仅在本页内存保留，刷新会丢失未保存候选，界面已明确提示，不能声称崩溃后仍能恢复未持久化结果。

错误显示 core `error.message`；验证失败留在确认页可返回，save-failed/save-pending 阻止新成交，成功后使用真实 core 收据。出售普通物不包含唯一藏物、借物或任务物；藏物需单独解除保护，再单独出售。回购取原凭证/实例，换给他人的铜铃不回购。

## 外观与边界

`wares.js` 可供 10 在 D 区挂接现有 `scenery/steamer.glb` 与 street-life 的 `pot`/`bowl` 克隆。只共享源网格/材质，不搬旧铺面，不复用第一关 NPC。源资产生命周期由宿主负责，`mountWares.dispose` 移除借用克隆并释放自建陈列架的几何/材质；不会释放源资产。

既有王家蒸作候选2/5/10与茶坊0/7/16均在本轮D范围外，旧店保持原位置。D使用02实测饭铺、杂货铺站位；蒸笼、茶器形制复用不能证明其对应原画店铺身份。预览NPC仍是已标注的灰盒，正式人物模型由08/10接入。未扩建E或其他区域。

## 独立预览

在05副本运行 `npm run dev -- --port 5285 --strictPort`，打开：
`http://127.0.0.1:5285/chapter2-commerce-preview.html?test&chapter2&session=commerce-review`

同时要求 DEV 与 test/chapter2 参数，只写 `qingming:dev:chapter2:<session>`，不触碰正式存档。测试样本明确标注：通关前置/0钱0精力/95精力30文是隔离边界 fixture；三鱼、两种修缮报酬、故事阶段、买卖/赊食/回购都经真实核心动作。开发定位下拉是取景瞬移，不能当实走证据；`__commercePreview.walkTo` 使用已测路线、RAF 和原 moveActor 连续行走，单独记录证据。

该页面接通真实 core、fishing、D灰盒和已有阿青模型，不等于正式 main 装配完成或真人试玩。
