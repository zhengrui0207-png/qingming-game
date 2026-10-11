import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSharedService,developmentSaveKey,configuration as C,asSharedService} from './service.js';
import {defaultState,normalizeState} from '../../hongqiao/state.js';
import config from '../../hongqiao/config.json' with {type:'json'};
import {SAVE_KEY,BACKUP_KEY,CORRUPT_KEY,createProgressStore} from '../../hongqiao/persistence.js';
import {validateCoreSnapshot} from './state.js';
export function memory(initial={}) {const data=new Map(Object.entries(initial));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
export const anchors=C.anchors.map(a=>({...a,position:[0,.94,0],surfaceEvidence:'UNIT TEST fixture only, NOT measured'}));
export const content={draft:false,stories:C.stories.map(s=>({...s,sections:[{id:s.sectionIdPrefix+'origin',paragraphs:['fixture first','fixture last']}]})),storyRules:C.stories.map(s=>({storyId:s.id,stages:s.stageIds.map(id=>({id,all:[{kind:'itemOwned',itemId:s.itemId,quantity:1}]}))}))};
export function setup({disk=memory(),snapshot,seed=()=>0,contentData=content,anchorData=anchors}={}) {
  if(snapshot) disk.setItem(SAVE_KEY,JSON.stringify(snapshot));
  let frame={regionId:'region_d',visible:true,focused:true,operative:true,actor:{x:0,z:0,height:.94,layer:'ground',mode:'walk'}};
  let clock='2026-10-01T10:00:00.000Z';
  const options={storage:disk,anchors:anchorData,content:contentData,ports:{getFrame:()=>frame},seed,now:()=>clock,onError:()=>{}};
  let service=createSharedService(options);
  const send=(type,payload={},id)=>service.dispatch({type:`c2/${type}`,payload,...(!['tick','readStory'].includes(type)?{transactionId:id??service.createTransactionId()}: {})});
  const must=(type,payload,id)=>{const r=send(type,payload,id);assert.equal(r.ok,true,JSON.stringify(r));return r;};
  return {disk,get service(){return service;},send,must,frame,options,reload(){service=createSharedService(options);return service;},clock(value){clock=value;}};
}
export function legacyCompleted(){const s=defaultState();s.quests.hongqiao_01={status:'completed'};s.endingSeen=true;return s;}
export function entered(opts={}){const h=setup({snapshot:legacyCompleted(),...opts});h.must('enterChapter2',{entryId:C.entry.id});return h;}
const tutorial=h=>{h.must('acceptQuest',{questId:'quest_c2_fishing_intro'});const r=h.must('startCast',{pointId:'point_c2_a',mode:'tutorial'});h.must('resolveCast',{castId:r.data.cast.id,outcome:'caught'});};
const repair=(h,choice)=>{h.must('acceptQuest',{questId:'quest_c2_main'});h.must('acceptQuest',{questId:'quest_c2_repair'});h.must('beginRepair',{repairId:C.repair.id});for(const stepId of C.repair.stepIds)h.must('advanceRepair',{repairId:C.repair.id,stepId});h.must('completeRepair',{repairId:C.repair.id});h.must('chooseReward',{repairId:C.repair.id,choice});};
const inst=(h,id)=>Object.values(h.service.getState().travel.instances).find(x=>x.itemId===id);
const cast=(h,mode='normal',outcome='caught')=>{const r=h.must('startCast',{pointId:'point_c2_a',mode});return h.must('resolveCast',{castId:r.data.cast.id,outcome});};

test('formal entry gates real HQ completion/ending and grants once across migration/revisit/reload',()=>{
  const h=setup();assert.equal(h.send('enterChapter2',{entryId:C.entry.id}).error.code,'chapter-locked');
  const s=legacyCompleted();s.endingPending=true;const pending=setup({snapshot:s});assert.equal(pending.send('enterChapter2',{entryId:C.entry.id}).error.code,'chapter-locked');
  const v2={...legacyCompleted(),schemaVersion:2};delete v2.travel;delete v2.chapter2;
  const x=setup({snapshot:v2});assert.equal(x.service.getState().travel.wallet.coins,0);x.must('enterChapter2',{entryId:C.entry.id});
  assert.equal(x.service.getState().travel.energy.current,80);x.must('eat',{shopId:'shop_c2_food',offerId:'offer_c2_bread'});
  x.must('leaveChapter2',{targetRegionId:'region_c',anchorId:'anchor_c2_entry'});x.reload();x.must('enterChapter2',{entryId:C.entry.id});
  assert.equal(x.service.getState().travel.wallet.coins,4);assert.equal(x.service.getState().travel.energy.current,100);assert.equal(x.service.getState().chapter2.entryCount,2);
});
test('reachability is fail-closed without ports/measured anchors, includes layer/distance/height',()=>{
  const h=setup({snapshot:legacyCompleted(),anchorData:[]});assert.equal(h.send('enterChapter2',{entryId:C.entry.id}).error.code,'not-reachable');
  for(const field of [{x:3},{height:3},{layer:'bridge'}]){const x=setup({snapshot:legacyCompleted()});Object.assign(x.frame.actor,field);assert.equal(x.send('enterChapter2',{entryId:C.entry.id}).error.code,'not-reachable');}
});
test('future region and unsafe return rejected; HQ ticking never consumes second chapter energy',()=>{
  const h=entered();assert.equal(h.send('leaveChapter2',{targetRegionId:'region_e',anchorId:'anchor_c2_entry'}).error.code,'invalid-position');
  assert.equal(h.send('leaveChapter2',{targetRegionId:'region_c',anchorId:'anchor_c2_exit'}).error.code,'invalid-position');
  h.must('leaveChapter2',{targetRegionId:'region_c',anchorId:'anchor_c2_entry'});assert.equal(h.send('tick',{seconds:180,operative:true}).error.code,'chapter-not-entered');assert.equal(h.service.getState().travel.energy.current,80);
});
test('tutorial rod/bait borrowed once, protected tools and old HQ props cannot be sold',()=>{
  const h=entered();h.must('acceptQuest',{questId:'quest_c2_fishing_intro'});h.must('acceptQuest',{questId:'quest_c2_fishing_intro'});h.reload();
  assert.equal(h.service.getState().inventory.item_c2_basic_bait,1);const i=inst(h,'item_c2_basic_rod');assert.equal(i.ownership,'borrowed');
  assert.equal(h.send('toggleProtection',{instanceId:i.id,protected:false}).ok,false);
  for(const itemId of ['item_c2_basic_rod','item_hq_rope','item_hq_pole','item_hq_cloth','treasure_c2_marked_token'])assert.equal(h.send('sell',{shopId:'shop_c2_general',lines:[{itemId,instanceId:i.id,quantity:1}]}).ok,false);
});
test('tutorial, fixed token and normal modes enforce quest gates and separate pity counting',()=>{
  const h=entered();h.must('acceptQuest',{questId:'quest_c2_fishing_intro'});assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'normal'}).ok,false);
  cast(h,'tutorial');assert.equal(h.service.getState().travel.fishing.rareMisses,0);
  assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'tutorial'}).ok,false);
  assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'token'}).ok,false);
  h.must('acceptQuest',{questId:'quest_c2_token'});cast(h,'token');assert.equal(h.service.getState().travel.fishing.rareMisses,0);assert.equal(h.service.getState().inventory.treasure_c2_marked_token,1);
  assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'token'}).ok,false);
});
test('pending cast stores seed/result, refresh forfeits already charged rod without redrawing or refund',()=>{
  let calls=0;const h=entered({seed:()=>{calls++;return 4294967295;}});tutorial(h);
  const start=h.must('startCast',{pointId:'point_c2_b',mode:'normal'});const before=h.service.getState();assert.equal(start.data.cast.resultItemId,'item_c2_rare_copper_piece');
  assert.equal(h.send('startCast',{pointId:'point_c2_b',mode:'normal'}).error.code,'cast-pending');
  h.reload();const after=h.service.getState();assert.equal(after.travel.fishing.lastCast.resultItemId,start.data.cast.resultItemId);assert.equal(after.travel.fishing.lastCast.outcome,'cancelled');assert.equal(after.travel.energy.current,before.travel.energy.current);assert.equal(calls,2);
  assert.equal(h.send('resolveCast',{castId:start.data.cast.id,outcome:'caught'}).error.code,'unknown-cast');
});
test('20th successful normal/simple catch guarantees rare; losses and fixed modes do not consume pity',()=>{
  const h=entered();tutorial(h);h.must('eat',{shopId:'shop_c2_food',offerId:'offer_c2_bread'});
  cast(h,'normal','lost');cast(h,'simple','cancelled');assert.equal(h.service.getState().travel.fishing.rareMisses,0);
  for(let i=0;i<19;i++)cast(h,i%2?'simple':'normal');assert.equal(h.service.getState().travel.fishing.rareMisses,19);
  const r=cast(h);assert.equal(r.data.itemId,'item_c2_rare_copper_piece');assert.equal(h.service.getState().travel.fishing.rareMisses,0);
  assert.equal(h.service.getState().travel.collection.item_c2_fish_a.totalObtained,20);
});
test('normal probability boundaries use frozen weights; unique story items absent from random pool',()=>{
  for(const [seed,category] of [[0,'fish'],[Math.ceil(.75*4294967296),'junk'],[Math.ceil(.98*4294967296),'rare']]){
    const h=entered({seed:()=>seed});tutorial(h);const r=cast(h);assert.equal(C.items.find(x=>x.id===r.data.itemId).category,category);assert.equal(C.items.find(x=>x.id===r.data.itemId).unique,false);
  }
});
test('transaction same ID same payload duplicate; different payload rejected, no repeated rewards after reload',()=>{
  const h=entered();const id=h.service.createTransactionId(),payload={questId:'quest_c2_fishing_intro'};h.must('acceptQuest',payload,id);
  const d=h.must('acceptQuest',payload,id);assert.equal(d.duplicate,true);assert.equal(d.changed,false);
  assert.equal(h.send('acceptQuest',{questId:'quest_c2_main'},id).error.code,'invalid-action');h.reload();assert.equal(h.must('acceptQuest',payload,id).duplicate,true);
});
test('ledger high water rejects expired or skipped old IDs and foreign/forged IDs',()=>{
  const h=entered();const skipped=h.service.createTransactionId();const id=h.service.createTransactionId();h.must('acceptQuest',{questId:'quest_c2_main'},id);
  assert.equal(h.send('acceptQuest',{questId:'quest_c2_fishing_intro'},skipped).error.code,'duplicate-transaction');
  for(let i=0;i<260;i++)h.must('ackPresentation',{sequenceId:'intro_c2'});
  assert.equal(h.service.getState().travel.transactions.recent.length,256);
  assert.equal(h.send('acceptQuest',{questId:'quest_c2_main'},id).error.code,'duplicate-transaction');
  assert.equal(h.send('ackPresentation',{sequenceId:'intro_c2'},'c2:other:1').error.code,'invalid-action');
  const epoch=h.service.getState().travel.transactions.saveEpoch;assert.equal(h.send('ackPresentation',{sequenceId:'intro_c2'},`c2:${epoch}:999999`).error.code,'invalid-action');
});
test('failed C2 settlement remains retryable in page, publishes no half state, blocks all new trades/casts',()=>{
  const h=entered();tutorial(h);const start=h.must('startCast',{pointId:'point_c2_a',mode:'normal'});const id=h.service.createTransactionId();let published=0;h.service.subscribe(()=>published++);
  const set=h.disk.setItem;h.disk.setItem=()=>{throw Error('QuotaExceededError');};const r=h.send('resolveCast',{castId:start.data.cast.id,outcome:'caught'},id);
  assert.equal(r.error.code,'save-failed');assert.equal(published,0);assert.ok(h.service.getState().travel.fishing.pendingCast);assert.equal(h.service.getPendingSnapshot().inventory.item_c2_fish_a,2);
  assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'normal'}).error.code,'save-pending');assert.match(h.service.getStatus().message,/本页/);
  h.disk.setItem=set;assert.equal(h.service.retrySave().ok,true);assert.equal(published,1);assert.equal(h.service.getState().travel.fishing.pendingCast,null);assert.equal(h.must('resolveCast',{castId:start.data.cast.id,outcome:'caught'},id).duplicate,true);h.reload();assert.equal(h.service.getState().inventory.item_c2_fish_a,2);
});
test('silent write and failed rollback remain blocked; verified cancellation discards only candidate',()=>{
  const h=entered();tutorial(h);const coins=h.service.getState().travel.wallet.coins,set=h.disk.setItem;
  h.disk.setItem=()=>{};assert.equal(h.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}).error.code,'save-failed');
  // rollback cannot be called successful when its primary readback is different.
  const get=h.disk.getItem;h.disk.getItem=k=>k===SAVE_KEY?'mismatch':get(k);assert.equal(h.service.cancelPendingSave().ok,false);
  h.disk.getItem=get;h.disk.setItem=set;assert.equal(h.service.cancelPendingSave().ok,true);assert.equal(h.service.getState().travel.wallet.coins,coins);assert.equal(h.service.getState().inventory.item_c2_fish_a,1);
});
test('all quantities safe positive integers; duplicate lines and overflow rejected atomically',()=>{
  const h=entered();tutorial(h);const before=h.service.getState();
  for(const quantity of [-1,0,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]){const r=h.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity}]});assert.equal(r.ok,false);assert.deepEqual(h.service.getState(),before);}
  assert.equal(h.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1},{itemId:'item_c2_fish_a',quantity:1}]}).ok,false);
  const s=structuredClone(before);s.travel.wallet.coins=Number.MAX_SAFE_INTEGER;const x=setup({snapshot:s});assert.equal(x.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}).ok,false);assert.equal(x.service.getState().inventory.item_c2_fish_a,1);
});
test('shop ownership/full order validation prevents remote/wrong shop/partial sales',()=>{
  const h=entered();tutorial(h);const before=h.service.getState();
  assert.equal(h.send('sell',{shopId:'shop_c2_general',lines:[{itemId:'item_c2_fish_a',quantity:1}]}).error.code,'wrong-shop');
  assert.equal(h.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1},{itemId:'item_c2_fish_b',quantity:1}]}).error.code,'not-owned');assert.deepEqual(h.service.getState(),before);
  h.frame.actor.x=10;assert.equal(h.send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}).error.code,'not-reachable');
});
test('buy/sell spread, protection and same-instance buyback retain history with no profit',()=>{
  const h=entered();repair(h,'cash');const start=h.service.getState().travel.wallet.coins;h.must('buy',{shopId:'shop_c2_general',offerId:'offer_c2_cup',quantity:1});const cup=inst(h,'treasure_c2_celadon_cup');
  assert.equal(h.send('sell',{shopId:'shop_c2_general',lines:[{itemId:cup.itemId,instanceId:cup.id,quantity:1}]}).ok,false);
  h.must('advanceStory',{storyId:'story_c2_celadon_cup',stageId:'stage_c2_celadon_cup_resolved'});h.must('toggleProtection',{instanceId:cup.id,protected:false});
  const sale=h.must('sell',{shopId:'shop_c2_general',lines:[{itemId:cup.itemId,instanceId:cup.id,quantity:1}]});assert.equal(sale.data.receipt.coins,7);assert.equal(h.service.getState().travel.collection[cup.itemId].totalObtained,1);
  assert.equal(h.send('buy',{shopId:'shop_c2_general',offerId:'offer_c2_cup',quantity:1}).error.code,'out-of-stock');
  h.must('buyback',{shopId:'shop_c2_general',receiptId:sale.data.receipt.id});assert.equal(inst(h,cup.itemId).id,cup.id);assert.equal(h.service.getState().travel.wallet.coins,start-18);assert.equal(h.service.getState().travel.collection[cup.itemId].totalObtained,1);
  assert.equal(h.send('buyback',{shopId:'shop_c2_general',receiptId:sale.data.receipt.id}).error.code,'stale-offer');
});
test('last 10 sales per shop only, bulk quantity buyback exactly at original total price',()=>{
  const h=entered();tutorial(h);h.must('eat',{shopId:'shop_c2_food',offerId:'offer_c2_bread'});for(let i=0;i<12;i++)cast(h);
  const receipts=[];for(let i=0;i<11;i++) receipts.push(h.must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}).data.receipt);
  assert.equal(h.service.getState().travel.commerce.buyback.length,10);assert.equal(h.send('buyback',{shopId:'shop_c2_fish',receiptId:receipts[0].id}).error.code,'stale-offer');
  const r=h.must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:2}]}).data.receipt;const n=h.service.getState().travel.wallet.coins;
  h.must('buyback',{shopId:'shop_c2_fish',receiptId:r.id});assert.equal(h.service.getState().travel.wallet.coins,n-12);assert.equal(h.service.getState().inventory.item_c2_fish_a,2);
});
test('food consumes money immediately, no sellable inventory, full energy does not charge',()=>{
  const h=entered();h.must('eat',{shopId:'shop_c2_food',offerId:'offer_c2_bread'});const before=h.service.getState();assert.equal(before.inventory.food_c2_steamed_bread,undefined);
  assert.equal(h.send('eat',{shopId:'shop_c2_food',offerId:'offer_c2_tea'}).ok,false);assert.deepEqual(h.service.getState(),before);
});
test('repair reserves 18, pauses decay, saves ordered steps on cancel/reload, completes exactly once',()=>{
  const h=entered();h.must('acceptQuest',{questId:'quest_c2_main'});h.must('acceptQuest',{questId:'quest_c2_repair'});h.must('beginRepair',{repairId:C.repair.id});
  h.must('tick',{seconds:180,operative:true});assert.equal(h.service.getState().travel.energy.current,80);assert.equal(h.service.getState().travel.energy.reserved,18);
  assert.equal(h.send('advanceRepair',{repairId:C.repair.id,stepId:C.repair.stepIds[1]}).ok,false);assert.equal(h.send('completeRepair',{repairId:C.repair.id}).ok,false);
  h.must('advanceRepair',{repairId:C.repair.id,stepId:C.repair.stepIds[0]});h.must('cancelRepair',{repairId:C.repair.id});assert.equal(h.service.getState().travel.energy.current,80);
  h.must('beginRepair',{repairId:C.repair.id});h.reload();assert.equal(h.service.getState().travel.energy.reserved,0);assert.deepEqual(h.service.getState().chapter2.repair.stepIds,[C.repair.stepIds[0]]);
  h.must('beginRepair',{repairId:C.repair.id});for(const stepId of C.repair.stepIds.slice(1))h.must('advanceRepair',{repairId:C.repair.id,stepId});h.must('completeRepair',{repairId:C.repair.id});assert.equal(h.service.getState().travel.energy.current,62);
  assert.equal(h.send('completeRepair',{repairId:C.repair.id}).ok,false);h.must('cancelRepair',{repairId:C.repair.id});assert.equal(h.service.getState().travel.energy.current,62);
});
test('reservation cannot be spent by fishing/trading, failed completion does not leak energy',()=>{
  const h=entered();tutorial(h);h.must('acceptQuest',{questId:'quest_c2_main'});h.must('acceptQuest',{questId:'quest_c2_repair'});h.must('beginRepair',{repairId:C.repair.id});
  assert.equal(h.send('startCast',{pointId:'point_c2_a',mode:'normal'}).error.code,'activity-busy');assert.equal(h.send('eat',{shopId:'shop_c2_food',offerId:'offer_c2_bread'}).error.code,'activity-busy');
  assert.equal(h.service.getState().travel.energy.current,76);
});
test('cash and bell reward branches each complete main, are exclusive and do not require long stories/collections',()=>{
  for(const choice of ['cash','bell']){
    const h=entered();tutorial(h);h.must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]});repair(h,choice);
    assert.equal(h.send('chooseReward',{repairId:C.repair.id,choice:choice==='cash'?'bell':'cash'}).error.code,'reward-already-chosen');
    h.must('handOffCargo',{questId:'quest_c2_main',anchorId:'anchor_c2_delivery'});h.must('completeMain',{questId:'quest_c2_main'});h.must('ackPresentation',{sequenceId:'ending_c2'});h.reload();
    assert.equal(h.service.getState().chapter2.mainStatus,'completed');assert.deepEqual(h.service.getState().travel.readStoryIds,[]);assert.equal(h.service.getState().unlockedStoryIds.length,4);
    assert.equal(h.service.getState().travel.wallet.coins,choice==='cash'?30:14);assert.equal(!!inst(h,'treasure_c2_silent_bell'),choice==='bell');
  }
});
test('cash branch may buy bell once; barter requires resolved story/manual unprotection and transfers existing bell',()=>{
  const cash=entered();repair(cash,'cash');cash.must('buy',{shopId:'shop_c2_general',offerId:'offer_c2_bell_later',quantity:1});assert.equal(cash.send('buy',{shopId:'shop_c2_general',offerId:'offer_c2_bell_later',quantity:1}).ok,false);
  const h=entered();repair(h,'bell');const bell=inst(h,'treasure_c2_silent_bell');const payload={shopId:'shop_c2_general',barterId:'barter_c2_bell_for_cup',instanceId:bell.id};
  assert.equal(h.send('barter',payload).ok,false);assert.equal(h.send('toggleProtection',{instanceId:bell.id,protected:false}).ok,false);
  h.must('advanceStory',{storyId:'story_c2_silent_bell',stageId:'stage_c2_silent_bell_resolved'});h.must('toggleProtection',{instanceId:bell.id,protected:false});const coins=h.service.getState().travel.wallet.coins;h.must('barter',payload);
  assert.equal(inst(h,bell.itemId).ownership,'bartered');assert.equal(h.service.getState().inventory[bell.itemId],0);assert.equal(h.service.getState().inventory.treasure_c2_celadon_cup,1);assert.equal(h.service.getState().travel.wallet.coins,coins);assert.equal(h.send('barter',payload).ok,false);
});
test('story unlock/position/version/tail validation uses actual injected content without altering HQ reads',()=>{
  const h=entered();const story=content.stories[0],section=story.sections[0];const p={storyId:story.id,sectionId:section.id,contentVersion:1,paragraphIndex:0};assert.equal(h.send('readStory',p).error.code,'story-locked');
  tutorial(h);h.must('acceptQuest',{questId:'quest_c2_token'});cast(h,'token');h.must('readStory',p);assert.deepEqual(h.service.getState().travel.readStoryIds,[]);
  for(const patch of [{paragraphIndex:2},{contentVersion:2},{sectionId:'section_c2_marked_token_missing'}])assert.equal(h.send('readStory',{...p,...patch}).error.code,'invalid-position');
  h.must('readStory',{...p,paragraphIndex:1});h.reload();assert.deepEqual(h.service.getState().travel.readStoryIds,[story.id]);assert.equal(h.service.getState().travel.storyReadingProgress[story.id].paragraphIndex,1);assert.deepEqual(h.service.getState().readStoryIds,[]);
  const no=setup({snapshot:h.service.getState(),contentData:null});assert.equal(no.send('advanceStory',{storyId:story.id,stageId:story.stageIds[1]}).ok,false);
});
test('cumulative foreground 90s decay pauses dialogs/reads/trades/presentation/blur/offline, walls independent',()=>{
  const h=entered();h.must('tick',{seconds:89,operative:true});assert.equal(h.service.getState().travel.energy.current,80);
  h.frame.operative=false;h.must('tick',{seconds:900,operative:true});assert.equal(h.service.getState().travel.energy.passiveSeconds,89);
  h.frame.operative=true;h.frame.focused=false;h.must('tick',{seconds:900,operative:true});h.frame.focused=true;h.clock('2026-10-01T10:20:00.000Z');h.must('tick',{seconds:1,operative:true});
  assert.equal(h.service.getState().travel.energy.current,79);assert.equal(h.service.getState().chapter2.timing.operativeSeconds,90);assert.equal(h.service.getState().chapter2.timing.firstOperativeAt,'2026-10-01T10:00:00.000Z');
  const before=h.service.getState().travel.energy.current;h.reload();assert.equal(h.service.getState().travel.energy.current,before);
});
test('focus loss cancels cast/repair once, preserving charges and reservation steps',()=>{
  const h=entered();tutorial(h);const c=h.must('startCast',{pointId:'point_c2_a',mode:'normal'});h.frame.visible=false;h.must('tick',{seconds:0,operative:false});const energy=h.service.getState().travel.energy.current;
  h.must('tick',{seconds:300,operative:true});assert.equal(h.service.getState().travel.energy.current,energy);assert.equal(h.service.getState().travel.fishing.lastCast.id,c.data.cast.id);assert.equal(h.service.getState().chapter2.timing.externalInterruptions.length,1);
});
test('zero coins/energy relief guarantees first fish and income first repays debt',()=>{
  const h=entered();tutorial(h);const s=structuredClone(h.service.getState());s.travel.wallet.coins=0;s.travel.energy.current=0;const x=setup({snapshot:s});
  x.must('requestRelief',{shopId:'shop_c2_food'});assert.equal(x.service.getState().travel.relief.debt,4);assert.equal(x.send('requestRelief',{shopId:'shop_c2_food'}).ok,false);x.reload();
  const r=x.must('startCast',{pointId:'point_c2_a',mode:'normal'});assert.equal(r.data.cast.mode,'relief');x.must('resolveCast',{castId:r.data.cast.id,outcome:'lost'});
  x.must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]});assert.equal(x.service.getState().travel.relief.debt,0);assert.equal(x.service.getState().travel.wallet.coins,2);assert.equal(x.service.getState().travel.fishing.rareMisses,0);
});
test('worst-case cancelled relief cast + repeated failure recovers, work yields debt only and no free net income',()=>{
  const h=entered();tutorial(h);const s=structuredClone(h.service.getState());s.travel.wallet.coins=0;s.travel.energy.current=0;s.inventory.item_c2_fish_a=0;const x=setup({snapshot:s});
  for(let cycle=0;cycle<2;cycle++){
    x.must('requestRelief',{shopId:'shop_c2_food'});cast(x,'normal','cancelled');while(x.service.getState().travel.energy.current>=4)cast(x,'normal','lost');assert.ok(x.service.getState().travel.energy.current<4);
    x.must('settleReliefWork',{npcId:'npc_c2_fisher'});assert.equal(x.service.getState().travel.wallet.coins,0);assert.equal(x.service.getState().travel.relief.debt,0);assert.equal(x.send('settleReliefWork',{npcId:'npc_c2_fisher'}).ok,false);
  }
});
test('snapshot corruption recovers full previous backup and rejects malformed ledgers/reservations/duplicate unique instances',()=>{
  const h=entered();tutorial(h);const good=h.service.getState();const corruptions=[s=>s.travel.wallet.coins=-1,s=>s.travel.instances.extra={...Object.values(s.travel.instances)[0],id:'extra'},s=>s.travel.energy.reserved=19,s=>s.travel.fishing.pendingCast={id:'bogus'},s=>s.travel.transactions.recent=[{id:'x'}],s=>s.inventory.item_c2_basic_rod=2];
  for(const mutate of corruptions){const s=structuredClone(good);mutate(s);assert.throws(()=>normalizeState(s,config));const disk=memory({[SAVE_KEY]:JSON.stringify(s),[BACKUP_KEY]:JSON.stringify(good)});const x=setup({disk});assert.equal(x.service.getStatus().kind,'recovered');assert.deepEqual(x.service.getState(),good);assert.ok(disk.getItem(CORRUPT_KEY));}
});
test('v2 original raw saved to backup, four stories/positions/read/version/HQ quantities/ending retained',()=>{
  const s=legacyCompleted();s.schemaVersion=2;delete s.travel;delete s.chapter2;s.introStatus='seen';s.introSeen=true;
  s.permissions=config.permissions.map(x=>x.id);s.worldState.collectedInstanceIds=config.instances.map(x=>x.id);s.worldState.shipState='passed';
  s.inventory=Object.fromEntries(config.items.map(x=>[x.id,0]));s.unlockedCodexIds=config.quest.rewardCodexIds;s.unlockedStoryIds=config.stories.map(x=>x.storyId);s.readStoryIds=s.unlockedStoryIds;
  for(const story of config.stories){s.storyReadingProgress[story.storyId]={contentVersion:story.contentVersion,sectionId:story.sections[0].id,paragraphIndex:1};s.readContentVersions[story.storyId]=story.contentVersion;}
  const raw=JSON.stringify(s),h=setup({disk:memory({[SAVE_KEY]:raw})});assert.equal(h.disk.getItem(BACKUP_KEY),raw);const m=h.service.getState();
  for(const key of ['inventory','permissions','storyReadingProgress','readStoryIds','readContentVersions','introSeen','endingSeen','endingPending','worldState'])assert.deepEqual(m[key],s[key]);assert.equal(m.unlockedStoryIds.length,4);assert.equal(m.travel.initialized,false);
});
test('retained real P0 browser sample and historical fixture snapshots all migrate without free C2 grants',()=>{
  const sample=JSON.parse(readFileSync(new URL('../../../docs/chapter2/core/samples/automation-fresh-origin.json',import.meta.url)));
  const h=setup({disk:memory(sample.keys)});assert.equal(h.service.getState().schemaVersion,3);assert.equal(h.service.getState().introSeen,true);assert.equal(h.service.getState().travel.energy.current,0);assert.equal(h.service.getState().travel.wallet.coins,0);
});
test('DEV key requires actual DEV+test+chapter2, uses isolated full snapshot and immutable service reads',()=>{
  for(const opts of [{development:false,url:'http://localhost/?test&chapter2'},{development:true,url:'http://localhost/?chapter2'}])assert.throws(()=>developmentSaveKey({...opts,session:'unit'}));
  const key=developmentSaveKey({development:true,url:'http://localhost/?test&chapter2',session:'unit'}),disk=memory({[SAVE_KEY]:'formal untouched'});
  const svc=createSharedService({storage:disk,saveKey:key,onError:()=>{}});assert.throws(()=>{svc.getState().travel.wallet.coins=100;});assert.equal(svc.dispatch({type:'finishIntro'}).ok,true);assert.equal(disk.getItem(SAVE_KEY),'formal untouched');assert.ok(disk.getItem(key));
});

