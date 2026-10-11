import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sweepPeople,stopAtPeople,initializeCrowd,advanceCrowd,crowdConfig} from './crowd-motion.js';import {makeRoute} from './life-paths.js';
const world=JSON.parse(fs.readFileSync(new URL('../public/assets/world.json',import.meta.url)));
const body=(x,z=30,y=.94)=>({x,z,y,height:y,mode:'walk',layer:'ground',radius:.46});
test('swept bodies prevent full crossings and allow escape from shallow overlap',()=>{for(const dx of [.05,2,100]){const a=body(0),b=body(1.2),r=stopAtPeople(a,body(dx),[b]);assert.ok(r.x<=.32+.001);}assert.equal(sweepPeople(body(0),body(-1),[body(.5)]),1);assert.equal(sweepPeople(body(0),body(1),[body(.5)]),0);});
test('bridge and water occupants do not block one another',()=>{assert.equal(sweepPeople({...body(0,0,8.24),layer:'bridge'},body(10,0,8.24),[body(1,0,.4)]),1);});
test('head-on walkers stop without crossing during normal and stalled frames',()=>{for(const dt of [.016,.04,.8,10]){const a={...body(-1),id:'a',route:makeRoute([[-2,30],[2,30],[2,33],[-2,33]]),distance:1,offset:0,speed:1.8,active:true,nextPause:999,pauseUntil:0,waiting:0},b={...body(1),id:'b',route:makeRoute([[2,30],[-2,30],[-2,33],[2,33]]),distance:1,offset:0,speed:.7,active:true,nextPause:999,pauseUntil:0,waiting:0};for(let i=0;i<80;i++){advanceCrowd([a,b],world,dt,i*dt);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=crowdConfig.radius*2+.11);} }});
test('spawn is repeatable, spaced, and has hurried and leisurely residents',()=>{let seed=20;const rand=()=>((seed=seed*16807%2147483647)/2147483647);const route=makeRoute([[-1.6,60],[-1.6,22],[1.6,22],[1.6,60]]),people=Array.from({length:22},()=>({route,active:true}));initializeCrowd(people,world,rand);const active=people.filter(p=>p.active!==false);assert.ok(active.some(p=>p.speed>1.3));assert.ok(active.some(p=>p.speed<.65));for(const a of active)for(const b of active)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>=1.3);});
test('a resident can pass a stopped person and rejoin without snapping or overlap',()=>{
 const p={...body(0,28),route:makeRoute([[0,25],[0,55],[2,55],[2,25]]),distance:3,offset:0,phase:0,speed:1.3,active:true,nextPause:999,pauseUntil:0,waiting:0};
 const obstacle=body(0,31);let detoured=false;
 for(let i=0;i<900;i++){const before={x:p.x,z:p.z};advanceCrowd([p],world,1/30,i/30,[obstacle]);detoured||=!!p.detour;assert.ok(Math.hypot(p.x-obstacle.x,p.z-obstacle.z)>=1.039);assert.ok(Math.hypot(p.x-before.x,p.z-before.z)<=p.speed/30+.001);}
 assert.ok(detoured);assert.ok(p.distance>25);assert.ok(p.walking);
});
test('detours wait at a sealed bridge passage instead of escaping over the rail',()=>{
 const p={...body(0,6,7.428888889),layer:'bridge',route:makeRoute([[0,8],[0,-8],[2,-8],[2,8]]),distance:2,offset:0,phase:0,speed:1,active:true,nextPause:999,pauseUntil:0,waiting:0};delete p.height;
 const wall=Array.from({length:7},(_,i)=>({...body(i-3,2,8.149876543),layer:'bridge'}));
 for(let i=0;i<600;i++){advanceCrowd([p],world,1/30,i/30,wall);assert.ok(p.z>2);assert.ok(Math.abs(p.x)<=3.62);assert.equal(p.layer,'bridge');}
});
test('route corners cannot produce an instantaneous lateral jump',()=>{
 const p={...body(.6,34.95),route:makeRoute([[0,30],[0,35],[2,35],[2,30]]),distance:4.95,offset:.6,phase:0,speed:1.5,active:true,nextPause:999,pauseUntil:0,waiting:0};
 for(let i=0;i<180;i++){const before={x:p.x,z:p.z};advanceCrowd([p],world,1/30,i/30);assert.ok(Math.hypot(p.x-before.x,p.z-before.z)<=p.speed/30+.001);}
});
test('returning from a detour faces accepted motion instead of the route tangent',()=>{
 const p={...body(0,34),route:makeRoute([[0,25],[0,55],[2,55],[2,25]]),distance:3,offset:0,phase:0,speed:1.3,active:true,nextPause:999,pauseUntil:0,waiting:0,angle:0};
 let reversed=false;
 for(let i=0;i<240;i++){const before={x:p.x,z:p.z};advanceCrowd([p],world,1/30,i/30);const dx=p.x-before.x,dz=p.z-before.z,d=Math.hypot(dx,dz);if(d>.001){reversed||=dz<0;assert.ok((Math.sin(p.angle)*dx+Math.cos(p.angle)*dz)/d>.999);}}
 assert.ok(reversed,'fixture must exercise motion against the route tangent');
});
