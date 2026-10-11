import bpy, bmesh, math, random, json
from pathlib import Path
from mathutils import Vector
random.seed(482)
ROOT=Path('/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game')
OUT=ROOT/'public/assets/chapter2/scene/detail-v1';OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
TEX=ROOT/'public/assets/textures'
materials=[]
def mat(name,color,rough=.9,scan=None):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;n=m.node_tree.nodes;p=n.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 if scan:
  for typ in ['Color','NormalGL','Roughness']:
   t=n.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(TEX/f'{scan}_1K-JPG_{typ}.jpg'),check_existing=True)
   if typ!='Color':t.image.colorspace_settings.name='Non-Color'
   if typ=='Color':m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
   elif typ=='Roughness':m.node_tree.links.new(t.outputs['Color'],p.inputs['Roughness'])
   else:
    nn=n.new('ShaderNodeNormalMap');nn.inputs['Strength'].default_value=.22;m.node_tree.links.new(t.outputs['Color'],nn.inputs['Color']);m.node_tree.links.new(nn.outputs['Normal'],p.inputs['Normal'])
 materials.append(m);return len(materials)-1
WOOD=mat('D_Timber',( .28,.19,.11),.88,'WoodSiding006')
PLASTER=mat('D_LimePlaster',(.65,.59,.48),.96,'Plaster007')
STONES=[mat('D_Footings_'+str(i),c,.96) for i,c in enumerate([(.30,.31,.27),(.27,.28,.25),(.34,.33,.29)])];STONE=STONES[0]
PEBBLES=[mat('D_EarthStone_'+str(i),color,1) for i,color in enumerate([(.28,.25,.205),(.32,.31,.27),(.35,.30,.24)])]
TILE=[mat('D_CeramicRoof_'+str(i),(.14+i*.012,.17+i*.013,.165+i*.012),.94) for i in range(12)]
TILE_RIM=mat('D_CeramicRoof_Rim',(.075,.09,.085),.96)
CLOTH=mat('D_Linen',(.60,.48,.31),.99)
BAMBOO=mat('D_Bamboo',(.31,.24,.13),.89)
ROPE=mat('D_Hemp',(.30,.245,.16),.99)
CERAMIC=mat('D_GreenGlaze',(.20,.32,.29),.25)
CERAMIC_INNER=mat('D_GreenGlaze_Interior',(.10,.18,.14),.30)
CLAY=mat('D_UnglazedClay',(.35,.22,.135),.86)
DAMP=mat('D_BaseDamp',(.29,.245,.18),1)
# Surface weathering is a translucent pigment layer, never an opaque occluder.
materials[DAMP].node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value=.22
materials[DAMP].surface_render_method='DITHERED'
SPALL=mat('D_LimeSpall',(.34,.30,.235),.99)
DARK=mat('D_Recess',(.09,.075,.052),1)
SACK=mat('D_Sacking',(.45,.37,.25),.99)
LEAF=mat('D_Leaves',(.22,.30,.13),.98)
class Builder:
 def __init__(self,name):self.name=name;self.v=[];self.f=[];self.mi=[];self.uv=[];self.s=[]
 def face(self,pts,mat,uv=None,smooth=False):
  idx=len(self.v);self.v.extend([tuple(p) for p in pts]);self.f.append(tuple(range(idx,idx+len(pts))));self.mi.append(mat);self.uv.append(uv or [(0,0),(1,0),(1,1),(0,1)][:len(pts)]);self.s.append(smooth)
 def box(self,c,size,m,bevel=0):
  if m not in [WOOD,*STONES]:
   x,y,z=c;w,d,h=[s/2 for s in size];p=[(x+a*w,y+b*d,z+cc*h) for cc in [-1,1] for b in [-1,1] for a in [-1,1]]
   for ids,u,v in [((0,1,3,2),size[0],size[1]),((4,6,7,5),size[0],size[1]),((0,4,5,1),size[0],size[2]),((2,3,7,6),size[0],size[2]),((0,2,6,4),size[1],size[2]),((1,5,7,3),size[1],size[2])]:
    corners=[Vector(p[i]) for i in reversed(ids)];nx=max(1,math.ceil(u/.23)) if m==PLASTER else 1;ny=max(1,math.ceil(v/.23)) if m==PLASTER else 1
    def pt(a,b):return corners[0]*(1-a)*(1-b)+corners[1]*a*(1-b)+corners[2]*a*b+corners[3]*(1-a)*b
    for ii in range(nx):
     for jj in range(ny):
      uv=[(ii/nx,jj/ny),((ii+1)/nx,jj/ny),((ii+1)/nx,(jj+1)/ny),(ii/nx,(jj+1)/ny)]
      self.face([pt(a,b) for a,b in uv],m,[(a*u*.7,b*v*.7) for a,b in uv])
   return
  center=Vector(c);e=[v*.5 for v in size];be=min(.008 if m==WOOD else .035,min(e)*.30)
  dominant=max(range(3),key=lambda a:size[a])
  def face(ps,smooth=False):
   ps=[Vector(p) for p in ps];
   if m in [WOOD,*STONES]:
    for point in ps:
     for axis in range(3):
      if axis!=dominant:point[axis]+=(.004 if m==WOOD else .010)*math.sin(point[dominant]*7.1+point[axis]*29.)+.002*math.sin(point[dominant]*17.3+point[axis]*11.)
   n=(ps[1]-ps[0]).cross(ps[2]-ps[0]);out=sum(ps,Vector())/len(ps)-center
   if n.dot(out)<0:ps.reverse()
   secondary=min((a for a in range(3) if a!=dominant),key=lambda a:abs(out[a]))
   self.face(ps,m,[(p[secondary]*.65+center[dominant]*.173,p[dominant]*.65+center[secondary]*.217) for p in ps],smooth)
  # Six inset planes, twelve softened edge bands, eight worn corner facets.
  for axis in range(3):
   u,v=[a for a in range(3) if a!=axis];U,V=e[u],e[v]
   for side in [-1,1]:
    ps=[]
    for uu,vv in [(-U+be,-V),(U-be,-V),(U,-V+be),(U,V-be),(U-be,V),(-U+be,V),(-U,V-be),(-U,-V+be)]:
     q=list(c);q[axis]+=side*e[axis];q[u]+=uu;q[v]+=vv;ps.append(q)
    face(ps)
  for axis in range(3):
   u,v=[a for a in range(3) if a!=axis]
   for su in [-1,1]:
    for sv in [-1,1]:
     ps=[]
     for ax,uu,vv in [(-1,e[u],e[v]-be),(1,e[u],e[v]-be),(1,e[u]-be,e[v]),(-1,e[u]-be,e[v])]:
      q=list(c);q[axis]+=ax*(e[axis]-be);q[u]+=su*uu;q[v]+=sv*vv;ps.append(q)
     face(ps,True)
  for sx in [-1,1]:
   for sy in [-1,1]:
    for sz in [-1,1]:
     signs=[sx,sy,sz];ps=[]
     for a in range(3):ps.append([c[k]+signs[k]*(e[k] if k==a else e[k]-be) for k in range(3)])
     face(ps,True)
 def tube(self,points,radius,m,sides=6,end=None):
  ps=[Vector(p) for p in points]
  if m==WOOD and radius>.04 and len(ps)>2:
   original=ps;ps=[]
   for i in range(len(original)-1):
    a=original[max(0,i-1)];b=original[i];c=original[i+1];d=original[min(len(original)-1,i+2)]
    for j in range(5):
     t=j/5;ps.append(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t))
   ps.append(original[-1])
  travel=[0]
  for i in range(1,len(ps)):travel.append(travel[-1]+(ps[i]-ps[i-1]).length)
  rings=[]
  for i,p in enumerate(ps):
   direction=(ps[min(i+1,len(ps)-1)]-ps[max(0,i-1)]).normalized();a=direction.cross(Vector((0,0,1)))
   if a.length<.01:a=direction.cross(Vector((0,1,0)))
   a.normalize();b=direction.cross(a);r=radius if end is None else radius+(end-radius)*i/(len(ps)-1)
   rings.append([p+(a*math.cos(j*math.tau/sides)+b*math.sin(j*math.tau/sides))*r*(1+.10*math.sin(j*2.7+p.z*1.2) if m==WOOD and radius>.15 else 1) for j in range(sides)])
  for i in range(len(ps)-1):
   for j in range(sides):
    tree=self.name.startswith('s06_tree');uu=radius*math.tau/.65 if tree else 1;va=travel[i]/.65 if tree else i*.22;vb=travel[i+1]/.65 if tree else (i+1)*.22
    self.face([rings[i][j],rings[i][(j+1)%sides],rings[i+1][(j+1)%sides],rings[i+1][j]],m,[(j/sides*uu,va),((j+1)/sides*uu,va),((j+1)/sides*uu,vb),(j/sides*uu,vb)],True)
 def lathe(self,c,profile,m,sides=24):
  x,y,z=c
  for i in range(len(profile)-1):
   r0,h0=profile[i];r1,h1=profile[i+1];currentMat=CERAMIC_INNER if m==CERAMIC and i>=5 else m
   for j in range(sides):
    a=j*math.tau/sides;b=(j+1)*math.tau/sides
    if m in PEBBLES:
     fa=1+.22*math.sin(j*2.399+x*13+y*7);fb=1+.22*math.sin((j+1)*2.399+x*13+y*7)
    else:fa=fb=1
    self.face([(x+r0*fa*math.cos(a),y+r0*fa*math.sin(a),z+h0),(x+r0*fb*math.cos(b),y+r0*fb*math.sin(b),z+h0),(x+r1*fb*math.cos(b),y+r1*fb*math.sin(b),z+h1),(x+r1*fa*math.cos(a),y+r1*fa*math.sin(a),z+h1)],currentMat,[(j/sides,i*.12),((j+1)/sides,i*.12),((j+1)/sides,(i+1)*.12),(j/sides,(i+1)*.12)],True)
 def finish(self):
  mesh=bpy.data.meshes.new(self.name);mesh.from_pydata([(x,-y,z) for x,y,z in self.v],[],[tuple(reversed(f)) for f in self.f]);mesh.update();obj=bpy.data.objects.new(self.name,mesh);bpy.context.collection.objects.link(obj)
  for m in materials:mesh.materials.append(m)
  uv=mesh.uv_layers.new(name='SurfaceUV')
  for poly,mi,u,s in zip(mesh.polygons,self.mi,self.uv,self.s):
   poly.material_index=mi;poly.use_smooth=s
   for loop,co in zip(poly.loop_indices,reversed(u)):uv.data[loop].uv=co
  # Weld geometric seams for continuous curved normals; UVs remain per-loop.
  bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00001);bm.to_mesh(mesh);bm.free();mesh.update()
  return obj