test('frame-rate tick batching saves at most once a second, pause/flush retain all accrued foreground time',()=>{
  const h=entered();let writes=0;const set=h.disk.setItem;h.disk.setItem=(key,value)=>{if(key===SAVE_KEY)writes++;set(key,value);};
  for(let i=0;i<600;i++)h.must('tick',{seconds:1/60,operative:true});h.service.flush();
  assert.ok(writes<=11,`writes=${writes}`);assert.ok(Math.abs(h.service.getState().chapter2.timing.operativeSeconds-10)<1e-8);
  h.must('tick',{seconds:.5,operative:true});h.frame.operative=false;h.must('tick',{seconds:100,operative:false});assert.ok(Math.abs(h.service.getState().chapter2.timing.operativeSeconds-10.5)<1e-8);
});
test('timer checkpoint failure locks transactions and retry applies foreground delta only once',()=>{
  const h=entered();h.must('tick',{seconds:.5,operative:true});const set=h.disk.setItem;h.disk.setItem=()=>{throw Error('quota');};
  assert.equal(h.send('tick',{seconds:.5,operative:true}).error.code,'save-failed');assert.equal(h.service.getState().chapter2.timing.operativeSeconds,undefined);
  h.disk.setItem=set;h.service.retrySave();assert.equal(h.service.getState().chapter2.timing.operativeSeconds,1);h.service.retrySave();assert.equal(h.service.getState().chapter2.timing.operativeSeconds,1);
});
test('backwards wall clock records anomaly without refunding energy or shortening necessary wall time',()=>{
  const h=entered();h.must('tick',{seconds:90,operative:true});h.clock('2026-10-01T09:00:00.000Z');h.must('tick',{seconds:90,operative:true});
  assert.equal(h.service.getState().travel.energy.current,78);assert.equal(h.service.getState().chapter2.timing.operativeSeconds,180);assert.equal(h.service.getState().chapter2.timing.clockAnomalies.length,1);
});
test('all complete snapshots in historical sample packs migrate, quantities/stories/reading are retained',()=>{
  for(const file of ['historical-step4-save-samples.json','historical-step5-save-samples.json']){
    const pack=JSON.parse(readFileSync(new URL(`../../../docs/chapter2/core/samples/${file}`,import.meta.url)));
    for(const [name,s] of Object.entries(pack).filter(([,s])=>s?.schemaVersion)){
      const raw=JSON.stringify(s),h=setup({disk:memory({[SAVE_KEY]:raw})}),m=h.service.getState();
      assert.equal(m.schemaVersion,3,`${file}:${name}`);assert.equal(h.disk.getItem(BACKUP_KEY),raw);assert.equal(m.travel.initialized,false);
      if(s.schemaVersion===2){assert.deepEqual(m.inventory,s.inventory);assert.deepEqual(m.readStoryIds,s.readStoryIds);assert.deepEqual(m.storyReadingProgress,s.storyReadingProgress);assert.deepEqual(m.permissions,s.permissions);}
    }
  }
});
test('non-serializable/unsafe user action returns error rather than throwing or changing progress',()=>{
  const h=entered();const before=h.service.getState();for(const quantity of [1n,Symbol('quantity')])assert.equal(h.send('buy',{shopId:'shop_c2_general',offerId:'offer_c2_cup',quantity}).ok,false);assert.deepEqual(h.service.getState(),before);
});

