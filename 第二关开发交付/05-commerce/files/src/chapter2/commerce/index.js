import './commerce.css';
import contentDefault from '../content/content.json' with {type:'json'};
import {configuration as C} from '../core/service.js';
import {manifest} from '../scene/physics.js';
import {createController} from './controller.js';
import {shop,rowsFor,tabsFor,tabNames} from './view-model.js';
export function create(context,{container=document.body,content=contentDefault,anchors=manifest.anchors,registerNPCs=true}={}){
 const root=document.createElement('section');root.className='c2-commerce';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-labelledby','c2-commerce-title');
 const hud=document.createElement('aside');hud.className='c2-commerce-hud';hud.setAttribute('aria-label','行旅状态');container.append(hud,root);
 let controller,dead=false,lastSignature='',previousFocus=null,wasOpen=false,lastPoll=0;
 const button=(text,action,fn,disabled=false)=>{const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.action=action;b.disabled=disabled;b.addEventListener('click',fn);return b;};
 const text=(tag,value,cls)=>{const el=document.createElement(tag);el.textContent=value;if(cls)el.className=cls;return el;};
 function navigate(anchorId){controller.cancel('navigate');context.ports.navigate?.(anchorId);}
 function render(){
  if(dead||!controller)return;const state=controller.getState(),s=context.service.getState(),status=context.service.getStatus(),open=state.phase!=='closed';
  const signature=JSON.stringify({state,energy:s.travel.energy.current,reserved:s.travel.energy.reserved,coins:s.travel.wallet.coins,debt:s.travel.relief.debt,inventory:s.inventory,commerce:s.travel.commerce,instances:s.travel.instances,stories:s.chapter2.storyStages,repair:s.chapter2.repair.rewardChoice,pending:status.pending,saved:status.saved,region:s.travel.regionId});if(signature===lastSignature)return;lastSignature=signature;
  if(open&&!wasOpen)previousFocus=document.activeElement;const active=root.contains(document.activeElement)?document.activeElement:null,focusAction=active?.dataset.action,focusRow=active?.dataset.row,selection=active?.selectionStart;wasOpen=open;
  hud.hidden=!s.travel.initialized||s.travel.regionId!==C.region.id;hud.replaceChildren();
  const purse=text('div',`${s.travel.wallet.coins} 文`,'c2-commerce-hud__coins');purse.setAttribute('data-testid','coins');hud.append(purse,text('div',`精力 ${s.travel.energy.current}／${s.travel.energy.max}${s.travel.energy.reserved?' · 预留 '+s.travel.energy.reserved:''}`),text('div',`欠账 ${s.travel.relief.debt} 文`));
  if(s.travel.energy.current<20){const frame=context.ports.getFrame(),food=anchors.find(a=>a.id==='anchor_c2_food_vendor');hud.append(text('p','脚步慢些也无妨，走路和交谈照常。'));hud.append(button(`最近补给 · 王家蒸作${frame.actor&&food?' '+Math.round(Math.hypot(frame.actor.x-food.position[0],frame.actor.z-food.position[2]))+'米':''}`,'navigate-food',()=>navigate('anchor_c2_food_vendor')));}
  if(s.travel.relief.debt&&s.travel.energy.current-s.travel.energy.reserved<4)hud.append(button('找鲁七整理渔具偿债','navigate-work',()=>navigate('anchor_c2_fisher')));
  if(!status.saved){const pending=text('div',status.message,'c2-commerce-save');pending.setAttribute('role','alert');pending.append(button('重试保存','retry-save',()=>controller.retry()));hud.append(pending);}
  root.hidden=!open;if(!open){root.replaceChildren();if(previousFocus?.isConnected&&document.hasFocus())previousFocus.focus();previousFocus=null;return;}
  root.replaceChildren();const panel=document.createElement('div');panel.className='c2-commerce__ledger';root.append(panel);
  const sh=shop(state.shopId),npc=content.npcs.find(n=>n.id===sh.npcId);const head=document.createElement('header');head.append(text('p','虹桥至城门 · 铺前交易簿','c2-commerce__eyebrow'));const title=text('h2',npc?.name??sh.npcId);title.id='c2-commerce-title';head.append(title,button('关闭 · Esc','close',()=>controller.cancel()));panel.append(head);
  panel.append(text('p',`${s.travel.wallet.coins} 文 · 精力 ${s.travel.energy.current} · 欠账 ${s.travel.relief.debt} 文`,'c2-commerce__balance'));
  if(state.error){const err=text('p',content.activityText.errors[state.result?.error?.code]??state.error,'c2-commerce__error');err.setAttribute('role','alert');panel.append(err);}
  if(state.phase==='browse'){
   const nav=document.createElement('nav');nav.setAttribute('aria-label','铺面类别');for(const tab of tabsFor(state.shopId)){const b=button(tabNames[tab],'tab-'+tab,()=>controller.browse(tab));b.setAttribute('aria-current',String(tab===state.tab));nav.append(b);}panel.append(nav);
   const list=document.createElement('div');list.className='c2-commerce__list';panel.append(list);
   if(state.tab==='sell')list.append(text('p','只列本铺收购的普通物品。借物、任务物和唯一藏物另受保护。','c2-commerce__note'));
   if(state.tab==='buyback')list.append(text('p',`本铺最近 ${C.balance.buybackLimit} 笔可回购售出凭证。归还或换给他人的物件不在此列。`,'c2-commerce__note'));
   if(state.tab==='treasures'&&context.ports.openBook)list.append(button('查看风物志中的收藏与故事','open-book',()=>{controller.cancel('book');context.ports.openBook('collection');}));
   const rows=rowsFor(s,state.shopId,state.tab,content);
   for(const row of rows){const line=document.createElement('div');line.className='c2-commerce__row';line.dataset.row=row.id;
    const label=document.createElement('div');label.append(text('h3',row.name),text('p',row.detail,'c2-commerce__note'));if(row.held!==undefined)label.append(text('span','持有 '+row.held,'c2-commerce__held'));line.append(label);
    if(row.price!==undefined&&row.price!==null)line.append(text('strong',`${row.price} 文`,'c2-commerce__price'));
    let input=null;if(state.tab==='sell'){const group=document.createElement('label');group.className='c2-commerce__quantity';group.append(text('span','数量'));input=document.createElement('input');input.type='number';input.min='1';input.max=String(row.held);input.step='1';input.value=row.held?'1':'0';input.disabled=row.disabled;input.dataset.row=row.id;input.setAttribute('aria-label',row.name+'出售数量');group.append(input);line.append(group);}
    const action=state.tab==='treasures'?(row.protected?'解除保护':'单独出售'):state.tab==='buyback'?'回购':state.tab==='food'?'选这份':state.tab==='barter'?'换物':state.tab==='buy'?'购入':'售出';
    line.append(button(action,'row-'+row.id,()=>controller.stage(state.tab,row.id,input?Number(input.value):1),row.disabled||status.pending));list.append(line);
   }
   if(!rows.length&&state.tab!=='help')list.append(text('p','目前没有这一类物件。','c2-commerce__empty'));
   if(state.shopId==='shop_c2_food'){
    list.append(text('p','王小满：眼下若连蒸饼也买不起，先赊一份。卖物所得先还账；再累倒了，鲁七那边可帮忙整理渔具偿债。','c2-commerce__speech'));
    const rod=Object.values(s.travel.instances).some(i=>i.itemId==='item_c2_basic_rod'&&i.ownership==='borrowed'),b=C.balance.relief;
    const eligible=s.travel.wallet.coins<b.coinsThreshold&&s.travel.energy.current-s.travel.energy.reserved<b.energyThreshold&&!s.travel.relief.debt;
    list.append(button(`赊蒸饼 · 欠 ${b.debt} 文／恢复最多 ${b.energy}`,'relief',()=>controller.stage('help','relief'),!eligible||!rod||status.pending));
    if(!rod)list.append(button('先去找鲁七借竿，备好偿债办法','navigate-borrow',()=>navigate('anchor_c2_fisher')));
    if(s.travel.relief.debt)list.append(text('p','欠账由下次卖物收入自动偿还；无须额外付一次钱。'));
   }
   if(state.tab==='help'){
    list.append(text('p','鲁七：鱼送到我面前来，我按品类收。竿是借你的；若欠了饭钱又没力气，帮我整理渔具就抵了债。','c2-commerce__speech'));
    list.append(button('借竿学钓鱼','borrow',()=>controller.stage('help','borrow'),s.chapter2.quests.quest_c2_fishing_intro.status!=='available'||status.pending));
    list.append(button('去近舟钓点','navigate-fishing',()=>navigate('anchor_c2_fishing_a')));
    list.append(button('整理渔具偿债（不耗精力）','work',()=>controller.stage('help','work'),!(s.travel.relief.debt>0&&s.travel.energy.current-s.travel.energy.reserved<4)||status.pending));
   }
  }else if(state.phase==='confirm'||state.phase==='submitting'){
   panel.append(text('p','待你点头才成交','c2-commerce__eyebrow'),text('h3',state.quote.title));for(const d of state.quote.details)panel.append(text('p',d));const actions=document.createElement('footer');actions.append(button('暂不成交','back',()=>controller.browse(),state.phase==='submitting'),button('确认成交','confirm',()=>controller.confirm(),state.phase==='submitting'||status.pending));panel.append(actions);
  }else if(state.phase==='save-error'){
   panel.append(text('h3','这笔进度尚未保存'),text('p','本页保留待保存结果，余额仍显示已保存值。关闭铺面不会撤销已确认的提交；请先重试保存，暂勿刷新。'),button('重试保存','retry-save',()=>controller.retry()));
  }else if(state.phase==='result'){
   panel.append(text('p','落账 · 已保存','c2-commerce__stamp'),text('h3',state.quote?.title??'待保存进度已恢复'));for(const d of state.quote?.details??[])panel.append(text('p',d));
   const r=state.result?.data?.receipt;if(r)panel.append(text('p',`收据 ${r.id.slice(-12)}${r.debtPaid?' · 已偿债 '+r.debtPaid+' 文':''}`,'c2-commerce__note'));
   panel.append(button('返回铺面','back',()=>controller.browse()));
  }
  const focusables=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')];const retained=focusables.find(e=>focusAction?e.dataset.action===focusAction:focusRow?e.dataset.row===focusRow:false);const next=retained??(state.phase==='confirm'?root.querySelector('[data-action="back"]'):focusables[0]);if(document.hasFocus())next?.focus();if(retained&&selection!==null&&retained.type==='text')retained.setSelectionRange(selection,selection);
 }
 controller=createController(context,{anchors,content,registerNPCs,onChange:render});
 const trap=e=>{if(e.key!=='Tab')return;const f=[...root.querySelectorAll('button:not(:disabled),input:not(:disabled)')];if(!f.length)return;const at=f.indexOf(document.activeElement);if(e.shiftKey&&at<=0){e.preventDefault();f.at(-1).focus();}else if(!e.shiftKey&&(at===f.length-1||at===-1)){e.preventDefault();f[0].focus();}};root.addEventListener('keydown',trap);
 const blur=()=>controller.cancel('blur'),hidden=()=>{if(document.hidden)controller.cancel('hidden');},exit=()=>controller.cancel('pagehide');window.addEventListener('blur',blur);window.addEventListener('pagehide',exit);document.addEventListener('visibilitychange',hidden);render();
 return {open:controller.open,update(dt,frame){controller.update(dt,frame);lastPoll+=dt;if(lastPoll>.2){lastPoll=0;render();}},cancel:controller.cancel,getState:controller.getState,dispose(){if(dead)return;controller.dispose();dead=true;root.removeEventListener('keydown',trap);window.removeEventListener('blur',blur);window.removeEventListener('pagehide',exit);document.removeEventListener('visibilitychange',hidden);root.remove();hud.remove();},controller};
}
