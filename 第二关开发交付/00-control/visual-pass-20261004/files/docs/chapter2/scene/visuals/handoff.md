# 第二关D区画面打磨交付 · 2026-10-04

本轮已把D区独立场景与真实钓鱼预览从灰盒升级为可检查的材质、几何和光照版本。冻结最终实机图获独立评审 **8.0/10、Tier3**；本机1080p/dpr1连续行走约 **59.94fps、P95 18.30ms**，达到dream-loop本轮退出条件。Tier4细节未全部通过，绝非与概念逐像素相同，也没有宣称整关已装配或可发布。

范围仅D区；原main、world、第一关状态/存档、移动、相机、地标、故事和演出源码、P0契约/锚点/布局/依赖清单保留。无Git初始化、worktree、线上发布、清档、全目录覆盖、新Tripo任务或05/06/07/09副本覆盖。主状态只追加visualRefinement证据，ASSET_READY与INTEGRATION_READY仍false。

## 完成的画面

- Blender制作13个稳定语义节点：错落屋宇、逐片灰瓦/薄檐、木框格窗、石基、树枝根部、棚摊/伞肋、箱笼木架和车棚细节。
- 生成并接入7类表面纹理与春日天空，灰墙有淡湿痕与剥蚀，木料有纹理和微倒角，布棚有真实谷褶，竹篮/碗罐有空心口沿。柜台底部两处开口为真实几何，配短脚影；不以亮色平面伪装。
- 土路增加浅起伏、鞋印、弯曲覆尘车辙；可视高度约0.935–0.975米，原物理支持面保持0.94米。脚底可能有约5毫米可见缝或最多约3.5厘米嵌入，正式装配时需按镜头再验。车辙局部覆盖层使用小高度裕量避开旧路面交叠，未改碰撞。
- D独立光照使用春日暖阳/冷天空IBL、3级2048级联影、半分辨率GTAO、30Hz河面反射与沿同GLSL波高运动的碎光。反射碎光是光学近似标记，不是光线追踪。6张日光贴图用于当前静态匹配管线，保留UV1与原顶点遮蔽。
- 使用真实现有四位角色模型与原阿青；渔夫为QMSH-31本地篮匠派生，去除刀具与不合身份背条。车舟复用既有模型并修正拷贝材质回调后发白问题。

## 验证结果与证据

| 检查 | 实际结果 | 文件 |
|---|---|---|
| 最终图评审 | 8.0/10；Tier1/2/3通过，Tier4未全部通过 | verdict-final.md、final-scene.png |
| 当前源码20个测试文件 | 194通过 / 0失败 | tests-current-source-final.log |
| 契约、内容ready、锚点ready | 全部通过 | contracts-content-scene-final.log |
| 21冻结文件＋6保护文件 | 校验值全部一致 | protected-hash-verification.json |
| main＋场景＋钓鱼模块编译 | 成功，publicDir=false的源码/入口构建，非发布包 | build-delivery-final.log |
| GLB压缩后结构 | 13节点，UV0/UV1/COL_0保留，无非有限值；包围盒最大变化见报告 | compression-validation-wear.json |
| 最终场景/多视角Console | 0错误、0警告 | capture-candidate-48.log、capture-other-views-final-no-overlap.log |
| 真实钓鱼UI | 9检查通过，精力80→76，普通鱼/收藏各1，Esc不重复奖励，镜头位置/角度/距离与锁恢复，正式存档未改 | fishing-final-verification.json |
| 销毁 | 模块注册项/输入订阅清空，完整预览dispose调用两次无异常；几何192→23、纹理57→10 | 同上，余项为调用方源资源，不声称GPU资源归零 |

钓鱼检查使用全新隔离DEV键、真实核心和锚点，通过借竿→E→抛竿→咬钩→点击收杆→结果→Esc→销毁走UI。教学首杆自然普通鱼，无前端临时抽奖或强制珍稀。不等于正式main整合、随机掉落统计或真人试玩。

**另有未通过的广域自动发现测试，未隐瞒：**早先裸node --test发现424项、415通过、9失败。8项来自output/revisions内不完整历史快照的缺文件；1项为既有scripts/npc-integration.test.mjs的模型替身缺少当前mapping/catalog/failures接口，于src/street-life.js:67失败。本轮未改这些源文件/历史归档，也没有删除它们来让测试转绿。当前实际src测试194项全通过与全工程自动发现未全通过必须分开。详见tests-delivery.log；正式整合前需修复该NPC测试适配并确定有效测试范围。

构建仍提示大于500KB包、旧JSON导入属性不一致及字体运行时解析；此构建publicDir=false，不证明完整静态资源部署。预览Network中实际世界/人物/细节请求200，不能据此宣称生产网络验收完成。