test('region D position snapshots come from injected actor frame, persist on checkpoint and cannot fabricate future region',()=>{
  const h=entered();h.frame.actor.x=1.5;h.frame.actor.z=.5;h.must('tick',{seconds:1,operative:true});h.reload();assert.deepEqual(h.service.getState().travel.regionPositions.region_d,{x:1.5,z:.5,height:.94,layer:'ground'});
  const s=structuredClone(h.service.getState());s.travel.regionPositions.region_e={x:0,z:0,height:.94,layer:'ground'};assert.throws(()=>normalizeState(s,config));
});

test('HQ adapter and C2 service share one store, legacy mutation uses clone and C2 reads stay frozen',()=>{
  const disk=memory(),store=createProgressStore({config,storage:disk,onError:()=>{}}),shared=asSharedService(store);
  const snapshot=store.getState();snapshot.inventory.example=9;assert.equal(shared.getState().inventory.example,undefined);
  store.dispatch({type:'grantPermission',permissionId:config.permissions[0].id});assert.ok(shared.getState().permissions.includes(config.permissions[0].id));
  assert.throws(()=>{shared.getState().inventory.example=1;});assert.equal(shared.restoreFixture,undefined);assert.equal(shared.retrySave().ok,true);assert.equal(store.retrySave(),true);
});
test('returned receipts and subscription objects cannot mutate authoritative state or another subscriber',()=>{
  const h=entered();tutorial(h);let observerCoins;
  h.service.subscribe(e=>{if(e.result.data?.receipt)e.result.data.receipt.coins=999;});
  h.service.subscribe(e=>{if(e.result.data?.receipt)observerCoins=e.result.data.receipt.coins;});
  const r=h.must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]});r.data.receipt.coins=777;
  assert.equal(observerCoins,6);assert.equal(h.service.getState().travel.commerce.receipts.at(-1).coins,6);h.reload();assert.equal(h.service.getState().travel.commerce.receipts.at(-1).coins,6);
});

test('first operative wall timestamp is first foreground frame, not delayed checkpoint time',()=>{
  const h=entered();h.must('tick',{seconds:.25,operative:true});h.clock('2026-10-01T10:00:01.000Z');h.must('tick',{seconds:.75,operative:true});assert.equal(h.service.getState().chapter2.timing.firstOperativeAt,'2026-10-01T10:00:00.000Z');
});
test('tampered persisted cast result is corrupt even when result item ID is otherwise legal',()=>{
  const h=entered();tutorial(h);h.must('startCast',{pointId:'point_c2_a',mode:'normal'});const s=structuredClone(h.service.getState());s.travel.fishing.pendingCast.resultItemId='treasure_c2_silent_bell';assert.throws(()=>normalizeState(s,config));
});
