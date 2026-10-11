# D区资产逐项方案（审计版）

契约1.0.0；英文提示词仅供审阅，没有付费任务或新增模型。下列尺寸与预算是起测值，不是测绘史实。人物生成仍遵守P1默认20,000三角面；游戏现有LOD优先复用，未经评估不对带骨骼模型重拓扑。

|稳定ID|名称|分类|复用/修复决定|起测面数/贴图|候选尺寸m|参考/锚点|
|---|---|---|---|---|---|---|
|asset_c2_fisher|渔夫|local-modification|QMSH-21 / QMSH-23候选，需拆农具/牵绳并调服式；失败再考虑单个新外观|20000 / 1024|[0.6, 1.72, 0.5]|S03 / anchor_c2_fisher|
|asset_c2_porter|老脚夫|local-modification|QMSH-28；局部年龄、肩担握持调整，职业擦汗不是修缮动作|20000 / 1024|[0.6, 1.78, 0.5]|S08/S09 / anchor_c2_porter|
|asset_c2_merchant|杂货铺掌柜|reuse-candidate|QMSH-08，算盘可独立节点调整；身份由01审阅|20000 / 1024|[0.6, 1.78, 0.5]|S07 / anchor_c2_merchant|
|asset_c2_food_vendor|王家蒸作伙计|local-modification|QMSH-17茶坊伙计，保留围裙；壶盏移除/替换后再验证握持|20000 / 1024|[0.6, 1.78, 0.5]|S07 / anchor_c2_food_vendor|
|asset_item_c2_fish_a|普通鱼甲（鲫形候选）|missing-local-model|无独立鱼GLB；鱼种由01确认，优先Blender|1500 / 1024|[0.28, 0.13, 0.07]|S03 / 待02绑定|
|asset_item_c2_fish_b|普通鱼乙（鲤形候选）|missing-local-model|无独立鱼GLB；与甲区别体长、尾鳍及须|1800 / 1024|[0.38, 0.14, 0.08]|S03 / 待02绑定|
|asset_item_c2_junk_pottery|碎陶片|missing-local-model|简单曲面本地建；不挖改第一关陶器|200 / 512|[0.09, 0.025, 0.07]|S03 / 待02绑定|
|asset_item_c2_junk_wood|朽木小件|missing-local-model|本地木片，轮廓区别木牌|240 / 512|[0.16, 0.03, 0.06]|S03 / 待02绑定|
|asset_item_c2_junk_metal|旧金属件|missing-local-model|钝小铁片本地建，不做现代螺栓|300 / 512|[0.07, 0.02, 0.05]|S03 / 待02绑定|
|asset_item_c2_rare_copper_piece|旧铜扣|missing-local-model|可重复旧物；环扣形制待01确认|400 / 512|[0.045, 0.012, 0.04]|S03 / 待02绑定|
|asset_treasure_c2_marked_token|刻痕木牌|missing-local-model|两面不同刻痕待正文；不得预先刻编造文字|600 / 1024|[0.08, 0.014, 0.13]|S03 / 待02绑定|
|asset_treasure_c2_silent_bell|缺舌铜铃|missing-local-model|铃口中空无舌，悬环独立；故事断痕待01|1200 / 1024|[0.055, 0.07, 0.055]|S08/S09 / 待02绑定|
|asset_treasure_c2_celadon_cup|缺口青釉小盏|missing-local-model|开口真实壁厚，缺口可见，足圈；不做完好碗|1400 / 1024|[0.105, 0.055, 0.105]|S07 / 待02绑定|
|asset_item_c2_basic_rod|借用基础钓竿|missing-local-model|优先程序化竹杆/线；第一关竹篙只参考不替代|700 / 512|[0.03, 2.2, 0.03]|S03 / 待02绑定|
|asset_item_c2_basic_bait|基础钓饵|missing-local-model|小面团饵本地建；不添加消费玩法|100 / 256|[0.03, 0.025, 0.03]|S03 / 待02绑定|
|asset_food_c2_steamed_bread|蒸饼|missing-local-model|淡面色无夹馅横切；食物即时消费|400 / 512|[0.1, 0.04, 0.1]|S07 / 待02绑定|
|asset_food_c2_congee|粥食|missing-local-model|碗体/粥面分开，形制待01核对|900 / 512|[0.14, 0.065, 0.14]|S07 / 待02绑定|
|asset_food_c2_tea|茶|local-modification|QMSH-17手中杯只作参考，需独立茶盏|800 / 512|[0.1, 0.05, 0.1]|S07 / 待02绑定|
|asset_c2_float|浮子（本地美术ID）|missing-local-model|细木/芦苇浮子程序化，水面起伏交04|120 / 256|[0.012, 0.09, 0.012]|S03 / 待02绑定|
|asset_c2_fishing_line|钓线（本地美术ID）|missing-local-model|可变控制点曲线；不从盘绳GLB拉伸|480 / 256|[0.003, 2, 0.003]|S03 / 待02绑定|
|asset_c2_fish_creel|鱼篓（本地美术ID）|missing-local-model|局部原画篮筐轮廓参考，篓口/提绳分件|1800 / 1024|[0.3, 0.4, 0.3]|S03 / 待02绑定|
|asset_c2_repair_rope|修缮绳（本地美术ID）|missing-local-model|绳体独立曲线，端点/扎结/尾绳分件；不声称工艺复原|1600 / 512|[0.012, 2.4, 0.012]|S08 / anchor_c2_repair|
|asset_c2_cargo_crate|运输箱笼（本地美术ID）|missing-local-model|cargo.glb是货包；需本地格条箱笼、盖、绑点|2400 / 1024|[0.75, 0.6, 0.55]|S08 / anchor_c2_repair|
|asset_c2_repair_support|修缮支架（本地美术ID）|missing-local-model|简单木撑本地；不复制S09木架成新桥|400 / 512|[0.5, 0.5, 0.4]|S08 / anchor_c2_repair|
|asset_c2_shop_steamer|铺面蒸笼（本地美术ID）|reuse-candidate|public/assets/scenery/steamer.glb；盖体只静态不能宣称可开合|4000 / 1024|[0.6, 0.75, 0.6]|S07 / anchor_c2_food_vendor|
|asset_c2_shop_counter|铺面案台/篮筐（本地美术ID）|reuse-candidate|world现有铺面陈设先复用；选择shop 2/5/10等02实走，不另造铺面|2000 / 1024|[1.2, 0.8, 0.6]|S07 / anchor_c2_food_vendor|
|asset_c2_fishing_motion|阿青钓鱼专用动作（本地美术ID）|missing-action-only|复用阿青40骨骼；本地关键帧，禁止外观重生成|0 / 0|[0, 0, 0]|S03 / 待02绑定|
|asset_c2_repair_motion|阿青/脚夫修缮专用动作（本地美术ID）|missing-action-only|分别按两套骨架制作，不套bone_19；绳/箱握持联合验收|0 / 0|[0, 0, 0]|S08 / anchor_c2_repair|

