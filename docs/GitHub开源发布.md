# GitHub 开源发布

- 仓库：https://github.com/zhengrui0207-png/qingming-game
- GitHub Pages：https://zhengrui0207-png.github.io/qingming-game/
- 本地发布工作副本：`output/github-open-source/qingming-game/`，独立 Git 仓库，主分支 main。
- 原始工程目录未初始化 Git，也未改变原有部署方式。
- 包含全部运行源码、45种人物、运行场景与音频；排除密钥、生成日志、完整 Blender 工作工程、服务器配置及部署历史。
- 原创代码 MIT；素材许可见公开仓库 ASSETS.md，第三方许可文件已附带。
- 本地全量 98 个测试通过，剧情配置与生产构建通过；公开源码构建 JS 与现有线上版本一致：index-QRSdYYiu.js。
- CI：`.github/workflows/pages.yml`，main 推送后自动测试、构建、发布 Pages。

后续更新请在该工作副本同步改动、测试后提交推送；不能直接把整个原项目目录上传，尤其不能上传 .tripo、output、revisions 或本机配置。游戏存档按浏览器来源隔离，GitHub Pages 不会自动继承其他站点的存档。