# World coordinates x/y in Blender correspond to x/z in game, Z is elevation.
def house(s):
 b=Builder(s['id']);w=s['w'];d=s['d'];h=s['h'];x=s['x'];y=s['z'];base=.94
 # Plausible plaster infill behind exposed timber. Open house retains open south facade.
 if not s.get('openSouth'):b.box((x,y,base+h/2),(w-.18,d-.18,h),PLASTER)
 else:
  b.box((x,y+d/2-.13,base+h/2),(w,.26,h),PLASTER)
  for xx in [x-w/2+.13,x+w/2-.13]:b.box((xx,y,base+h/2),(.26,d,h),PLASTER)
 # Individual foundation stones, vertical posts and horizontal beams.
 for j in range(math.ceil(w/.65)):
  xx=x-w/2+(j+.5)*w/math.ceil(w/.65)
  for yy in [y-d/2,y+d/2]:b.box((xx,yy,base+.12),(w/math.ceil(w/.65)-.018,.30,.25),STONES[j%3])
 for yy in [y-d/2-.015,y+d/2+.015]:
  for j in range(4):b.box((x-w/2+j*w/3,yy,base+h/2),(.18,.21,h+.12),WOOD)
  for zz in [base+.32,base+h*.48,base+h-.06]:b.box((x,yy,zz),(w+.2,.20,.20),WOOD)
  if not(s.get('openSouth') and yy<y):
   for center in [x-w*.24,x+w*.24]:
    fw=w*.23;fh=h*.45;fz=base+h*.53
    b.box((center,yy+(-.12 if yy<y else .12),fz),(fw,.06,fh),DARK)
    for xx in [center-fw/2,center+fw/2]:b.box((xx,yy+(-.19 if yy<y else .19),fz),(.065,.06,fh+.1),WOOD)
    for z in [fz-fh/2,fz+fh/2]:b.box((center,yy+(-.19 if yy<y else .19),z),(fw,.07,.07),WOOD)
    for j in range(1,15):b.box((center-fw/2+j*fw/15,yy+(-.19 if yy<y else .19),fz),(.035,.045,fh),WOOD)
    for k in range(1,11):b.box((center,yy+(-.21 if yy<y else .21),fz-fh/2+k*fh/11),(fw,.04,.032),WOOD)
 for j in (range(12) if not s.get('openSouth') else []):
  if j%4==0:continue
  xx=x-w/2+j*w/12;length=w/12*.8;hh=random.uniform(.12,.35);yy=y-d/2+.087
  b.face([(xx,yy,base+.38),(xx+length,yy,base+.38),(xx+length,yy,base+.38+hh*.65),(xx+length*.52,yy,base+.38+hh),(xx,yy,base+.38+hh*.8)],DAMP,[(0,0),(1,0),(1,.65),(.52,1),(0,.8)])
 # Joinery pegs and sparse lime spalls near actual exposed frame junctions.
 for yy in [y-d/2-.13,y+d/2+.13]:
  sign=-1 if yy<y else 1
  for j in range(4):
   xx=x-w/2+j*w/3
   for zz in [base+.35,base+h*.48,base+h-.08]:
    b.tube([(xx,yy,zz),(xx,yy+sign*.018,zz)],.014,WOOD,9)
    if random.random()<.5:
     b.face([(xx-.04,yy+sign*.001,zz-.03),(xx-.026,yy+sign*.001,zz+.035),(xx-.030,yy+sign*.001,zz-.018)],DARK)
    if random.random()<.55:
     length=random.uniform(.08,.18);pz=zz+random.uniform(-.07,.07)
     b.face([(xx+.065,y+sign*(d/2-.087),pz),(xx+.065+length,y+sign*(d/2-.087),pz+.02),(xx+.08+length,y+sign*(d/2-.087),pz+.06),(xx+.075,y+sign*(d/2-.087),pz+.04)],DAMP)
  for k in (range(16) if not(s.get('openSouth') and sign==-1) else []):
   post=x-w/2+(k%4)*w/3;xx=post+random.choice([-1,1])*random.uniform(.16,.24);zz=base+(.36+random.random()*.30 if k<8 else h*.48+random.uniform(-.16,.16));r=random.uniform(.04,.075)
   if any(abs(xx-v)<.13 for v in [x-w/2+j*w/3 for j in range(4)]):continue
   pts=[]
   for q in range(7):
    a=q*math.tau/7;rr=r*(.6+random.random()*.5);pts.append((xx+rr*math.cos(a),y+sign*(d/2-.087),zz+rr*.7*math.sin(a)))
   b.face(pts,DAMP,[(.5+.4*math.cos(q*math.tau/7),.5+.4*math.sin(q*math.tau/7)) for q in range(7)])
 # Sparse damp trails attached to the true plaster plane beneath lattice sills.
 if not s.get('openSouth'):
  for sign in [-1,1]:
   py=y+sign*(d/2-.087);sill=base+h*.305
   for center in [x-w*.24,x+w*.24]:
    for k in range(3):
     xx=center+random.uniform(-w*.07,w*.07);ww=random.uniform(.055,.09);length=random.uniform(.30,.50)
     pts=[(xx-ww/2,py,sill),(xx+ww/2,py,sill),(xx+ww*.30,py,sill-length),(xx,py,sill-length-.02),(xx-ww*.25,py,sill-length*.75)]
     b.face(pts if sign==1 else list(reversed(pts)),DAMP,[(0,0),(1,0),(.8,.9),(.5,1),(.2,.75)])
 # Actual broken lime edges, placed around column feet and beneath lattice sills.
 if not s.get('openSouth'):
  for sign in [-1,1]:
   py=y+sign*(d/2-.086);sill=base+h*.305
   for k in range(10):
    xx=(x+(-.24 if k%2==0 else .24)*w+random.uniform(-.65,.65)) if k<6 else (x-w/2+(k-6)*w/3+random.choice([-1,1])*.18)
    zz=sill-random.uniform(.05,.14) if k<6 else base+random.uniform(.43,.65)
    rr=random.uniform(.07,.13);pts=[]
    for q in range(9):
     a=q*math.tau/9;r=rr*(.55+random.random()*.65);pts.append((xx+r*math.cos(a),py,zz+r*.60*math.sin(a)))
    center=(xx,py-sign*.006,zz)
    for q in range(9):b.face([center,pts[q],pts[(q+1)%9]],SPALL)
 # side frame, no gaps at ends.
 for xx in [x-w/2,x+w/2]:
  for z in [base+.32,base+h-.05]:b.box((xx,y,z),(.2,d,.18),WOOD)
 # Roof modeled tile by tile. Tangential profile: channel concavity and rounded barrel covers.
 reach=d/2+.46;rise=1.20;ridge=base+h+1.26
 for side in [-1,1]:
  for j in range(math.ceil((w+.7)/.30)):
   xx=x-(w+.7)/2+(j+.5)*.30
   # exposed rafters at .6m intervals; actual structure supports tile plane.
   b.tube([(xx,y,ridge-.16),(xx,y+side*(reach+.09),ridge-rise-.16)],.042,WOOD,8)
   for k in range(math.ceil(reach/.36)):
    ya=k*.36;yb=min(reach,ya+.43);phase=0 if random.random()>.25 else random.randrange(1,12)
    for cover in [False,True]:
     xc=xx+(.145 if cover else 0)+random.uniform(-.009,.009);uvx=random.uniform(0,7);uvy=random.uniform(0,7);r=(.078 if cover else .13)*(1+random.uniform(-.065,.065))
     sections=10;longitudinal=3
     for q in range(longitudinal):
      ta=ya+(yb-ya)*q/longitudinal;tb=ya+(yb-ya)*(q+1)/longitudinal
      for n in range(sections):
       a=n*math.pi/sections;aa=(n+1)*math.pi/sections
       def p(t,angle):
        local=(t-ya)/(yb-ya); taper=.94+.06*local
        off=math.cos(angle)*r*taper
        lift=math.sin(angle)*r*(.67 if cover else -.30)+.003*math.sin(angle*3+xx*5+t*9)*math.sin(angle)
        curve=.023*math.sin(local*math.pi)
        return(xc+off,y+side*t,ridge-rise*t/reach+lift+(.052 if cover else .012)+.22*(1-ya/reach)+curve)
       pts=[p(ta,a),p(ta,aa),p(tb,aa),p(tb,a)];uv=[((xx+phase*.31)*.7+uvx+n/sections*.2,ta*1.5+uvy),((xx+phase*.31)*.7+uvx+(n+1)/sections*.2,ta*1.5+uvy),((xx+phase*.31)*.7+uvx+(n+1)/sections*.2,tb*1.5+uvy),((xx+phase*.31)*.7+uvx+n/sections*.2,tb*1.5+uvy)];b.face(pts if side==-1 else list(reversed(pts)),TILE[phase],uv if side==-1 else list(reversed(uv)),smooth=True)
       if q==longitudinal-1:
        p1=p(tb,a);p2=p(tb,aa);lip=[p1,p2,(p2[0],p2[1],p2[2]-.024),(p1[0],p1[1],p1[2]-.024)];b.face(lip if side==-1 else list(reversed(lip)),TILE_RIM)
  b.box((x,y+side*reach,ridge-rise-.05),(w+.9,.12,.16),WOOD)
 for j in range(math.ceil(w/.36)):
  xx=x-w/2+(j+.5)*.36;b.tube([(xx-.20,y,ridge+.04),(xx+.20,y,ridge+.04)],.105,TILE[j%4],10)
 if s.get('openSouth'):
  b.box((x,y+.5,base+.65),(3,.7,1.3),WOOD)
 return b.finish()