公共ID取自冻结契约；标记本地美术ID的项不引入新物品、动作或锚点接口，主控审阅后才可成为正式索引。所有planned项交付路径目前仅为计划，文件不存在。


## asset_c2_fisher · 渔夫

分件：hands, rod_socket, creel_socket。已有动作：Idle, Walk；专用动作缺项：示范抛竿, 提篓看鱼。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；如新生成人物估算105–115积分，需单资产范围和同区域报价明确。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/characters/asset_c2_fisher/v1/`（尚未产出）。

```text
A fictional Northern Song riverside fisher, weathered face, plain short hemp tunic, tied trousers, straw hat and simple cloth shoes. Empty hands in relaxed neutral pose. No farming tools, no boat pole, no modern reel, no Qing queue. Match the existing muted hand-painted PBR townspeople.
```

## asset_c2_porter · 老脚夫

分件：hands, removable_yoke。已有动作：Idle, Walk, Occupation_Carrier_Wipe_Sweat；专用动作缺项：试拉绑绳, 交付箱笼。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；如新生成人物估算105–115积分，需单资产范围和同区域报价明确。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/characters/asset_c2_porter/v1/`（尚未产出）。

```text
An older fictional Northern Song porter in faded brown hemp work clothes, wrapped headcloth and cloth footwear, restrained grey hair and age lines. Neutral empty-handed stance, separate removable wooden carrying yoke, no modern buckles. Match existing low-poly PBR residents.
```

