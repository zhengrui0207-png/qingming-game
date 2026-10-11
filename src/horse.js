import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export const horseConfig=Object.freeze({file:'assets/scenery/horse.glb',height:2.18,saddle:[0,1.43,-.03],fade:.22,clips:{idle:'Idle_Local',walk:'Walk_Local'}});
export async function loadHorses(scene,baseURL,count=2){
 const draco=new DRACOLoader().setDecoderPath(baseURL+'assets/draco/'),loader=new GLTFLoader().setDRACOLoader(draco),gltf=await loader.loadAsync(baseURL+horseConfig.file);draco.dispose();
 const records=Array.from({length:count},(_,i)=>{
  const root=new THREE.Group(),fit=new THREE.Group(),model=clone(gltf.scene);root.name='horse_tripo_'+i;scene.add(root);root.add(fit);fit.add(model);model.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(model),size=b.getSize(new THREE.Vector3()),head=model.getObjectByName('tripoHead_0').getWorldPosition(new THREE.Vector3()),tail=model.getObjectByName('tripoTail_0').getWorldPosition(new THREE.Vector3());
  fit.rotation.y=-Math.atan2(head.x-tail.x,head.z-tail.z);const scale=horseConfig.height/size.y;model.scale.setScalar(scale);model.position.set(-(b.min.x+b.max.x)*scale/2,-b.min.y*scale,-(b.min.z+b.max.z)*scale/2);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;o.material.envMapIntensity=.35;}});
  const mixer=new THREE.AnimationMixer(model),actions={};for(const [key,name] of Object.entries(horseConfig.clips)){const clip=THREE.AnimationClip.findByName(gltf.animations,name);if(!clip)throw Error('马匹缺少动作 '+name);actions[key]=mixer.clipAction(clip);}
  actions.idle.play();let active='idle';const saddle=new THREE.Vector3();
  return {root,fit,mixer,actions,update(p,dt,walking,speed){root.position.set(p.x,p.y??.94,p.z);root.rotation.y=p.angle;const next=walking?'walk':'idle';if(next!==active){actions[active].fadeOut(horseConfig.fade);actions[next].reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(horseConfig.fade).play();active=next;}mixer.timeScale=walking?Math.max(.5,Math.min(1.6,speed/1.15)):1;mixer.update(Math.min(dt,.24));root.updateMatrixWorld(true);saddle.set(...horseConfig.saddle);root.localToWorld(saddle);return saddle;},state:()=>({id:root.name,position:root.position.toArray(),clip:active,mixerTime:mixer.time,saddle:saddle.toArray(),height:horseConfig.height})};
 });
 return {update:(i,p,dt,walking,speed)=>records[i].update(p,dt,walking,speed),getState:()=>records.map(r=>r.state())};
}
