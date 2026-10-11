import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {defaultState,normalizeState,reduceState,questStage} from './state.js';
import {createProgressStore,SAVE_KEY,BACKUP_KEY,CORRUPT_KEY,consumeResetURL} from './persistence.js';
import {createCollectibles} from './collectibles.js';
const config=JSON.parse(readFileSync(new URL('./config.json',import.meta.url)));
const world=JSON.parse(readFileSync(new URL('../../public/assets/world.json',import.meta.url)));
function memory(initial={}) {const data=new Map(Object.entries(initial));return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
const make=storage=>createProgressStore({config,storage,onError:()=>{}});
const grant=(s,i)=>s.dispatch({type:'grantPermission',permissionId:i.permissionId});
const collect=(s,i)=>s.dispatch({type:'collect',instanceId:i.id});
function completedFixture() {const s=make(memory());for(const i of config.instances){grant(s,i);collect(s,i);}const state=s.getState();for(const i of config.items)state.inventory[i.id]=0;state.quests[config.quest.id]={status:'completed'};return state;}

test('default snapshot: independent state domains and locked stories',()=>{
  const s=normalizeState({},config);assert.deepEqual(s,defaultState());assert.equal(questStage(s,config),'available');
});
test('permission required; authorization is not collection, repeated commands are safe',()=>{
  const s=make(memory()),i=config.instances[0];assert.equal(collect(s,i).reason,'permission-required');grant(s,i);
  assert.equal(s.getState().inventory[i.itemId],undefined);assert.deepEqual(s.getState().unlockedCodexIds,[]);
  assert.equal(grant(s,i).changed,false);collect(s,i);assert.equal(collect(s,i).changed,false);
  assert.equal(s.getState().inventory[i.itemId],1);assert.deepEqual(s.getState().unlockedStoryIds,[]);
});
test('all six orders and fresh store reads after each stage',()=>{
  const [a,b,c]=config.instances;
  for(const order of [[a,b,c],[a,c,b],[b,a,c],[b,c,a],[c,a,b],[c,b,a]]){
    const disk=memory();let s=make(disk);
    for(const i of order){grant(s,i);s=make(disk);assert.ok(s.getState().permissions.includes(i.permissionId));assert.ok(!s.getState().worldState.collectedInstanceIds.includes(i.id));collect(s,i);s=make(disk);assert.equal(s.getState().inventory[i.itemId],1);assert.equal(collect(s,i).changed,false);}
    assert.equal(s.getState().unlockedCodexIds.length,6);assert.deepEqual(s.getState().unlockedStoryIds,[]);
    assert.equal(questStage(s.getState(),config),'available');const active=s.getState();active.quests[config.quest.id]={status:'active'};s.restoreFixture(active);assert.equal(questStage(make(disk).getState(),config),'ready');
  }
});
test('transaction ordering: world then complete snapshot save then UI',()=>{
  const disk=memory(),s=make(disk),i=config.instances[0],events=[];grant(s,i);
  const set=disk.setItem;disk.setItem=(key,raw)=>{if(key===SAVE_KEY){const v=JSON.parse(raw);assert.equal(v.inventory[i.itemId],1);assert.ok(v.worldState.collectedInstanceIds.includes(i.id));events.push('save');}set(key,raw);};
  s.subscribeWorld(state=>{assert.equal(state.inventory[i.itemId],1);events.push('world');});s.subscribe(()=>events.push('ui'));collect(s,i);assert.deepEqual(events,['world','save','ui']);
});
test('delivered sample retains codex, all four stories unlock together, no replay quantities',()=>{
  const s=normalizeState(completedFixture(),config);assert.equal(s.unlockedCodexIds.length,6);assert.equal(s.unlockedStoryIds.length,4);
  for(const i of config.instances){assert.equal(s.inventory[i.itemId],0);assert.equal(reduceState(s,{type:'collect',instanceId:i.id},config).changed,false);}
});
test('locked story cannot write reading state; final paragraph alone marks read',()=>{
  const story=config.stories[0],section=story.sections[0];const action={type:'readParagraph',storyId:story.storyId,sectionId:section.id,paragraphIndex:0};
  assert.equal(reduceState(defaultState(),action,config).reason,'story-locked');
  let s=normalizeState(completedFixture(),config);s=reduceState(s,action,config).state;assert.deepEqual(s.readStoryIds,[]);
  const last=story.sections.at(-1);s=reduceState(s,{...action,sectionId:last.id,paragraphIndex:last.paragraphs.length-1},config).state;
  assert.deepEqual(s.readStoryIds,[story.storyId]);assert.equal(s.readContentVersions[story.storyId],2);
});
test('all four stories persist separate positions and read status',()=>{
  const disk=memory();let s=make(disk);s.restoreFixture(completedFixture());
  for(const story of config.stories){s.dispatch({type:'readParagraph',storyId:story.storyId,sectionId:story.sections[1].id,paragraphIndex:2});s=make(disk);assert.equal(s.getState().storyReadingProgress[story.storyId].paragraphIndex,2);}
  assert.deepEqual(s.getState().readStoryIds,[]);assert.equal(Object.keys(s.getState().storyReadingProgress).length,4);
});
test('v1 migration: quantities, collected IDs, completion, old read history retained and offsets reset',()=>{
  const story=config.stories[0],legacy={schemaVersion:1,inventory:[],questStatus:'completed',collectedInstanceIds:[config.instances[0].id],readStoryIds:[story.storyId],storyReadingProgress:{[story.storyId]:{contentVersion:1,sectionId:story.sections[0].id,paragraphIndex:9}}};
  const s=make(memory({[SAVE_KEY]:JSON.stringify(legacy)}));assert.equal(s.getState().schemaVersion,3);assert.equal(s.getState().unlockedStoryIds.length,4);assert.deepEqual(s.getState().readStoryIds,[story.storyId]);assert.equal(s.getState().storyReadingProgress[story.storyId],undefined);assert.equal(s.getStatus().kind,'migrated');
});
test('unfinished legacy pickup cannot leak full story access',()=>{
  const s=normalizeState({schemaVersion:1,inventory:[config.items[0].id],unlockedStoryIds:config.stories.map(s=>s.storyId)},config);
  assert.equal(s.inventory[config.items[0].id],1);assert.deepEqual(s.unlockedStoryIds,[]);
});
test('corrupt primary recovers the last whole snapshot and repairs primary',()=>{
  const disk=memory(),s=make(disk),i=config.instances[0];grant(s,i);collect(s,i);s.retrySave();const expected=s.getState();disk.setItem(SAVE_KEY,'{bad');const recovered=make(disk);
  assert.deepEqual(recovered.getState(),expected);assert.equal(recovered.getStatus().kind,'recovered');assert.ok(disk.getItem(CORRUPT_KEY));assert.deepEqual(make(disk).getState(),expected);
});
test('invalid shape, unsupported version, negative quantities trigger recovery; missing fields use defaults',()=>{
  for(const invalid of ['null','[]','{"schemaVersion":999}','{"inventory":{"a":-1}}','{"permissions":42}']){const s=make(memory({[SAVE_KEY]:invalid,[BACKUP_KEY]:JSON.stringify(defaultState())}));assert.equal(s.getStatus().kind,'recovered');}
  assert.throws(()=>normalizeState({worldState:null},config));
});
test('both snapshots corrupt: preserve evidence and report default memory, never saved',()=>{
  const disk=memory({[SAVE_KEY]:'{bad',[BACKUP_KEY]:'bad'}),s=make(disk);assert.equal(s.getStatus().kind,'unrecoverable');assert.equal(s.getStatus().saved,false);assert.ok(disk.getItem(CORRUPT_KEY));assert.equal(disk.getItem(SAVE_KEY),'{bad');
});
test('quota/security failure keeps memory progress, UI receives unsaved result, retry survives reload',()=>{
  const disk=memory(),s=make(disk),i=config.instances[0];grant(s,i);const set=disk.setItem;disk.setItem=()=>{throw Error('QuotaExceededError');};let notified;s.subscribe(e=>notified=e);
  assert.equal(collect(s,i).saved,false);assert.equal(s.getState().inventory[i.itemId],1);assert.equal(notified.status.saved,false);assert.ok(s.getErrors().length);assert.equal(collect(s,i).changed,false);
  disk.setItem=set;assert.equal(s.retrySave(),true);assert.equal(make(disk).getState().inventory[i.itemId],1);
});
test('silent dropped writes are detected by readback, not treated as saved',()=>{
  const disk=memory(),s=make(disk);disk.setItem=()=>{};assert.equal(grant(s,config.instances[0]).saved,false);assert.equal(s.getStatus().kind,'save-failed');
});
test('storage completely unavailable still allows in-memory play with failure indicator',()=>{
  const disk={getItem(){throw Error('SecurityError');},setItem(){throw Error('SecurityError');}},s=make(disk);grant(s,config.instances[0]);collect(s,config.instances[0]);assert.equal(s.getState().inventory[config.items[0].id],1);assert.equal(s.getStatus().saved,false);
});
test('URL reset is scoped, dev-only and consumed before writes including failure',()=>{
  const disk=memory({[SAVE_KEY]:'a',[BACKUP_KEY]:'b',[CORRUPT_KEY]:'c',unrelated:'keep'}),history={state:null,replaceState(a,b,url){this.url=url;}};
  consumeResetURL({url:'http://localhost/?test&hqReset=1#hello',history,storage:disk,development:true});assert.equal(history.url,'/?test=#hello');assert.deepEqual([...disk.data],[['unrelated','keep']]);
  disk.setItem(SAVE_KEY,'keep');consumeResetURL({url:'http://localhost/?hqReset',history,storage:disk,development:false});assert.equal(disk.getItem(SAVE_KEY),'keep');
  const result=consumeResetURL({url:'http://localhost/?hqReset',history,storage:{removeItem(){throw Error('blocked');}},development:true});assert.equal(history.url,'/');assert.ok(result.error);
});
test('late model success after pickup is discarded; failed resources retain collectible placeholders',async()=>{
  const disk=memory(),store=make(disk),pending=[];
  const loader={loadAsync:()=>new Promise((resolve,reject)=>pending.push({resolve,reject}))};
  const system=createCollectibles({scene:new THREE.Scene(),loader,config,store,world,baseURL:'/'});
  grant(store,config.instances[0]);collect(store,config.instances[0]);pending[0].resolve({scene:new THREE.Group()});
  pending[1].resolve({scene:new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial())});
  const warn=console.warn;console.warn=()=>{};pending[2].reject(Error('404 fixture'));await new Promise(resolve=>setImmediate(resolve));console.warn=warn;
  assert.equal(system.getState().instances[0].visible,false);assert.equal(system.getState().instances[0].loadState,'discarded-collected');assert.equal(system.getState().instances[2].loadState,'placeholder');
  grant(store,config.instances[2]);collect(store,config.instances[2]);assert.equal(system.getState().instances[2].visible,false);
});
test('pickup focus requires permission, matching layer and reachable distance',()=>{
  const store=make(memory()),system=createCollectibles({scene:new THREE.Scene(),loader:{loadAsync:()=>new Promise(()=>{})},config,store,world,baseURL:'/'});
  const actor={x:13,z:19,height:.94,layer:'ground',mode:'walk'};assert.equal(system.focus(actor),null);grant(store,config.instances[0]);assert.equal(system.focus(actor).instance.id,config.instances[0].id);assert.equal(system.focus({...actor,layer:'bridge'}),null);assert.equal(system.focus({...actor,height:5}),null);assert.equal(system.focus({...actor,x:40}),null);
});


test('v1 top-level collected IDs survive defaults and prevent duplicate pickup after reload',()=>{
  const i=config.instances[0],disk=memory({[SAVE_KEY]:JSON.stringify({schemaVersion:1,inventory:[i.itemId],questStatus:'active',collectedInstanceIds:[i.id]})});
  let store=make(disk);assert.deepEqual(store.getState().worldState.collectedInstanceIds,[i.id]);assert.ok(store.getState().permissions.includes(i.permissionId));
  assert.equal(store.getState().inventory[i.itemId],1);assert.equal(collect(store,i).changed,false);
  store=make(disk);assert.deepEqual(store.getState().worldState.collectedInstanceIds,[i.id]);assert.equal(store.getState().inventory[i.itemId],1);
  const nested=normalizeState({schemaVersion:1,worldState:{collectedInstanceIds:[]},collectedInstanceIds:[i.id]},config);assert.deepEqual(nested.worldState.collectedInstanceIds,[]);
});