## asset_c2_merchant · 杂货铺掌柜

分件：hands, abacus。已有动作：Idle, Walk, Occupation_Abacus_Count；专用动作缺项：递铃, 摆盏。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；如新生成人物估算105–115积分，需单资产范围和同区域报价明确。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/characters/asset_c2_merchant/v1/`（尚未产出）。

```text
A fictional Northern Song general goods shopkeeper, dark muted green robe, brown sleeveless outer layer, wrapped cap and cloth shoes. Separate small wooden abacus, calm approachable expression, no imperial insignia or modern accessories. Match existing PBR style.
```

## asset_c2_food_vendor · 王家蒸作伙计

分件：hands, kettle, cup, bread_socket。已有动作：Idle, Walk, Occupation_Tea_Pour；专用动作缺项：递蒸饼, 递粥。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；如新生成人物估算105–115积分，需单资产范围和同区域报价明确。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/characters/asset_c2_food_vendor/v1/`（尚未产出）。

```text
A fictional Northern Song street food worker, light brown short tunic, plain tied white hemp apron, dark trousers, headcloth and cloth shoes. Empty hands ready to hold a serving bowl. Separate kettle and cup. No chef uniform, no modern glassware. Match existing PBR residents.
```

## asset_item_c2_fish_a · 普通鱼甲（鲫形候选）

分件：tail, fins。已有动作：无；专用动作缺项：尾鳍摆动。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_fish_a/v1/`（尚未产出）。

```text
A small crucian-shaped freshwater fish candidate with a deep silver-grey body, muted scales, dark dorsal fin and forked tail, natural proportions. Single fish, no stand or scenery, no fantasy glow. Species identification is pending review.
```

## asset_item_c2_fish_b · 普通鱼乙（鲤形候选）

分件：tail, fins。已有动作：无；专用动作缺项：尾鳍摆动。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_fish_b/v1/`（尚未产出）。

```text
A carp-shaped freshwater fish candidate with an elongated muted bronze body, subtle scales, short barbels and forked tail. Single fish, no background, no fantasy features. Match restrained game palette. Species pending historical and ecological review.
```

## asset_item_c2_junk_pottery · 碎陶片

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_junk_pottery/v1/`（尚未产出）。

```text
A small irregular shard of coarse reddish brown earthenware, curved broken edge, visible wall thickness, mud stain and worn surfaces. No writing, no complete vessel, no modern ceramic decoration.
```

## asset_item_c2_junk_wood · 朽木小件

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_junk_wood/v1/`（尚未产出）。

```text
A small water-worn rotten wood offcut, irregular splintered edges, desaturated dark brown grain and mud stains, no carved marks, no painted symbols.
```

## asset_item_c2_junk_metal · 旧金属件

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_junk_metal/v1/`（尚未产出）。

```text
A small dull corroded iron strap fragment with one irregular hole, worn edges and muted rust. No machine screws, no modern hex nuts, no sharp weapon.
```

## asset_item_c2_rare_copper_piece · 旧铜扣

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_rare_copper_piece/v1/`（尚未产出）。

