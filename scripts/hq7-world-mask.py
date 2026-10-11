from pathlib import Path
import struct,json,hashlib
r=Path(__file__).resolve().parents[1];src=r/'public/assets/qingming-world.glb';raw=src.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);b=raw[28+n:]
audit=json.loads((r/'public/assets/hongqiao/cinema/native-triangles.json').read_text());key=lambda vs:tuple(sorted(tuple(round(x,3) for x in v) for v in vs));target={key(t) for t in audit['shipTriangles']}
def accessor(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];f={5126:'f',5125:'I',5123:'H',5121:'B'}[a['componentType']];width={'VEC3':3,'SCALAR':1}[a['type']];fmt='<'+f*width;size=struct.calcsize(fmt);offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',size);return [struct.unpack_from(fmt,b,offset+j*stride) for j in range(a['count'])]
masks=[];matched=set()
for mi,mesh in enumerate(g['meshes']):
 for pi,p in enumerate(mesh['primitives']):
  positions=accessor(p['attributes']['POSITION']);indices=[v[0] for v in accessor(p['indices'])] if 'indices' in p else list(range(len(positions)));remove=[]
  for i in range(0,len(indices),3):
   vs=[positions[k] for k in indices[i:i+3]]
   if not all(7.8<=v[0]<=28.2 and -.6<=v[1]<=10.3 and -9.6<=v[2]<=3.3 for v in vs):continue
   k=key(vs)
   if k in target:remove.append(i//3);matched.add(k)
  if remove:masks.append({'mesh':next(n['name'] for n in g['nodes'] if n.get('mesh')==mi),'primitive':pi,'triangleCount':len(indices)//3,'positionSha256':hashlib.sha256(b''.join(struct.pack('<fff',*positions[indices[tri*3+j]]) for tri in remove for j in range(3))).hexdigest(),'remove':remove})
assert len(matched)/len(target)>.99,(len(matched),len(target))
import hashlib
report={'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceTriangles':len(audit['shipTriangles']),'matched':len(matched),'removedTriangles':sum(len(m['remove']) for m in masks),'meshes':masks}
(r/'public/assets/hongqiao/cinema/world-mask.json').write_text(json.dumps(report,separators=(',',':')))
(r/'public/assets/hongqiao/cinema/bridge-triangles.json').write_text(json.dumps(audit['bridgeTriangles'],separators=(',',':')))
(r/'output/playwright/step7/world-mask-audit.json').write_text(json.dumps({k:v for k,v in report.items() if k!='meshes'},indent=2));print({k:v for k,v in report.items() if k!='meshes'})
