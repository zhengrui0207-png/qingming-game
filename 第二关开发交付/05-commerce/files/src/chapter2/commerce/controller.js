import {configuration as C} from '../core/service.js';
import {manifest,canInteract} from '../scene/physics.js';
import {shop,tabsFor,quoteFor,helpQuote} from './view-model.js';
export const OWNER='c2/commerce';
export function createController(context,{anchors=manifest.anchors,content,onChange=()=>{},registerNPCs=true}={}){
 const {service,locks,camera,registry,ports}=context;
 if(!service?.dispatch||!ports?.getFrame||!locks?.acquire||!camera?.borrow)throw Error('Commerce requires real service, locks, camera and frame ports');
 let state={phase:'closed',shopId:null,tab:null,quote:null,result:null,error:null},release=null,lease=null,dead=false;
 const unregister=[];
 const emit=()=>onChange({...state});
 function reachable(id){const frame=ports.getFrame(),a=anchors.find(a=>a.id===shop(id)?.anchorId);return !!a&&frame.regionId===C.region.id&&frame.visible&&frame.focused&&canInteract(frame.actor,a,context.world);}
 function error(message){state.error=message;emit();return false;}
 function cancel(reason='user'){if(dead)return;state={...state,phase:'closed',quote:null,error:null,reason};lease?.release();lease=null;release?.();release=null;emit();}
 function open(id,tab=tabsFor(id)[0]){
  if(dead||!shop(id)||!tabsFor(id).includes(tab)||!reachable(id))return false;
  if(state.phase!=='closed')return false;
  if(locks.locked)return false;
  lease=camera.borrow(OWNER,()=>cancel('camera-preempted'));if(!lease)return false;
  release=locks.acquire(OWNER,()=>cancel('user'));
  state={phase:'browse',shopId:id,tab,quote:null,result:null,error:null};emit();return true;
 }
 function browse(tab=state.tab){if(dead||state.phase==='closed'||!tabsFor(state.shopId).includes(tab))return false;state={...state,phase:'browse',tab,quote:null,result:null,error:null};emit();return true;}
 function stage(tab,rowId,quantity=1){
  if(dead||state.phase!=='browse'||service.getStatus().pending)return false;
  if(!reachable(state.shopId)){cancel('out-of-range');return false;}
  try{const quote=tab==='help'?helpQuote(service.getState(),state.shopId,rowId):quoteFor(service.getState(),state.shopId,tab,rowId,quantity,content);
   state={...state,phase:'confirm',error:null,quote:{...quote,transactionId:service.createTransactionId()}};emit();return true;
  }catch(e){return error(e.message);}
 }
 function settle(result){state={...state,phase:result.ok?'result':service.getStatus().pending?'save-error':'confirm',result,error:result.ok?null:result.error.message};emit();return result;}
 function confirm(){
  if(dead||state.phase!=='confirm'||!state.quote||service.getStatus().pending)return false;
  if(!reachable(state.shopId)){cancel('out-of-range');return false;}
  const {title,details,...action}=state.quote;state.phase='submitting';emit();return settle(service.dispatch(action));
 }
 function retry(){
  if(dead)return false;const closed=state.phase==='closed';const r=service.retrySave();
  if(closed){context.toast?.(r.ok?'进度已保存，交易不会重复结算':r.error.message);emit();return r;}
  return settle(r);
 }
 const unsubscribe=service.subscribe(()=>{if(dead)return;if(state.phase!=='submitting'&&state.phase!=='save-error')emit();});
 const stopInput=ports.input?.subscribe(OWNER,command=>{if(dead||state.phase==='closed'||locks.top?.owner!==OWNER)return false;if(command==='cancel'){cancel();return true;}if(command==='confirm'&&state.phase==='confirm'){confirm();return true;}return false;});
 if(registerNPCs)for(const sh of C.shops){const a=anchors.find(a=>a.id===sh.anchorId);if(!a)throw Error('Missing measured shop anchor '+sh.anchorId);unregister.push(registry.register({id:sh.npcId,type:'chapter2-commerce',label:content.npcs.find(n=>n.id===sh.npcId)?.name??sh.npcId,anchor:a,layer:a.layer,enabled:()=>!dead&&!locks.locked&&service.getState().travel.regionId===C.region.id,action:()=>open(sh.id)}));}
 return {open,browse,stage,confirm,retry,cancel,getState:()=>structuredClone(state),update(dt,frame=ports.getFrame()){if(!dead&&state.phase!=='closed'&&(!frame.visible||!frame.focused||frame.regionId!==C.region.id||!reachable(state.shopId)))cancel(!frame.focused?'blur':'out-of-range');},dispose(){if(dead)return;cancel('dispose');dead=true;unsubscribe();stopInput?.();unregister.forEach(f=>f());},get dead(){return dead;}};
}
