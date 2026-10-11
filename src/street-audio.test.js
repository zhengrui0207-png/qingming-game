import test from 'node:test';
import assert from 'node:assert/strict';
import {createStreetAudio,isYieldingTo,crossedAnimationCue} from './street-audio.js';

const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;}});
function harness(entries,fetcher=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)})){
 const created=[];
 const node=()=>({gain:param(),frequency:param(),connect(){},disconnect(){}});
 const ctx={currentTime:0,state:'running',listener:Object.fromEntries(['positionX','positionY','positionZ','forwardX','forwardY','forwardZ','upX','upY','upZ'].map(k=>[k,param()])),createGain:node,createBiquadFilter:node,
  createPanner:()=>({...node(),positionX:param(),positionY:param(),positionZ:param()}),
  createBufferSource(){const s={...node(),start(){s.started=true;},stop(){s.stopped=true;}};created.push(s);return s;},decodeAudioData:async()=>({duration:3})};
 const frame={enabled:true,playing:true,paused:false,hidden:false,cinema:false,moving:false,listener:{x:0,y:2.34,z:0},forward:{x:0,y:0,z:-1},people:entries.map((e,i)=>({id:e.npcId,assetId:e.assetId,active:true,x:i+1,y:.94,z:0})),ferries:[],shops:[]};
 const audio=createStreetAudio({manifest:{files:entries},getContext:()=>ctx,getDestination:()=>node(),getFrame:()=>frame,random:()=>0,fetcher});
 return {audio,frame,ctx,created,async tick(t){ctx.currentTime=t;audio.update();await new Promise(r=>setImmediate(r));}};
}
const cue=(i,more={})=>({id:'VO_'+i,npcId:'npc-'+i,npcIds:['npc-'+i],assetId:'QMSH-17',enabled:true,trigger:'proximity',kind:'voice',file:'test.wav',sha256:'123456789012',radius:10,exitRadius:14,cooldown:[35,50],gain:1,...more});

test('nearest voices capped at two, duplicate updates do not reschedule',async()=>{
 const h=harness([cue(1),cue(2),cue(3)]);await h.tick(0);await h.tick(1);await h.tick(1.2);
 assert.equal(h.created.filter(s=>s.started).length,2);assert.deepEqual(h.audio.getState().active.map(s=>s.npcId),['npc-1','npc-2']);
});
test('disabled/wrong-identity/inactive bindings never play',async()=>{
 const h=harness([cue(1,{enabled:false}),cue(2),cue(3)]);h.frame.people[1].assetId='QMSH-45';h.frame.people[2].active=false;
 await h.tick(0);await h.tick(1);assert.equal(h.created.length,0);
});
test('mute while loading cannot emit a late voice',async()=>{
 let resolve;const h=harness([cue(1)],()=>new Promise(r=>{resolve=r;}));await h.tick(0);await h.tick(1);
 h.frame.enabled=false;h.audio.syncGate();resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await h.tick(2);assert.equal(h.created.length,0);
});
test('leaving while loading rejects obsolete proximity',async()=>{
 let resolve;const h=harness([cue(1)],()=>new Promise(r=>{resolve=r;}));await h.tick(0);await h.tick(1);h.frame.listener.x=50;
 resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await h.tick(2);assert.equal(h.created.length,0);
});
test('muting, dialogue, cinema and hidden tab stop sources; leaving fades',async()=>{
 for(const reason of ['paused','hidden','cinema','enabled','distance']){
  const h=harness([cue(1)]);await h.tick(0);await h.tick(1);assert.equal(h.created.length,1);
  if(reason==='enabled')h.frame.enabled=false;else if(reason==='distance')h.frame.listener.x=40;else h.frame[reason]=true;
  await h.tick(2);assert.equal(h.created[0].stopped,true,reason);
 }
});
test('greeting once per visit, cooldown survives brief exit',async()=>{
 const h=harness([cue(1,{trigger:'greeting'})]);await h.tick(0);await h.tick(1);h.created[0].onended();
 await h.tick(40);assert.equal(h.created.length,1);
 h.frame.listener.x=40;await h.tick(41);h.frame.listener.x=0;await h.tick(42);await h.tick(43);assert.equal(h.created.length,2);
 h.created[1].onended();h.frame.listener.x=40;await h.tick(44);h.frame.listener.x=0;await h.tick(45);await h.tick(47);assert.equal(h.created.length,2);
});
test('missing audio is isolated and not fetched every frame',async()=>{
 let calls=0;const h=harness([cue(1)],async()=>{calls++;return {ok:false,status:404};});await h.tick(0);await h.tick(1);await h.tick(40);
 assert.equal(calls,1);assert.equal(h.audio.getState().errors.length,1);assert.equal(h.created.length,0);
});
test('yield requires moving/blocked porter, front and same level',()=>{
 const n={dynamic:true,walking:true,x:0,y:.94,z:0,angle:0};assert.ok(isYieldingTo(n,{x:0,y:2.34,z:2}));
 assert.equal(isYieldingTo({...n,dynamic:false},{x:0,y:2.34,z:2}),false);
 assert.equal(isYieldingTo(n,{x:0,y:2.34,z:-2}),false);assert.equal(isYieldingTo(n,{x:0,y:8,z:2}),false);
});
test('SFX phase crossing requires real advancing occupation and skin pose',()=>{
 const e={clip:'Occupation_Tea_Pour',fraction:.3},prev={clip:e.clip,clipTime:1,clipDuration:5,frames:1},now={...prev,clipTime:2,frames:2,occupationWeight:1,visible:true};
 assert.ok(crossedAnimationCue(prev,now,e));assert.equal(crossedAnimationCue(now,now,e),false);
 assert.equal(crossedAnimationCue(prev,{...now,clip:'Idle'},e),false);assert.equal(crossedAnimationCue(prev,{...now,visible:false},e),false);
});

test('flower cue stops within a scheduling interval after crossing six metres',async()=>{
 const h=harness([cue(7,{radius:4.5,exitRadius:6})]);await h.tick(0);await h.tick(1);
 assert.equal(h.created[0].started,true);h.frame.listener.x=7.2;await h.tick(1.01);
 assert.equal(h.created[0].stopped,true);assert.equal(h.audio.getState().active[0].stopping,true);
});
test('delivery greeting is positioned at the tavern entrance and stops on departure',async()=>{
 const h=harness([cue(18,{anchor:'tavern',trigger:'greeting',radius:5,exitRadius:7})]);h.frame.shops=[{id:1,front:{x:2,z:0}}];h.frame.people[0].x=50;
 await h.tick(0);await h.tick(1);assert.deepEqual(h.audio.getState().active[0].position,{x:2,y:2,z:0});
 h.frame.listener.x=12;await h.tick(1.02);assert.equal(h.created[0].stopped,true);
});
