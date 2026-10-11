import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {moveActor,bridgeHeight,moveBoat,boatAllowed,getDisembark,surfaceAt} from './world.js';
const world=JSON.parse(fs.readFileSync(new URL('../public/assets/world.json',import.meta.url)));
test('walking crosses the bridge, rises with the arch and exits onto the opposite bank',()=>{let p={x:0,z:20,height:.94,layer:'ground',mode:'walk'};p=moveActor(p,0,-20,world);assert.equal(p.layer,'bridge');assert.equal(p.mode,'walk');assert.ok(Math.abs(p.height-8.24)<.02);p=moveActor(p,0,-21,world);assert.equal(p.layer,'ground');assert.equal(p.mode,'walk');assert.ok(p.z<-20);});
test('swimmer crosses beneath bridge without snapping up onto bridge deck',()=>{let p={x:-8,z:0,layer:'ground',mode:'swim',height:-.58};p=moveActor(p,16,0,world);assert.equal(p.mode,'swim');assert.equal(p.layer,'ground');assert.ok(p.height<0);});
test('bridge handrails contain the walker even over long frames',()=>{let p={x:0,z:0,layer:'bridge',mode:'walk',height:8.24};p=moveActor(p,20,0,world);assert.ok(p.x<=3.62);assert.equal(p.layer,'bridge');});
test('bank slope permits entering water and returning to land',()=>{let p={x:78,z:20,layer:'ground',mode:'walk',height:.94};p=moveActor(p,0,-10,world);assert.equal(p.mode,'swim');p=moveActor(p,0,10,world);assert.equal(p.mode,'walk');assert.equal(p.height,.94);});
test('building walls prevent walking through storefronts',()=>{const c=world.colliders.find(c=>c.kind==='house');let p={x:c.x,z:c.z-c.d/2-2,layer:'ground',mode:'walk',height:.94};p=moveActor(p,0,c.d+4,world);assert.ok(p.z<c.z-c.d/2);});
test('skiff launches, moves through the arch, and cannot cross banks or piers',()=>{assert.equal(boatAllowed(32,7,world),true);assert.equal(boatAllowed(0,0,world),true);assert.equal(boatAllowed(0,15,world),false);assert.equal(boatAllowed(32,13,world),false);let b={x:-9,z:0,angle:Math.PI/2,speed:0};for(let i=0;i<240;i++)b=moveBoat(b,1,0,1/60,world);assert.ok(b.x>0);assert.equal(Math.abs(b.z)<.01,true);});
test('disembarking near pier lands on deck, offshore returns swimmer',()=>{assert.equal(getDisembark({x:32,z:7,angle:Math.PI/2},world).mode,'walk');assert.equal(getDisembark({x:-8,z:0,angle:Math.PI/2},world).mode,'swim');});
test('map boundaries and diagonal wall sliding remain stable',()=>{let p={x:83,z:68,layer:'ground',mode:'walk',height:.94};p=moveActor(p,100,100,world);assert.ok(p.x<=84&&p.z<=70);});
import {makeRoute,sampleRoute,ferryPose,streetHeight} from './life-paths.js';
test('resident routes are continuous at their loop and bridge height follows the deck',()=>{
 const route=makeRoute([[-2,23],[-2,-23],[2,-23],[2,23]]);
 const a=sampleRoute(route,0),b=sampleRoute(route,route.length);assert.deepEqual(a,b);
 const before=sampleRoute(route,route.length-.001);assert.ok(Math.hypot(a.x-before.x,a.z-before.z)<.002);
 assert.equal(streetHeight(2,0),8.24);assert.equal(streetHeight(2,25),.94);
});
test('all ferry routes move and stay clear of the banks, fixed cargo and piers for ten minutes',()=>{
 for(let i=0;i<4;i++){
  const a=ferryPose(0,i),b=ferryPose(8,i);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>7);
  let prev=a;
  for(let t=.1;t<600;t+=.1){
   const p=ferryPose(t,i);assert.ok(Math.hypot(p.x-prev.x,p.z-prev.z)<.107,'continuous ferry motion');prev=p;
   for(const lateral of [-1.33,1.33])for(const longitudinal of [-4,4]){
    const x=p.x+Math.cos(p.angle)*lateral+Math.sin(p.angle)*longitudinal,z=p.z-Math.sin(p.angle)*lateral+Math.cos(p.angle)*longitudinal;
    assert.ok(Math.abs(x)<84&&Math.abs(z)<14,'hull stays in river');
    for(const h of [...world.boatObstacles,...world.docks])assert.ok(!(Math.abs(x-h.x)<h.w/2&&Math.abs(z-h.z)<h.d/2),'hull avoids fixed obstacle');
   }
  }
 }
});
test('a ferry becomes a moving collision obstacle for the controllable skiff',()=>{
 const w={...world,boatObstacles:[{x:-10,z:0,w:8,d:2.65}]};assert.equal(boatAllowed(-10,0,w),false);w.boatObstacles[0].x=-30;assert.equal(boatAllowed(-10,0,w),true);
});
