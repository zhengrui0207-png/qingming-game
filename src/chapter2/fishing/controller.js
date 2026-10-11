import {contract} from '../contracts/index.js';
export const timings=Object.freeze({casting:1.6,waiting:8,bite:7,reeling:3.5,retrieving:1.2});
const active=new Set(['casting','waiting','bite','reeling','settling','retrieving']);
export function recoveryAnchor(snapshot,anchors){
 const last=snapshot.travel?.fishing?.lastCast;
 if(last?.outcome!=='cancelled'||last.recoveryReason!=='reload')return null;
 const point=contract.fishingPoints.find(p=>p.id===last.pointId);
 return anchors.find(a=>a.id===point?.anchorId)?.id??'anchor_c2_safe_return';
}
/** Controls presentation only. Every charge and catch is committed by the injected real service. */
export function createController(ctx,{anchors,onChange=()=>{},cue=()=>{},onClose=()=>{}}){
 const service=ctx.service;let phase='idle',time=0,total=0,point=null,cast=null,result=null,error=null;
 let simple=true,token=false,tension=.5,unsafe=0,held=false,releaseLock=null,lease=null,pending=null,abandoned=false,disposed=false,ownDispatch=false;
 const removers=[];
 const pointAnchor=()=>anchors.find(a=>a.id===contract.fishingPoints.find(p=>p.id===point)?.anchorId);
 const isActive=()=>active.has(phase);
 function getState(){const s=service.getState();return Object.freeze({phase,phaseSeconds:time,elapsedSeconds:total,pointId:point,castId:cast?.id??null,simple,token,tension,result:result?Object.freeze({...result}):null,error:error?Object.freeze({...error}):null,pendingSave:!!pending,locked:!!releaseLock,disposed,availableEnergy:s.travel.energy.current-s.travel.energy.reserved,canCast:!pending&&phase==='prepared'&&s.travel.energy.current-s.travel.energy.reserved>=contract.balance.castEnergy,recoveryAnchorId:recoveryAnchor(s,anchors)});}
 const notify=()=>onChange(getState());
 function setPhase(next){phase=next;time=0;held=false;notify();}
 function release(){lease?.release();lease=null;releaseLock?.();releaseLock=null;onClose();}
 function failure(r){error={code:r.error.code,message:r.error.message};ctx.toast(r.error.message);notify();}
 function commit(action,done){ownDispatch=true;let r;try{r=service.dispatch(action);}finally{ownDispatch=false;}
  if(r.ok){error=null;done(r);return true;}
  if(['save-failed','save-pending'].includes(r.error.code)&&service.getStatus().errorCode==='save-failed'){
   pending={action,done};error={code:r.error.code,message:r.error.message};setPhase('save-error');
  }else failure(r);
  return false;
 }
 const action=(type,payload)=>({type:'c2/'+type,transactionId:service.createTransactionId(),payload});
 function closeQuiet(){phase='idle';time=0;cast=null;held=false;release();notify();}
 function finish(r,outcome){const saved=service.getState().travel.fishing.lastCast;
  const actual=saved?.outcome??outcome;result={outcome:actual,itemId:r.data?.itemId??(actual==='caught'?saved?.resultItemId:null),quantity:r.data?.quantity??(actual==='caught'?1:0)};
  if(abandoned||disposed){if(actual==='caught')ctx.toast('所得已保存并登记风物志。');closeQuiet();return;}
  if(actual==='caught'){cue('caught');setPhase('retrieving');}else {cue('lost');setPhase('result');}
 }
 function settle(outcome){if(pending||disposed||phase==='settling')return false;
  const savedCast=service.getState().travel.fishing.pendingCast;
  if(!savedCast||savedCast.id!==cast?.id){closeQuiet();return false;}
  const id=cast.id;setPhase('settling');return commit(action('resolveCast',{castId:id,outcome}),r=>finish(r,outcome));
 }
 function open(id){if(disposed||phase!=='idle'||ctx.locks.locked||service.getStatus().errorCode==='save-failed')return false;
  const spec=contract.fishingPoints.find(p=>p.id===id);if(!spec)return false;
  const f=ctx.ports.getFrame(),a=anchors.find(a=>a.id===spec.anchorId);
  if(!a||service.getState().travel.regionId!=='region_d'||f.regionId!=='region_d'||!f.visible||!f.focused||f.actor.layer!==a.layer||f.actor.mode!=='walk'||Math.abs(f.actor.height-a.position[1])>.7||Math.hypot(f.actor.x-a.position[0],f.actor.z-a.position[2])>1.8)return false;
  point=id;cast=null;result=null;error=null;time=total=unsafe=0;tension=.5;simple=true;abandoned=false;
  token=id==='point_c2_b'&&service.getState().chapter2.quests.quest_c2_token.status==='active'&&!service.getState().travel.fishing.tokenObtained;
  releaseLock=ctx.locks.acquire('c2/fishing',()=>cancel('user'));setPhase('prepared');return true;
 }
 function start(){if(disposed||phase!=='prepared'||pending)return false;
  const s=service.getState();if(s.travel.energy.current-s.travel.energy.reserved<contract.balance.castEnergy){failure({error:{code:'insufficient-energy',message:'精力不足4，先到王家补给。走路和交谈照常。'}});return false;}
  if(!Object.values(s.travel.instances).some(i=>i.itemId==='item_c2_basic_rod'&&i.ownership==='borrowed')){failure({error:{code:'quest-not-ready',message:'先向鲁七免费借竿、学第一杆。'}});return false;}
  lease??=ctx.camera.borrow('c2/fishing',()=>cancel('user'));if(!lease){failure({error:{code:'activity-busy',message:'镜头正在使用，稍后再试。'}});return false;}
  const mode=s.travel.relief.firstCastGuaranteed?'relief':!s.travel.fishing.tutorialCompleted?'tutorial':token&&point==='point_c2_b'?'token':simple?'simple':'normal';
  const a=pointAnchor();lease.setPose({position:[a.position[0]+5,a.position[1]+4,a.position[2]-3.4],target:[a.position[0],1,-16],fov:48});
  const ok=commit(action('startCast',{pointId:point,mode}),r=>{
   cast=r.data.cast;if(cast.mode==='relief')simple=true;
   if(abandoned||disposed){const c=cast;commit(action('resolveCast',{castId:c.id,outcome:'cancelled'}),()=>closeQuiet());release();notify();return;}
   total=0;tension=.5;unsafe=0;cue('cast');setPhase('casting');
  });
  if(!ok&&!pending){lease.release();lease=null;}return ok;
 }
 function confirm(){if(disposed||pending)return false;
  if(phase==='prepared')return start();
  if(phase==='bite'){cue('reel');setPhase('reeling');return true;}
  if(phase==='result'){cast=null;result=null;error=null;token=point==='point_c2_b'&&service.getState().chapter2.quests.quest_c2_token.status==='active'&&!service.getState().travel.fishing.tokenObtained;setPhase('prepared');return true;}
  return isActive();
 }
 function retry(){if(!pending||disposed)return false;const current=pending;ownDispatch=true;let r;try{r=service.retrySave();}finally{ownDispatch=false;}
  if(!r.ok){failure(r);return false;}pending=null;error=null;current.done(r);notify();return true;
 }
 function cancel(reason='user'){
  if(disposed&&reason!=='dispose')return;
  abandoned=true;held=false;
  if(pending){release();notify();return;}
  const p=service.getState().travel.fishing.pendingCast;
  if(cast&&p?.id===cast.id){phase='cancel-resolving';commit(action('resolveCast',{castId:cast.id,outcome:'cancelled'}),()=>closeQuiet());if(pending){release();notify();}else if(phase!=='idle')closeQuiet();}
  else closeQuiet();
 }
 function update(dt,frame){if(disposed)return;
  if(phase!=='idle'&&!pending){const a=pointAnchor();if(frame.regionId!=='region_d'||!frame.visible||!frame.focused||!a||frame.actor.layer!==a.layer||Math.abs(frame.actor.height-a.position[1])>.7||Math.hypot(frame.actor.x-a.position[0],frame.actor.z-a.position[2])>2){cancel(!frame.visible?'hidden':!frame.focused?'blur':'region-leave');return;}}
  if(!isActive())return;
  const step=Math.max(0,Math.min(dt,.1));time+=step;total+=step;
  if(phase==='casting'&&time>=timings.casting)setPhase('waiting');
  else if(phase==='waiting'&&time>=timings.waiting){cue('bite');setPhase('bite');}
  else if(phase==='bite'&&!simple&&time>=timings.bite)settle('lost');
  else if(phase==='reeling'){
   if(!simple){const pulling=held||ctx.gate.held('Space')||ctx.gate.held('KeyE')||ctx.gate.held('Enter');tension=Math.max(0,Math.min(1,tension+(pulling ? .25 : -.12)*step));unsafe=tension<.05||tension>.95?unsafe+step:0;}
   if(unsafe>=1.5)settle('lost');else if(time>=timings.reeling)settle('caught');
  }else if(phase==='retrieving'&&time>=timings.retrieving)setPhase('result');
  notify();
 }
 removers.push(service.subscribe(({state})=>{if(disposed||ownDispatch)return;if(cast&&!state.travel.fishing.pendingCast&&!pending&&['casting','waiting','bite','reeling'].includes(phase)){const last=state.travel.fishing.lastCast;if(last?.id===cast.id){result={outcome:last.outcome,itemId:last.outcome==='caught'?last.resultItemId:null,quantity:last.outcome==='caught'?1:0};closeQuiet();}}notify();}));
 for(const spec of contract.fishingPoints){const a=anchors.find(a=>a.id===spec.anchorId);if(!a?.position)throw Error('Measured fishing anchor missing: '+spec.anchorId);
  removers.push(ctx.registry.register({id:spec.anchorId,type:'chapter2-fishing',anchor:a,layer:a.layer,radius:1.8,trigger:'E',label:'河边钓鱼 · 每杆精力−4',enabled:()=>!disposed&&phase==='idle'&&!ctx.locks.locked&&ctx.ports.getFrame().regionId==='region_d',action:()=>open(spec.id)}));
 }
 removers.push(ctx.ports.input.subscribe('c2/fishing',command=>{if(phase==='idle')return false;if(command==='cancel'){cancel('escape');return true;}if(command==='confirm')return confirm();return true;}));
 return {open,start,confirm,retry,cancel,update,getState,setHeld:value=>{held=!!value;},setSimple:value=>{if(phase==='prepared')simple=!!value;notify();},setToken:value=>{if(phase==='prepared'&&point==='point_c2_b'&&service.getState().chapter2.quests.quest_c2_token.status==='active')token=!!value;notify();},dispose(){if(disposed)return;cancel('dispose');if(pending&&typeof service.cancelPendingSave==='function'){ownDispatch=true;const r=service.cancelPendingSave();ownDispatch=false;if(r.ok){pending=null;cancel('dispose');}else ctx.toast(r.error.message);}disposed=true;removers.forEach(fn=>fn());release();notify();}};
}
