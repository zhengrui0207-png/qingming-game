# 实际验证命令

以下从02工作副本执行，所有输出均在任务允许目录。

```sh
npm run dev -- --port 5282 --strictPort
node --test src/chapter2/scene/scene.test.js
node --test src/world.test.js src/chapter2/contracts/contract.test.js
node scripts/validate-chapter2-contract.mjs scene src/chapter2/scene/anchors.json --ready
node node_modules/vite/bin/vite.js build --config src/chapter2/scene/vite.preview.config.js
python3 docs/chapter2/scene/audit-assets.py
python3 docs/chapter2/scene/check-export.py
```

Playwright使用命名session=scene02，cwd为本副本docs/chapter2/scene，以免工具默认产物写到任务范围外。

```sh
/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh -s=scene02 open http://127.0.0.1:5282/chapter2-scene-preview.html --headed
/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh -s=scene02 run-code --filename=browser-start.js
/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh -s=scene02 run-code --filename=browser-final-capture.js
/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh -s=scene02 run-code --filename=browser-views.js
/Users/zhengrui/.codex/skills/playwright/scripts/playwright_cli.sh -s=scene02 console error
```

browser-start：真实W键650毫秒后，按按钮启动无瞬移的连续RAF实走。browser-final-capture：等待autoDone，输出18次到达及回访、全程walk样本、11锚点向下射线和性能采样。browser-views：诊断定位截图，浏览器GLTFExporter导出D根对象，明确不把定位截图当完整步行证明。

10条入口可达路径由节点测试逐段双向验证；连续RAF演示覆盖9个功能终点及其反向回访，safe_return由独立双向测试验证。C侧[0,.94,-20]到D入口[-22,.94,-20]也用原moveActor双向检验，到达误差小于1e-12。没有真人试玩，没有自动接正式入口，也没有localStorage写入。

构建只打包独立场景预览，publicDir=false，不重复复制原87MB世界。静态产物仍需主工程既有/assets目录；build-preview并不是完整独立游戏发布包。构建提示Three.js打包块超过500kB，记录为体积提醒，不表示构建失败。

Vite按预览命令首次启动产生node_modules/.vite工具缓存；无依赖安装、清单修改。此缓存不作为源码交付；预览构建自有cacheDir位于docs/chapter2/scene。
