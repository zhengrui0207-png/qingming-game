// Bounded, bind-relative quadruped clips; native Tripo retarget retained in output.
import * as T from 'three';
import {NodeIO} from '../output/characters-45/tooling/node_modules/@gltf-transform/core/dist/index.js';
const io=new NodeIO(),doc=await io.read('output/audio-motion-ox-fix/ox/rig/model_url.glb'),nodes=doc.getRoot().listNodes(),buffer=doc.getRoot().listBuffers()[0],byName=new Map(nodes.map(n=>[n.getName(),n]));
for(const a of doc.getRoot().listAnimations())a.dispose();
const records=[];
for(const [part,side,phase] of [[0,'Left',0],[1,'Left',Math.PI/2],[0,'Right',Math.PI],[1,'Right',Math.PI*1.5]]){
 for(const joint of [1,2,3]){const n=byName.get(`tripo::${part}_${side}_Limb_${joint}`);if(!n)throw Error('missing ox joint');records.push({n,phase,joint,part});}
}
for(const [name,duration] of [['preset:idle',4],['preset:quadruped:walk',1.9]]){
 const frames=Math.round(duration*30),input=doc.createAccessor().setType('SCALAR').setArray(Float32Array.from({length:frames+1},(_,i)=>i/frames*duration)).setBuffer(buffer),animation=doc.createAnimation(name);
 const wave=name.endsWith('walk')?records:[{n:byName.get('tripo::Head_0'),idle:true,phase:0},{n:byName.get('tripo::Tail_0'),idle:true,phase:2}];
 for(const {n,phase,joint,idle} of wave){const pq=new T.Quaternion();if(n.getParentNode())new T.Matrix4().fromArray(n.getParentNode().getWorldMatrix()).decompose(new T.Vector3(),pq,new T.Vector3());const axis=new T.Vector3(0,0,1).applyQuaternion(pq.invert()),base=new T.Quaternion().fromArray(n.getRotation()),values=[];
  for(let i=0;i<=frames;i++){const t=i/frames*Math.PI*2+phase,s=Math.sin(t),angle=idle?s*.012:joint===1?s*.17:joint===2?Math.max(0,-s)*-.23:Math.max(0,-s)*.09;values.push(...new T.Quaternion().setFromAxisAngle(axis,angle).multiply(base).toArray());}
  const out=doc.createAccessor().setType('VEC4').setArray(new Float32Array(values)).setBuffer(buffer),sampler=doc.createAnimationSampler().setInput(input).setOutput(out).setInterpolation('LINEAR');animation.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(n).setTargetPath('rotation').setSampler(sampler));
 }
}
await io.write('public/assets/scenery/ox.glb',doc);console.log('Ox rig/mesh preserved, bounded local Idle/Walk baked.');
