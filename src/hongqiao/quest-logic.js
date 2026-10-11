import {questStage} from './state.js';

export function conditionMatches(condition, state, config) {
  const stage = questStage(state,config);
  switch(condition.type) {
    case 'always': return true;
    case 'questCompleted': return stage === 'completed';
    case 'questReady': return stage === 'ready';
    case 'questAccepted': return ['active','ready','completed'].includes(stage);
    case 'instanceCollected': return state.worldState.collectedInstanceIds.includes(condition.instanceId);
    case 'hasPermission': return state.permissions.includes(condition.permissionId);
    default: throw Error('Unknown dialogue condition: '+condition.type);
  }
}
export function selectDialogue(config,state,npcId) {
  const dialogue = config.dialogues.find(d=>d.npcId===npcId);
  if (!dialogue) return null;
  const branch = dialogue.branches.find(b=>conditionMatches(b.when,state,config));
  return branch ? {dialogue,nodeId:branch.node} : null;
}
export function missingItems(config,state) {
  return config.quest.requiredItems.filter(i=>(state.inventory[i.itemId]??0)<i.quantity);
}
export function createGuidance(config) {
  let idleSeconds=0,hintVisible=false,targetId=null;
  return {
    update(dt,operative,state) {
      if (questStage(state,config)==='completed') {hintVisible=false;targetId=null;return;}
      if (operative && ['active','ready'].includes(questStage(state,config))) idleSeconds += Math.max(0,dt);
      if (idleSeconds >= config.narrative.guide.idleSeconds) hintVisible=true;
    },
    progress() {idleSeconds=0;hintVisible=false;},
    choose(id) {if(config.npcs.some(n=>n.id===id)||config.instances.some(i=>i.id===id))targetId=id;},
    getState:()=>({idleSeconds,hintVisible,targetId}),
  };
}
