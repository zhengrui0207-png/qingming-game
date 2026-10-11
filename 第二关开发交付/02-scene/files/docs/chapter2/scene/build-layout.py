import json, pathlib, shutil
root=pathlib.Path(__file__).resolve().parents[3]
out=root/'src/chapter2/scene'
def save(name,data): (out/name).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
h=.94
def p(x,z): return [x,h,z]
rows=[('entry',-22,-20,'虹桥交接带'),('exit',-78,-43,'城门前边界'),('fisher',-29,-21,'渔夫'),('porter',-62,-39,'老脚夫'),('merchant',-54,-34,'杂货铺掌柜'),('food_vendor',-44,-41,'饭铺伙计'),('fishing_a',-29,-19.8,'近舟钓点'),('fishing_b',-48,-19.8,'静岸钓点'),('repair',-63,-40.8,'修车操作位'),('delivery',-75,-43,'街口交付位'),('safe_return',-25,-22,'D区安全回返站位')]
stands={'fisher':p(-29,-22.3),'porter':p(-62,-37.7),'merchant':p(-54,-35.3),'food_vendor':p(-44,-39.7),'repair':p(-63,-39.5),'delivery':p(-75,-41.7)}
road=[p(-22,-20),p(-26,-20),p(-27,-29),p(-40,-32),p(-49,-37),p(-62,-37),p(-69,-43),p(-78,-43)]
branches={
'exit':road,'fisher':[p(-22,-20),p(-30,-20),p(-29,-21)],
'fishing_a':[p(-22,-20),p(-29,-20),p(-29,-19.8)],
'fishing_b':[p(-22,-20),p(-29,-19.8),p(-48,-19.8)],
'porter':road[:6]+[p(-62,-39)],
'merchant':road[:5]+[p(-54,-37),p(-54,-34)],
'food_vendor':road[:5]+[p(-44,-37),p(-44,-41)],
'repair':road[:6]+[p(-63,-39),p(-63,-40.8)],
'delivery':road[:-1]+[p(-75,-43)],
'safe_return':[p(-22,-20),p(-25,-22)]}
anchors=[]
for role,x,z,label in rows:
 a={'id':'anchor_c2_'+role,'role':role,'label':label,'layer':'ground','position':p(x,z),'status':'measured-graybox','surfaceId':'surface_c2_bank','surfaceEvidence':'既有world.js bank=.94；D区support面和浏览器向下射线/双向moveActor实走见docs/chapter2/scene/verification.json','standingPosition':stands.get(role,p(x,z)),'turnRadius':1.2}
 if role.startswith('fishing_'): a.update({'lookAt':[x,.08,-11],'castTarget':[-25,.08,-12] if role=='fishing_a' else [-52,.08,-9],'bankSetback':1.5,'boatSightline':True})
 anchors.append(a)
routes=[{'id':'route_c2_entry_'+r,'from':'anchor_c2_entry','to':'anchor_c2_'+r,'waypoints':ps,'walkEvidence':'以原moveActor每步<=.12米正反向行走；浏览器RAF连续路线实走记录见verification.json，非瞬移到达。'} for r,ps in branches.items()]
save('anchors.json',{'contractVersion':'1.0.0','draft':False,'regionId':'region_d','anchors':anchors,'routes':routes,'boundaryEvidence':'D局部矩形x[-81,-21],z[-60,-18]；C入口x=-22,z=-20；C安全点仍[0,.94,35]。E接口x=-78,z=-43只终点，不开放E。S01仅回望既有虹桥，S12仅E资产挂接标记，未另建城门。','coordinateBasis':'既有world.json米制布局；原画像素仅用于邻接与外形。'})
structures=[
 {'id':'s04_open_house','scene':'S04','type':'house','x':-35,'z':-25,'w':8,'d':6,'h':4.1,'openSouth':True},
 {'id':'s05_house_a','scene':'S05','type':'house','x':-45,'z':-27,'w':7,'d':5,'h':3.6},
 {'id':'s05_house_b','scene':'S05','type':'house','x':-54,'z':-28,'w':9,'d':6,'h':4.5},
 {'id':'s06_low_house','scene':'S06','type':'house','x':-44,'z':-47,'w':7,'d':6,'h':3.1},
 {'id':'s07_stall','scene':'S07','type':'stall','x':-54,'z':-31.5,'w':4,'d':1.2,'h':2.7},
 {'id':'s07_umbrella','scene':'S07','type':'umbrella','x':-61,'z':-30,'w':2.8,'d':2.8,'h':2.8},
 {'id':'s08_loads','scene':'S08','type':'cargo','x':-58,'z':-43.8,'w':2.6,'d':2,'h':1.5},
 {'id':'s09_frame','scene':'S09','type':'frame','x':-74,'z':-49,'w':6,'d':1.4,'h':1.5},
 {'id':'s10_repair_cart','scene':'S10','type':'cart','x':-63,'z':-44,'w':2.5,'d':3,'h':2},
 {'id':'s11_covered_cart','scene':'S11','type':'coveredCart','x':-53,'z':-44.5,'w':2.5,'d':3.6,'h':2.9}]
