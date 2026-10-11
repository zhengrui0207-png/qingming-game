from pathlib import Path
import struct,json,hashlib,math
r=Path('.');raw=(r/'public/assets/qingming-world.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);b=raw[28+n:]
native=json.loads((r/'output/feedback-assets/wares-native.json').read_text());key=lambda vs:tuple(sorted(tuple(round(x,3) for x in v) for v in vs));target={key(t) for t in native['triangles']};old={m['mesh']:m for m in json.loads((r/'public/assets/hongqiao/cinema/world-mask.json').read_text())['meshes']}
def acc(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];f={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];width={'VEC3':3,'SCALAR':1}[a['type']];fmt='<'+f*width;size=struct.calcsize(fmt);offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size);return [struct.unpack_from(fmt,b,offset+j*stride) for j in range(a['count'])]
matched=set();masks=[]
for mi,mesh in enumerate(g['meshes']):
 name=next(n['name'] for n in g['nodes'] if n.get('mesh')==mi);p=mesh['primitives'][0];pos=acc(p['attributes']['POSITION']);idx=[v[0] for v in acc(p['indices'])];prior=set(old.get(name,{}).get('remove',[]));remove=[];fingerprint=bytearray();current=0
 for tri in range(len(idx)//3):
  if tri in prior:continue
  vs=[pos[i] for i in idx[tri*3:tri*3+3]];k=key(vs)
  if k in target:remove.append(current);matched.add(k);fingerprint.extend(b''.join(struct.pack('<fff',*v) for v in vs))
  current+=1
 if remove:masks.append(dict(mesh=name,triangleCount=current,remove=remove,positionSha256=hashlib.sha256(fingerprint).hexdigest()))
assert len(matched)/len(target)>.99,(len(matched),len(target))
instances=[]
for s in json.loads((r/'public/assets/world.json').read_text())['shops']:
 if s['type'] not in ['wine','food']:continue
 def put(i,x,y,z,height,asset):
  angle=s['yaw'];instances.append(dict(id=f'shop_{s["id"]}_{asset}_{i}',assetId=asset,position=[s['x']+x*math.cos(angle)+z*math.sin(angle),y,s['z']-x*math.sin(angle)+z*math.cos(angle)],height=height,yaw=angle+i*.63))
 front=s['d']/2
 if s['type']=='wine':
  for i in range(5):put(i,(-.3+i*.15)*s['w'],1.8,front+.12,.43 if i%2 else .38,'wine')
  for i in range(3):put(i+5,(-.3+i*.27)*s['w'],.945,front+1.1,.76-i*.04,'wine')
 else:
  for i in range(5):put(i,(-.3+i*.15)*s['w'],1.8,front+.12,.48+(i%3)*.035,'steamer')
report={'version':1,'sourceSha256':hashlib.sha256(raw).hexdigest(),'removedTriangles':sum(len(m['remove']) for m in masks),'meshes':masks,'instances':instances,'shipCargo':[{'id':'cargo_hq_deck','position':[3.5,2.58,-1.2],'height':.96,'yaw':0},{'id':'cargo_hq_stern','position':[6.2,.53,-2.8],'height':.75,'yaw':-.48}]}
(r/'public/assets/scenery/placements.json').write_text(json.dumps(report,separators=(',',':')));print('matched',len(matched),'instances',len(instances))
