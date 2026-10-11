import {contract as C, emptyChapter2Extension, itemDefinition} from '../contracts/index.js';
import {validateAction, validateExtension, validateCondition} from '../contracts/validate.js';
export const configuration = C;
const clone = x => structuredClone(x);
const uint = x => Number.isSafeInteger(x) && x >= 0;
const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const require = (ok, code, message = code) => {if (!ok) throw Object.assign(Error(message), {code});};
const checked = x => {require(uint(x), 'invalid-quantity', '数量或金额超出安全整数范围'); return x;};
const instance = (s, itemId) => Object.values(s.travel.instances).find(x => x.itemId === itemId);
const available = s => s.travel.energy.current - s.travel.energy.reserved;
const busyRepair = s => ['active','ready'].includes(s.chapter2.repair.status);
const addGoal = (s, id) => {if (!s.chapter2.goalIds.includes(id)) s.chapter2.goalIds.push(id);};
const shop = id => C.shops.find(x => x.id === id);
export function conditionMatches(s, c) {
  if (!validateCondition(c).ok) return false;
  switch (c.kind) {
    case 'questStatus': return s.chapter2.quests[c.questId]?.status === c.status;
    case 'goalCompleted': return s.chapter2.goalIds.includes(c.goalId);
    case 'storyStage': return s.chapter2.storyStages[c.storyId] === c.stageId;
    case 'itemOwned': return (s.inventory[c.itemId] ?? 0) >= c.quantity;
    case 'repairStatus': return s.chapter2.repair.status === c.status;
    case 'rewardChoice': return s.chapter2.repair.rewardChoice === c.choice;
    default: return false;
  }
}
function needed(s, itemId, content) {
  if (itemId === 'treasure_c2_marked_token' || itemDefinition(itemId)?.ownership === 'borrowed' || C.save.legacyBorrowedIds.includes(itemId)) return true;
  const story = C.stories.find(x => x.itemId === itemId);
  if (story && s.chapter2.storyStages[story.id] !== story.stageIds.at(-1) && content?.draft !== false) return true;
  // A configured unresolved stage with an ownership condition is an outstanding need.
  return (content?.storyRules ?? []).some(rule => rule.stages.some(stage => {
    const def = C.stories.find(x => x.id === rule.storyId);
    const current = def?.stageIds.indexOf(s.chapter2.storyStages[rule.storyId]) ?? -1;
    const target = def?.stageIds.indexOf(stage.id) ?? -1;
    return target > current && stage.all.some(c => c.kind === 'itemOwned' && c.itemId === itemId);
  }));
}
function addItem(s, itemId, quantity, sourceId, at) {
  const def = itemDefinition(itemId);
  require(def && def.consumption === 'inventory', 'unknown-entity'); checked(quantity);
  if (def.unique) {
    require(quantity === 1 && !instance(s, itemId), 'out-of-stock', '唯一物件已经领取过');
    const id = `instance:${s.travel.transactions.saveEpoch}:${itemId}`;
    s.travel.instances[id] = {id, itemId, ownership:def.ownership, protected:def.protectedByDefault, firstObtainedAt:at, sourceId};
  }
  s.inventory[itemId] = checked((s.inventory[itemId] ?? 0) + quantity);
  const old = s.travel.collection[itemId];
  s.travel.collection[itemId] = {firstObtainedAt:old?.firstObtainedAt ?? at, totalObtained:checked((old?.totalObtained ?? 0) + quantity), sourceIds:[...new Set([...(old?.sourceIds ?? []),sourceId])]};
  const story = C.stories.find(x => x.itemId === itemId);
  if (story && !s.chapter2.storyStages[story.id]) s.chapter2.storyStages[story.id] = story.stageIds[0];
}
function credit(s, amount) {
  checked(amount);
  const debtPaid = Math.min(s.travel.relief.debt, amount);
  s.travel.relief.debt -= debtPaid;
  s.travel.wallet.coins = checked(s.travel.wallet.coins + amount - debtPaid);
  return debtPaid;
}
function debit(s, amount) {
  checked(amount); require(s.travel.wallet.coins >= amount, 'insufficient-coins'); s.travel.wallet.coins -= amount;
}
function reachable(ctx, anchorId, allowPrevious = false) {
  const a = ctx.anchors?.find(x => x.id === anchorId), f = ctx.frame;
  require(a && Array.isArray(a.position) && a.position.length === 3 && a.position.every(Number.isFinite) && f?.actor, 'not-reachable', `缺少实测锚点或实时人物位置：${anchorId}`);
  require((f.regionId === 'region_d' || allowPrevious && f.regionId === 'region_c') && f.visible === true && f.focused === true, 'not-reachable');
  const p = f.actor;
  require(p.layer === a.layer && [p.x,p.z,p.height].every(Number.isFinite) && Math.hypot(p.x-a.position[0],p.z-a.position[2]) <= 2 && Math.abs(p.height-a.position[1]) <= .7, 'not-reachable');
}
function atShop(ctx, id) {const x = shop(id); require(x,'unknown-entity'); reachable(ctx,x.anchorId); return x;}
function receipt(s, ctx, action, kind, lines, coins, debtPaid=0, eligible=false) {
  const r = {id:action.transactionId,shopId:action.payload.shopId,kind,lines:clone(lines),coins,debtPaid,at:ctx.at,buybackEligible:eligible,buybackPrice:eligible?coins:null};
  s.travel.commerce.receipts.push(r);
  if (eligible) {
    s.travel.commerce.buyback.push(r.id);
    const sameShop = s.travel.commerce.buyback.filter(id => s.travel.commerce.receipts.find(x=>x.id===id)?.shopId === r.shopId);
    while (sameShop.length > C.balance.buybackLimit) {
      const id = sameShop.shift(); s.travel.commerce.buyback = s.travel.commerce.buyback.filter(x=>x!==id);
      s.travel.commerce.receipts.find(x=>x.id===id).buybackEligible = false;
    }
  }
  return r;
}
function event(s, ctx, id, detail) {
  if (s.chapter2.timing.events.some(x=>x.id===id)) return;
  s.chapter2.timing.events.push({id,at:ctx.at,operativeSeconds:s.chapter2.timing.operativeSeconds ?? 0,...(detail?{detail}:{})});
}
// Randomness is consumed at START only. The persisted result is authoritative at settlement.
function pickResult(s, mode, seed) {
  const b=C.balance.fishing;
  if (mode === 'token') return {itemId:'treasure_c2_marked_token', rare:false};
  if (['tutorial','relief'].includes(mode)) return {itemId:b.fishItemIds[0], rare:false};
  const draw=seed/4294967296*100;
  const rare=s.travel.fishing.rareMisses >= b.rareGuaranteeAt-1 || draw >= b.weights.fish+b.weights.junk;
  const pool=(rare?b.rareItemIds:draw<b.weights.fish?b.fishItemIds:b.junkItemIds).filter(id=>!itemDefinition(id).unique && !instance(s,id));
  require(pool.length,'out-of-stock');
  return {itemId:pool[(seed >>> 8)%pool.length], rare};
}
export function validateCoreSnapshot(s) {
  require(object(s.travel) && object(s.chapter2),'invalid-action');
  for(const [parent,key] of [[s.chapter2,'goalIds'],[s.travel,'readStoryIds'],[s.chapter2.repair,'stepIds'],[s.chapter2.timing,'events'],[s.chapter2.timing,'externalInterruptions']]) require(Array.isArray(parent?.[key]),'invalid-action',`Invalid ${key}`);
  const e=validateExtension(s); require(e.ok,'invalid-action',e.errors.join('; '));
  const t=s.travel,c=s.chapter2;
  for(const k of ['instances','collection','storyReadingProgress','commerce','relief','fishing','transactions']) require(object(t[k]),'invalid-action',`Invalid travel.${k}`);
  for(const k of ['quests','storyStages','presentations','timing']) require(object(c[k]),'invalid-action',`Invalid chapter2.${k}`);
  if(t.regionPositions!==undefined){
    require(object(t.regionPositions),'invalid-action');
    for(const [region,p] of Object.entries(t.regionPositions)) require(region==='region_d' && object(p) && [p.x,p.z,p.height].every(Number.isFinite) && ['ground','bridge'].includes(p.layer),'invalid-action');
  }
  require(t.regionId !== 'region_e' && (t.initialized || t.regionId === 'region_c'), 'invalid-action');
  const tr=t.transactions;
  require(tr.saveEpoch === null || /^[A-Za-z0-9_-]+$/.test(tr.saveEpoch),'invalid-action');
  require(tr.nextSequence>=tr.committedThrough && Array.isArray(tr.recent) && tr.recent.length<=256,'invalid-action');
  const txIds=new Set();
  for(const r of tr.recent){const n=Number(r.id?.split(':')[2]); require(r.id===`c2:${tr.saveEpoch}:${n}` && uint(n) && n>0 && n<=tr.committedThrough && !txIds.has(r.id) && typeof r.fingerprint==='string' && r.result?.ok===true,'invalid-action','Invalid transaction receipt'); txIds.add(r.id);}
  require(Array.isArray(c.repair.stepIds) && c.repair.stepIds.every((id,i)=>id===C.repair.stepIds[i]),'invalid-action','Invalid repair sequence');
  require(c.repair.reserved===(busyRepair(s)?C.repair.cost:0),'invalid-action','Invalid reservation');
  require(c.repair.rewardChoice===null || c.repair.status==='completed','invalid-action');
  require(c.repair.status!=='completed' || c.repair.stepIds.length===C.repair.stepIds.length,'invalid-action');
  require(c.repair.status!=='ready' || c.repair.stepIds.length===C.repair.stepIds.length,'invalid-action');
  require(!t.fishing.pendingCast || !busyRepair(s),'invalid-action');
  require(uint(t.fishing.sequence) && uint(t.fishing.rareMisses) && t.fishing.rareMisses<C.balance.fishing.rareGuaranteeAt && typeof t.fishing.tutorialCompleted==='boolean' && typeof t.fishing.tokenObtained==='boolean' && uint(t.relief.recoveryEpoch),'invalid-action');
  for(const i of C.items.filter(x=>x.unique)){
    const inst=instance(s,i.id),count=s.inventory[i.id]??0;
    require(count===(inst && ['owned','borrowed'].includes(inst.ownership)?1:0),'invalid-action','Unique inventory/ledger mismatch');
    if(inst) require(typeof inst.sourceId==='string' && typeof inst.firstObtainedAt==='string','invalid-action');
  }
  for(const [id,n] of Object.entries(s.inventory)) if(itemDefinition(id)) require(itemDefinition(id).consumption!=='immediate' && uint(n),'invalid-action');
  const p=t.fishing.pendingCast;
  if(p) require(object(p) && p.id===`cast:${tr.saveEpoch}:${t.fishing.sequence}` && C.fishingPoints.some(x=>x.id===p.pointId) && ['normal','simple','tutorial','token','relief'].includes(p.mode) && uint(p.seed) && p.seed<=4294967295 && p.chargedEnergy===C.balance.castEnergy && itemDefinition(p.resultItemId) && typeof p.rare==='boolean' && typeof p.startedAt==='string','invalid-action','Invalid pending cast');
  if(p){const selected=pickResult(s,p.mode,p.seed);require(p.resultItemId===selected.itemId && p.rare===selected.rare,'invalid-action','Pending result does not match authoritative seed/pity');}
  require(Array.isArray(t.commerce.receipts) && Array.isArray(t.commerce.buyback) && object(t.commerce.shopStock) && object(t.commerce.barterCounts),'invalid-action');
  const receiptIds=new Set();
  for(const r of t.commerce.receipts){require(object(r) && typeof r.id==='string' && !receiptIds.has(r.id) && shop(r.shopId) && ['sell','buy','barter','buyback'].includes(r.kind) && uint(r.coins) && uint(r.debtPaid) && Array.isArray(r.lines) && typeof r.buybackEligible==='boolean','invalid-action','Invalid commerce receipt'); receiptIds.add(r.id);
    for(const l of r.lines) require(itemDefinition(l.itemId) && uint(l.quantity) && l.quantity>0 && (!itemDefinition(l.itemId).unique || l.quantity===1 && typeof l.instanceId==='string'),'invalid-action');
    if(r.buybackEligible) require(r.kind==='sell' && r.buybackPrice===r.coins,'invalid-action');
  }
  require(new Set(t.commerce.buyback).size===t.commerce.buyback.length,'invalid-action');
  for(const id of t.commerce.buyback) require(t.commerce.receipts.some(r=>r.id===id && r.buybackEligible),'invalid-action');
  for(const sh of C.shops) require(t.commerce.buyback.filter(id=>t.commerce.receipts.find(r=>r.id===id)?.shopId===sh.id).length<=C.balance.buybackLimit,'invalid-action');
  for(const [id,n] of Object.entries(t.commerce.shopStock)) require(C.shops.flatMap(x=>x.offers).some(x=>x.id===id) && uint(n) && n<=1,'invalid-action');
  for(const [id,n] of Object.entries(t.commerce.barterCounts)) require(C.barters.some(x=>x.id===id && uint(n) && n<=x.limit),'invalid-action');
  for(const [id,stage] of Object.entries(c.storyStages)) require(C.stories.some(x=>x.id===id && x.stageIds.includes(stage)) && t.collection[C.stories.find(x=>x.id===id)?.itemId],'invalid-action');
  for(const x of Object.values(t.collection)) require(Array.isArray(x.sourceIds) && x.sourceIds.every(v=>typeof v==='string'),'invalid-action');
  require(['unseen','pending','seen'].includes(c.presentations.intro) && ['unseen','pending','seen'].includes(c.presentations.ending) && Array.isArray(c.timing.events) && Array.isArray(c.timing.externalInterruptions),'invalid-action');
  require(c.timing.lastWallAt===undefined || Number.isFinite(Date.parse(c.timing.lastWallAt)),'invalid-action');
  require(c.timing.clockAnomalies===undefined || Array.isArray(c.timing.clockAnomalies),'invalid-action');
  for(const e of c.timing.events) require(object(e) && typeof e.id==='string' && Number.isFinite(Date.parse(e.at)) && Number.isFinite(e.operativeSeconds) && e.operativeSeconds>=0,'invalid-action');
  for(const e of c.timing.externalInterruptions) require(object(e) && Number.isFinite(Date.parse(e.start)) && (e.end===null || Number.isFinite(Date.parse(e.end))) && typeof e.note==='string','invalid-action');
  require(Number.isFinite(c.timing.operativeSeconds??0) && (c.timing.operativeSeconds??0)>=0,'invalid-action');
  return true;
}
export function normalizeCore(s, version) {
  if(version<3) Object.assign(s,emptyChapter2Extension());
  else require(object(s.travel) && object(s.chapter2),'invalid-action','Missing v3 extension');
  validateCoreSnapshot(s); return s;
}
export function recoverActivities(s, at) {
  let changed=false;
  if(s.travel.fishing.pendingCast){
    s.travel.fishing.lastCast={...s.travel.fishing.pendingCast,outcome:'cancelled',settledAt:at,recoveryReason:'reload'};
    s.travel.fishing.pendingCast=null; changed=true;
  }
  if(busyRepair(s)){s.chapter2.repair.status='available';s.chapter2.repair.reserved=0;s.travel.energy.reserved=0; changed=true;}
  if(changed){s.revision++; s.chapter2.timing.externalInterruptions.push({start:at,end:at,note:'刷新恢复：保留钓杆扣费、维修步骤并释放未结算预留'});}
  return changed;
}
export function reduceChapter2(state, action, ctx) {
  try {
    const spec=C.actions.find(x=>x.type===action?.type);
    require(spec,'unknown-action');
    const validation=validateAction(action);
    if(!validation.ok){
      if(action.type==='c2/sell' && Array.isArray(action.payload?.lines)) for(const line of action.payload.lines){
        const def=itemDefinition(line.itemId);
        require(!C.save.legacyBorrowedIds.includes(line.itemId) && !(def && (def.ownership==='borrowed' || def.sellPrice===null)), 'protected-item', '借物和任务物不能出售');
        require(def,'unknown-entity');
      }
      const code=validation.errors.some(x=>x.includes('wrong shop'))?'wrong-shop':validation.errors.some(x=>/quantity|saleLines/.test(x))?'invalid-quantity':'invalid-action';
      require(false,code,validation.errors.join('; '));
    }
    const s=clone(state),t=s.travel,c=s.chapter2,p=action.payload,type=action.type.slice(3); let data={};
    if(type==='enterChapter2'){
      require(s.quests[C.entry.requiresQuestId]?.status==='completed' && s.endingPending===false,'chapter-locked');
      reachable(ctx,'anchor_c2_entry',true); require(t.regionId==='region_c','invalid-position');
      if(!t.initialized){t.initialized=true;t.wallet.coins=C.entry.firstEntryGrant.coins;t.energy.current=C.entry.firstEntryGrant.energy;
        for(const x of C.shops.flatMap(sh=>sh.offers).filter(x=>x.quantity)) t.commerce.shopStock[x.id]=x.quantity;
        c.presentations.intro='pending';}
      t.regionId='region_d'; c.entryCount=checked(c.entryCount+1);c.safeAnchorId='anchor_c2_entry';
    } else {
      require(t.initialized && t.regionId==='region_d','chapter-not-entered');
      const frame=ctx.frame;
      if(type==='tick'){
        require(p.seconds<=3600,'invalid-action','单次前台dt不得超过一小时，离线时间不能补扣');
        // Visibility is authoritative even if a UI passes operative=true.
        if(frame?.visible===false || frame?.focused===false){
          if(t.fishing.pendingCast){t.fishing.lastCast={...t.fishing.pendingCast,outcome:'cancelled',settledAt:ctx.at,recoveryReason:'focus'};t.fishing.pendingCast=null;}
          if(busyRepair(s)){c.repair.status='available';c.repair.reserved=0;t.energy.reserved=0;}
          const interruptions=c.timing.externalInterruptions;
          if(!interruptions.at(-1) || interruptions.at(-1).end!==null) interruptions.push({start:ctx.at,end:null,note:'失焦或隐藏'});
        } else if(frame?.visible===true && frame?.focused===true){
          const last=c.timing.externalInterruptions.at(-1); if(last?.end===null) last.end=ctx.at;
          if(frame.regionId==='region_d' && frame.operative===true && p.operative && !busyRepair(s) && !t.fishing.pendingCast){
            c.timing.operativeSeconds=(c.timing.operativeSeconds??0)+p.seconds;
            if(!c.timing.firstOperativeAt) c.timing.firstOperativeAt=ctx.firstOperativeAt ?? ctx.at;
            const total=t.energy.passiveSeconds+p.seconds,loss=Math.floor(total/C.balance.passiveEnergySeconds);
            t.energy.passiveSeconds=total%C.balance.passiveEnergySeconds;
            t.energy.current=Math.max(t.energy.reserved,t.energy.current-loss);
          }
        }
      } else if(type==='leaveChapter2'){
        require(p.targetRegionId==='region_c' && p.anchorId==='anchor_c2_entry','invalid-position');reachable(ctx,p.anchorId);
        require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy'); t.regionId='region_c';c.safeAnchorId=p.anchorId;
      } else if(type==='acceptQuest'){
        const q=C.quests.find(x=>x.id===p.questId); reachable(ctx,C.npcs.find(x=>x.id===q.giverId).anchorId);
        if(c.quests[q.id].status==='available'){
          if(q.id==='quest_c2_token') require(t.fishing.tutorialCompleted,'quest-not-ready');
          if(q.id==='quest_c2_repair') require(c.mainStatus==='active','quest-not-ready');
          c.quests[q.id].status='active'; if(q.id===C.region.mainQuestId)c.mainStatus='active';
          if(q.id==='quest_c2_fishing_intro'){addItem(s,'item_c2_basic_rod',1,q.id,ctx.at);addItem(s,'item_c2_basic_bait',1,q.id,ctx.at);}
          event(s,ctx,`accept:${q.id}`);
        }
      } else if(type==='startCast'){
        reachable(ctx,C.fishingPoints.find(x=>x.id===p.pointId).anchorId);
        require(!t.fishing.pendingCast,'cast-pending');require(!busyRepair(s),'activity-busy');
        require(instance(s,'item_c2_basic_rod')?.ownership==='borrowed' && (s.inventory.item_c2_basic_bait??0)>0,'quest-not-ready');
        require(available(s)>=C.balance.castEnergy,'insufficient-energy');
        let mode=p.mode;
        if(t.relief.firstCastGuaranteed) mode='relief';
        else if(!t.fishing.tutorialCompleted) require(mode==='tutorial','quest-not-ready');
        if(mode==='tutorial') require(!t.fishing.tutorialCompleted && c.quests.quest_c2_fishing_intro.status==='active','quest-not-ready');
        if(mode==='relief') require(t.relief.firstCastGuaranteed,'relief-not-eligible');
        if(mode==='token') require(t.fishing.tutorialCompleted && c.quests.quest_c2_token.status==='active' && !t.fishing.tokenObtained && !instance(s,'treasure_c2_marked_token'),'quest-not-ready');
        const seed=ctx.seed();require(uint(seed) && seed<=4294967295,'invalid-action','随机种子无效');
        const selected=pickResult(s,mode,seed);t.fishing.sequence=checked(t.fishing.sequence+1);t.energy.current-=C.balance.castEnergy;
        const cast={id:`cast:${t.transactions.saveEpoch}:${t.fishing.sequence}`,pointId:p.pointId,mode,chargedEnergy:C.balance.castEnergy,startedAt:ctx.at,seed,resultItemId:selected.itemId,rare:selected.rare};
        t.fishing.pendingCast=cast;t.relief.firstCastGuaranteed=false;data={cast:clone(cast)};
      } else if(type==='resolveCast'){
        const cast=t.fishing.pendingCast;require(cast?.id===p.castId,'unknown-cast');
        // Cancelling forfeits the charge; relief's easy landing cannot fail from 'lost'.
        const caught=p.outcome==='caught' || cast.mode==='relief' && p.outcome==='lost';
        if(caught){
          addItem(s,cast.resultItemId,1,cast.id,ctx.at);
          if(['normal','simple'].includes(cast.mode))t.fishing.rareMisses=cast.rare?0:t.fishing.rareMisses+1;
          if(!t.fishing.tutorialCompleted){t.fishing.tutorialCompleted=true;c.quests.quest_c2_fishing_intro.status='completed';addGoal(s,'goal_c2_fishing_intro');}
          if(cast.mode==='token'){t.fishing.tokenObtained=true;c.quests.quest_c2_token.status='completed';}
          event(s,ctx,'firstCatch');data={itemId:cast.resultItemId,quantity:1};
        }
        t.fishing.lastCast={...cast,outcome:caught?'caught':p.outcome,settledAt:ctx.at};t.fishing.pendingCast=null;
      } else if(['beginRepair','advanceRepair','cancelRepair','completeRepair','chooseReward'].includes(type)){
        if(type!=='cancelRepair') reachable(ctx,type==='chooseReward'?'anchor_c2_porter':C.repair.anchorId);
        const r=c.repair;
        if(type==='beginRepair'){
          require(!t.fishing.pendingCast && !busyRepair(s),'activity-busy');require(c.quests.quest_c2_repair.status==='active' && r.status==='available','repair-not-ready');
          require(available(s)>=C.repair.cost,'insufficient-energy');r.reserved=C.repair.cost;t.energy.reserved=C.repair.cost;
          r.status=r.stepIds.length===C.repair.stepIds.length?'ready':'active';
        } else if(type==='advanceRepair'){
          require(r.status==='active','repair-not-ready');require(p.stepId===C.repair.stepIds[r.stepIds.length],'invalid-action','维修步骤须按顺序提交');
          r.stepIds.push(p.stepId);if(r.stepIds.length===C.repair.stepIds.length)r.status='ready';
        } else if(type==='cancelRepair'){
          if(busyRepair(s)){r.status='available';r.reserved=0;t.energy.reserved=0;}
        } else if(type==='completeRepair'){
          require(r.status==='ready' && r.stepIds.length===C.repair.stepIds.length && r.reserved===C.repair.cost && t.energy.current>=C.repair.cost,'repair-not-ready');
          t.energy.current-=C.repair.cost;r.reserved=0;t.energy.reserved=0;r.status='completed';event(s,ctx,'repairCompleted');
        } else {
          require(r.rewardChoice===null,'reward-already-chosen');require(r.status==='completed','repair-not-ready');
          if(p.choice==='cash'){data={coins:C.repair.reward.cash,debtPaid:credit(s,C.repair.reward.cash)};}
          else {addItem(s,C.repair.reward.itemId,1,C.repair.id,ctx.at); t.commerce.shopStock.offer_c2_bell_later=0; data={itemId:C.repair.reward.itemId};}
          r.rewardChoice=p.choice;c.quests.quest_c2_repair.status='completed';addGoal(s,'goal_c2_repair_reward');event(s,ctx,'rewardChosen',p.choice);
        }
      } else if(['sell','buy','eat','barter','buyback'].includes(type)){
        const sh=atShop(ctx,p.shopId);require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy');
        if(type==='sell'){
          let total=0;const seen=new Set();
          for(const line of p.lines){
            require(!seen.has(line.itemId),'invalid-quantity','整笔交易不可包含重复品类');seen.add(line.itemId);
            const def=itemDefinition(line.itemId);require(sh.acceptedCategories.includes(def.category),'wrong-shop');
            require(def.sellPrice!==null && def.ownership==='owned' && !needed(s,def.id,ctx.content),'protected-item');
            require((s.inventory[def.id]??0)>=line.quantity,'not-owned');
            if(def.unique){const i=t.instances[line.instanceId];require(i?.itemId===def.id && i.ownership==='owned','not-owned');require(!i.protected,'protected-item');}
            total=checked(total+checked(def.sellPrice*line.quantity));
          }
          for(const line of p.lines){s.inventory[line.itemId]-=line.quantity;if(line.instanceId){t.instances[line.instanceId].ownership='sold';t.instances[line.instanceId].shopId=p.shopId;}}
          const paid=credit(s,total);data={receipt:receipt(s,ctx,action,'sell',p.lines,total,paid,true)};
        } else if(type==='buy' || type==='eat'){
          const offer=sh.offers.find(x=>x.id===p.offerId);require(offer,'wrong-shop');const def=itemDefinition(offer.itemId);
          if(type==='eat'){
            const food=C.balance.food.find(x=>x.itemId===offer.itemId);require(food,'wrong-shop');require(t.energy.current<t.energy.max,'invalid-action','精力已满');
            debit(s,food.price);t.energy.current=Math.min(t.energy.max,t.energy.current+food.energy);data={energy:t.energy.current};
          } else {
            require(def.unique && p.quantity===1,'invalid-quantity');require(t.commerce.shopStock[offer.id]>0 && !instance(s,def.id),'out-of-stock');
            if(offer.id==='offer_c2_bell_later') require(c.repair.rewardChoice==='cash','stale-offer');
            debit(s,offer.price);t.commerce.shopStock[offer.id]--;addItem(s,def.id,1,offer.id,ctx.at);
            data={receipt:receipt(s,ctx,action,'buy',[{itemId:def.id,quantity:1,instanceId:instance(s,def.id).id}],offer.price)};
          }
        } else if(type==='barter'){
          const b=C.barters.find(x=>x.id===p.barterId),i=t.instances[p.instanceId];require(b.shopId===p.shopId,'wrong-shop');
          require((t.commerce.barterCounts[b.id]??0)<b.limit && !instance(s,b.outputItemId) && t.commerce.shopStock.offer_c2_cup>0,'out-of-stock');
          require(i?.itemId===b.inputItemId && i.ownership==='owned' && s.inventory[i.itemId]===1,'not-owned');
          require(c.storyStages.story_c2_silent_bell==='stage_c2_silent_bell_resolved','story-locked');require(!i.protected && !needed(s,i.itemId,ctx.content),'protected-item');
          i.ownership='bartered';i.shopId=p.shopId;s.inventory[i.itemId]=0;t.commerce.barterCounts[b.id]=(t.commerce.barterCounts[b.id]??0)+1;t.commerce.shopStock.offer_c2_cup--;
          addItem(s,b.outputItemId,1,b.id,ctx.at);data={receipt:receipt(s,ctx,action,'barter',[{itemId:i.itemId,quantity:1,instanceId:i.id},{itemId:b.outputItemId,quantity:1,instanceId:instance(s,b.outputItemId).id}],0)};
        } else {
          const r=t.commerce.receipts.find(x=>x.id===p.receiptId);
          require(r?.kind==='sell' && r.shopId===p.shopId && r.buybackEligible && t.commerce.buyback.includes(r.id),'stale-offer');
          for(const l of r.lines) if(l.instanceId){const i=t.instances[l.instanceId];require(i?.ownership==='sold' && i.shopId===p.shopId,'out-of-stock');}
          debit(s,r.buybackPrice);
          for(const l of r.lines){s.inventory[l.itemId]=checked((s.inventory[l.itemId]??0)+l.quantity);if(l.instanceId){const i=t.instances[l.instanceId];i.ownership='owned';i.protected=true;delete i.shopId;}}
          r.buybackEligible=false;t.commerce.buyback=t.commerce.buyback.filter(x=>x!==r.id);
          data={receipt:receipt(s,ctx,action,'buyback',r.lines,r.buybackPrice)};
        }
        if(type!=='eat'){addGoal(s,'goal_c2_first_trade');event(s,ctx,'firstTrade');}
      } else if(type==='requestRelief'){
        atShop(ctx,p.shopId);require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy');
        const b=C.balance.relief;
        require(t.wallet.coins<b.coinsThreshold && available(s)<b.energyThreshold && t.relief.debt===0,'relief-not-eligible');
        // A guaranteed cast requires a borrowed rod. Relief grants no new ownership/assets.
        require(instance(s,'item_c2_basic_rod')?.ownership==='borrowed','quest-not-ready');
        t.energy.current=Math.min(t.energy.max,t.energy.current+b.energy);t.relief.debt=b.debt;t.relief.firstCastGuaranteed=true;t.relief.recoveryEpoch=checked(t.relief.recoveryEpoch+1);
      } else if(type==='settleReliefWork'){
        reachable(ctx,'anchor_c2_fisher');require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy');
        require(t.relief.debt>0 && available(s)<4,'relief-not-eligible');data={debtPaid:t.relief.debt};t.relief.debt=0;
      } else if(type==='toggleProtection'){
        const i=t.instances[p.instanceId];require(i?.ownership==='owned' && itemDefinition(i.itemId)?.category==='treasure','not-owned');
        require(p.protected || !needed(s,i.itemId,ctx.content),'protected-item');i.protected=p.protected;
      } else if(type==='advanceStory'){
        const def=C.stories.find(x=>x.id===p.storyId),current=c.storyStages[p.storyId];
        require(current,'story-locked');require(def.stageIds.indexOf(p.stageId)===def.stageIds.indexOf(current)+1,'invalid-action');
        const rules=ctx.content?.storyRules?.find(x=>x.storyId===p.storyId)?.stages.find(x=>x.id===p.stageId);
        require(ctx.content?.draft===false && rules?.all?.length && rules.all.every(x=>conditionMatches(s,x)),'story-locked','缺少正式内容条件或条件未成立');
        const npc=def.itemId==='treasure_c2_marked_token'?'anchor_c2_fisher':def.itemId==='treasure_c2_silent_bell'?'anchor_c2_porter':'anchor_c2_merchant';reachable(ctx,npc);
        c.storyStages[p.storyId]=p.stageId;
      } else if(type==='readStory'){
        require(c.storyStages[p.storyId],'story-locked');
        const story=ctx.content?.stories?.find(x=>x.id===p.storyId);const section=story?.sections.find(x=>x.id===p.sectionId);
        require(ctx.content?.draft===false && story && p.contentVersion===story.contentVersion && section && p.paragraphIndex<section.paragraphs.length,'invalid-position','正文/版本/段落不可用');
        t.storyReadingProgress[p.storyId]={contentVersion:p.contentVersion,sectionId:p.sectionId,paragraphIndex:p.paragraphIndex};
        if(section===story.sections.at(-1) && p.paragraphIndex===section.paragraphs.length-1 && !t.readStoryIds.includes(p.storyId)) t.readStoryIds.push(p.storyId);
      } else if(type==='handOffCargo'){
        reachable(ctx,p.anchorId);require(c.mainStatus==='active' && ['goal_c2_fishing_intro','goal_c2_first_trade','goal_c2_repair_reward'].every(x=>c.goalIds.includes(x)),'quest-not-ready');
        require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy');addGoal(s,'goal_c2_handoff');event(s,ctx,'handoff');
      } else if(type==='completeMain'){
        require(!busyRepair(s) && !t.fishing.pendingCast,'activity-busy');
        reachable(ctx,'anchor_c2_delivery');require(c.mainStatus==='active' && C.quests[0].mandatoryGoalIds.every(x=>c.goalIds.includes(x)),'quest-not-ready');
        c.mainStatus='completed';c.quests.quest_c2_main.status='completed';c.presentations.ending='pending';
      } else if(type==='ackPresentation'){
        const key=p.sequenceId==='intro_c2'?'intro':'ending';require(c.presentations[key]!=='unseen','quest-not-ready');c.presentations[key]='seen';if(key==='ending')event(s,ctx,'endingEnded');
      }
    }
    if(t.regionId==='region_d' && ctx.frame?.regionId==='region_d' && ctx.frame?.visible===true && ctx.frame?.focused===true && ctx.frame.actor && [ctx.frame.actor.x,ctx.frame.actor.z,ctx.frame.actor.height].every(Number.isFinite) && ['ground','bridge'].includes(ctx.frame.actor.layer)){
      t.regionPositions ??= {};
      t.regionPositions.region_d={x:ctx.frame.actor.x,z:ctx.frame.actor.z,height:ctx.frame.actor.height,layer:ctx.frame.actor.layer};
    }
    if(type!=='tick' || JSON.stringify(s)!==JSON.stringify(state)){
    const previousWall=c.timing.lastWallAt;
    if(previousWall && Date.parse(ctx.at)<Date.parse(previousWall)){
      (c.timing.clockAnomalies ??= []).push({at:ctx.at,previousAt:previousWall,note:'系统墙钟回退；不重算前台时间'});
    }
    c.timing.lastWallAt=ctx.at;
    }
    const changed=JSON.stringify(s)!==JSON.stringify(state);
    if(changed) s.revision=checked(s.revision+1);
    validateCoreSnapshot(s);
    return {ok:true,changed,state:s,data};
  } catch(e){return {ok:false,changed:false,error:{code:e.code??'invalid-action',message:e.message,retryable:false}};}
}
export function fingerprint(action) {
  const canonical=x=>Array.isArray(x)?x.map(canonical):object(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  return JSON.stringify(canonical({type:action.type,payload:action.payload}));
}
