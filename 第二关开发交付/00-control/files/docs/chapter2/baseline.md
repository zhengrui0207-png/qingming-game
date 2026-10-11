# P0 第一关基线

2026-10-01。真实游戏 `/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`，Node v22.13.0，npm 10.9.2，Vite 7.3.6。源码根目录不是Git仓库，没有重建或清理。

## 工程结构

src/main.js持有唯一移动/相机/输入/场景控制；src/interaction/progress-adapter.js与progress-book.js分别重导出hongqiao/runtime.js和progress-ui.js。真实状态/持久化在src/hongqiao/state.js、persistence.js，schema v2。public/assets/world.json包含当前布局/碰撞；world bounds x84/z70、桥面最高约8.24，已有84店铺、王家蒸作视觉候选id2/5/10。这些坐标和店铺不证明D区灰盒已经存在。

已读真实虹桥实现、运动、地标/人物图志、NPC和演出；src/interaction不是第二套可任意替换的游戏。主角书生阿青；当前人物网格约59582三角面，locomotion缺少可识别idle/walk绑定、使用已有程序动作；该原有问题由人物相关验收继续跟进，P0没有换模型。

## 可恢复快照

源文件改动前保存独立快照（无资源软链或硬链）：
`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/baselines/2026-10-01-p0/qingming-game`
同级manifest.json含341文件、245697804字节及逐文件SHA256；RESTORE.md说明按文件恢复，不整体盖掉后续修改。源码、public资源、关键配置、脚本、历史存档fixture已保存；node_modules、输出/发布包和.env未复制。个人浏览器存档未读取，新增自动化存档样本来源见save-samples/README.md。

## 实际验证

- 现有15个src测试文件，98项通过。日志output/chapter2-p0-baseline/node-tests.log/json。
- 新增契约15项通过；日志output/chapter2-p0-baseline/contract-tests.log。
- npm run build -- --outDir output/chapter2-p0-baseline/build --base=./，成功；78模块，JS 899.32KB，原有>500KB警告保留。没有用压文件等同于帧率改善。
- npm run dev -- --port 5280 --strictPort；独立headed Chromium 154，http://127.0.0.1:5280/?test。
- 实际W键650ms，人物从[0,35]到约[-.412,33.156]；相机跟随正常。
- 首次入画完整播放开场，结束锁释放，yaw .22/pitch .49/distance10恢复。书打开持book锁；回顾开场持presentation锁；Esc跳过后相机与人物位置一致、锁为空。
- 实际V切俯瞰/跟随有效。DEV定位桥面[0,8.24,0]用于检查地标；桥卡显示，F阅读持history锁，Esc关闭释放；来源2项。没有把定位当完整穿行验证。
- 本次浏览器收集到console errors0/warnings0，虹桥存档错误列表为空；requests.log记录资源成功加载。截图01–06与日志在output/playwright/chapter2-p0/，06读图确认正文/来源显示。

## 已存在的限制

Mac17,3/Apple M5/16GiB，浏览器viewport1200×792、设备像素比2。桥面静止3秒133帧，平均22.81ms/P95 33.5ms、瞬时46fps、743 draw calls/5,278,869三角面。入口视角曾约31fps/1691 draw calls/12,448,925三角面。位置、镜头和可见人物改变会显著改变渲染量；只作为比较条件记录，不是持续走动性能验收。不符合待实测的1080p/DPR≤1.5下P95≤20ms目标，后续11再测瓶颈。

当前未覆盖：全镜头刷新/失焦/回顾矩阵、第一关全部异常剧情实走、Safari/移动端、第二关运行与真人首次试玩。此前docs/hongqiao报告只是历史资料，没有冒充本次新结果。第二关尚无已测场景/玩法/正文，P0_READY不意味着第二关可玩。
