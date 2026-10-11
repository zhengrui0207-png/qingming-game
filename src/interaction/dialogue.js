import {createDialogueSession,interactionConfig} from './core.js';
import './dialogue.css';
export function createDialogueUI({locks,gate,condition,effect,onResult=()=>{}}){
 const dialog=document.createElement('dialog');dialog.id='interaction-dialogue';dialog.setAttribute('aria-label','人物对话');document.body.append(dialog);
 let session=null,release=null,shown=0,nodeId=null,frame=0,last=0,lastResult=null,renderKey=null;
 const el=(tag,text)=>{const n=document.createElement(tag);n.textContent=text;return n;};
 function close(result){lastResult=result;cancelAnimationFrame(frame);dialog.close();release?.();release=null;session=null;onResult(result);}
 function render(){if(!session)return;const node=session.node;if(nodeId!==node.id){nodeId=node.id;shown=0;}
  const key=JSON.stringify([node.id,session.revealed,Math.floor(shown),gate.held('KeyE'),locks.top?.owner,session.options().map(o=>o.id)]);if(renderKey===key)return;renderKey=key;
  dialog.replaceChildren(el('small','对话'),el('h2',node.speaker),el('p',session.revealed?node.text:node.text.slice(0,Math.floor(shown))));
  const ready=!gate.held('KeyE')&&locks.top?.owner==='dialogue';
  if(session.revealed&&node.options?.length){for(const option of session.options()){const b=el('button',option.text);b.disabled=!ready;b.onclick=()=>{if(!gate.held('KeyE')&&locks.top?.owner==='dialogue'){session?.choose(option.id);render();}};dialog.append(b);}}
  else dialog.append(el('span','E '+(session.revealed?'继续':'显示全文')));
  const cancel=el('button','取消 Esc');cancel.onclick=()=>session?.cancel();dialog.append(cancel);
 }
 function tick(ms){if(!session)return;if(!session.revealed)shown+=(ms-last)/1000*interactionConfig.charactersPerSecond;last=ms;if(shown>=session.node.text.length)session.reveal();render();frame=requestAnimationFrame(tick);}
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(locks.top?.owner==='dialogue')session?.cancel();});
 return {open(definition){if(session)return false;lastResult=null;nodeId=null;renderKey=null;session=createDialogueSession(definition,{condition,effect,onClose:close});release=locks.acquire('dialogue',()=>session?.cancel());render();dialog.showModal();last=performance.now();frame=requestAnimationFrame(tick);return true;},
 advance(){if(session&&locks.top?.owner==='dialogue'){session.advance();render();}},cancel(){session?.cancel();},isOpen:()=>!!session,getState:()=>({open:!!session,nodeId:session?.node.id,revealed:session?.revealed,result:lastResult,awaitingRelease:gate.held('KeyE')})};
}
