import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
import {createStreetLife} from '../src/street-life.js';
const read=p=>JSON.parse(fs.readFileSync(p));
const original=read('output/npc-integration/original-npcs.json'),mapping=read('output/npc-integration/npc-map-full.json'),catalog=read('public/assets/characters/catalog.json');
test('45 identities cover the same 218 NPCs, with static assets kept off moving roles',()=>{
 assert.equal(catalog.length,45);assert.equal(new Set(mapping.map(p=>p.assetId)).size,45);
 assert.deepEqual(mapping.map(p=>p.id),original.map(p=>p.id));
 for(let i=0;i<mapping.length;i++){
  const m=mapping[i],o=original[i];for(const key of ['position','rotation','scale','route','collision','interaction'])assert.deepEqual(m[key],o[key]);
  const a=catalog.find(a=>a.id===m.assetId);if(!a.skins){assert.equal(m.route,null);assert.ok(!['车夫','船夫','骑马人','乘客','赶牛人'].includes(m.role))}
 }
 assert.equal(mapping.find(p=>p.id==='npc_hq_fang').assetId,'QMSH-44');
 assert.equal(mapping.find(p=>p.id==='street-168').assetId,'QMSH-16');
 assert.equal(mapping.find(p=>p.id==='street-166').assetId,'QMSH-17');
});
test('model substitution preserves all pedestrian, cart and ferry trajectories',async()=>{
 const before=fs.readFileSync('output/npc-integration/before/street-life.js','utf8').replace("'three'",JSON.stringify(pathToFileURL(process.cwd()+'/node_modules/three/build/three.module.js').href)).replace("'./life-paths.js'",JSON.stringify(pathToFileURL(process.cwd()+'/src/life-paths.js').href));
 const old=await import('data:text/javascript;base64,'+Buffer.from(before).toString('base64'));
 const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(.4,1.8,.3),new THREE.MeshStandardMaterial()));
 const assets=new THREE.Group();for(const name of ['ox','horse','cart','ferry','hat','shoulder_load','pot','bowl','book','stick']){const x=source.clone();x.name=name;assets.add(x)}
 const world=read('public/assets/world.json'),camera=new THREE.PerspectiveCamera();camera.position.set(20,20,30);camera.lookAt(0,0,0);camera.updateMatrixWorld();
 const stub={spawn:id=>({root:new THREE.Group(),asset:{id,skins:1},update(){},state(){return {id}}})};
 const a=old.createStreetLife(new THREE.Scene(),source,assets,structuredClone(world),camera),b=createStreetLife(new THREE.Scene(),source,assets,structuredClone(world),camera,stub);
 for(let n=0;n<240;n++){const boat={x:32,z:7},dt=n%2?.033:.02,t=n*.027;a.update(t,dt,boat);b.update(t,dt,boat)}
 for(const key of ['people','traffic','ferries'])assert.deepEqual(b.snapshot()[key],a.snapshot()[key]);
 assert.equal(b.getState().npcAssets.replaced,214);
});
