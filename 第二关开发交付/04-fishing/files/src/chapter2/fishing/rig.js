import * as THREE from 'three';
import {timings} from './controller.js';
/** Owns only these procedural resources. Replacement models keep their owner's GPU buffers. */
export function createRig(scene,{anchors,getHandPosition,getModel}={}){
 const root=new THREE.Group();root.name='chapter2/fishing/animated-rig';scene.add(root);
 const geometries=new Set(),materials=new Set(),replacements=[];let disposed=false,currentItem=null;
 const mat=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.75});materials.add(m);return m;};
 const bamboo=mat('#b39355'),red=mat('#ad4d35'),pale=mat('#eee0b4'),fishMat=mat('#788a7a'),junkMat=mat('#8b7565');
 const mesh=(g,m,parent=root)=>{geometries.add(g);const o=new THREE.Mesh(g,m);o.castShadow=true;parent.add(o);return o;};
 const pivot=new THREE.Group();root.add(pivot);const pole=new THREE.Group();pivot.add(pole);
 for(let i=0;i<4;i++){const length=.68;const s=mesh(new THREE.CylinderGeometry(.012-i*.001,.019-i*.002,length,8),bamboo,pole);s.rotation.x=Math.PI/2;s.position.z=(i+.5)*length;}
 const float=new THREE.Group();root.add(float);mesh(new THREE.CylinderGeometry(.025,.035,.18,8),pale,float);const cap=mesh(new THREE.CylinderGeometry(.024,.024,.085,8),red,float);cap.position.y=.13;
 const ripple=mesh(new THREE.TorusGeometry(.17,.008,4,28),mat('#d2e1d7'));ripple.rotation.x=Math.PI/2;
 const positions=new Float32Array(33*3),geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setDrawRange(0,33);geometries.add(geometry);
 const lineMat=new THREE.LineBasicMaterial({color:'#d9d0b3'});materials.add(lineMat);const line=new THREE.Line(geometry,lineMat);line.frustumCulled=false;root.add(line);
 const caught=new THREE.Group();root.add(caught);
 const body=mesh(new THREE.SphereGeometry(.18,12,8),fishMat,caught);body.scale.set(.45,.62,1.65);const tail=mesh(new THREE.ConeGeometry(.1,.2,3),fishMat,caught);tail.rotation.x=Math.PI/2;tail.position.z=-.34;
 const junk=mesh(new THREE.BoxGeometry(.18,.1,.22),junkMat,caught);const copper=mesh(new THREE.TorusGeometry(.08,.017,6,18),mat('#786f43'),caught);const token=mesh(new THREE.BoxGeometry(.12,.035,.28),bamboo,caught);
 const replacement=(id,parent)=>{const object=getModel?.(id);if(!object)return null;const copy=object.clone(true);parent.add(copy);replacements.push(copy);return copy;};
 const replacementRod=replacement('item_c2_basic_rod',pivot);if(replacementRod)pole.visible=false;
 // A float is a presentation part, not a new item/contract ID.
 const replacementFloat=replacement('float',float);if(replacementFloat){float.children.filter(x=>x!==replacementFloat).forEach(x=>x.visible=false);}
 let itemModel=null;const start=new THREE.Vector3(),target=new THREE.Vector3(),tip=new THREE.Vector3(),direction=new THREE.Vector3(),offset=new THREE.Vector3(),tmp=new THREE.Vector3();
 function item(id){if(id===currentItem)return;currentItem=id;if(itemModel){caught.remove(itemModel);const i=replacements.indexOf(itemModel);if(i>=0)replacements.splice(i,1);itemModel=null;}
  body.visible=tail.visible=id?.includes('fish_')??false;junk.visible=id?.includes('junk_')??false;copper.visible=id==='item_c2_rare_copper_piece';token.visible=id==='treasure_c2_marked_token';
  if(id){itemModel=replacement(id,caught);if(itemModel)for(const x of [body,tail,junk,copper,token])x.visible=false;}
 }
 function update(state,frame){if(disposed)return;root.visible=!['idle','save-error'].includes(state.phase);if(!root.visible)return;
  const spec=state.pointId==='point_c2_a'?'anchor_c2_fishing_a':'anchor_c2_fishing_b';const a=anchors.find(x=>x.id===spec);if(!a)return;
  const hand=getHandPosition?.();start.set(hand?.x??frame.actor.x,hand?.y??frame.actor.height+1.2,hand?.z??frame.actor.z+.3);target.fromArray(a.castTarget);direction.copy(target).sub(start);direction.y=0;direction.normalize();
  const t=state.phaseSeconds;let angle=.3;
  if(state.phase==='prepared')angle=.6;
  if(state.phase==='casting')angle=.95-Math.sin(Math.min(1,t/timings.casting)*Math.PI/2)*.75;
  if(state.phase==='reeling'||state.phase==='retrieving')angle=.45+Math.sin(t*6)*.035;
  pivot.position.copy(start);pivot.rotation.set(-angle,Math.atan2(direction.x,direction.z),0);pivot.updateMatrixWorld(true);tip.set(0,0,2.72).applyMatrix4(pivot.matrixWorld);
  offset.copy(target);
  if(state.phase==='prepared')offset.copy(tip).addScaledVector(direction,.2).setY(start.y-.2);
  if(state.phase==='casting'){const p=Math.min(1,t/timings.casting);offset.lerpVectors(start,target,p);offset.y+=Math.sin(p*Math.PI)*2.5;}
  if(state.phase==='waiting')offset.y+=Math.sin(t*3)*.022;
  if(state.phase==='bite')offset.y-=.16+Math.sin(t*10)*.04;
  if(state.phase==='reeling')offset.addScaledVector(direction,-Math.min(1,t/timings.reeling)*2); 
  if(state.phase==='retrieving'||state.phase==='result'){const p=state.phase==='result'?1:Math.min(1,t/timings.retrieving);offset.lerpVectors(target,start,p);offset.y+=Math.sin(p*Math.PI)*1.1;}
  float.position.copy(offset);ripple.position.set(target.x,.095,target.z);const r=.8+(t%1)*1.4;ripple.scale.setScalar(state.phase==='bite'?r*1.6:r);ripple.material.color.set(state.phase==='bite'?'#e2b45e':'#d2e1d7');ripple.visible=['waiting','bite','reeling'].includes(state.phase);
  for(let i=0;i<33;i++){const p=i/32;tmp.lerpVectors(tip,offset,p);tmp.y-=Math.sin(p*Math.PI)*.28;positions[i*3]=tmp.x;positions[i*3+1]=tmp.y;positions[i*3+2]=tmp.z;}geometry.attributes.position.needsUpdate=true;
  item(state.result?.itemId??null);caught.visible=!!state.result?.itemId&&['retrieving','result'].includes(state.phase);caught.position.copy(offset);caught.position.y-=.23;caught.rotation.y=Math.sin(t*10)*.25;
 }
 return {root,update,getState:()=>({proceduralParts:true,linePoints:33,ownedGeometries:geometries.size,ownedMaterials:materials.size,disposed,replacementModels:replacements.length}),dispose(){if(disposed)return;disposed=true;scene.remove(root);root.clear();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());replacements.length=0;}};
}
