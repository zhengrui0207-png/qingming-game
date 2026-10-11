// Named, user-supplied audio only. Conditional cues remain disabled in the manifest.
export const streetAudioConfig=Object.freeze({maxVoices:2,maxSources:6,updateInterval:.1,entryDelay:[.8,2.5]});
export function distanceTo(a,b){return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}
export function isYieldingTo(npc,listener){
 const dx=listener.x-npc.x,dz=listener.z-npc.z,d=Math.hypot(dx,dz);
 return !!npc.dynamic&&(npc.walking||npc.waiting>.3)&&d>.15&&d<3.4&&Math.abs(listener.y-(npc.y+1.4))<1.8&&
  (dx*Math.sin(npc.angle??0)+dz*Math.cos(npc.angle??0))/d>.3;
}
export function crossedAnimationCue(previous,current,entry){
 if(current?.clip!==entry.clip||!(current.clipDuration>0)||current.occupationWeight<.65||current.visible===false)return false;
 const f=current.clipTime/current.clipDuration;
 if(!previous||previous.clip!==entry.clip)return f>=entry.fraction&&f<entry.fraction+.12;
 if(current.frames===previous.frames)return false;
 const old=previous.clipTime/previous.clipDuration;
 return f>=entry.fraction&&(old<entry.fraction||f<old);
}
const smooth=(p,value,t,s=.08)=>{p.cancelScheduledValues(t);p.setTargetAtTime(value,t,s);};
const point=n=>({x:n.x,y:n.y+1.4,z:n.z});

