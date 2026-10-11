# 05 商铺、补给与精力界面交付

**COMMERCE_READY：true（独立副本真实核心与浏览器验收）；正式主工程整合：未执行。**

基线 `2026-10-02-core-fishing-ready-v2`，契约1.0.0。副本 `/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/05-commerce/qingming-game`；交付于2026-10-03。

## 交付内容

渔夫鲁七只收鱼；顾娘子收普通杂物、售藏物、一次铜铃换盏及最近10笔回购；王小满提供蒸饼/粥/茶、实际封顶恢复量及赊食。冻结NPC/店铺ID与实测站位均已绑定。收藏保护解除与出售分两次确认，故事历史保留；回购恢复原实例，交付他人的铜铃不能回购。

HUD显示余额、精力、预留及欠账，低于20引导饭铺，欠债耗尽引导鲁七偿债差事。金额、库存、恢复量、耗力和所有成交都读取/调用真实CORE_READY，不复制reducer，不另建存档、价格表或精力计算器。

菜单借用锁与镜头，取消未确认报价不成交；成功有收据页，连点不会再次提交。保存失败保留核心内存候选、显示提示与同笔重试；关闭后HUD重试不会重开菜单。Esc/输入聚焦Esc/关闭/失焦/刷新/销毁均验证。CSS局部命名。

`files/` 为按工程相对路径排列的可审查源码及文档；`commerce.patch` 为新增文本补丁；`files.json` 记录每个文件原基线/当前SHA-256（新增文件原基线为null）；`evidence/` 保存测试日志、浏览器脚本/完整结果、截图与只读核验记录。未复制资产或node_modules。

## 实际验证

- 商铺测试：15/15；全量：209/209（原基线194 + 新增15），0失败。
- 独立入口 Vite 构建通过，命令 `node docs/chapter2/commerce/build-preview.mjs`。
- 真实浏览器A：31项断言；B：18项断言；合计49项，附v3 localStorage完整快照与backup读回证据。
- 五段连续RAF/原moveActor路线共201.3米、4358次采样。救急鱼由真实04 UI钓获；七次真实扣费取消后仍可走到鲁七清债，不赠钱，再回饭铺赊食恢复。
- 换页失焦验证关闭了Playwright默认强制焦点设置，实际关闭菜单并恢复相机；销毁商铺只注销三个NPC和自身输入，两钓点继续保留。
- 272个原有只读文件与冻结清单SHA-256未变；主工程旧文件仅做只读校验。未初始化Git/worktree、重装依赖、改公共status或覆盖其他副本。

测试起点的通关前置、0/0、95精力30文明确标为DEV fixture；动作结算采用真实服务。正式键不变证据属于本预览origin 5285的隔离浏览器profile，未宣称检查主工程origin的真实玩家档。没有真人试玩或线上发布。

## 主控接入

1. 合入 `files/src/chapter2/commerce/**` 及独立预览入口。入口是DEV验收页，不代替正式main。
2. 在装配层导入 `create` from `src/chapter2/commerce/index.js`；传入与04/06/07共用的同一个service、D覆盖world、registry、locks、gate、camera与P0 ports。调用update/cancel/dispose。公共progress继续由主控拥有。
3. 05默认注册三个冻结NPC id；若10拥有正式对白注册，传 `{registerNPCs:false}`，对白释放原锁后调用 `commerce.open(shopId,tab?)`，保留面对面检查。不要重复注册NPC或通用scene anchor。
4. 主控唯一tick继续管理自然衰减，商铺锁期间operative=false。只向最上层 `c2/commerce` 分发语义键；Escape优先处理输入框，Enter/Space由原生聚焦按钮处理，防止重复事件。
5. 接上 `ports.navigate(anchorId)` 和正式 `ports.openBook('collection')`。还债已经由core收入抵债或settleReliefWork结算，不能再扣一次。
6. 需要饭铺陈设时挂 `mountWares({scene,sources})`（wares.js）：现有steamer、pot、bowl形制。源资源由宿主拥有；移除clone不释放旧资产。旧王家与清和铺面保持原位；正式NPC模型由08/10提供。
7. 接入后复测主工程自己的浏览器存储、真实锁/镜头/对白交接，再由主控更新公共COMMERCE_READY状态。

**无须覆盖的旧文件：state.js、persistence.js、runtime.js、main.js、公共progress、原移动/相机/地标、契约与依赖清单。** 05未改任何旧文件；10仅在自己负责的装配入口导入模块并提供现有端口。

## 预览与未覆盖

在05副本执行 `npm run dev -- --port 5285 --strictPort`，打开：
http://127.0.0.1:5285/chapter2-commerce-preview.html?test&chapter2&session=commerce-review

已有七张截图：鱼售出确认、保存失败、换物确认、部分补给、赊食、手机补给、偿债后禁用差事。正式人物仍为灰盒；06/07/09最终界面与演出、主控main的真实整关装配未在本任务范围。未扩建其他五区，未将旧第一关可开当作第二关已可玩。