```text
A small plain old copper loop fitting candidate, hand-worn round profile, subtle green patina and dark brown recesses, no lettering, no imperial decoration, no modern snap fastener.
```

## asset_treasure_c2_marked_token · 刻痕木牌

分件：front_marks, back_marks。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_treasure_c2_marked_token/v1/`（尚未产出）。

```text
A small worn wooden token, rounded uneven edges, shallow simple incised marks reserved on both faces, dark water stains and a polished handling area. No legible invented script or modern lettering. Front and back marks must follow approved story artwork.
```

## asset_treasure_c2_silent_bell · 缺舌铜铃

分件：suspension_loop, shell。已有动作：无；专用动作缺项：悬环轻摆。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_treasure_c2_silent_bell/v1/`（尚未产出）。

```text
A small old bronze vehicle bell candidate, hollow open underside with no clapper, plain suspension loop, thin worn rim, restrained brown-green patina. Separate loop and shell, no carved fantasy runes or modern jingle ball design.
```

## asset_treasure_c2_celadon_cup · 缺口青釉小盏

分件：ceramic_shell。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_treasure_c2_celadon_cup/v1/`（尚未产出）。

```text
A small shallow celadon-glazed cup candidate with a modest foot ring, visible inner surface and wall thickness, one unmistakable chip in the rim. Muted grey-green glaze, worn exposed clay at the chip, no handle, no gold repair, no modern logo.
```

## asset_item_c2_basic_rod · 借用基础钓竿

分件：grip, flex_segments, tip_socket。已有动作：无；专用动作缺项：竿身弯曲。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_basic_rod/v1/`（尚未产出）。

```text
A simple slender tapered bamboo fishing rod, visible subtle nodes, hemp binding near the grip, separate flexible rod segments and fine line attachment. No reel, no carbon fibre, no metal telescoping joints.
```

## asset_item_c2_basic_bait · 基础钓饵

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_item_c2_basic_bait/v1/`（尚未产出）。

```text
A small plain earth-coloured dough bait pellet, handmade irregular surface, no package, no modern fishing lure or hook embedded in geometry.
```

## asset_food_c2_steamed_bread · 蒸饼

分件：静态整体。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_food_c2_steamed_bread/v1/`（尚未产出）。

```text
A simple small steamed wheat bun candidate with a pale cream matte surface, round slightly flattened form and subtle handmade irregularity. No sandwich filling, no modern wrapper, no decorative logo.
```

## asset_food_c2_congee · 粥食

分件：bowl, congee_surface。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_food_c2_congee/v1/`（尚未产出）。

```text
A modest coarse ceramic bowl containing pale rice porridge, separate bowl and porridge surface, modest foot ring and visible thickness. Restrained muted glaze, no modern spoon, no fancy toppings.
```

## asset_food_c2_tea · 茶

分件：bowl, tea_surface。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_food_c2_tea/v1/`（尚未产出）。

```text
A small plain ceramic tea bowl candidate with shallow profile, modest foot ring and separate brown tea surface. Restrained Northern Song inspired everyday form pending review, no handle, no clear glass, no modern teabag.
```

## asset_c2_float · 浮子（本地美术ID）

分件：float_body。已有动作：无；专用动作缺项：沉浮。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_float/v1/`（尚未产出）。

```text
A small simple reed fishing float with a tapered natural buff body and a narrow darker tip, separate line eye, no plastic or neon commercial finish.
```

## asset_c2_fishing_line · 钓线（本地美术ID）

分件：line_control_points。已有动作：无；专用动作缺项：曲线变形。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_fishing_line/v1/`（尚未产出）。

```text
A thin continuous natural-fibre fishing line with a subtle beige tone; represent as a deformable curve from rod tip to float. No coiled static mesh and no fishing reel.
```

## asset_c2_fish_creel · 鱼篓（本地美术ID）