export function createStreetAudio({manifest,baseURL='',getContext,getDestination,getFrame,blocked=()=>false,random=Math.random,fetcher=globalThis.fetch}){
 const entries=manifest.files.filter(e=>e.enabled),buffers=new Map(),pending=new Set(),sources=new Map(),timers=new Map(),events=[],errors=[],lastAnimations=new Map();
 let latest=null,allowed=false,epoch=0,bus=null,meter=null,busContext=null,lastScan=-Infinity,disposed=false;
 const range=(a,b)=>a+random()*(b-a);
 function log(e){events.push(e);if(events.length>100)events.shift();}
 function busFor(ctx){if(busContext!==ctx){busContext=ctx;bus=ctx.createGain();bus.gain.value=0;meter=ctx.createAnalyser?.();if(meter){meter.fftSize=1024;bus.connect(meter);meter.connect(getDestination());}else bus.connect(getDestination());}return bus;}
 function rms(){if(!meter)return 0;const a=new Float32Array(meter.fftSize);meter.getFloatTimeDomainData(a);return Math.sqrt(a.reduce((s,n)=>s+n*n,0)/a.length);}
 function targetFor(entry,npcId,frame){
  if(entry.anchor==='tavern'){const s=frame.shops.find(s=>s.id===1);return s?{x:s.front.x,y:2,z:s.front.z}:null;}
  if(entry.anchor==='nearest-ferry'){
   const f=[...frame.ferries].sort((a,b)=>distanceTo(frame.listener,{x:a.x,y:.3,z:a.z})-distanceTo(frame.listener,{x:b.x,y:.3,z:b.z}))[0];
   return f?{x:f.x,y:.3,z:f.z}:null;
  }
  const n=frame.people.find(n=>n.id===npcId&&n.assetId===entry.assetId&&n.active!==false);
  return n&&Number.isFinite(n.x)&&Number.isFinite(n.z)?point(n):null;
 }
 function fadeStop(key){const s=sources.get(key);if(!s||s.stopping)return;s.stopping=true;smooth(s.gain.gain,0,getContext().currentTime,.04);try{s.source.stop(getContext().currentTime+.18);}catch{};}
 function halt(){epoch++;pending.clear();for(const k of sources.keys())fadeStop(k);}
 function syncGate(){
  if(disposed)return false;
  const f=getFrame(),ctx=getContext();latest=f;
  const ok=!!(f?.enabled&&f.playing&&!f.paused&&!f.hidden&&!f.cinema&&ctx?.state==='running');
  if(ok!==allowed){allowed=ok;if(!ok){halt();for(const t of timers.values())t.due=Math.max(t.due,(ctx?.currentTime??0)+1.2);}}
  if(bus&&ctx)smooth(bus.gain,ok?1:0,ctx.currentTime,.04);
  return ok;
 }
 async function load(entry,ctx){
  if(!buffers.has(entry.id))buffers.set(entry.id,(async()=>{
   const response=await fetcher(baseURL+'assets/audio/street/'+entry.file+'?v='+entry.sha256.slice(0,12));
   if(!response.ok)throw Error('HTTP '+response.status);
   return ctx.decodeAudioData(await response.arrayBuffer());
  })().catch(e=>{errors.push({id:entry.id,error:e.message});log({type:'error',id:entry.id,error:e.message});return null;}));
  return buffers.get(entry.id);
 }
 function level(s,frame){
  const p=targetFor(s.entry,s.npcId,frame);if(!p)return null;
  const d=distanceTo(frame.listener,p),occluded=blocked(frame.listener,p);
  const edge=Math.max(0,Math.min(1,(s.entry.exitRadius-d)/4));
  return {p,d,occluded,value:s.entry.gain*edge*(occluded?.25:1)};
 }
 async function play(entry,npcId,key){
  const ctx=getContext(),token=epoch;if(!ctx||pending.has(key)||sources.has(key))return;
  pending.add(key);const buffer=await load(entry,ctx);
  // Loading can finish after mute, leaving the area, a dialogue, or another cue.
  if(token!==epoch)return;
  pending.delete(key);if(!buffer||!syncGate()||token!==epoch)return;
  const p=targetFor(entry,npcId,latest);if(!p||distanceTo(latest.listener,p)>entry.radius||sources.size>=streetAudioConfig.maxSources)return;
  const npc=latest.people.find(n=>n.id===npcId);
  if(entry.trigger==='yield'&&!isYieldingTo(npc??{},latest.listener))return;
  if(entry.trigger==='animation'&&(npc?.clip!==entry.clip||npc.occupationWeight<.65||npc.visible===false))return;
  if(entry.kind==='voice'&&[...sources.values()].filter(s=>s.entry.kind==='voice'&&!s.stopping).length>=streetAudioConfig.maxVoices)return;
  const source=ctx.createBufferSource(),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),pan=ctx.createPanner();
  source.buffer=buffer;source.loop=entry.trigger==='loop';gain.gain.value=0;filter.type='lowpass';filter.frequency.value=19000;
  pan.panningModel='HRTF';pan.distanceModel='inverse';pan.refDistance=3;pan.rolloffFactor=1;pan.maxDistance=entry.exitRadius;
  source.connect(filter);filter.connect(gain);gain.connect(pan);pan.connect(busFor(ctx));
  const s={entry,npcId,key,source,gain,filter,pan,startedAt:ctx.currentTime,stopping:false,distance:0,level:0};sources.set(key,s);
  source.onended=()=>{sources.delete(key);[source,filter,gain,pan].forEach(n=>n.disconnect());log({type:'end',id:entry.id,npcId,at:ctx.currentTime});};
  positionSource(s,latest);smooth(bus.gain,1,ctx.currentTime,.04);source.start();
  log({type:'play',id:entry.id,npcId,at:ctx.currentTime,duration:buffer.duration,position:p});
 }
 function positionSource(s,frame){
  const value=level(s,frame);if(!value||value.d>s.entry.exitRadius){fadeStop(s.key);return;}
  const ctx=getContext(),{p,d,occluded}=value;
  for(const axis of ['x','y','z'])smooth(s.pan['position'+axis.toUpperCase()],p[axis],ctx.currentTime,.035);
  smooth(s.gain.gain,value.value,ctx.currentTime,.08);smooth(s.filter.frequency,occluded?1300:19000,ctx.currentTime,.12);
  s.distance=d;s.level=value.value;s.position=p;s.occluded=occluded;
 }
 function listener(frame){
  const ctx=getContext(),l=ctx.listener,t=ctx.currentTime,p=frame.listener,f=frame.forward;
  if(l.positionX){for(const axis of ['x','y','z']){smooth(l['position'+axis.toUpperCase()],p[axis],t,.025);smooth(l['forward'+axis.toUpperCase()],f[axis],t,.025);}smooth(l.upX,0,t);smooth(l.upY,1,t);smooth(l.upZ,0,t);}
  else {l.setPosition(p.x,p.y,p.z);l.setOrientation(f.x,f.y,f.z,0,1,0);}
 }
 function update(){
  if(!syncGate())return;const ctx=getContext(),now=ctx.currentTime;listener(latest);
  // Check audible range every frame, even between cue scheduling scans.
  for(const s of sources.values()){
   if(s.stopping)continue;
   const n=latest.people.find(n=>n.id===s.npcId);
   if(s.entry.trigger==='animation'&&(n?.clip!==s.entry.clip||n.occupationWeight<.4||n.visible===false)){fadeStop(s.key);continue;}
   positionSource(s,latest);
  }
  if(now-lastScan<streetAudioConfig.updateInterval)return;lastScan=now;
  const candidates=[];
  for(const e of entries){
   const targets=e.anchor?[e.npcId]:e.npcIds;
   for(const id of targets){
    const key=e.id+'@'+id,p=targetFor(e,id,latest),d=p?distanceTo(p,latest.listener):Infinity;
    let state=timers.get(key);if(!state){state={inside:false,due:0,greeted:false};timers.set(key,state);}
    if(d>e.exitRadius){state.inside=false;state.greeted=false;continue;}
    if(d>e.radius&&!state.inside)continue;
    if(!state.inside){state.inside=true;state.due=Math.max(state.due,now+range(...streetAudioConfig.entryDelay));}
    if(d>e.radius||sources.has(key)||pending.has(key)||now<state.due)continue;
    const n=latest.people.find(n=>n.id===id);
    if(e.trigger==='greeting'&&(state.greeted||latest.moving))continue;
    if(e.trigger==='yield'&&!isYieldingTo(n??{},latest.listener))continue;
    if(e.trigger==='animation'&&!crossedAnimationCue(lastAnimations.get(id),n,e))continue;
    candidates.push({e,id,key,d,state});
   }
  }
  candidates.sort((a,b)=>a.d-b.d);
  let voices=[...sources.values()].filter(s=>s.entry.kind==='voice'&&!s.stopping).length+[...pending].filter(k=>k.startsWith('VO_')).length;
  const reservedFiles=new Set([...sources.values()].map(s=>s.entry.id));for(const k of pending)reservedFiles.add(k.split('@')[0]);
  for(const {e,id,key,state}of candidates){
   if(sources.size+pending.size>=streetAudioConfig.maxSources)break;
   if(reservedFiles.has(e.id)||e.kind==='voice'&&voices>=streetAudioConfig.maxVoices)continue;
   reservedFiles.add(e.id);if(e.kind==='voice')voices++;
   state.due=now+range(...e.cooldown);if(e.trigger==='greeting')state.greeted=true;
   void play(e,id,key);
  }
  lastAnimations.clear();for(const n of latest.people)lastAnimations.set(n.id,{clip:n.clip,clipTime:n.clipTime,clipDuration:n.clipDuration,frames:n.frames});
 }
 return {update,syncGate,getState:()=>({enabled:allowed,rms:rms(),loaded:buffers.size,pending:pending.size,bindings:entries.length,deferred:manifest.files.filter(e=>!e.enabled).map(e=>({id:e.id,reason:e.reason})),errors:[...errors],active:[...sources.values()].map(s=>({id:s.entry.id,npcId:s.npcId,kind:s.entry.kind,distance:s.distance,level:s.level,position:s.position,occluded:s.occluded,stopping:s.stopping})),events:[...events]}),dispose(){disposed=true;allowed=false;halt();bus?.disconnect();meter?.disconnect();}};
}
