import * as THREE from 'three';
import {createBridgeReaction} from './hongqiao/cinema/bridge-reaction.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';

const v=new THREE.Vector3(),q=new THREE.Quaternion();
const clamp=THREE.MathUtils.clamp;
function fitAnatomy(model,bounds){
 const bones=[];model.updateMatrixWorld(true);model.traverse(o=>{if(o.isBone)bones.push(o)});
 const h=bounds.max.y-bounds.min.y,c=bounds.getCenter(new THREE.Vector3());
 const positions=new Map(bones.map(b=>[b,b.getWorldPosition(new THREE.Vector3())]));
 const nearest=(y,z)=>bones.filter(b=>b.children.some(x=>x.isBone)).sort((a,b)=>{
  const cost=n=>{const p=positions.get(n);return Math.abs((p.y-bounds.min.y)/h-y)+Math.abs((p.z-c.z)/h-z)*2+Math.abs(p.x-c.x)/h*.4};return cost(a)-cost(b);
 })[0];
 const limb=b=>b?{bone:b,base:b.quaternion.clone(),axis:new THREE.Vector3(0,0,1).applyQuaternion(b.parent.getWorldQuaternion(new THREE.Quaternion()).invert())}:null;
 const thighs=[nearest(.50,-.07),nearest(.50,.07)];
 return {legs:thighs.map(b=>({hip:limb(b),knee:limb(b?.children.find(x=>x.isBone))})),spine:limb(nearest(.66,0))};
}
function rotatePart(part,angle){if(part)part.bone.quaternion.copy(part.base).premultiply(q.setFromAxisAngle(part.axis,angle));}

export const npcRenderConfig=Object.freeze({farEnter:32,farExit:24,nearPoseInterval:1/30,farPoseInterval:1/10});

