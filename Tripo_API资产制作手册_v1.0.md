# Tripo API 资产制作手册

版本：v1.0｜2026-09-14｜用于《清明上河图》虹桥关卡

配套：[执行方案 v1.3](清明上河图3D游戏_逐步执行方案_v1.3.md) · [剧情稿](虹桥急情_完整剧情稿_v1.0.md)

## 1. 本项目的调用原则

**优先直接 API 调用，不依赖 Tripo CLI。** 用 Python HTTP 客户端或工程现有服务端工具封装；CLI 只在用户明确选择备用方案时使用。

已有书生已完成生成且正在另一个任务验收：优先接收其本地文件和原任务元信息。缺动画才补动作，缺骨骼才补绑骨；不能因为新流水线更整齐就重做已有成果。

三件任务道具已按用户授权通过直接API生成，净消耗120积分，产物见[交付说明](assets/hongqiao_props/README.md)；实际脚本为[generate_hongqiao_props.py](tools/generate_hongqiao_props.py)。本手册其余人物/动画步骤仍为制作方法，不代表已经执行。

### 接口纠正

此前评审用 V2 文档否定 `/v3/generation/text-to-model`，判断不准确。官方 V3 确有此路径，V2 的统一任务接口也仍有官方文档和 SDK 支持。正确做法是固定协议、区域、鉴权、模型版本和结果解析，不将两套格式拼起来。[官方 V3 总览](https://developers.tripo3d.ai/en/docs/introduction)、[官方 SDK 协议说明](https://developers.tripo3d.ai/en/docs/sdk)

本手册：**新建直连脚本优先按 V3；已有 V2 任务按 V2 继续查询和处理**。这不是要求迁移正在验收的书生任务。

## 2. 先确定协议与区域，再写请求

| 项目 | V3 主线示例 | V2 兼容已有任务 |
|---|---|---|
| 示例服务根地址 | https://openapi.tripo3d.ai/v3 | https://api.tripo3d.ai/v2/openapi |
| 新建生成任务 | POST /generation/text-to-model 或 multiview-to-model | POST /task，body.type 区分任务 |
| 模型版本字段 | model | model_version |
| 后处理来源字段 | input | original_model_task_id |
| 查询 | GET /tasks/{task_id} | GET /task/{task_id} |
| 余额 | GET /account/balance | GET /user/balance |
| 结果示例 | output.model_url；credits_consumed | output.model/pbr_model；consumed_credit |

上表是适配器示例，不是所有任务输出的完整枚举。多个动画可能返回多个文件或不同的输出结构，先保存去敏感信息的响应样例，再编写适配器；不能假设永远只有一个 GLB。

区域：上面使用 `.ai` 官方服务示例；官方也存在 `.com` 区域文档与对应端点。依据现有任务、账户配置和官方鉴权说明选择，不把域名差异自动判为错误，也不拿同一 Key 跨区试探。配置保存 `apiVersion`、`baseUrl`、`region` 和非敏感凭证别名，API Key 仅来自进程环境或本机安全配置。[官方鉴权说明](https://developers.tripo3d.ai/en/docs/authentication)

## 3. 制作前审计与预算

### 3.1 先分四种状态

| 状态 | 下一步 |
|---|---|
| 本地模型、动作和实景验收全部通过 | 直接加入 AssetRegistry，不调用生成 API |
| 本地模型已有骨骼和可用动作，但尚未实景验证 | 先浏览器验证，不先付费重绑 |
| 模型外观通过但缺骨骼/动作 | 沿原任务继续，或上传已有模型后检查/绑骨/动作 |
| 模型确实缺失 | 核对参考图、预算与具体生成目标，再做新资产 |

新 NPC 优先顺序：老周 → 其余三位按当前素材缺口补齐。主角不在新生成清单。道具可本地制作简单几何与材质，只有效果不足时采用 API。

### 3.2 每个资产的清单字段

`assetId、role、inputFiles、sourceTaskId、apiVersion、baseUrl、generationModel、rigModel、animations、targetFormat、faceBudget、textureBudget、expectedCredits、creditCap、attemptCap、status、outputFiles、acceptedVersion`。

面数不是唯一指标。建议先以关键 NPC 约 8k–15k 三角面、背景人物约 3k–6k、三件简单道具各 2k 以内作为起测预算，贴图先 1k–2k，再依据实景镜头与性能调整。这些是项目起测值，不是平台最低要求或品质保证。

### 3.3 费用方法

请求前查当前协议对应的计费页和余额；将生成、贴图升级、网格处理、绑骨、每个动作和转换分别列项。不能把官方示例响应中的扣费数字当统一单价，也不能继续使用旧稿“43 人总计 28–45 美元”的预算。

官方 P1 模型页目前列出标准纹理多视图生成为 50 credits、标准纹理文生为 40 credits；后处理另算，最终按任务实际扣费核账。不同文档对某些附加项存在口径差异，使用具体版本页与执行前账户报价核实，不自行取最低值。[P1 官方模型与计费页](https://developers.tripo3d.ai/en/models/p1)、[官方计费说明](https://docs.tripo3d.ai/get-started/pricing.html)

本地预算上限只是脚本的停止规则，不是云服务的硬限额：提交前必须预留本步预计费用，并计入已经提交但还没结算的任务。超过上限或费用无法确定时暂停新的付费提交，继续查询/下载已有任务。

## 4. V3 逐步调用：做一个新 NPC 样板

所有 JSON 示例均为待替换模板，`REPLACE_...` 不可直接提交。以下 API 路径相对于已确认的 V3 baseUrl。请求头使用 `Authorization: Bearer {TRIPO_API_KEY}`，普通 body 用 JSON，文件上传由 HTTP 库构造 multipart boundary。

### A0：检查账户与锁定任务范围

工具：Python/终端读配置 → GET /account/balance。只显示余额和是否可用，不显示 Key。确定只制作某一个具体 assetId，已有同输入同参数的成功产物直接复用。[账户 API](https://developers.tripo3d.ai/en/docs/account)

### A1：准备参考图并上传

先打开人物参考图检查正、侧、背一致性，拆分拼版并命名 front/left/back/right。左右按角色自身视角定义，不凭在拼图左边就叫 left。至少正面和另一视图；缺少的视角不乱补、不镜像冒充实拍视角。保留原图与拆分结果。

`POST /files`，multipart 字段 `file`，逐张上传，保存返回的 `data.file_token`。V3 此入口也可上传已有本地模型用于后处理；图片与模型大小限制不同。大型文件按官方大文件上传流程处理，不沿用 V2 图片上传限制。[V3 文件上传](https://developers.tripo3d.ai/en/docs/files)

### A2：多视图生成

`POST /generation/multiview-to-model`：

```json
{
  "inputs": [
    {"front": "REPLACE_FRONT_FILE_TOKEN"},
    {"left": "REPLACE_LEFT_FILE_TOKEN"},
    {"back": "REPLACE_BACK_FILE_TOKEN"}
  ],
  "model": "P1-20260311",
  "face_limit": 12000,
  "texture": true,
  "pbr": true
}
```

这是低面数 NPC 的起测模板，不用于替换现有书生的生成参数。若已有定标模型，优先沿用通过验收的模型与风格。V3 推荐显式视角键；不要塞入 V2 的 `files` 对象数组。拼版图本身不等于多视图输入。提交成功后马上保存 task_id，再轮询；生成结果通过预览和网格检查后，才进入后处理。[V3 多视图参数](https://developers.tripo3d.ai/en/docs/generation-multiview-to-model/p)

### A3：轮询与下载原始版本

`GET /tasks/{task_id}`。初始可每 3 秒查询，遇限流按 Retry-After/退避等待；排队时间增加时逐渐拉长，不高频刷接口。只有 success 才读取产物；失败或取消进入对应记录，不用 progress=100 代替成功判断。

把原始模型、预览和去敏感信息的结果写入版本目录；下载到 `.part`，完成格式/长度或校验检查后原子改名。下载请求不用 Tripo Bearer Key；只带产物签名 URL 必需信息。链接过期则重新查询原 task_id 取新链接，不能重新生成。[V3 任务查询](https://developers.tripo3d.ai/en/docs/task-query)

### A4：必要的网格处理，在绑骨前完成

只有实景检查发现面数、拓扑或分件不达标时才做。优先本地 Blender 定点修；采用 API 时读取 `/mesh/decimate` 或 `/models/convert` 对应版本文档后明确参数与费用。不要预填未经核实的请求体，也不要给每个角色强加同一付费链。

改变拓扑的处理可能使原骨骼/动画失效，因此先网格、后绑骨和动作；已经带动作的资产不得盲目重拓扑。相关行为在官方绑骨说明中有提示。[官方网格与骨骼说明](https://docs.tripo3d.ai/animation/rig-v2-5-20260210.html)

### A5：绑骨可行性检查

`POST /animations/rig-check`：

```json
{"input": "REPLACE_GENERATED_MODEL_TASK_ID"}
```

按接口实际响应处理 `riggable` 和推荐 rig_type。V3 文档提供直接返回检查结果的形式，不机械地假设它与生成一样必定返回新 task_id；若账户返回异步任务，则由协议适配器按文档查询。不可绑时回到具体网格问题，不无限重试付费绑骨。[V3 Rig Check](https://developers.tripo3d.ai/en/docs/animations-rig-check)

### A6：绑骨

`POST /animations/rig`。新双足人物的示例采用明确的 v1.0 绑骨版本，后面的预设名与它成套：

```json
{
  "input": "REPLACE_GENERATED_OR_PROCESSED_MODEL_TASK_ID",
  "model": "v1.0-20240301",
  "rig_type": "biped",
  "spec": "tripo",
  "out_format": "glb"
}
```

如果原人物已经使用另一种骨架规格或 v2.5 版本，沿用其验收参数，而非为一致性重绑。生成模型的 P1/H3 版本与绑骨模型版本是两回事。成功后保存 **rig task_id**；动作必须使用绑骨产物，不用原始生成 ID。[V3 绑骨参数](https://developers.tripo3d.ai/en/docs/animations-rig)

### A7：动作

`POST /animations/retarget`，与上面的 v1.0 rig 配套：

```json
{
  "input": "REPLACE_RIG_TASK_ID",
  "animations": ["preset:biped:idle", "preset:biped:walk"],
  "out_format": "glb",
  "bake_animation": true,
  "export_with_geometry": true,
  "animate_in_place": true
}
```

若沿用 v2.5 rig，动作名改为相应的 `preset:idle`、`preset:walk`。不要同时传 animation 与 animations。老周等不行走的 NPC 可以只做 idle，需要转身/招手再单独补；不因平台预设丰富就全部付费。

多动作输出逐文件检查：若分开 GLB，验证骨骼一致后在加载层复用剪辑或在 Blender 合并导出；不宣称 API 必然直接给出含所有剪辑的单文件。[V3 动作参数与预设](https://developers.tripo3d.ai/en/docs/animations-retarget)

### A8：入场验收与接入

本地读取 GLB、预览和动作，再用游戏原光照和相机观察。记录资产版本、三角面、材质数、贴图尺寸、脚底、朝向和剪辑映射；NPC assetId 不变，仅更新 acceptedVersion/path。

最终需要 GLB 时优先保留生成/动作阶段已经提供的 GLB，不为“导出”重复调用转换或额外生成 FBX。后处理还要换方向时先测试本地资产外层变换，只有必要时才使用付费转换。

**整个样板通过后**才扩大生产：批次只包含确认的角色与费用范围，按账户实际并发限制运行。CLI 技能里的默认并发和定价不直接当 API 的实际账户上限。

## 5. V2 已有任务的兼容处理

已有书生如果来自 V2：记录原区域和凭证别名，使用原接口查询。不要把它的 ID 硬塞进 V3 或把未知响应当“不存在”后重做。

| 环节 | V2 调用 |
|---|---|
| 查询已有任务 | GET /task/{task_id} |
| 小图片直接上传 | POST /upload，multipart file；返回 image_token，生成请求放 file_token |
| 模型/需要 STS 的上传 | POST /upload/sts/token → 临时凭证上传对象 → import_model |
| 创建后处理任务 | POST /task，明确 type 和 original_model_task_id |

V2 `/upload` 图片接口不用于传 GLB；STS token 通过 `/upload/sts/token` 请求，临时凭证只在进程内使用，不改用户全局 AWS 配置。模型导入示例：

```json
{
  "type": "import_model",
  "file": {
    "object": {
      "bucket": "REPLACE_RESOURCE_BUCKET",
      "key": "REPLACE_RESOURCE_URI"
    }
  }
}
```

来源：[V2 图片上传](https://docs.tripo3d.ai/file-upload/quick-upload-directly.html)、[STS 上传](https://platform.tripo3d.ai/docs/upload-sts)、[已有模型导入](https://docs.tripo3d.ai/model-generation/import-model.html)。

V2 多视图只在新建 V2 资产确有需要时用下列模板；四个槽位固定顺序，空缺槽保留 `{}`：

```json
{
  "type": "multiview_to_model",
  "model_version": "P1-20260311",
  "files": [
    {"type": "png", "file_token": "REPLACE_FRONT_TOKEN"},
    {},
    {"type": "png", "file_token": "REPLACE_BACK_TOKEN"},
    {"type": "png", "file_token": "REPLACE_RIGHT_TOKEN"}
  ],
  "face_limit": 12000,
  "texture": true,
  "pbr": true
}
```

来源：[V2 多视图规范](https://docs.tripo3d.ai/model-generation/multiview-to-model-p1-20260311.html)。

V2 后处理在 `/task` 分别提交 `animate_prerigcheck`、`animate_rig`、`animate_retarget`，来源使用 `original_model_task_id`；绑骨版本用 `model_version`，动作传匹配骨架版本的 `animations`，每一步成功再进入下一步。[V2 绑骨](https://docs.tripo3d.ai/animation/rig-v2-5-20260210.html)、[V2 动作](https://docs.tripo3d.ai/animation/retarget.html)

V2 成果读取 `consumed_credit` 等实际字段，下载链接过期查询同一任务刷新；保留来源协议和正确凭证以供后续访问。[V2 任务查询](https://docs.tripo3d.ai/task-query/get-your-task-result.html)

## 6. API 脚本应怎样写

建议后续由 Codex 在真实工程下实现 `tools/tripo_pipeline.py` 与 manifest；下面列的是所需能力，不是已经存在的脚本命令。

- `plan`：只验证本地输入、模型/参数、顺序和预计费用，不上传、不生成。
- `inspect-account`：只读鉴权和余额。
- `run --asset <id>`：执行已确认的单个资产及必要步骤。
- `resume --asset <id>`：根据已保存 task_id 继续查询/下载，跳过成功步骤。
- `inspect --asset <id>`：报告本地模型与动画，不调用付费 API。
- `batch --manifest <file>`：仅在资产清单和总预算确认后运行。

### 状态与幂等

每一阶段保存 planned → submitting → submitted(task_id) → running → success/downloaded → reviewed，另有 failed / submission_unknown / needs_review。

提交前写本地请求摘要与输入 SHA-256、参数哈希，收到 task_id 立即原子保存。网络中断可能发生在服务已经受理但客户端未拿到 ID 的时间点；这种情况标 submission_unknown，不盲目重新 POST。通过可用任务列表、服务日志/追踪号或控制台核对；无法确定就等待人工确认。不要杜撰一个平台未承诺的 Idempotency-Key 保证。

同一个资产的同一阶段加本地锁，阻止两个进程重复提交。预算统计包含实际已扣费和进行中预留费用。

### 重试与失败

- GET 查询、下载可退避重试；429 尊重 Retry-After。
- 已拿到 ID 的任务超时，保留 ID，恢复查询，不重发创建请求。
- 参数错误修正参数，权限错误检查区域/凭证；不自动切换协议和账户重试。
- 云端任务 failed 记录错误与实际扣费；重新生成是一次新的请求，受预算和尝试次数约束。
- 已成功但外观不满意，交付预览和问题后再决定返工，不静默抽卡。
- 后一阶段失败只重做必要阶段，不从参考图开始重复生成整条链。

### 产物与日志

每资产每版本保存：输入引用、请求参数、task_id 链、去敏感响应、费用、原始 GLB、处理 GLB、预览、检验报告。长期存本地文件和任务 ID，不把短期签名 URL 写进游戏配置。

Key、Authorization、STS 密钥、会话 token 不进入日志、Git 或分享报告；下载签名 URL 也不作为长期公开链接。下载完成检查确实是 GLB/模型文件，不将错误 HTML 改名成 `.glb`。

## 7. 直接给 Codex 的提示词

### P1：先实现 API 管线，不发生生成费用

```text
按《Tripo API 资产制作手册》为当前游戏实现可恢复的直接 API 管线，不依赖 CLI。
先检查已有资产任务的协议、区域、参数和本地结果；玩家书生已经生成，不在新生成列表。
新直连模块按 V3 实现，V2 仅用于兼容已存在的任务。固定 baseUrl 和 apiVersion，不能混用字段。
用 Python HTTP 客户端或工程现有工具实现 plan、inspect-account、run、resume、inspect 和 manifest 能力。
本次只写代码、离线测试和说明，不调用付费生成；账户只读检查可在已有凭证可用时完成。
API Key 从本机环境/安全配置读取，不让我把 Key 粘贴进聊天。
实现上传、生成、rig-check、rig、retarget、查询与下载；网格处理/转换为可选阶段。
加入单资产锁、输入与参数哈希、阶段记录、预算预留、退避、断点恢复和 submission_unknown 处理。
模拟验证成功、限流、超时、提交响应丢失、已成功但下载失败、余额不足、输出结构异常。
输出真实脚本路径、可复制命令、样例 manifest、所用官方链接和未经过真实 API 验证的部分。
```

### P2：已有角色只补缺失能力

```text
对资产清单中的已有模型做只读检查，确认模型/骨骼/动画/实景四项状态。
优先使用原 task_id、协议和本地 GLB；书生不得重新图生 3D。
如果仅缺 idle/walk，先核实已有 rig 任务与对应动作预设；若模型完全没绑骨，
列出 rig-check→rig→retarget 的具体请求和预计费用，按已有预算授权执行必要步骤。
没有同协议可访问任务时，按该协议上传已有模型，不重新生成外观。
结果下载后检查全部剪辑/骨骼，再接入现有控制器，提供真实动画预览和剩余问题。
```

### P3：一个新 NPC 样板

```text
为本次已确定的 NPC assetId 制作一个样板；先读取角色参考图和资产预算，不涉及其他角色。
拆分并核对正侧背视角，通过直接 Tripo API 上传，按选定协议使用多视图生成。
生成后先检查形体、服装和面部，必要网格处理完成后再 rig-check、rig 和匹配预设的动作。
每阶段成功就保存 task_id、产物版本和扣费；后续失败从当前阶段恢复。
不自动加高清贴图、重拓扑或额外格式转换，不静默重抽。
交付本地 GLB、预览、动画清单和费用，再放入游戏原光照与相机做一次实景验证。
超过已确定预算时停止新的付费提交，保留全部可恢复信息。
```

### P4：样板通过后的批次

```text
只按这次确认的 manifest 和总预算生产资产，复用通过的样板参数。
排除已有通过验收的书生和其他成功版本。先查余额和账户并发限制。
启动批次时预留进行中费用；中断后依据 task_id 续跑，不重复提交成功或状态未知的阶段。
按单资产列出完成/失败/待验收、实际费用和剩余预算，展示需要返修的预览。
不要把“生成成功”记为“游戏内验收通过”，也不要在没有同意的情况下自动重抽。
```

## 开场资产补充

开场已采用“顶杆止船—未降桅杆—纤夫失察—桥上抛两根绳—降桅稳船”的30秒9镜头演出（景别、机位与切点以剧情稿HQ_00.1为准），具体要求见[剧情稿HQ_00](虹桥急情_完整剧情稿_v1.0.md)。优先复用现有船工、群众和船体；杆、桥上两根接应绳、纤绳用本地几何/曲线制作。桅杆需有可用转轴，顶杆、抛绳、降桅等专用动作通过Blender关键帧及游戏时间线完成；本手册中的通用idle/walk不等同于这些动作已制作。只有缺少人物外观时才进入Tripo API资产支线，仍接收已有书生，不重复生成。

## 8. 道具重建清单与生成提示词

晓梦已指定三件任务道具重新建模。造型和最新提示词统一读取[《虹桥道具重建清单与3D生成提示词》](虹桥道具重建清单与3D生成提示词.md)，本节不再保留另一套简写以免混用。

- 明确重建：何伯的备用缆绳、阿成的长竹篙、方娘子的护货布；护货布另做同款展开状态，物品ID仍只有一个。
- 开场用具：顶桥长杆、桥上接应绳模板（两个独立实例）、牵船纤绳。按动画需要补建连续绳体，静态盘绳不直接变成可抛绳模型。
- 配套陈设：粗布货包、新布卷、工具架、布摊，按现有资产缺口制作。
- 船体部件：桅杆、支承与低位支架，先查现有船并拆件，确需补件时使用清单中的提示词。

外观生成优先直接API。英文代码块作为主体提示词，接口参数按本手册前文核对；提示词不会自动保证尺寸、原点、拓扑、可动节点或导出动画。长杆与动态绳等简单几何可用Blender/程序化方法重新建模，纹理沿用统一外观。实际生成时逐件验收，再继续下一件。

## 9. 资产最终验收清单

- [ ] 本次范围、预算、协议与区域明确，玩家原模型未被重复生成。
- [ ] 图片视角与角色一致；新旧模型风格以游戏镜头验证。
- [ ] 本地文件可加载，材质和贴图无缺失，脚底/尺寸/朝向正确。
- [ ] 必要动作真实存在、骨骼匹配、原地移动策略一致，无严重衣袍穿插。
- [ ] 任务 ID、阶段、费用与产物版本可追溯；断点恢复不重复付费。
- [ ] API 成功、艺术验收、游戏性能验收分别记录。
- [ ] 实际游戏中角色身份稳定，换模型不丢任务或存档。

官方文档核对日期：2026-09-14。此手册的请求模板经文档核对，尚未在用户账户上实发验证；实施时必须检查具体接口的响应和当前账户能力。
