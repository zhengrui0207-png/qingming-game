import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {createScholar} from '../../scholar.js';
import {moveActor} from '../../world.js';
import {createInputLocks,createKeyGate,createInteractionRegistry} from '../../interaction/core.js';
import {createSharedService,developmentSaveKey,configuration as C} from '../core/service.js';
import {defaultState} from '../../hongqiao/state.js';
import {create as createScene} from '../scene/scene.js';
import {mountReusableAssets} from '../scene/asset-mounts.js';
import {manifest,canInteract} from '../scene/physics.js';
import content from '../content/content.json' with {type:'json'};
import {create as createFishing} from '../fishing/index.js';
import {createPreviewCamera} from '../fishing/preview-camera.js';
import {create} from './index.js';
import {mountWares} from './wares.js';
const $=id=>document.getElementById(id);
async function boot(){
 if(!import.meta.env.DEV||!new URL(location.href).searchParams.has('test')||!new URL(location.href).searchParams.has('chapter2')){$('loading').textContent='独立验收页仅用于 DEV，请使用 ?test&chapter2。';return;}
 const key=developmentSaveKey({development:true,url:location.href,session:new URL(location.href).searchParams.get('session')??'commerce05'});
 const formalBefore=localStorage.getItem('qingming:hongqiao:save'),canvas=$('game'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#bac4b6');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#bac4b6',85,210);scene.add(new THREE.HemisphereLight('#fff4d9','#738169',2));const sun=new THREE.DirectionalLight('#fff0d1',2.2);sun.position.set(-30,70,25);scene.add(sun);const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,300),draco=new DRACOLoader().setDecoderPath('/assets/draco/'),loader=new GLTFLoader().setDRACOLoader(draco);
 const [world,city,life,hero,steamer]=await Promise.all([fetch('/assets/world.json').then(r=>r.json()),loader.loadAsync('/assets/qingming-world.glb'),loader.loadAsync('/assets/street-life.glb'),loader.loadAsync('/assets/song-scholar-v2-animated.glb'),loader.loadAsync('/assets/scenery/steamer.glb')]);draco.dispose();
 scene.add(city.scene);const d=createScene({scene,world,city:city.scene});mountReusableAssets(d.slots,life.scene);const wares=mountWares({scene,sources:{steamer:steamer.scene,pot:life.scene.getObjectByName('pot'),bowl:life.scene.getObjectByName('bowl')}}),overlay=d.world;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(168,29),new THREE.MeshStandardMaterial({color:'#729c95',roughness:.35,metalness:.12}));water.rotation.x=-Math.PI/2;water.position.y=.08;scene.add(water);const scholar=createScholar(hero);scene.add(scholar.root);
 let actor={id:'player_scholar',x:-29,z:-22.3,height:.94,mode:'walk',layer:'ground'},yaw=Math.PI,pitch=.5,distance=9,focus=new THREE.Vector3(-29,2.29,-22.3),focused=true,failNext=false,alive=true,module,fishing,last=performance.now(),walk=null,walkEvidence=[],events=[],toasts=[];
 const keys=new Set(),gate=createKeyGate(),input=new Map(),locks=createInputLocks(()=>{keys.clear();});
 function frame(){return {regionId:'region_d',visible:!document.hidden,focused,operative:!locks.locked,actor:{...actor}};}
 const portCamera=createPreviewCamera({capture:()=>({camera:camera.clone(),yaw,pitch,distance,focus:focus.clone()}),restore(s){camera.copy(s.camera);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();yaw=s.yaw;pitch=s.pitch;distance=s.distance;focus.copy(s.focus);},setPose(p){camera.position.fromArray(p.position);camera.lookAt(...p.target);}});
 const service=createSharedService({saveKey:key,development:true,storage:{getItem:k=>localStorage.getItem(k),setItem(k,v){if(failNext){failNext=false;throw Error('DEV 单次写入失败');}localStorage.setItem(k,v);}},anchors:manifest,content,ports:{getFrame:frame},seed:()=>0,onError:e=>events.push(String(e))});
 const go=id=>{const a=manifest.anchors.find(a=>a.id===id),p=a.standingPosition;actor={...actor,x:p[0],height:p[1],z:p[2]};focus.set(actor.x,actor.height+1.35,actor.z);if(a.role==='food_vendor')yaw=0;else yaw=Math.PI;const h=Math.cos(pitch)*distance;camera.position.set(focus.x+Math.sin(yaw)*h,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(yaw)*h);camera.lookAt(focus);};
 const send=(type,payload={})=>{const r=service.dispatch({type:'c2/'+type,transactionId:service.createTransactionId(),payload});if(!r.ok)throw Error(JSON.stringify(r));return r;};
 function initial(){const flushed=service.flush();if(!flushed.ok)throw Error(JSON.stringify(flushed));const s=defaultState();s.quests.hongqiao_01={status:'completed'};s.endingSeen=true;const r=service.restoreFixture(s);if(!r.ok)throw Error(JSON.stringify(r));go('anchor_c2_entry');send('enterChapter2',{entryId:C.entry.id});go('anchor_c2_fisher');}
 if(!localStorage.getItem(key))initial();else {if(!service.getState().travel.initialized){go('anchor_c2_entry');send('enterChapter2',{entryId:C.entry.id});go('anchor_c2_fisher');}const pos=service.getState().travel.regionPositions?.region_d;if(pos)actor={...actor,...pos};}
 let toastUntil=0;const toast=m=>{$('toast').textContent=m;toastUntil=performance.now()+6500;toasts.push(m);};
 const registry=createInteractionRegistry({reachable:(a,p,e)=>canInteract(a,e.anchor,overlay)});let releaseBook=null;
 function closeBook(){$('book').hidden=true;releaseBook?.();releaseBook=null;canvas.focus();}
 const ports={getFrame:frame,input:{subscribe(owner,listener){input.set(owner,listener);return ()=>input.delete(owner);}},navigate(id){toast('沿街前往 '+manifest.anchors.find(a=>a.id===id)?.label+'；导航只提示方向，不远程成交。');},openBook(){module.cancel('book');$('records').replaceChildren();for(const [id,r]of Object.entries(service.getState().travel.collection)){$('records').append(Object.assign(document.createElement('p'),{textContent:(content.items.find(i=>i.id===id)?.name??id)+` · 累计 ${r.totalObtained} · 现持有 ${service.getState().inventory[id]??0}`}));}releaseBook=locks.acquire('preview/book',closeBook);$('book').hidden=false;}};
 const ctx={scene,world:overlay,service,ports,locks,gate,camera:portCamera,registry,toast,baseURL:import.meta.env.BASE_URL};module=create(ctx);fishing=createFishing(ctx);
 function prepare(kind){module.cancel('fixture');fishing.cancel('fixture');if(service.getStatus().pending)throw Error('先重试待保存进度');initial();go('anchor_c2_fisher');if(kind!=='new')send('acceptQuest',{questId:'quest_c2_fishing_intro'});
  if(kind==='fish'){go('anchor_c2_fishing_a');for(let i=0;i<3;i++){const r=send('startCast',{pointId:'point_c2_a',mode:i===0?'tutorial':'normal'});send('resolveCast',{castId:r.data.cast.id,outcome:'caught'});}go('anchor_c2_fisher');}
  if(kind==='poor'||kind==='food'){const s=structuredClone(service.getState());s.travel.energy.current=kind==='poor'?0:95;s.travel.wallet.coins=kind==='poor'?0:30;service.restoreFixture(s);go('anchor_c2_food_vendor');}
  if(kind==='bell'||kind==='cash'){go('anchor_c2_porter');send('acceptQuest',{questId:'quest_c2_main'});send('acceptQuest',{questId:'quest_c2_repair'});go('anchor_c2_repair');send('beginRepair',{repairId:C.repair.id});for(const stepId of C.repair.stepIds)send('advanceRepair',{repairId:C.repair.id,stepId});send('completeRepair',{repairId:C.repair.id});go('anchor_c2_porter');send('chooseReward',{repairId:C.repair.id,choice:kind==='bell'?'bell':'cash'});if(kind==='bell')send('advanceStory',{storyId:'story_c2_silent_bell',stageId:'stage_c2_silent_bell_resolved'});go('anchor_c2_merchant');}
  $('location').value=kind==='food'||kind==='poor'?'anchor_c2_food_vendor':kind==='bell'||kind==='cash'?'anchor_c2_merchant':'anchor_c2_fisher';toast('DEV隔离样本：'+kind+'。通关前置与边界数值为明确测试起点；动作结算使用真实服务。');canvas.focus();return service.getState();
 }
 const abort=new AbortController(),opt={signal:abort.signal};let drag=null;
 window.addEventListener('keydown',e=>{if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&e.code!=='Escape')return;if(!gate.press(e.code,e.repeat))return;
  if(locks.locked){if(e.code==='Escape'&&locks.top.owner==='preview/book')closeBook();else {const command=e.code==='Escape'?'cancel':e.code==='KeyE'?'confirm':null;if(command)input.get(locks.top.owner)?.(command);}if(e.code==='KeyE'||e.code==='Escape'||!['Enter','Space','Tab'].includes(e.code))e.preventDefault();return;}
  if(e.code==='KeyE'){registry.activate(actor);e.preventDefault();}else if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft'].includes(e.code)){keys.add(e.code);e.preventDefault();}
 },opt);window.addEventListener('keyup',e=>{keys.delete(e.code);gate.release(e.code);},opt);window.addEventListener('blur',()=>{focused=false;keys.clear();gate.clear();},opt);window.addEventListener('focus',()=>{focused=true;keys.clear();gate.clear();},opt);
 canvas.addEventListener('pointerdown',e=>{canvas.focus();if(!locks.locked){drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);}},opt);canvas.addEventListener('pointermove',e=>{if(!drag||locks.locked)return;yaw-=(e.clientX-drag[0])*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag[1])*.004,.15,1.2);drag=[e.clientX,e.clientY];},opt);for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>drag=null,opt);canvas.addEventListener('wheel',e=>{if(!locks.locked)distance=THREE.MathUtils.clamp(distance+e.deltaY*.01,4,18);e.preventDefault();},{...opt,passive:false});
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();window.addEventListener('resize',resize,opt);
 $('location').addEventListener('change',e=>{module.cancel('dev-position');fishing.cancel('dev-position');go(e.target.value);toast('DEV取景定位：不是连续实走。');canvas.focus();},opt);$('prepare').addEventListener('click',()=>{try{prepare($('scenario').value);}catch(e){toast(e.message);}},opt);$('fail').addEventListener('click',()=>{failNext=true;toast('下一次保存写入将失败一次。');canvas.focus();},opt);$('leave').addEventListener('click',()=>{actor.x-=4;canvas.focus();},opt);$('closeBook').addEventListener('click',closeBook,opt);
 function walkTo(id){if(walk||locks.locked)return Promise.reject(Error('Busy'));const route=manifest.routes.find(r=>r.to===id);if(!route)return Promise.reject(Error('No measured route'));
  // Continuous moveActor on RAF. The DEV command selects a measured route; it never assigns coordinates.
  const current=manifest.routes.filter(r=>r.to!=='anchor_c2_exit').find(r=>{const a=manifest.anchors.find(a=>a.id===r.to),p=a.standingPosition;return Math.hypot(actor.x-p[0],actor.z-p[2])<1.9;});
  const points=current?[...current.waypoints].reverse().concat(route.waypoints.slice(1)):[...route.waypoints];const stand=manifest.anchors.find(a=>a.id===id).standingPosition;points.push(stand);
  const record={id,from:{...actor},samples:0,distance:0,failures:[],continuous:true};return new Promise((resolve,reject)=>{walk={points:points.map(p=>[...p]),record,resolve,reject};});
 }
 function loop(now){if(!alive)return;const dt=Math.min((now-last)/1000,.04);last=now;let dx=0,dz=0;
  if(!locks.locked&&focused&&!document.hidden){if(walk){let p=walk.points[0];while(p&&Math.hypot(actor.x-p[0],actor.z-p[2])<.035){walk.points.shift();p=walk.points[0];}if(!p){const done=walk;walk=null;done.record.to={...actor};walkEvidence.push(done.record);done.resolve(done.record);}else {const len=Math.hypot(p[0]-actor.x,p[2]-actor.z),step=Math.min(2.7*dt,len);dx=(p[0]-actor.x)/len*step;dz=(p[2]-actor.z)/len*step;}}else {const f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),n=Math.max(1,Math.hypot(f,s)),speed=keys.has('ShiftLeft')?5.2:2.7;dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed*dt/n;dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed*dt/n;}
   const next=moveActor(actor,dx,dz,overlay);if(walk&&Math.hypot(dx,dz)>0&&Math.hypot(next.x-actor.x,next.z-actor.z)<.001){const failed=walk;walk=null;failed.record.failures.push({...actor});walkEvidence.push(failed.record);failed.reject(Error('Measured route blocked'));}else if(walk){walk.record.samples++;walk.record.distance+=Math.hypot(next.x-actor.x,next.z-actor.z);}actor={...actor,...next};
  }
  scholar.root.position.set(actor.x,actor.height,actor.z);if(dx||dz)scholar.root.rotation.y=Math.atan2(dx,dz);scholar.update(dt,'walk',!!(dx||dz),now/160,keys.has('ShiftLeft'));
  const f=frame();service.dispatch({type:'c2/tick',payload:{seconds:f.visible&&f.focused?dt:0,operative:f.operative}});module.update(dt,f);fishing.update(dt,f);
  if(!portCamera.owner){focus.lerp(new THREE.Vector3(actor.x,actor.height+1.35,actor.z),1-Math.exp(-dt*7));const h=Math.cos(pitch)*distance;camera.position.lerp(new THREE.Vector3(focus.x+Math.sin(yaw)*h,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(yaw)*h),1-Math.exp(-dt*8));camera.lookAt(focus);}renderer.render(scene,camera);
  const near=registry.focus(actor);$('hint').textContent=locks.locked?'Esc 关闭 · 留在对方面前':near?'E · '+near.label:'沿街靠近商贩，按 E 面对面交谈';$('diagnostic').textContent=`隔离键 ${key.split(':').at(-1)} · ${module.getState().phase}`;if(now>toastUntil)$('toast').textContent='';requestAnimationFrame(loop);
 }
 $('loading').remove();canvas.focus();requestAnimationFrame(loop);
 window.__commercePreview={ready:true,key,service,module,fishing,context:ctx,prepare,walkTo,failNextSave:()=>{failNext=true;},inspect:()=>({snapshot:service.getState(),module:module.getState(),actor:{...actor},locks:locks.snapshot(),camera:{owner:portCamera.owner,yaw,pitch,distance,position:camera.position.toArray()},registryEntries:registry.entries().map(e=>e.id),inputListeners:input.size,walkEvidence:[...walkEvidence],wares:wares.getState(),formalSaveUnchanged:localStorage.getItem('qingming:hongqiao:save')===formalBefore,events:[...events],toasts:[...toasts],notFormalIntegration:true,humanPlaytest:false}),dispose(){module.dispose();fishing.dispose();wares.dispose();closeBook();alive=false;abort.abort();d.dispose();renderer.dispose();}};
}
boot().catch(e=>{console.error(e);$('loading').textContent='预览载入失败：'+e.message;});
