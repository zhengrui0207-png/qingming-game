# 第二批人物 Idle/Walk 交付 · 2026-10-03

本轮按工程中明确命名的第二批生产清单 **QMSH-07～16，共10位** 执行；范围已在工作消息中说明。它与第二关四位核心NPC身份清单是两套ID。当前顾娘子 `asset_c2_merchant` 未包含在这批十位中，仍没有idle/walk。不得用历史男性QMSH-08冒充顾娘子完成。

本批十位原本已有内嵌 Idle/Walk，复用最新版本地修复成品，未重新生成外观或重做已有合格动作。已交20份raw/Draco GLB、每人manifest、40张两种格式的Idle/Walk四面截图、四张总览、独立骨骼包装模块和实际浏览器验证报告。**IDLE_WALK_READY=true（独立预览）；ASSET_AUDIT_READY=true；第二关ASSETS_READY=false。** 不更新正式索引、公共status或acceptedVersion。

|人物|实际引用三角面|骨骼|Idle秒|Walk秒|
|---|---:|---:|---:|---:|
|QMSH-07 随行仆役|18937|51|4.0|1.6|
|QMSH-08 店铺掌柜|19886|76|4.0|1.8|
|QMSH-09 粮商|18857|53|4.0|1.8|
|QMSH-10 香料商|18824|83|4.0|1.8|
|QMSH-11 绸缎商|18574|83|4.0|1.8|
|QMSH-12 货郎小贩|19664|81|4.0|1.8|
|QMSH-13 卖杏花枝的|17854|62|4.0|1.8|
|QMSH-14 卖黄胖的|19357|70|4.0|1.8|
|QMSH-15 卖野药的|17824|65|4.0|1.8|
|QMSH-16 酒保|18682|70|4.0|1.8|

每人保留三张原生4096×4096 PBR贴图及已有职业动作。20份GLB合计86,626,092字节；这是保留清晰度的制作交付，不能把十位同时使用4K贴图当成性能验收通过。游戏的纹理档位/LOD由主控实测接入后决定，本轮不改原已验收资产。

## 来源与费用

源清单：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game/output/characters-45/batch-2/free-repair-v2/交付清单.json`。原始任务、绑定与修复来源均记入版本manifest；所有20份资源的SHA256与该清单逐份核对一致。新任务0、新费用0积分，没有触碰API Key或API账户，也未重复提交付费动作。

动作来源均为此前逐角色编排/修复并烘焙的真实骨骼动画，不能称本轮新产生的Tripo预设动作。QMSH-10/11采用本地拟合骨骼，其Tripo免费绑骨预检未通过的历史结论保留。两位当前Idle/Walk已完成真实蒙皮循环复核；完整手指独立权重、绸缎展开等职业接触动作仍未完成，不提升为整体人物严格验收通过。

## 可审查文件与使用

资源：`public/assets/chapter2/characters/<QMSH-ID>/idlewalk-v1/model.raw.glb` 与 `model.draco.glb`。模型本体原字节保留；克隆、尺寸、朝向、落地只在 `src/chapter2/assets/batch2.js` 包装节点处理。包装使用SkeletonUtils.clone和独立AnimationMixer，根节点可由游戏定位，默认X前向转游戏+Z。全模型归一到1.78m（QMSH-13为1.68m）；若道具高于人体，接入时应以人体标定复核，不能直接当成已测的NPC身高。

```js
import { batch2File, createBatch2Instance } from './src/chapter2/assets/batch2.js';
const gltf = await loader.loadAsync(batch2File('QMSH-10', 'draco'));
const npc = createBatch2Instance('QMSH-10', gltf);
scene.add(npc.root);
npc.play('Idle'); // 行走时 npc.play('Walk')
// 每帧 npc.update(dt)，离开时 npc.dispose()。
// 已加载网格/贴图共享；全部实例结束后由加载资源的拥有者释放。
```

预览：`http://127.0.0.1:5288/src/chapter2/assets/preview.html?asset=QMSH-07&variant=draco`。资产下拉菜单可切全部十位，动作菜单可切Idle/Walk，按钮可切近景/跟随距离。顾娘子预览路径与原文件继续保留。

## 实际验证

在自己的副本运行 `npm run dev -- --port 5288 --strictPort`。实际使用已运行的本副本5288服务，无重装依赖。

- 20份GLB逐个运行标准技能 `check_glb.py --max-triangles 20000 --require-character`；Draco另加 `--require-draco`：20/20结构通过。结果见 `batch2-idlewalk-structure-results.json`。
- `python3 docs/chapter2/assets/verify-batch2-idlewalk.py`：真实Playwright浏览器解码20份GLB，40个idle/walk循环各61帧取样、主要蒙皮顶点确实移动，克隆骨骼/骨架对象独立，另一个克隆无位移。包装实际9个关键相位×四个朝向检查；最大脚底偏移 0.015005m（阈值0.04m）。全部通过。
- raw/Draco的三角面、材质、关节数、动作名/时长/通道一致；逐轨道关键帧值精确一致。40个循环的首尾旋转差小于0.01度、平移差小于1e-5，根节点无平移漂移。见浏览器汇总与loop结果。
- 首次验证曾错误比较raw/Draco稀疏顶点序号的位移最大值。Draco会重排顶点，序号不可对应，导致比较误报。已修正为全动画曲线精确比对和真实整网格脚底范围比对，并完成包含新包装模块的全批浏览器重跑。`--reuse-captures`仅复核已保存的实测结果，不产生新的浏览器证据。
- 已检查Idle与Walk四面截图：未见明显上身塌陷/模型爆炸。完整布料交叠、职业道具手指接触与真实D区环境仍需主控近景验收。没有真人试玩证据或正式场景帧率结论。

## 未覆盖与修复方案

1. QMSH-10/11整体骨骼与职业动作仍待修正：按实际手掌/指节补独立权重并检查持物接触；绸缎展开需分离布件后单独制作。此次只完成并复核基础idle/walk。
2. 第二关四位核心NPC尚未全部交付适配身份的外观。顾娘子独立API首件的动作失败记录仍由原merchant交付说明管理，不能因为本批通过而修改它的完成状态。
3. 没有更改第一关、main、公共progress、依赖、正式资产索引；无线上发布。正式ASSETS_READY须主控实景验收后更新。

文件与基线校验值：交付根 `batch2-idlewalk-files-20261003.json`，资源/源码在 `files/` 按相对路径交付。
