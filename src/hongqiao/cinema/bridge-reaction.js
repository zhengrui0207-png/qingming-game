import * as THREE from 'three';
import {smooth} from './timeline.js';
// Temporary presentation pose on existing residents; route data and clocks are untouched.
export function createBridgeReaction(root){
 const bones=new Map();root.traverse(o=>{if(o.isBone)bones.set(o.name,o);});let saved=null;
 function restore(){if(!saved)return;for(const [bone,q] of saved.bones)bone.quaternion.copy(q);root.quaternion.copy(saved.rotation);saved=null;root.updateMatrixWorld(true);}
 function apply(target,time,index,baseAngle){
  if(!saved)saved={bones:[...bones.values()].map(b=>[b,b.quaternion.clone()]),rotation:root.quaternion.clone()};
  for(const [bone,q]of saved.bones)bone.quaternion.copy(q);
  const amount=smooth((time-.12*(index%5))/.9)*(1-smooth((time-25)/2)),angle=Math.atan2(target.x-root.position.x,target.z-root.position.z),delta=Math.atan2(Math.sin(angle-baseAngle),Math.cos(angle-baseAngle));
  root.rotation.y=baseAngle+delta*amount;root.updateMatrixWorld(true);
  const axis=new THREE.Vector3(1,0,0).applyQuaternion(root.quaternion);
  function rotate(bone,angle){if(!bone)return;const parent=bone.parent.getWorldQuaternion(new THREE.Quaternion());bone.quaternion.premultiply(parent.clone().invert().multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle)).multiply(parent));root.updateMatrixWorld(true);}
  rotate(bones.get('tripoSpine_1'),.12*amount);
  rotate(bones.get('tripoHead_1'),.24*amount);
  // Different reactions: point down, lift a warning hand, or draw both hands towards the chest.
  const arms=[bones.get('tripo0_Right_Limb_0'),bones.get('tripo0_Left_Limb_0')??bones.get('bone_11')];
  rotate(arms[index%2],-(index%3===0?1.1:.65)*amount);
  if(index%3===2)rotate(arms[(index+1)%2],-.48*amount);
  return {amount,lookingAt:target,angle:root.rotation.y};
 }
 return {apply,restore,get active(){return !!saved;}};
}
