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


---

# 08 · 顾娘子 Tripo 首件交付 · 2026-10-03

已按用户授权通过直接 Tripo V3 API 生成顾娘子外观，稳定ID `asset_c2_merchant`，NPC `npc_c2_merchant`，42岁杂货铺掌柜。一次外观生成，无重抽；最终本地候选包含原生4K PBR、52关节骨骼、raw/Draco GLB、分离贴图、四面及面部近景。**没有idle/walk，ASSETS_READY=false，不能更新正式acceptedVersion。** ASSET_AUDIT_READY是此前主控接收的审计状态，不能代替正式资源验收。

## 费用与任务

用户确认上限120积分；实际净扣费100，未用20；账户3880→3780，冻结0。API Key仅在本机配置加载，没有进入浏览器/交付/聊天。

|阶段|任务ID|结果|费用|
|---|---|---|---|
|P1文生外观|f53a882c-77d3-43ad-a9aa-dbee3687de01|success|50|
|可绑定检查|ce84ff78-1cf2-46da-bb43-0618715e2a34|success / biped|0|
|Mixamo骨骼|fe67275e-47a2-44f2-9155-e31f6b70d897|success，保留历史版本|25|
|双动作①|a20516b5-db75-4d0a-bd7b-fa0e9994fa08|failed / 1004|无净扣费|
|Tripo骨骼补救|d14c2c53-afb7-4a81-b23c-db9e314c1c73|success，最终候选使用|25|
|双动作②|4be183de-a3b3-4493-8e4f-de0109cd4297|failed / 1004|无净扣费|
|单段idle|21fb3fce-be32-4c3d-8360-fb2eac07c5d9|failed / 1004|无净扣费|

失败任务未返回credits_consumed；“无净扣费”依据官方失败退款规则和各次余额/冻结核账，不伪造服务端扣费字段。已关闭新的付费提交。任务/阶段/实际请求与哈希见 `files/docs/chapter2/assets/merchant-execution-20261002.json`；未知提交绝不盲重发，已知下载使用原任务ID。

原Mixamo方案与官方“Only tripo is supported for retarget”限制冲突，因此在总上限内换Tripo规格。换后双段、单段仍报参数无效；根因未由API进一步回显，不能宣称平台动作修复成功。rig请求的model仍为v2.5-20260210，但返回input没有回显版本，不宣称已经证明执行版本。全过程创建/查询仍为V3，V2文档只用来核对限制。

来源：[V3 rig](https://developers.tripo3d.ai/en/docs/animations-rig)、[详细兼容限制](https://docs.tripo3d.ai/animation/rig-v2-5-20260210.html)、[retarget](https://developers.tripo3d.ai/en/docs/animations-retarget)。

## 产物与接入范围

`files/public/assets/chapter2/characters/asset_c2_merchant/v1/`：`model.raw.glb` 9,594,448 bytes；`model.draco.glb` 8,419,572 bytes；18,361三角面、1材质、1skin、52关节、0动画；`textures/`保留最终GLB原生4K颜色/ORM/法线图；manifest记录候选版本v1、acceptedVersion=null。阶段原件也保留，未覆盖第一关或阿青。

`files/src/chapter2/assets/merchant.js`提供独立骨骼实例与外层尺寸/朝向/贴地包装，身高1.62米，朝向+Z。原始Tripo模型前进轴+X，包装旋转Y=-π/2。本体骨骼与bind矩阵不改。初次包装发现下半身沉地，已用updateMatrixWorld同步attached skin、在包装后重新测量并修正fit节点；raw/Draco四实例实测脚底≈0、身高≈1.62。没有把玩家锚点Y=.94当作NPC脚底，也没有在GLB烘焙锚点。

独立预览：`http://127.0.0.1:5288/src/chapter2/assets/preview.html?asset=asset_c2_merchant`；Draco追加`&variant=draco`。面部近景按钮用于检查纹理。沿用主工程基础光照、曝光1.08、FOV48；4米近景/10米跟随测试，面部检查镜头1.05米。未包含真实D区遮挡/AO/水体，不是第二关正式整合或真人试玩。

截图：`files/public/assets/chapter2/previews/asset_c2_merchant/final-four-views.png`、`final-portrait.png`。角色双手空置，盏/铜铃应另行握持，不能把A姿态称作专用动作。近景面部可辨识，极近景明暗略不均匀；远距离脸部细节受屏幕像素与镜头限制，4K贴图不等于任何镜头都清楚。

## 实际验证

在唯一工作副本执行：

```sh
npm run dev -- --port 5288 --strictPort
node --check src/chapter2/assets/merchant.js
node --check src/chapter2/assets/preview.js
node /Users/zhengrui/.npm/_npx/d659fe5fabadba55/node_modules/@gltf-transform/cli/bin/cli.js draco public/assets/chapter2/characters/asset_c2_merchant/v1/model.raw.glb public/assets/chapter2/characters/asset_c2_merchant/v1/model.draco.glb
node /Users/zhengrui/.npm/_npx/d659fe5fabadba55/node_modules/@gltf-transform/cli/bin/cli.js validate public/assets/chapter2/characters/asset_c2_merchant/v1/model.draco.glb
python3 /Users/zhengrui/.codex/skills/qingming-tripo-standard/scripts/check_glb.py public/assets/chapter2/characters/asset_c2_merchant/v1/model.draco.glb --max-triangles 20000 --require-draco --require-character
```

Draco工具版本4.5.0；仅做draco压缩，无重拓扑/减面/贴图放大。格式校验0 errors、2 warnings（运行时切线、skinned mesh非root），不能把它称作完整配方通过。配方检查明确FAIL：缺非空idle/walk。真实Three浏览器分别解码raw和Draco，面数/skin/材质一致，52根骨及Skeleton对象独立；改动第一克隆后蒙皮顶点位移0.025，第二克隆位移0；四角度实际脚底与身高校验通过。检查报告在`files/docs/chapter2/assets/merchant-browser-*-20261003.json`、`merchant-verification-20261003.json`及对应校验日志。

本副本21个冻结文件哈希未变；本轮没有改主工程、main、相机/运动、progress、依赖或正式资产索引。未运行原整关build或旧全量主工程基线脚本；主控已有合法合并，不能用旧快照指认它。

## 未完成与修复方案

- idle/walk及完整循环服装/脚底验收：API三次明确失败后停止。下一步本地Blender按本模型实际原生骨骼层级制作真正idle与脚底IK步态，审长裙权重；或向平台排查已保存任务。不盲重绑、重抽或扩费。
- 拾盏、转盏、辨物动作：真实本地制作，独立盏挂点及手指姿态单独验收；不以idle替代。
- 宋代服式与42岁年龄辨识仍属美术候选审查，不把文生成功当历史考据通过。
- D区实景相机、遮挡、肤色和玩法握持：由主控按测量地表挂接后真实验收，正式索引仍不更新。
- 参考设备性能：未测。三张4K RGBA纹理含完整mipmap约256MiB，Draco只压几何；保留4K源并按实测评估独立运行档。
- 其他重要NPC（鲁七、石伯、王小满）已核对最新ID/身份，未纳入这次掌柜单件预算，未付费生成。本轮其他道具仍以此前审计/方案状态为准。

当前增量文件及基线校验值：`merchant-files-20261003.json`。根`files.json`已合并本轮文件，所有交付副本逐字节及SHA校验；10月1日审计归档为`audit-handoff-20261001.md`和`audit-files-20261001.json`。
