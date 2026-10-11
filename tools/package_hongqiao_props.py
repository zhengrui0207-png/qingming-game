from pathlib import Path
import io,json,struct,zipfile,sys
from PIL import Image
import generate_hongqiao_props as g
out=g.OUT
records=[]
for asset,name in zip(g.IDS,g.NAMES):
 folder=out/asset
 state=json.loads((folder/'task.json').read_text())
 assert state['status']=='downloaded',asset
 model=folder/(asset+'.glb');metrics=g.inspect_glb(model)
 assert not metrics['external_uris']
 assert metrics['triangles']<=2000
 raw=model.read_bytes();n,typ=struct.unpack_from('<II',raw,12)
 gltf=json.loads(raw[20:20+n]);pos=20+n
 binlength,bintype=struct.unpack_from('<II',raw,pos);assert bintype==0x004E4942
 binary=raw[pos+8:pos+8+binlength]
 images=[]
 for image in gltf.get('images',[]):
  bv=gltf['bufferViews'][image['bufferView']];start=bv.get('byteOffset',0)
  with Image.open(io.BytesIO(binary[start:start+bv['byteLength']])) as im:
   images.append({'size':list(im.size),'format':im.format});im.verify()
 metrics['embedded_image_validation']=images
 metrics['material_features']=[{'pbr':bool(m.get('pbrMetallicRoughness')),'base_color_texture':'baseColorTexture' in m.get('pbrMetallicRoughness',{}),'metallic_roughness_texture':'metallicRoughnessTexture' in m.get('pbrMetallicRoughness',{}),'normal_texture':'normalTexture' in m} for m in gltf.get('materials',[])]
 g.save(folder/'inspection.json',metrics)
 state['inspection']=metrics;g.save(folder/'task.json',state)
 records.append({'asset_id':asset,'name':name,'file':asset+'/'+asset+'.glb','task_id':state['task_id'],'credits_consumed':state['credits_consumed'],**metrics})
manifest={'generator':'Tripo direct V3 API','model':'P1-20260311','texture_quality':'standard','pbr':True,'total_credits':sum(r['credits_consumed'] for r in records),'assets':records,'scope':'Three static quest props; cloth is folded variant only. No game integration or animated ropes.','failed_attempt':{'asset_id':'item_hq_pole','task_id':'2c34ec83-2fd5-4225-8344-f43e81090d81','status':'failed','error':'Internal processing error','net_credits':0,'refund_verified_by_balance':True}}
g.save(out/'manifest.json',manifest)
rows=['# 虹桥三件任务道具 · GLB交付','', '通过Tripo直接API生成，采用已写好的三件英文提示词，P1＋标准PBR贴图。','', '| 道具 | 文件 | 三角面 | 大小 | 积分 |','|---|---|---:|---:|---:|']
for r in records:rows.append(f"| {r['name']} | `{r['file']}` | {r['triangles']} | {r['bytes']/1024/1024:.2f} MB | {r['credits_consumed']:.0f} |")
rows+=['','合计净消耗120积分。竹篙首次任务失败，冻结积分已退回，重试成功；护货布查询中断后沿原任务恢复，无重复提交。','','验证：GLB 2.0文件结构有效；每件一个网格、一个材质，三张贴图全部内嵌并通过图像解码检查，无外部文件依赖；实际三角面均不超过2,000。','','外观说明：模型保留Tripo原始输出。缆绳能辨认盘绕层次；竹篙已检查完整模型预览；护货布为折叠静态版本，但三处补丁未明显呈现；竹篙生成了额外的握持缠绕，长径比仍需按实景校准。缆绳带局部绳扣细节。以上保留原始生成结果，标记为美术待验收，未额外付费重抽。','','游戏接入前仍需校准尺寸、原点与持握位置。此包不包含展开护货布、动态接应绳、纤绳或桅杆动画，也未修改已验收的游戏移动与相机。','','每个目录包含GLB、预览、请求参数、任务和网格检查记录。`preview_full.png`为本地Blender完整模型预览（若已生成）；`preview.png`为服务端预览。']
(out/'README.md').write_text('\n'.join(rows)+'\n')
zip_path=out/'虹桥三件任务道具_GLB.zip'
with zipfile.ZipFile(zip_path,'w',zipfile.ZIP_DEFLATED) as z:
 for p in [out/'README.md',out/'manifest.json']:
  z.write(p,p.relative_to(out))
 for asset in g.IDS:
  for name in [asset+'.glb','preview.png','preview_full.png','request.json','task.json','inspection.json']:
   p=out/asset/name
   if p.exists():z.write(p,p.relative_to(out))
print(json.dumps({'zip':str(zip_path),'bytes':zip_path.stat().st_size,'models':[{'name':r['name'],'triangles':r['triangles'],'bytes':r['bytes'],'images':r['embedded_image_validation']} for r in records]},ensure_ascii=False))
