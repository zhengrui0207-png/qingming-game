# 06 亲手修缮与报酬

基线：2026-10-02-core-fishing-ready-v2；契约1.0.0。工作副本：第二关开发工作区/06-repair/qingming-game。实际主工程、核心、内容、实测锚点、原移动/相机、依赖清单只读。

## 已实现的行为

修的是正式内容的空载旧木架：保留木面白痕，找出松绑缚、歪垫脚；拖动两块垫脚并坐实，拖动两段绳并固定，左/右/承托三面各稳住2秒试压。鼠标可拖放/按住；键盘方向键移动，Enter确认，部件确认后自动选下一件。30单位吸附容差约为工作台宽度5%，错误只重试当前部件/方向，不额外耗精力。这是教学简化，不声称复原宋代绳结。

开始显示当前/预留/可用精力，通过真实核心beginRepair预留18；取消核心cancelRepair，保留已确认的四个步骤之一、释放预留。未确认的拖动/试压局部状态不跨暂停保存。四步确认后停在显式“结算18精力”，最后一步刷新仍可回来；重新预留后核心completeRepair只扣一次。物理完成与报酬未选都会持久保存。chooseReward将16文或铜铃、任务完成与主线目标在同一真实事务提交，模块不在演出回调发钱。Esc暂不选可回访。现金路线短往事不白解锁铃；20文后购铃限一次，保护/出售/换盏由核心及正式storyRules决定。

程序木架会随摆放反馈，试压有小幅摇动；完成后架稳、货箱稳放，白痕仍在。动作cue给09；石伯占位用于独立预览，不触碰阿青原骨架。主线交架/结束/过门均交主控。

## 主控装配

```js
import {create as createRepair} from './src/chapter2/repair/index.js';
const repair=createRepair(context); // 唯一已有service，D区worldOverlay，原registry/locks/gate/camera/input
// 在主控帧循环内已有service.tick之后：repair.update(dt, activityFrame)
// 正式石伯对白奖励/回访分支：关闭对白锁后 repair.open()
// beginRepair对白已经成功预留时，open()直接进入现有active/ready，不重复begin。
```

模块只注册anchor_c2_repair；石伯的registry归剧情模块，06不重复注册NPC。open()对已完成的修缮在石伯锚点打开报酬/回访，在修缮锚点打开准备/续做。附近可站位[-63,.94,-39.5]同时够得到旧架和石伯；木架中心[-63,.94,-40.8]到石伯2.059米，完成后会解除活动锁、提示走近石伯，不能遥领奖。入口、更新及领赏采用原场景canInteract（包含LOS、层级、高差、原moveActor可达性），不只信核心的距离校验。

context使用冻结契约端口，附加可选：repairMount（DOM承载）、repairVisual（替换rig的sync/cue/update/dispose/getState）、repairCue（接收{owner,name,actorId,objectId}）、repairAnchors（主控同一实测清单）。owner=c2/repair；语义输入只发最上层owner。模块不挂window监听、不清全局gate、不自己tick、不创建另一个存档服务；局部DOM指针监听随dispose解除。create必须在浏览器DOM环境调用，控制器与workbench可在Node测试。主控应在open前释放对白锁，camera忙时拒绝开始；所有退出都release自身lease和lock。动画不能抢原书生行走骨架。

保存失败显示未保存状态并阻止新动作；retrySave重试原候选事务；Esc调用核心cancelPendingSave回滚候选，再cancelRepair解除预留。如果磁盘连回滚也失败，不能声称释放已保存的预留：会释放镜头和输入，保留可重试错误；刷新由核心恢复活动预留。全局其他模块的保存失败显示返回原操作处理，不擅自撤销别人的候选。

独立预览通过真实CORE_READY服务、正式content和实测anchors，原world.json/GLB、D区overlay、createScholar与moveActor。仅预览隐藏D区slots.repair旧牛车占位，新增木架，不改冻结场景文件。主控需与02/08确认该局部占位的最终替换；不能把整个第一关street-life隐藏。新木架是无公共资源文件的程序对象，正式物件碰撞/接触动画随08/09实景复核；此模块不自行改公共碰撞表。

## 复验命令与证据

```sh
npm run dev -- --port 5286 --strictPort
node --test src/chapter2/repair/repair.test.js
node src/chapter2/repair/build-module.mjs
npx vite build --config src/chapter2/repair/vite.preview.config.js
python3 docs/chapter2/repair/scope-audit.py
```

独立预览： http://127.0.0.1:5286/chapter2-repair-preview.html?test&chapter2&session=repair06-review

预览只在DEV及?test&chapter2启用，存档qingming:dev:chapter2:<session>，不碰正式qingming:hongqiao:save。首次HQ通关为明示fixture；“DEV准备剧情前置”通过真实服务做第一杆/卖鱼/接任务，其自动前置不是钓鱼或剧情真人验收。低精力与写入失败按钮均为明确DEV诊断。生产模块没有这些按钮或fixture写档入口。预览生产构建保留DEV门槛，不能当线上可玩入口。

浏览器操作脚本和截图在本目录：鼠标实际拖放、键盘实际操作与持键、Esc取消、两种刷新、两奖励及现金后购铃、保存失败/原事务重试/回滚、重复回访/行走恢复。双选连点是队列DOM事件压力样本（明示合成事件），并由真实核心状态测试复验。没有使用替身经济服务，没有编造真人试玩。

## 未覆盖与资产接口

REPAIR_READY只表示本模块独立玩法及真实服务测试通过；不是ASSET_READY、INTEGRATION_READY或HUMAN_PLAYTEST_DONE。程序石伯、木架、绳段和铜铃需正式美术；需demonstrate（指白痕/松处）、align（扶垫脚）、fix（拢绳）、test（空载左右摇压）、stable（松手/货稳）、listen（执缺舌铃不响）、pay（交钱）的替换动作。铃不可播放完整响铃，缺舌导致不响；脚步/物件音由09接cue，当前不伪造动作音。正式3D绳形、手部接触、物件碰撞与站位须资产到齐再核。

步骤/吸附/试压为本模块配置起点，经济18/16/20未改；设计目标首次操作约1–3分钟，自动化熟练流程更快，尚无真人时长证据。正式主控输入、演出优先级和第一关全流程浏览器回归仍需00/10；11负责参考设备性能、真实失焦和首次玩家测试。本机多浏览器并行时的帧时数据只作环境基线，不能推导参考设备性能达标。

## 最终结果

- 修缮模块测试15/15；全部src测试209/209。
- 四份浏览器脚本断言通过，最终控制台0错误/0警告，正式存档未变。
- 独立模块ES构建、DEV预览构建、三项契约验证通过。
- 656基线文件与21冻结文件未变，新增越界文件0。
- REPAIR_READY=true（独立模块）；正式美术、整关装配、真人试玩仍未完成。

详见readiness.json、verification.md、asset-interface.json；文件SHA256见交付files.json。
