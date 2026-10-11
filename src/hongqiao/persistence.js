import {defaultState, normalizeState, reduceState} from './state.js';
import {reduceChapter2, recoverActivities, fingerprint, validateCoreSnapshot} from '../chapter2/core/state.js';
import {contract} from '../chapter2/contracts/index.js';
import {validateAction} from '../chapter2/contracts/validate.js';
export const SAVE_KEY = 'qingming:hongqiao:save';
export const BACKUP_KEY = SAVE_KEY + ':backup';
export const CORRUPT_KEY = SAVE_KEY + ':corrupt';
export const SAVE_KEYS = [SAVE_KEY, BACKUP_KEY, CORRUPT_KEY];
const errorResult = (code, message=code, transactionId, retryable=false) => ({ok:false,changed:false,saved:false,error:{code,message,retryable},...(transactionId?{transactionId}:{})});
const freeze = x => {if(x && typeof x==='object'){for(const v of Object.values(x))freeze(v);Object.freeze(x);}return x;};
export function createProgressStore({config, storage, onError = e => console.error('[Hongqiao save]', e),
  chapter2 = {}, saveKey = SAVE_KEY}) {
  const backupKey=saveKey+':backup',corruptKey=saveKey+':corrupt';
  let state=defaultState(),status={saved:false,kind:'new',message:'尚无存档',errorCode:null},verified=null,pending=null,legacyDirty=false;
  const listeners=new Set(),worldListeners=new Set(),errors=[];
  const now=()=>{const d=chapter2.now?.() ?? new Date();return new Date(d).toISOString();};
  const seed=chapter2.seed ?? (()=>{const a=new Uint32Array(1);globalThis.crypto.getRandomValues(a);return a[0];});
  const report=e=>{errors.push(String(e));onError(e);};
  const decode=raw=>normalizeState(JSON.parse(raw),config);
  function persist(snapshot) {
    try {
      // Preserve the actual previous snapshot, including its old schema on migration.
      if(verified!==null){storage.setItem(backupKey,verified);if(storage.getItem(backupKey)!==verified)throw Error('Backup readback mismatch');}
      const raw=JSON.stringify(snapshot);storage.setItem(saveKey,raw);
      if(storage.getItem(saveKey)!==raw)throw Error('Save readback mismatch');
      decode(raw);verified=raw;status={saved:true,kind:'saved',message:'进度已保存',errorCode:null};return true;
    }catch(e){report(e);status={saved:false,kind:'save-failed',message:'保存失败：本页保留未保存进度，请勿刷新；请重试保存或取消待提交事务。',errorCode:'save-failed'};return false;}
  }
  function load() {
    let damaged=false;
    for(const key of [saveKey,backupKey]){
      let raw;
      try{
        raw=storage.getItem(key);if(raw===null)continue;
        state=decode(raw);verified=raw;
        const recovered=key===backupKey,migrated=JSON.stringify(state)!==raw;
        const resumed=recoverActivities(state,now());
        if(recovered||migrated||resumed){legacyDirty=!persist(state);if(!legacyDirty)status={saved:true,kind:recovered?'recovered':migrated?'migrated':'activity-recovered',message:recovered?'主存档异常，已恢复上一份完整备份。':migrated?'存档已迁移，原有进度已保留。':'已取消遗留钓杆和未完成维修，扣费与操作步骤已保留。',errorCode:null};}
        else status={saved:true,kind:'loaded',message:'已恢复存档',errorCode:null};
        return;
      }catch(e){damaged=true;report(e);if(raw!==undefined && raw!==null)try{storage.setItem(corruptKey,JSON.stringify({key,raw,at:now()}));}catch(b){report(b);}}
    }
    if(damaged)status={saved:false,kind:'unrecoverable',message:'存档无法读取，且无可用备份。本页使用默认状态，损坏记录已尝试保留。',errorCode:'save-failed'};
  }
  load();
  const epoch=state.travel.transactions.saveEpoch ?? globalThis.crypto.randomUUID().replaceAll('-','');
  let nextSequence=Math.max(state.travel.transactions.nextSequence,state.travel.transactions.committedThrough);
  const allocated=new Set();
  const notify=(action,result)=>{for(const fn of listeners)try{fn({action:structuredClone(action),result:structuredClone(result),state:structuredClone(state),status:{...status}});}catch(e){report(e);}};
  const world=()=>{for(const fn of worldListeners)try{fn(structuredClone(state));}catch(e){report(e);}};
  function publish(candidate, action, result){state=candidate;legacyDirty=false;world();notify(action,result);return structuredClone(result);}
  function commitLegacy(next,action){
    state=next;world();legacyDirty=!persist(state);
    const result={ok:true,changed:true,saved:status.saved};notify(action,result);return result;
  }
  function commitC2(action, frameOverride, firstOperativeAt){
    if(pending || legacyDirty) return errorResult('save-pending','有未保存的进度，重试或取消后才能继续',action.transactionId,true);
    const spec=contract.actions.find(x=>x.type===action?.type);
    if(!spec)return errorResult('unknown-action');
    let sequence=null,fp;
    if(spec.transactionIdRequired){
      const id=action.transactionId;
      const tr=state.travel.transactions;
      fp=fingerprint(action);
      const old=tr.recent.find(x=>x.id===id);
      if(old) return old.fingerprint===fp?{...structuredClone(old.result),changed:false,duplicate:true}:errorResult('invalid-action','同一事务ID参数不同',id);
      const match=/^c2:([A-Za-z0-9_-]+):([1-9][0-9]*)$/.exec(id??'');
      if(!match || match[1]!==epoch || !Number.isSafeInteger(Number(match[2])))return errorResult('invalid-action','事务ID无效或不属于此存档',id);
      sequence=Number(match[2]);
      if(sequence<=tr.committedThrough)return errorResult('duplicate-transaction','旧事务序号不得再次提交',id);
      if(!allocated.has(id))return errorResult('invalid-action','先通过createTransactionId分配本次事务ID',id);
    }
    const base=structuredClone(state);
    if(spec.transactionIdRequired){base.travel.transactions.saveEpoch=epoch;base.travel.transactions.nextSequence=nextSequence;}
    const ctx={anchors:chapter2.anchors?.anchors ?? chapter2.anchors,content:chapter2.content,frame:frameOverride ?? chapter2.ports?.getFrame?.(),at:now(),seed,firstOperativeAt};
    const reduced=reduceChapter2(base,action,ctx);
    if(!reduced.ok)return {...reduced,saved:false,...(action.transactionId?{transactionId:action.transactionId}:{})};
    let candidate=reduced.state;
    const result={ok:true,changed:reduced.changed,saved:true,...(action.transactionId?{transactionId:action.transactionId}:{}),data:reduced.data};
    if(spec.transactionIdRequired){
      const tr=candidate.travel.transactions;tr.committedThrough=sequence;tr.nextSequence=nextSequence;
      tr.recent.push({id:action.transactionId,fingerprint:fp,result:structuredClone(result)});tr.recent=tr.recent.slice(-256);
      // Even a semantic no-op commits a receipt to prevent later ID reuse.
      if(!reduced.changed)candidate.revision++;
    }else if(!reduced.changed)return result;
    try{validateCoreSnapshot(candidate);}catch(e){return errorResult('invalid-action',e.message,action.transactionId);}
    if(!persist(candidate)){
      pending={candidate,action:structuredClone(action),result};
      return errorResult('save-failed',status.message,action.transactionId,true);
    }
    allocated.delete(action.transactionId);return publish(candidate,action,result);
  }
  let bufferedSeconds=0,bufferFrame=null,bufferFirstAt=null;
  function flushTimers(){
    if(!bufferedSeconds)return {ok:true,changed:false,saved:status.saved};
    if(pending || legacyDirty)return errorResult('save-pending',status.message,undefined,true);
    const seconds=bufferedSeconds,frame=bufferFrame,firstAt=bufferFirstAt;
    const result=commitC2({type:'c2/tick',payload:{seconds,operative:true}},frame,firstAt);
    // If saving failed, the time delta now lives in the retry candidate.
    if(result.ok || result.error?.code==='save-failed'){bufferedSeconds=0;bufferFrame=null;bufferFirstAt=null;}
    return result;
  }
  function dispatchC2(action){
    if(pending || legacyDirty)return errorResult('save-pending',status.message,action.transactionId,true);
    const valid=validateAction(action);
    if(!valid.ok)return commitC2(action); // Returns the precise business/shape error.
    const frame=chapter2.ports?.getFrame?.();
    if(action.type==='c2/tick' && state.travel.regionId==='region_d' && frame?.regionId==='region_d' && frame.visible && frame.focused && frame.operative && action.payload.operative && !state.travel.fishing.pendingCast && !['active','ready'].includes(state.chapter2.repair.status) && action.payload.seconds<=3600){
      if(!bufferedSeconds)bufferFirstAt=now();
      bufferedSeconds+=action.payload.seconds;bufferFrame=structuredClone(frame);
      if(bufferedSeconds<1)return {ok:true,changed:false,saved:status.saved,data:{bufferedSeconds}};
      return flushTimers();
    }
    const timerResult=flushTimers();if(!timerResult.ok)return timerResult;
    return commitC2(action,frame);
  }
  function retrySaveResult(){
    if(pending){const p=pending;if(!persist(p.candidate))return errorResult('save-failed',status.message,p.action.transactionId,true);pending=null;allocated.delete(p.action.transactionId);return publish(p.candidate,p.action,p.result);}
    if(bufferedSeconds && !legacyDirty)return flushTimers();
    if(!persist(state))return errorResult('save-failed',status.message,undefined,true);
    legacyDirty=false;const result={ok:true,changed:false,saved:true};notify({type:'retrySave'},result);return result;
  }
  return {
    getState:()=>structuredClone(state),getFrozenState:()=>freeze(structuredClone(state)),getStatus:()=>({...status,pending:!!pending}),getErrors:()=>[...errors],
    getPendingSnapshot:()=>pending?structuredClone(pending.candidate):null,
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},subscribeWorld(fn){worldListeners.add(fn);return()=>worldListeners.delete(fn);},
    createTransactionId(){if(!Number.isSafeInteger(nextSequence+1))throw Error('事务序号已耗尽');const id=`c2:${epoch}:${++nextSequence}`;allocated.add(id);return id;},
    dispatch(action){
      if(action?.type?.startsWith('c2/')){try{return dispatchC2(action);}catch(e){return errorResult('invalid-action',e.message,action.transactionId);}}
      if(pending)return errorResult('save-pending',status.message,undefined,true);
      if(bufferedSeconds){const timerResult=flushTimers();if(!timerResult.ok)return timerResult;}
      const result=reduceState(state,action,config);
      if(!result.ok||!result.changed)return {...result,state:undefined,saved:status.saved};
      return commitLegacy(result.state,action);
    },
    retrySave(){return retrySaveResult().ok;},retrySaveResult,
    cancelPendingSave(){
      if(!pending)return {ok:true,changed:false,saved:status.saved};
      // Failed readback may already have written a candidate: verify rollback before unblocking.
      if(!persist(state))return errorResult('save-failed',status.message,pending.action.transactionId,true);
      pending=null;return {ok:true,changed:false,saved:true};
    },
    flush(){return pending || legacyDirty?retrySaveResult():flushTimers();},
    refreshUI(){notify({type:'refreshSnapshot'},{ok:true,changed:false,saved:status.saved});},
    restoreFixture(snapshot){if(pending)return errorResult('save-pending');return commitLegacy(normalizeState(snapshot,config),{type:'developmentFixture'});},
  };
}
export function consumeResetURL({url, history, storage, development}) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has('hqReset')) return {requested: false};
  parsed.searchParams.delete('hqReset');
  // Remove first, even if storage access fails: refreshing cannot repeat a reset.
  history.replaceState(history.state, '', parsed.pathname + parsed.search + parsed.hash);
  if (!development) return {requested: true, cleared: false};
  try {for (const key of SAVE_KEYS) storage.removeItem(key); return {requested: true, cleared: true};}
  catch (e) {return {requested: true, cleared: false, error: String(e)};}
}