def basket(b,x,y,z,r=.3,h=.55):
 # Hollow rim and a woven surface of strips; no solid toy bucket.
 for k in range(12):
  zz=z+h*k/11;rr=r*(.76+.24*k/11);points=[(x+rr*math.cos(j*math.tau/48),y+rr*math.sin(j*math.tau/48),zz) for j in range(49)];b.tube(points,.012,BAMBOO,4)
 for j in range(28):
  a=j*math.tau/28;b.tube([(x+r*.76*math.cos(a),y+r*.76*math.sin(a),z),(x+r*math.cos(a),y+r*math.sin(a),z+h)],.009,BAMBOO,4)
 b.lathe((x,y,z),[(0,0),(r*.76,0),(r*.76,.028)],BAMBOO)
 b.tube([(x+r*math.cos(j*math.tau/40),y+r*math.sin(j*math.tau/40),z+h) for j in range(41)],.025,BAMBOO,6)
def sack(b,x,y,z,s=.4):
 b.lathe((x,y,z),[(0,0),(s*.7,.02),(s,.18),(s*.95,.55),(s*.72,.72),(s*.27,.84),(s*.20,.90),(0,.92)],SACK,18)
 for k in [0,.018,.04]:b.tube([(x+s*.22*math.cos(j*math.tau/24),y+s*.22*math.sin(j*math.tau/24),z+.84+k) for j in range(25)],.012,ROPE,5)
