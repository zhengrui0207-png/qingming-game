import * as THREE from 'three';
import {moveActor} from '../world.js';

export function createQuestNPCs({scene,npcPrototype,npcAssets,config,world}) {
  const root=new THREE.Group();root.name='Hongqiao quest NPCs';scene.add(root);
  const entries=config.npcs.map(npc=>{
    const anchor=config.anchors.find(a=>a.id===npc.anchorId),group=new THREE.Group();group.name=npc.id;group.position.set(...anchor.position);root.add(group);
    const visual=npcAssets?.spawn(npc.id);
    const model=visual?.root??npcPrototype.clone(true);group.add(model);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#173330dc';ctx.fillRect(0,0,256,80);ctx.fillStyle='#f5e5bd';ctx.textAlign='center';ctx.font='bold 40px serif';ctx.fillText(npc.name,128,53);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));label.position.y=2.75;label.scale.set(1.5,.47,1);group.add(label);label.visible=false;
    return {id:npc.id,npc,anchor,group,label,visual};
  });
  function reachable(actor,position,layer) {
    const {radius,maxHeightDifference}=config.interactionContract;
    if(actor.mode!=='walk'||actor.layer!==layer||Math.abs(actor.height-position.y)>maxHeightDifference||Math.hypot(actor.x-position.x,actor.z-position.z)>radius)return false;
    const reached=moveActor({...actor},position.x-actor.x,position.z-actor.z,world);
    return reached.mode==='walk'&&Math.hypot(reached.x-position.x,reached.z-position.z)<.1;
  }
  let animationTime=0;
  const position=e=>e.group.getWorldPosition(new THREE.Vector3());
  return {
    focus(actor) {return entries.filter(e=>reachable(actor,position(e),e.anchor.layer)).sort((a,b)=>position(a).distanceTo(new THREE.Vector3(actor.x,actor.height,actor.z))-position(b).distanceTo(new THREE.Vector3(actor.x,actor.height,actor.z)))[0]??null;},
    update(actor,selected,dt=0) {animationTime+=Math.min(dt,.1);for(const e of entries){e.visual?.update(animationTime,dt,{phase:entries.indexOf(e)*1.7});const p=position(e);e.label.visible=Math.hypot(actor.x-p.x,actor.z-p.z)<5||selected===e.id;}},
    position(id) {const e=entries.find(e=>e.id===id);return e?position(e):null;},
    reachable,
    getState:()=>entries.map(e=>({id:e.id,position:position(e).toArray(),asset:e.visual?.state()})),
  };
}