分件：body, lid, handle。已有动作：无；专用动作缺项：提篓。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_fish_creel/v1/`（尚未产出）。

```text
A small woven bamboo fish creel candidate with a narrow opening, rounded squat body and separate carrying cord and lid. Subtle weave, muted aged bamboo, hollow inside, no plastic bucket.
```

## asset_c2_repair_rope · 修缮绳（本地美术ID）

分件：continuous_rope, end_a, end_b, knot_proxy。已有动作：无；专用动作缺项：摆绳, 拉紧, 试拉。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_repair_rope/v1/`（尚未产出）。

```text
A continuous flexible hemp binding rope candidate for securing a transport crate, frayed but serviceable surface, separate free ends and a replaceable knot section. Not a static coil; exact knot follows approved repair choreography.
```

## asset_c2_cargo_crate · 运输箱笼（本地美术ID）

分件：frame, lid, rope_sockets, payload。已有动作：无；专用动作缺项：盖/负载小幅试动。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_cargo_crate/v1/`（尚未产出）。

```text
A modest Northern Song inspired transport crate candidate, woven bamboo sides supported by simple wooden ribs, separate lid and load, visible rope tie points. Shape based on approved Zhang Zeduan crop, no modern shipping pallet or metal corner fittings.
```

## asset_c2_repair_support · 修缮支架（本地美术ID）

分件：timber_crosspieces。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_repair_support/v1/`（尚未产出）。

```text
A small plain temporary wooden support for a transport crate, unpainted worn timbers, simple pegs and stable base, no metal clamp or modern workbench. Candidate game prop, not an identified original painting structure.
```

## asset_c2_shop_steamer · 铺面蒸笼（本地美术ID）

分件：lid_if_separated。已有动作：无；专用动作缺项：盖开合如演出需要。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_shop_steamer/v1/`（尚未产出）。

```text
A modest stacked woven bamboo steamer candidate, weathered natural bamboo rings and simple separate lid. Match the existing shop steamer; no metal industrial equipment, no branding.
```

## asset_c2_shop_counter · 铺面案台/篮筐（本地美术ID）

分件：table, basket, goods。已有动作：无；专用动作缺项：无动作要求。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`public/assets/chapter2/props/asset_c2_shop_counter/v1/`（尚未产出）。

```text
A simple street-side Northern Song inspired wooden serving counter with a plain woven basket, weathered wood and muted natural fibre surfaces. Keep existing painting-based shop footprint; no modern signage or elaborate new architecture.
```

## asset_c2_fishing_motion · 阿青钓鱼专用动作（本地美术ID）

分件：right_grip, left_support, rod_tip。已有动作：无；专用动作缺项：Cast, Wait, Lift。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`src/chapter2/assets/motions/asset_c2_fishing_motion/v1/`（尚未产出）。

```text
Animation brief only: restrained two-hand bamboo-rod cast, stable planted feet, soft anticipation, short forward cast, wait and controlled lift. Fit the existing scholar skeleton and long robe; no running, no modern reel handling.
```

## asset_c2_repair_motion · 阿青/脚夫修缮专用动作（本地美术ID）

分件：hands, rope_targets, crate_targets。已有动作：无；专用动作缺项：Inspect, Align, Tighten, Test。

原点：角色双脚接地中点；杆柄握点；绳端A局部原点；其余物件支承底面中心。模型本体和包装节点分开。 朝向：+Y up; wrapper forward +Z; existing source characters approximately +X, wrapper yaw -PI/2; confirm per model

费用：优先本地0积分；本阶段不建议AI生成。已批准付费上限0；已授权尝试0；本地修复审阅建议最多2轮。

计划交付：`src/chapter2/assets/motions/asset_c2_repair_motion/v1/`（尚未产出）。

```text
Animation brief only: inspect loose binding, align a continuous rope, tighten at visible tie points and cautiously test the load. Use existing independently cloned skeletons and approved knot choreography, planted feet and conservative sleeve movement.
```
