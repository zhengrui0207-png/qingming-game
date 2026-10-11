import * as THREE from 'three';
// Explicit asset mapping: never select an unapproved clip by guessing its name.
export function createLocomotionActions(root, clips, mapping) {
 const mixer=new THREE.AnimationMixer(root),actions={},missing=[];
 for(const state of ['idle','walk']){
  const name=mapping.clipNames[state],clip=name&&clips.find(c=>c.name===name);
  if(!mapping.clipsAccepted||!clip){missing.push(state);continue}
  actions[state]=mixer.clipAction(clip);
 }
 // Use the imported path only when the complete approved pair exists.
 const ready=missing.length===0;let current=null;
 function update(dt,state){
  const next=ready?actions[state]:null;
  if(next!==current){
   if(next){next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();if(current)next.crossFadeFrom(current,mapping.fadeSeconds,false);else next.fadeIn(mapping.fadeSeconds)}
   else if(current){current.stop();} // swim/row returns ownership to the existing procedural poses.
   current=next;
  }
  mixer.update(dt);
  return !!next;
 }
 return {update,ready,getState:()=>({ready,missing,clipNames:mapping.clipNames,mixerTime:mixer.time,activeClip:current?.getClip().name??null,weights:Object.fromEntries(Object.entries(actions).map(([id,a])=>[id,a.getEffectiveWeight()]))})};
}
