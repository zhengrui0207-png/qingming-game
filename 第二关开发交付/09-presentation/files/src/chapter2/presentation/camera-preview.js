// DEV host implementation of the frozen camera lease. Production supplies its main-camera adapter.
export function createCameraAdapter(camera,orbit,{aspect=()=>camera.aspect,onRestore=()=>{}}={}){
 let active=null,restores=0;
 const capture=()=>({camera:camera.clone(),yaw:orbit.yaw,pitch:orbit.pitch,distance:orbit.distance,targetDistance:orbit.targetDistance,overview:orbit.overview,focus:orbit.focus.clone()});
 function release(token){if(active!==token)return;active=null;camera.copy(token.snapshot.camera);for(const k of ['yaw','pitch','distance','targetDistance','overview'])orbit[k]=token.snapshot[k];orbit.focus.copy(token.snapshot.focus);camera.aspect=aspect();camera.updateProjectionMatrix();restores++;onRestore();}
 return {borrow(owner,onCancel){if(active)return null;const token={owner,onCancel,snapshot:capture()};active=token;return {setPose(p){if(active!==token)throw Error('Released camera lease');camera.position.fromArray(p.position);camera.lookAt(...p.target);camera.fov=p.fov??camera.fov;camera.updateProjectionMatrix();},release:()=>release(token)};},capture,getState:()=>({owner:active?.owner??null,restores}),forcePreempt(){const token=active;token?.onCancel?.();if(active===token&&token)release(token);}};
}