export async function loadNpcAssets(baseURL,onProgress=()=>{}){
 const [catalog,mapping]=await Promise.all(['catalog.json','npc-map.json'].map(async f=>{const r=await fetch(baseURL+'assets/characters/'+f);if(!r.ok)throw Error('人物清单加载失败');return r.json()}));
 const draco=new DRACOLoader().setDecoderPath(baseURL+'assets/draco/').setWorkerLimit(2);
 const loader=new GLTFLoader().setDRACOLoader(draco),templates=new Map(),failures=[];
 let cursor=0,done=0;
 await Promise.all(Array.from({length:3},async()=>{while(cursor<catalog.length){const asset=catalog[cursor++];try{
  const gltf=await loader.loadAsync(baseURL+asset.file);gltf.scene.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new THREE.Vector3());
  let headTop=-Infinity;gltf.scene.traverse(o=>{if(o.isBone){o.getWorldPosition(v);if(Math.abs(v.z-center.z)<(bounds.max.y-bounds.min.y)*.22)headTop=Math.max(headTop,v.y)}});
  // Props may extend above the head; scale people by their body, not their staff.
  const height=bounds.max.y-bounds.min.y;
  const bodyHeight=Number.isFinite(headTop)?clamp(headTop-bounds.min.y+height*.065,height*.65,height):height;
  gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.envMapIntensity=.3;}}});
  const lowGeometries=new Map();
  if(asset.lodFile){
   const low=await loader.loadAsync(baseURL+asset.lodFile),byName=new Map();
   low.scene.traverse(o=>{if(o.isMesh)byName.set(o.name,o)});
   gltf.scene.traverse(o=>{if(!o.isMesh)return;const other=byName.get(o.name);
    // Reuse the live skeleton only when joint order and bind matrices agree.
    const matching=other&&!!o.isSkinnedMesh===!!other.isSkinnedMesh&&(!o.isSkinnedMesh||(o.skeleton.bones.length===other.skeleton.bones.length&&o.skeleton.bones.every((b,i)=>b.name===other.skeleton.bones[i].name&&o.skeleton.boneInverses[i].equals(other.skeleton.boneInverses[i]))));
    if(matching)lowGeometries.set(o.name,other.geometry);
   });
  }
  templates.set(asset.id,{asset,gltf,bounds,bodyHeight,lowGeometries});
 }catch(error){failures.push({assetId:asset.id,error:error.message});console.error('[NPC asset]',asset.id,error)}done++;onProgress(done,catalog.length)}}));
 draco.dispose();
 const byNPC=new Map(mapping.map(row=>[row.id,row]));
 function spawn(npcId,assetId=null){
  const assignment=byNPC.get(npcId),template=templates.get(assetId??assignment?.assetId);if(!template)return null;
  const {asset,gltf,bounds,bodyHeight,lowGeometries}=template,root=new THREE.Group(),orientation=new THREE.Group(),model=cloneSkeleton(gltf.scene);
  const detailMeshes=[];model.traverse(o=>{if(o.isMesh&&lowGeometries.has(o.name))detailMeshes.push({mesh:o,full:o.geometry,low:lowGeometries.get(o.name),castShadow:o.castShadow})});
  let lowDetail=false;
  function setDetail(far){if(lowDetail===far)return;lowDetail=far;for(const entry of detailMeshes){entry.mesh.geometry=far?entry.low:entry.full;entry.mesh.castShadow=far?false:entry.castShadow;}}
  const anatomy=asset.skins?fitAnatomy(model,bounds):null;
  root.name=npcId+' / '+asset.name;root.userData={npcId,assetId:asset.id,sourceStatus:asset.sourceStatus};
  orientation.rotation.y=-Math.PI/2;root.add(orientation);
  const fit=new THREE.Group();orientation.add(fit);fit.add(model);
  const scale=asset.height/bodyHeight;fit.scale.setScalar(scale);
  fit.position.set(-(bounds.max.x+bounds.min.x)*.5*scale,-bounds.min.y*scale,-(bounds.max.z+bounds.min.z)*.5*scale);
  const normalY=fit.position.y;
  const mixer=new THREE.AnimationMixer(model),clips=gltf.animations,actions=clips.map(c=>{const a=mixer.clipAction(c);a.play();a.enabled=true;a.setEffectiveWeight(0);return a});
  const idle=clips.findIndex(c=>/^idle$/i.test(c.name)),walk=clips.findIndex(c=>/^walk$/i.test(c.name)),occupation=clips.findIndex(c=>/occupation/i.test(c.name));
  let animationClock=0,walkWeight=0,occupationWeight=0,lastUpdate=-Infinity,frames=0,currentClip='static';
  function update(time,dt,{walking=false,role='',phase=0,far=false,travelSpeed=1}={}){
   const seated=['骑马人','乘客'].includes(role);
   // Advance the clock on every simulation update, even when the distant pose
   // is sampled less often. Dropping dt here made the legs lag behind motion.
   animationClock+=Math.max(0,dt)*(walking?clamp(travelSpeed/.95,.4,1.9):1);
   const blend=1-Math.exp(-Math.max(0,dt)*9),working=!walking&&!seated&&occupation>=0&&((time+phase)%14)>5;
   walkWeight=THREE.MathUtils.lerp(walkWeight,walking&&!seated?1:0,blend);
   occupationWeight=THREE.MathUtils.lerp(occupationWeight,working?1:0,blend);
   if(time-lastUpdate<(far?npcRenderConfig.farPoseInterval:npcRenderConfig.nearPoseInterval)&&time>=lastUpdate)return;lastUpdate=time;frames++;
   if(actions.length){
    for(let i=0;i<actions.length;i++){
     const weight=i===walk?walkWeight:i===occupation?(1-walkWeight)*occupationWeight:i===idle?(1-walkWeight)*(1-occupationWeight):0;
     actions[i].setEffectiveWeight(weight);actions[i].time=(animationClock+phase)%clips[i].duration;
    }
    mixer.update(0);currentClip=walking&&!seated&&walk>=0?clips[walk].name:working?clips[occupation].name:idle>=0?clips[idle].name:'bind';
   }
   fit.position.y=normalY-(seated?asset.height*.48:0);
   if(seated&&anatomy){for(const leg of anatomy.legs){rotatePart(leg.hip,1.12);rotatePart(leg.knee,-1.25)}currentClip+=' + seated';}
   if(role==='船夫'&&anatomy){rotatePart(anatomy.spine,.04*Math.sin(time*3+phase));currentClip+=' + rowing';}
  }
  return {root,asset,update,setDetail,hasLowDetail:detailMeshes.length>0,state:()=>({npcId,assetId:asset.id,animated:clips.length>0,clip:currentClip,frames,animationClock,clipTime:actions[clips.findIndex(c=>c.name===currentClip)]?.time??0,clipDuration:clips.find(c=>c.name===currentClip)?.duration??0,occupationWeight,lowDetail,sourceStatus:asset.sourceStatus,angle:root.rotation.y,facing:new THREE.Vector3(1,0,0).transformDirection(model.matrixWorld).toArray(),position:root.position.toArray(),scale:root.scale.toArray(),visible:root.visible}),dispose(){mixer.stopAllAction();mixer.uncacheRoot(model);root.removeFromParent()}};
 }
 return {spawn,catalog,mapping,failures,getState:()=>({requested:catalog.length,loaded:templates.size,failures,bytes:catalog.reduce((n,a)=>n+a.bytes+(a.lodBytes??0),0)})};
}

