# 09 主控挂接说明（契约 1.0.0）

模块源码 `src/chapter2/presentation/index.js` 可实际导入；主控只拷贝 files.json 指定的 09 文件。不得拷贝整个副本，不替换契约/03服务/主相机/第一关 cinema。09 副本仍为 2026-10-01-core-ready-v1，没有自行同步 v2。

## 创建与生命周期

```js
import {create as createPresentation} from './chapter2/presentation/index.js';
const presentation = createPresentation(chapter2Context, {
  // 以下是09自己的可选资源配置，不是新建的公共 ports。
  audioControls: {
    audioContext: () => audioCtx,
    audioDestination: () => audioMaster,
    audioEnabled: () => soundOn,
    setEnabled: value => setSound(value),
    ambienceBuffer: () => backgroundSource?.buffer,
    setCinemaAudioActive: (active, owner) => {
      // 主控适配已有Cinema音频闸；只能释放owner自己的占用。
      // 本关借镜头期间降低旧环境/人群通道，结束恢复原有声音设置。
      setCinemaAudioActive(active);
    },
  },
  staging: {
    player, // 已载入 scholar.root，借用而不复制主角
    cartSource: lifeAssets.getObjectByName('cart'),
    hideRoots: chapter2NPCRoots, // 主控装配时提供D区四人实际根对象
  },
  anchors: chapter2Anchors,
  autoStart: true,
  feedback: true,
});
```

上例 `chapter2Context/chapter2NPCRoots/chapter2Anchors` 为主控待装配实参，没有杜撰公共入口或声明已经存在。既有 main 确有 `audioCtx/audioMaster/soundOn/setSound/backgroundSource/setCinemaAudioActive/player/lifeAssets`。禁止模块自行创建另一份 progress、AudioContext、静音持久化、movement 或 camera tween。

context 使用冻结 P0 的 service、ports.getFrame/input/openBook、locks、gate、camera.borrow、scene、world、toast、baseURL。输入订阅 owner 固定 `c2/presentation`。模块不注册键盘/指针全局监听、不清 gate、不重注册 NPC。演出期间主控暂停 player 的 locomotion/mixer，以及任何会写被借相机的 RAF；camera.release 后原主循环继续。否则其它循环会覆盖演员姿态/镜头。

主控每帧调用 `presentation.update(dt, frame)`；只有主控调用服务 tick，operative 必须同时检查所有锁。模块没有精力算法和奖励 reducer。先由核心正式完成任务、选择报酬、交付/completeMain，再触发 ending pending；新 pending 保存成功后自动排队。可 `play('intro_c2')`/`play('ending_c2')`，只在相应 pending、D区、聚焦可见且相机/锁空闲时启动。非法条件返回 false，不结算。

`play(id,{review:true})` 只允许 seen；回顾零 core 写入。`skip(id?)` 活动时恢复镜头并 ack；非活动可明确略过 pending，不需要播放资源。`cancel(reason)`：user/escape/skip 确认演出；blur/hidden/book/pagehide/dispose/region-leave/camera-preempted/resource-failure 等外部打断仅恢复，不 ack。打断后不自行重开，主控可提供继续/略过入口；新页面初次挂接 autoStart 可以重播尚未确认的 pending，绝不重结算报酬。

`setPaused(bool)` 暂停时间线和当前声音，保留锁，便于阅读字幕。`retry()` 重试同一 ack 失败候选；失败时镜头已归还，UI保留明确错误和重试，阻止另一场演出。不能清档重试。`dismiss()` 只隐藏结束/略过摘要。`dispose()` 幂等释放自己 DOM、订阅、音频、演员恢复和借镜头；不 dispose 被借骨架、素材缓冲或其他模块资源。

刷新：pagehide/visibilitychange/blur 是主控生命周期事件，应调用 cancel('pagehide'等) 和共享 service.flush；页面内相机快照完整恢复。新页面由主控既有玩家/相机恢复流程初始化，09不另存正式相机记录。独立预览验证了真实存档位置、结算结果、seen/pending恢复和无遗留锁；没有宣称主工程刷新后的完整相机装配验收通过。

## 相机及动作资产

镜头只经 lease.setPose 写 position/target/fov。主控实现冻结借用契约：camera.clone、yaw、pitch、distance、targetDistance、overview、focus 全快照；release 按当前窗口更新 aspect/projection。忙时拒绝，抢占先取消旧借用者，旧 setPose 永久失效。DEV camera-preview.js 是可审查 P0 适配证据，不是直接替换主控相机的入口。

默认 staging 提供四位明确标注的程序化 NPC、运输架/白痕/绳/茶盏/缺舌铜铃关键帧。现有阿青40骨骼和两只车轮真实分件已实测借用/恢复。专用 NPC 未ready；主控接入08后可以用 options.stage 提供同一 begin(id)/update(sample)/end()/getState()/dispose() 接口的正式舞台对象，不复制时间线或核心。需要再次核对手绳、视线、服装和所有机位；不得用这里的原型测试充当08正式人物验收。

结束镜头收束到 `anchor_c2_exit` 的D区位置[-78,.94,-43]，没有创建E区城门、激活E区或替代后续区域。真实城门外观目前缺失，报告保留该项；本关结局与结算不依赖E区资产。

## 声音与玩法分工

声音挂到同一 audioMaster，必须提供 audioDestination；没有主控通道时安全静音，不能绕过静音/音量设置输出。解码用 OfflineAudioContext，不自行打开可播放上下文。复用已有河岸解码 buffer，演出床声0.035，FX总增益0.4，最多两路FX；没有定时NPC叫卖或新TTS采购。

默认 feedback 只监听保存成功的真实核心动作。startCast/resolveCast(caught)、试拉绳步骤、修缮完成、买卖/回购/换物、现金报酬、吃饭/茶水分别触发对应音效。重复事务没有反馈重复发出。04/05/06只能选一个反馈所有者：如它们自己使用实际声音，设置 feedback:false，并经 `presentation.cue(id,{eventId,pan,audibleBell})` 转发局部动画时刻。浮子下沉、收线属于04真实动画时刻，应由04调用 bobber/reel，09不猜测钓获时间。

eventId 去重，最多最近128个；迟到、超并发、静音、暂停、缺资源音效直接丢弃，不排队积压。缺舌故事铜铃默认不响；只有明确普通有舌铃的调用可传 audibleBell:true。所有镜头从不传此开关。

主控 setEnabled 应调用原 setSound，沿用 `qingming:audio:enabled`；09生产模块不写这个键。DEV预览初次读原偏好，只写独立 DEV :audio 键。资源失败提示字幕/操作仍可继续；getState().audio.errors 有逐文件结果。

## 主控尚需复测

实际 main 的C→D进入、P0输入/相机/声音闸接入、07真风物志开书、04浮子/收线同步、06真实修缮动作、08人物专用动作/最终场景机位和第一关完整演出回归。独立预览不代表 INTEGRATION_READY，不声明真人试玩或20分钟通关结果。