colliders=[]
for s in structures:
 if s['type']=='house' and s.get('openSouth'):
  for suffix,x,z,w,d in [('rear',s['x'],s['z']+s['d']/2-.15,s['w'],.3),('west',s['x']-s['w']/2+.15,s['z'],.3,s['d']),('east',s['x']+s['w']/2-.15,s['z'],.3,s['d'])]: colliders.append({'id':s['id']+'_'+suffix,'x':x,'z':z,'w':w,'d':d,'h':s['h'],'kind':'house'})
 else: colliders.append({k:s[k] for k in ['id','x','z','w','d','h']}|{'kind':'house' if s['type']=='house' else 'obstacle'})
for id,x,z,w,d in [('water',-51,-17.95,60,.2),('north',-51,-59.5,60,.3),('west',-80.5,-39, .3,43),('east_north',-21,-42,.3,36)]:colliders.append({'id':'c2_boundary_'+id,'x':x,'z':z,'w':w,'d':d,'h':2,'kind':'boundary'})
for i,(x,z) in enumerate([(-40,-43),(-67,-27)]):colliders.append({'id':'c2_tree_'+str(i),'x':x,'z':z,'w':.8,'d':.8,'h':6,'kind':'obstacle'})
layout={'version':'1.0.0','scope':{'minX':-81,'maxX':-21,'minZ':-60,'maxZ':-18},'replacementPolicy':'Only triangles wholly inside scope, excluding ground/path material. Runtime cloned geometry; restore on dispose. Original GLB never rewritten.','supportSurfaces':[{'id':'surface_c2_bank','minX':-80.3,'maxX':-21.2,'minZ':-59.3,'maxZ':-18.4,'height':h,'layer':'ground','source':'existing-bank'}],'structures':structures,'colliders':colliders,'road':road,'trees':[[-40,-43,6],[-67,-27,7]],'boats':[[-30,-12,10,0.15],[-39,-10,8,-.12],[-48,-12,9,.3]],'traffic':{'id':'path_c2_short_cart','waypoints':[[-69,h,-51],[-74,h,-51]],'speed':.45,'pauseAtEnds':3,'envelope':{'x':-71.5,'z':-51,'w':9,'d':3,'h':2},'mode':'static-until-controller-connected'},'assetSlots':{'S01':'existing C bridge (read-only)','S02':'street-life/ferry repeated three times with existing canopy','S04':'authored open timber/tile graybox','S05':'two staggered graybox houses with blank signs','S06':'low roof/tree/seated placeholders','S07':'stall/umbrella graybox','S08':'cargo reuse + load-bearing NPC placeholders','S09':'frame + shoulder-load placeholder','S10':'street-life/cart + scenery/ox reuse','S11':'cart reuse + canopy graybox','S12':'E-owned cityGate mount only; asset absent'}}
colliders.append({'id':'c2_traffic_reserved',**layout['traffic']['envelope'],'kind':'obstacle'})
save('layout.json',layout)
shutil.copyfile('/Users/zhengrui/Documents/ChatGPT/清明上河图/output/full-scroll/第二关原画场景标注.png',root/'docs/chapter2/scene/painting-reference.png')
