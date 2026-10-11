import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBridgeReaction} from './bridge-reaction.js';
test('bridge reaction is seekable and restores original residents exactly',()=>{
 const root=new THREE.Group();root.position.set(2,8,1);root.rotation.y=-.7;
 const spine=new THREE.Bone(),head=new THREE.Bone(),arm=new THREE.Bone();spine.name='tripoSpine_1';head.name='tripoHead_1';arm.name='tripo0_Right_Limb_0';root.add(spine);spine.add(head,arm);head.rotation.y=.13;arm.rotation.z=.24;
 const originals=[root,spine,head,arm].map(o=>o.quaternion.toArray()),position=root.position.toArray(),reaction=createBridgeReaction(root);
 const pose=t=>{reaction.apply({x:10,y:4,z:0},t,4,-.7);return [root,spine,head,arm].map(o=>o.quaternion.toArray());};
 const a=pose(2);pose(12);assert.deepEqual(pose(2),a);assert.deepEqual(root.position.toArray(),position);assert.notDeepEqual(a,originals);reaction.restore();assert.deepEqual([root,spine,head,arm].map(o=>o.quaternion.toArray()),originals);assert.equal(reaction.active,false);reaction.restore();
});
test('bridge alarm staggers reactions and relaxes by second 27',()=>{
 const root=new THREE.Group(),r=createBridgeReaction(root);assert.equal(r.apply({x:5,z:0},0,4,0).amount,0);assert.equal(r.apply({x:5,z:0},2,4,0).amount,1);assert.equal(r.apply({x:5,z:0},27,4,0).amount,0);r.restore();
});
