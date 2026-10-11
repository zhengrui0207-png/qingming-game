import * as THREE from 'three';
import {scholarAnimation} from './motion/config.js';
import {createLocomotionActions} from './motion/animation.js';

// The approved Tripo v2 mesh and skeleton. Runtime poses preserve its bind shape.
// Keep it separate from the instanced crowd's joint-based prototype.
export function createScholar(gltf) {
  const root = new THREE.Group();
  root.name = 'Northern Song Scholar';
  root.rotation.order = 'YXZ';
  const pose = new THREE.Group();
  pose.rotation.order = 'YXZ';
  root.add(pose);
  const alignment = new THREE.Group();
  alignment.rotation.y = -Math.PI / 2; // Native +X forward -> game +Z forward.
  pose.add(alignment);
  const model = gltf.scene;
  alignment.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const height = 2;
  const scale = height / size.y;
  model.scale.multiplyScalar(scale);
  // Preserve the skeleton origin horizontally; the backpack is asymmetric.
  model.position.y -= bounds.min.y * scale;
  let triangles = 0, skinnedMeshes = 0;
  const bones = [];
  model.traverse(o => {
    if (o.isBone) bones.push(o);
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    o.frustumCulled = false;
    triangles += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
    if (o.isSkinnedMesh) skinnedMeshes++;
    for (const material of Array.isArray(o.material) ? o.material : [o.material]) {
      material.envMapIntensity = .65;
    }
  });
  if (!skinnedMeshes || !bones.length) throw Error('Scholar asset has no bound skeleton');

  // This rig's auto-generated labels aren't anatomical. These joints were
  // identified from their hierarchy and bind-pose positions, not label guesses.
  const names = {
    armL: 'bone_19', elbowL: 'bone_20', armR: 'tripoSpine_2', elbowR: 'bone_31',
    legL: 'bone_2', kneeL: 'bone_3', legR: 'bone_6', kneeR: 'bone_7',
    head: 'tripoHead_0', spine: 'tripo0_Left_Limb_2',
  };
  const normalize = name => name.replace(/[^a-zA-Z0-9_]/g, '');
  root.updateMatrixWorld(true);
  const joints = {};
  for (const [key, name] of Object.entries(names)) {
    const bone = bones.find(b => normalize(b.name) === name);
    if (!bone) throw Error('Scholar joint missing: ' + key);
    const inverseParent = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    joints[key] = {
      bone, rest: bone.quaternion.clone(),
      x: new THREE.Vector3(1, 0, 0).applyQuaternion(inverseParent),
      z: new THREE.Vector3(0, 0, 1).applyQuaternion(inverseParent),
    };
  }
  const delta = new THREE.Quaternion();
  function bend(key, x, z = 0) {
    const joint = joints[key];
    joint.bone.quaternion.copy(joint.rest);
    joint.bone.quaternion.premultiply(delta.setFromAxisAngle(joint.x, x));
    if (z) joint.bone.quaternion.premultiply(delta.setFromAxisAngle(joint.z, z));
  }
  const restBones = bones.map(bone => ({bone, position: bone.position.clone(),
    rest: bone.quaternion.clone(), previous: bone.quaternion.clone()}));
  const locomotion=createLocomotionActions(model,gltf.animations??[],scholarAnimation);
  let active = 'idle', mode = 'walk', clock = 0;
  function update(dt, nextMode, moving, phase, fast = false) {
    mode = nextMode;
    clock += dt;
    active = mode === 'swim' ? 'swim' : mode === 'boat' ? 'row' : moving ? 'walk' : 'idle';
    if(locomotion.update(dt,mode==='walk'?active:null)){
      pose.rotation.x=THREE.MathUtils.damp(pose.rotation.x,0,12,dt);
      return;
    }
    // Imported retarget clips distort this long-robed rig. Use bounded poses
    // from the verified bind pose; blend every joint on state transitions.
    for (const state of restBones) {
      state.previous.copy(state.bone.quaternion);
      state.bone.quaternion.copy(state.rest);
      state.bone.position.copy(state.position);
    }
    pose.rotation.x = THREE.MathUtils.damp(pose.rotation.x, mode === 'swim' ? Math.PI * .42 : 0, 12, dt);
    if (mode === 'swim') {
      const stroke = moving ? Math.sin(phase) : .15 * Math.sin(clock * 2);
      bend('armL', -1.3 + stroke * .85, -.12);
      bend('armR', -1.3 - stroke * .85, .12);
      bend('elbowL', -.25 - Math.max(0, stroke) * .45);
      bend('elbowR', -.25 - Math.max(0, -stroke) * .45);
      bend('legL', stroke * .15); bend('legR', -stroke * .15);
      bend('kneeL', .1); bend('kneeR', .1);
      bend('head', -.3);
    } else if (mode === 'boat') {
      // Standing oar stroke avoids folding the ankle-length robe through a seat.
      const stroke = moving ? Math.sin(phase) : 0;
      bend('armL', -.75 + stroke * .28, -.08);
      bend('armR', -.75 + stroke * .28, .08);
      bend('elbowL', -.6 - stroke * .18);
      bend('elbowR', -.6 - stroke * .18);
      bend('spine', .06 + stroke * .05);
    } else {
      const stride = moving ? Math.sin(phase) : 0;
      const swing = fast ? .38 : .28;
      bend('legL', -stride * swing); bend('legR', stride * swing);
      bend('kneeL', Math.max(0, -stride) * .24);
      bend('kneeR', Math.max(0, stride) * .24);
      bend('armL', stride * .25 - .03, -.02);
      bend('armR', -stride * .25 - .03, .02);
      bend('elbowL', -.08); bend('elbowR', -.08);
      bend('spine', Math.sin(clock * 1.7) * .008);
      bend('head', Math.sin(clock * .7) * .016);
    }
    const blend = 1 - Math.exp(-dt * 18);
    for (const state of restBones) {
      state.previous.slerp(state.bone.quaternion, blend);
      state.bone.quaternion.copy(state.previous);
    }
  }
  return {
    root, update,
    getState: () => ({
      asset: 'song-scholar-v2-animated.glb', version: 2, height, triangles,
      bones: bones.length, skinnedMeshes, animations: ['idle', 'walk', 'swim', 'row'], animationSource: locomotion.ready && mode==='walk' ? 'approved-clips' : 'procedural-skeleton',
      locomotion: locomotion.getState(),
      active, mode, animationTime: clock,
      joints: Object.fromEntries(Object.entries(joints).map(([key, j]) => [key, j.bone.quaternion.toArray()])),
    }),
  };
}
