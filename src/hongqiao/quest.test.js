import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildQuestConfig} from './quest-config.js';
import {defaultState,normalizeState,reduceState,questStage} from './state.js';
import {createProgressStore,SAVE_KEY} from './persistence.js';
import {selectDialogue,createGuidance,missingItems} from './quest-logic.js';
const read=name=>JSON.parse(readFileSync(new URL(name,import.meta.url)));
const c=buildQuestConfig(read('./config.json'),read('./narrative.json'));
const memory=()=>{const values=new Map();return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};};
const store=disk=>createProgressStore({config:c,storage:disk,onError:()=>{}});
const dispatch=(s,a)=>{const r=s.dispatch(a);assert.equal(r.ok,true);return r;};
const accept=s=>dispatch(s,{type:'acceptQuest',questId:c.quest.id});
const deliver=s=>s.dispatch({type:'completeQuest',questId:c.quest.id});
const acquire=(s,i)=>{dispatch(s,{type:'grantPermission',permissionId:i.permissionId});dispatch(s,{type:'collect',instanceId:i.id});};
const ready=()=>{const s=store(memory());accept(s);for(const i of c.instances)acquire(s,i);return s;};

test('nine exact 30-second shots and full ending/closing/card configuration',()=>{
 const intro=c.narrative.intro;assert.equal(intro.shots.length,9);assert.equal(intro.duration,30);assert.equal(intro.shots[0].start,0);assert.equal(intro.shots.at(-1).end,30);
 intro.shots.forEach((shot,i)=>{if(i)assert.equal(shot.start,intro.shots[i-1].end);for(const key of ['framing','camera','action','audio','cut'])assert.ok(shot[key]);});
 assert.equal(c.narrative.ending.phases.length,4);assert.equal(c.narrative.closing.lines.length,5);assert.ok(c.narrative.completionCard.lines.some(x=>x.includes('七十五钱')));
 assert.equal(c.stories.reduce((n,s)=>n+s.sections.reduce((n,s)=>n+s.paragraphs.length,0),0),166);
 assert.ok(c.narrative.journal.text.includes('何伯耳随车铃'));
});
test('every dialogue branch/choice has a valid node/effect and returns from optional questions',()=>{
 const effects=new Set(['grantPermission','acceptQuest','completeQuest','close','openStory','showClosing','chooseGuide']);
 for(const d of c.dialogues){for(const b of d.branches)assert.ok(d.nodes[b.node]);for(const node of Object.values(d.nodes)){assert.ok(node.lines.length);for(const choice of node.choices){if(choice.goto)assert.ok(choice.goto==='$entry'||d.nodes[choice.goto]);if(choice.effect)assert.ok(effects.has(choice.effect.type));}}}
 assert.ok(c.dialogues.find(d=>d.npcId==='npc_hq_cheng').nodes.followup.lines[0].includes('食店里送羹'));
 assert.equal(c.dialogues.find(d=>d.npcId===c.quest.giverId).nodes.HQ_01.lines.length,4);
});
test('all six collection orders: accepted quest, snapshots between pickups, only one delivery',()=>{
 const [a,b,d]=c.instances;
 for(const order of [[a,b,d],[a,d,b],[b,a,d],[b,d,a],[d,a,b],[d,b,a]]){
  const disk=memory();let s=store(disk);accept(s);
  for(const i of order){acquire(s,i);s=store(disk);assert.equal(s.getState().inventory[i.itemId],1);assert.equal(s.getState().unlockedStoryIds.length,0);}
  assert.equal(questStage(s.getState(),c),'ready');assert.equal(deliver(s).changed,true);assert.equal(deliver(s).changed,false);
  const result=s.getState();assert.ok(result.endingPending);assert.equal(result.unlockedStoryIds.length,4);
  for(const i of c.items)assert.equal(result.inventory[i.id],0);
  s=store(disk);assert.equal(questStage(s.getState(),c),'completed');assert.equal(s.getState().worldState.shipState,'passed');assert.equal(deliver(s).changed,false);
 }
});
test('collect all before acceptance becomes ready immediately; accept never reopens completed',()=>{
 const s=store(memory());for(const i of c.instances)acquire(s,i);assert.equal(questStage(s.getState(),c),'available');assert.equal(deliver(s).reason,'quest-not-ready');accept(s);assert.equal(questStage(s.getState(),c),'ready');deliver(s);assert.equal(accept(s).changed,false);assert.equal(questStage(s.getState(),c),'completed');
});
test('NPC branch priority completed > collected > permitted > accepted > first',()=>{
 for(const i of c.instances){const s=store(memory()),npc=c.permissions.find(p=>p.id===i.permissionId).grantedBy;
  const branch=()=>selectDialogue(c,s.getState(),npc).nodeId;
  assert.equal(branch(),'first');accept(s);assert.equal(branch(),'accepted');dispatch(s,{type:'grantPermission',permissionId:i.permissionId});assert.equal(branch(),'permitted');dispatch(s,{type:'collect',instanceId:i.id});assert.equal(branch(),'collected');
  for(const other of c.instances)acquire(s,other);deliver(s);assert.equal(branch(),'completed');
 }
 const s=store(memory());assert.equal(selectDialogue(c,s.getState(),c.quest.giverId).nodeId,'HQ_01');accept(s);assert.equal(selectDialogue(c,s.getState(),c.quest.giverId).nodeId,'HQ_40');for(const i of c.instances)acquire(s,i);assert.equal(selectDialogue(c,s.getState(),c.quest.giverId).nodeId,'HQ_41');deliver(s);assert.equal(selectDialogue(c,s.getState(),c.quest.giverId).nodeId,'HQ_44');
});
test('incomplete/unknown quest delivery changes nothing',()=>{
 const s=store(memory());accept(s);acquire(s,c.instances[0]);const before=s.getState();assert.equal(deliver(s).ok,false);assert.equal(s.dispatch({type:'completeQuest',questId:'unknown'}).ok,false);assert.deepEqual(s.getState(),before);assert.equal(missingItems(c,before).length,2);
});
test('one atomic delivery snapshot is persisted before event; replay only refreshes UI',()=>{
 const disk=memory(),s=store(disk);accept(s);for(const i of c.instances)acquire(s,i);
 let settlements=0,refresh=0;
 s.subscribe(e=>{if(e.action.type==='completeQuest'){settlements++;const raw=JSON.parse(disk.getItem(SAVE_KEY));assert.equal(raw.quests.hongqiao_01.status,'completed');assert.equal(raw.unlockedStoryIds.length,4);assert.ok(raw.endingPending);assert.ok(c.quest.rewardCodexIds.every(id=>raw.unlockedCodexIds.includes(id)));assert.ok(c.items.every(i=>raw.inventory[i.id]===0));}if(e.action.type==='refreshSnapshot')refresh++;});
 deliver(s);deliver(s);s.refreshUI();s.refreshUI();assert.equal(settlements,1);assert.equal(refresh,2);
});
test('delivery preserves surplus items, unrelated progress and collected codex; consumes each target once',()=>{
 const s=ready(),sample=s.getState();sample.inventory.other=7;sample.inventory.item_hq_rope=3;sample.quests.other={status:'active'};sample.unlockedCodexIds.push('other_codex');s.restoreFixture(sample);deliver(s);
 assert.equal(s.getState().inventory.item_hq_rope,2);assert.equal(s.getState().inventory.other,7);assert.equal(s.getState().quests.other.status,'active');assert.ok(sample.unlockedCodexIds.every(id=>s.getState().unlockedCodexIds.includes(id)));
});
test('save failure preserves completed transaction in memory, retry reload does not settle twice',()=>{
 const disk=memory(),s=store(disk);accept(s);for(const i of c.instances)acquire(s,i);const set=disk.setItem;disk.setItem=()=>{throw Error('quota');};assert.equal(deliver(s).saved,false);assert.equal(questStage(s.getState(),c),'completed');assert.equal(deliver(s).changed,false);disk.setItem=set;s.retrySave();const reloaded=store(disk);assert.equal(reloaded.getState().unlockedStoryIds.length,4);assert.ok(c.items.every(i=>reloaded.getState().inventory[i.id]===0));
});
test('ending finish, skip, duplicate callback and acknowledgement never grant/revoke rewards',()=>{
 const s=ready();deliver(s);const reward=()=>JSON.stringify([s.getState().inventory,s.getState().unlockedStoryIds,s.getState().unlockedCodexIds]);const before=reward();dispatch(s,{type:'finishEnding'});assert.ok(s.getState().endingPending);dispatch(s,{type:'acknowledgeEnding'});assert.equal(s.getState().endingPending,false);assert.equal(s.getState().endingSeen,true);assert.equal(dispatch(s,{type:'acknowledgeEnding'}).changed,false);assert.equal(reward(),before);
});
test('legacy completed saves restore all stories, preserve read history/other rewards, reset only old offsets',()=>{
 const old={schemaVersion:1,questStatus:'completed',inventory:{other:4},unlockedCodexIds:['other'],readStoryIds:['story_hq_zhou'],readContentVersions:{story_hq_zhou:1},storyReadingProgress:{story_hq_zhou:{contentVersion:1,sectionId:'old',paragraphIndex:12},story_hq_he:{contentVersion:2,sectionId:c.stories[1].sections[1].id,paragraphIndex:1}}};
 const migrated=normalizeState(old,c);assert.equal(migrated.unlockedStoryIds.length,4);assert.equal(migrated.inventory.other,4);assert.deepEqual(migrated.readStoryIds,['story_hq_zhou']);assert.equal(migrated.readContentVersions.story_hq_zhou,1);assert.equal(migrated.storyReadingProgress.story_hq_zhou,undefined);assert.equal(migrated.storyReadingProgress.story_hq_he.paragraphIndex,1);assert.ok(migrated.unlockedCodexIds.includes('other'));
});
test('unfinished legacy saves never unlock long stories',()=>{
 const state=normalizeState({schemaVersion:1,questStatus:'active',unlockedStoryIds:c.quest.rewardStoryIds,collectedInstanceIds:c.instances.map(i=>i.id)},c);assert.deepEqual(state.unlockedStoryIds,[]);
});
test('intro start/finish and mid-intro reload award nothing; existing progress bypasses intro',()=>{
 const s=store(memory());dispatch(s,{type:'beginIntro'});assert.equal(s.getState().introStatus,'playing');const restored=normalizeState(s.getState(),c);assert.equal(restored.introStatus,'seen');assert.equal(restored.worldState.shipState,'waiting');assert.deepEqual(restored.inventory,{});assert.deepEqual(restored.unlockedStoryIds,[]);
 dispatch(s,{type:'finishIntro'});assert.equal(dispatch(s,{type:'finishIntro'}).changed,false);assert.equal(questStage(s.getState(),c),'available');
 const playing=ready();deliver(playing);dispatch(playing,{type:'finishIntro'});assert.equal(playing.getState().worldState.shipState,'passing');assert.equal(normalizeState(playing.getState(),c).worldState.shipState,'passed');
});
test('cultural exploration is optional and independent of the three required targets',()=>{
 const s=store(memory());dispatch(s,{type:'unlockCodex',codexId:'K02'});assert.deepEqual(s.getState().unlockedCodexIds,['K02']);assert.equal(missingItems(c,s.getState()).length,3);assert.equal(questStage(s.getState(),c),'available');assert.equal(dispatch(s,{type:'unlockCodex',codexId:'K02'}).changed,false);
});
test('90 seconds counts only operative accepted time; progress resets, completion clears, selection explicit',()=>{
 const s=ready(),g=createGuidance(c);g.update(89,true,s.getState());g.update(500,false,s.getState());assert.equal(g.getState().hintVisible,false);assert.equal(g.getState().targetId,null);g.update(1,true,s.getState());assert.equal(g.getState().hintVisible,true);g.choose(c.quest.giverId);assert.equal(g.getState().targetId,c.quest.giverId);g.progress();assert.equal(g.getState().idleSeconds,0);deliver(s);g.update(90,true,s.getState());assert.equal(g.getState().hintVisible,false);assert.equal(g.getState().targetId,null);
});
