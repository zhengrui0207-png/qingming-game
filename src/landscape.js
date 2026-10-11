import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const TREES=[[-75,18,1.1],[-44,18,1],[-17,26,.9],[46,19,1.2],[69,20,1.1],[74,-18,1],[-72,-21,1],[-20,-34,1],[33,-34,.8],[52,52,1.15],[-52,54,1.1],[-14,60,.8],[17,60,.9],[37,24,1.15]];
export async function createLandscape(scene,renderer,world){
 const map=await new THREE.TextureLoader().loadAsync(import.meta.env.BASE_URL+'assets/textures/willow-spray.png');map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const group=new THREE.Group();group.name='Complete riverside willows';scene.add(group);
 const wind={value:0};
 // The top-left branch of the photographed spray is its attachment point.
 // Pin this point; the bottom of each hanging spray moves most in the breeze.
 function windShader(s){s.uniforms.windTime=wind;s.vertexShader='uniform float windTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvec3 anchor=(instanceMatrix*vec4(0.,0.,0.,1.)).xyz;float flex=clamp(-position.y,0.,1.);float breeze=sin(windTime*.8+anchor.x*.24+anchor.z*.19);transformed.x+=(breeze*.095+sin(windTime*1.7+anchor.z)*.022)*flex;transformed.z+=cos(windTime*.65+anchor.x*.3)*.065*flex;`);}
 const material=new THREE.MeshStandardMaterial({map,alphaTest:.28,side:THREE.DoubleSide,roughness:.88,color:0xe0e6be,emissive:0x6b783d,emissiveIntensity:.055});material.onBeforeCompile=windShader;material.customProgramCacheKey=()=> 'willow-attached-wind-v41';
 const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map,alphaTest:.28,side:THREE.DoubleSide});depth.onBeforeCompile=windShader;depth.customProgramCacheKey=()=> 'willow-attached-shadow-v41';
 const leafGeometry=new THREE.PlaneGeometry(1,1,3,6);leafGeometry.translate(.42,-.48,0);
 const count=TREES.length*10*6*2,leaf=new THREE.InstancedMesh(leafGeometry,material,count);leaf.name='Willow hanging leaf sprays';leaf.customDepthMaterial=depth;leaf.castShadow=true;leaf.receiveShadow=true;leaf.frustumCulled=false;group.add(leaf);
 const dummy=new THREE.Object3D(),parts=[];let seed=822,index=0,branches=0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function branch(points,radius,endRadius=.005,segments=12,sides=7){
  const curve=new THREE.CatmullRomCurve3(points),g=new THREE.TubeGeometry(curve,segments,radius,sides,false),p=g.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const t=Math.floor(i/(sides+1))/segments,c=curve.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(p,i).sub(c);const ridge=1+.08*Math.sin((i%(sides+1))*2.7+t*9);v.multiplyScalar(THREE.MathUtils.lerp(1,endRadius/radius,t)*ridge);p.setXYZ(i,c.x+v.x,c.y+v.y,c.z+v.z);const shade=.74+.16*Math.sin((i%(sides+1))*1.9)+.07*Math.sin(t*18);colors.push(shade,shade*.97,shade*.89);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();parts.push(g);branches++;return curve;
 }
 for(let tree=0;tree<TREES.length;tree++){
  const [x,z,size]=TREES[tree],angle=tree*2.399,lean=.25+rand()*.4,top=(6.7+rand()*.85)*size,base=.94;
  const point=(dx,y,dz)=>new THREE.Vector3(x+dx*size,base+y*size,z+dz*size);
  branch([point(0,-.12,0),point(lean*.25,1.7,.03),point(lean,3.6,-.12),point(lean*.8,top/size-.94,.08)],.34*size,.075*size,18,10);
  for(let r=0;r<5;r++){const a=angle+r*1.256;branch([point(lean*.08,.6,0),point(Math.cos(a)*.52,.14,Math.sin(a)*.52),point(Math.cos(a)*1.0,-.035,Math.sin(a)*1.0)],.14*size,.008,8,7);}
  for(let b=0;b<10;b++){
   const a=angle+b*2.399+(rand()-.5)*.32,reach=2.1+rand()*1.6,high=top/size-.5+rand()*.6;
   const limb=branch([point(lean,3.3+(b%3)*.48,-.05),point(Math.cos(a)*1.4,high-.1,Math.sin(a)*1.4),point(Math.cos(a)*reach,high-.25,Math.sin(a)*reach)],(.085+rand()*.025)*size,.016*size,12,7);
   for(let t=0;t<6;t++){
    const root=limb.getPoint(.45+t*.1),aa=a+(rand()-.5)*1.25,drop=(1.65+rand()*1.7)*size,spread=(.45+rand()*.7)*size;
    const mid=root.clone().add(new THREE.Vector3(Math.cos(aa)*spread,-drop*.36,Math.sin(aa)*spread));
    const tip=root.clone().add(new THREE.Vector3(Math.cos(aa)*spread*1.25,-drop,Math.sin(aa)*spread*1.25));
    branch([root,mid,tip],.018*size,.0025*size,9,5);
    for(let layer=0;layer<2;layer++){
     const at=layer?mid:root;dummy.position.copy(at);dummy.rotation.set((rand()-.5)*.16,-aa+(layer?1.35:0),(rand()-.5)*.10);dummy.scale.set((.8+rand()*.35)*size,(layer?drop*.65:drop*.88),1);dummy.updateMatrix();leaf.setMatrixAt(index,dummy.matrix);leaf.setColorAt(index++,new THREE.Color().setHSL(.19+rand()*.035,.22+rand()*.17,.55+rand()*.19));
    }
   }
  }
 }
 const woodGeometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());
 const bark=new THREE.MeshStandardMaterial({color:0x887760,roughness:.98,vertexColors:true});
 bark.onBeforeCompile=s=>{s.vertexShader='varying vec3 barkPoint;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nbarkPoint=position;');s.fragmentShader='varying vec3 barkPoint;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grooves=sin(barkPoint.x*45.+sin(barkPoint.y*1.8)*2.)*sin(barkPoint.z*43.+barkPoint.y*.7);diffuseColor.rgb*=.82+.18*smoothstep(-.5,.65,grooves);');};
 const wood=new THREE.Mesh(woodGeometry,bark);wood.name='14 complete willow trunks roots and drooping branches';wood.castShadow=true;wood.receiveShadow=true;group.add(wood);
 // Grass follows the same bank height on both sides of the river.
 const grassMat=new THREE.MeshStandardMaterial({color:0x707347,roughness:1,side:THREE.DoubleSide}),positions=[];const v=(x,y,z)=>positions.push(x,y,z);
 for(let i=0;i<2100;i++){
  const x=rand()*174-87,z=(rand()>.5?1:-1)*(16.7+rand()*.7);if(Math.abs(x)<6||Math.abs(x-32)<4||Math.abs(x+17)<3)continue;
  const h=.15+rand()*.4,w=.025+rand()*.025,y=.38+(Math.abs(z)-16.7)*.05,a=rand()*6.28;v(x-w*Math.cos(a),y,z-w*Math.sin(a));v(x+w*Math.cos(a),y,z+w*Math.sin(a));v(x+.12*Math.sin(a),y+h,z+.12*Math.cos(a));
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const grass=new THREE.Mesh(geo,grassMat);grass.receiveShadow=true;group.add(grass);
 return {update:t=>{wind.value=t;},getState:()=>({version:'4.1',trees:TREES.length,completeTrunks:TREES.length,branches,leafCards:count,wind:true,windTime:wind.value,matchingWindShadows:true,texture:'willow-spray',riparianTufts:positions.length/9})};
}
