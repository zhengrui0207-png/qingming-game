# 04 河边钓鱼交付

2026-10-02；契约1.0.0；CORE_READY基线2026-10-01-core-ready-v1。

FISHING_READY=true，范围为可装配的独立玩法模块；公共status由主控接收后更新，本任务未修改。ASSET_READY/INTEGRATION_READY/HUMAN_PLAYTEST_DONE=false。

## 结果

真实03核心、01内容、02测量钓点接入；两岸E进入，4精力单次扣除，免费借竿/教学，准备/抛竿/候鱼/咬钩/普通或简易收杆/结果/继续离开，可动竿线浮子、声音与视觉提示；自动收藏、鱼杂物叠量、固定木牌与珍稀保底；保存失败禁止下一杆并重试原事务；取消、刷新、演出抢占、镜头/锁恢复及幂等销毁。

21项钓鱼测试与全部194项测试通过；37项浏览器断言通过。Console零错误/警告，网络记录无失败响应。真实标签切换未触发浏览器失焦，另列未覆盖；模拟blur和隐藏帧测试不能代替真人设备复验。截图11张及原始脚本/日志已交付。602基线与21冻结文件未改，真实主工程未被钓鱼任务修改。

主要修复：连续多杆复用相机租约；正常刷新pagehide已取消后仍恢复对应安全岸边；仅持有当前所得模型克隆避免长期保留旧克隆；owner按P0统一为c2/fishing。

## 审查与装配

交付清单files.json包含相对路径/baseSHA256/newSHA256；files/只含04允许范围的源码、预览页、文档及证据，按清单增量接收，不能整副本覆盖main。公共接口/服务/移动/相机/依赖无变更。文档见files/docs/chapter2/fishing/README.md与verification.md。index.js导出create/mount，返回update/cancel/dispose/getState；不读取main私有变量。

工作副本：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/04-fishing/qingming-game。

在该副本执行npm run dev -- --port 5284 --strictPort，预览 http://127.0.0.1:5284/chapter2-fishing-preview.html?test&chapter2&session=fishing-review 。这是隔离DEV存档，不是正式第二关入口。当前Chrome预览已免费借竿，可直接按抛竿。换浏览器初次载入需先在右上工具定位鲁七、借竿，再定位岸边按E。

核心tick由主控每帧只发一次；角色安全恢复在mount之前；正式camera必须保存/恢复main全部已验收参数。NPC借竿交谈由05/内容入口负责；收藏按钮用ports.openBook('collection')接07，卖鱼接05，不以本页只读收藏替代完整书页。08/09提供getHandPosition专用握杆坐标/姿势及getModel规范尺寸轴向后的模型；借入模型缓冲归资产管理器销毁，模块只销毁自建GPU对象。

## 未完成项与条件

阿青为真实旧书生模型，专用手臂握竿/收线动作尚未制作验收；所得是程序几何替身，未进行Tripo生成。不得把逻辑分件标成正式美术完成。正式main输入/相机恢复、真实09演出、05卖鱼/杂物、06修缮、07完整风物志未整合；Safari/触控/参考设备P95及真实切应用失焦、2–3人首次试玩未测。自然掉落概率未作统计；珍稀/杂物/鲤鱼为显式DEV服务种子，固定木牌不是随机。约14.4秒仅钓鱼模块活动时间，不能算20分钟主线实测。整关发布条件仍未满足。

## 实际验证命令

- node --test src/chapter2/fishing/fishing.test.js →21/21。
- node --test $(rg --files src -g '*.test.js') →194/194。
- node scripts/validate-chapter2-contract.mjs content src/chapter2/content/content.json --ready →通过；scene对应anchors.json通过。
- python3 docs/chapter2/fishing/audit-scope.py →通过。
- esbuild打包src/chapter2/fishing/index.js，bundle/write:false/format:esm →通过，JS808407字节/CSS1976字节，无警告。
- Playwright命名session chapter2-fishing，run-code执行browser-01…06.js，console与requests --static日志保留。先前驱动失败与不适用CLI命令日志也保留并在verification.md说明。
