import {questStage} from './state.js';
export function createQuestTracker({config,store,guidance,onChoose,onStories,onClosing}) {
  const root=document.createElement('aside');root.id='hq-tracker';root.hidden=true;root.setAttribute('aria-label','虹桥任务追踪');document.body.append(root);
  const el=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;root.append(e);return e;};
  let lastSignature='',direction;
  function render(playing) {
    root.hidden=!playing;if(!playing)return;
    const state=store.getState(),guide=guidance.getState(),stage=questStage(state,config);
    const signature=JSON.stringify([stage,state.inventory,state.permissions,state.endingPending,guide.hintVisible]);
    if(signature===lastSignature)return;lastSignature=signature;root.replaceChildren();
    const count=config.quest.requiredItems.filter(i=>(state.inventory[i.itemId]??0)>=i.quantity).length;
    el('strong',config.quest.title+(stage==='completed'?' · 已完成':` · 备齐物品 ${count}/3`));
    if(stage==='available')el('p',config.narrative.guide.initialHint);
    if(stage==='completed') {
      const b=el('button','阅读人物故事');b.onclick=onStories;
      const ending=el('button',state.endingPending?'继续收尾对白':'回顾收尾');ending.onclick=onClosing;
    } else {
      for(const item of config.quest.requiredItems){
        const instance=config.instances.find(i=>i.itemId===item.itemId),npc=config.npcs.find(n=>n.id===config.permissions.find(p=>p.id===instance.permissionId).grantedBy),name=config.items.find(i=>i.id===item.itemId).name;
        const b=el('button',`${(state.inventory[item.itemId]??0)>=item.quantity?'已得':'○'} ${npc.name} · ${name}`);b.dataset.target=npc.id;b.onclick=()=>onChoose(npc.id);
      }
      const b=el('button',stage==='ready'?'三件已齐，找老周交付':'找老周');b.dataset.target=config.quest.giverId;b.onclick=()=>onChoose(config.quest.giverId);
    }
    if(guide.hintVisible)el('small',config.narrative.guide.idleHint).id='hq-idle-hint';
    direction=el('div','');direction.id='hq-direction';direction.hidden=true;
  }
  function setDirection(text){if(direction){direction.hidden=!text;direction.textContent=text;}}
  return {render,setDirection};
}
