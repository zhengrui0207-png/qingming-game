"""Run in Blender against the existing native master; read-only extraction of wares."""
import bpy,bmesh,json,re
from pathlib import Path
r=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game');shops=json.loads((r/'public/assets/world.json').read_text())['shops'];triangles=[];audit=[]
for ob in bpy.context.scene.objects:
 match=re.match(r'QMV3_shop_(\d+)_(.*)',ob.name)
 if ob.type!='MESH' or not match:continue
 shop=shops[int(match[1])];material=match[2];kind=shop['type']
 if not ((kind=='wine' and material in ['ceramic','cloth_red']) or (kind=='food' and material in ['wood_light','robe_cream'])):continue
 bm=bmesh.new();bm.from_mesh(ob.data);seen=set();keep=set()
 for v in bm.verts:
  if v in seen:continue
  stack=[v];seen.add(v);group=[]
  while stack:
   a=stack.pop();group.append(a)
   for edge in a.link_edges:
    b=edge.other_vert(a)
    if b not in seen:seen.add(b);stack.append(b)
  points=[ob.matrix_world@v.co for v in group];lo=[min(v[k] for v in points) for k in range(3)];hi=[max(v[k] for v in points) for k in range(3)];size=[hi[k]-lo[k] for k in range(3)]
  take=(min(size)>.0001 and max(size)<1.3 and lo[2]>=.94 and hi[2]<2.4) if kind=='wine' else (lo[2]>=1.79 and hi[2]<=2.30 and max(size)<.65)
  if take:keep.update(v.index for v in group)
 ob.data.calc_loop_triangles();count=0
 for f in ob.data.loop_triangles:
  if all(i in keep for i in f.vertices):
   ps=[ob.matrix_world@ob.data.vertices[i].co for i in f.vertices];triangles.append([[p.x,p.z,-p.y] for p in ps]);count+=1
 if count:audit.append(dict(node=ob.name,triangles=count))
 bm.free()
(r/'output/feedback-assets/wares-native.json').write_text(json.dumps({'triangles':triangles,'audit':audit}));print('REMOVAL',len(triangles),'nodes',len(audit))
