import './fishing.css';
import {createController,timings,recoveryAnchor} from './controller.js';
import {createRig} from './rig.js';
import measured from '../scene/anchors.json' with {type:'json'};
import content from '../content/content.json' with {type:'json'};
export {recoveryAnchor};
function sound(){let audio=null;const active=new Set();return {play(kind){try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')void audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);const now=audio.currentTime;osc.frequency.setValueAtTime(({cast:240,bite:740,reel:330,caught:540,lost:170})[kind]??300,now);osc.frequency.exponentialRampToValueAtTime(kind==='bite'?1100:220,now+.16);gain.gain.setValueAtTime(.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+.23);active.add(osc);osc.onended=()=>{active.delete(osc);osc.disconnect();gain.disconnect();};osc.start();osc.stop(now+.25);}catch{}},dispose(){for(const osc of active)try{osc.stop();}catch{}active.clear();void audio?.close().catch(()=>{});}};}
/** P0 factory; optional asset/DOM hooks add no state service actions. */
export function create(context,options={}){
 const anchors=options.anchors?.anchors??options.anchors??measured.anchors,definition=options.content??content;
 const root=document.createElement('section');root.className='c2-fishing';root.hidden=true;root.setAttribute('aria-label','河边钓鱼');root.innerHTML=`<div class="eyebrow">汴河 · 每杆精力 −4</div><h2 data-title></h2><div class="status" data-status role="status" aria-live="polite"></div><p class="notes" data-note></p><progress data-progress max="1" value="0" aria-label="本阶段进度"></progress><div class="tension" data-tension hidden><span class="needle" data-needle></span></div><div class="choices" data-choices><label><input type="checkbox" data-simple checked> 简易收杆（点击一次）</label><label data-token-label hidden><input type="checkbox" data-token> 取回鲁七的木牌</label></div><p class="error" data-error role="alert"></p><button data-confirm>抛竿</button><button data-hold hidden>按住提线，松开缓线</button><button data-book class="secondary" hidden>看风物志</button><button data-fisher class="secondary" hidden>去借竿</button><button data-retry hidden>重试保存</button><button data-leave class="secondary">离开 · Esc</button>`;
 (options.container??document.body).append(root);const $=attr=>root.querySelector('[data-'+attr+']');
 const audio=sound(),rig=createRig(context.scene,{anchors,getHandPosition:options.getHandPosition,getModel:options.getModel});let controller=null,disposed=false,lastPhase=null;
 const labels={idle:'河边垂钓',prepared:'把竿拿稳',casting:'抛竿入水',waiting:'浮子轻晃，先等一等',bite:'浮子沉了——收杆',reeling:'慢慢提线',settling:'正在保存所得',retrieving:'把这一杆带上岸',result:'这一杆已结束','save-error':'保存尚未完成'};
 function render(s){if(disposed)return;root.hidden=s.phase==='idle';root.dataset.phase=s.phase;$('title').textContent=labels[s.phase]??'河边钓鱼';
  const owned=Object.values(context.service.getState().travel.instances).some(i=>i.itemId==='item_c2_basic_rod'&&i.ownership==='borrowed');
  $('status').textContent=s.phase==='result'?(s.result?.itemId?`所得：${({fish:'鱼获',junk:'杂物',rare:'珍稀旧物',treasure:'藏物'})[definition.items.find(i=>i.id===s.result.itemId)?.category]??'物件'} · ${definition.items.find(i=>i.id===s.result.itemId)?.name??s.result.itemId} × ${s.result.quantity} · 已记入风物志`:'此杆未得物。已耗4精力，钓竿不损坏。'):`可用精力 ${s.availableEnergy} / 100${!owned?' · 先向鲁七免费借竿':''}`;
  $('note').textContent=s.phase==='bite'?'点收杆或按空格。简易模式不催你抢按。':s.phase==='reeling'?(s.simple?'轻点之后自动收杆，结果池与普通模式相同。':'按住空格提线，张力高时松开。绿区宽，短暂越界不会立即失败。'):s.phase==='prepared'?'基础竿与基础饵免费；教学第一杆得到普通鱼。Esc随时退出。':s.phase==='result'?'卖掉实物后，风物志记录仍保留。':'岸上落脚不变；已抛这杆中途退出仍耗4精力。';
  $('error').textContent=(definition.activityText.errors[s.error?.code]??s.error?.message)??'';$('error').hidden=!s.error;
  $('confirm').hidden=!['prepared','bite','result'].includes(s.phase);$('confirm').textContent=s.phase==='prepared'?'抛竿 · 精力−4':s.phase==='bite'?'收杆':'再钓一杆';$('confirm').disabled=s.pendingSave||s.phase==='prepared'&&(!s.canCast||!owned);
  $('choices').hidden=s.phase!=='prepared';$('simple').checked=s.simple;const canToken=s.pointId==='point_c2_b'&&context.service.getState().chapter2.quests.quest_c2_token.status==='active';$('token-label').hidden=!canToken;$('token').checked=s.token;
  $('hold').hidden=s.phase!=='reeling'||s.simple;$('book').hidden=s.phase!=='result'||!s.result?.itemId;$('fisher').hidden=s.phase!=='prepared'||owned;$('retry').hidden=!s.pendingSave;
  $('tension').hidden=s.phase!=='reeling'||s.simple;$('needle').style.left=(s.tension*100)+'%';const duration=timings[s.phase];$('progress').hidden=!duration;$('progress').value=duration?Math.min(1,s.phaseSeconds/duration):0;
  if(lastPhase!==s.phase){lastPhase=s.phase;if(!root.hidden&&['prepared','bite','result','save-error'].includes(s.phase))queueMicrotask(()=>{if(!disposed&&!root.hidden)(s.pendingSave?$('retry'):$('confirm')).focus({preventScroll:true});});}
 }
 controller=createController(context,{anchors,onChange:render,cue:kind=>audio.play(kind),onClose:()=>{}});
 const abort=new AbortController(),opt={signal:abort.signal};
 $('confirm').addEventListener('click',()=>controller.confirm(),opt);$('leave').addEventListener('click',()=>controller.cancel('user'),opt);$('retry').addEventListener('click',()=>controller.retry(),opt);$('simple').addEventListener('change',e=>controller.setSimple(e.target.checked),opt);$('token').addEventListener('change',e=>controller.setToken(e.target.checked),opt);
 $('hold').addEventListener('pointerdown',e=>{controller.setHeld(true);e.target.setPointerCapture(e.pointerId);},opt);for(const name of ['pointerup','pointercancel','lostpointercapture'])$('hold').addEventListener(name,()=>controller.setHeld(false),opt);
 $('book').addEventListener('click',()=>{controller.cancel('user');context.ports.openBook('collection');},opt);$('fisher').addEventListener('click',()=>{controller.cancel('user');context.ports.navigate('anchor_c2_fisher');},opt);
 window.addEventListener('blur',()=>controller.cancel('blur'),opt);document.addEventListener('visibilitychange',()=>{if(document.hidden)controller.cancel('hidden');},opt);window.addEventListener('pagehide',()=>{controller.cancel('hidden');context.service.flush?.();},opt);
 return {update(dt,frame){if(disposed)return;controller.update(dt,frame);rig.update(controller.getState(),frame);},cancel:reason=>controller.cancel(reason),getState:()=>Object.freeze({...controller.getState(),rig:rig.getState()}),dispose(){if(disposed)return;controller.dispose();disposed=true;abort.abort();rig.dispose();audio.dispose();root.remove();}};
}
export const mount=create;
export default create;
