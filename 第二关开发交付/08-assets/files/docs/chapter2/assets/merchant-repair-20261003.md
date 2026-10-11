# 顾娘子动作兼容性补救

已获批范围：同一角色、一次外观生成、idle/walk、总上限120积分。

首轮Mixamo骨骼25积分成功；retarget任务明确failed/error1004，扣费字段未给值，账户3880→3805及冻结0与外观50+骨骼25一致。官方详细rig文档注明只有Tripo规格支持retarget，因此改为同一生成任务→spec tripo骨骼→相同idle/walk预设；不重新生成外观，不重拓扑，不扩大动作集。

补救新骨骼25+动作20后总预算正好120；失败任务ID和响应仍保留，未覆盖或盲重发。请求仍全部为V3，旧V2文档仅用于核对兼容性限制。原请求里的rig model版本保持不变；服务端未回显model版本，不宣称已证实具体执行版本。

来源：https://docs.tripo3d.ai/animation/rig-v2-5-20260210.html（spec段）；https://developers.tripo3d.ai/en/docs/animations-rig；https://developers.tripo3d.ai/en/docs/animations-retarget。

实际任务链、请求哈希、扣费、下载路径及后续状态读取merchant-execution-20261002.json。
