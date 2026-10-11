import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// Call after loading a local merchant GLB. This module does not register gameplay,
// place scene anchors, alter the main camera, or write the formal asset index.
export const MERCHANT_ASSET_ID = 'asset_c2_merchant';
export const MERCHANT_FILES = Object.freeze({
  raw: '/assets/chapter2/characters/asset_c2_merchant/v1/model.raw.glb',
  draco: '/assets/chapter2/characters/asset_c2_merchant/v1/model.draco.glb',
});
export function createMerchantInstance(gltf, { height = 1.62 } = {}) {
  if (!Number.isFinite(height) || height <= 0) throw new RangeError('Invalid character height');
  const model = clone(gltf.scene);
  model.updateMatrixWorld(true);
  model.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const bounds = new THREE.Box3().setFromObject(model, true);
  const size = bounds.getSize(new THREE.Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0) throw new Error('Invalid model bounds');
  const scale = height / size.y;
  const root = new THREE.Group();
  root.name = MERCHANT_ASSET_ID;
  root.userData.assetId = MERCHANT_ASSET_ID;
  root.userData.version = 'v1';
  const orientation = new THREE.Group();
  orientation.rotation.y = -Math.PI / 2; // Tripo X-forward to game +Z.
  const fit = new THREE.Group();
  fit.scale.setScalar(scale);
  fit.position.set(-(bounds.min.x + bounds.max.x) * scale / 2,
    -bounds.min.y * scale, -(bounds.min.z + bounds.max.z) * scale / 2);
  root.add(orientation); orientation.add(fit); fit.add(model);
  // Attached skins update bindMatrixInverse through updateMatrixWorld. Measure
  // again after the wrapper transform, then correct the observed foot height.
  root.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(root, true);
  fit.position.y -= fitted.min.y;
  root.updateMatrixWorld(true);
  const mixer = new THREE.AnimationMixer(model);
  let disposed = false;
  return {
    root, model, mixer, clips: gltf.animations,
    play(name) {
      if (disposed) throw new Error('Instance disposed');
      const clip = gltf.animations.find(c => c.name === name);
      if (!clip) throw new Error(`Missing animation: ${name}`);
      mixer.stopAllAction(); return mixer.clipAction(clip).reset().play();
    },
    update(dt) { if (!disposed) mixer.update(Math.min(Math.max(dt, 0), 0.1)); },
    dispose() {
      if (disposed) return;
      disposed = true; mixer.stopAllAction(); mixer.uncacheRoot(model); root.removeFromParent();
      // Geometry/materials/textures are shared with the loaded GLB and other clones.
      // The owner of the loaded resource releases them after all instances are gone.
    },
  };
}
