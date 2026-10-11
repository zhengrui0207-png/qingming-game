"""Read-only GLB inventory. No network, mutations to source assets, or dependencies."""
import hashlib, json, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def inspect(p):
    b = p.read_bytes()
    magic, version, length = struct.unpack_from('<4sII', b)
    assert magic == b'glTF' and version == 2 and length == len(b), str(p)
    at, j, binary = 12, None, b''
    while at < len(b):
        n, kind = struct.unpack_from('<II', b, at)
        data = b[at+8:at+8+n]
        if kind == 0x4e4f534a: j = json.loads(data)
        if kind == 0x004e4942: binary = data
        at += n+8
    assert j is not None
    acc = j.get('accessors', [])
    def values(index):
        a = acc[index]
        if 'bufferView' not in a or a.get('sparse'): return None
        v = j['bufferViews'][a['bufferView']]
        if v.get('buffer', 0) != 0: return None
        formats = {5126:'f',5125:'I',5123:'H',5122:'h',5121:'B',5120:'b'}
        fmt = formats[a['componentType']]
        components = {'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']]
        size = struct.calcsize('<'+fmt*components)
        stride = v.get('byteStride', size)
        offset = v.get('byteOffset',0)+a.get('byteOffset',0)
        return [struct.unpack_from('<'+fmt*components,binary,offset+i*stride) for i in range(a['count'])]
    clips = []
    for a in j.get('animations', []):
        times, varying = [], 0
        for s in a['samplers']:
            t = values(s['input']); v = values(s['output'])
            if t: times.extend(x[0] for x in t)
            if v and any(any(abs(x-y)>1e-6 for x,y in zip(v[0],row)) for row in v[1:]): varying += 1
        clips.append({'name':a.get('name','unnamed'),'duration':max(times,default=0)-min(times,default=0),
                      'channels':len(a['channels']),'varyingSamplers':varying,
                      'targetNodes':[j.get('nodes',[])[i]['name'] if 'name' in j.get('nodes',[])[i] else str(i)
                                     for i in sorted({c['target']['node'] for c in a['channels']})],
                      'visualAccepted':False})
    prims = [p for m in j.get('meshes',[]) for p in m.get('primitives',[])]
    triangles = sum(acc[p.get('indices',p['attributes']['POSITION'])]['count']//3 for p in prims if p.get('mode',4)==4)
    mesh_triangles = [sum(acc[p.get('indices',p['attributes']['POSITION'])]['count']//3 for p in m.get('primitives',[]) if p.get('mode',4)==4) for m in j.get('meshes',[])]
    referenced_triangles = sum(mesh_triangles[n['mesh']] for n in j.get('nodes',[]) if 'mesh' in n)
    images=[]
    for im in j.get('images',[]):
        dim=None
        if 'bufferView' in im:
            v=j['bufferViews'][im['bufferView']]; data=binary[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
            if data.startswith(b'\x89PNG'): dim=list(struct.unpack_from('>II',data,16))
            elif data.startswith(b'\xff\xd8'):
                pos=2
                while pos+4<len(data):
                    if data[pos]!=255: pos+=1; continue
                    marker=data[pos+1]; pos+=2
                    if marker in [0xd8,0xd9]: continue
                    n=struct.unpack_from('>H',data,pos)[0]
                    if marker in [0xc0,0xc1,0xc2]:
                        h,w=struct.unpack_from('>HH',data,pos+3);dim=[w,h];break
                    pos+=n
            elif data.startswith(b'RIFF') and data[8:12]==b'WEBP' and data[12:16]==b'VP8X':
                dim=[1+int.from_bytes(data[24:27],'little'),1+int.from_bytes(data[27:30],'little')]
        images.append({'name':im.get('name'),'mimeType':im.get('mimeType'),'dimensions':dim,'uri':im.get('uri')})
    return {'path':str(p.relative_to(ROOT)), 'sha256':sha(p),'bytes':len(b),'triangles':triangles,
            'nodeReferencedTriangles':referenced_triangles,'triangleScope':'triangles counts unique mesh definitions; nodeReferencedTriangles also counts repeated mesh instances, not runtime culling',
            'meshes':len(j.get('meshes',[])),'primitives':len(prims),'materials':len(j.get('materials',[])),
            'materialNames':[m.get('name') for m in j.get('materials',[])], 'images':images,
            'skins':len(j.get('skins',[])),'jointCounts':[len(s['joints']) for s in j.get('skins',[])],
            'animations':clips,'extensions':j.get('extensionsUsed',[]),
            'primitiveLocalBounds':[{'min':acc[p['attributes']['POSITION']].get('min'),
                                    'max':acc[p['attributes']['POSITION']].get('max')} for p in prims],
            'boundsScope':'primitive accessor local coordinates; not world bounds or posed bounds',
            'sceneRoots':j.get('scenes',[]),'externalFiles':[im['uri'] for im in j.get('images',[]) if im.get('uri')],
            'nodeNames':[n.get('name') for n in j.get('nodes',[])], 'artAccepted':False,'chapter2Accepted':False}

def run():
    catalog=json.loads((ROOT/'public/assets/characters/catalog.json').read_text())
    mapping=json.loads((ROOT/'public/assets/characters/npc-map.json').read_text())
    rows=[]
    for p in sorted((ROOT/'public/assets').rglob('*.glb')):
        if 'chapter2' not in p.parts: rows.append(inspect(p))
    for a in catalog:
        for field,hashfield in [('file','sha256'),('lodFile','lodSha256')]:
            if a.get(field):
                found=next(r for r in rows if r['path']=='public/'+a[field])
                found['catalogId']=a['id']; found['catalogName']=a['name']
                found['catalogSHA256Match']=found['sha256']==a.get(hashfield) if a.get(hashfield) else None
                found['catalogClaim']=a.get('sourceStatus'); found['catalogLimitations']=a.get('limitations')
                found['assignments']=[x['id'] for x in mapping if x.get('assetId')==a['id']]
    result={'auditVersion':'1.0.0','contractVersion':'1.0.0','baselineId':'2026-10-01-p0',
            'method':'GLB headers + JSON + binary uncompressed animation/image data; Draco triangle counts from accessor metadata',
            'limitations':['Draco geometry decoded separately in browser for selected candidates only','No chapter2 scene acceptance','Catalog claims are historical evidence only'],
            'files':rows,'count':len(rows),'catalogHashMismatches':[r['path'] for r in rows if r.get('catalogSHA256Match') is False]}
    (OUT/'existing-glb-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'count':len(rows),'catalogHashMismatches':result['catalogHashMismatches'],'characters':len(catalog)},ensure_ascii=False))

if __name__=='__main__': run()
