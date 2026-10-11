# 实际验证 · 2026-10-01

全部命令在03副本执行；没有安装依赖，没有修改真实工程。

| 验证 | 命令/方式 | 实际结果 |
|---|---|---|
| 全部已有与新增测试 | `node --test src/*.test.js src/motion/*.test.js src/interaction/*.test.js src/hongqiao/*.test.js src/hongqiao/cinema/*.test.js src/chapter2/contracts/*.test.js src/chapter2/core/*.test.js` | 153通过，0失败；98旧测试、15契约、40核心；test-full.log |
| 原入口构建 | `npm run build -- --outDir docs/chapter2/core/build-proof` | 成功；build.log；保留既有>500KB包体警告；不是第二关可玩证据 |
| 核心预览构建 | `node src/chapter2/core/build-preview.mjs` | 成功，12模块；build-preview.log；预览DEV门禁，生产不启用fixture |
| 开发服务 | `npm run dev -- --port 5283 --strictPort` | 127.0.0.1:5283，strictPort成功；预览用chapter2-core-preview.html?test&chapter2 |
| 浏览器存储 | Playwright headed Chromium、browser-checks.js | 11断言全部通过；真实localStorage；browser-results.json、browser-checks.log、browser-storage-evidence.json与browser-core.png |
| 迁移样本 | `node docs/chapter2/core/migration-report.mjs` | 12完整样本迁移v3；无v2意外丢字段，无C2提前赠送；migration-report.json/log |
| 写入边界/基线 | SHA256逐项对比341基线文件与21冻结文件 | 副本仅3个原文件修改，其他新文件全部在授权路径；真实工程341基线未改，21冻结文件未改；scope-verification.json |

浏览器检查覆盖：实际v2 raw写入自动化隔离key后加载迁移、原v2完整备份、正式门槛及首次赠送、教学结算、抛竿刷新保留seed/结果且不退精力、注入写入失败保留候选并阻止下一杆、重试读回一次成交及重复ID、重载不补发、现金与铜铃两条分支、坏主档用完整backup恢复、正式key完全不改。

截图只是核心调试面板。锚点明确标为fixture，正文单元测试也是fixture；没有把这些写成02测量或01正文验收。没有移动/相机/场景装配/真实商铺UI/真人试玩的本轮验收。浏览器首次请求favicon.ico产生一条404，与核心异常无关；没有隐藏该记录。

build-proof临时目录仅用于验证原入口构建，含自动复制的既有public资源，完成后只删除本任务生成的该目录；交付不复制原资产。原日志保留。预览源码与开发服务仍可打开。
