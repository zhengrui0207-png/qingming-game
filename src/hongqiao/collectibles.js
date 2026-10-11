import {createInteractionRegistry,segmentBlocked} from '../interaction/core.js';
import {moveActor} from '../world.js';
import * as THREE from 'three';

export function createCollectibles({scene, loader, config, store, world, baseURL}) {
  const root = new THREE.Group(); root.name = 'Hongqiao task instances'; scene.add(root);
  const entries = new Map(), assetErrors = [];
  const collected = id => store.getState().worldState.collectedInstanceIds.includes(id);
  function dispose(model) {model.traverse(o => {if (o.isMesh) {o.geometry.dispose(); for (const m of Array.isArray(o.material) ? o.material : [o.material]) {for (const value of Object.values(m)) if (value?.isTexture) value.dispose(); m.dispose();}}});}
  function sync() {for (const [id, entry] of entries) entry.group.visible = !collected(id);}
  for (const instance of config.instances) {
    const anchor = config.anchors.find(a => a.id === instance.anchorId);
    const item = config.items.find(i => i.id === instance.itemId);
    const group = new THREE.Group(); group.name = instance.id; group.position.set(...anchor.position); root.add(group);
    const placeholder = new THREE.Mesh(new THREE.BoxGeometry(.48, instance.visualHeight, .48), new THREE.MeshStandardMaterial({color: '#c8ac74', roughness: .9}));
    placeholder.position.y = instance.visualHeight / 2 + .04; group.add(placeholder);
    const entry = {group, anchor, instance, item, loadState: 'pending'}; entries.set(instance.id, entry);
    group.visible = !collected(instance.id);
    const asset = config.assets.find(a => a.id === item.assetId);
    // The placeholder is available immediately. This promise never blocks game boot.
    loader.loadAsync(baseURL + asset.path).then(gltf => {
      if (collected(instance.id)) {dispose(gltf.scene); entry.loadState = 'discarded-collected'; sync(); return;}
      const model = gltf.scene, bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3());
      const scale = instance.maxDimension / Math.max(size.x, size.y, size.z);
      const center = bounds.getCenter(new THREE.Vector3());
      model.scale.setScalar(scale); model.position.set(-center.x * scale, .04 - bounds.min.y * scale, -center.z * scale);
      group.remove(placeholder); dispose(placeholder); group.add(model); entry.loadState = 'loaded'; sync();
    }).catch(error => {entry.loadState = 'placeholder'; assetErrors.push({instanceId: instance.id, error: String(error)}); console.warn('[Hongqiao asset; using placeholder]', instance.id, error); sync();});
  }
  store.subscribeWorld(sync);
  // Compatibility query delegates to the same registry rules; the runtime uses its shared registry.
  const compatibility=createInteractionRegistry({unobstructed:(a,p)=>!segmentBlocked({x:a.x,y:a.height,z:a.z},p,world.colliders),reachable:(a,p)=>{const r=moveActor({...a},p.x-a.x,p.z-a.z,world);return r.mode==='walk'&&r.layer===a.layer&&Math.hypot(r.x-p.x,r.z-p.z)<.1;}});
  for(const e of entries.values()){const p=new THREE.Vector3();compatibility.register({id:e.instance.id,type:'item',entity:e.group,anchor:e.anchor,radius:2,maxHeightDifference:.7,enabled:()=>e.group.visible&&store.getState().permissions.includes(e.instance.permissionId),getPosition:()=>e.group.getWorldPosition(p),action:()=>{}});}
  return {focus:actor=>{const e=compatibility.focus(actor);return e?entries.get(e.id):null;},entries:()=>[...entries.values()], getState: () => ({instances: [...entries].map(([id,e]) => ({id, visible: e.group.visible, loadState: e.loadState})), assetErrors: [...assetErrors]})};
}
