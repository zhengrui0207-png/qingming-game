import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import config from './jiaodian.json';
const V=a=>new THREE.Vector3(...a);
// A local addition to the existing south-street wine-shop footprint. No task effects.
export function createJiaodian(scene,world,library){
 const shop=world.shops.find(s=>s.id===config.shopId);if(!shop)throw Error('脚店地块缺失');
 const root=new THREE.Group();root.name=config.id;root.position.fromArray(config.frontage);root.rotation.y=config.yaw;scene.add(root);
 for(const dz of [-3,3])world.colliders.push({id:config.id+'_post_'+dz,x:config.frontage[0],z:config.frontage[2]+dz,w:.18,d:.18,h:7.6,kind:'decoration'});
 const materials={wood:new THREE.MeshStandardMaterial({color:'#574534',roughness:.95}),bamboo:new THREE.MeshStandardMaterial({color:'#8c7b52',roughness:1}),dark:new THREE.MeshStandardMaterial({color:'#292d27',roughness:1}),cloth:new THREE.MeshStandardMaterial({color:'#ad9271',roughness:1,side:THREE.DoubleSide}),red:new THREE.MeshStandardMaterial({color:'#825c4a',roughness:1})};
 const batches=new Map();
 function geometry(g,key,p=[0,0,0],q=new THREE.Quaternion()) {g.applyMatrix4(new THREE.Matrix4().compose(V(p),q,new THREE.Vector3(1,1,1)));if(!batches.has(key))batches.set(key,[]);batches.get(key).push(g);}
 function bar(a,b,r=.045,key='bamboo'){const d=V(b).sub(V(a));geometry(new THREE.CylinderGeometry(r*.86,r,d.length(),7),key,V(a).add(V(b)).multiplyScalar(.5).toArray(),new THREE.Quaternion().setFromUnitVectors(V([0,1,0]),d.normalize()));}
 function box(p,size,key='wood'){geometry(new THREE.BoxGeometry(...size),key,p);}
 // Decorative bamboo frontage: two tiers, curved slats, cross-bracing and slender finials.
 for(const x of [-3,3]){bar([x,0,0],[x,7.6,0],.09);bar([x,0,-.8],[x,7.2,-.8],.07);for(const y of [2.9,4.8,6.5])bar([x,y,-.8],[x,y,0],.045);}
 for(const y of [3.7,5.8]){
  for(let i=0;i<12;i++){const x=-3+i*.5,n=x+.5;const h=u=>y+.46*Math.pow(Math.abs(u)/3,2);bar([x,h(x),0],[n,h(n),0],.065,'wood');bar([x,h(x)+.28,0],[n,h(n)+.28,0],.045);}
  for(let i=0;i<=12;i++){const x=-3+i*.5,h=y+.46*Math.pow(Math.abs(x)/3,2);bar([x,h,0],[x,h+.75,0],.026);bar([x,h,0],[x+.28,h+.5,0],.024);}
 }
 for(let i=0;i<11;i++){const x=-2.5+i*.5;bar([x,6.3,0],[x*1.08,7.5+.7*(1-Math.abs(x)/3),0],.025);}
 for(const x of [-2.5,-1.5,-.5,.5,1.5,2.5]){bar([x,4.2,0],[x+.7,5.8,0],.025);bar([x,5.8,0],[x+.5,7.1,0],.025);}
 // A small woven awning and open doorway sit within the original frontage.
 box([-2.12,1.38,-.74],[1.42,2.76,.06],'dark');for(const x of [-2.85,-1.38])box([x,1.44,-.55],[.12,2.88,.14]);box([-2.12,2.85,-.55],[1.65,.15,.18]);
 for(let i=0;i<10;i++)box([-2.8+i*.145,3.0,-.15],[.13,.06,1.55],'bamboo');
 for(const y of [3.55,5.6])for(let i=0;i<24;i++)box([-2.88+i*.25,y,.055],[.18,.22+(i%3)*.055,.055],i%4===0?'red':'cloth');
 for(const [key,parts]of batches){const g=mergeGeometries(parts,false),m=new THREE.Mesh(g,materials[key]);m.name=config.id+'_'+key;m.castShadow=true;m.receiveShadow=true;root.add(m);parts.forEach(g=>g.dispose());}
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=768;const c=canvas.getContext('2d');c.fillStyle='#d9c8a1';c.fillRect(0,0,256,768);c.strokeStyle='#695337';c.lineWidth=14;c.strokeRect(10,10,236,748);c.fillStyle='#2e3029';c.textAlign='center';c.textBaseline='middle';c.font='bold 170px "Songti SC",serif';c.fillText('脚',128,235);c.fillText('店',128,480);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.65,1.95,.07),new THREE.MeshStandardMaterial({map:tex,roughness:1}));sign.name='prop_jiaodian_vertical_sign';sign.position.set(-2.6,2.08,.29);root.add(sign);
 const visual=library.spawn(config.waiter.sourceNpcId);if(!visual||visual.asset.id!==config.waiter.assetId)throw Error('脚店需要既有 QMSH-16 酒保资产');
 const waiter=visual.root;waiter.name=config.waiter.id;waiter.userData.npcId=config.waiter.id;waiter.position.fromArray(config.waiter.position);waiter.rotation.y=config.waiter.yaw;scene.add(waiter);
 // Reuse the reviewed rig-proxy mask on this clone only: remove its old tray and jug.
 // Coordinates are the inverse of the original QMSH-16 normalization, not a skin-weight heuristic.
 let removedTriangles=0;const bones=new Map();waiter.traverse(o=>{if(o.isBone)bones.set(o.name,o);if(!o.isSkinnedMesh)return;const g=o.geometry.clone(),p=g.attributes.position,idx=g.index,keep=[];for(let i=0;i<idx.count;i+=3){const v=new THREE.Vector3();for(let j=0;j<3;j++)v.add(new THREE.Vector3().fromBufferAttribute(p,idx.getX(i+j)));v.multiplyScalar((.998046875)/3).sub(V([.0202607581184443,.4990234375,.004867565356832443]));if(v.x>.01&&v.y>.079&&v.y<.3&&v.z<.02){removedTriangles++;continue;}keep.push(idx.getX(i),idx.getX(i+1),idx.getX(i+2));}g.setIndex(keep);o.geometry=g;});
 const bone=n=>bones.get(THREE.PropertyBinding.sanitizeNodeName(n));
 const chains=['Right','Left'].map(side=>[0,1,2].map(i=>bone(`tripo::0_${side}_Limb_${i}`)));if(chains.some(c=>c.some(b=>!b)))throw Error('脚店伙计双手骨骼缺失');
 const base=new Map([...bones.values()].map(b=>[b,b.quaternion.clone()]));
 const ceramic=new THREE.MeshStandardMaterial({color:'#9aa190',roughness:.48});
 const bowl=new THREE.Mesh(new THREE.LatheGeometry([[.07,0],[.09,.015],[.115,.045],[.17,.13],[.175,.145],[.155,.145],[.145,.125],[.092,.035],[.07,.028]].map(p=>new THREE.Vector2(...p)),32),ceramic);bowl.name=config.props.bowlId;scene.add(bowl);
 const chopsticks=config.props.chopstickIds.map(id=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.008,.013,.32,8),materials.bamboo);m.name=id;scene.add(m);return m;});
 function aim(chain,target){for(let r=0;r<8;r++)for(const joint of [chain[1],chain[0]]){waiter.updateMatrixWorld(true);const origin=joint.getWorldPosition(new THREE.Vector3()),end=chain[2].getWorldPosition(new THREE.Vector3()).sub(origin).normalize(),to=target.clone().sub(origin).normalize(),parent=joint.parent.getWorldQuaternion(new THREE.Quaternion());joint.quaternion.premultiply(parent.clone().invert().multiply(new THREE.Quaternion().setFromUnitVectors(end,to)).multiply(parent));}}
 function update(){for(const [b,q]of base)b.quaternion.copy(q);waiter.updateMatrixWorld(true);aim(chains[0],waiter.localToWorld(V([.26,1.13,.31])));aim(chains[1],waiter.localToWorld(V([-.25,1.26,.30])));
  const left=chains[0][2].getWorldPosition(new THREE.Vector3()),right=chains[1][2].getWorldPosition(new THREE.Vector3());bowl.position.copy(left).add(V([0,.025,0]));
  const forward=V([0,-.55,1]).applyQuaternion(waiter.quaternion).normalize();for(let i=0;i<2;i++){const lateral=V([(i-.5)*.038,0,0]).applyQuaternion(waiter.quaternion);chopsticks[i].position.copy(right).addScaledVector(forward,.06).add(lateral);chopsticks[i].quaternion.setFromUnitVectors(V([0,1,0]),forward);}
 }
 update(0);shop.name=config.name;shop.wares=config.look;shop.historyNote=config.interpretation;shop.authoredMerchant=config.waiter.id;
 return {update,body:()=>({id:config.waiter.id,x:waiter.position.x,z:waiter.position.z,y:.94,layer:'ground',radius:.4}),getState:()=>({id:config.id,shopId:shop.id,name:shop.name,waiter:config.waiter.id,assetId:visual.asset.id,position:waiter.position.toArray(),bowl:bowl.position.toArray(),hands:chains.map(c=>c[2].getWorldPosition(new THREE.Vector3()).toArray()),chopstickCount:chopsticks.length,removedTriangles,taskEffects:[],interpretation:config.interpretation})};
}
