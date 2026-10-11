import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// Audit-only standalone viewer: no registry, input ports, save, or formal index writes.
const $=id=>document.getElementById(id);
const choices=[
 ['QMSH-08','掌柜候选','characters/QMSH-08.glb','已有算盘；核对杂货身份，不能把数算盘称为交易递物。'],
 ['QMSH-17','饭食伙计候选','characters/QMSH-17.glb','茶坊服式与倒茶道具待核对；倒茶不能称为递蒸饼。'],
 ['QMSH-28','老脚夫候选','characters/QMSH-28.glb','挑担/擦汗为已有动作；年龄、修缮试拉及手持冲突待01/06定稿。'],
 ['QMSH-21','渔夫外观候选A','characters/QMSH-21.glb','现身份是农夫；不能直接改名为渔夫。检查工具是否能拆。'],
 ['QMSH-23','渔夫外观候选B','characters/QMSH-23.glb','现身份是纤夫；不能冒充已适配渔夫。肩绳和劳动姿态待改。'],
 ['steamer','现有蒸笼','scenery/steamer.glb','只复用形制，不证明对应原画屋宇身份；盖和食物需要分件。'],
 ['cargo','现有货包','scenery/cargo.glb','货包不等于可修缮的箱笼；完整绳段需要另作。'],
 ['rope','第一关盘绳','hongqiao/item_hq_rope.glb','只读盘绳参考；不能拉伸为修缮绳或覆盖第一关资产。']
];
for(const [id,name] of choices)$('asset').add(new Option(`${id} · ${name}`,id));
const renderer=new THREE.WebGLRenderer({canvas:$('canvas'),antialias:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();scene.background=new THREE.Color('#a7bcba');
scene.add(new THREE.HemisphereLight(0xbfcddd,0x8e7657,.85));
const sun=new THREE.DirectionalLight(0xffe4b6,3.8);sun.position.set(-38,49,32);scene.add(sun);
scene.add(new THREE.AmbientLight(0xb3c7c7,.06));
const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromScene(new RoomEnvironment(),.04);scene.environment=env.texture;scene.environmentIntensity=.3;pmrem.dispose();
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#b9a17a',roughness:.95}));ground.rotation.x=-Math.PI/2;scene.add(ground);
const draco=new DRACOLoader().setDecoderPath('/assets/draco/').setWorkerLimit(2);
const loader=new GLTFLoader().setDRACOLoader(draco),catalog=await fetch('/assets/characters/catalog.json').then(r=>r.json());
let models=[],mixers=[],actions=[],gltf=null,activeClip='',playing=true,near=true,token=0,report={};
function publish(){ $('report').textContent=JSON.stringify(report,null,2); }
function vertices(model){
 model.updateMatrixWorld(true);const result=[];
 model.traverse(o=>{if(!o.isSkinnedMesh)return;const n=o.geometry.attributes.position.count;
 for(let i=0;i<n;i+=Math.max(1,Math.floor(n/128)))result.push(o.getVertexPosition(i,new THREE.Vector3()).applyMatrix4(o.matrixWorld).toArray());});return result;
}
function difference(a,b){return Math.max(0,...a.map((v,i)=>Math.hypot(...v.map((x,j)=>x-b[i][j]))));}
function sample(){
 if(!gltf)return;
 const a=clone(gltf.scene),b=clone(gltf.scene),ma=new THREE.AnimationMixer(a);
 let bonesA=[],bonesB=[];a.traverse(o=>{if(o.isBone)bonesA.push(o)});b.traverse(o=>{if(o.isBone)bonesB.push(o)});
 const untouched=vertices(b);const results=[];
 for(const clip of gltf.animations){
  ma.stopAllAction();const action=ma.clipAction(clip);action.reset().play();
  ma.setTime(0);const first=vertices(a);let maxVertexDisplacement=0,minimumY=Infinity,maximumY=-Infinity;
  for(let n=0;n<=32;n++){
   ma.setTime(clip.duration*n/33);const v=vertices(a);
   if(v.length)maxVertexDisplacement=Math.max(maxVertexDisplacement,difference(first,v));
   a.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(a,true);minimumY=Math.min(minimumY,box.min.y);maximumY=Math.max(maximumY,box.min.y);
  }
  results.push({clip:clip.name,duration:clip.duration,samples:33,maxSampledWorldVertexDisplacement:maxVertexDisplacement,rawBottomYRange:[minimumY,maximumY],
   secondCloneUnchanged:difference(untouched,vertices(b))===0,
   independentBoneObjects:bonesA.length===bonesB.length&&bonesA.every((bone,i)=>bone!==bonesB[i]),
   visualAccepted:false,note:'Displacement proves skin changes, not hand contact or artistic approval. Original coordinate units.'});
 }
 ma.stopAllAction();ma.uncacheRoot(a);report.animationSamples=results;publish();
}
async function load(){
 const serial=++token;const choice=choices.find(c=>c[0]===$('asset').value);$('note').textContent=choice[3];$('report').textContent='正在解码…';
 const next=await loader.loadAsync('/assets/'+choice[2]);if(serial!==token)return;
 for(const m of models)scene.remove(m);mixers.forEach(m=>{m.stopAllAction();m.uncacheRoot(m.getRoot());});
 if(gltf){gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const mat of [o.material].flat()){for(const v of Object.values(mat))if(v?.isTexture)v.dispose();mat.dispose();}}});}
 gltf=next;const bounds=new THREE.Box3().setFromObject(next.scene,true),size=bounds.getSize(new THREE.Vector3()),row=catalog.find(c=>c.id===choice[0]);
 const scale=row?row.height/size.y:1/Math.max(size.x,size.y,size.z);report={assetId:choice[0],file:'/assets/'+choice[2],decoded:true,rawBounds:{min:bounds.min.toArray(),max:bounds.max.toArray(),size:size.toArray()},fitScale:scale,fitUses:'whole height for audit characters; longest axis 1 for props; production must body-fit when tools extend above head',
  decodedTriangles:0,materials:[],clips:next.animations.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length})),formalChapter2Accepted:false,lighting:'main.js base lights, exposure and FOV; no world/AO/water/occlusion',cameraFollow:{yaw:.22,pitch:.49,distance:10},view:near?'near':'follow'};
 const mats=new Set();next.scene.traverse(o=>{if(o.isMesh){report.decodedTriangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;[o.material].flat().forEach(m=>mats.add(m.name));}});report.materials=[...mats];
 models=[];mixers=[];actions=[];
 for(let i=0;i<4;i++){
  const root=new THREE.Group(),orientation=new THREE.Group(),fit=new THREE.Group(),model=clone(next.scene);
  root.add(orientation);orientation.add(fit);fit.add(model);orientation.rotation.y=-Math.PI/2+i*Math.PI/2;
  fit.scale.setScalar(scale);fit.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
  model.traverse(o=>{if(o.isMesh){o.frustumCulled=false;[o.material].flat().forEach(m=>m.envMapIntensity=.3);}});
  scene.add(root);models.push(root);mixers.push(new THREE.AnimationMixer(model));
 }
 $('clip').replaceChildren(new Option('绑定姿态',''));next.animations.forEach(c=>$('clip').add(new Option(c.name,c.name)));
 $('clip').value=next.animations.find(c=>/^idle$/i.test(c.name))?.name??'';setClip();publish();sample();
}
function setClip(){activeClip=$('clip').value;actions=[];mixers.forEach(m=>{m.stopAllAction();if(activeClip){const a=m.clipAction(gltf.animations.find(c=>c.name===activeClip));a.play();actions.push(a);}});report.activeClip=activeClip||'bind';publish();}
$('asset').onchange=()=>load().catch(e=>{$('report').textContent=e.message;});$('clip').onchange=setClip;
$('play').onclick=()=>{playing=!playing;$('play').textContent=playing?'暂停动作':'播放动作';report.playing=playing;publish();};
$('near').onclick=()=>{near=!near;report.view=near?'near':'follow';publish();};$('sample').onclick=sample;
const camera=new THREE.PerspectiveCamera(48,1,.12,400),clock=new THREE.Clock();
function render(){
 const dt=Math.min(clock.getDelta(),.1);if(playing)mixers.forEach(m=>m.update(dt));
 const w=$('canvas').clientWidth,h=$('canvas').clientHeight;renderer.setSize(w,h,false);renderer.setScissorTest(true);
 for(let i=0;i<models.length;i++){
  models.forEach((m,j)=>m.visible=i===j);camera.aspect=(w/4)/h;camera.updateProjectionMatrix();
  const distance=near?4:10,focus=new THREE.Vector3(0,.95,0);camera.position.set(Math.sin(.22)*Math.cos(.49)*distance,focus.y+Math.sin(.49)*distance,Math.cos(.22)*Math.cos(.49)*distance);camera.lookAt(focus);
  renderer.setViewport(i*w/4,0,w/4,h);renderer.setScissor(i*w/4,0,w/4,h);renderer.render(scene,camera);
 }
 renderer.setScissorTest(false);requestAnimationFrame(render);
}
load().catch(e=>{$('report').textContent=e.stack;});render();
addEventListener('pagehide',()=>{mixers.forEach(m=>m.stopAllAction());draco.dispose();env.texture.dispose();renderer.dispose();});
