import json,pathlib,struct,hashlib
root=pathlib.Path(__file__).resolve().parents[3];rows=[]
for rel,names in [('public/assets/qingming-world.glb',[]),('public/assets/street-life.glb',['cart','ferry']),('public/assets/scenery/ox.glb',[])]:
 p=root/rel;b=p.read_bytes();n,t=struct.unpack('<II',b[12:20]);g=json.loads(b[20:20+n]);nodes=[x.get('name') for x in g['nodes']];rows.append({'path':rel,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'nodes':len(nodes),'namedReusableNodes':[{ 'name':name,'exists':name in nodes} for name in names],'animations':[a.get('name','unnamed') for a in g.get('animations',[])],'note':'只读复用；world为按材质合并的24节点，不能按单店对象隐藏' if 'world' in rel else '复用当前模型；不是宋代形制/正式美术已验收'})
(root/'docs/chapter2/scene/asset-audit.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
