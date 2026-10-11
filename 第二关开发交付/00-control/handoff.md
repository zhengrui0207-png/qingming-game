# 00 主控交付：P0_READY

2026-10-01｜接口1.0.0｜第二关D区“虹桥至城门之间”。

已完成00：真实工程确认、可恢复快照、第一关基线、可导入契约/验证器/类型、明确存档与控制接口、四个独立工作副本、交付目录与提示词实际路径。第二关尚未装配可玩；内容/场景/共享核心/资源及后续整合、真人验收均未标完成。

## 证据与结果

- 原有341文件SHA256保持不变；快照341文件、245697804字节，含源码/配置/public模型/历史存档样本。没有覆盖用户修改、清档、重建项目。
- 第一关98项测试、新契约15项测试通过；四副本各自15项契约测试通过。构建成功。
- 浏览器真实按键移动、完整首次开场、书打开、开场回顾跳过/相机恢复、V俯瞰跟随、桥地标F阅读/锁释放已记录。桥定位使用DEV、没有伪装完整步行通关。
- Console本次errors0/warnings0，资源请求无HTTP4xx/5xx。无真人结果；未做全部镜头异常矩阵/Safari/移动端/完整剧情技术验收。
- M5/16GiB、Chromium154、1200×792/DPR2，桥静止3秒P95 33.5ms；原有大场景渲染负担、人物动画绑定缺项与899KB构建chunk警告已记录，不声称性能达标。P0不进行无关性能/人物重建。
- Tripo/付费生成/新聊天任务/线上发布本次均未执行；08可以先审计复用资源。

工程证据：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game/docs/chapter2/` 下baseline.md、baseline-browser.json、ready-checks.json、status.json、contracts.md、ownership.md、workspace-map.json、frozen-files.json。本交付evidence/保留实际日志/截图；files/为本次新增可审查文件，files.json有校验值。历史用户个人浏览器存档没有访问；fixture和独立自动化存档明确标来源。

## 第一批：现在可并行开工

每个新任务打开对应提示词，复制完整代码块；目录/端口已经写在代码块最前面。使用各自副本的文件范围，不能同时写正式源码。新任务由晓梦打开，P0没有自动派发。

### 01 01-content

提示词：[01_剧情考据与藏物故事](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/01_剧情考据与藏物故事.md)

工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/01-content/qingming-game`

交付目录：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/01-content`

预览：在该工作副本运行 `npm run dev -- --port 5281 --strictPort`。读取docs/chapter2/THIS-WORKSPACE.md、contracts.md及ownership.md。当前默认入口仍为第一关；02/03通过独立preview.html证明自身交付，不能把第一关可运行当成第二关完成。

### 02 02-scene

提示词：[02_原画场景与可走灰盒](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/02_原画场景与可走灰盒.md)

工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/02-scene/qingming-game`

交付目录：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/02-scene`

预览：在该工作副本运行 `npm run dev -- --port 5282 --strictPort`。读取docs/chapter2/THIS-WORKSPACE.md、contracts.md及ownership.md。当前默认入口仍为第一关；02/03通过独立preview.html证明自身交付，不能把第一关可运行当成第二关完成。

### 03 03-core

提示词：[03_共享状态存档与接口](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/03_共享状态存档与接口.md)

工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/03-core/qingming-game`

交付目录：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/03-core`

预览：在该工作副本运行 `npm run dev -- --port 5283 --strictPort`。读取docs/chapter2/THIS-WORKSPACE.md、contracts.md及ownership.md。当前默认入口仍为第一关；02/03通过独立preview.html证明自身交付，不能把第一关可运行当成第二关完成。

### 08 08-assets

提示词：[08_人物道具与资产制作](/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/08_人物道具与资产制作.md)

工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/08-assets/qingming-game`

交付目录：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/08-assets`

预览：在该工作副本运行 `npm run dev -- --port 5288 --strictPort`。读取docs/chapter2/THIS-WORKSPACE.md、contracts.md及ownership.md。当前默认入口仍为第一关；02/03通过独立preview.html证明自身交付，不能把第一关可运行当成第二关完成。

## 开始条件与下一步

01剧情/考据、02灰盒、03共享核心可以马上并行；08先做资产审计与提示词，实际新增人物/道具制作等01名称外观与02清单落定，并遵守已有预算范围，Tripo优先API。正文和坐标模板当前故意不填，ready模式验证会拒绝它们。

CORE_READY前不启动04/05/06/07正式实现；SCENE_READY/CONTENT_READY同时按相应依赖提供，主控验收交付后创建第二批新基线副本。当前只有四个第一批副本，没有第二批任务。

各支线做完，将handoff.md、files.json、files/、实际命令/日志、截图、未覆盖项交到对应目录。然后在当前主控聊天使用“10_第二关整合.md”；主控按逐文件清单接入，不全目录覆盖。发布/真人体验仍在11后验证。

恢复快照说明：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/baselines/2026-10-01-p0/RESTORE.md`。备份未包含node_modules、历史输出/发布包、.env；恢复需逐文件比较，不能覆盖后来新修改。
