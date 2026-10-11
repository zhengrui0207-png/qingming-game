import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildQuestConfig} from './quest-config.js';
import {createProgressStore} from './persistence.js';
import {createPresentation} from './presentation.js';
const config=buildQuestConfig(JSON.parse(fs.readFileSync(new URL('./config.json',import.meta.url))),JSON.parse(fs.readFileSync(new URL('./narrative.json',import.meta.url))));
function setup(t){
 t.mock.method(globalThis,'addEventListener',()=>{});t.mock.method(globalThis.document,'addEventListener',()=>{});
 const data=new Map(),store=createProgressStore({config,storage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)},onError:()=>{}});
 let locks=0,closing=0,placeholder=0;const p=createPresentation({config,store,acquire:()=>{locks++;return()=>locks--;},onClosing:()=>closing++,onEndingPlaceholder:()=>placeholder++});
 const ready=()=>{store.dispatch({type:'acceptQuest',questId:config.quest.id});for(const i of config.instances){store.dispatch({type:'grantPermission',permissionId:i.permissionId});store.dispatch({type:'collect',instanceId:i.id});}};
 return {p,store,ready,stats:()=>({locks,closing,placeholder})};
}
globalThis.addEventListener??=()=>{};globalThis.document??={addEventListener:()=>{},hasFocus:()=>true,hidden:false};
test('ending entry requires fresh settlement; UI replay and duplicate callbacks cannot replay it',t=>{
 const {p,store,ready,stats}=setup(t);let calls=0,finish;p.attach({playEnding:e=>{calls++;finish=e.finish;}});assert.equal(p.playEnding(),false);ready();store.dispatch({type:'completeQuest',questId:config.quest.id});assert.equal(p.playEnding(),true);assert.equal(p.playEnding(),false);store.refreshUI();finish();finish();assert.equal(p.playEnding(),false);assert.equal(calls,1);assert.deepEqual(stats(),{locks:0,closing:1,placeholder:0});assert.equal(store.getState().worldState.shipState,'passed');assert.equal(store.getState().unlockedStoryIds.length,4);
});
test('loaded completed save applies passed state without replaying ending; no adapter gives one honest placeholder',t=>{
 const {p,store,ready,stats}=setup(t);ready();store.dispatch({type:'completeQuest',questId:config.quest.id});p.playEnding();p.playEnding();assert.equal(stats().placeholder,1);
 const other=setup(t);other.store.restoreFixture(store.getState());let state;other.p.attach({applyState:s=>{state=s},playEnding:()=>assert.fail('replayed ending')});other.p.start();other.p.playEnding();assert.equal(state.shipState,'passed');assert.equal(other.stats().locks,0);
});
test('all nine intro skip points release locks and stale completion cannot affect a later timeline',t=>{
 for(let i=0;i<9;i++){
  const {p,store,stats}=setup(t);let finish;p.attach({playIntro:e=>{assert.equal(e.config.shots.length,9);finish=e.finish;},cancel:()=>{}});p.start();assert.equal(stats().locks,1);p.skip();finish();assert.equal(stats().locks,0);assert.equal(store.getState().introSeen,true);assert.deepEqual(store.getState().inventory,{});assert.deepEqual(store.getState().quests,{});p.start();assert.equal(stats().locks,0);
 }
});
test('reviews restore the prior scene and never write inventory, rewards or intro status',t=>{
 const {p,store,ready,stats}=setup(t);ready();store.dispatch({type:'completeQuest',questId:config.quest.id});store.dispatch({type:'finishEnding'});store.dispatch({type:'acknowledgeEnding'});
 let finish,lastScene,events=0;store.subscribe(()=>events++);p.attach({playIntro:e=>{finish=e.finish;},playEnding:e=>{finish=e.finish;},applyState:s=>{lastScene=s;},cancel:()=>{}});
 const before=store.getState();assert.equal(p.replayIntro(),true);finish();assert.deepEqual(store.getState(),before);assert.equal(lastScene.shipState,'passed');
 assert.equal(p.replayEnding(),true);p.skip();finish();assert.deepEqual(store.getState(),before);assert.equal(lastScene.shipState,'passed');assert.equal(events,0);assert.equal(stats().closing,0);
});
