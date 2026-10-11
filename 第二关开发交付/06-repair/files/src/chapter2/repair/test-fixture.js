// Actual service + formal content + measured anchors. Only HQ completion is a labelled fixture.
import assert from 'node:assert/strict';
import {createSharedService} from '../core/service.js';
import {defaultState} from '../../hongqiao/state.js';
import {manifest,createWorldOverlay} from '../scene/physics.js';
import content from '../content/content.json' with {type:'json'};
import {readFileSync} from 'node:fs';
import {createInputLocks,createKeyGate,createInteractionRegistry} from '../../interaction/core.js';
import {createController} from './controller.js';
export function fixture(){
 const map=new Map(),key='qingming:dev:chapter2:repair-unit';let fail=false,frame={regionId:'region_d',visible:true,focused:true,operative:true,actor:{x:0,z:0,height:.94,layer:'ground',mode:'walk'}};
 const disk={getItem:k=>map.get(k)??null,setItem(k,v){if(fail)throw Error('fixture persistence failure');map.set(k,v);}};
 const options={storage:disk,saveKey:key,development:true,anchors:manifest,content,ports:{getFrame:()=>frame},seed:()=>0,onError:()=>{}};
 let service=createSharedService(options),controller=null;const inputs=new Map(),locks=createInputLocks(),gate=createKeyGate(),world=createWorldOverlay(JSON.parse(readFileSync(new URL('../../../public/assets/world.json',import.meta.url))));let camera=null,releases=0;const messages=[];
 const registry=createInteractionRegistry();
 const ctx={service,world,locks,gate,registry,camera:{borrow(owner){if(camera)return null;camera=owner;let live=true;return {setPose(){},release(){if(live){live=false;camera=null;releases++;}}};}},ports:{getFrame:()=>frame,input:{subscribe(owner,fn){inputs.set(owner,fn);return ()=>inputs.delete(owner);}},navigate:id=>messages.push(id),openBook:(...args)=>messages.push(args)},toast:m=>messages.push(m)};
 const at=(id,standing=true)=>{const a=manifest.anchors.find(x=>x.id===id),p=standing?(a.standingPosition??a.position):a.position;Object.assign(frame.actor,{x:p[0],height:p[1],z:p[2]});};
 const send=(type,payload)=>service.dispatch({type:'c2/'+type,transactionId:service.createTransactionId(),payload});
 const must=(type,payload)=>{const r=send(type,payload);assert.equal(r.ok,true,JSON.stringify(r));return r;};
 const f=defaultState();f.quests.hongqiao_01={status:'completed'};f.endingSeen=true;service.restoreFixture(f);at('anchor_c2_entry',false);must('enterChapter2',{entryId:'entry_c2_from_hongqiao'});at('anchor_c2_porter');must('acceptQuest',{questId:'quest_c2_main'});at('anchor_c2_fisher');must('acceptQuest',{questId:'quest_c2_fishing_intro'});at('anchor_c2_fishing_a',false);const cast=must('startCast',{pointId:'point_c2_a',mode:'tutorial'});must('resolveCast',{castId:cast.data.cast.id,outcome:'caught'});at('anchor_c2_fisher');must('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]});at('anchor_c2_repair');must('acceptQuest',{questId:'quest_c2_repair'});
 function mount(){ctx.service=service;controller=createController(ctx,{anchors:manifest.anchors});return controller;}mount();
 return {ctx,frame,at,must,send,key,map,messages,inputs,get camera(){return camera;},get releases(){return releases;},get service(){return service;},get controller(){return controller;},failSave(v){fail=v;},reload(){controller.dispose();service=createSharedService(options);return mount();},snapshot(s){controller.dispose();service.restoreFixture(s);return mount();}};
}
export function step(h){const c=h.controller,n=h.service.getState().chapter2.repair.stepIds.length;
 if(n===0){c.operate('inspect',1);c.operate('inspect',2);}
 if(n===1){for(const [i,x,y]of [[0,190,268],[1,410,268]]){c.operate('select',i);c.operate('move',x,y);c.operate('drop');}}
 if(n===2){for(const [i,x,y]of [[2,245,134],[3,355,134]]){c.operate('select',i);c.operate('move',x,y);c.operate('confirm');}}
 if(n===3){for(const i of [0,1,2]){c.selectTest(i);c.setPressed(true);for(let j=0;j<22;j++)c.update(.1,h.frame);c.setPressed(false);}}
}
export function finish(h){h.controller.open();h.controller.start();while(h.service.getState().chapter2.repair.stepIds.length<4)step(h);assert.equal(h.controller.getState().phase,'ready');h.controller.finish();}
