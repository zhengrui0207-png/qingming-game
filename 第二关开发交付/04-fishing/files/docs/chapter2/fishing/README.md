# 04 河边钓鱼交付与装配

2026-10-02；契约1.0.0；基线2026-10-01-core-ready-v1。

本模块接收真实03核心、正式01内容和02实测岸边锚点，完成两处钓点、抛收分件、咬钩提示、普通/简易收杆、教学保鱼、固定木牌、自动收藏、保存失败重试和取消恢复。独立预览可操作；正式第二关入口尚未装配，专用握杆姿势与正式钓具/所得模型尚未验收。

## 主控装配

```js
import {create as createFishing, recoveryAnchor} from './chapter2/fishing/index.js';
const fishing = createFishing(context, {
  anchors: measuredAnchors,
  content: acceptedContent,
  container: document.body,
  // 可选：返回右手世界坐标、已规范尺寸方向的共享模型。
  getHandPosition: () => handWorldPosition,
  getModel: itemId => loadedModels.get(itemId),
});
// 主控每帧发一次核心tick，再更新模块。模块不自行tick。
fishing.update(dt, frame);
// 离开D或演出接管时取消；结束装配时销毁。
fishing.cancel('region-leave');
fishing.dispose();
```

context完整类型来自只读contracts/types.d.ts：scene/world/service/baseURL/toast/registry/locks/gate/camera/ports。必须传现有唯一服务的适配，不另建正式钱包或写localStorage。独立预览createSharedService仅服务于隔离DEV键，不能把它第二次挂进正式main。共享服务返回成功后才展示所得；仅使用acceptQuest（由NPC负责）、startCast、resolveCast、retrySave，不在前端随机或加物。

模块锁、输入与相机owner统一为c2/fishing。模块注册anchor_c2_fishing_a与anchor_c2_fishing_b；02场景不得同时注册这两实体。合法地面/高度/距离/区域由模块和核心各自核对。E用现有交互注册；confirm/cancel由ports.input分发；gate只读按住的Space/KeyE/Enter。主控只向最上层锁所属模块分发语义键；Esc松开前不得再次激活钓点。

camera.borrow必须保存完整原相机状态（包括真实main的targetDistance、overview）；release恢复并按当前窗口更新aspect。独立预览只保有自己的yaw/pitch/distance/focus，不能把预览适配当成正式main恢复已验收。一个连续钓鱼会话只借一次镜头；“再钓一杆”复用租约。演出取得新租约前先取消并恢复钓鱼，旧租约不能覆盖新镜头。输入锁仅释放自己的句柄。

刷新前pagehide尝试取消并flush；异常关闭无事件时由真实核心recoverActivities取消已保存pending，不重抽、不再扣4、不发未结算物。主控载入后先调用recoveryAnchor(snapshot, measuredAnchors.anchors)，将同一player_scholar放到对应岸边standingPosition，再恢复普通跟随相机，随后mount。正常浏览器刷新可能在pagehide已取消，recoveryReason不再为reload：可用导航类型reload及lastCast.outcome=cancelled/pointId恢复对应岸；独立预览已演示这个分支。不要恢复上页被演出占用的镜头。

## 流程与数值

准备→抛竿1.6秒→候鱼8秒→咬钩→提线3.5秒→保存→收上岸1.2秒→结果。及时收杆约14.4秒；文字阅读、等待玩家点击会延长实际墙钟。普通模式咬钩宽限7秒，张力极端持续1.5秒才失败；简易模式咬钩无催促倒计时，点击一次自动收杆。两模式共用核心结果池。

每杆4精力，仅核心startCast保存成功扣一次；失败/取消不退且不重复扣。竿/饵通过鲁七免费借用；不足4不抛。教学首次普通鱼；固定木牌仅B钓点已接受支线可选，唯一实例；normal/simple成功计入核心珍稀保底，教学/救急/固定木牌不计。救急保鱼由服务授权并强制简易收杆。保存失败保留原候选，停止下一杆；重试由核心retrySave处理原事务。取消后的迟到重试不重开窗口；已成功保存的鱼不因离开回滚。

## 真实资产与动作需求

阿青沿用既有song-scholar-v2-animated.glb，身份仍为初入汴京的书生。专用手臂握竿/收线姿势没有实现或验收，当前默认挂点约在胸前，不能宣称人物已正确握持。主控与08/09须提供右手世界坐标和专用姿势；不要改变既有walk/idle。

竿是四段可动竹节，局部+Z指向竿尖，总长2.72米；根在握持点。线为33点动态曲线；浮子有抛入轨迹、候鱼晃动、咬钩下沉、提线与收回，咬钩有金色水圈、文字和合成短音。静态竿不等于角色动作完成。

getModel接受item_c2_basic_rod、float（表现部件名，不是公共物品ID）、核心返回的鱼/杂物/珍稀/木牌ID。传入模型应先规范尺寸、轴向和根点；当前不自动猜测GLB方向。所得现用程序几何替身，未新生成Tripo资产。模型克隆借用提供方GPU缓冲，模块只销毁自己的13几何/8材质与新增对象，不dispose共享资产。合成提示音不宣称是历史环境音或正式音乐。

## 预览与验证

在本副本运行：`npm run dev -- --port 5284 --strictPort`。打开`http://127.0.0.1:5284/chapter2-fishing-preview.html?test&chapter2&session=fishing-review`。先在DEV定位鲁七，点“向鲁七借竿”，回到任一岸边按E。只有import.meta.env.DEV及两参数同时成立才启动；只用qingming:dev:chapter2:<session>。HQ已完成fixture仅用于这个隔离键。不得清正式键或把fixture当真人通关。

右上工具的定位是取景传送，不能作为连续步行证据；强制种子只传给真实服务，仅为DEV样本，不代表自然掉落频率。预览收藏页只读展示核心收藏，完整书页由07提供；NPC商铺卖鱼由05提供。本模块没有以替身商铺冒充整合。

验证日志、脚本和截图在本目录；readiness.json说明就绪范围，browser-summary.json记录实际检查及未覆盖项。第一关和公共冻结依赖完整回归通过，也不能代替正式第二关整合与真人试玩。无新增依赖、无Git初始化、无发布。
