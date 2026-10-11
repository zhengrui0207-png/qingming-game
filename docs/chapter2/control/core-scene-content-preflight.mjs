import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSharedService} from '../../../src/chapter2/core/service.js';
import {defaultState} from '../../../src/hongqiao/state.js';
const content=JSON.parse(fs.readFileSync('src/chapter2/content/content.json'));
const anchors=JSON.parse(fs.readFileSync('src/chapter2/scene/anchors.json'));
const disk=new Map();const key='qingming:dev:chapter2:control-preflight';
const legacy=defaultState();legacy.quests.hongqiao_01={status:'completed'};legacy.endingSeen=true;disk.set(key,JSON.stringify(legacy));
const frame={regionId:'region_d',visible:true,focused:true,operative:true,actor:{x:-22,z:-20,height:.94,layer:'ground',mode:'walk'}};
let seed=0;const errors=[];const opts={storage:{getItem:k=>disk.get(k)??null,setItem:(k,v)=>disk.set(k,v)},saveKey:key,anchors,content,ports:{getFrame:()=>frame},seed:()=>seed,onError:e=>errors.push(String(e))};
let service=createSharedService(opts);const actions=[];
function at(id){const p=anchors.anchors.find(a=>a.id===id).standingPosition;Object.assign(frame.actor,{x:p[0],height:p[1],z:p[2]});}
function send(type,payload){const a={type:'c2/'+type,payload,transactionId:service.createTransactionId()};const r=service.dispatch(a);assert.equal(r.ok,true,JSON.stringify(r));actions.push({type,ok:r.ok,data:r.data});return r;}
send('enterChapter2',{entryId:'entry_c2_from_hongqiao'});at('anchor_c2_fisher');send('acceptQuest',{questId:'quest_c2_fishing_intro'});
at('anchor_c2_fishing_a');let r=send('startCast',{pointId:'point_c2_a',mode:'tutorial'});send('resolveCast',{castId:r.data.cast.id,outcome:'caught'});assert.equal(service.getState().inventory.item_c2_fish_a,1);
at('anchor_c2_fisher');send('acceptQuest',{questId:'quest_c2_token'});at('anchor_c2_fishing_b');r=send('startCast',{pointId:'point_c2_b',mode:'token'});send('resolveCast',{castId:r.data.cast.id,outcome:'caught'});assert.equal(service.getState().inventory.treasure_c2_marked_token,1);assert.equal(service.getState().chapter2.storyStages.story_c2_marked_token,'stage_c2_marked_token_known');
for(const [value,expected] of [[Math.ceil(.8*4294967296),'junk'],[4294967295,'rare']]){seed=value;r=send('startCast',{pointId:'point_c2_b',mode:'simple'});r=send('resolveCast',{castId:r.data.cast.id,outcome:'caught'});assert.equal(content.items.find(i=>i.id===r.data.itemId).category,expected);}
seed=0;r=send('startCast',{pointId:'point_c2_b',mode:'normal'});const energy=service.getState().travel.energy.current,sequence=service.getState().travel.fishing.sequence;service=createSharedService(opts);assert.equal(service.getState().travel.energy.current,energy);assert.equal(service.getState().travel.fishing.sequence,sequence);assert.equal(service.getState().travel.fishing.lastCast.outcome,'cancelled');assert.equal(service.getState().travel.fishing.pendingCast,null);
console.log(JSON.stringify({ok:true,scope:'真实03服务 + 正式01内容 + 实测02锚点的内存持久化预检；非浏览器、非钓鱼UI验收',actions,refreshPreservedChargeAndNoRedraw:true,errors},null,2));
