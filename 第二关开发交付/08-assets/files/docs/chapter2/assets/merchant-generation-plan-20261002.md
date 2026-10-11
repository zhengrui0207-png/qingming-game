# 掌柜首件 Tripo API 制作方案 · 2026-10-02

用户已指定重要人物通过直接API生成；首件为asset_c2_merchant。最新01定稿是42岁的顾娘子，男性QMSH-08仅保留历史审计，不作为新输入。CONTENT_READY、SCENE_READY、CORE_READY现已为true；正式装配未完成。

用户已确认单件上限120积分、一次生成，不自动重抽。实际执行以merchant-execution-20261002.json为准；本文件保留获批请求方案，费用表为估算。

|阶段|直接API|参数摘要|预计积分|
|---|---|---|---|
|文生3D|POST /v3/generation/text-to-model|P1-20260311，20000三角面，detailed，PBR，固定texture v3.0|50–60|
|可绑定检查|POST /v3/animations/rig-check|生成任务ID|0|
|骨骼|POST /v3/animations/rig|v2.5-20260210，biped/mixamo/GLB；不兼容则停|25|
|动作|POST /v3/animations/retarget|rig任务ID，idle/walk，原地烘焙|20|
|合计|||95–105|

官网P1版本页detailed文生为50，旧计价表附加项口径可能为60；按上限预留，不把示例响应当统一价格。参考：[P1](https://developers.tripo3d.ai/en/models/p1)、[文生参数](https://developers.tripo3d.ai/en/docs/generation-text-to-model/p)、[计价](https://docs.tripo3d.ai/get-started/pricing.html)、[骨骼](https://developers.tripo3d.ai/en/docs/animations-rig)。

形象：成熟女性、实用发髻、低饱和绿/褐粗布衣、窄袖、布鞋；人物经历虚构，服式为待视觉审核的游戏方案，不宣称原画某人身份。双手空置，盏与铜铃分离建模，避免生成器物焊在手上的网格。

保留原贴图，近景版本至少2K，不将1K放大冒充2K。P1成功不代表清晰度通过：四面脸、手、袖、发髻，idle/walk完整循环、脚底、近景辨识和实景镜头另验。顾娘子拾盏、转盏及辨物动作本地专门制作，不能用idle称作已完成。角色稳定ID不变，正式索引由主控验收后更新。

交付位置：public/assets/chapter2/characters/asset_c2_merchant/v1/，保留raw/Draco GLB及版本、输入哈希、任务链、实际扣费与预览。未知提交不重新POST；只续查原任务。当前taskIds为空、已花费0。

英文输入：

```text
Full-body game character, Gu Niangzi, a fictional 42-year-old Chinese woman running a modest general-goods stall in Northern Song inspired Bianjing. Mature natural facial features, clear eyes, calm brisk expression, dark hair gathered into a simple practical bun. Muted dark green modest wrap-front robe with narrow sleeves, plain brown cloth outer layer, simple fabric waist tie, long practical skirt and cloth shoes. No royal costume or costly jewelry. Relaxed neutral A-pose with both empty hands clearly separated from body, five fingers on each hand, stable planted feet. Single anatomically correct figure; front face only on front, hair bun on back. Restrained semi-realistic low-poly PBR style matching the existing Qingming game, readable face and cloth seams for close dialogue shots. No abacus or ceramic cup fused into hands; props will be separate local assets.
```

完整逐阶段请求和哈希见同名JSON。
