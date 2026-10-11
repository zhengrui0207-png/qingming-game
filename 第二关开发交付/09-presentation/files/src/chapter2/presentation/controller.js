import {sequences,sample,cuesBetween} from './timeline.js';
export const OWNER='c2/presentation';
const keyFor=id=>id==='intro_c2'?'intro':'ending';
export function createController(context,{stage,audio,autoStart=true,onChange=()=>{}}={}){
 const {service,ports,locks,camera}=context;if(!service?.dispatch||!ports?.getFrame||!locks?.acquire||!camera?.borrow)throw Error('Presentation needs real service and P0 frame/locks/camera');
 let state={phase:'idle',sequenceId:null,time:0,review:false,error:null,summary:null},lease=null,release=null,dead=false,queued=null,pendingAck=null,serial=0;
 if(autoStart){const s=service.getState();queued=s.chapter2.presentations.ending==='pending'?'ending_c2':s.chapter2.presentations.intro==='pending'?'intro_c2':null;}
 const emit=()=>onChange(getState());
 function getState(){return {...state,locked:!!release,queued,pendingAck:!!pendingAck,disposed:dead,frame:state.phase==='playing'?sample(state.sequenceId,state.time):null};}
 function restore(){for(const fn of [()=>audio?.end?.(),()=>stage?.end?.(),()=>lease?.release(),()=>release?.()])try{fn();}catch(e){context.toast?.('演出恢复时资源异常，已释放自己的控制。');}lease=null;release=null;}
 function acknowledge(id){pendingAck??={type:'c2/ackPresentation',transactionId:service.createTransactionId(),payload:{sequenceId:id}};const result=service.dispatch(pendingAck);if(result.ok){pendingAck=null;state.error=null;}else{state.error=result.error.message;context.toast?.(result.error.message);}emit();return result;}
 function finish(reason,ack){const id=state.sequenceId,review=state.review;restore();state={...state,phase:'idle',reason,summary:ack?sequences[id].skipSummary:null};queued=null;if(ack&&!review)acknowledge(id);else emit();}
 function cancel(reason='user'){if(dead||state.phase!=='playing')return false;finish(reason,['user','escape','skip'].includes(reason));return true;}
 function play(id,{review=false}={}){
  if(dead||!sequences[id]||state.phase==='playing'||pendingAck||locks.locked||service.getStatus().pending)return false;
  const f=ports.getFrame(),s=service.getState(),flag=s.chapter2.presentations[keyFor(id)];if(f.regionId!=='region_d'||!f.visible||!f.focused||!s.travel.initialized||s.travel.regionId!=='region_d'||(review?flag!=='seen':flag!=='pending'))return false;
  lease=camera.borrow(OWNER,()=>cancel('camera-preempted'));if(!lease)return false;
  release=locks.acquire(OWNER,()=>cancel('escape'));state={phase:'playing',sequenceId:id,time:0,review,error:null,summary:null,serial:++serial};queued=null;
  try{stage?.begin?.(id);audio?.begin?.();apply(-.001,0);}catch(e){restore();state={...state,phase:'idle',error:'演出资源暂不可用，可略过后继续。',reason:'resource-failure'};context.toast?.(state.error);emit();return false;}emit();return true;
 }
 function apply(previous,t){const f=sample(state.sequenceId,t);lease.setPose(f.pose);stage?.update?.(f);for(const cue of cuesBetween(state.sequenceId,previous,t))audio?.cue?.(cue.id,{eventId:state.serial+':'+cue.eventId});}
 function skip(id=state.sequenceId){if(state.phase==='playing')return cancel('skip');if(dead||!sequences[id]||pendingAck||service.getState().chapter2.presentations[keyFor(id)]!=='pending')return false;state={...state,sequenceId:id,review:false,summary:sequences[id].skipSummary,reason:'skip'};queued=null;return acknowledge(id);}
 function retry(){if(dead||!pendingAck)return false;const r=service.retrySave();if(!r.ok){state.error=r.error.message;emit();return r;}if(!pendingAck)return r;if(service.getState().chapter2.presentations[keyFor(pendingAck.payload.sequenceId)]==='seen'){pendingAck=null;state.error=null;emit();return r;}return acknowledge(pendingAck.payload.sequenceId);}
 const unsub=service.subscribe(({action,state:s})=>{if(dead)return;if(autoStart&&['c2/enterChapter2','c2/completeMain'].includes(action.type)){const id=action.type==='c2/enterChapter2'?'intro_c2':'ending_c2';if(s.chapter2.presentations[keyFor(id)]==='pending')queued=id;}if(pendingAck&&s.chapter2.presentations[keyFor(pendingAck.payload.sequenceId)]==='seen'){pendingAck=null;state.error=null;}emit();});
 const stopInput=ports.input?.subscribe(OWNER,command=>{if(state.phase!=='playing')return false;if(locks.top&&locks.top.owner!==OWNER)return false;if(command==='cancel')cancel('escape');return true;});
 return {play,skip,retry,cancel,dismiss(){state.summary=null;emit();},getState,setPaused(value){if(state.phase!=='playing')return false;state.paused=!!value;audio?.pause?.(state.paused);emit();return true;},update(dt,f=ports.getFrame()){
  if(dead)return;audio?.update?.(f);if(state.phase!=='playing'){if(queued&&!pendingAck)play(queued);return;}
  if(!f.visible||!f.focused||f.regionId!=='region_d'){cancel(!f.visible?'hidden':!f.focused?'blur':'region-leave');return;}
  if(state.paused||!Number.isFinite(dt)||dt<0)return;const before=state.time;state.time=Math.min(sequences[state.sequenceId].durationSeconds,state.time+Math.min(dt,.1));try{apply(before,state.time);}catch(e){cancel('resource-failure');state.error='镜头或演员资源暂不可用，已恢复游历。';emit();return;}if(state.time>=sequences[state.sequenceId].durationSeconds)finish('completed',true);else emit();
 },dispose(){if(dead)return;cancel('dispose');queued=null;dead=true;unsub();stopInput?.();restore();emit();}};
}
