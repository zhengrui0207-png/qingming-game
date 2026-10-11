import {travelHeading} from './life-paths.js';
import * as THREE from 'three';
import {initializeCrowd,advanceCrowd,sweepPeople,stopAtPeople,crowdLayer} from './crowd-motion.js';
import {avoidCargo} from './hongqiao/cinema/traffic.js';
import {createNpcCrowd} from './npc-assets.js';
import {makeRoute,sampleRoute,streetHeight,ferryPose} from './life-paths.js';
import {selectHistoryResidents} from './people-history.js';

let viewCamera;const projected=new THREE.Vector3();
function inView(p){if(!viewCamera)return true;projected.set(p.x,(p.y??.94)+1,p.z).project(viewCamera);return projected.z>-1&&projected.z<1&&Math.abs(projected.x)<1.6&&Math.abs(projected.y)<1.8;}
// Each moving part is drawn once for the whole population. Animation remains
// articulated, without thousands of per-person draw calls.
function pool(scene,source,count,{people=false,coat=false}={}){
 const root=source.clone(true);root.position.set(0,0,0);root.rotation.set(0,0,0);root.scale.setScalar(1);
 const parts={},records=[];let cursor=0,lastCount=0;
 root.traverse(o=>{if(o.name)parts[o.name]=o;if(!o.isMesh)return;
  // The traveller's pack belongs to the player, not every resident.
  if(people&&/body_(cloth$|robe_brown|wood_light)/.test(o.name)){o.visible=false;return;}
  const mat=o.material.clone();mat.onBeforeCompile=o.material.onBeforeCompile;mat.customProgramCacheKey=o.material.customProgramCacheKey;mat.roughness=Math.max(.65,mat.roughness);const mesh=new THREE.InstancedMesh(o.geometry,mat,count);mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);const record={node:o,mesh};records.push(record);
  const c=new THREE.Color();for(let i=0;i<count;i++){
   let color='#ffffff';
   if(people&&mat.name.includes('indigo'))color=['#647d8d','#b0a48d','#8b9291','#c1baa6','#a88065','#7d8b73','#8191a8','#b7997c'][i%8];
   if(people&&mat.name.includes('skin'))color=['#dfb48c','#bf9878','#d4a67e','#b18e71'][i%4];
   if(coat&&/robe_brown|wood_dark/.test(mat.name))color=['#a68164','#706354','#c8b59a','#806253'][i%4];
   mesh.setColorAt(i,c.set(color));
  }record.colors=mesh.instanceColor.array.slice();
 });
 const base=new Map();root.traverse(o=>base.set(o,{q:o.quaternion.clone(),p:o.position.clone()}));
 const rotate=(name,x=0,y=0,z=0)=>{const o=parts[name]||Object.values(parts).find(p=>p.name.endsWith('__'+name));if(o){o.rotation.x+=x;o.rotation.y+=y;o.rotation.z+=z;}};
 return {
  put(i,p,animate){if(!inView(p))return;const slot=cursor++;root.traverse(o=>{const b=base.get(o);o.quaternion.copy(b.q);o.position.copy(b.p)});root.position.set(p.x,p.y??.94,p.z);root.rotation.set(p.pitch||0,p.angle||0,p.roll||0);root.scale.setScalar(p.scale||1);animate?.(rotate,parts,root);root.updateMatrixWorld(true);for(const r of records){r.mesh.setMatrixAt(slot,r.node.matrixWorld);const colors=r.mesh.instanceColor.array;for(let k=0;k<3;k++)colors[slot*3+k]=r.colors[i*3+k];}if(people&&parts.elbow_R)return new THREE.Vector3(.01,-.26,.02).applyMatrix4(parts.elbow_R.matrixWorld);},
  done(){lastCount=cursor;records.forEach(r=>{r.mesh.count=cursor;r.mesh.instanceMatrix.needsUpdate=true;r.mesh.instanceColor.needsUpdate=true;});cursor=0;},get count(){return lastCount;},
  hide(i){const m=new THREE.Matrix4().makeScale(0,0,0);records.forEach(r=>r.mesh.setMatrixAt(i,m));},
  meshes:records.length
 };
}
function turn(a,b,dt){return a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*Math.min(1,dt*5);}
export function createStreetLife(scene,personSource,assets,world,camera,npcAssets,horses,oxen){
 viewCamera=camera;
 const humanSource=personSource.clone(true);
 // Make neutral white cloth materials before applying per-person dyed colours.
 humanSource.traverse(o=>{if(o.isMesh){const original=o.material;o.material=original.clone();o.material.onBeforeCompile=original.onBeforeCompile;o.material.customProgramCacheKey=original.customProgramCacheKey;if(/indigo|skin/.test(o.material.name))o.material.color.set('#e8dfcd');}});
 const people=[];let seed=208;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const mainRoute=makeRoute([[-1.7,65],[-2,21],[-1.65,16],[-1.65,-17],[-2.2,-52],[-1,-62],[1.3,-64],[2.1,-59],[1.6,-17],[1.7,17],[2.3,56],[1.4,66]]);
 const southRoute=makeRoute([[-3.5,23],[-3.8,57],[-2.8,67],[3.9,67],[4.1,48],[3.4,22]]);
 const northRoute=makeRoute([[-3.5,-22],[-3.7,-47],[-2.5,-53],[3.2,-53],[3.8,-35],[3.4,-22]]);
 for(let i=0;i<84;i++){
  const route=i<43?mainRoute:i<68?southRoute:northRoute;
  people.push({role:i%9===0?'挑担':i%8===0?'携书行人':'行人',route,distance:route.length*(i*.6180339887%1),speed:.57+rand()*.52,phase:rand()*20,scale:i%13===0?.88:1.02+rand()*.15,angle:0,hat:i%4===0});
 }
 const bridgeRoute=makeRoute([[-2.45,21],[-2.4,-20],[-1.5,-22],[2.5,-21],[2.4,20],[1.2,22]]);
 for(let i=0;i<82;i++)people.push({role:i%7===0?'挑担':'行人',route:bridgeRoute,distance:bridgeRoute.length*i/82,speed:.44+(i%5)*.06,phase:i*2.4,scale:1.02+(i%6)*.025,angle:0,hat:i%5===0});
 for(const s of world.shops.filter(s=>s.featured)){
  people.push({role:{tea:'点茶',wine:'斟酒',food:'蒸食',cloth:'理布',grain:'量米',herb:'配药',paper:'看书'}[s.type],shop:s,x:s.merchant.x,z:s.merchant.z,angle:s.yaw,phase:rand()*20,scale:.95+rand()*.1});
  if(s.id%2===0)people.push({role:s.type==='tea'?'饮茶':'看货',x:s.front.x,z:s.front.z,angle:s.yaw+Math.PI,phase:rand()*20,scale:.95});
 }
 for(const [x,z] of [[-4.4,29],[4.3,38],[-4.4,-28],[3.3,-46]])for(let i=0;i<2;i++)people.push({role:'交谈',x:x+i*1.05,z:z+i*.35,angle:i?4.3:1.2,phase:rand()*20,scale:.98});
 // Road traffic stays in the broad approach, not on the narrow pedestrian bridge.
 const trafficRoutes=[makeRoute([[-3.6,30],[-3.6,62],[-1.5,67],[3.4,64],[3.4,31],[1,26]]),makeRoute([[-3.2,-24],[-3.2,-45],[-1,-50],[3,-46],[3,-24],[0,-21]])];
 const traffic=Array.from({length:6},(_,i)=>({kind:i<2?'牛车':i<4?'骑马':'人力车',route:trafficRoutes[i%2],distance:(i*.23+.1)*trafficRoutes[i%2].length,speed:i<2?.52:i<4?1.15:.67,angle:0,phase:i*2}));
 const drivers=traffic.map((v,i)=>{const p={role:v.kind==='牛车'?'赶牛人':v.kind==='骑马'?'骑马人':'车夫',x:0,z:30,angle:0,phase:i*2,scale:.98,hat:i%2===0};people.push(p);return p;});
 // Every ferry carries a rowing boatman and seated passenger.
 const ferries=Array.from({length:4},(_,i)=>({...ferryPose(0,i),index:i}));
 const boatmen=ferries.map((f,i)=>{const p={role:'船夫',x:f.x,z:f.z,angle:f.angle,phase:i,scale:.93};people.push(p);return p;});
 const passengers=ferries.map((f,i)=>{const p={role:'乘客',x:f.x,z:f.z,angle:f.angle,phase:i,scale:.9};people.push(p);return p;});
 // Keep stable street IDs; thin the mechanically repeated bridge population.
 const map=new Map(npcAssets?.mapping.map(a=>[a.id,a.assetId])??[]);
 people.forEach((p,i)=>{p.assetId=map.get(`street-${String(i).padStart(3,'0')}`);if(p.route)p.active=i<30||(i>=43&&i<65)||(i>=68&&i<82)||(i>=84&&i<110)||p.assetId==='QMSH-13';});
 people.forEach(p=>{if(p.shop?.authoredMerchant)p.active=false;});
 let getExternal=()=>[];
 initializeCrowd(people,world,rand,traffic.map(v=>({...sampleRoute(v.route,v.distance),y:.94,radius:1.1})));
 const historyResidents=selectHistoryResidents(people,new Set((npcAssets?.catalog??[]).filter(a=>!npcAssets.failures.some(f=>f.assetId===a.id)).map(a=>a.id)));
 const crowd=pool(scene,humanSource,people.length,{people:true});
 const matchedCrowd=npcAssets?createNpcCrowd(scene,people,npcAssets,camera):null;
 const ox=pool(scene,assets.getObjectByName('ox'),2,{coat:true}),horse=pool(scene,assets.getObjectByName('horse'),2,{coat:true}),carts=pool(scene,assets.getObjectByName('cart'),4),ferry=pool(scene,assets.getObjectByName('ferry'),4);
 const accessoryKinds=['hat','shoulder_load','pot','bowl','book','stick'];
 const hasAccessory=(p,k)=>k==='hat'?p.hat:k==='shoulder_load'?p.role==='挑担':k==='pot'?['点茶','斟酒'].includes(p.role):k==='bowl'?p.role==='饮茶':k==='book'?['看书','携书行人'].includes(p.role):p.role==='赶牛人';
 const accessorySlots=accessoryKinds.map(k=>{let n=0;return people.map(p=>hasAccessory(p,k)?n++:-1)});
 const extraPools=accessoryKinds.map((k,j)=>pool(scene,assets.getObjectByName(k),Math.max(1,...accessorySlots[j].map(i=>i+1))));
 const [hats,load,pots,bowls,books,sticks]=extraPools;
 const dynObstacles=[];const staticObstacles=world.boatObstacles.map(o=>({...o}));
 // Billowing cloth on independent hanging signs is handled by the storefront module.
 let lastTime=0;
 function update(t,dt,playerBoat){
  lastTime=t;
  for(let i=0;i<traffic.length;i++){
   const v=traffic[i],from=sampleRoute(v.route,v.distance),next=sampleRoute(v.route,v.distance+dt*v.speed);const bodies=[...getExternal(),...people.filter(p=>p.active!==false&&!['乘客','船夫','骑马人','赶牛人','车夫'].includes(p.role))];const fraction=sweepPeople({...from,y:.94,layer:'ground'},next,bodies,v.kind==='骑马'?1.05:.9);v.moving=fraction>.01;v.distance+=dt*v.speed*fraction;const p=sampleRoute(v.route,v.distance);v.angle=travelHeading(from,p,Number.isFinite(v.x)?v.angle:p.angle);Object.assign(v,{x:p.x,z:p.z});const a=v.angle,s=Math.sin(a),c=Math.cos(a),phase=t*(v.kind==='骑马'?6:4)+v.phase;
   let saddle=null;
   if(v.kind==='骑马'&&horses)saddle=horses.update(i-2,{...p,angle:a,y:.94},dt,v.moving,v.speed);
   if(v.kind==='牛车'&&oxen)oxen.update(i,{...p,angle:a,y:.94},dt,v.moving,v.speed);
   if(v.kind==='牛车'&&!oxen||v.kind==='骑马'&&!horses){
    const target=v.kind==='牛车'?ox:horse,idx=v.kind==='牛车'?i:i-2;
    target.put(idx,{...p,angle:a,y:.94+Math.abs(Math.sin(phase))*.025},r=>{for(let leg=0;leg<4;leg++)r('leg'+leg,Math.sin(phase+(leg===0||leg===3?0:Math.PI))*.35);r('tail',.04*Math.sin(t),0,.15*Math.sin(t*1.8));});
   }
   if(v.kind!=='骑马'){
    const cartIndex=v.kind==='牛车'?i:i-2;const behind=v.kind==='牛车'?2.55:2.1;
    carts.put(cartIndex,{x:p.x-s*behind,z:p.z-c*behind,y:.94,angle:a},r=>{r('wheel0',v.distance/.57);r('wheel1',v.distance/.57);});
   }
   const d=drivers[i],previousDriver={x:d.x,z:d.z};d.x=p.x+(v.kind==='牛车'?c*1.0:0);d.z=p.z-(v.kind==='牛车'?s*1.0:0);d.y=v.kind==='骑马'?(saddle?.y??2.56):.94;if(saddle){d.x=saddle.x;d.z=saddle.z;}d.angle=d.hasPose?travelHeading(previousDriver,d,a):a;d.travelSpeed=d.hasPose&&dt>0?Math.hypot(d.x-previousDriver.x,d.z-previousDriver.z)/dt:0;d.hasPose=true;d.walking=v.kind!=='骑马'&&d.travelSpeed>.025;
  }
  dynObstacles.length=0;
  ferries.forEach((f,i)=>{
   // Pause briefly when the player's skiff obstructs a ferry's bow, then resume.
   f.clock??=0;const proposed=ferryPose(f.clock+dt,i);const dx=playerBoat.x-proposed.x,dz=playerBoat.z-proposed.z,ahead=dx*Math.sin(proposed.angle)+dz*Math.cos(proposed.angle),across=dx*Math.cos(proposed.angle)-dz*Math.sin(proposed.angle);const approach=ahead>0&&ahead<7&&Math.abs(across)<2.5;
   if(!approach)f.clock+=dt;Object.assign(f,avoidCargo(ferryPose(f.clock,i),world.hongqiaoHull));if(approach)f.speed=0;
   const bob=.025*Math.sin(t*1.8+i),pitch=.011*Math.sin(t+i);ferry.put(i,{...f,y:bob,pitch},r=>r('oar',.16*Math.sin(t*3+i),.2*Math.cos(t*3+i),.24*Math.sin(t*3+i)));
   const s=Math.sin(f.angle),c=Math.cos(f.angle);Object.assign(boatmen[i],{x:f.x-s*2.65,z:f.z-c*2.65,y:.42+bob,angle:f.angle});Object.assign(passengers[i],{x:f.x+s*.4,z:f.z+c*.4,y:.6+bob,angle:f.angle+Math.PI});
   dynObstacles.push({x:f.x,z:f.z,w:Math.abs(s)*8+Math.abs(c)*2.65,d:Math.abs(c)*8+Math.abs(s)*2.65});
  });
  world.boatObstacles=[...staticObstacles,...dynObstacles];
  advanceCrowd(people,world,dt,t,[...getExternal(),...traffic.flatMap(v=>[{...v,y:.94,layer:'ground',radius:v.kind==='骑马'?1.1:.85},...(v.kind==='骑马'?[]:[{x:v.x-Math.sin(v.angle)*2.4,z:v.z-Math.cos(v.angle)*2.4,y:.94,layer:'ground',radius:1.15}])])],rand);
  people.forEach((p,i)=>{
   if(p.active===false){matchedCrowd?.hide(i);return;}
   let walking=!!p.walking;
   if(p.route){
    walking=!!p.walking;
   }
   const phase=t*(walking?4.5*Math.max(.4,p.travelSpeed??p.speed??1):1.8)+p.phase,breathe=Math.sin(t*2+p.phase)*.012;
   const y=(p.y??.94)+(walking?Math.abs(Math.sin(phase))*.025:breathe);
   const actor={x:p.x,y,z:p.z,angle:p.angle,scale:p.scale};
   const replaced=matchedCrowd?.put(i,actor,walking,t,dt);
   const rightHand=replaced?null:crowd.put(i,actor,r=>{
    r('head',Math.sin(t*1.1+p.phase)*.035,Math.sin(t*.58+p.phase)*.16);
    r('body',0,Math.sin(t*.75+p.phase)*.025,.012*Math.sin(t*1.7+p.phase));
    if(p.role==='骑马人'||p.role==='乘客'){r('leg_L',-1.12,0,-.13);r('leg_R',-1.12,0,.13);r('arm_L',-.5);r('arm_R',-.5+.05*Math.sin(phase));r('elbow_L',-.55);r('elbow_R',-.55);r('knee_L',.95);r('knee_R',.95);}
    else if(walking){r('knee_L',Math.max(0,Math.sin(phase))*.4);r('knee_R',Math.max(0,-Math.sin(phase))*.4);r('elbow_L',-.13);r('elbow_R',-.13);r('leg_L',Math.sin(phase)*.46);r('leg_R',-Math.sin(phase)*.46);r('arm_L',-Math.sin(phase)*.42);r('arm_R',Math.sin(phase)*.42);}
    else {r('arm_L',-.1+.07*Math.sin(phase),0,-.07);r('arm_R',-.12+.08*Math.sin(phase+1),0,.07);}
    if(p.role==='挑担'){r('arm_L',-.8,0,-.22);r('arm_R',-.6,0,.22);}
    if(['点茶','斟酒','饮茶','看书','看货','交谈','理布','量米','配药','蒸食'].includes(p.role)){
     r('arm_R',-.34+.17*Math.sin(phase),.12,.1);r('elbow_R',-.65+.2*Math.sin(phase));r('arm_L',-.23+.11*Math.sin(phase+.8));r('elbow_L',-.5);
     if(p.role==='饮茶')r('arm_R',-.42+.35*Math.sin(phase*.8));
    }
    if(p.role==='船夫'){r('arm_L',-.65+.55*Math.sin(t*3+i));r('arm_R',-.65+.55*Math.sin(t*3+i));r('body',.08*Math.sin(t*3+i));}
    if(p.role==='车夫'){r('arm_L',.48);r('arm_R',.48);r('body',.10);}
    if(p.role==='赶牛人')r('arm_R',-.6+.1*Math.sin(t*3));
   });

   // Source GLBs already carry their clothes, hats and occupation props.
   if(replaced)return;
   const scale=p.scale||1,s=Math.sin(p.angle),c=Math.cos(p.angle);
   function held(x,h,z){return {x:p.x+(x*c+z*s)*scale,y:y+h*scale,z:p.z+(-x*s+z*c)*scale,angle:p.angle,scale};}
   if(p.hat)hats.put(accessorySlots[0][i],held(0,1.91,0));
   if(p.role==='挑担')load.put(accessorySlots[1][i],held(0,1.38,.02),r=>r('body',0,0,.04*Math.sin(phase)));
   if(['点茶','斟酒'].includes(p.role))pots.put(accessorySlots[2][i],rightHand?{x:rightHand.x,y:rightHand.y,z:rightHand.z,angle:p.angle,scale}:held(.39,1.14,.35),r=>r('body',0,0,.25+.15*Math.sin(phase)));
   if(p.role==='饮茶')bowls.put(accessorySlots[3][i],rightHand?{x:rightHand.x,y:rightHand.y+.03,z:rightHand.z,angle:p.angle,scale}:held(.28,1.28,.3));
   if(['看书','携书行人'].includes(p.role))books.put(accessorySlots[4][i],held(-.28,1.08,.28));
   if(p.role==='赶牛人')sticks.put(accessorySlots[5][i],held(.4,1.04,.35),r=>r('body',-.8));
  });
  [crowd,ox,horse,carts,ferry,...extraPools].forEach(p=>p.done());
  matchedCrowd?.done();
 }
 return {getHistoryResidents:()=>historyResidents,setCinematicFocus:next=>matchedCrowd?.setCinematicFocus(next),setBridgeAlarm:next=>matchedCrowd?.setBridgeAlarm(next),setExternalBodies:fn=>{getExternal=fn;},resolvePlayer:(from,to)=>stopAtPeople(from,to,[...people.filter(p=>p.active!==false&&!['乘客','船夫','骑马人'].includes(p.role)),...getExternal().filter(p=>p.id!=='player_scholar'),...traffic.map(v=>({...v,y:.94,radius:1.1}))]),setViewCamera:next=>{viewCamera=next;matchedCrowd?.setCamera(next);},update,ferries,snapshot:()=>({time:lastTime,people,traffic,ferries,replacements:matchedCrowd?.snapshot()}),getState:()=>({oxen:oxen?.getState(),horses:horses?.getState(),activeWalkers:people.filter(p=>p.route&&p.active!==false).length,movingWalkers:people.filter(p=>p.route&&p.walking&&p.active!==false).length,time:lastTime,people:people.length,visiblePeople:crowd.count+(matchedCrowd?.getState().visible??0),npcAssets:matchedCrowd?.getState(),roles:people.reduce((a,p)=>(a[p.role]=(a[p.role]||0)+1,a),{}),vehicles:traffic.map(v=>({kind:v.kind,x:v.x,z:v.z})),ferries:ferries.map(f=>({x:f.x,z:f.z,angle:f.angle,speed:f.speed})),samplePeople:people.slice(0,5).map(p=>({x:p.x,z:p.z,angle:p.angle,role:p.role})),instanced:!matchedCrowd,renderMode:matchedCrowd?"skinned-full/skinned-lod":"instanced"})};
}
