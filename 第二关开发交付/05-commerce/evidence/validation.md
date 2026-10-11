# 实际验证记录

执行副本：05-commerce/qingming-game；基线：2026-10-02-core-fishing-ready-v2；契约1.0.0。执行跨2026-10-02/03（Asia/Shanghai）。

## 自动测试

`node --test src/chapter2/commerce/commerce.test.js`：15/15，通过（test-commerce.log）。

全量测试命令：`rg --files src -g '*test.js'` 得到21个文件，Python `subprocess.run(['node','--test',*files])` 执行，209/209通过，0失败（test-all.log）。新增15项使用真实 CORE_READY、正式内容、实测anchors、D覆盖碰撞和原moveActor；内存storage仅用于单元验证，不能代替浏览器持久化检查。

覆盖：NPC独立ID／面对面与遮挡、外部锁／镜头、取消／失焦／销毁、主控tick与菜单暂停、鱼价／数量／收入优先还债、非法数量、保护物与默认列表、补给上限／余额不足、现金与铜铃报酬、买卖差价、同实例回购／十笔限额、换物二次尝试、保存失败关闭后重试、未确认刷新、赊食保鱼／七杆取消／债务差事不赠钱、0精力正反向实走。

`node docs/chapter2/commerce/build-preview.mjs`：Vite独立入口构建通过，输出仅在本任务docs目录。DEV验收入口在生产构建中提示限制，不用于线上发布。

## 浏览器

命令：在05副本运行 `npm run dev -- --port 5285 --strictPort`；以 Playwright CLI 命名会话 commerce05 打开 `http://127.0.0.1:5285/chapter2-commerce-preview.html?test&chapter2&session=commerce-browser-v1`。

`python3 run-browser.py browser-a.js`：31项断言通过（browser-a-result.json / browser-a.log）。真实DOM按钮操作与真实共享服务连接；对照 `localStorage.getItem(key)` 读回v3完整存档与backup，并验证本预览origin中的正式键未变。

A覆盖：3次真实钓获库存、0数量拒绝、Esc未确认不成交、同一DOM确认连续点击、卖空、按原凭证鱼回购、写失败候选保留／HUD同笔重试、刷新不补发不成交、修缮现金分支上架／18买7卖、收藏保护解除与出售分开、原盏实例回购及历史计数、铜铃换物一次／不能回购／保留故事、95精力真实+5而非+30、满精力禁买、0/0赊食+30欠4首杆保鱼、390px宽度无横向溢出、无pageerror。

`python3 run-browser.py browser-b.js`：18项断言通过，5段连续路线共201.3米、4358次原moveActor采样（browser-b-result.json）。与A合计49项浏览器断言。B验证：原moveActor/RAF连续站位路线、真实04 UI救急钓鱼、出售先还债、真实扣费七杆取消与无精力偿债、回饭铺再次恢复、实际失焦／镜头恢复／输入聚焦Esc／Tab／销毁。记录以 browser-b-result.json 为准。切换标签测试关闭 Playwright 默认 Emulation.setFocusEmulationEnabled=true；否则两页均呈现hasFocus=true，不能算失焦证据。该测试不以伪造service或修改钱包代替结算。

## 样本与故障修复

初始通关与0/0、95精力30文属于明确隔离fixture，不是玩家真实档。三次钓获、两种修缮奖励、故事resolve、买卖/回购/赊食全部由真实核心动作产生。连续取消失败路线的精力由7笔核心钓杆耗用，未从UI写一份精力。

浏览器曾发现DEV重建样本时仍有缓存tick。现先 service.flush() 并检查结果再恢复fixture，防止旧计时跨入未初始化状态；旧样本可能没有可选 regionPositions，读取改为可选并遵守真实enterChapter2门槛。这两项修复限于独立DEV预览，核心未更改。中间失败不计入通过；最终成功结果留档。

截图：01-fish-confirm、02-save-failure、03-barter-confirm、04-food-partial、05-relief、06-mobile-food、07-relief-work。已目视核对纸页、金额/债务说明、按钮禁用与移动宽度。正式NPC是灰盒，占位形体不能冒充最终模型。

## 范围核验

`python3 docs/chapter2/commerce/scope-audit.py`：272个原有只读文件、冻结清单全部SHA-256未变（scope-audit.json）；对主工程main、核心、状态/存档、移动、交互和依赖清单做只读SHA对照。新增代码与预览只写允许路径。没有Git初始化、worktree、依赖安装或主工程覆盖。

## 未覆盖

正式main/公共progress/主控camera/input未装配；08正式人物模型、06修缮UI、07正式风物志、09演出未在本模块内整合。未检查主工程自己的浏览器origin/真实玩家存档，未声称整关或真人试玩通过；未发布线上。交给10在同一共享service/locks/camera/registry中复测并设置公共状态。
