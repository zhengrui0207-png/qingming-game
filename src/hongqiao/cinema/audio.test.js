import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {CUES,makeAudioPlan} from './audio.js';
const root=new URL('../../../public/assets/hongqiao/cinema/audio/',import.meta.url);
const manifest=JSON.parse(readFileSync(new URL('manifest.json',root),'utf8'));
const durations=Object.fromEntries(Object.entries(manifest.files).map(([id,m])=>[id,m.duration]));
test('all 21 registered user clips match their cache hashes and contain PCM audio',()=>{
 assert.equal(Object.keys(manifest.files).length,21);
 for(const [id,m] of Object.entries(manifest.files)){
  const bytes=readFileSync(new URL(m.file,root));assert.equal(createHash('sha256').update(bytes).digest('hex'),m.sha256,id);
  assert.equal(bytes.toString('ascii',0,4),'RIFF',id);assert.equal(bytes.toString('ascii',8,12),'WAVE');
  let data;for(let offset=12;offset+8<=bytes.length;){const type=bytes.toString('ascii',offset,offset+4),length=bytes.readUInt32LE(offset+4);if(type==='fmt '){assert.equal(bytes.readUInt16LE(offset+8),1);assert.equal(bytes.readUInt32LE(offset+12),48000);}if(type==='data')data=bytes.subarray(offset+8,offset+8+length);offset+=8+length+(length%2);}
  assert.ok(data?.some(b=>b!==0),id+' must not be silent data');assert.ok(m.duration>0);
 }
});
test('speech fits its existing shot without truncation; exactly two independent rope throws',()=>{
 for(const kind of ['intro','ending']){
  const plan=makeAudioPlan(kind,durations),end=kind==='intro'?30:20;
  for(const cue of plan){assert.ok(cue.at>=0&&cue.at+cue.duration<=end,cue.id);if(cue.type==='voice')assert.equal(cue.duration,durations[cue.id],cue.id);}
  assert.deepEqual(plan.filter(c=>c.type==='voice').map(c=>[c.at,c.id]),CUES[kind]);
 }
 const throws=makeAudioPlan('intro',durations).filter(c=>c.id==='sfx_rope_throw');assert.deepEqual(throws.map(c=>c.at),[17.3,18.1]);assert.ok(throws[0].pan<0&&throws[1].pan>0);
});
test('missing or shorter effect never produces a negative offset/duration or deletes other tracks',()=>{
 const plan=makeAudioPlan('intro',{...durations,intro_01:0,sfx_rope_handle:.5});
 assert.ok(!plan.some(c=>c.id==='intro_01'));assert.equal(plan.filter(c=>c.type==='voice').length,9);
 assert.deepEqual(plan.filter(c=>c.id==='sfx_rope_handle').map(c=>c.duration),[.5]);assert.ok(plan.every(c=>c.duration>0));
});
