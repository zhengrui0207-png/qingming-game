import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
export const oxConfig=Object.freeze({file:'assets/scenery/ox.glb',pack:'assets/scenery/ox-pack.glb',height:1.78});
export async function loadOxen(scene,baseURL,count=2){
 const loader=new GLTFLoader(),[gltf,packGLTF]=await Promise.all([loader.loadAsync(baseURL+oxConfig.file),loader.loadAsync(baseURL+oxConfig.pack)]);
 const records=Array.from({length:count},(_,i)=>{
  const root=new THREE.Group(),fit=new THREE.Group(),model=clone(gltf.scene),pack=packGLTF.scene.clone(true);root.name='pack_ox_'+i;root.add(fit,pack);fit.add(model);scene.add(root);model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
  const find=name=>{let found;model.traverse(n=>{if(n.name.replaceAll(':','')===name)found=n});return found;};
  const head=find('tripoHead_0'),tail=find('tripoTail_0');if(!head||!tail)throw Error('牛模型缺少可验证的头尾骨骼');
  const h=head.getWorldPosition(new THREE.Vector3()),t=tail.getWorldPosition(new THREE.Vector3());fit.rotation.y=-Math.atan2(h.x-t.x,h.z-t.z);
  const scale=oxConfig.height/size.y;model.scale.setScalar(scale);model.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale,-(bounds.min.z+bounds.max.z)*scale/2);
  pack.position.set(0,1.38,-.16);pack.scale.setScalar(.9);
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;for(const m of Array.isArray(o.material)?o.material:[o.material])m.envMapIntensity=.32;}});
  const mixer=new THREE.AnimationMixer(model),idle=mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations,'preset:idle')),walk=mixer.clipAction(THREE.AnimationClip.findByName(gltf.animations,'preset:quadruped:walk'));idle.play();walk.play().setEffectiveWeight(0);let weight=0,clock=0;
  return {root,model,pack,update(p,dt,moving,speed){root.position.set(p.x,p.y??.94,p.z);root.rotation.y=p.angle;weight=THREE.MathUtils.lerp(weight,moving?1:0,1-Math.exp(-dt*8));idle.setEffectiveWeight(1-weight);walk.setEffectiveWeight(weight);walk.setEffectiveTimeScale(Math.max(.35,Math.min(1.3,speed/.7)));mixer.update(Math.min(dt,.24));clock+=dt;pack.rotation.z=Math.sin(clock*2.2+i)*.007*weight;pack.position.y=1.38+Math.sin(clock*4.4+i)*.007*weight;root.updateMatrixWorld(true);},state:()=>({id:root.name,position:root.position.toArray(),angle:root.rotation.y,walkWeight:weight,clipTime:walk.time,pack:oxConfig.pack,height:oxConfig.height})};
 });
 return {update:(i,p,dt,moving,speed)=>records[i].update(p,dt,moving,speed),getState:()=>records.map(r=>r.state())};
}
