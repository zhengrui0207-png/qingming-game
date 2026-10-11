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
