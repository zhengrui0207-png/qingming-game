import * as THREE from 'three';
import {createPerformer} from './actors.js';
import {clamp,smooth,lerp,PLACEMENT} from './timeline.js';
const V=a=>new THREE.Vector3(...a);
let wovenTexture;function ropeTexture(){if(wovenTexture)return wovenTexture;const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#dfd0af';x.fillRect(0,0,64,64);x.strokeStyle='#9b805b';x.lineWidth=3;for(let i=-64;i<128;i+=12){x.beginPath();x.moveTo(i,0);x.lineTo(i+64,64);x.stroke();}wovenTexture=new THREE.CanvasTexture(c);wovenTexture.colorSpace=THREE.SRGBColorSpace;wovenTexture.wrapS=wovenTexture.wrapT=THREE.RepeatWrapping;wovenTexture.repeat.set(2,1);return wovenTexture;}
function strand(name,radius,color,segments=24){
 const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(radius,radius,1,6),new THREE.MeshStandardMaterial({color,roughness:.93,map:name.includes('pole')||name.includes('oar')?null:ropeTexture()}),segments);mesh.name=name;mesh.frustumCulled=false;mesh.castShadow=true;
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),scale=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 return {mesh,points:[],set(points){this.points=points.map(p=>p.toArray());for(let i=0;i<segments;i++){const a=points[i],b=points[i+1],d=b.clone().sub(a);q.setFromUnitVectors(up,d.clone().normalize());scale.set(1,Math.max(.001,d.length()),1);m.compose(a.clone().add(b).multiplyScalar(.5),q,scale);mesh.setMatrixAt(i,m);}mesh.instanceMatrix.needsUpdate=true;}};
}
function curve(a,b,sag=0,bend=0){return Array.from({length:25},(_,i)=>{const t=i/24;return a.clone().lerp(b,t).add(new THREE.Vector3(0,-Math.sin(t*Math.PI)*sag,Math.sin(t*Math.PI)*bend));});}
export async function createCinemaScene({scene,city,loader,npcAssets,world,baseURL}){
 const dir=baseURL+'assets/hongqiao/cinema/';
 const [gltf,mask,bridgeTriangles]=await Promise.all([loader.loadAsync(dir+'ship-hq.glb'),fetch(dir+'world-mask.json').then(r=>r.json()),fetch(dir+'bridge-triangles.json').then(r=>r.json())]);
 let removed=0;const removedMeshes=[];
 for(const entry of mask.meshes){const mesh=city.getObjectByName(entry.mesh);if(!mesh?.isMesh)throw Error('Ship subtraction node missing: '+entry.mesh);const geometry=mesh.geometry.clone(),index=geometry.index?.array;if(!index||index.length/3!==entry.triangleCount)throw Error('Ship subtraction source changed: '+entry.mesh);const fingerprint=new Float32Array(entry.remove.length*9),positions=geometry.attributes.position;let at=0;for(const tri of entry.remove)for(let j=0;j<3;j++){const v=index[tri*3+j];fingerprint[at++]=positions.getX(v);fingerprint[at++]=positions.getY(v);fingerprint[at++]=positions.getZ(v);}const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',fingerprint.buffer))].map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==entry.positionSha256)throw Error('Ship subtraction geometry changed: '+entry.mesh);const remove=new Set(entry.remove),next=[];for(let i=0;i<index.length;i+=3)if(!remove.has(i/3))next.push(index[i],index[i+1],index[i+2]);geometry.setIndex(next);geometry.computeBoundingSphere();mesh.geometry=geometry;removed+=remove.size;removedMeshes.push(entry.mesh);}
 if(removed!==mask.removedTriangles)throw Error('Incomplete original ship subtraction');
 const root=new THREE.Group();root.name='HQ cinematic scene';scene.add(root);
 const ship=new THREE.Group();ship.name='ship_hq_runtime';root.add(ship);ship.add(gltf.scene);
 const mast=gltf.scene.getObjectByName('mast_hq_pivot');if(!mast)throw Error('No animated mast pivot');
 gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const castRoot=new THREE.Group();castRoot.name='HQ bridge and bank performers';root.add(castRoot);
 const performers={bracer:createPerformer(npcAssets,'actor_intro_bracer',ship,[-2.6,2.58,0],-Math.PI/2),steerer:createPerformer(npcAssets,'actor_intro_steerer',ship,[-8,.57,3.5],-Math.PI/2),receiverA:createPerformer(npcAssets,'actor_intro_receiver_a',ship,[-3.2,2.58,1.0],-Math.PI/2),receiverB:createPerformer(npcAssets,'actor_intro_receiver_b',ship,[-3.2,2.58,3.1],-Math.PI/2),caller:createPerformer(npcAssets,'actor_intro_caller',castRoot,[3.3,8.21,-1.4],Math.PI/2),thrower:createPerformer(npcAssets,'actor_intro_thrower',castRoot,[3.3,8.21,.6],Math.PI/2),towA:createPerformer(npcAssets,'actor_intro_tow_a',castRoot,[8,.94,19],-Math.PI/2),towB:createPerformer(npcAssets,'actor_intro_tow_b',castRoot,[10.4,.94,19],-Math.PI/2)};
 const steering=strand('prop_intro_steering_oar',.055,'#856344'),lowering=strand('prop_intro_mast_tackle',.018,'#57422b');root.add(steering.mesh,lowering.mesh);
 const coils=[0,1].map(i=>{const m=new THREE.Mesh(new THREE.TorusGeometry(.24,.04,6,36),new THREE.MeshStandardMaterial({color:'#bca67f',roughness:1,map:ropeTexture()}));m.name='prop_intro_safety_coil_'+i;root.add(m);return m;});
 const heel=new THREE.Mesh(new THREE.BoxGeometry(.55,.4,.55),new THREE.MeshStandardMaterial({color:'#776041',roughness:1}));heel.name='mast_hq_heel';heel.position.set(-5,2.66,0);ship.add(heel);
 for(const x of [-3.2,.8]){const rack=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,1,8),new THREE.MeshStandardMaterial({color:'#735638',roughness:1}));rack.name='prop_intro_pole_rack';rack.position.set(x,3.05,-.25);ship.add(rack);}
 const pole=strand('prop_intro_bracing_pole',.042,'#99815a'),ropes=[strand('prop_intro_safety_rope_a',.048,'#e6c286'),strand('prop_intro_safety_rope_b',.048,'#f3d6a0')],tow=strand('prop_intro_towline',.018,'#a18b65');for(const s of [pole,...ropes,tow])root.add(s.mesh);
 // Source cloth is a separate decorative state. No original instance/permission ID is registered.
 const cloth=new THREE.Mesh(new THREE.BoxGeometry(2.6,.09,1.6),new THREE.MeshStandardMaterial({color:'#998065',roughness:1}));cloth.name='prop_ending_cargo_cover';cloth.position.set(2.8,2.75,-1.2);ship.add(cloth);
 for(const [x,z,c] of [[-.7,-.3,'#756c5e'],[.6,.4,'#b8a489']]){const patch=new THREE.Mesh(new THREE.BoxGeometry(.55,.02,.5),new THREE.MeshStandardMaterial({color:c,roughness:1}));patch.position.set(x,.06,z);cloth.add(patch);}
 // Find actual timber contact on the bridge surface, keeping both wood and pole endpoint explicit.
 const bridgeGeometry=new THREE.BufferGeometry();bridgeGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bridgeTriangles.flat(2),3));bridgeGeometry.computeVertexNormals();const bridgeMesh=new THREE.Mesh(bridgeGeometry,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));bridgeMesh.updateMatrixWorld();
 const contactRay=new THREE.Raycaster(new THREE.Vector3(10,7.1,0),new THREE.Vector3(-1,0,0));const hit=contactRay.intersectObject(bridgeMesh)[0];if(!hit)throw Error('Bracing pole contact has no real bridge timber');const contact=hit.point.clone();contact.x+=.078;
 const zhou=scene.getObjectByName('npc_hq_zhou'),zhouBones=[];zhou?.traverse(o=>{if(o.isBone&&['tripo0_Right_Limb_0','tripo0_Right_Limb_1'].includes(o.name))zhouBones.push(o);});let zhouRest=null,zhouLabelRest=null;const zhouLabel=zhou?.children.find(o=>o.isSprite);
 let pose={},lastKind='waiting',originalObstacle={...world.boatObstacles[0]};
 function apply(next,kind='waiting'){
  pose=next;lastKind=kind;ship.position.set(next.shipX,0,0);ship.rotation.y=next.shipYaw??0;mast.rotation.set(0,0,-next.mastAngle);cloth.visible=!!next.cloth;castRoot.visible=kind==='intro';
  const t=next.time??30,intro=kind==='intro',brace=next.brace??0;
  if(intro&&t>=27){if(!zhouRest){zhouRest=zhouBones.map(b=>b.quaternion.clone());zhouLabelRest=zhouLabel?.visible;}if(zhouLabel)zhouLabel.visible=true;zhouBones.forEach((b,i)=>{b.quaternion.copy(zhouRest[i]);b.rotateZ((i===0?-.42:-.5)*smooth((t-27)/.8)+ (i===1?.045*Math.sin((t-27)*2.2)*smooth((t-27)/.8):0));});}else if(zhouRest){zhouBones.forEach((b,i)=>b.quaternion.copy(zhouRest[i]));zhouRest=null;if(zhouLabel)zhouLabel.visible=zhouLabelRest;}
  const bracer=performers.bracer,bracerPos=bracer.root.getWorldPosition(new THREE.Vector3());
  // Rigid pole: approach the timber with the ship; contact begins at the stop, never stretch it.
  const holdGrip=V([10.3-2.6-.25,3.73,0]),poleDirection=contact.clone().sub(holdGrip).normalize(),poleLength=contact.distanceTo(holdGrip)+.4;
  const heldA=holdGrip.clone().addScaledVector(poleDirection,-.4).add(V([next.shipX-10.3,0,0]));
  
  // The pole remains planted; avoid high-frequency contact jitter.
  const storedA=V([next.shipX-3.4,3.55,-.25]),storedDirection=V([1,0,0]);
  const a=storedA.clone().lerp(heldA,brace),direction=storedDirection.clone().lerp(poleDirection,brace).normalize(),b=a.clone().addScaledVector(direction,poleLength);
  pole.set(curve(a,b));pole.mesh.visible=true;
  const hands=[a.clone().addScaledVector(direction,lerp(.55,.38,brace)).toArray(),a.clone().addScaledVector(direction,lerp(.95,.68,brace)).toArray()];
  bracer.pose('brace',intro?clamp((t-3)/24):1,brace>.4?hands:[],brace>.4?direction.toArray():null);
  const steeringPhase=intro?smooth((t-5)/3):1;const sp=performers.steerer.root.getWorldPosition(new THREE.Vector3());
  const oa=sp.clone().add(V([.05,1.3,.05])),ob=sp.clone().add(V([-2.0+.75*steeringPhase,-.4,1.2]));const od=ob.clone().sub(oa).normalize();
  performers.steerer.pose('steer',steeringPhase,[oa.toArray(),oa.clone().addScaledVector(od,.26).toArray()],od.toArray());steering.set(curve(performers.steerer.hand(0).clone().addScaledVector(od,-.18),ob));
  for(const [i,key] of ['receiverA','receiverB'].entries()){const worker=performers[key],wp=worker.root.getWorldPosition(new THREE.Vector3());const hands=t>=21?[wp.clone().add(V([-.18,1.26-.08*smooth((t-21)/4),-.25])).toArray()]:[];worker.pose(t>=21?'lower':'receive',t>=21?clamp((t-21)/4):clamp((t-17)/3),hands);}
  ship.updateMatrixWorld(true);const tie=mast.localToWorld(V([0,4.8,0])),cleat=V([next.shipX+2,3.25,.3]),hand=performers.receiverA.hand(0);
  lowering.set(Array.from({length:25},(_,i)=>i<=12?tie.clone().lerp(cleat,i/12):cleat.clone().lerp(hand,(i-12)/12)));lowering.mesh.visible=true;
  const leadX=intro&&next.flashback?lerp(10,8,smooth((t-10)/2)):8;
  performers.towA.root.position.x=leadX;performers.towB.root.position.x=leadX+1.7;
  const towPhase=next.flashback?(t-10)/4:t<20?.75:1,towSlack=next.towSlack??1;
  for(const worker of [performers.towA,performers.towB]){
   worker.root.updateMatrixWorld(true);
   const grips=[[-.25,1.27-.10*towSlack,.36],[-.25,1.27-.10*towSlack,.04]].map(p=>worker.root.localToWorld(V(p)).toArray());
   worker.pose('tow',towPhase,grips,[-1,0,0]);
  }
  const cp=performers.caller.root.getWorldPosition(new THREE.Vector3());
  const alarm=clamp(t/1.2),callHands=t<17?[cp.clone().add(V([.55*alarm,1.38-.24*alarm,-.12])).toArray(),cp.clone().add(V([.16,1.58,.15])).toArray()]:[];
  performers.caller.pose(t<17?'call':'throw',t<17?(t<14?.35*alarm:clamp((t-14)/3)):clamp((t-17)/3),callHands);performers.thrower.pose(t<14?'call':'throw',t<14?.25*alarm:clamp((t-17.7)/2.3));
  for(let i=0;i<2;i++){
   const from=(i===0?performers.caller:performers.thrower).hand(0),target=(i===0?performers.receiverA:performers.receiverB).hand(1),deployment=next.ropes?.[i]?.deployed??0;
   const end=from.clone().lerp(target,deployment);end.y+=Math.sin(Math.PI*deployment)*1.2;
   ropes[i].set(curve(from,end,.18*deployment,i===0?-.13:.13));ropes[i].mesh.visible=intro&&deployment>.005;coils[i].visible=intro&&t<27;coils[i].position.copy(i===0&&t<17?performers.caller.hand(1):from);coils[i].scale.setScalar(Math.max(.3,1-deployment));
  }
  // One continuous flexible towline, with exact segment vertices at all four palms.
  const anchors=[V([next.shipX+5,1.1,2]),performers.towB.hand(1),performers.towB.hand(0),performers.towA.hand(1),performers.towA.hand(0),performers.towA.hand(0).add(V([-.4,-.18-.5*towSlack,0]))],cuts=[0,8,11,18,21,24];
  const towPoints=[];for(let section=0;section<5;section++)for(let n=cuts[section];n<cuts[section+1];n++){const u=(n-cuts[section])/(cuts[section+1]-cuts[section]);towPoints.push(anchors[section].clone().lerp(anchors[section+1],u).add(V([0,-Math.sin(u*Math.PI)*(section===0?.06+.9*towSlack:.015+.15*towSlack),0])));}towPoints.push(anchors.at(-1));
  tow.set(towPoints);tow.mesh.visible=intro&&t<27;
  // Update the existing hull proxy's pose only; do not change boat/player integration.
  if(world.boatObstacles?.length)world.boatObstacles[0]={...originalObstacle,x:next.shipX,z:0};
  root.updateMatrixWorld(true);
 }
 const updateProxy=()=>{world.hongqiaoHull={...originalObstacle,x:ship.position.x,z:ship.position.z};if(world.boatObstacles?.length)world.boatObstacles[0]={...originalObstacle,x:ship.position.x,z:ship.position.z};};
 return {updateProxy,root,ship,mast,performers,contact,bridgeMesh,bridgeTriangles,apply,
  getState:()=>({kind:lastKind,pose,shipPosition:ship.position.toArray(),shipBounds:(()=>{const b=new THREE.Box3().setFromObject(ship);return {min:b.min.toArray(),max:b.max.toArray()};})(),mastTip:mast.localToWorld(new THREE.Vector3(0,7,0)).toArray(),mastAngle:-mast.rotation.z,cloth:cloth.visible,contact:contact.toArray(),ropeCount:ropes.filter(r=>r.mesh.visible).length,ropePaths:ropes.map(r=>r.points),towPath:tow.points,towRadius:.018,poleEnds:[pole.points[0],pole.points.at(-1)],removedOriginalTriangles:removed,removedMeshes,cast:Object.values(performers).map(p=>p.getState())})};
}
