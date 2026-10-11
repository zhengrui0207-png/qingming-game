import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
export async function createSceneryAssets({scene,city,baseURL}){
 const folder=baseURL+'assets/scenery/',r=await fetch(folder+'placements.json');if(!r.ok)throw Error('陈设配置缺失');const config=await r.json();
 // Indices are measured after the existing cinematic hull subtraction. Fingerprints
 // prevent a stale mask from cutting a wall or a counter in a different world export.
 for(const entry of config.meshes){const mesh=city.getObjectByName(entry.mesh);if(!mesh?.isMesh)throw Error('陈设源节点缺失 '+entry.mesh);const g=mesh.geometry.clone(),idx=g.index.array,pos=g.attributes.position;if(idx.length/3!==entry.triangleCount)throw Error('陈设源网格已变化 '+entry.mesh);
  const data=new Float32Array(entry.remove.length*9);let at=0;for(const tri of entry.remove)for(let j=0;j<3;j++){const i=idx[tri*3+j];data[at++]=pos.getX(i);data[at++]=pos.getY(i);data[at++]=pos.getZ(i);}
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',data.buffer))].map(v=>v.toString(16).padStart(2,'0')).join('');if(hash!==entry.positionSha256)throw Error('陈设移除指纹不符 '+entry.mesh);
  const removed=new Set(entry.remove),next=[];for(let i=0;i<idx.length;i+=3)if(!removed.has(i/3))next.push(idx[i],idx[i+1],idx[i+2]);g.setIndex(next);g.computeBoundingSphere();mesh.geometry=g;
 }
 const draco=new DRACOLoader().setDecoderPath(baseURL+'assets/draco/'),loader=new GLTFLoader().setDRACOLoader(draco),templates=new Map();
 for(const id of ['wine','steamer','cargo']){const gltf=await loader.loadAsync(folder+id+'.glb');const bounds=new THREE.Box3().setFromObject(gltf.scene),size=bounds.getSize(new THREE.Vector3()),root=new THREE.Group();root.add(gltf.scene);gltf.scene.scale.setScalar(1/size.y);gltf.scene.position.set(-(bounds.min.x+bounds.max.x)/2/size.y,-bounds.min.y/size.y,-(bounds.min.z+bounds.max.z)/2/size.y);root.updateMatrixWorld(true);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.envMapIntensity=.3;}});templates.set(id,root);}
 const groups=[];for(const id of ['wine','steamer']){
  const rows=config.instances.filter(i=>i.assetId===id),source=templates.get(id),parts=[];source.traverse(o=>{if(o.isMesh){const mesh=new THREE.InstancedMesh(o.geometry,o.material,rows.length);mesh.name='Tripo '+id+' storefronts';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;scene.add(mesh);parts.push({mesh,local:o.matrixWorld.clone()});}});groups.push({rows,parts});
 }
 const ship=scene.getObjectByName('ship_hq_runtime');if(!ship)throw Error('任务船未就绪');ship.traverse(o=>{if(o.name==='hq_ship_QMV3_cargo_landmark_cloth')o.visible=false;});
 for(const row of config.shipCargo){const model=templates.get('cargo').clone(true);model.name=row.id;model.position.set(...row.position);model.scale.setScalar(row.height);model.rotation.y=row.yaw;ship.add(model);}
 const cover=ship.getObjectByName('prop_ending_cargo_cover');if(cover)cover.position.set(3.5,3.56,-1.2);
 draco.dispose();const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3(),m=new THREE.Matrix4(),final=new THREE.Matrix4();
 function update(camera){for(const {rows,parts} of groups){let count=0;for(const row of rows){p.set(...row.position);const distance=p.distanceTo(camera.position);const projected=p.clone().project(camera);if(distance>135||projected.z<-1||projected.z>1||Math.abs(projected.x)>1.3||Math.abs(projected.y)>1.4)continue;q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP,row.yaw);s.setScalar(row.height);m.compose(p,q,s);for(const part of parts)part.mesh.setMatrixAt(count,final.multiplyMatrices(m,part.local));count++;}for(const part of parts){part.mesh.count=count;part.mesh.instanceMatrix.needsUpdate=true;}}}
 return {update,getState:()=>({wine:config.instances.filter(i=>i.assetId==='wine').length,steamers:config.instances.filter(i=>i.assetId==='steamer').length,cargo:config.shipCargo.length,removedTriangles:config.removedTriangles,source:'Tripo',manifest:'assets/scenery/placements.json'})};
}
