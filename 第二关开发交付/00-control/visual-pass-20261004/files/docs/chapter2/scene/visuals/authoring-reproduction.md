# 画面资源与复现

## 真实来源与边界

- concept.png是用户已确认的目标图，不是已实现截图。原始目标提示词见concept-prompt.md，输入为before-street-front.png与reference-first-live.png。
- d-detail*.glb由本地Blender 5.2.1执行build-detail-assets.py制作：逐片瓦、檐口、木框、格窗、布棚谷褶、伞肋、柜底真实开口、空心碗罐/竹篮、木箱、树枝与根部。24射线/顶点的局部遮蔽存在COL_0。
- 6张1024日光贴图由bake-daylight.py生成，保留UV0并另写UV1。只用于与当前独立光照相匹配的预览。
- 渔夫fisher-local.glb是既有QMSH-31篮匠模型的本地派生，移除不合角色的刀具与背条；并不等于专用渔夫模型验收。具体记录见public/assets/chapter2/scene/detail-v1/fisher-local.json及本目录的Blender转换脚本。
- 本轮复用既有QMSH-08/17/28、阿青song-scholar-v2-animated.glb、street-life舟车、willow-spray.png及项目既有WoodSiding006/Plaster007。后两者的项目来源记录在public/assets/textures/sources.json，未另从网络下载资产。
- 土地、木纹、亚麻、灰瓦、灰墙、树皮、纸面和天空由内置image_gen制作。并非新付费Tripo任务。本轮没有使用Tripo CLI或发起Tripo API建模；用户的既有角色/道具资产继续保留。

## 生图提示词记录说明

concept-prompt.md与plaster-prompt.md保存原始文本。其余纹理调用的完整原始输入未全部落盘，以下为**复现用重述**，不是对历史调用逐字的伪称。生成同类纹理后应人工检查、保留原资源备份并重新评审；生图有随机性，不能保证逐像素复刻。

共同约束：seamless tileable PBR albedo texture, flat orthographic texture-only image, neutral diffuse illumination, no directional cast shadows or highlights, no writing, objects, perspective, watermark, film grain. Restrained Northern Song everyday materials; fine useful texture, no excessive noisy detail.

1. earth-albedo.png：compacted dry ochre earth lane, muted tan/clay dust, tiny restrained mineral grains and worn compressed variation, no large stones, cracks, puddles or grass. Road marks supplied by geometry, do not paint large wheel tracks into this map.
2. timber-albedo.png：aged modest brown timber, vertical grain, natural fine fibers and a few subtle worn bands, restrained neutral warm brown, no plank layout or nails, no hard black knots.
3. linen-albedo.png：unbleached warm beige coarse linen, visible tiny woven fibers, soft irregular weave, no folds or shadows baked in; wrinkles supplied by modeled canopy.
4. clay-albedo.png：fired grey roof ceramic, fine mineral mottling and restrained wear, desaturated blue-grey, no tile silhouettes or deep stains; individual roof tiles are geometry.
5. plaster-albedo.png：weathered lime plaster in a modest Northern Song timber house, pale warm grey, sparse fine cracks and irregular abrasion, calm midtones, no large black mold fields. Exact earlier prompt available in plaster-prompt.md.
6. willow-bark-albedo.png：old willow trunk bark, narrow longitudinal fissures with grey-brown ridges, fine fibrous wear, muted natural color, no moss clumps or tree silhouette. Generated source retained at /Users/zhengrui/.codex/generated_images/01a09f15-d350-77f2-85a8-ca0180bd4991/exec-153242b7-4f3d-4712-9f4a-b184806bfbd6.png.
7. paper-albedo.png：thin handmade warm beige paper fibers for a bamboo parasol, soft uneven fibers and restrained translucent feel, no parasol shape, ribs, radial seams or directional light in the map. Generated source retained at /Users/zhengrui/.codex/generated_images/01a09f15-d350-77f2-85a8-ca0180bd4991/exec-aa98933e-f90c-4beb-a294-43364997a4b0.png.
8. spring-sky-environment.png：panoramic soft spring daytime sky environment, calm blue grey upper sky, soft diffuse pale clouds, gentle horizon haze, no city/buildings/trees, no dramatic sunset, stars or hard bright sun disk. Used as approximate IBL/sky source, not a calibrated HDR photograph.

## 复现命令顺序

工作目录：/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game/.dream-loop/chapter2-2026-10-02。

1. 本地Blender后台执行build-detail-assets.py。将新生成public/.../d-detail.glb明确复制为本目录d-detail-wear-raw.glb（压缩脚本不会自动覆盖已存在raw，不可漏掉此步）。
2. 执行node compress-wear.mjs压缩非烘焙版本。
3. 本地Blender后台执行bake-daylight.py。将新生成d-detail-daylight.glb明确复制为d-detail-daylight-wear-raw.glb。
4. 执行node compress-daylight-wear.mjs，再node verify-compression-wear.mjs。确认UV0/UV1/COL_0与13个语义节点保留，有限数值与局部包围盒通过。包围盒差异不是逐顶点误差保证。
5. 主工程现有npm run dev -- --port 5290 --strictPort；场景/chapter2-scene-preview.html，钓鱼/chapter2-fishing-preview.html?test&chapter2&session=新的独立DEV键。不要把调试键换成正式存档，不清档。
6. 同1672×941机位运行capture-candidate-48.js，自审后评审；1920×1080/dpr1运行performance-current.js及performance-walk-current.js。测量期间停止建模、编译和页面切换。

原始.blend/中间raw只在本目录，未放进public。运行时GLB使用Draco位置20/法线16/UV16；这是下载体积优化，帧率提升必须另测。现有工具依赖复用，不修改工程package.json或锁文件。
