# 00/10 主控接收、复测与05/06分配

2026-10-02；契约1.0.0；当前05/06基线2026-10-02-core-fishing-ready-v2。

03核心30文件已在真实主工程，与交付哈希完全一致；04钓鱼50文件本轮按清单增量合入。194项测试/0失败，契约、正式内容/实测锚点ready验证通过，原入口build通过（既有>500KB警告），钓鱼模块独立打包通过。主工程独立DEV预览6断言和真实核心卖鱼交易3断言通过；自动收藏/扣精力、镜头释放、刷新不重复发鱼、卖鱼后收藏保留、重复事务不重复付款均复测。Console零错误/警告；网络已记录请求正常。

真实主工程docs/chapter2/status.json已更新CORE_READY/FISHING_READY=true，其他玩法尚未交付。ASSET_READY/INTEGRATION_READY/HUMAN_PLAYTEST_DONE仍false。此处“合入”指交付源码和模块接收；main.js正式第二关入口/唯一runtime服务装配尚未实现，未把独立DEV预览称为整关可玩。

## 05 商铺、补给与精力UI正式分配

- 唯一可写副本：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/05-commerce/qingming-game
- 允许：src/chapter2/commerce/**、docs/chapter2/commerce/**、chapter2-commerce-preview.html
- 交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/05-commerce
- 端口5285，副本执行npm run dev -- --port 5285 --strictPort。
- 提示词：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/05_商铺补给与精力界面.md，分配头已更新，复制完整代码块即可。

## 06 修缮正式分配

- 唯一可写副本：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/06-repair/qingming-game
- 允许：src/chapter2/repair/**、docs/chapter2/repair/**、chapter2-repair-preview.html
- 交付：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/06-repair
- 端口5286，副本执行npm run dev -- --port 5286 --strictPort。
- 提示词：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发提示词/06_亲手修缮与报酬.md，分配头已更新。

两副本依赖就绪，可并行；主控未自动发送消息、启动新聊天或实现05/06玩法。先读自己的THIS-WORKSPACE.md、contracts.md、ownership.md、frozen-files.json、workspace-map.json，最新公共状态只读真实工程status.json。

main、核心、冻结契约/ID、内容/锚点、公共progress、原移动/相机及依赖清单只读。node_modules已独立复制，无需重装。不能写真实主工程、其他工作副本或把原入口可开当第二关已可玩。不初始化Git/worktree、不清档、不发布。

## 更新与可恢复性

05/06在刷新前校验旧基线602文件无变化、没有自有任务源码；仅增量同步63个依赖/metadata文件及归属说明，未全目录覆盖或覆盖任务文件。新基线660文件与冻结清单逐项校验。04/07/09仍保留各自旧基线副本，不擅自刷新。接口1.0.0和真实核心业务源码未改变，因此无ID/存档迁移。

恢复备份：/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/baselines/2026-10-02-before-control-acceptance-v2。原版metadata与05/06被替换依赖已保存；新增04交付由接收清单追踪。不可无差别清理或整目录回滚。

## 证据与接收清单

files.json列main相对路径、旧基线SHA与当前SHA，files/含本轮公共metadata/主控脚本/复测报告和两张截图。源码03/04的原交付清单完整保留，本报告不复制原数百MB资源。allocations-05-06-v2.json记录每副本逐项同步，final-v2-audit.json证明原有主源码未改、03/04交付一致及05/06新基线一致。

实际命令：node --test全部src测试（194通过）；node scripts/validate-chapter2-contract.mjs contract/content/scene（ready）；npm run build；esbuild打包钓鱼module(write:false)；node docs/chapter2/control/core-scene-content-preflight.mjs；Playwright chapter2-control-v2执行accepted-v2-browser.js与accepted-v2-commerce-service.js、console、requests --static。后者直接调用真实共享服务作交易检查，不能宣称05面对面菜单已做完。

构建、独立预览及内存预检不代替正式main运行时、真实失焦、参考设备P95或2–3位首次玩家20分钟体验。专用握竿姿态与正式道具GLB仍待08/09。下一步05/06/07/09产物交付后分批接收，再做00/10完整运行时装配和第一关回归，最后11技术/真人验收。
