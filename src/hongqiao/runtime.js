import * as THREE from 'three';
import config from './config.js';
import {createProgressStore, consumeResetURL} from './persistence.js';
import {createCollectibles} from './collectibles.js';
import {createProgressUI} from './progress-ui.js';
import {createQuestNPCs} from './npcs.js';
import {createQuestDialogue} from './dialogue-ui.js';
import {createGuidance} from './quest-logic.js';
import {createQuestTracker} from './tracker.js';
import {createPresentation} from './presentation.js';
import './quest-ui.css';

export function createHongqiaoProgress({scene,loader,world,npcPrototype,npcAssets,registry,locks,gate,getActor,canOpen,canOperate,toast}) {
  const development=import.meta.env.DEV&&new URLSearchParams(location.search).has('test');
  const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),removeItem:key=>localStorage.removeItem(key)};
  const reset=consumeResetURL({url:location.href,history,storage,development});
  const store=createProgressStore({config,storage});if(reset.error)console.error('[Hongqiao reset]',reset.error);
  const acquire=(owner,cancel)=>locks.acquire(owner==='dialogue'?'hqDialogue':owner,cancel);
  let releaseBook,presentation,dialogue,tracker;
  const ui=createProgressUI({config,store,development,canOpen:()=>canOpen()&&!presentation?.getState().running,
    onOpen:()=>{releaseBook=acquire('book',()=>ui.close());},onClose:()=>{releaseBook?.();releaseBook=null;},toast});
  const collectibles=createCollectibles({scene,loader,config,store,world,baseURL:import.meta.env.BASE_URL});
  const npcs=createQuestNPCs({scene,npcPrototype,npcAssets,config,world}),guidance=createGuidance(config);
  const chooseGuide=id=>{guidance.choose(id);toast('已为你标出方向。');};
  dialogue=createQuestDialogue({config,store,acquire,gate,book:ui,chooseGuide,onFinishPresentation:()=>presentation.finishEnding()});
  presentation=createPresentation({config,store,acquire,onEndingPlaceholder:()=>dialogue.showEnding(),onClosing:()=>dialogue.showClosing()});
  tracker=createQuestTracker({config,store,guidance,onChoose:chooseGuide,onStories:()=>ui.openStories(),onClosing:()=>{presentation.finishEnding();dialogue.showClosing();}});
  const culture=config.narrative.guide.culture,cultureAnchor=config.anchors.find(a=>a.id===culture.anchorId);
  const culturePosition=new THREE.Vector3(...cultureAnchor.position).add(new THREE.Vector3(...culture.offset));
  for(const e of collectibles.entries())registry.register({id:e.instance.id,type:'item',entity:e.group,anchor:e.anchor,layer:e.anchor.layer,radius:2,maxHeightDifference:.7,
    enabled:()=>e.group.visible&&store.getState().permissions.includes(e.instance.permissionId),getPosition:()=>e.group.getWorldPosition(new THREE.Vector3()),label:'取'+e.item.name,
    action:()=>{const result=store.dispatch({type:'collect',instanceId:e.instance.id});if(result.changed&&!result.saved)toast('已取得物品，保存失败；请查看提示并重试。');}});
  for(const npc of config.npcs){const anchor=config.anchors.find(a=>a.id===npc.anchorId);registry.register({id:npc.id,type:'npc',anchor,layer:anchor.layer,getPosition:()=>npcs.position(npc.id),label:'与'+npc.name+'交谈',action:()=>dialogue.showNPC(npc.id)});}
  registry.register({id:culture.id,type:'codex',anchor:cultureAnchor,layer:cultureAnchor.layer,getPosition:()=>culturePosition,label:'看桥下',action:()=>{store.dispatch({type:'unlockCodex',codexId:culture.codexId});ui.openCodex();}});
  let lastTick=performance.now();
  const resetClock=()=>{lastTick=performance.now();};
  addEventListener('blur',resetClock);addEventListener('focus',resetClock);document.addEventListener('visibilitychange',resetClock);
  function update() {
    const now=performance.now(),dt=Math.max(0,(now-lastTick)/1000);lastTick=now;
    const state=store.getState(),actor=getActor();
    guidance.update(dt,canOperate()&&!locks.locked&&!document.hidden&&document.hasFocus(),state);
    tracker.render(canOpen());
    let selected=guidance.getState().targetId,target=selected?npcs.position(selected):null;
    const instance=config.instances.find(i=>config.permissions.find(p=>p.id===i.permissionId)?.grantedBy===selected);
    if(instance&&state.permissions.includes(instance.permissionId)&&!state.worldState.collectedInstanceIds.includes(instance.id)){
      target=new THREE.Vector3(...config.anchors.find(a=>a.id===instance.anchorId).position);selected=instance.id;
    }
    npcs.update(actor,selected,locks.locked?0:dt);
    let direction='';
    if(target){const dx=target.x-actor.x,dz=target.z-actor.z,d=Math.hypot(dx,dz);const name=config.npcs.find(n=>n.id===selected)?.name??config.items.find(i=>i.id===instance?.itemId)?.name;
      direction=d<1.5?`已到${name}附近，留意 E 提示`:`${name} · 向${Math.abs(dx)>Math.abs(dz)?dx>0?'东':'西':dz>0?'南':'北'}约 ${Math.ceil(d)} 步`;}
    tracker.setDirection(direction);
  }
  store.subscribe(event=>{
    if(['acceptQuest','grantPermission','collect','completeQuest'].includes(event.action.type))guidance.progress();
    if(event.action.type==='finishIntro')toast(event.action.skipped?'船已降桅稳住，岸上仍需补齐备用物品。':'去岸边问问发生了什么。');
    if(event.action.type==='completeQuest')queueMicrotask(()=>presentation.playEnding());
  });
  if(development)window.__hqProgress={getState:store.getState,getStatus:store.getStatus,getErrors:store.getErrors,getWorld:collectibles.getState,
    dispatch:store.dispatch,restoreFixture:store.restoreFixture,retrySave:store.retrySave,refreshUI:store.refreshUI,config,reset,
    getDialogue:dialogue.getState,getNPCs:npcs.getState,getGuidance:guidance.getState,getPresentation:presentation.getState,
    advanceGuidance:(seconds,operative)=>guidance.update(seconds,operative,store.getState())};
  return {store,ui,dialogue,presentation,update,getAudioResidents:npcs.getState,start:()=>presentation.start()};
}
