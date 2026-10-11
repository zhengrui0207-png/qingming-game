# 写入边界与交付

00/10唯一负责真实根目录、main.js、公共交互入口、相机/输入适配器、装配配置及依赖。第一批只在workspace-map.json中各自工作副本和交付目录写入，真实源码只读；契约1.0.0只读，变更需求写handoff交主控，不自行覆写公共合同。

01：src/chapter2/content/和docs/chapter2/content/，交content.json（含来源、对白、storyRules、三篇完整故事）、剧情Markdown、考据和阅读长度；不能改wallet/state/main。起步内容模板为docs/chapter2/templates/content.draft.json。

02：src/chapter2/scene/、public/assets/chapter2/scene/、docs/chapter2/scene/及独立chapter2-scene-preview.html。测量11锚点、路径、边界/碰撞，交anchors.json、scene.js及实走截图。保留原world.json/运动模块；新增D区碰撞通过主控合并，不整体重导出既有世界。预览可从src/chapter2/scene/preview.js启动，不接管原index.html/main。

03：src/chapter2/core/、src/hongqiao/state.js及persistence.js、相应测试、docs/chapter2/core/和独立chapter2-core-preview.html。实现唯一共享service、v2→v3迁移、动作/幂等/保存失败和精力/交易/修缮/故事规则；沿用现虹桥动作和存档入口，不接UI。运行时挂接修改以建议补丁交00/10，不能直接改main/interaction progress入口。

08：public/assets/chapter2/characters/props/previews/、src/chapter2/assets/、docs/chapter2/assets/。先审计既有可复用GLB，记录实际动作/材质/尺寸/朝向/锚点绑定建议。没有CONTENT_READY/SCENE_READY时只做不依赖的审计/提示词；API制作遵守已有预算范围，Tripo优先API，不用CLI当主流程。资产实际产出才记ASSET_READY，不能把清单/占位写成完成。原public资产不可覆盖。

各副本的既有文件为独立实体，可读取用于预览，但超出范围的文件不改。新增依赖如必须先在报告说明，不改package.json/package-lock；现有node_modules已复制，不需重新安装。没有资源符号链接写回风险；不要使用cp覆盖整个真实工程。

每条支线交付目录中保存handoff.md、files.json（相对路径、baseSHA256或null、新SHA256）、files/（只放本次交付源码/资源）、验证命令与日志、截图/预览、未覆盖项。大模型可在handoff指出副本内绝对路径并校验，主控按清单复制，不必重复几百MB原资产。交付不应更新公共status.json；主控读产物验证后再改变ready标志。

CONTENT_READY：ready语义验证成功且事实/虚构、原画场景、正文完整和主线长度人工审过。
SCENE_READY：ready验证成功且独立预览真实实走/贴地/遮挡/交付范围记录。
CORE_READY：实service通过第一关回归、迁移和全部C2关键事务/异常测试；替身service不是ready。
ASSET_READY：必要真实资源检查/预览通过，缺失动作/占位如实列出。

第二批04/05/06/07与09副本须从CORE_READY并接收相应内容/锚点的新基线创建；当前未创建这些副本。主控统一接入后10发布INTEGRATION_READY，11做技术验收及2–3位真实首次玩家试玩；当前均未达成。

## 第二批分配（2026-10-01接收后）

主控已接收01内容、02实测灰盒、03真实核心和08资产审计；CORE_READY基线为 2026-10-01-core-ready-v1。ASSET_READY仍false，正式整合仍未完成。以下副本只读使用已接收服务/内容/锚点，不修改它们。主控继续唯一持有实际源码与公共状态。

- 04-fishing：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/04-fishing/qingming-game；端口5284；允许写入：src/chapter2/fishing/**, docs/chapter2/fishing/**, chapter2-fishing-preview.html；交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/04-fishing。
- 05-commerce：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/05-commerce/qingming-game；端口5285；允许写入：src/chapter2/commerce/**, docs/chapter2/commerce/**, chapter2-commerce-preview.html；交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/05-commerce。
- 06-repair：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/06-repair/qingming-game；端口5286；允许写入：src/chapter2/repair/**, docs/chapter2/repair/**, chapter2-repair-preview.html；交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/06-repair。
- 07-book：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/07-book/qingming-game；端口5287；允许写入：src/chapter2/book/**, docs/chapter2/book/**, chapter2-book-preview.html；交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/07-book。
- 09-presentation：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/09-presentation/qingming-game；端口5289；允许写入：src/chapter2/presentation/**, docs/chapter2/presentation/**, chapter2-presentation-preview.html；交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/09-presentation。

04只注册自己两个钓点，02不重复注册钓点；只经唯一service结算与记录风物志。04可用独立预览的真实服务/场景适配，不修改main或原相机。开发用几何与专用握杆动作缺项必须如实列出。09已分配副本但未自动启动。所有支线从当前frozen-files清单验证只读依赖。
