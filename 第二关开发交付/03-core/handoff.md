# 03 共享状态、存档与接口交付

2026-10-01 · 契约1.0.0 · 基线2026-10-01-p0 · schema v3

**CORE_READY=true（03核心交付）**。真实服务、第一关回归、迁移、C2事务和异常测试通过，真实浏览器localStorage检查通过。不是替身服务。**INTEGRATION_READY=false，HUMAN_PLAYTEST_DONE=false**；真实工程的公共status.json未改，主控接入并复测后才应更新其CORE_READY与创建第二批副本。

唯一工作副本：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/03-core/qingming-game`。
交付目录：`/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发交付/03-core`。

## 成果

沿用虹桥完整快照和原存档key，扩展铜钱、精力/预留、数量及唯一实例、永久收藏/现持有状态、故事/阅读位置、店铺库存与回购凭证、债务、互斥报酬、钓获序号/已确定结果/保底、主支线、区域位置及时间记录。进入检查真实虹桥completed且endingPending=false，只首次发8文/80精力，迁移和回访不补发，C区不扣C2精力。

真实服务入口src/chapter2/core/service.js；纯业务规则state.js；唯一持久化入口仍为src/hongqiao/persistence.js。C2不能复制reducer或自己分写存档。新增状态兼容字段：travel.fishing.lastCast（结算/刷新记录）、travel.regionPositions.region_d（实际actor位置）、chapter2.timing.operativeSeconds/lastWallAt/clockAnomalies；没有暗改冻结contract。

钓鱼提交/确定/结算、整笔买卖、换物/回购、即食、修缮预留/进度/取消/成功、二选一报酬、救急及债务恢复、主线交付、故事与演出确认全部实现。ID最近256凭证、高水位、同ID异参数拒绝；安全整数/类别/所有权/保护/库存/实际可达检查。抛竿时结果入快照；教学/救急/固定木牌与20次普通成功保底分开计数；刷新不重抽不退钓杆4精力。维修刷新释放预留并保留步骤，成功扣18一次。保存失败保留页内候选、明确提示、锁住后续事务；重试用原ID，只在完整读回确认后发布订阅。返回凭证与订阅值均隔离于服务内部状态，UI不能用返回值改写余额。

原98个第一关测试、15契约测试、40新增真实核心测试，共153通过/0失败；浏览器11项存储断言通过；原入口与核心预览均构建成功。原入口构建保留既有>500KB包体警告，不把构建成功当成帧率或第二关可玩验收。

## 交付和合并

files.json列相对路径、baseSHA256或null、交付SHA256与字节数。files/只含本次源码/文档/证据，没有复制原模型。legacy-adapter.patch仅含三个原文件的差异，供审查；新core文件直接按清单合并。主控合并前比对baseSHA256，存在新改动则逐段合并，不全目录覆盖。交付目录原有README.md与p0-contract-tests.log保留。

需要接入的旧文件：

1. src/hongqiao/state.js、persistence.js及对应state.test.js：接收本次真实修改。
2. src/hongqiao/runtime.js：主控增加chapter2参数，仍只创建一个createProgressStore；通过asSharedService(store)把同一store交给C2。旧HQ保留clone读和boolean retry语义，C2用冻结读和DispatchResult。03没有改runtime.js。
3. src/main.js：注入真实ports.getFrame、01正式content、02实测anchors；虹桥结局确认后才接入口。每帧只调一次tick，在隐藏/离区/dispose时flush和取消活动；移动、相机、输入和锁的责任仍在主控。03没有改main.js。
4. 公共progress/book入口：读取共享实例/收藏/故事与事务结果，不能另造钱包或reducer；UI明确显示save-failed，给retrySave和cancelPendingSave。03没有改这些入口。

行为、错误、时间/存储规则和接入代码见files/docs/chapter2/core/API.md。主控复测建议：两报酬路线、旧档实际load、进入/回返/刷新、失败写入与重试、真实店铺/钓点距离与层级、失焦活动释放，以及共享service只实例化一次。

## 迁移与证据

变更前已保留P0提供的真实自动化浏览器样本和两个历史样本包，来源标注未改；不是用户日常个人存档。共12份完整样本升级v3，数量/权限/四故事/阅读位置/版本/开场及结局行为保留。旧playing开场按第一关原有恢复逻辑转seen防止遗留演出卡住，报告列为预期变换；没有C2提前赠送。原raw完整备份、损坏恢复、写入失败保留及重试仍有效。migration-report.json/log给逐样本结果。

browser-results.json和browser-storage-evidence.json记录真实localStorage及完整快照；正式key检查前后均未改。browser-core.png是独立核心面板截图。browser-checks.js可通过Playwright CLI run-code重跑，命令与结果见VALIDATION.md和日志；首次favicon.ico404留在浏览器记录中，不是核心异常。没有编造真人试玩。

边界校验：03副本在341原基线文件中只改3个授权原文件，21冻结文件全部一致；真实工程341基线全部一致，无Git初始化/工作树/依赖清单修改。scope-verification.json含最新真实status快照。

## 未覆盖和精确前置

- 当前真实status仍CONTENT_READY=false、SCENE_READY=false。需要01的src/chapter2/content/content.json（完整sections、contentVersion、非空storyRules条件，draft=false）及02的src/chapter2/scene/anchors.json（11个真实position/layer及实测可达证据）。core读入正式内容/坐标的路径由主控装配；缺失时故事推进/阅读与可达操作明确拒绝，没有用占位宣称完成。
- 预览锚点和故事单元正文都明确是fixture；不能作为正式场景可达、史料正文、UI/相机/移动或第二关已可玩的证明。当前测试证明服务行为，正式内容和场景装配须主控复测。
- 自然计时内部按约1秒checkpoint，突然崩溃至多丢不足1秒未checkpoint的自然计时；任何已发物/扣钱/钓杆/报酬都是即时完整事务。主控必须传当帧前台dt，隐藏/失焦时seconds=0；不能传离线墙钟差。
- 第一关runtime尚未接入C2，第二批模块尚未创建；08资源、09演出声音、10完整装配与11真人/性能验收未完成。本轮未扩建A/B/E/F。
- 20分钟只是目标，墙钟含必要阅读/补给/交易/演出，不从暂停精力的时间里删掉；需2–3位真实首次玩家后续实测。

预览开发服务：`http://127.0.0.1:5283/chapter2-core-preview.html?test&chapter2`。启动命令`npm run dev -- --port 5283 --strictPort`，仅DEV、自动化隔离key；不是生产发布。
