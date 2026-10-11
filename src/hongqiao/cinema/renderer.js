import * as THREE from 'three';
import {sampleIntro,sampleEnding,finalPose,smooth,clamp} from './timeline.js';
import {createCinemaScene} from './scene.js';
import './style.css';
import {createCinemaAudio} from './audio.js';
const V=a=>new THREE.Vector3(...a);
const subtitles=[['船到桥下，怎么停了？'],[''],['船工：莫牵了！'],['桅杆未落。'],['纤夫走神，忘了松绳降桅。'],['桥上人：快降桅！当心脚下！'],['接住绳！'],['松绳！','缓缓放——','稳住！'],['老周：郎君，劳你搭把手。']];
export async function createCinemaRenderer(options){
 const {gameCamera,controls,player,world}=options,stage=await createCinemaScene(options),camera=gameCamera.clone();camera.name='HQ temporary cinematic camera';const audio=await createCinemaAudio(options.baseURL,controls);
 const overlay=document.createElement('section');overlay.id='hq-cinema';overlay.hidden=true;overlay.innerHTML='<div id="hq-cinema-heading"></div><div id="hq-cinema-flashback">片刻前</div><div id="hq-cinema-subtitle" role="status"></div><div id="hq-cinema-controls"><button id="hq-cinema-sound" aria-label="关闭声音">声音 开</button><button id="hq-cinema-watch">观看过桥</button><button id="hq-cinema-skip">跳过</button><button id="hq-cinema-resume" hidden>点击继续</button></div>';document.body.append(overlay);
 const heading=overlay.querySelector('#hq-cinema-heading'),flashback=overlay.querySelector('#hq-cinema-flashback'),subtitle=overlay.querySelector('#hq-cinema-subtitle'),watch=overlay.querySelector('#hq-cinema-watch'),skip=overlay.querySelector('#hq-cinema-skip'),resume=overlay.querySelector('#hq-cinema-resume');
 let current=null,time=0,last=performance.now(),paused=false,pausedAudio=false,snapshot=null,watchSnapshot=null,optionalCamera=false,returnState=null,playerRotation=null,frameCount=0,shotVisits=[],maxFrameSeconds=0; 
 let onSkip=()=>{},state={shipState:'waiting',introSeen:false},lastSubtitle='';
 function cameraAt(position,target,fov=48){camera.position.fromArray(position);camera.lookAt(V(target));camera.fov=fov;camera.aspect=gameCamera.aspect;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);}
 function introCamera(p){
  const t=p.time,x=p.shipX,c=stage.contact,bracer=stage.performers.bracer.root.getWorldPosition(new THREE.Vector3());
  switch(p.shot){
   case 0:cameraAt([26-t*.5,16.8-t*.12,-30+t*.45],[4.5,4.4,0],48);break;
   case 1:cameraAt([c.x+1.9,c.y-.45,c.z-2.3],c.toArray(),32);break;
   case 2:cameraAt([bracer.x+1.8,4.2,-3.8],[bracer.x-.5,4.05,bracer.z+.1],29);break;
   case 3:cameraAt([7.4,7.9,-3.6],[4.9,7.6,0],32);break;
   case 4:{const tx=stage.performers.towA.root.position.x;cameraAt([tx+.8,2.5,15.3],[tx+.85,2.3,19],34);break;}
   case 5:cameraAt([4.8,10.0,-2.9],[3.4,9.78,-1.3],28);break;
   case 6:cameraAt([22,17,-24],[6,5.9,.5],44);break;
   case 7:cameraAt([23,17,-29],[7,4.4,3],49);break;
   case 8:{
    const s=smooth((t-27)/3),target=V([player.position.x,player.position.y+1.4,player.position.z]);
    const backward=new THREE.Vector3(0,0,1).applyQuaternion(snapshot.camera.quaternion);backward.y=0;backward.normalize();
    const near=target.clone().addScaledVector(backward,2.6);near.y=target.y+.1;
    camera.position.copy(near).lerp(snapshot.camera.position,s);camera.lookAt(target.clone().add(V([2,0,-4.5])));
    camera.quaternion.slerp(snapshot.camera.quaternion,s);camera.fov=THREE.MathUtils.lerp(45,snapshot.camera.fov,s);camera.aspect=gameCamera.aspect;camera.updateProjectionMatrix();
    player.rotation.y=THREE.MathUtils.lerp(playerRotation.y,Math.PI+.2,Math.sin(s*Math.PI)*.35);break;
   }
  }
 }
 function renderAt(t){
  const p=current.kind==='intro'?sampleIntro(t):sampleEnding(t);audio.update(t);stage.apply(p,current.kind);
  controls.setBridgeAlarm?.(current.kind==='intro'&&t<27?{time:t,target:{x:p.shipX-5,y:7,z:0}}:null);
  controls.setCinematicFocus?.(current.kind==='intro'&&t>=27?{from:{x:player.position.x,z:player.position.z},to:{x:6,z:19}}:null);
  if(current.kind==='intro')introCamera(p);else if(optionalCamera)cameraAt([20,25,-43],[-2,3,0],49);
  if(shotVisits.at(-1)?.shot!==(p.shot??'ending'))shotVisits.push({shot:p.shot??'ending',time:t});
  flashback.hidden=!p.flashback;heading.textContent=current.kind==='intro'?(p.shot===0?'北宋 · 汴京':'虹桥急情'):'虹桥急情 · 船过虹桥';
  const text=current.kind==='intro'?subtitles[p.shot][p.shot===7?(t<21?0:t<25?1:2):0]:t<3?'老周：都备齐了，看准了再走！':t<12?'':t<16?'阿成：过了！过桥了！':'老周：好，慢慢靠岸！';
  if(text!==lastSubtitle){subtitle.textContent=text;lastSubtitle=text;}subtitle.hidden=!text;overlay.dataset.shot=String(p.shot??'ending');overlay.dataset.time=t.toFixed(3);
  return p;
 }
 function begin(kind,event){
  if(current)throw Error('Overlapping cinematics');snapshot=controls.capture();playerRotation=player.rotation.clone();watchSnapshot=null;optionalCamera=false;returnState={...state};current={kind,...event};audio.begin(kind);time=0;last=performance.now();paused=false;pausedAudio=false;frameCount=0;shotVisits=[];maxFrameSeconds=0;
  overlay.querySelector('#hq-cinema-sound').textContent='声音 '+(controls.audioEnabled()?'开':'关');overlay.querySelector('#hq-cinema-sound').setAttribute('aria-label',controls.audioEnabled()?'关闭声音':'开启声音');
  overlay.hidden=false;watch.hidden=kind==='intro';watch.textContent='观看过桥';resume.hidden=true;document.body.classList.add('hq-cinematic');document.body.classList.toggle('hq-intro',kind==='intro');renderAt(0);
 }
 function cleanup(){
  if(!current)return;audio.stop();controls.setCinematicFocus?.(null);controls.setBridgeAlarm?.(null);
  if(current.kind==='intro'||current.review)controls.restore(snapshot);else if(watchSnapshot)controls.restore(watchSnapshot);
  player.rotation.copy(playerRotation);controls.waitForRelease();overlay.hidden=true;document.body.classList.remove('hq-cinematic','hq-intro','hq-watching');lastSubtitle='';controls.pauseAudio(false);current=null;optionalCamera=false;watchSnapshot=null;pausedAudio=false;
 }
 function finish(){if(!current)return;const event=current;cleanup();event.finish();}
 watch.onclick=()=>{if(!current||current.kind!=='ending')return;if(optionalCamera){controls.restore(watchSnapshot);watchSnapshot=null;optionalCamera=false;watch.textContent='观看过桥';document.body.classList.remove('hq-watching');}else{watchSnapshot=controls.capture();optionalCamera=true;watch.textContent='返回自由视角';document.body.classList.add('hq-watching');renderAt(time);}};
 overlay.querySelector('#hq-cinema-sound').onclick=()=>controls.toggleAudio();
 skip.onclick=()=>onSkip();resume.onclick=async()=>{try{await controls.pauseAudio(false);pausedAudio=false;resume.hidden=true;last=performance.now();}catch{pausedAudio=true;}};
 const adapter={
  applyState(next){state={...next};if(!current)stage.apply(finalPose(state),state.shipState??'waiting');},
  playIntro:event=>begin('intro',event),playEnding:event=>begin('ending',event),
  allowsGameCamera:()=>current?.kind==='ending'&&!optionalCamera&&!paused&&!pausedAudio,
  cancel(){cleanup();},
  setPaused(value){paused=value;last=performance.now();if(value){if(watchSnapshot){controls.restore(watchSnapshot);watchSnapshot=null;optionalCamera=false;watch.textContent='观看过桥';document.body.classList.remove('hq-watching');}controls.pauseAudio(true);return;}Promise.resolve(controls.pauseAudio(false)).catch(()=>{pausedAudio=true;resume.hidden=false;});},
 };
 return {adapter,stage,setSkip:fn=>{onSkip=fn;},
  update(){stage.updateProxy();const now=performance.now(),dt=Math.max(0,(now-last)/1000);last=now;if(!current)return;if(paused||pausedAudio||document.hidden||!document.hasFocus())return;frameCount++;maxFrameSeconds=Math.max(maxFrameSeconds,dt);time=Math.min(audio.getTime()??time+dt,current.kind==='intro'?30:20);const p=renderAt(time);if(p.done)finish();},
  isActive:()=>!!current,
  getCamera:()=>current&&(current.kind==='intro'||optionalCamera)?camera:gameCamera,
  allowsGameCamera:()=>current?.kind==='ending'&&!optionalCamera&&!paused&&!pausedAudio,
  getState:()=>({running:current?.kind??null,audio:audio.getState(),time,paused,pausedAudio,optionalCamera,frames:frameCount,shotVisits,maxFrameSeconds,scene:stage.getState(),camera:{position:camera.position.toArray(),quaternion:camera.quaternion.toArray(),fov:camera.fov},savedCamera:snapshot?{position:snapshot.camera.position.toArray(),quaternion:snapshot.camera.quaternion.toArray(),fov:snapshot.camera.fov}:null}),
  // Explicit DEV verification can seek keyframes; production uses only real elapsed time.
  seek(t){if(!current)return;time=clamp(t,0,current.kind==='intro'?30:20);last=performance.now();audio.seek(time);renderAt(time);},
 };
}
