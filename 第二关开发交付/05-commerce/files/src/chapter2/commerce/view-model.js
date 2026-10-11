import {configuration as C} from '../core/service.js';
export const shop = id => C.shops.find(s=>s.id===id);
export const item = id => C.items.find(i=>i.id===id);
export const nameOf = (id,content) => content.items.find(i=>i.id===id)?.name ?? item(id)?.name ?? id;
export function tabsFor(id){return id==='shop_c2_food'?['food']:id==='shop_c2_fish'?['sell','buyback','help']:['sell','buy','treasures','barter','buyback'];}
export const tabNames={sell:'售出',buy:'购入',treasures:'藏物',barter:'换物',buyback:'回购',food:'补给',help:'请教'};
export function incomePreview(s,total){const debtPaid=Math.min(s.travel.relief.debt,total);return {debtPaid,coins:total-debtPaid};}
export function rowsFor(s,id,tab,content){
 const sh=shop(id),coins=s.travel.wallet.coins,energy=s.travel.energy,instances=Object.values(s.travel.instances);
 if(tab==='sell')return C.items.filter(d=>sh.acceptedCategories.includes(d.category)&&!d.unique&&d.ownership==='owned'&&d.sellPrice!==null).map(d=>({id:d.id,name:nameOf(d.id,content),held:s.inventory[d.id]??0,price:d.sellPrice,disabled:!(s.inventory[d.id]>0),detail:'每件 '+d.sellPrice+' 文'}));
 if(tab==='treasures')return instances.filter(i=>i.ownership==='owned'&&item(i.itemId)?.category==='treasure').map(i=>({id:i.id,itemId:i.itemId,name:nameOf(i.itemId,content),held:1,price:item(i.itemId).sellPrice,protected:i.protected,disabled:item(i.itemId).sellPrice===null,detail:item(i.itemId).sellPrice===null?'他人之物／任务物，不可出售':i.protected?'收藏保护中，先明确解除':'可单独出售；已知故事仍保留'}));
 if(tab==='buy')return sh.offers.map(o=>{const existing=instances.some(i=>i.itemId===o.itemId),available=s.travel.commerce.shopStock[o.id]>0&&!existing&&(o.id!=='offer_c2_bell_later'||s.chapter2.repair.rewardChoice==='cash');return {id:o.id,name:nameOf(o.itemId,content),price:o.price,held:s.inventory[o.itemId]??0,stock:available?1:0,disabled:!available||coins<o.price,detail:!available?(existing?'本件已取得过，请查看回购':'当前未上架'):coins<o.price?'铜钱不足':'库存 1 件，入囊即收藏保护'};});
 if(tab==='food')return sh.offers.map(o=>{const food=C.balance.food.find(f=>f.itemId===o.itemId),recovery=Math.min(food.energy,energy.max-energy.current);return {id:o.id,name:nameOf(o.itemId,content),price:food.price,recovery,nominal:food.energy,disabled:recovery===0||coins<food.price,detail:recovery===0?'精力已满，不会扣钱':coins<food.price?'铜钱不足':`实际恢复 ${recovery}（通常 +${food.energy}）`};});
 if(tab==='barter')return C.barters.filter(b=>b.shopId===id).map(b=>{const i=instances.find(i=>i.itemId===b.inputItemId&&i.ownership==='owned'),used=s.travel.commerce.barterCounts[b.id]??0,remaining=b.limit-used,outputOwned=instances.some(i=>i.itemId===b.outputItemId),resolved=s.chapter2.storyStages.story_c2_silent_bell==='stage_c2_silent_bell_resolved';return {id:b.id,instanceId:i?.id,name:nameOf(b.inputItemId,content)+' 换 '+nameOf(b.outputItemId,content),disabled:!remaining||!i||i.protected||!resolved||outputOwned||!s.travel.commerce.shopStock.offer_c2_cup,detail:!remaining?'本次换物已用完':!i?'尚未持有铜铃':!resolved?'先向石伯了解铜铃的本关故事':i.protected?'先在「藏物」解除铜铃保护':outputOwned?'青釉盏已取得过':`余 ${remaining} 次；铜铃交付后不能回购`};});
 if(tab==='buyback')return [...s.travel.commerce.buyback].reverse().map(rid=>s.travel.commerce.receipts.find(r=>r.id===rid)).filter(r=>r?.shopId===id&&r.buybackEligible).slice(0,C.balance.buybackLimit).map(r=>({id:r.id,name:r.lines.map(l=>`${nameOf(l.itemId,content)} ×${l.quantity}`).join('、'),price:r.buybackPrice,disabled:coins<r.buybackPrice,detail:'按原售出价取回原物；唯一藏物恢复保护',receipt:r}));
 return [];
}
// Quotes describe the current state only. The core independently validates every action.
export function quoteFor(s,id,tab,rowId,quantity,content){
 const row=rowsFor(s,id,tab,content).find(r=>r.id===rowId);if(!row)throw Error('报价已失效，请返回铺面');
 if(row.disabled)throw Error(row.detail||'此项当前不可成交');
 let type,payload={shopId:id},title,details=[];
 if(tab==='sell'){
  if(!Number.isSafeInteger(quantity)||quantity<1||quantity>row.held)throw Error('数量须为持有范围内的正整数');
  const total=row.price*quantity;if(!Number.isSafeInteger(total))throw Error('金额超出安全整数范围');
  type='sell';payload.lines=[{itemId:row.id,quantity}];title=`售出 ${row.name} ×${quantity}`;const net=incomePreview(s,total);details=[`单价 ${row.price} 文 · 共 ${total} 文`,`先偿欠账 ${net.debtPaid} 文，入钱包 ${net.coins} 文`];
 }else if(tab==='treasures'){
  if(row.protected){type='toggleProtection';payload={instanceId:row.id,protected:false};title='解除 '+row.name+' 的收藏保护';details=['物件仍在行囊；解除保护后需再次确认才会出售。','收藏历史和已知故事保留，当前任务需要的物件仍由服务保护。'];}
  else {type='sell';payload.lines=[{itemId:row.itemId,instanceId:row.id,quantity:1}];title='售出 '+row.name;const net=incomePreview(s,row.price);details=[`此原件售价 ${row.price} 文，先偿债 ${net.debtPaid} 文，入钱包 ${net.coins} 文。`,'持有状态改为售出，收藏历史与已知故事保留。'];}
 }else if(tab==='buy'){type='buy';payload={...payload,offerId:row.id,quantity:1};title='购入 '+row.name;details=[`支付 ${row.price} 文，购入 1 件。`,'入囊后自动收藏保护，不能默认批量出售。'];}
 else if(tab==='food'){type='eat';payload.offerId=row.id;title='用 '+row.name;details=[`支付 ${row.price} 文，实际恢复 ${row.recovery} 精力。`,`精力 ${s.travel.energy.current} → ${s.travel.energy.current+row.recovery}／${s.travel.energy.max}`];}
 else if(tab==='barter'){type='barter';payload={...payload,barterId:row.id,instanceId:row.instanceId};title=row.name;details=['交付铜铃原件，取得青釉盏；铜钱不变。','仅此一次，交付他人的铜铃不能回购；已知故事记录保留。'];}
 else if(tab==='buyback'){type='buyback';payload.receiptId=row.id;title='回购 '+row.name;details=[`支付 ${row.price} 文，取回此笔原物。`,'不会复制新藏物；买回唯一藏物恢复收藏保护。'];}
 else throw Error('未知交易类别');
 return {type:'c2/'+type,payload,title,details};
}
export function helpQuote(s,id,kind){
 const b=C.balance.relief,available=s.travel.energy.current-s.travel.energy.reserved;
 if(kind==='borrow'&&id==='shop_c2_fish')return {type:'c2/acceptQuest',payload:{questId:'quest_c2_fishing_intro'},title:'向鲁七借竿学钓鱼',details:['借来的钓竿和基础饵不可售出。','教学杆必有鱼；之后可将鱼带回鲁七这里出售。']};
 if(kind==='relief'&&id==='shop_c2_food'){
  if(s.travel.wallet.coins>=b.coinsThreshold||available>=b.energyThreshold||s.travel.relief.debt)throw Error('尚不符合赊食条件，或已有欠账');
  return {type:'c2/requestRelief',payload:{shopId:id},title:'赊一份蒸饼',details:[`恢复 ${Math.min(b.energy,s.travel.energy.max-s.travel.energy.current)} 精力，记欠账 ${b.debt} 文。`,'先向鲁七借竿；下一杆保证鱼，卖物收入先偿债。','已有欠账又耗尽时，可找鲁七整理渔具偿债，走路和交谈照常。']};
 }
 if(kind==='work'&&id==='shop_c2_fish')return {type:'c2/settleReliefWork',payload:{npcId:'npc_c2_fisher'},title:'替鲁七整理渔具偿债',details:[`清偿现有欠账 ${s.travel.relief.debt} 文。`,'不耗精力，不增加铜钱；仅在欠债且可用精力不足 4 时成立。']};
 throw Error('无此铺面操作');
}
