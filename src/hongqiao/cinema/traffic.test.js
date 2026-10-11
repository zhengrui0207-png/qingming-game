import test from 'node:test';import assert from 'node:assert/strict';import {avoidCargo} from './traffic.js';import {ferryPose} from '../../life-paths.js';
test('every ferry pose avoids the full moving cargo bounds, while its route clock and longitudinal position stay intact',()=>{
 for(let shipX=-16;shipX<=14;shipX+=.5)for(let t=0;t<160;t+=.5)for(let i=0;i<4;i++){
  const hull={x:shipX,z:0,w:20.5,d:12.902},base=ferryPose(t,i),p=avoidCargo(base,hull),s=Math.abs(Math.sin(p.angle)),c=Math.abs(Math.cos(p.angle));
  const intersects=Math.abs(p.x-hull.x)<hull.w/2+s*4+c*1.325&&Math.abs(p.z-hull.z)<hull.d/2+c*4+s*1.325;
  assert.equal(intersects,false);assert.equal(p.x,base.x);assert.equal(p.angle,base.angle);assert.equal(p.speed,base.speed);assert.ok(Math.abs(p.z)+c*4+s*1.325<16);
 }
});
test('outside the new cargo region, ferry poses are unchanged; review restoration is deterministic',()=>{const p=ferryPose(0,0);assert.equal(avoidCargo(p),p);assert.equal(avoidCargo(p,{x:11,z:0,w:20.5,d:12.9}),p);const base=ferryPose(40,1),h={x:-16,z:0,w:20.5,d:12.9},before=avoidCargo(base,h);avoidCargo(base,{...h,x:11});assert.deepEqual(avoidCargo(base,h),before);});