def canopy(b,x,y,z,w=4.3,d=2.4):
 # Continuous draped textile mesh, pinned to bamboo poles, hem has thickness.
 nx=64;ny=24
 def p(i,j):
  u=i/nx;v=j/ny;return(x+(u-.5)*w,y+(v-.5)*d,z+.4*v-sum(.100*math.exp(-((u-center+.018*math.sin(v*3.1+center*4))/.035)**2) for center in [.19,.48,.80])*(.20+.80*math.sin(math.pi*v))-.07*math.sin(math.pi*u)*(1-v)**3-sum(amp*math.exp(-((u-center-.018*math.sin(v*4+center*9))/width)**2) for center,width,amp in [(.18,.035,.028),(.43,.05,.035),(.69,.04,.029),(.85,.035,.026)])*(.3+.7*math.sin(math.pi*v))*math.sin(math.pi*u)-.10*math.sin(math.pi*u)-.10*math.sin(math.pi*v)+.087*math.cos(u*19+v*4+.6)*math.sin(math.pi*u)*math.sin(math.pi*v)+.028*math.sin(u*7+v*3)*math.sin(math.pi*u))
 for i in range(nx):
  for j in range(ny):b.face([p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],CLOTH,[(i/nx*4,j/ny*2),((i+1)/nx*4,j/ny*2),((i+1)/nx*4,(j+1)/ny*2),(i/nx*4,(j+1)/ny*2)],True)
 for j in [0,ny]:
  for i in range(nx):
   a=p(i,j);c=p(i+1,j);hem=[a,c,(c[0],c[1]-(.022*math.sin((i+1)*1.13)+.028*math.sin((i+1)/nx*29)),c[2]-.07-.065*max(0,math.sin((i+1)/nx*math.pi*5+.4))**2),(a[0],a[1]-(.022*math.sin(i*1.13)+.028*math.sin(i/nx*29)),a[2]-.07-.065*max(0,math.sin(i/nx*math.pi*5+.4))**2)]
   huv=[(i/nx*2,0),((i+1)/nx*2,0),((i+1)/nx*2,.20),(i/nx*2,.20)]
   b.face(list(reversed(hem)) if j==0 else hem,CLOTH,list(reversed(huv)) if j==0 else huv,True)
 for xx in [x-w/2+.12,x+w/2-.12]:
  b.tube([(xx,y-d/2,.94),(xx+.015,y-d/2,z+.08)],.045,BAMBOO,10)
  b.tube([(xx,y-d/2,z),(xx,y+d/2,z+.4)],.035,BAMBOO,8)
 b.tube([(x-w/2,y-d/2,z+.025),(x,y-d/2,z-.012),(x+w/2,y-d/2,z+.025)],.026,BAMBOO,8)
 for xx in [x-w/2+.05,x+w/2-.05]:b.tube([(xx,y-d/2,z),(xx,y+d/2,z+.4)],.008,ROPE,5)
