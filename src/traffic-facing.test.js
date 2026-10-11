import test from 'node:test';import assert from 'node:assert/strict';
import {travelHeading,makeRoute,sampleRoute} from './life-paths.js';
test('cart drivers and livestock face actual motion from first southbound step through every corner',()=>{
 const route=makeRoute([[3,50],[3,25],[-3,25],[-3,50]]);let angle=0,moving=0,oldNegative=0;
 for(let d=0;d<route.length*2;d+=.02){const from=sampleRoute(route,d),to=sampleRoute(route,d+.02);const dx=to.x-from.x,dz=to.z-from.z,dist=Math.hypot(dx,dz);if(dist<1e-6)continue;
 const old=angle+Math.atan2(Math.sin(to.angle-angle),Math.cos(to.angle-angle))*.1;if(Math.sin(old)*dx+Math.cos(old)*dz<0)oldNegative++;
 angle=travelHeading(from,to,angle);assert.ok((Math.sin(angle)*dx+Math.cos(angle)*dz)/dist>.999);moving++;}
 assert.ok(oldNegative>0,'must reproduce old initial/turn direction lag');assert.ok(moving>1000);
});
test('stationary traffic retains its last heading',()=>{assert.equal(travelHeading({x:0,z:0},{x:0,z:0},2.1),2.1)});
