import {speakerPortrait} from './portraits.js';
import {selectDialogue,missingItems} from './quest-logic.js';

export function createQuestDialogue({config,store,acquire,gate,book,chooseGuide,onFinishPresentation}) {
  const dialog=document.createElement('dialog');dialog.id='hq-dialogue';dialog.setAttribute('aria-label','虹桥人物对白');document.body.append(dialog);
  const el=(tag,text,parent=dialog)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;parent.append(e);return e;};
  let release=null,definition=null,nodeId=null,entryNode=null,lineIndex=0,choicesOnly=false,mode='npc',armed=true,lastResult=null;
  function close(result='cancelled') {if(!dialog.open)return;lastResult=result;dialog.close();release?.();release=null;definition=null;}
  function begin() {if(!dialog.open){release=acquire('dialogue',()=>close());dialog.showModal();}armed=!gate.held('KeyE');}
  function showNPC(npcId) {
    const selected=selectDialogue(config,store.getState(),npcId);if(!selected)return false;
    definition=selected.dialogue;entryNode=selected.nodeId;nodeId=entryNode;lineIndex=0;choicesOnly=false;mode='npc';begin();render();return true;
  }
  function button(text,action,parent=dialog,id) {const b=el('button',text,parent);b.type='button';if(id)b.dataset.choice=id;b.disabled=!armed;b.onclick=()=>{if(armed)action();};return b;}
  function showNode(id,onlyChoices=false) {nodeId=id==='$entry'?entryNode:id;lineIndex=0;choicesOnly=onlyChoices;render();}
  function node() {
    if(mode==='closing')return {lines:config.narrative.closing.lines,choices:[{id:'hq_closing_done',label:'继续',effect:{type:'completionCard'}}]};
    const value=definition.nodes[nodeId];
    if(nodeId==='HQ_40')return {...value,lines:[...value.lines,...missingItems(config,store.getState()).map(i=>config.narrative.guide.missing[i.itemId])]};
    return value;
  }
  function choose(choice) {
    const effect=choice.effect;
    if(effect?.type==='close'){close('cancelled');return;}
    if(effect?.type==='openStory'){const id=effect.storyId;close('completed');book.openStories(id);return;}
    if(effect?.type==='showClosing'){showClosing();return;}
    if(effect?.type==='chooseGuide'){mode='guide';render();return;}
    if(effect?.type==='completionCard'){store.dispatch({type:'acknowledgeEnding'});showCompletion();return;}
    if(effect){
      const result=store.dispatch(effect);
      if(!result.ok){el('p',result.reason==='quest-not-ready'?'物品尚未齐备，请先备齐再交付。':'当前状态已变化，请重新交谈。');return;}
      if(!choice.goto){close('completed');return;}
    }
    if(choice.goto)showNode(choice.goto,choice.choicesOnly);
  }
  function next(){if(!armed||mode==='ending'||mode==='card'||mode==='guide')return;const n=node();if(!choicesOnly&&lineIndex<n.lines.length-1){lineIndex++;render();}}
  function render() {
    dialog.replaceChildren();delete dialog.dataset.portrait;dialog.dataset.mode=mode;dialog.dataset.node=nodeId??'';
    const closeButton=button('×',()=>close(),dialog,'hq_dialogue_close');closeButton.className='hq-dialogue-close';closeButton.setAttribute('aria-label','关闭对白（Esc）');
    if(mode==='ending') {
      el('h2','虹桥急情 · 物品已交齐');
      el('p','当前为剧情体验版，过桥动画暂未接入。物品交付与故事解锁已经生效。');
      el('small',store.getStatus().message);
      button('继续收尾对白',()=>{onFinishPresentation();showClosing();},dialog,'hq_continue_closing');
      button('阅读人物故事',()=>{close('completed');book.openStories();});return;
    }
    if(mode==='card') {
      for(const [i,line] of config.narrative.completionCard.lines.entries()) {
        if(line.startsWith('['))continue;
        el(i===0?'h2':'p',line.includes('也已保存')&&!store.getStatus().saved?'《汴京见闻·虹桥》短记录暂存于本页内存，请先重试保存。':line);
      }
      el('small','船已平安通过虹桥 · 可在见闻中回顾');el('small',store.getStatus().message);
      button('阅读人物故事',()=>{close('completed');book.openStories();});button('继续游历',()=>close('completed'));return;
    }
    if(mode==='guide') {
      el('h2','想去找哪位街坊？');
      for(const item of missingItems(config,store.getState())){
        const instance=config.instances.find(i=>i.itemId===item.itemId),permit=config.permissions.find(p=>p.id===instance.permissionId),npc=config.npcs.find(n=>n.id===permit.grantedBy);
        button(npc.name+' · '+config.items.find(i=>i.id===item.itemId).name,()=>{chooseGuide(npc.id);close('completed');});
      }
      button('找老周交付',()=>{chooseGuide(config.quest.giverId);close('completed');});return;
    }
    const n=node(),line=n.lines[lineIndex]??'',colon=line.indexOf('：');
    el('small',mode==='closing'?'虹桥急情 · 收尾':'虹桥急情');
    const speaker=colon>0?line.slice(0,colon):'',portrait=speakerPortrait(speaker);
    if(portrait){const frame=el('figure');frame.className='hq-portrait';const img=el('img',undefined,frame);img.src=portrait.src;img.alt=portrait.label+'头像';el('figcaption',portrait.label,frame);dialog.dataset.portrait=portrait.id;}else delete dialog.dataset.portrait;
    el('h2',speaker);el('p',colon>0?line.slice(colon+1):line).id='hq-line';
    el('small',`${lineIndex+1} / ${n.lines.length}`);
    if(!choicesOnly&&lineIndex<n.lines.length-1)button('继续 E',next,dialog,'hq_next');
    else {const choices=el('nav');for(const choice of n.choices??[])button(choice.label,()=>choose(choice),choices,choice.id);}
  }
  function showEnding(){mode='ending';nodeId='HQ_42';begin();render();}
  function showClosing(){mode='closing';nodeId='HQ_43';lineIndex=0;choicesOnly=false;begin();render();}
  function showCompletion(){mode='card';nodeId='hq_completion_card';begin();render();}
  dialog.addEventListener('cancel',event=>{event.preventDefault();close('cancelled');});
  addEventListener('keyup',event=>{if(event.code==='KeyE'&&dialog.open){armed=true;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}},true);
  addEventListener('blur',()=>{if(dialog.open){armed=true;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}});
  return {advance:next,showNPC,showEnding,showClosing,showCompletion,close,isOpen:()=>dialog.open,getState:()=>({mode,nodeId,lineIndex,armed,lastResult,npcId:definition?.npcId})};
}
