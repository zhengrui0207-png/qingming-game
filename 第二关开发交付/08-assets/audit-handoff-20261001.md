# 08 人物、道具与资产 · 审计阶段交付

2026-10-01｜契约1.0.0｜基线2026-10-01-p0｜仅D区。

**ASSET_AUDIT_READY=true；ASSETS_READY=false。** 审计已可交主控审阅，正式资源制作尚未开启。公共status.json及正式资产索引未修改。

## 交付内容

- [审计报告](files/docs/chapter2/assets/audit-report.md)：复用判断、角色占用、外观差异、动作与时代形制待审内容、精确缺项及修复路径。
- [28项资产方案](files/docs/chapter2/assets/asset-plan.md) / [JSON](files/docs/chapter2/assets/asset-plan.json)：覆盖全部18个冻结资产ID；另10项本地美术/动作建议，不增加公共接口。含英文提示词及哈希、预算、尺寸/原点/朝向、可动分件、费用、尝试上限、计划交付路径。planned路径目前没有模型文件。
- [GLB结构审计](files/docs/chapter2/assets/existing-glb-audit.json)：105个既有GLB，含45套人物和LOD。已有哈希记录无不一致项。
- [浏览器记录](files/docs/chapter2/assets/browser-review.json)：8对象实解码、四面图；5人物共15段已有剪辑，每段33帧蒙皮顶点采样与独立骨骼克隆检查。
- [复用模型引用](files/docs/chapter2/assets/reuse-models.json)：9个本地源模型路径及校验值，不重复复制大GLB。所有候选acceptedForChapter2=false，阿青/第一关保持原文件。
- [版本manifest](files/docs/chapter2/assets/version-manifest.json)、[文件及基线哈希](files.json)、[校验结果](files/docs/chapter2/assets/validation.json)、[实际日志](files/docs/chapter2/assets/validation.log)。`files/`仅包含本次可审查源码、文档和预览。

未新增正式GLB、贴图资产或钓鱼/修缮专用动作，未付费生成，未上传模型，未发布线上，也没有真人试玩或第二关正式整合验收。

## 主要判断

掌柜QMSH-08、脚夫QMSH-28、茶坊伙计QMSH-17可作为局部复用候选。掌柜有算盘、伙计有壶盏、脚夫有肩担且面貌较年轻，都不能把角色目录存在等同于本关身份/动作通过。渔夫候选QMSH-21带两件农具、QMSH-23带纤绳，需要拆件/改服式；优先本地改件，不能只改名。QMSH-22老周、QMSH-24何伯已用于第一关，不改身份。

LOD有网格/蒙皮但没有自身完整剪辑与材质贴图，须沿用原高模骨骼、材质与动作。阿青GLB40骨骼、无内嵌剪辑，仍使用既有程序骨骼动作，不重新生成。盘绳不可硬拉伸为动态绳；货包不是可修缮箱笼；已有擦汗/倒茶/拉纤绳不能冒充专用动作。

## 预览与实际验证

唯一工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/08-assets/qingming-game`。

```sh
npm run dev -- --port 5288 --strictPort
```

已实际运行，[打开资产审计预览](http://127.0.0.1:5288/src/chapter2/assets/preview.html)。源文件为`src/chapter2/assets/preview.html`与`preview.js`。此页只读加载既有资源，使用原main基础光照、曝光/FOV及跟随参数，提供近景和四面动作检查。它没有D区世界/AO/水面/遮挡，不是第二关可玩入口或D区实景验收。13张PNG含8对象四面、掌柜动作/跟随距离及3处原画裁切。

实际执行命令（在上述副本）：

```sh
python3 docs/chapter2/assets/audit.py
python3 docs/chapter2/assets/prepare-plan.py
python3 docs/chapter2/assets/verify-audit.py
node --check src/chapter2/assets/preview.js
node scripts/validate-chapter2-contract.mjs contract
```

结果：结构读取105个GLB；覆盖18/18冻结资产；8对象加载成功，15段剪辑真实蒙皮变化、独立骨骼验证通过；浏览器error/warn记录为空；JS语法与契约校验通过。工作副本354个基线文件、真实工程353个基线文件、21个冻结文件校验未变；新增文件均在本任务允许范围。没有Git仓库，没有执行Git、worktree、安装依赖、build写dist或改变第一关源文件。

`prepare-plan.py`重新生成时会把审计标记恢复为未校验；随后运行verify-audit.py完成当前证据校验，才重新标审计ready。校验不将正式模型或专用动作标ready。

## 费用与生产限制

项目原配置V3余额GET成功：3880积分、冻结0。当前批准付费上限0，提交任务0，实际费用0。CLI cn标签与项目.ai端点来源需复核，未拿Key跨区尝试。

已核对[官方P1版本](https://developers.tripo3d.ai/en/models/p1)、[计价](https://docs.tripo3d.ai/get-started/pricing.html)、[绑定](https://developers.tripo3d.ai/en/docs/animations-rig)和[鉴权](https://developers.tripo3d.ai/en/docs/authentication)。新人物若确需图生detailed+rig+idle/walk，暂估105–115积分；公开细纹理报价存在口径差异，执行前重核同区域报价。这个估算未获执行授权。优先所有小件本地0积分，渔夫仅在局部改件失败后考虑单资产1次生成，不批量付费。

## 未完成及后续输入

真实工程最新状态仍CONTENT_READY=false、SCENE_READY=false、CORE_READY=false、ASSET_READY=false。01/02目前未交正式产物。按[本副本ownership.md](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/08-assets/qingming-game/docs/chapter2/ownership.md)明确要求“没有CONTENT_READY/SCENE_READY时只做不依赖的审计/提示词”，实际制作留待前置落定。

1. 01交正式content.json、NPC年龄/服式/身份清单、鱼种审阅、木牌双面刻痕、铜铃磨损断口、小盏缺口与对白摆向。当前提示词不填编造的图案、文字或史实。
2. 02交anchors.json和实际近景/贴地朝向/遮挡，选定王家蒸作2/5/10中的补给铺面。当前不填虚构世界坐标。
3. 04/06/09交抛竿/握杆、绳箱四阶段、手目标与镜头；随后按阿青及脚夫各自骨架做真实专用动作，与连续曲线绳联合检查。
4. 确需AI外观时，补单资产批准范围/上限与区域报价。未来提交须记录输入/请求哈希、锁、任务ID、阶段、实际扣费；未知提交不盲重发。
5. 新资源完成后再在D区实际相机与光照检查衣袍、脚底、肤色、物件辨识、握持及性能；未通过项继续标未完成。00/10审阅后按files.json增量合并，不全目录覆盖，不因此直接开启正式ASSET_READY。

![掌柜候选四面审计](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/08-assets/files/public/assets/chapter2/previews/QMSH-08-four-views.png)
