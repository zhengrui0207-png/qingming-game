import * as THREE from 'three';
import actions from './actions.json';
import {sampleRole,clamp,smooth} from './timeline.js';
const V=(a)=>new THREE.Vector3(...a);
export const cinematicAssetFor=id=>['actor_intro_tow_a','actor_intro_tow_b'].includes(id)?'QMSH-23':'QMSH-22';
// Dedicated key poses from Blender + deterministic hand IK to the authored prop contact points.
export function createPerformer(library,id,parent,position,yaw=0){
 const sourceAsset=cinematicAssetFor(id),tracker=sourceAsset==='QMSH-23';
 const visual=library.spawn(id,sourceAsset);if(!visual)throw Error('Cinematic asset unavailable: '+sourceAsset);
 const root=visual.root;root.name=id;root.position.fromArray(position);root.rotation.y=yaw;parent.add(root);
 const bones=new Map(),base=new Map();root.traverse(o=>{if(o.isBone){bones.set(o.name,o);base.set(o,o.quaternion.clone());}if(o.name==='QMSH22_bamboo_pole')o.visible=false;if(o.isMesh){o.frustumCulled=false;o.castShadow=true;}});
 const chainNames=tracker?[["tripo::1_Right_Limb_0","tripo::1_Right_Limb_1","tripo::1_Right_Limb_2"],["tripo::0_Right_Limb_1","tripo::0_Right_Limb_2","tripo::0_Right_Limb_3"]]:actions.armChains;
 const chains=chainNames.map(names=>names.map(n=>bones.get(THREE.PropertyBinding.sanitizeNodeName(n)))).filter(c=>c.every(Boolean));
 if(chains.length!==2)throw Error('Cinematic performer needs both authored arm chains');
 const head=bones.get('tripoHead_1'),spine=bones.get('tripoSpine_1');
 // The source rig ends at the wrists. Calibrated palm sockets place the line in the hand,
 // rather than driving a wrist joint onto the centre of a prop.
 const sockets=chains.map((chain,i)=>{const socket=new THREE.Object3D();socket.name=id+'_palm_'+i;if(tracker){const knuckles=chain[2].children.filter(n=>n.isBone);for(const n of knuckles)socket.position.add(n.position);socket.position.multiplyScalar(.65/Math.max(1,knuckles.length));}else socket.position.fromArray(i===0?[-.020,.052,.003]:[-.021,.022,.022]);chain[2].add(socket);return socket;});
 let gripTargets=[];
 const gripAxes=tracker?sockets.map(s=>s.position.clone().normalize()):[V([.95,-.08,.3]).normalize(),V([.39587,-.22954,.88916])];
 function rotateTo(joint,from,to){
  const parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());
  joint.quaternion.premultiply(parent.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(from.normalize(),to.normalize())).multiply(parent));
 }
 function aim(chain,target,i,direction){
  const wrist=chain[2],palm=sockets[i],world=(node)=>node.getWorldPosition(new THREE.Vector3());
  for(let repeat=0;repeat<10;repeat++){
   root.updateMatrixWorld(true);
   // Solve reach with a neutral wrist. Prop alignment must never fold the
   // hand backwards or accumulate twist while the arm solver iterates.
   wrist.quaternion.copy(base.get(wrist));
   if(direction){
    rotateTo(wrist,gripAxes[i].clone().applyQuaternion(wrist.getWorldQuaternion(new THREE.Quaternion())),V(direction));
    const rest=base.get(wrist),angle=rest.angleTo(wrist.quaternion);
    if(angle>.28)wrist.quaternion.copy(rest.clone().slerp(wrist.quaternion,.28/angle));
   }
   root.updateMatrixWorld(true);
   const shoulder=world(chain[0]),elbow=world(chain[1]),hand=world(wrist),offset=world(palm).sub(hand),goal=target.clone().sub(offset);
   const upper=shoulder.distanceTo(elbow),lower=elbow.distanceTo(hand),axis=goal.clone().sub(shoulder),distance=THREE.MathUtils.clamp(axis.length(),Math.abs(upper-lower)+.001,upper+lower-.005);axis.normalize();
   const along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));
   const bend=V([i===0?.7:-.7,-1,-.25]).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));bend.addScaledVector(axis,-bend.dot(axis)).normalize();
   const desiredElbow=shoulder.clone().addScaledVector(axis,along).addScaledVector(bend,height);
   rotateTo(chain[0],elbow.clone().sub(shoulder),desiredElbow.sub(shoulder));root.updateMatrixWorld(true);
   const elbowNow=world(chain[1]);rotateTo(chain[1],world(wrist).sub(elbowNow),goal.clone().sub(elbowNow));
  }
  root.updateMatrixWorld(true);
 }
 function pose(role,phase=0,targets=[],direction=null){
  for(const [b,q] of base)b.quaternion.copy(q);
  const [lean,turn,reach]=sampleRole(actions.tracks[role]??actions.tracks.brace,clamp(phase));
  const rotateWorld=(bone,axis,angle)=>{if(!bone)return;const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());bone.quaternion.premultiply(parent.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle)).multiply(parent));};
  if(role==='tow'&&!tracker)rotateWorld(spine,new THREE.Vector3(0,1,0),-.18);
  const side=new THREE.Vector3(1,0,0).applyQuaternion(root.getWorldQuaternion(new THREE.Quaternion()));
  rotateWorld(spine,side,tracker?lean*.25:lean*.5);
  rotateWorld(head,new THREE.Vector3(0,1,0),tracker?turn*.28:turn*.6);
  const defaults=[[.25,1.2+reach*.2,.14+reach*.18],[-.25,1.2+reach*.2,.14+reach*.18]];
  if(tracker&&role==='tow'){
   // Two metres of travel, easing to a planted stop. Gait follows distance,
   // not a fixed oscillation that continues as the worker stops.
   const progress=clamp(phase*2),travel=2*smooth(progress);
   const envelope=Math.sin(Math.PI*progress),stride=Math.sin(travel*Math.PI/.58)*.22*envelope;
   for(const [name,sign] of [['tripo1_Left_Limb_0',1],['tripo0_Left_Limb_0',-1]]){
    const hip=bones.get(name);rotateWorld(hip,side,sign*stride);
    const knee=hip?.children.find(b=>b.isBone);rotateWorld(knee,side,-Math.max(0,sign*stride)*.65);
   }
  }
  root.updateMatrixWorld(true);
  // QMSH-23 has a rope skinned across the torso and hands. Keep its authored
  // hand pose: forcing the boatman's high grip stretches that rope into spikes.
  // The cinematic towline follows these live palm sockets in scene.js.
  if(tracker){gripTargets=[];return;}
  gripTargets=targets.map(V);for(let i=0;i<chains.length;i++)aim(chains[i],targets[i]?V(targets[i]):root.localToWorld(V(defaults[i])),i,direction);
 }
 return {root,pose,hand:i=>sockets[i]?.getWorldPosition(new THREE.Vector3()),getState:()=>({id,sourceAsset:visual.asset.id,position:root.getWorldPosition(new THREE.Vector3()).toArray(),armChains:chains.length,hands:sockets.map(s=>s.getWorldPosition(new THREE.Vector3()).toArray()),wristAngles:chains.map(c=>base.get(c[2]).angleTo(c[2].quaternion)),gripErrors:gripTargets.map((t,i)=>sockets[i].getWorldPosition(new THREE.Vector3()).distanceTo(t))})};
}