export function createNpcCrowd(scene,people,library,camera){
 const root=new THREE.Group();root.name='Tripo matched street residents';scene.add(root);
 const records=people.map((p,i)=>{const rec=library.spawn(`street-${String(i).padStart(3,'0')}`);if(rec)root.add(rec.root);return rec});
 let visible=0,cinematicFocus=null,bridgeAlarm=null;
 const reactions=records.map(rec=>rec?createBridgeReaction(rec.root):null);
 return {
  hide:i=>{if(records[i]){records[i].root.visible=false;records[i].screenVisible=false;}},
  setCamera:next=>{camera=next;},
  setCinematicFocus:next=>{cinematicFocus=next;},
  setBridgeAlarm:next=>{bridgeAlarm=next;if(!next)reactions.forEach(r=>r?.restore());},
  put(i,pose,walking,time,dt){
   const rec=records[i];if(!rec)return false;
   rec.root.position.set(pose.x,pose.y,pose.z);rec.root.rotation.y=pose.angle;rec.root.scale.setScalar(pose.scale||1);
   const reacting=bridgeAlarm&&Math.abs(pose.x)<3.95&&Math.abs(pose.z)<17.5;
   if(reacting)reactions[i].apply(bridgeAlarm.target,bridgeAlarm.time,i,pose.angle);else reactions[i].restore();
   const distance=rec.root.position.distanceTo(camera.position);v.copy(rec.root.position);v.y+=1;v.project(camera);
   rec.screenVisible=distance<190&&v.z>-1&&v.z<1&&Math.abs(v.x)<1.3&&Math.abs(v.y)<1.4;
   if(cinematicFocus){const {from,to}=cinematicFocus,dx=to.x-from.x,dz=to.z-from.z,l=dx*dx+dz*dz,u=clamp(((pose.x-from.x)*dx+(pose.z-from.z)*dz)/l,0,1),near=Math.hypot(pose.x-from.x,pose.z-from.z)<7,corridor=Math.hypot(pose.x-from.x-dx*u,pose.z-from.z-dz*u)<1.65; if(near||corridor)rec.screenVisible=false;}
   const far=!reacting&&rec.hasLowDetail&&!['骑马人','乘客'].includes(people[i].role)&&distance>(rec.lod==='distant'?npcRenderConfig.farExit:npcRenderConfig.farEnter);
   // Both levels use the same visible object, skeleton and animation.
   // LOD geometry preserves the original texture atlas; hysteresis prevents repeated switching at one radius.
   rec.setDetail(far);rec.root.visible=rec.screenVisible;rec.lod=far?'distant':'full';
   if(rec.screenVisible){visible++;if(!reacting)rec.update(time,dt,{walking,role:people[i].role,phase:people[i].phase,far,travelSpeed:people[i].travelSpeed})}
   return true;
  },
  done(){const n=visible;visible=0;return n;},
  getState:()=>({bridgeAlarm:!!bridgeAlarm,reacting:reactions.filter(r=>r?.active).length,total:records.length,replaced:records.filter(Boolean).length,visible:records.filter(r=>r?.screenVisible).length,fullDetail:records.filter(r=>r?.root.visible&&r.lod==='full').length,animatedLowDetail:records.filter(r=>r?.root.visible&&r.lod==='distant').length,uniqueAssets:[...new Set(records.filter(Boolean).map(r=>r.asset.id))].length,staticInstances:records.filter(r=>r&&!r.asset.skins).length}),
  snapshot:()=>records.filter(Boolean).map(r=>({...r.state(),visible:r.screenVisible,lod:r.lod}))
 };
}
