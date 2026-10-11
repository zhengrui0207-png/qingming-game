import legacyConfig from '../../hongqiao/config.json' with {type:'json'};
import {createProgressStore, SAVE_KEY} from '../../hongqiao/persistence.js';
export {configuration, conditionMatches} from './state.js';
/** One store for HQ + C2. Pass this SAME service to all modules and the HQ runtime adapter. */
export function createSharedService({storage, config=legacyConfig, ports, anchors, content, now, seed, onError, saveKey=SAVE_KEY, development=false}={}) {
  if(!storage)throw Error('Shared service requires storage');
  const store=createProgressStore({config,storage,onError,saveKey,chapter2:{ports,anchors,content,now,seed}});
  const service={...store,getState:store.getFrozenState,retrySave:store.retrySaveResult};
  if(!(development && saveKey.startsWith('qingming:dev:chapter2:')))delete service.restoreFixture;
  return service;
}
/** DEV route uses isolated storage only; caller must pass the actual Vite DEV flag. */
export function developmentSaveKey({development,url,session}) {
  const q=new URL(url).searchParams;
  if(!development || !q.has('test') || !q.has('chapter2'))throw Error('DEV直达须DEV及?test&chapter2');
  if(!/^[A-Za-z0-9_-]{1,80}$/.test(session))throw Error('Invalid development session');
  return `qingming:dev:chapter2:${session}`;
}
/** Adapt the already-created HQ store; creates NO second store and NO new storage writer. */
export function asSharedService(store) {
  if(typeof store.getFrozenState!=='function' || typeof store.retrySaveResult!=='function')throw Error('需要03升级后的真实progress store');
  const {restoreFixture,getFrozenState,...publicStore}=store;
  return {...publicStore,getState:getFrozenState,retrySave:store.retrySaveResult};
}
