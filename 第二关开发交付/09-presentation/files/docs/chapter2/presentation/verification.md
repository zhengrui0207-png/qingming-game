# 实际验证报告

2026-10-05，09独立工作副本基线2026-10-01-core-ready-v1，契约1.0.0。真实服务、正式内容、实测D锚点、原world.js运动、真实GLB场景/阿青骨架/车轮分件参与验证。DEV起点是明确手工第一关完成fixture，后续任务均经真实03服务按实际锚点顺序执行；不是玩家正式存档、不是完整main装配、不是真人试玩。

## 结果

- 全部213项Node测试通过，0失败：原基线173项，09新增40项。`all-tests.txt`为实际输出；`unit-results.txt`为最终09测试40项输出。
- 独立浏览器断言117/117：105项主检查、5项资源失败/双dispose、7项真实键盘/窗口变化/恢复后实走。三份 `*-results.json` 有每项结果，CLI脚本和原始日志可重跑。
- 6张逐镜截图，额外保存失败、开书恢复、音效404恢复截图；视图1280×800，像素比上限1.5，所有画面来自真实浏览器。
- 实际录屏 `output/playwright/intro-ending.webm`：画布24fps采集＋同一主控音频master，12秒入区与16秒结局真实RAF播放。记录不包含HTML字幕/按钮层，字幕与机位另见逐镜浏览器截图。视频格式/时长/音轨实测见 `video-inspection.json`，播放回执见 `recording-results.json`。
- fresh reload控制台0错误、0警告，快照见 `storage-and-console-results.json`。音效404试验有故意注入的错误，与正常加载结果分开保存。
- 215份只读基线文件、21份冻结文件校验全部一致；依赖清单不变，无Git初始化，新source/doc没有越界。`scope-audit.json` 有精确数量与结果。

## 覆盖说明

镜头每0.1秒采样检查有限数值与连续切点；在0、0.17及每个切点前后、段中/结尾实际略过，检查完整相机快照、锁、演员、钱包/库存/唯一实例/收藏/目标/报酬不变。实际浏览器取样不是声称穷举连续时间所有点。

两条真实报酬路线：完成教学鱼并出售、完成四步修缮、选择现金16文或铜铃、交付、完成主线，然后演出。现金路线30文/铜铃路线14文；演出不再增减。自然播完一次；每条反复回顾4次并略过，整个core snapshot不变（包括墙钟事件/故事字段）。

保存失败：在ending ack前注入真实storage写失败，核心保存候选保留，seen仍pending、UI明确错误、相机/输入释放、新片不能开。解除故障后重试原ID，一次确认seen，铜铃始终同一唯一实例。真实刷新前后核对经济/位置/任务/报酬/seen及无遗留锁；没有清档代替重试。09预览origin的正式键初始均不存在、结束仍不存在，见原始键记录；未读取或写入其他端口真实游戏的个人存档，这不能替代真实主工程整合检查。fixture准备前flush，故障未解除时拒绝重置fixture。

真实失焦：另开浏览器标签页并切前台，关闭Playwright强制focus仿真后读取document.hasFocus=false；own FX/舞台/相机/锁释放，pending保持，返回焦点不重开。隐藏/离区/资源异常/抢占/dispose等另有控制器单元覆盖。开书使用明确验证页，证明原相机归还且只剩书自己的锁；没有将它称作07真风物志整合。

声音：11个效果文件全部HTTP读取并decode，逐个真实Web Audio输出analyser RMS>0，数据在browser-checks-results.json。静音输出0、FX释放；缺舌铜铃不触发铃音。最多两路FX＋一条床声、去重、缺host master安全静音、pause/hidden/late download寿命均有单元检查。单元音频窄替身只检查端口与寿命，不作为实际可听证明。声源12份SHA逐一比对（11效果＋河岸床声），`sound-source-audit.json`全部一致，没有购买云生成。

手与绳实际浏览器握持阶段距离<0.001米；结束后松手距离自然非0。真阿青40骨骼参与拍摄和全姿态恢复；真实cart两只车轮分件参与时间线。四位NPC为程序化双段手臂/根朝向原型，不是08正式人物或04真握杆动作。片末只看D出口，不创建E区。

## 重跑命令

从09工作副本执行：

```sh
npm run dev -- --port 5289 --strictPort
node --test src/chapter2/presentation/presentation.test.js src/chapter2/presentation/audio.test.js
node src/chapter2/presentation/build-preview.mjs
python3 docs/chapter2/presentation/audit-scope.py
```

全量测试实际使用 `rg --files src -g '*test.js'` 得到文件列表，然后 Python subprocess 调 `node --test`（all-tests.txt）。浏览器首次使用Playwright技能wrapper打开命名会话 presentation09，后续用当前环境已缓存CLI运行 `run-browser.py`＋browser-checks.js/resource-checks.js/control-checks.js/visual-probe.js/recording.js/storage-and-console.js。run-browser.py里的缓存CLI绝对路径只是本机验证路径，其他机器需换成安装好的Playwright CLI；不修改工程依赖。不要并行跑多个浏览器脚本或在录制中修改源码，否则预览热刷新会打断检查。重拍前恢复验收面板展开状态；脚本已自动处理。

DEV预览只能在Vite开发环境配合?test&chapter2使用，生产构建会保留DEV门槛，不可把构建出的DEV预览页当发布入口。另一个module-build确实编译生产可导入演出模块；正式挂接仍用源码，见integration.md。

## 未覆盖

实际main借镜头/输入/音频闸、第一关完整演出与第二关衔接、07真实阅读、04/06专用动作同步、08正式NPC和城门外观替换后的遮挡、移动端触摸、参考设备性能、真人听感及首次通关时间。主工程INTEGRATION_READY/ASSET_READY/人试玩标记仍false，未发布线上。
