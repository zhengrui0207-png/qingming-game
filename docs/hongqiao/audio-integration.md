# 虹桥演出音频接入记录 · 2026-09-16

状态：已接入，自动浏览器回归通过，等待晓梦试听。未发布，未修改任务存档，未生成或购买音频/人物资产。

## 工程与挂接

真实游戏工程：`/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game`，Three.js 0.180 / Vite 7.3.6。该目录没有 Git；文档仓库记录本次局部补丁、源码/音频快照及验证证据。整文件快照包含已有工程上下文，本次变动以 `audio-evidence/implementation.patch` 为准，不将并行任务的既有改动认领为本次工作。

- `src/hongqiao/cinema/audio.js`：按原有 CUES 对应 13 句用户配音；新增两条环境轨、顶杆、两次抛绳、松/收绳、降桅、收杆和过桥水声。以同一个 AudioContext 时钟调度音频和画面；环境在说话和回叙时压低。跳过停止当前与未来全部轨道；失焦暂停 AudioContext。
- `src/main.js`：点击“入画游览”解锁音频，默认有声；总音量节点统一控制配音、音效与环境。用户明确静音写入本游戏专用 `qingming:audio:enabled`，不混进任务快照。演出时压低旧合成水声，停播旧鸟叫；结束恢复原有环境声。开发测试提供最终输出节点 RMS/峰值读数。
- `src/hongqiao/cinema/renderer.js`：演出中提供声音按钮；图像沿音频时钟运行，维持开场 30 秒、9 镜头和通关 20 秒，原机位及普通游戏相机数值未改变。
- `public/assets/hongqiao/cinema/audio/`：21 个 WAV 与带源/成品 SHA-256 的 `manifest.json`；下载地址带成品哈希，避免继续读取旧临时声音。
- `tools/import-cinema-audio.py`：可复现的本地转换；输入原文件保留。统一 48 kHz，配音单声道、环境/音效双声道，只削去配音最前面的多余静音，保留 45 ms 起口空隙；无变速、无内句裁剪。均衡音量并限制峰值。
- `src/hongqiao/cinema/audio.test.js`：素材哈希、PCM 数据、时间窗、双绳事件和缺失/短音效处理检查。

输入：`/Users/zhengrui/Downloads/tts_intro (1)/`，13 段配音、8 段音效全部匹配，无缺失必需素材。输入采样率均为 40 kHz、16 bit、双声道；转换后约 16.72 MiB。市集、降桅、过桥水声原音量较低，已按实际峰值/平均音量提升。

## 配音对应

开场和通关各自从 0 秒计时。以下时长是实际导入音频长度，镜头不补时。

| 文件 | 开始秒 | 实际时长（秒） |
|---|---:|---:|
| `intro_01.wav` | 0 | 1.889 |
| `intro_03.wav` | 5 | 0.745 |
| `intro_04.wav` | 8 | 0.903 |
| `intro_05.wav` | 10 | 2.594 |
| `intro_06.wav` | 14 | 1.904 |
| `intro_07.wav` | 17 | 0.945 |
| `intro_08a.wav` | 20 | 0.435 |
| `intro_08b.wav` | 21 | 2.869 |
| `intro_08c.wav` | 25 | 0.783 |
| `intro_09.wav` | 27 | 1.932 |
| `ending_01.wav` | 0 | 2.000 |
| `ending_02.wav` | 12 | 1.884 |
| `ending_03.wav` | 16 | 1.692 |

两条环境音覆盖对应演出全长；顶杆 3 秒；抛绳 17.3 / 18.1 秒各一次（同一文件两个实例）；松绳 20–21 秒；降桅 21–25 秒；收绳与收杆 25–27 秒；过桥水声 3–12 秒。开场动作陈设及任务物品 ID 未改。

## 实际验证

启动：`npm run dev -- --port 5182 --strictPort`，本地地址 `http://127.0.0.1:5182/`。

- `node --test src/world.test.js src/interaction/core.test.js src/hongqiao/*.test.js src/hongqiao/cinema/*.test.js`：64 / 64 通过。
- `npm run build`：通过；保留 Vite 大于 500 kB 的既有主包体积提示，不在本次音频接入中拆包。
- `node output/playwright/audio-import/browser-audio.cjs`：真实 Chrome / Web Audio / WebGL 自动操作，12 / 12 通过。
- 正常流程 Console error / warning 均为 0；manifest 和 21 个带哈希 WAV 请求均为 HTTP 200。缺失文件的故障注入另行记录预期网络失败及降级提示，不混入正常结果。
- 测量实际连接到输出端的浮点采样，非仅检查 fetch、play 或创建音源调用。采样峰值最大 0.5700，没有观测到超过 1 的削波；静音后 RMS 为 0 或低于 0.00001，音画时间继续。
- 九镜开场完整走到 30 秒；十句和七个动作音效事件触发，结束当前/未来音源均为 0。通关完整走到 20 秒，三句与过桥水声触发，状态 passed、四故事解锁不重复结算。
- `preservation.json` 记录移动、相机、交互及 HUD 函数与接入前比对一致。

浏览器用例：

- entry click enables all 21 supplied clips without a separate sound click
- overlay mute silences current voices and effects, then unmute continues
- full 30s intro: 10 voices, exactly 2 throws, all actions and clean stop
- pole contact plays audible audio in a shot with no voice
- real tab blur freezes audio clock and picture; focus resumes in place
- skip stops current and future audio; replay preserves save
- mute survives refresh and entry, replay stays silent until explicitly enabled
- formal delivery plays full 20s ending with 3 voices and ship-pass effect
- ending replay and skip never repeat settlement
- HTTP loads supplied manifest and all hashed WAVs successfully
- one missing voice degrades to subtitles, other tracks continue
- delayed voice holds entry until decoded, then starts at 0 with voice

性能（1280×800、Chrome SwiftShader、共享本机负载，非硬件性能验收）：见 audio-evidence/metrics.json；同时保留帧数与最大帧间隔。

诊断历史：最初用单个瞬间 RMS 作为语音断言，会采中语音低能量区；后改为在起句窗口等待有效采样。截图和 UI 操作也可能跨过顶杆测量窗，现以独立无对白镜头测量杆响。资源异常测试最初并开多个完整 WebGL 场景遇到加载超时，现先释放前一个页面再测；保留前两次日志，最终 12 项均重新通过。

## 未覆盖与交接

没有声称真人试玩或人工逐字听审通过；音色、发音、情绪及真实耳机/扬声器的听感由晓梦试听确认。未测试 Safari、移动设备及系统级静音。画面本身仍沿用已有 Step 7 制作状态，不以音频验证代替视觉验收。

不清除现有进度。进入游戏后按 I → “回顾开场”/“回顾过桥”即可试听；回顾不改当前任务结果。演出右上角可随时关闭/开启声音。相关提交另记 `audio-commit.md`。