b=Builder('s07_stall');x=-54;y=-31.5;base=.94
# Counterboard thickness, visible mortises, grooves between fitted planks.
for j in range(12):b.box((x-2+(j+.5)/3,y,base+.70),(.325,1.20,.075),WOOD)
for j in range(11):
 # Two real open foot profiles, with the low rail and backing cut to match.
 notch=j in [1,9];h=.30 if notch else .50
 b.box((x-2+(j+.5)*4/11,y-.51,base+.66-h/2),(4/11-.012,.09,h),WOOD)
for xx in [x-1.88,x,x+1.88]:
 for yy in [y-.45,y+.45]:b.box((xx,yy,base+.35),(.13,.13,.70),WOOD)
 b.box((xx,y,base+.16),(.12,1.1,.1),WOOD)
for j in range(11):
 xx=x-2+(j+.5)*4/11;notch=j in [1,9]
 if not notch:
  b.box((xx,y+.49,base+.27),(4/11+.001,.1,.13),WOOD)
  b.box((xx,y-.53,base+.205),(4/11+.001,.13,.09),WOOD)
 h=.27 if notch else .47
 b.box((xx,y-.45,base+.645-h/2),(4/11+.001,.045,h),DARK)
# Four short wood splits on actual cabinet front boards, avoiding a uniform noise overlay.
for j in range(4):
 xx=x-1.6+j*.87;yy=y-.568;zz=base+.18+j%2*.18
 b.face([(xx-.005,yy,zz),(xx+.009,yy,zz+.17),(xx+.018,yy,zz+.23),(xx+.011,yy,zz+.16),(xx,yy,zz+.02)],DARK)
