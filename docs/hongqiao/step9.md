# Step 9 交付准备

本步基于真实工程 `/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`，沿用 Vite 构建，未部署外网；运行时代码仅局部修复旧档迁移，未改移动、相机及正常任务流程。开场动画按用户要求不测试，入场后用 Esc 跳过；资源仍随包加载，不将加载成功写成开场验收。

## 构建与包

- 原始构建：`npm run build -- --base=./ --outDir=output/step9-build`。
- 清单打包：`python3 scripts/package-release.py --source output/step9-build --target output/release-step9/qingming`。
- 最终目录：`output/release-step9/qingming/`。131 个清单内文件，174,214,093 字节，另有 release-manifest.json 清单自身。99 个 GLB，其中 90 个使用 Draco；GLB 内未发现需要额外外部加载的图片或 buffer URI。
- 包含本地纹理、Draco JS/WASM、三件任务物、正式 NPC/LOD、剧情船、音频、系统字体后备，以及接收者 RUNNING.md。
- 白名单未带入 `.tripo`、凭证目录、建模工程、旧预览图片、node_modules、源代码或自动化截图。文本凭证模式检查未发现命中；资源 SHA-256 校验全部一致，构建源码哈希与当前文件一致。
- Vite 构建成功，仍有主 JS >500kB 提示；本步不为压包重构已验收渲染。

## 浏览器生产版验证

实际服务是 Python 标准静态服务器，不是 Vite DEV：

```sh
python3 -m http.server 5189 --bind 127.0.0.1 --directory output/release-step9
python3 -m http.server 5190 --bind 127.0.0.1 --directory output/release-step9/qingming
```

非根路径为 http://127.0.0.1:5189/qingming/ ，根路径为 http://127.0.0.1:5190/ 。基于同一交付包，没有重编译切换 BASE_URL。

生产全流程使用全新浏览器上下文，初始无存档。没有传送/注入任务状态，也没有打开 ?test。通过实际键盘行走与按钮：入场跳过开场 → 老周接取 → 何伯授权/拾取绳 → 程大年授权/拾取杆 → 刷新保留两物 → 方娘子授权/拾取布 → 返回老周明确交付 → 结束演出/收尾卡 → 四故事解锁 → 完成后刷新保持终态。生产版确认没有 DEV setActor/__hqProgress 接口。

`output/step9-evidence/browser.json` 记录 14 项全部通过；Console error、warning、pageerror、失败请求与 HTTP 错误均为 0。127 个去重 HTTP 资源地址全部位于 `/qingming/` 下；5 个外部纹理文件、本地 GLB、Draco wrapper/wasm 成功加载，网络字体请求为 0。完整收尾及故事列表截图保存在该证据目录。

外网依赖验证：从冷浏览器上下文开始拦截所有非回环请求，同时保留本地 HTTP 服务，上述整个流程仍通过；不是只观察“本地页能打开”。未断开电脑网卡，也未把本地服务关闭当成离线测试。无 Service Worker，离线需保持本地 HTTP 服务器运行。史料资料出处是外部链接，主动打开时仍需联网；首次 npm ci 也需网络。

65 项原世界、交互、任务/存档、演出状态测试通过，输出见 tests.txt。测试设备 Chrome 152 headless、1280×800、DPR 1；自动化结果不等于真人首玩。

## 文件和提交边界

本步源文件包括 src/hongqiao/state.js 及其迁移回归测试、README.md、scripts/package-release.py、scripts/release-running.md、docs/hongqiao/step9.md 与状态记录。生产目录属于交付产物，自动化脚本/日志/截图放 output/step9-evidence，均不混入运行包。

真实游戏目录仍无 Git；没有伪造提交号，也不把其他资料仓库的提交当成本工程提交。README 开始前副本在 revisions/step9-before。最终 README 顶部是本次命令，旧版公网地址、旧打包方式保留为明确标注的历史记录。

## 已知限制

开场镜头、移动端、Safari、低配置设备、外网服务器 MIME/缓存配置、本机以外操作系统的字体表现未验收；本步仅走一种正常收集顺序，乱序分支由既有任务测试覆盖。大场景与人物首次加载耗时、内存/GPU需求仍较高。无云端存档/自动跨来源迁移；发布或回退需整份目录切换并保留用户浏览器数据，不要清空存档。


## 旧档迁移局部修复

第一次生产旧档检查发现：v1 的顶层 collectedInstanceIds 被 defaultState 的 worldState 空数组抢先覆盖，导致迁移库存存在但对应场景物品可能重生。已将读取顺序改为原始 input.worldState 字段优先、v1 顶层字段后备，不从合并默认值读取。新增回归检查迁移、授权补齐、重复拾取拒绝与再加载，保留显式新结构优先级。首次失败证据为 compatibility-before-fix.json；最终包已经重新构建，不以旧候选包的通过结果代替最终包。


修复后兼容性生产验证 7/7：同一相对路径包在根路径冷启动；v1 未完成旧档迁移保留库存、权限与已拾取 ID，未错误解锁全文；v1 完成档保留任务和旧已读记录并解锁四篇；切换端口后不自动继承存档。结果见 compatibility.json，Console/pageerror/请求失败/HTTP 错误均为 0。


## 最终收口

最终包重新执行新档完整流程 14/14、根路径/旧档/来源隔离 7/7，共 21 项生产浏览器检查通过；65 项自动测试通过。主流程 Console error/warning/pageerror、两个浏览器任务的请求失败/HTTP 错误均为 0。最终主 JS 为 index-pODSg_50.js（不同于修复前候选），最终源码与清单哈希一致。Node 22.13.0、npm 10.9.2、Python 3.12.1。摘要见 output/step9-evidence/final-summary.json。

本步小文件差异见 output/step9-evidence/step9-only.patch；产物和截图未放入该补丁。旧候选大目录已清理，仅保留修复前失败 JSON 与源文件备份。当前交付已就绪，未部署外网，等待下一步指令。
