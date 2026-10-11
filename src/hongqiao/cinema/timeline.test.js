import test from 'node:test';
import assert from 'node:assert/strict';
import {BOUNDARIES,PLACEMENT,sampleIntro,sampleEnding,finalPose} from './timeline.js';
test('nine fixed shots occupy exactly 30 seconds',()=>{
 assert.deepEqual(BOUNDARIES,[0,3,5,8,10,14,17,20,27,30]);
 for(let i=0;i<9;i++){assert.equal(sampleIntro(BOUNDARIES[i]).shot,i);assert.equal(sampleIntro(BOUNDARIES[i+1]-.001).shot,i);}
 assert.equal(sampleIntro(29.99).done,false);assert.equal(sampleIntro(30).done,true);
});
test('same ship stops, lowers over four seconds and retreats continuously into the ending start',()=>{
 assert.equal(sampleIntro(3).shipX,sampleIntro(20).shipX);assert.equal(sampleIntro(21).mastAngle,0);assert.equal(sampleIntro(25).mastAngle,PLACEMENT.loweredAngle);
 for(let t=0;t<30;t+=.01){assert.ok(Math.abs(sampleIntro(t).shipX-sampleIntro(t+.01).shipX)<.03);}
 assert.equal(sampleIntro(30).shipX,sampleEnding(0).shipX);assert.equal(sampleIntro(30).mastAngle,sampleEnding(0).mastAngle);
 assert.equal(sampleEnding(12).shipX,PLACEMENT.passed[0]);assert.equal(sampleEnding(19.99).done,false);assert.equal(sampleEnding(20).done,true);
});
test('exactly two safety ropes deploy separately and retract after mast settles',()=>{
 assert.equal(sampleIntro(17.2).ropes.filter(r=>r.deployed>0).length,0);assert.equal(sampleIntro(17.6).ropes.filter(r=>r.deployed>0).length,1);assert.equal(sampleIntro(18.6).ropes.filter(r=>r.deployed>0).length,2);
 assert.deepEqual(sampleIntro(20).ropes.map(r=>r.deployed),[1,1]);assert.deepEqual(sampleIntro(27).ropes.map(r=>r.deployed),[0,0]);assert.equal(sampleIntro(20).towSlack,0);assert.equal(sampleIntro(21).towSlack,1);
 for(const t of [9.99,14,20])assert.equal(sampleIntro(t).flashback,false);assert.equal(sampleIntro(10).flashback,true);
});
test('skip terminal pose contains no grant, inventory or settlement data',()=>{
 for(const state of ['waiting','passed']){const p=finalPose({shipState:state});assert.equal(p.mastAngle,PLACEMENT.loweredAngle);assert.equal(p.brace,0);assert.equal(p.cloth,state==='passed');assert.deepEqual(p.ropes.map(r=>r.deployed),[0,0]);assert.equal('inventory' in p,false);}
});