canopy(b,x,y-.8,3.90)
# Bowls have interior, lip, foot and green glaze.
for i in range(7):
 xx=x-1.40+(i%4)*.46;yy=y-.1+(i//4)*.37
 b.lathe((xx,yy,1.685),[(.08,0),(.09,.035),(.13,.05),(.18,.13),(.19,.16),(.17,.168),(.115,.075),(.06,.055)],CERAMIC)
for i in range(2):basket(b,x+1.0+i*.48,y,1.685,.19,.27)
for i in range(3):
 xx=x+.5+i*.20;b.lathe((xx,y+.3,1.685),[(.075,0),(.10,.05),(.13,.17),(.12,.27),(.06,.33),(.07,.38),(.056,.38),(.046,.33),(.047,.28)],CLAY)
basket(b,-51.5,-31.3,.94,.34,.62)
b.finish()
# Umbrella sculpted from radial ribs and concave panels, no cone proxy.
b=Builder('s07_umbrella');x=-61;y=-30;z=3.50;r=1.50;n=96
b.tube([(x,y,.94),(x+.02,y,z+.15)],.046,BAMBOO,12)
for i in range(n):
 for k in range(6):
  def p(j,q):
   a=j*math.tau/n;t=q/6;rr=t*r;zz=z+.3-.6*t+.06*math.sin(t*math.pi)-.035*math.sin(a*12)**2*t;return(x+math.cos(a)*rr,y+math.sin(a)*rr,zz)
  pts=list(reversed([p(i,k),p(i+1,k),p(i+1,k+1),p(i,k+1)]));b.face(pts,CLOTH,[((px-x)/3+.5,(py-y)/3+.5) for px,py,pz in pts],True)
 a=i*math.tau/n
 if i%4==0:b.tube([(x,y,z+.3),(x+math.cos(a)*r*.45,y+math.sin(a)*r*.45,z+.02),(x+math.cos(a)*r,y+math.sin(a)*r,z-.31)],.012,BAMBOO,5)
b.finish()
# Cargo and practical work objects placed only inside existing cargo footprints.
b=Builder('s08_loads')
for i in range(4):sack(b,-58.8+(i%2)*.8,-44.1+(i//2)*.68,.94,.37)
for i in range(2):basket(b,-74.3+i*2.6,-47,.94,.33,.7)
b.tube([(-74.6,-47,2.4),(-73,-47,2.5),(-71.4,-47,2.4)],.045,BAMBOO,9)
for xx in [-74.3,-71.7]:b.tube([(xx,-47,2.43),(xx,-47,1.63)],.012,ROPE,5)
b.finish()
b=Builder('s09_frame')
for xx in [-76.7,-71.3]:
 b.box((xx,-49,1.6),(.18,1.2,1.3),WOOD)
 b.tube([(xx,-49.5,1.0),(xx,-49,2.25)],.06,WOOD,6)
b.box((-74,-49,2.3),(6,.22,.22),WOOD);b.finish()
# Blank hanging sign: fabricated text deliberately absent.
b=Builder('s05_sign');b.tube([(-47,-30,.94),(-47,-30,4.6)],.04,BAMBOO,8);b.tube([(-47.05,-30,4.58),(-45.9,-30,4.58)],.035,BAMBOO,8)
for i in range(16):
 for j in range(32):
  def p(a,c):return(-46.98+a*.067,-30+.035*math.sin(a*.7+c*.4),4.53-c*.068)
  b.face([p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1)],CLOTH,smooth=True)
b.finish()
# Trees are sculpted branching structures; leaf sprays use the existing image texture at runtime.
layout=json.loads((ROOT/'src/chapter2/scene/layout.json').read_text())
for s in layout['structures']:
 if s['type']=='house':house(s)
for ti,(x,y,h) in enumerate(layout['trees']):
 b=Builder('s06_tree_'+str(ti));b.tube([(x,y,.85),(x+.13,y+.03,2.5),(x+.30,y-.2,4.2),(x+.38,y, .94+h)],.28,WOOD,12,.065)
 for j in range(12):
  a=j*2.399;reach=2+random.random()*1.5;start=(x+.20,y-.1,3.5+j%3*.40);end=(x+math.cos(a)*reach,y+math.sin(a)*reach,.94+h-.3+random.random()*.4)
  mid=((start[0]+end[0])/2,(start[1]+end[1])/2,end[2]+.2)
  b.tube([start,mid,end],.065,WOOD,8,.012)
  for k in [-1,1]:
   aa=a+k*.48;fork=(end[0]+math.cos(aa)*.7,end[1]+math.sin(aa)*.7,end[2]-.35)
   b.tube([mid,((mid[0]+fork[0])/2,(mid[1]+fork[1])/2,end[2]-.1),fork],.035,WOOD,7,.006)
   for t in [0,1]:
    tip=(fork[0]+math.cos(aa+t*.35)*.25,fork[1]+math.sin(aa+t*.35)*.25,fork[2]-1.0-t*.4)
    b.tube([fork,((fork[0]+tip[0])/2,(fork[1]+tip[1])/2,fork[2]-.35),tip],.009,WOOD,5,.002)
 for j in range(5):
  a=j*math.tau/5;b.tube([(x,y,1.4),(x+math.cos(a)*.55,y+math.sin(a)*.55,.98),(x+math.cos(a)*.8,y+math.sin(a)*.8,.94)],.13,WOOD,7,.018)
 b.finish()
# Modest fragments, pebbles and grass roots, mainly near edges and existing structures.
b=Builder('D_surface_detail')
for i in range(360):
 x=random.uniform(-78,-25);y=random.uniform(-56,-20);z=.955
 if any(s['type']=='house' and abs(x-s['x'])<s['w']/2+.2 and abs(y-s['z'])<s['d']/2+.2 for s in layout['structures']):continue
 r=random.uniform(.012,.065);profile=[(0,0),(r*.78,.008),(r,.025),(r*.56,r*.62),(0,r*.70)]
 b.lathe((x,y,z),profile,PEBBLES[i%3],7)
for x,y in [(-67,-27),(-40,-43),(-59,-31.2),(-50,-31.2),(-57,-45),(-33,-18.9),(-48,-19)]:
 for i in range(22):
  xx=x+random.uniform(-.5,.5);yy=y+random.uniform(-.5,.5);h=random.uniform(.08,.20);b.face([(xx-.01,yy,.96),(xx+.012,yy,.96),(xx+.05,yy+.02,.96+h)],LEAF)
b.finish()
# Canopy replaces only the existing covered-cart proxy; no cart dimensions change.
b=Builder('s11_canopy');x=-53;y=-44.5
for j in range(24):
 for k in range(16):
  def p(a,c):
   u=a/24;v=c/12;return(x+(u-.5)*2.3,y+(v-.5)*3.1,2.64+.45*math.sin(math.pi*u)+.025*math.cos(v*24))
  b.face([p(j,k),p(j+1,k),p(j+1,k+1),p(j,k+1)],CLOTH,smooth=True)
for yy in [y-1.5,y+1.5]:
 b.tube([(x-1.15,yy,2.6),(x-.7,yy,3.0),(x,yy,3.1),(x+.7,yy,3.0),(x+1.15,yy,2.6)],.025,BAMBOO,6)
b.finish()
# Static short-range hemisphere occlusion sampled from the actual D meshes.
from mathutils.bvhtree import BVHTree
vertices=[];triangles=[]
for ob in bpy.context.scene.objects:
 if ob.type!='MESH':continue
 ob.data.calc_loop_triangles();offset=len(vertices);vertices.extend(v.co.copy() for v in ob.data.vertices);triangles.extend(tuple(offset+i for i in t.vertices) for t in ob.data.loop_triangles)
bvh=BVHTree.FromPolygons(vertices,triangles,all_triangles=True,epsilon=.0001)
# Occlusion close to footings includes the real local earth plane.
base=len(vertices);vertices.extend([Vector((-84,18,.94)),Vector((-20,18,.94)),Vector((-20,60,.94)),Vector((-84,60,.94))]);triangles.extend([(base,base+1,base+2),(base,base+2,base+3)])
bvh=BVHTree.FromPolygons(vertices,triangles,all_triangles=True,epsilon=.0001)
samples=24;golden=2.399963229728653;cache={};baked=0
for ob in bpy.context.scene.objects:
 if ob.type!='MESH' or not (ob.name.startswith(('s04','s05_house','s06_low','s07_stall'))):continue
 mesh=ob.data;attr=mesh.color_attributes.new(name='D_BakedOcclusion',type='FLOAT_COLOR',domain='CORNER');mesh.color_attributes.active_color=attr
 for poly in mesh.polygons:
  material=poly.material_index
  for li in poly.loop_indices:
   if material not in [PLASTER,WOOD,*STONES,BAMBOO,ROPE,CERAMIC,CERAMIC_INNER,CLAY]:attr.data[li].color=(1,1,1,1);continue
   co=mesh.vertices[mesh.loops[li].vertex_index].co;normal=poly.normal;key=tuple(round(q,4) for q in (*co,*normal))
   if key not in cache:
    up=normal.cross(Vector((0,0,1)))
    if up.length<.01:up=normal.cross(Vector((0,1,0)))
    up.normalize();across=normal.cross(up);occ=0
    for j in range(samples):
     radius=math.sqrt((j+.5)/samples);angle=j*golden;direction=up*(math.cos(angle)*radius)+across*(math.sin(angle)*radius)+normal*math.sqrt(1-radius*radius)
     hit=bvh.ray_cast(co+normal*.012,direction,1.20)
     if hit[0] is not None:occ+=(1-hit[3]/1.20)**.5
    cache[key]=1-(.64 if material in [CERAMIC,CERAMIC_INNER] else .48)*occ/samples;baked+=1
   f=cache[key];attr.data[li].color=(f,f,f,1)
print({'bakedOcclusionVertices':baked,'hemisphereSamples':samples,'rayRangeMetres':1.20})

# Export per-material joined buffers per semantic object, Blender source retained for review.
for obj in list(bpy.context.scene.objects):
 if obj.type!='MESH':continue
 # Weighted bevel on hard timber corners is limited to a few cm, preserving slender joinery.
 if obj.name.startswith('s09'):
  mod=obj.modifiers.new('Worn exposed edges','BEVEL');mod.width=.008;mod.segments=2
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'.dream-loop/chapter2-2026-10-02/d-detail.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'d-detail.glb'),export_format='GLB',export_yup=True,export_apply=True,export_texcoords=True,export_normals=True,export_materials='EXPORT',export_image_format='AUTO',export_animations=False,export_vertex_color='ACTIVE')
report={'authoring':'Blender 5.2.1 local mesh authoring','layoutVersion':layout['version'],'objects':len(bpy.context.scene.objects),'polygons':sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type=='MESH'),'asset':'d-detail.glb','newExternalAssets':False,'sources':['existing CC0 WoodSiding006 / Plaster007','existing imagegen willow-spray at runtime (unused atlas removed)','generated earth/timber/linen/clay/plaster/willow-bark/paper albedos and spring sky (approved visual scope)'],'noGameplayChanges':True,'ambientOcclusion':{'method':'BVH hemisphere sampled vertex colors','samples':samples,'vertices':baked,'radius':1.2}}
(OUT/'authoring.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(report)
