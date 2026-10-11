import * as THREE from 'three';
/** Borrowed appearance only: no relocation or identity reuse of any legacy shop/NPC. */
export function mountWares({scene,sources}){
 const root=new THREE.Group();root.name='chapter2/commerce/reused-wares';scene.add(root);const assets=[],owned=[];const material=new THREE.MeshStandardMaterial({color:'#8c7355',roughness:1});
 function stand(w,h,d,x,y,z){const geometry=new THREE.BoxGeometry(w,h,d),mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);root.add(mesh);owned.push(geometry);}
 stand(3.8,.1,.85,-44,1.73,-42.9);for(const x of [-45.65,-42.35])stand(.12,.74,.65,x,1.31,-42.9);
 function clone(source,id,size,position){if(!source)return;const c=source.clone(true);c.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(c),v=b.getSize(new THREE.Vector3()),scale=size/Math.max(v.x,v.y,v.z);c.scale.multiplyScalar(scale);c.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(c),center=bounds.getCenter(new THREE.Vector3());c.position.add(new THREE.Vector3(position[0]-center.x,position[1]-bounds.min.y,position[2]-center.z));c.name=id;root.add(c);assets.push(id);}
 clone(sources.steamer,'c2_food/existing-steamer',1.1,[-45.25,1.78,-42.9]);
 clone(sources.pot,'c2_food/existing-tea-pot',.65,[-42.5,1.78,-42.9]);
 for(let i=0;i<3;i++)clone(sources.bowl,'c2_food/existing-bowl-'+i,.25,[-43.6+i*.4,1.78,-42.9]);
 clone(sources.bowl,'c2_general/existing-cup-appearance',.3,[-53,2.3,-31.5]);
 let dead=false;return {getState:()=>({assets:[...assets],legacyShopMoved:false,dedicatedNPCModels:false}),dispose(){if(dead)return;dead=true;scene.remove(root);root.clear();owned.forEach(g=>g.dispose());material.dispose();}};
}
