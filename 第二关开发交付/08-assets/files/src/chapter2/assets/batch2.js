import * as THREE from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';

// Existing production batch IDs. These are not chapter2 NPC identity mappings.
export const BATCH2_IDS = Object.freeze(Array.from({ length: 10 }, (_, i) =>
  `QMSH-${String(i + 7).padStart(2, '0')}`));

export function batch2File(assetId, variant = 'draco') {
  if (!BATCH2_IDS.includes(assetId)) throw new RangeError('Unknown batch2 asset');
  if (!['raw', 'draco'].includes(variant)) throw new RangeError('Unknown GLB variant');
  return `/assets/chapter2/characters/${assetId}/idlewalk-v1/model.${variant}.glb`;
}

export function createBatch2Instance(assetId, gltf, { height = assetId === 'QMSH-13' ? 1.68 : 1.78 } = {}) {
  batch2File(assetId);
  if (!(Number.isFinite(height) && height > 0)) throw new RangeError('Invalid height');
  const clips = Object.fromEntries(gltf.animations.map(c => [c.name, c]));
  if (!clips.Idle || !clips.Walk) throw new Error('Missing embedded Idle/Walk');
  const model = clone(gltf.scene);
  model.updateMatrixWorld(true);
  model.traverse(o => { if (o.isSkinnedMesh) o.skeleton.update(); });
  const bounds = new THREE.Box3().setFromObject(model, true);
  const scale = height / (bounds.max.y - bounds.min.y);
  if (!Number.isFinite(scale)) throw new Error('Invalid model bounds');
  const root = new THREE.Group(), orientation = new THREE.Group(), fit = new THREE.Group();
  root.name = assetId;
  root.userData.assetId = assetId;
  root.userData.version = 'idlewalk-v1';
  orientation.rotation.y = -Math.PI / 2;
  fit.scale.setScalar(scale);
  fit.position.set(-(bounds.min.x + bounds.max.x) * scale / 2,
    -bounds.min.y * scale, -(bounds.min.z + bounds.max.z) * scale / 2);
  root.add(orientation); orientation.add(fit); fit.add(model);
  root.updateMatrixWorld(true);
  fit.position.y -= new THREE.Box3().setFromObject(root, true).min.y;
  root.updateMatrixWorld(true);
  const mixer = new THREE.AnimationMixer(model);
  let disposed = false;
  return {
    root, model, mixer, clips: gltf.animations,
    play(name) {
      if (disposed) throw new Error('Instance disposed');
      const clip = clips[name];
      if (!clip) throw new Error(`Missing clip: ${name}`);
      mixer.stopAllAction();
      return mixer.clipAction(clip).reset().play();
    },
    update(dt) { if (!disposed) mixer.update(Math.min(Math.max(dt, 0), .1)); },
    dispose() {
      if (disposed) return;
      disposed = true;
      mixer.stopAllAction(); mixer.uncacheRoot(model); root.removeFromParent();
      // Shared meshes/materials/textures belong to the resource owner.
    },
  };
}
