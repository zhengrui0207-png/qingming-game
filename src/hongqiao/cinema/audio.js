// User-provided clips. One AudioContext clock drives both picture and scheduled sound.
export const CUES={intro:[[0,'intro_01'],[5,'intro_03'],[8,'intro_04'],[10,'intro_05'],[14,'intro_06'],[17,'intro_07'],[20,'intro_08a'],[21,'intro_08b'],[25,'intro_08c'],[27,'intro_09']],ending:[[0,'ending_01'],[12,'ending_02'],[16,'ending_03']]};
export const EFFECTS={intro:[
 {at:3,id:'sfx_pole_brace',duration:2,gain:.85},
 {at:17.3,id:'sfx_rope_throw',duration:1,gain:.7,pan:-.25},
 {at:18.1,id:'sfx_rope_throw',duration:1,gain:.7,pan:.25},
 {at:20,id:'sfx_rope_handle',duration:1,gain:.85},
 {at:21,id:'sfx_mast_lower',duration:4,gain:.9},
 {at:25,id:'sfx_rope_handle',duration:2,offset:1,gain:.8},
 {at:25,id:'sfx_pole_stow',duration:2,gain:.65}
],ending:[{at:3,id:'sfx_ship_pass',duration:9,gain:.9}]};
const BEDS=['amb_river','amb_market'];
export function makeAudioPlan(kind,durations){
 const end=kind==='intro'?30:20;
 return [
  ...CUES[kind].map(([at,id])=>({at,id,type:'voice',duration:Math.min(durations[id]??0,end-at),gain:.9})),
  ...EFFECTS[kind].map(c=>({...c,type:'effect',duration:Math.min(c.duration,Math.max(0,(durations[c.id]??0)-(c.offset??0)))})),
  ...BEDS.map((id,i)=>({at:0,id,type:'ambience',duration:end,loop:true,gain:i?.25:.45}))
 ].filter(c=>(durations[c.id]??0)>0&&c.duration>0);
}
export async function createCinemaAudio(baseURL,controls){
 const buffers=new Map(),errors=[];let metadata={};const prefix=baseURL+'assets/hongqiao/cinema/audio/';
 async function request(url){const r=await fetch(url,{cache:'no-cache',signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);return r;}
 try{metadata=(await (await request(prefix+'manifest.json')).json()).files;}catch(e){errors.push('manifest: '+e.message);console.warn('[Hongqiao audio manifest unavailable]',e.message);}
 const ids=[...new Set([...Object.values(CUES).flat().map(c=>c[1]),...Object.values(EFFECTS).flat().map(c=>c.id),...BEDS])];
 let decoder;try{decoder=new OfflineAudioContext(2,1,48000);}catch(e){errors.push('decoder: '+e.message);}
 await Promise.all(ids.map(async id=>{try{if(!decoder)throw Error('Web Audio unavailable');const r=await request(prefix+id+'.wav?v='+(metadata[id]?.sha256?.slice(0,12)??'user-20260916'));buffers.set(id,await decoder.decodeAudioData(await r.arrayBuffer()));}catch(e){errors.push(id+': '+e.message);console.warn('[Hongqiao audio unavailable]',id,e.message);}}));
 let kind=null,anchor=0,running=false,plan=[],last=-.001,played=[],events=[],sources=new Set();
 const context=()=>controls.audioContext();
 function stop(){running=false;for(const entry of sources){entry.source.onended=null;try{entry.source.stop();}catch{}for(const node of entry.nodes)node.disconnect();}sources.clear();controls.setCinemaAudioActive?.(false);}
 function schedule(t){
  const ctx=context();if(!ctx)return;anchor=ctx.currentTime-t;
  const end=kind==='intro'?30:20;
  for(const cue of plan){
   const cueEnd=Math.min(end,cue.at+cue.duration);if(cueEnd<=t)continue;
   const start=Math.max(t,cue.at),length=cueEnd-start,when=anchor+start,source=ctx.createBufferSource(),gain=ctx.createGain();
   source.buffer=buffers.get(cue.id);source.loop=!!cue.loop;
   source.connect(gain);const nodes=[source,gain];let tail=gain;
   if(cue.pan&&ctx.createStereoPanner){const pan=ctx.createStereoPanner();pan.pan.value=cue.pan;gain.connect(pan);nodes.push(pan);tail=pan;}
   tail.connect(controls.audioDestination?.()??ctx.destination);
   const fade=Math.min(cue.type==='voice'?.004:.045,length/3),level=cue.gain;
   gain.gain.setValueAtTime(0,when);
   let tailLevel=level;
   if(cue.type==='ambience'){
    // Hold each duck level until the next speech boundary, then fade over 60 ms.
    const points=[start,...plan.filter(c=>c.type==='voice').flatMap(c=>[Math.max(0,c.at-.08),c.at+c.duration+.08]),...(kind==='intro'?[10,14]:[])].filter(x=>x>=start&&x<cueEnd-.1).sort((a,b)=>a-b);
    let previous=0;
    for(const at of [...new Set(points)]){
     const speaking=plan.some(c=>c.type==='voice'&&at>=c.at-.081&&at<c.at+c.duration+.079),flashback=kind==='intro'&&at>=10&&at<14;
     const next=level*(speaking?.32:flashback?.5:1);
     gain.gain.setValueAtTime(previous,anchor+at);gain.gain.linearRampToValueAtTime(next,anchor+at+.06);previous=next;
    }
    tailLevel=previous;
   }else gain.gain.linearRampToValueAtTime(level,when+fade);
   gain.gain.setValueAtTime(tailLevel,anchor+cueEnd-fade);gain.gain.linearRampToValueAtTime(0,anchor+cueEnd);
   const entry={source,nodes,id:cue.id,start,end:cueEnd};sources.add(entry);
   source.onended=()=>{sources.delete(entry);for(const node of nodes)node.disconnect();};
   source.start(when,(cue.offset??0)+(start-cue.at),length);source.stop(anchor+cueEnd);
  }
 }
 return {
  begin(next){stop();kind=next;plan=makeAudioPlan(kind,Object.fromEntries([...buffers].map(([id,b])=>[id,b.duration])));last=-.001;played=[];events=[];running=true;controls.setCinemaAudioActive?.(true);schedule(0);},
  update(t){if(!running)return;for(const cue of plan)if(cue.at>last&&cue.at<=t){events.push({id:cue.id,at:cue.at,type:cue.type});if(cue.type==='voice')played.push(cue.id);}last=t;},
  getTime:()=>running&&context()?Math.max(0,context().currentTime-anchor):null,
  seek(t){stop();running=true;controls.setCinemaAudioActive?.(true);last=t-.001;schedule(t);},stop,
  getState:()=>({loaded:buffers.size,errors,played:[...played],events:[...events],active:[...sources].filter(s=>context()&&s.start<=context().currentTime-anchor&&s.end>context().currentTime-anchor).length,scheduled:sources.size,context:context()?.state??'unavailable',enabled:controls.audioEnabled?.()??false,durations:Object.fromEntries([...buffers].map(([id,b])=>[id,b.duration]))})
 };
}