## 同设备性能

参考设备为MacBook Air/Mac17,3、Apple M5、16GB；Chrome154有界面浏览器，1920×1080、dpr1；4名D居民＋阿青，商铺同一机位yaw3.14/pitch0.25/distance10/FOV48。测量时不烘焙、编译、改源码、导航或开启第二个GPU预览。使用RAF墙钟帧间隔，非只量JS执行耗时。

| 条件 | 样本帧 | 平均ms | P95ms | 由平均间隔计算fps |
|---|---:|---:|---:|---:|
| 最终固定商铺20秒 | 1201 | 16.6660 | 18.20 | 60.00 |
| 最终约144秒连续往返 | 8668 | 16.6833 | 18.30 | 59.94 |
| 较早candidate42同条件固定 | 1196 | 16.7217 | 18.10 | 59.80 |
| 较早candidate42同条件往返 | 8623 | 16.7992 | 18.40 | 59.53 |

最终18次正反路线访问全部完成，错误null、allWalk=true，沿用原moveActor。更细的几何/水面保持本机近60fps；小差值不足以宣称普适性能提高。drawCalls/triangles是最后一帧且受周期阴影刷新影响，不作为平均负载比较。压缩GLB只减下载体积，不充当提帧证据。

早先使用inspect轮询等待行走曾触发昂贵射线检查而超时，已作废；最终只用isWalkFinished轻量等待并在结束时取一次报告。另一次钓鱼URL漏了test/chapter2参数被DEV门禁拦截，已作废并用正确URL复测；这些无效记录保留在原工作目录，不计通过。

## 00/10装配说明

```js
import {mountVisuals} from './src/chapter2/scene/visuals.js';
// d为已有scene模块，renderer/city由装配方所有。
const visual = await mountVisuals(d, {renderer, city, staticDaylight:false});
// 在原更新链调用；不要替换moveActor或原相机。
visual.update(elapsedSeconds, dt, camera, actor);
// 离开D，先销毁表现，再销毁D场景。
visual.dispose();
d.dispose();
```

默认staticDaylight=false可交给正式main既有光照；当前8分截图来自独立预览staticDaylight=true＋createRendering专用管线，不可未经验证声称直接接main后同等画面/性能。静态日光材质不接收所有新动态光影，镜头/主光变化须重验或改用默认动态版本。

createRendering仅供独立场景/钓鱼预览：自己创建太阳、天空、河面、AO并改该页面renderer与CSM shader chunks；**不得在已验收main灯光/河面/后处理旁重复挂一套**。正式接入由00/10统筹既有渲染器。mounted实例仅一个；现有单一所有者规则继续适用，重复mount与加载半途失败的清理尚未故障注入验收。

GLB/贴图来自public/assets/chapter2/scene/detail-v1；保留所有必需文件和本地Draco解码器。不重叠导入灰盒整GLB，不重复注册钓点。当前四NPC摆位是表现位置，交互和支持面仍用冻结锚点。

## 未覆盖与下一阶段

- 专用握杆/渔夫职业交互动作、老脚夫年龄细化、正式道具替换仍待08验收；钓竿/线/浮子可动，所得鱼/物依旧程序替身。
- 第一关源码/保护值和相关测试保持，未把未修改源码等同于重新人工走完全部开场/结局/故事/失焦组合。
- 最终画面下的真实系统失焦/刷新/失败加载/重复挂接，以及全部随机/珍稀/木牌/交易/修缮/长故事整合路径未重新跑全。原核心自动测试通过不替代正式浏览器整关验收。
- 跨D边界与远处旧资产保留，部分灰白边沿/未精修远景和小范围地表交界仍存在；未为提高这一镜头得分扩建E/F。独立取景会将玩家定位到锚点，环境截图隐藏玩家以避免诊断同位；不把取景截图冒充连续实走。
- 车辙追踪性和水碎光分组仍PARTIAL，下一轮量化建议见verdict-final.md；本轮退出条件达到但细节仍可改进。
- 像素比1.5、低配设备、正式main镜头/人数、第一关同设备性能对照未测。
- 2–3位真实首次玩家、主线20分钟/必要阅读时间、第二关全部交易修缮风物志和演出联调尚未完成。全局ASSET_READY=false、INTEGRATION_READY=false、HUMAN_PLAYTEST_DONE=false，**暂不具备第二关发布准备条件**。

证据/交付根：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/00-control/visual-pass-20261004。files.json含基线与新SHA256，files/仅增量源码/文档，public大资产以绝对路径＋SHA256引用，不复制整个工程。原作者脚本/纹理提示词重述与中间.blend保存在/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game/.dream-loop/chapter2-2026-10-02；重述明确不冒充缺失的历史原始提示词。
