import * as THREE from 'three';
// Caller owns source asset geometry/material lifetime; clones only share immutable buffers.
// Root/slots disposal removes these clones, but must not dispose shared source resources.
export function fitClone(source,targetLength,parent){if(!source)return null;const g=source.clone(true),size=new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()),s=targetLength/Math.max(size.x,size.z);g.scale.multiplyScalar(s);const b=new THREE.Box3().setFromObject(g),c=b.getCenter(new THREE.Vector3());g.position.add(new THREE.Vector3(-c.x,-b.min.y,-c.z));parent.add(g);return g;}
export function mountReusableAssets(slots,lifeRoot){for(const g of slots.boats.children)fitClone(lifeRoot.getObjectByName('ferry'),g.userData.targetLength,g);fitClone(lifeRoot.getObjectByName('cart'),3,slots.repair);fitClone(lifeRoot.getObjectByName('cart'),3.6,slots.coveredCart);fitClone(lifeRoot.getObjectByName('cart'),3,slots.traffic);}
