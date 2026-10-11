import {createJiaodian} from './landmarks/jiaodian.js';
import {createStreetAudio} from './street-audio.js';
import './song-font.css';
import {loadHorses} from './horse.js';
import {loadOxen} from './ox.js';
import {createSceneryAssets} from './scenery-assets.js';
import {createCinemaRenderer} from './hongqiao/cinema/renderer.js';
import {createInputLocks,createKeyGate,createInteractionRegistry,segmentBlocked} from './interaction/core.js';
import {createDialogueUI} from './interaction/dialogue.js';
import './style.css';
import {motionConfig} from './motion/config.js';
import { createHongqiaoProgress } from './interaction/progress-adapter.js';
import { loadSurfaces } from './surfaces.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStreetLife } from './street-life.js';
import {loadNpcAssets} from './npc-assets.js';
import { createScholar } from './scholar.js';
import { createStorefronts } from './storefronts.js';
import { createRiver } from './river.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createAtmosphere } from './atmosphere.js';
import { createLandscape } from './landscape.js';
import { moveActor, moveBoat, getDisembark, surfaceAt, bridgeHeight, boatAllowed } from './world.js';

const $=id=>document.getElementById(id),canvas=$('game');
let renderer;
try { renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}); }
catch(e){showError('浏览器未能开启三维画面。请使用支持 WebGL 的 Chrome 或 Safari 重试。');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1));renderer.setSize(innerWidth,innerHeight);
renderer.info.autoReset=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
const scene=new THREE.Scene();scene.background=new THREE.Color('#a7bcba');scene.fog=new THREE.Fog('#c7c5b2',70,220);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.12,400);
camera.position.set(63,45,68);camera.lookAt(0,2,0);
const hemi=new THREE.HemisphereLight(0xbfcddd,0x8e7657,.85);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffe4b6,3.8);sun.position.set(-38,49,32);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.autoUpdate=false;sun.shadow.needsUpdate=true;Object.assign(sun.shadow.camera,{left:-49,right:49,top:49,bottom:-49,near:1,far:180});sun.shadow.bias=-.0003;sun.shadow.normalBias=.024;sun.shadow.radius=2;scene.add(sun,sun.target);
scene.add(new THREE.AmbientLight(0xb3c7c7,.06));
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.3;pmrem.dispose();
const sky=new THREE.Mesh(new THREE.SphereGeometry(260,24,12),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#779fae')},bottom:{value:new THREE.Color('#c9cabb')}},vertexShader:'varying vec3 vDir; void main(){vDir=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 top; uniform vec3 bottom; varying vec3 vDir; void main(){float t=pow(max(normalize(vDir).y,0.),.65);gl_FragColor=vec4(mix(bottom,top,t),1.);\n #include <tonemapping_fragment>\n #include <colorspace_fragment> }'}));scene.add(sky);
const river=createRiver(scene,sun);
const atmosphere=createAtmosphere(renderer,scene,camera,river);
const keys=new Set(),pointers=new Map();let pinchDistance=0,dragging=false;
let npcAssets,jiaodian,streetAudio;
let sceneryAssets,world,city,player,scholar,npcPrototype,scholarGLTF,skiff,surfaces,lifeAssets,streetLife,storefronts,landscape,loaded=false,playing=false,paused=false,overview=false,boatMode=false;
let actor={x:0,z:35,height:.94,layer:'ground',mode:'walk'},boat={x:32,z:7,angle:Math.PI/2,speed:0};
let yaw=.22,pitch=.49,distance=10,targetDistance=10,actorAngle=Math.PI,phase=0,last=0,elapsed=0,mapTime=0,toastTimer;
const focus=new THREE.Vector3(0,2,0),temp=new THREE.Vector3(),camGoal=new THREE.Vector3();
let hongqiaoProgress,interactions,dialogue,fixture,cinema;
const gate=createKeyGate();
const locks=createInputLocks(()=>{paused=locks.locked;clearInput();if(paused)$('interaction').hidden=true;});
const panelReleases=new Map();
function lockPanel(name,cancel){if(!panelReleases.has(name))panelReleases.set(name,locks.acquire(name,cancel));}
function unlockPanel(name){panelReleases.get(name)?.();panelReleases.delete(name);clearInput();if(!locks.locked)canvas.focus();}
let lastMode='walk',moving=false,fpsFrames=0,fpsAt=0,fps=0,lastShadowUpdate=-1,lifeAccumulator=0;

const palette={wood:'#816041',wood_light:'#a08054',wood_dark:'#4c3828',plaster:'#c7b799',plaster_old:'#b5a183',ground:'#a28b68',path:'#b9a17a',stone:'#736e5d',stone_light:'#938875',tile0:'#434d4a',tile1:'#515953',tile2:'#60665c',tile3:'#4c5551',cloth:'#cbb082',cloth_blue:'#596d71',cloth_red:'#896253',skin:'#c5a07c',hair:'#292c25',indigo:'#36596c',robe_gray:'#929387',robe_cream:'#c4c1a5',robe_brown:'#84735a',robe_green:'#687359',belt:'#443f32',leaf0:'#536e47',leaf1:'#71844e',leaf2:'#8e9b65',fruit:'#b79341',ceramic:'#788b7f',red:'#a45137'};
function enhanceMaterial(mat){
 const key=mat.name.replace(/^QM_/,'').replace(/\.\d+$/,'');if(palette[key])mat.color.set(palette[key]);
 mat.envMapIntensity=.25;
 if(key.startsWith('tile'))mat.roughness=.92;
 if(/cloth|robe|indigo/.test(key))mat.side=THREE.DoubleSide;
 if(key.startsWith('leaf')){mat.side=THREE.DoubleSide;mat.roughness=1;}

}
const marker=new THREE.Mesh(new THREE.RingGeometry(.45,.53,40),new THREE.MeshBasicMaterial({color:0xe8d6a7,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}));marker.rotation.x=-Math.PI/2;scene.add(marker);
const loader=new GLTFLoader();const progress={world:0,actor:0,boat:0};
function loadModel(path,key,full=false){return new Promise((resolve,reject)=>loader.load(path,g=>{progress[key]=1;updateProgress();resolve(full?g:g.scene)},e=>{progress[key]=e.total?e.loaded/e.total:.5;updateProgress()},reject));}
function updateProgress(){const p=(progress.world*.8+progress.actor*.1+progress.boat*.1)*100;$('load-progress').style.width=Math.max(4,p)+'%';}
async function boot(){
 try{
 [city,npcPrototype,skiff,world,surfaces,lifeAssets,scholarGLTF]=await Promise.all([loadModel(import.meta.env.BASE_URL+'assets/qingming-world.glb','world'),loadModel(import.meta.env.BASE_URL+'assets/a-qing.glb','crowd'),loadModel(import.meta.env.BASE_URL+'assets/skiff.glb','boat'),fetch(import.meta.env.BASE_URL+'assets/world.json').then(r=>{if(!r.ok)throw Error('布局文件缺失');return r.json()}),loadSurfaces(renderer),loadModel(import.meta.env.BASE_URL+'assets/street-life.glb','life'),loadModel(import.meta.env.BASE_URL+'assets/song-scholar-v2-animated.glb','actor',true)]);
 const materials=new Set();for(const root of [city,npcPrototype,skiff,lifeAssets])root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.userData.hasUV=!!o.geometry.attributes.uv;materials.add(m);});}});materials.forEach(m=>{enhanceMaterial(m);surfaces.apply(m)});

 city.traverse(o=>{if(o.isMesh&&/^QM_(?:foliage_wood_dark|willow_leaves_)/.test(o.name))o.visible=false;});
 landscape=await createLandscape(scene,renderer,world);
 scholar=createScholar(scholarGLTF);player=scholar.root;player.rotation.y=actorAngle;
 scene.add(city,player,skiff);
 npcAssets=await loadNpcAssets(import.meta.env.BASE_URL,(n,total)=>{$('load-caption').textContent=`汴京人物载入中 · ${n} / ${total}`;});
 const [horses,oxen]=await Promise.all([loadHorses(scene,import.meta.env.BASE_URL),loadOxen(scene,import.meta.env.BASE_URL)]);
 jiaodian=createJiaodian(scene,world,npcAssets);
 streetLife=createStreetLife(scene,npcPrototype,lifeAssets,world,camera,npcAssets,horses,oxen);
 interactions=createInteractionRegistry({unobstructed:(a,p)=>!segmentBlocked({x:a.x,y:a.height,z:a.z},p,world.colliders),reachable:(a,p)=>{const r=moveActor({...a},p.x-a.x,p.z-a.z,world);return r.mode==='walk'&&r.layer===a.layer&&Math.hypot(r.x-p.x,r.z-p.z)<.1;}});
 let testEffects=0;
 dialogue=createDialogueUI({locks,gate,condition:id=>id==='canRecord',effect:id=>{if(id==='recordTest')testEffects++;}});
 let questHistoryPeople=[];
 storefronts=createStorefronts(scene,world,{registry:interactions,getPeople:()=>[
  ...streetLife.getHistoryResidents(),
  ...questHistoryPeople.flatMap(({id,assetId,entry,entity})=>{
   if(!entity.visible)return [];
   return [{id,assetId,...entry.getPosition(),layer:entry.layer}];
  })
 ],onOpen:()=>lockPanel('history',()=>storefronts.closeDetails()),onClose:()=>unlockPanel('history')});
 hongqiaoProgress=createHongqiaoProgress({scene,loader,world,registry:interactions,npcPrototype,npcAssets,locks,gate,canOperate:()=>playing&&!paused&&!boatMode,getActor:()=>({...actor}),canOpen:()=>playing,onOpen:()=>lockPanel('book',()=>hongqiaoProgress.ui.close()),onClose:()=>unlockPanel('book'),toast});
 questHistoryPeople=[['npc_hq_zhou','QMSH-22'],['npc_hq_he','QMSH-24']].flatMap(([id,assetId])=>{
  const entry=interactions.entries().find(e=>e.id===id),entity=scene.getObjectByName(id);
  return entry&&entity&&!npcAssets.failures.some(f=>f.assetId===assetId)?[{id,assetId,entry,entity}]:[];
 });
 streetLife.setExternalBodies(()=>[jiaodian.body(),...(boatMode||actor.mode!=='walk'?[]:[{...actor,id:'player_scholar',y:actor.height,radius:.32}]),...interactions.entries().filter(e=>e.type==='npc').map(e=>({...e.getPosition(),id:e.id,layer:e.layer,radius:.48}))]);
 cinema=await createCinemaRenderer({scene,city,loader,npcAssets,world,baseURL:import.meta.env.BASE_URL,gameCamera:camera,player,controls:{
  setCinematicFocus:next=>streetLife.setCinematicFocus(next),
  setBridgeAlarm:next=>streetLife.setBridgeAlarm(next),
  capture:()=>({camera:camera.clone(),yaw,pitch,distance,targetDistance,overview,focus:focus.clone()}),
  restore:s=>{camera.copy(s.camera);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();yaw=s.yaw;pitch=s.pitch;distance=s.distance;targetDistance=s.targetDistance;overview=s.overview;focus.copy(s.focus);clearInput();},
  waitForRelease:()=>{const held=new Set(gate.keys());clearInput();if(!held.size)return;const release=locks.acquire('presentationRelease');const done=()=>{release();removeEventListener('keyup',up,true);removeEventListener('blur',done);};const up=e=>{held.delete(e.code);if(!held.size)done();};addEventListener('keyup',up,true);addEventListener('blur',done);},
  audioContext:()=>audioCtx,
  audioDestination:()=>audioMaster,
  audioEnabled:()=>soundOn,
  toggleAudio:()=>setSound(!soundOn),
  setCinemaAudioActive:active=>{cinemaAudioActive=active;if(audioAmbientDuck)audioAmbientDuck.gain.setTargetAtTime(active?0:1,audioCtx.currentTime,.08);},
  pauseAudio:paused=>{if(audioCtx)return paused?audioCtx.suspend():audioCtx.resume();}
 }});
 sceneryAssets=await createSceneryAssets({scene,city,baseURL:import.meta.env.BASE_URL});
 try{
  const response=await fetch(import.meta.env.BASE_URL+'assets/audio/street/manifest.json');
  if(!response.ok)throw Error('街市声音清单 HTTP '+response.status);
  streetAudio=createStreetAudio({manifest:await response.json(),baseURL:import.meta.env.BASE_URL,getContext:()=>audioCtx,getDestination:()=>audioMaster,getFrame:getStreetAudioFrame,blocked:(a,b)=>segmentBlocked(a,b,world.colliders)});
 }catch(error){console.warn('[Street audio unavailable]',error.message);}
 cinema.setSkip(()=>hongqiaoProgress.presentation.skip());hongqiaoProgress.presentation.attach(cinema.adapter);hongqiaoProgress.ui.setReplayHandler(()=>hongqiaoProgress.presentation.replayIntro(),()=>hongqiaoProgress.presentation.replayEnding());
 if(import.meta.env.DEV && new URLSearchParams(location.search).has('interactionTest')){
  const {createInteractionFixtures}=await import('./interaction/fixtures.js');fixture=createInteractionFixtures({scene,prototype:npcPrototype,registry:interactions,dialogue});
 }
 if(import.meta.env.DEV && new URLSearchParams(location.search).has('test'))window.__interaction={getState:()=>({focus:interactions.current,locks:locks.snapshot(),dialogue:dialogue.getState(),testEffects,registered:interactions.entries().map(e=>({id:e.id,type:e.type,trigger:e.trigger}))}),move:(...args)=>fixture?.move(...args),visible:(...args)=>fixture?.visible(...args),closeDialogue:()=>dialogue.cancel()};
 if(import.meta.env.DEV && new URLSearchParams(location.search).has('hongqiao')){
  const {createHongqiaoDebug}=await import('./hongqiao/debug.js');
  window.__hongqiao=await createHongqiaoDebug({scene,city,world,npcPrototype,loader,getActor:()=>({...actor}),renderItems:false,renderNpcs:false});
 }
 if(import.meta.env.DEV && new URLSearchParams(location.search).has('motionDebug')){
  const {createMotionDebug}=await import('./motion/debug.js');
  window.__motionDebug=createMotionDebug(scene,world,()=>({...actor}));
 }
 loaded=true;$('start').disabled=false;$('start-label').textContent='入画游览';$('load-caption').textContent='画卷已展开 · 点击开始';
 window.__qingming={hongqiao:hongqiaoProgress.presentation,getState:()=>({loaded,playing,paused,mode:boatMode?'boat':actor.mode,actor:{...actor},boat:{...boat},camera:{yaw,pitch,distance,overview},fps,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,limbs:Object.keys(scholar.getState().joints),source:world.authoredWith,visualVersion:4.2,scenery:sceneryAssets?.getState(),scholar:scholar.getState(),rendering:atmosphere.getState(),surfaces:surfaces.loaded,landscape:landscape?.getState(),river:river.getState(),life:streetLife.getState(),npcAssets:npcAssets.getState(),streetAudio:streetAudio?.getState(),shops:storefronts.getState(),jiaodian:jiaodian.getState()}),world};
 // Explicit test mode keeps debug positioning unavailable during ordinary play.
 if(import.meta.env.DEV && new URLSearchParams(location.search).has('test'))Object.assign(window.__qingming,{cinema:{getState:cinema.getState,seek:cinema.seek,pause:cinema.adapter.setPaused},audio:getAudioState,snapshotScene:()=>streetLife.snapshot(),setAO:v=>atmosphere.setEnabled(v),setHero:(position,target,fov)=>{heroPosition=position;heroTarget=target;if(fov){heroFov=fov;camera.fov=fov;camera.updateProjectionMatrix();}},setActor:(x,z,layer='ground')=>{boatMode=false;actor={x,z,layer,...surfaceAt(x,z,world,layer)};focus.set(x,actor.height+1,z);},setBoat:(x,z,angle)=>{boat={x,z,angle,speed:0};},setView:(a,p,d)=>{yaw=a;pitch=p;targetDistance=d;},step:(dx,dz)=>{actor=moveActor(actor,dx,dz,world);}});
 }catch(e){console.error(e);showError('三维场景加载失败。请确认本地服务仍在运行，然后重新载入。');}
}
function showError(message){$('error').hidden=false;$('error-message').textContent=message;$('start-label').textContent='载入遇到问题';}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3600);}
let starting=false;
async function start(){if(!loaded||playing||starting)return;starting=true;
 try{await ensureAudio();}catch(e){console.warn('[Game audio unavailable]',e.message);toast('声音暂不可用，可点击声音按钮重试。');}
 starting=false;playing=true;$('landing').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');focus.set(actor.x,actor.height+1.2,actor.z);camera.position.set(actor.x+3,actor.height+6,actor.z+10);canvas.focus();toast('欢迎来到汴京。用 W A S D 行走，拖动鼠标环顾四周。');requestAnimationFrame(()=>hongqiaoProgress?.start?.());}
$('start').addEventListener('click',start);
function clearInput(){keys.clear();dragging=false;pointers.clear();pinchDistance=0;}
function showGuide(){if($('guide').open)return;storefronts?.closeDetails();lockPanel('guide',closeGuide);$('guide').showModal();}
function closeGuide(){if($('guide').open)$('guide').close();unlockPanel('guide');}
$('help').onclick=showGuide;$('close-guide').onclick=closeGuide;$('close-guide-bottom').onclick=closeGuide;
$('guide').addEventListener('cancel',e=>{e.preventDefault();closeGuide()});
function cameraLocked(){return paused&&!(locks.top?.owner==='presentation'&&cinema?.allowsGameCamera());}
function setOverview(){if(!playing||cameraLocked())return;overview=!overview;targetDistance=overview?29:10;if(overview)yaw=.5;$('overview').innerHTML=(overview?'跟随人物':'俯瞰全景')+' <kbd>V</kbd>';toast(overview?'鸟瞰模式：仍可移动人物，拖动可旋转全景。':'已切回人物跟随视角');}
$('overview').onclick=setOverview;
$('zoom-in').onclick=()=>{if(!cameraLocked())targetDistance=Math.max(3,targetDistance/1.22);};
$('zoom-out').onclick=()=>{if(!cameraLocked())targetDistance=Math.min(65,targetDistance*1.22);};
$('fullscreen').onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{toast('当前窗口不支持全屏，可以放大浏览器窗口游览。')}};
$('home').onclick=()=>{if(paused)return;boatMode=false;actor={x:0,z:35,height:.94,layer:'ground',mode:'walk'};boat={x:32,z:7,angle:Math.PI/2,speed:0};overview=false;yaw=.22;pitch=.49;targetDistance=10;$('overview').innerHTML='俯瞰全景 <kbd>V</kbd>';toast('已回到虹桥南街，小舟已归泊东侧码头。');canvas.focus();};
function interact(){
 if(!playing||paused)return;
 if(boatMode){const dest=getDisembark(boat,world);if(dest){actor=dest;boatMode=false;boat.speed=0;toast(actor.mode==='swim'?'已离船入水，向河岸或码头游去即可上岸。':'已在码头下船。');}}
 else if(Math.hypot(actor.x-boat.x,actor.z-boat.z)<5 && actor.height<2){boatMode=true;boat.speed=0;actor.layer='ground';toast('已登舟：W / S 划行，A / D 转向，E 下船。');}
 else if(!interactions?.activate(actor))toast('小舟停在虹桥东侧码头，走近或游近后按 E 登船。');
 if(!paused)canvas.focus();
}
$('interact-button').onclick=()=>{if(!gate.held('KeyE'))interact();};
const mapKeys={ArrowUp:'KeyW',ArrowDown:'KeyS',ArrowLeft:'KeyA',ArrowRight:'KeyD'};
// One capture router owns panel keys; keyup is always observed, including nested modals.
addEventListener('keydown',e=>{
 const fresh=gate.press(e.code,e.repeat),plain=!e.ctrlKey&&!e.metaKey&&!e.altKey;
 const routed=plain&&['KeyE','KeyI','KeyF','Escape'].includes(e.code);
 if(routed){e.preventDefault();e.stopImmediatePropagation();if(!fresh||!playing)return;
  if(e.code==='KeyI'){if(locks.top?.owner==='book')hongqiaoProgress.ui.close();else if(!hongqiaoProgress.ui.isOpen())hongqiaoProgress.ui.open();return;}
  if(e.code==='Escape'){if(locks.locked)locks.top.cancel();else showGuide();return;}
  if(e.code==='KeyE'){if(locks.top?.owner==='hqDialogue')hongqiaoProgress.dialogue.advance();else if(locks.top?.owner==='dialogue')dialogue.advance();else if(!locks.locked)interact();return;}
  if(e.code==='KeyF'){if(locks.top?.owner==='history')storefronts.closeDetails();else if(!locks.locked)storefronts.openDetails();return;}
 }
 if(locks.locked&&!(!cameraLocked()&&['KeyV','Equal','Minus','NumpadAdd','NumpadSubtract'].includes(e.code))){e.stopImmediatePropagation();if(['KeyW','KeyA','KeyS','KeyD','KeyV','Equal','Minus','NumpadAdd','NumpadSubtract'].includes(e.code))e.preventDefault();}
},true);
addEventListener('keyup',e=>{gate.release(e.code);keys.delete(mapKeys[e.code]||e.code);},true);
function resetInput(){gate.clear();clearInput();}
addEventListener('blur',resetInput);document.addEventListener('visibilitychange',resetInput);
addEventListener('keydown',e=>{
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 if(e.target instanceof HTMLButtonElement&&['Enter','Space'].includes(e.code))return;
 if(e.code==='KeyV'&&!e.repeat&&!cameraLocked())setOverview();
 if((e.code==='Equal'||e.code==='NumpadAdd')&&!cameraLocked())targetDistance=Math.max(3,targetDistance/1.15);
 if((e.code==='Minus'||e.code==='NumpadSubtract')&&!cameraLocked())targetDistance=Math.min(65,targetDistance*1.15);
 if(!paused)keys.add(mapKeys[e.code]||e.code);
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('pointerdown',e=>{if(!playing||cameraLocked())return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});dragging=true;});
canvas.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId)||!playing||cameraLocked())return;
 const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pinchDistance)targetDistance=THREE.MathUtils.clamp(targetDistance*pinchDistance/d,3,65);pinchDistance=d;}
 else{yaw-=(e.clientX-old.x)*.006;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-old.y)*.004,.10,1.27);}
});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(evt,e=>{pointers.delete(e.pointerId);pinchDistance=0;dragging=pointers.size>0;});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(playing&&!cameraLocked())targetDistance=THREE.MathUtils.clamp(targetDistance*Math.exp(e.deltaY*.0012),3,65)},{passive:false});
for(const btn of document.querySelectorAll('[data-move]')){const k=btn.dataset.move;btn.onpointerdown=e=>{e.preventDefault();if(paused)return;btn.setPointerCapture(e.pointerId);keys.add(k)};for(const ev of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(ev,()=>keys.delete(k));}
// Audio is unlocked by the entry click; explicit mute persists separately from quest progress.
const SOUND_KEY='qingming:audio:enabled';
let audioCtx,audioGain,audioMaster,audioAmbientDuck,audioMeter,soundOn=true,backgroundSource,backgroundLoad,cinemaAudioActive=false;
try{soundOn=localStorage.getItem(SOUND_KEY)!=='false';}catch{}
function refreshSoundButtons(){for(const id of ['sound','hq-cinema-sound']){const button=$(id);if(button){button.textContent='声音 '+(soundOn?'开':'关');button.setAttribute('aria-label',soundOn?'关闭声音':'开启声音');button.setAttribute('aria-pressed',String(soundOn));}}}
async function ensureAudio(){
 if(!audioCtx){
  audioCtx=new AudioContext();audioMaster=audioCtx.createGain();audioMaster.gain.value=soundOn?1:0;
  audioMeter=audioCtx.createAnalyser();audioMeter.fftSize=2048;audioMaster.connect(audioMeter);audioMeter.connect(audioCtx.destination);
  audioAmbientDuck=audioCtx.createGain();audioAmbientDuck.gain.value=cinemaAudioActive?0:1;audioAmbientDuck.connect(audioMaster);
  audioGain=audioCtx.createGain();audioGain.gain.value=.07;audioGain.connect(audioAmbientDuck);

 }
 await audioCtx.resume();refreshSoundButtons();
 if(!backgroundSource){
  backgroundLoad??=(async()=>{
   const response=await fetch(import.meta.env.BASE_URL+'assets/audio/ambience/spring_riverside_loop_30s.wav?v=27be3925d2c3');
   if(!response.ok)throw Error('背景音加载失败 HTTP '+response.status);
   const buffer=await audioCtx.decodeAudioData(await response.arrayBuffer());
   const source=audioCtx.createBufferSource();source.buffer=buffer;source.loop=true;
   source.connect(audioGain);source.start();backgroundSource=source;
  })().catch(error=>{backgroundLoad=null;throw error;});
  await backgroundLoad;
 }
}
async function setSound(enabled){
 soundOn=enabled;streetAudio?.syncGate();
 if(audioMaster){audioMaster.gain.cancelScheduledValues(audioCtx.currentTime);audioMaster.gain.setTargetAtTime(soundOn?1:0,audioCtx.currentTime,.008);}
 refreshSoundButtons();try{localStorage.setItem(SOUND_KEY,String(soundOn));}catch(e){console.warn('[Sound preference not saved]',e.message);toast('声音设置已生效，本次未能保存设置。');}
 try{await ensureAudio();}catch(e){console.warn('[Game audio unavailable]',e.message);toast('声音暂不可用，请再点一次声音按钮。');}
}
function getAudioState(){const samples=new Float32Array(audioMeter?.fftSize??0);audioMeter?.getFloatTimeDomainData(samples);return {background:{file:'spring_riverside_loop_30s.wav',loaded:!!backgroundSource,duration:backgroundSource?.buffer?.duration??0,loop:backgroundSource?.loop??false},enabled:soundOn,context:audioCtx?.state??'unavailable',currentTime:audioCtx?.currentTime??0,masterGain:audioMaster?.gain.value??0,cinemaActive:cinemaAudioActive,rms:samples.length?Math.sqrt(samples.reduce((sum,n)=>sum+n*n,0)/samples.length):0,peak:samples.reduce((peak,n)=>Math.max(peak,Math.abs(n)),0)};}
let streetAudioFrameAt=-Infinity,streetAudioResidents=[],streetAudioFerries=[];
const audioForward=new THREE.Vector3();
function getStreetAudioFrame(){
 if(elapsed-streetAudioFrameAt>=.09){
  streetAudioFrameAt=elapsed;const snapshot=streetLife.snapshot(),visuals=new Map(snapshot.replacements.map(n=>[n.npcId,n]));
  streetAudioResidents=snapshot.people.map(p=>({...visuals.get(p.id),id:p.id,assetId:p.assetId,active:p.active!==false,x:p.x,y:p.y??.94,z:p.z,angle:p.angle,dynamic:!!p.route,walking:p.walking,waiting:p.waiting}));
  for(const n of hongqiaoProgress.getAudioResidents()){const p=n.position;streetAudioResidents.push({...n.asset,id:n.id,assetId:n.asset?.assetId,active:scene.getObjectByName(n.id)?.visible!==false,x:p[0],y:p[1],z:p[2]});}
  streetAudioResidents.push({...jiaodian.body(),assetId:'QMSH-16',active:scene.getObjectByName('npc_jiaodian_waiter')?.visible!==false});
  streetAudioFerries=snapshot.ferries.map(f=>({x:f.x,z:f.z}));
 }
 camera.getWorldDirection(audioForward);
 return {enabled:soundOn,playing,paused,hidden:document.hidden,cinema:cinemaAudioActive||cinema?.isActive(),moving,listener:{x:actor.x,y:actor.height+1.4,z:actor.z},forward:{x:audioForward.x,y:audioForward.y,z:audioForward.z},people:streetAudioResidents,ferries:streetAudioFerries,shops:world.shops};
}
document.addEventListener('visibilitychange',()=>streetAudio?.syncGate());
$('sound').onclick=()=>setSound(!soundOn);refreshSoundButtons();
function updateActor(dt){
 const previousPosition={x:actor.x,z:actor.z};
 const forward=(keys.has('KeyW')?1:0)-(keys.has('KeyS')?1:0),side=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0);
 moving=!!(forward||side);
 if(boatMode){
  boat=moveBoat(boat,forward,side,dt,world);actor.x=boat.x;actor.z=boat.z;actor.height=.47;actorAngle=boat.angle;
 }else if(moving){
  const s=actor.mode==='swim'?(keys.has('ShiftLeft')||keys.has('ShiftRight')?3.1:2):(keys.has('ShiftLeft')||keys.has('ShiftRight')?5.2:2.7);
  const n=Math.max(1,Math.hypot(forward,side));const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)/n*s*dt,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)/n*s*dt;
  actor=streetLife.resolvePlayer(actor,moveActor(actor,dx,dz,world));const target=Math.atan2(dx,dz);actorAngle+=Math.atan2(Math.sin(target-actorAngle),Math.cos(target-actorAngle))*Math.min(1,dt*12);
 }
 const mode=boatMode?'boat':actor.mode;
 if(mode==='walk')moving=Math.hypot(actor.x-previousPosition.x,actor.z-previousPosition.z)/Math.max(dt,1e-6)>motionConfig.movingSpeedThreshold;
 if(mode!==lastMode){if(mode==='swim')toast('已进入汴水。继续向浅滩或码头游，即可上岸。');lastMode=mode;}
 phase+=dt*(mode==='swim'?5:mode==='boat'?4:8)*(moving?1:.2);
 player.position.set(actor.x,mode==='swim'?-.07:actor.height+(moving&&mode==='walk'?Math.abs(Math.sin(phase))*.035:0),actor.z);
 player.rotation.y=actorAngle;scholar.update(dt,mode,moving,phase,keys.has('ShiftLeft')||keys.has('ShiftRight'));
 if(mode==='swim')player.position.add(new THREE.Vector3(-Math.sin(actorAngle)*.65,0,-Math.cos(actorAngle)*.65));
 skiff.position.set(boat.x,river.height(boat.x,boat.z,elapsed)-.05,boat.z);skiff.rotation.set(Math.sin(elapsed*1.3)*.012,boat.angle,Math.sin(elapsed*1.9)*.013);
 skiff.traverse(o=>{if(o.name.startsWith('paddle')){o.rotation.z=boatMode&&moving?Math.sin(phase)*.45:0;o.rotation.y=boatMode&&moving?Math.cos(phase)*.22:0;}});
 marker.visible=mode==='walk';marker.position.set(actor.x,actor.height+.025,actor.z);

 if(audioGain&&soundOn)audioGain.gain.setTargetAtTime(.07,audioCtx.currentTime,.4);
 if(!boatMode)boat.speed=0;
}
let heroPosition=[30,38,65],heroTarget=[0,0,18],heroFov=36;
function updateCamera(dt){
 if(!playing){if(camera.fov!==heroFov){camera.fov=heroFov;camera.updateProjectionMatrix();}camera.position.set(...heroPosition);camera.lookAt(...heroTarget);return;}
 if(camera.fov!==(overview?32:48)){camera.fov=overview?32:48;camera.updateProjectionMatrix();}
 distance=THREE.MathUtils.lerp(distance,targetDistance,1-Math.exp(-dt*8));
 temp.set(actor.x,boatMode?1.6:actor.mode==='swim'?.65:actor.height+1.35,actor.z);focus.lerp(temp,1-Math.exp(-dt*7));
 if(overview){camGoal.set(Math.sin(yaw)*distance*2.2,Math.max(15,distance*1.1),Math.cos(yaw)*distance*2.2);camGoal.add(new THREE.Vector3(focus.x*.25,0,focus.z*.25));temp.set(focus.x*.25,2,focus.z*.25);}
 else{
  const dist=distance*(boatMode?1.32:1),hor=Math.cos(pitch)*dist;
  camGoal.set(focus.x+Math.sin(yaw)*hor,focus.y+Math.sin(pitch)*dist,focus.z+Math.cos(yaw)*hor);temp.copy(focus);
  // Sample the camera segment against building volumes to avoid viewing through interiors.
  const delta=camGoal.clone().sub(focus);let safe=1;
  for(let t=.08;t<=1;t+=.04){const p=focus.clone().addScaledVector(delta,t);if(world.colliders.some(c=>c.kind==='house'&&Math.abs(p.x-c.x)<c.w/2+.7&&Math.abs(p.z-c.z)<c.d/2+.7&&p.y<c.h+1)){safe=Math.max(.15,t-.06);break;}}
  if(safe<1)camGoal.copy(focus).addScaledVector(delta,safe);
  camGoal.y=Math.max(.65,camGoal.y);
 }
 camera.position.lerp(camGoal,1-Math.exp(-dt*8));camera.lookAt(temp);
}
function updateHUD(){
 const mode=boatMode?'泛舟':actor.mode==='swim'?'游泳':'步行';
 let place=actor.layer==='bridge'?'汴水虹桥':boatMode||actor.mode==='swim'?'汴河水道':actor.z<0?'北岸街市':'虹桥南街';
 if(!boatMode&&Math.hypot(actor.x-32,actor.z-14)<8)place='东岸码头';
 $('place').textContent=place;$('activity').textContent=mode+' · 书生阿青';
 const nearby=Math.hypot(actor.x-boat.x,actor.z-boat.z)<5 && actor.height<2;
 $('interaction').hidden=paused||!(boatMode||nearby);$('interact-label').textContent=boatMode?(world.docks.some(d=>Math.hypot(d.x-boat.x,d.z-boat.z)<d.d/2+4.3)?'靠岸下船':'离船入水'):'登上小舟';
 if(!boatMode&&!nearby&&!paused){const focused=interactions?.focus(actor);if(focused){$('interaction').hidden=false;$('interact-label').textContent=focused.label;}}
 $('shift-hint').style.opacity=boatMode?'.35':'1';drawMap();
}
function drawMap(){
 const ctx=$('map').getContext('2d'),w=200,h=150,sc=.99;
 const px=x=>w/2+x*sc,py=z=>h/2+z*.86;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#546456';ctx.fillRect(8,8,184,134);ctx.fillStyle='#345d5c';ctx.fillRect(8,py(-16),184,32*.86);
 ctx.fillStyle='#78806a';for(const c of world.colliders)if(c.kind==='house')ctx.fillRect(px(c.x-c.w/2),py(c.z-c.d/2),c.w*sc,c.d*.86);
 ctx.fillStyle='#c1a477';ctx.fillRect(px(-3.8),py(-18),7.6*sc,36*.86);
 ctx.fillStyle='#a88e68';for(const d of world.docks)ctx.fillRect(px(d.x-d.w/2),py(d.z-d.d/2),d.w*sc,d.d*.86);
 ctx.fillStyle='#d6b36f';ctx.beginPath();ctx.arc(px(boat.x),py(boat.z),2.5,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(px(actor.x),py(actor.z));ctx.rotate(-actorAngle);ctx.fillStyle='#f2e6c7';ctx.beginPath();ctx.moveTo(0,5);ctx.lineTo(-3,-3);ctx.lineTo(3,-3);ctx.closePath();ctx.fill();ctx.restore();
 ctx.strokeStyle='#e9d2a8';ctx.lineWidth=1;ctx.beginPath();ctx.arc(px(actor.x),py(actor.z),6,0,Math.PI*2);ctx.stroke();
}
function tick(ms){
 requestAnimationFrame(tick);const dt=Math.min((ms-last)/1000||.016,.05);last=ms;
 if(!paused)elapsed+=dt;
 if(loaded){
  streetLife.setViewCamera(cinema?.getCamera()??camera);sceneryAssets?.update(cinema?.getCamera()??camera);
  landscape?.update(elapsed);
  if(!paused){if(playing)updateActor(dt);else{scholar.update(dt,'walk',false,0);player.position.set(0,.94,35);skiff.position.set(boat.x,0,boat.z);skiff.rotation.y=boat.angle;}
   lifeAccumulator+=dt;if(lifeAccumulator>=1/30){streetLife.update(elapsed,lifeAccumulator,boat);lifeAccumulator=0;}
   river.update(elapsed,dt,boat,actor,boatMode,moving,streetLife.ferries);
   storefronts.update(elapsed,actor,playing&&!boatMode);

  }
  hongqiaoProgress?.update?.(dt);
  cinema?.update();
  if(cinema?.isActive()){streetLife.setViewCamera(cinema.getCamera());streetLife.update(elapsed,0,boat);cinema.stage.updateProxy();}
  window.__hongqiao?.update();
  window.__motionDebug?.update();
  updateCamera(dt);streetAudio?.update();mapTime+=dt;if(playing&&mapTime>.12){updateHUD();mapTime=0;}
 }else updateCamera(dt);
 if(elapsed-lastShadowUpdate>.1){sun.shadow.needsUpdate=true;lastShadowUpdate=elapsed;}
 renderer.info.reset();atmosphere.render(cinema?.getCamera());fpsFrames++;if(ms-fpsAt>1000){fps=Math.round(fpsFrames*1000/(ms-fpsAt));fpsFrames=0;fpsAt=ms;}
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);atmosphere.resize();});
boot();requestAnimationFrame(tick);
