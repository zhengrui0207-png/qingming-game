# 对话框与风物志阅读修复 · 2026-09-16

本轮只响应对话框按钮越界，以及风物志取消外跳、直接展示原文、删除底部提示的要求。不修改人物、玩家运动、相机、交互键位、任务效果和存档逻辑；上轮音效提示词仍未生成或替换音轨。

## 对话框

真实入口 `src/hongqiao/quest-ui.css`。原 `margin:auto auto 7dvh` 把面板压向底部，移动断点还有 `margin-bottom:4dvh`；797×298 的实际浏览器视口中，“继续”按钮底部到 303px，已经越界。改为固定定位 `inset:0;margin:auto`，高度不超过视口减 32px，保留内部滚动并阻止滚动传递。

Chrome 自动化验证 1280×800、1594×596、797×298、600×320、390×260 五种 CSS 像素视口；居中误差小于 1px、面板边界均在视口内。真实点击“继续”，三个选择按钮可命中，Esc 取消后释放输入锁。小视口用于覆盖窗口缩小/放大后的可用面积，不冒称操作了浏览器缩放菜单。报告 `output/dialogue-layout/before.json`、`after.json`，截图 `before-short.png`、`after-short.png`。

## 风物志

- `src/storefronts.js` 共用渲染入口：段落脚注和文末来源都改成普通文字，所有风物志条目不创建链接，不打开新标签。
- 删除 `history-note` 的显示节点和填充调用；“本条据古籍介绍……”不再显示。条目数据中的考据记录保留供维护，不渲染到玩家界面。
- `src/history-excerpts.js` 按稳定来源 ID 提供 11 类古籍摘录，覆盖全部当前古籍引用。多个片段分别显示，避免把不连续原文拼成一句。现代博物馆资料保留普通文字出处，不伪造古籍引文。
- `src/style.css` 为原文引用块增加宋体、行距和细竖线，保持既有风物志配色。

摘录核对《东京梦华录》古籍原文，简体转写，来源及读取版本：

- [卷一·河道、外诸司](https://zh.wikisource.org/w/index.php?title=東京夢華錄/卷一&oldid=854041)：river、granary。
- [卷二·酒楼、东角楼街巷、潘楼东街巷](https://zh.wikisource.org/w/index.php?title=東京夢華錄/卷二&oldid=1503040)：wine、east、pan。
- [卷三·雇觅人力、诸色杂卖](https://zh.wikisource.org/w/index.php?title=東京夢華錄/卷三&oldid=2313204)：broker、selling。
- [卷四·食店、修整杂货及斋僧请道](https://zh.wikisource.org/w/index.php?title=東京夢華錄/卷四&oldid=1488155)：food、crafts。
- [卷五·民俗](https://zh.wikisource.org/w/index.php?title=東京夢華錄/卷五&oldid=1488156)：clothes。
- [卷七·清明节](https://zh.wikisource.org/zh-hans/東京夢華錄/卷七)：festival。

这些核查地址仅在维护文档中保留；游戏运行不用联网取古籍内容。实际浏览器检查袋家、牙人、桥头脚店，均有原文、零链接、无提示框，返回后可恢复操作。测试记录中名为 bridge 的站位被近处牙人优先触发，实际标题已记录，不能冒称该次检查了虹桥条目。所有条目复用同一渲染入口；未逐个走遍全图每家店。

## 构建和范围

构建命令、产物与启动命令见 README。新包为 `output/release-dialogue-history/qingming/`，保留旧包。局部打包修复：`scripts/package-release.py` 加入当前音频加载器需要的 `audio/manifest.json`，避免生产环境 404。

当前共享工程含其他任务对演出、音频、人物资产、main.js、npc-assets.js、street-life.js 的更新，本轮没有重写这些文件。新包实际包含这些现有内容；本轮不将它们的行为标记为验收通过。现有 >500kB 分包提示保留。开场演出跳过，未重跑完整通关、旧档迁移、Safari 或真人试玩。

工程无 Git。修复前备份：`revisions/dialogue-layout-before/`；本轮范围补丁 `output/dialogue-layout/fix.patch`，哈希与校验记录 `output/dialogue-layout/file-hashes.json`。不提交其他任务修改或资产，不部署外网。

## 最终结果

9/9 相关人物与交互自动检查通过；五尺寸对话框布局、继续点击、三个选项命中和取消恢复通过；三个实际风物志条目检查通过。生产包从新浏览器上下文实际键盘走到老周，7/7 检查通过，Console 错误 0、HTTP/请求失败 0。非本地网络拦截开启，资源均本地加载。生产报告 `output/dialogue-layout/production.json`，截图 `production-dialogue.png`、`production-history.png`。

新包 157 个清单文件、200,718,208 字节，全部 SHA-256 核验一致；运行源码与构建记录一致。最终入口 http://127.0.0.1:5198/qingming/ ，旧包保留，未清除用户存档。
