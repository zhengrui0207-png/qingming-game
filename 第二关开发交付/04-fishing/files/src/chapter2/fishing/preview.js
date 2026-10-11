import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createScholar} from '../../scholar.js';
import {moveActor} from '../../world.js';
import {createInputLocks,createKeyGate,createInteractionRegistry} from '../../interaction/core.js';
import {createSharedService,developmentSaveKey} from '../core/service.js';
import {defaultState} from '../../hongqiao/state.js';
import {create as createScene} from '../scene/scene.js';
import {mountReusableAssets} from '../scene/asset-mounts.js';
import {manifest,canInteract} from '../scene/physics.js';
import content from '../content/content.json' with {type:'json'};
import {create,recoveryAnchor} from './index.js';
import {createPreviewCamera} from './preview-camera.js';
const $=id=>document.getElementById(id);
async function boot(){
 if(!import.meta.env.DEV||!new URL(location.href).searchParams.has('test')||!new URL(location.href).searchParams.has('chapter2')){$('loading').textContent='此独立验收页仅用于DEV，请加 ?test&chapter2；正式入口仍由主控装配。';return;}
 const session=new URL(location.href).searchParams.get('session')??'fishing-preview';const key=developmentSaveKey({development:import.meta.env.DEV,url:location.href,session});
 const canvas=$('game'),renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor('#b9c3b8');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog('#b9c3b8',90,220);scene.add(new THREE.HemisphereLight('#fff4d9','#78826b',2));const sun=new THREE.DirectionalLight('#fff0d1',2.2);sun.position.set(-30,70,25);scene.add(sun);const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,300);const loader=new GLTFLoader();
 const [world,city,life,heroAsset]=await Promise.all([fetch('/assets/world.json').then(r=>{if(!r.ok)throw Error('world missing');return r.json();}),loader.loadAsync('/assets/qingming-world.glb'),loader.loadAsync('/assets/street-life.glb'),loader.loadAsync('/assets/song-scholar-v2-animated.glb')]);
 scene.add(city.scene);const d=createScene({scene,world,city:city.scene});mountReusableAssets(d.slots,life.scene);const overlay=d.world;
 const water=new THREE.Mesh(new THREE.PlaneGeometry(168,29),new THREE.MeshStandardMaterial({color:'#729c95',roughness:.35,metalness:.12}));water.rotation.x=-Math.PI/2;water.position.y=.08;scene.add(water);
 const scholar=createScholar(heroAsset);scene.add(scholar.root);const keys=new Set(),gate=createKeyGate(),input=new Map(),locks=createInputLocks(()=>{keys.clear();gate.clear();});
 let actor={id:'player_scholar',x:-29,z:-19.8,height:.94,layer:'ground',mode:'walk'},yaw=Math.PI,pitch=.49,distance=10,focus=new THREE.Vector3(-29,2.29,-19.8),focused=true,cinema=null,cinemaLock=null,failNext=false,nextSeed='random',alive=true,module=null,frameTimes=[],last=performance.now(),movingTime=0,events=[];
 function frame(){return {regionId:'region_d',visible:!document.hidden,focused,operative:!locks.locked,actor:{...actor},wallNow:new Date().toISOString()};}
 function capture(){return {camera:camera.clone(),yaw,pitch,distance,focus:focus.clone(),actorId:actor.id};}
 function restore(s){camera.copy(s.camera);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();yaw=s.yaw;pitch=s.pitch;distance=s.distance;focus.copy(s.focus);keys.clear();gate.clear();}
 const cameraPort=createPreviewCamera({capture,restore,setPose(p){camera.position.fromArray(p.position);camera.lookAt(...p.target);if(p.fov){camera.fov=p.fov;camera.updateProjectionMatrix();}}});
 const disk={getItem:k=>localStorage.getItem(k),setItem(k,value){if(failNext){failNext=false;throw Error('DEV injected write failure');}localStorage.setItem(k,value);}};
 const seeds={fish:0,carp:256,junk:Math.ceil(.8*4294967296),rare:4294967295};
 const service=createSharedService({storage:disk,anchors:manifest,content,ports:{getFrame:frame},saveKey:key,development:true,seed:()=>{if(nextSeed!=='random')return seeds[nextSeed];const n=new Uint32Array(1);crypto.getRandomValues(n);return n[0];},onError:error=>{events.push({type:'expectedSaveFailure',message:String(error)});}});
 // This is an explicitly labelled complete-HQ fixture in an isolated DEV key only.
 if(service.getState().quests.hongqiao_01?.status!=='completed'&&!localStorage.getItem(key)){const fixture=defaultState();fixture.quests.hongqiao_01={status:'completed'};fixture.endingSeen=true;service.restoreFixture(fixture);}
 const dispatch=(type,payload)=>service.dispatch({type:'c2/'+type,transactionId:service.createTransactionId(),payload});
 if(!service.getState().travel.initialized){const entry=manifest.anchors.find(a=>a.id==='anchor_c2_entry').position;actor={...actor,x:entry[0],height:entry[1],z:entry[2]};const r=dispatch('enterChapter2',{entryId:'entry_c2_from_hongqiao'});if(!r.ok)throw Error(JSON.stringify(r));const a=manifest.anchors.find(a=>a.id==='anchor_c2_fishing_a').position;actor={...actor,x:a[0],height:a[1],z:a[2]};}
 const lastSavedCast=service.getState().travel.fishing.lastCast;const reloaded=performance.getEntriesByType('navigation')[0]?.type==='reload';
 const cancelledReloadAnchor=reloaded&&lastSavedCast?.outcome==='cancelled'?({'point_c2_a':'anchor_c2_fishing_a','point_c2_b':'anchor_c2_fishing_b'})[lastSavedCast.pointId]:null;
 const recovery=recoveryAnchor(service.getState(),manifest.anchors)??cancelledReloadAnchor;if(recovery){const p=manifest.anchors.find(a=>a.id===recovery).standingPosition;actor={...actor,x:p[0],height:p[1],z:p[2]};}else {const p=service.getState().travel.regionPositions?.region_d;if(p&&canInteract(p,manifest.anchors.find(a=>a.id==='anchor_c2_fishing_a'),overlay))actor={...actor,...p};}
 focus.set(actor.x,actor.height+1.35,actor.z);
 const registry=createInteractionRegistry({reachable:(a,p,e)=>canInteract(a,e.anchor,overlay)});
 let toastUntil=0;const toast=message=>{$('toast').textContent=message;toastUntil=performance.now()+6000;};
 const ports={getFrame:frame,input:{subscribe(owner,listener){input.set(owner,listener);return ()=>input.delete(owner);}},navigate(id){toast('沿街前往：'+(manifest.anchors.find(a=>a.id===id)?.label??id));},openBook(){const records=service.getState().travel.collection;$('collection').replaceChildren();for(const [id,row]of Object.entries(records)){const p=document.createElement('p');p.textContent=(content.items.find(i=>i.id===id)?.name??id)+` · 累计${row.totalObtained} · 现持有${service.getState().inventory[id]??0}`;$('collection').append(p);}bookRelease=locks.acquire('preview:book',closeBook);$('book').hidden=false;}};
 let bookRelease=null;function closeBook(){$('book').hidden=true;bookRelease?.();bookRelease=null;canvas.focus();}
 const ctx={scene,world:overlay,service,baseURL:import.meta.env.BASE_URL,toast,registry,locks,gate,camera:cameraPort,ports};module=create(ctx);
 const savedFormalBefore=localStorage.getItem('qingming:hongqiao:save');
 const abort=new AbortController(),opt={signal:abort.signal};let drag=null;
 window.addEventListener('keydown',e=>{if(!alive||e.target.tagName==='SELECT'||e.target.tagName==='INPUT')return;if(!gate.press(e.code,e.repeat))return;
  if(e.code==='Escape'&&!$('book').hidden){closeBook();e.preventDefault();return;}if(locks.locked){if(cinema&&e.code==='Escape'){endPresentation();}else {const command=e.code==='Escape'?'cancel':['KeyE','Enter','Space'].includes(e.code)?'confirm':null;if(command)for(const listener of input.values())if(listener(command))break;}e.preventDefault();return;}
  if(e.code==='KeyE'){registry.activate(actor);e.preventDefault();}else if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){keys.add(e.code);e.preventDefault();}
 },opt);
 window.addEventListener('keyup',e=>{gate.release(e.code);keys.delete(e.code);},opt);window.addEventListener('blur',()=>{focused=false;keys.clear();gate.clear();},opt);window.addEventListener('focus',()=>{focused=true;keys.clear();gate.clear();},opt);
 canvas.addEventListener('pointerdown',e=>{canvas.focus();if(locks.locked)return;drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);},opt);canvas.addEventListener('pointermove',e=>{if(!drag||locks.locked)return;yaw-=(e.clientX-drag[0])*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag[1])*.004,.1,1.27);drag=[e.clientX,e.clientY];},opt);for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,()=>drag=null,opt);canvas.addEventListener('wheel',e=>{if(!locks.locked)distance=THREE.MathUtils.clamp(distance+e.deltaY*.01,4,20);e.preventDefault();},{...opt,passive:false});
 function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();window.addEventListener('resize',resize,opt);
 $('view').addEventListener('change',e=>{module.cancel('user');endPresentation();const a=manifest.anchors.find(a=>a.id===e.target.value);actor={...actor,x:a.position[0],height:a.position[1],z:a.position[2]};focus.set(actor.x,actor.height+1.35,actor.z);yaw=Math.PI;toast('DEV取景定位：不是连续步行证据。');canvas.focus();},opt);
 for(const [id,questId]of [['borrow','quest_c2_fishing_intro'],['tokenQuest','quest_c2_token']])$(id).addEventListener('click',()=>{const r=dispatch('acceptQuest',{questId});toast(r.ok?(id==='borrow'?content.dialogues.find(d=>d.id==='dialogue_c2_fisher').nodes.find(n=>n.id==='node_c2_fisher_teach').text:'鲁七授权在静岸取回木牌。'):r.error.message);canvas.focus();},opt);
 $('sample').addEventListener('change',e=>{nextSeed=e.target.value;toast(nextSeed==='random'?'恢复自然随机':'下一杆为明确标注的DEV服务种子样本。');},opt);$('failSave').addEventListener('click',()=>{failNext=true;toast('DEV：下一次持久化写入将失败一次。');},opt);
 function endPresentation(){cinema?.release();cinema=null;cinemaLock?.();cinemaLock=null;$('restorePresentation').disabled=true;canvas.focus();}
 $('presentation').addEventListener('click',()=>{closeBook();cinema=cameraPort.borrow('presentation:dev',endPresentation);if(cinema){cinemaLock=locks.acquire('presentation:dev',endPresentation);cinema.setPose({position:[-42,22,-6],target:[-40,.94,-30],fov:48});$('restorePresentation').disabled=false;toast('DEV演出持有镜头，钓鱼旧租约不得夺回。');}},opt);$('restorePresentation').addEventListener('click',endPresentation,opt);
 $('leaveRange').addEventListener('click',()=>{actor={...actor,x:actor.x-3};toast('DEV离开范围样本。');},opt);$('dispose').addEventListener('click',()=>{module.dispose();toast('模块已销毁：两钓点注销、监听和自建GPU资源释放。');},opt);$('closeBook').addEventListener('click',closeBook,opt);
 let lastStats=0;
 function loop(now){if(!alive)return;const ms=now-last;last=now;const dt=Math.min(ms/1000,.04);if(frameTimes.length<2000)frameTimes.push(ms);let dx=0,dz=0;
  if(!locks.locked&&focused&&!document.hidden){const f=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),s=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),n=Math.max(1,Math.hypot(f,s)),speed=keys.has('ShiftLeft')?5.2:2.7;dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*speed*dt/n;dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*speed*dt/n;actor={...actor,...moveActor(actor,dx,dz,overlay)};}
  scholar.root.position.set(actor.x,actor.height,actor.z);if(dx||dz){scholar.root.rotation.y=Math.atan2(dx,dz);movingTime+=dt*6;}else if(locks.snapshot().includes('c2/fishing'))scholar.root.rotation.y=0;
  scholar.update(dt,'walk',!!(dx||dz),movingTime,keys.has('ShiftLeft'));
  const f=frame();service.dispatch({type:'c2/tick',payload:{seconds:f.visible&&f.focused?dt:0,operative:f.operative}});module.update(dt,f);
  if(!cameraPort.owner){focus.lerp(new THREE.Vector3(actor.x,actor.height+1.35,actor.z),1-Math.exp(-dt*7));const h=Math.cos(pitch)*distance,goal=new THREE.Vector3(focus.x+Math.sin(yaw)*h,focus.y+Math.sin(pitch)*distance,focus.z+Math.cos(yaw)*h);camera.position.lerp(goal,1-Math.exp(-dt*8));camera.lookAt(focus);}
  renderer.render(scene,camera);
  if(now-lastStats>200){lastStats=now;const s=service.getState(),near=registry.focus(actor);$('stats').textContent=`精力 ${s.travel.energy.current} · 铜钱 ${s.travel.wallet.coins}文 · 本杆 ${module.getState().phase}`;$('hint').textContent=locks.locked?'垂钓时留在安全岸上':near?'E · '+near.label:'靠近岸边钓点，按 E';if(now>toastUntil)$('toast').textContent='';}
  requestAnimationFrame(loop);
 }
 $('loading').remove();canvas.focus();requestAnimationFrame(loop);
 // DEV diagnostics expose observations, not production actions or another wallet.
 window.__fishingPreview={ready:true,service,key,context:ctx,module,inspect:()=>({module:module.getState(),snapshot:service.getState(),actor:{...actor},camera:{owner:cameraPort.owner,yaw,pitch,distance,position:camera.position.toArray(),focus:focus.toArray()},locks:locks.snapshot(),registryEntries:registry.entries().map(e=>e.id),inputListeners:input.size,events:[...events],formalSaveUnchanged:localStorage.getItem('qingming:hongqiao:save')===savedFormalBefore,resources:renderer.info.memory,assetStatus:{hero:'real existing scholar',dedicatedFishingPose:false,rig:'procedural movable parts',catch:'procedural proxies'},notFormalIntegration:true,humanPlaytest:false}),dispose(){module.dispose();endPresentation();closeBook();alive=false;abort.abort();d.dispose();renderer.dispose();}};
}
boot().catch(error=>{console.error(error);$('loading').textContent='预览载入失败：'+error.message;});
