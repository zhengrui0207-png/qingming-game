import test from 'node:test';
import assert from 'node:assert/strict';
import {nearestHistoryPerson,selectHistoryResidents} from './people-history.js';
const actor={x:0,z:0,height:.94,layer:'ground',mode:'walk'};
const resident=(id,x=1)=>({id,x,z:0,y:.94,layer:'ground',assetId:'QMSH-20'});
test('moving resident is followed; inactive, distant, other floor and occluded residents cannot trigger',()=>{
 const p=resident('a');assert.equal(nearestHistoryPerson(actor,[p]).id,'a');
 for(const patch of [{x:3},{y:3},{layer:'bridge'},{active:false},{x:NaN}])assert.equal(nearestHistoryPerson(actor,[{...p,...patch}]),null);
 assert.equal(nearestHistoryPerson(actor,[p],null,()=>false),null);
 assert.equal(nearestHistoryPerson({...actor,mode:'swim'},[p]),null);
 p.x=9;assert.equal(nearestHistoryPerson(actor,[p]),null);p.x=2;assert.equal(nearestHistoryPerson(actor,[p]).x,2);
});
test('nearby people have stable focus, then switch when a much closer person arrives',()=>{
 const a=resident('a',1.4),b=resident('b',1.2),current=nearestHistoryPerson(actor,[a]);
 assert.equal(nearestHistoryPerson(actor,[a,b],current).id,'a');b.x=.8;
 assert.equal(nearestHistoryPerson(actor,[a,b],current).id,'b');
});
test('choose one active, actually loaded representative per street occupation without cloning motion state',()=>{
 const a=resident('a',2),b=resident('b',1),hidden={...resident('c',0),active:false};
 const chosen=selectHistoryResidents([a,b,hidden],new Set(['QMSH-20']));
 assert.deepEqual(chosen,[b]);b.x=10;assert.equal(chosen[0].x,10);
 assert.deepEqual(selectHistoryResidents([a],new Set()),[]);
});
