import * as THREE from 'three';
/** Replace this adapter with 08 props / 09 actor cues. Never reparent or animate the scholar rig. */
export function createRig(scene,anchor,{onCue=()=>{}}={}){
 const root=new THREE.Group();root.name='c2-repair-wood-frame';root.position.fromArray(anchor.position);scene?.add(root);
 const mats=[],geos=[];const mat=c=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:.92});mats.push(m);return m;};const wood=mat('#785535'),rope=mat('#c9b58d'),wedge=mat('#977048'),scratch=mat('#d5c5a1');
 function box(w,h,d,x,y,z,m,parent=root){const g=new THREE.BoxGeometry(w,h,d);geos.push(g);const p=new THREE.Mesh(g,m);p.position.set(x,y,z);parent.add(p);return p;}
 const frame=new THREE.Group();root.add(frame);
 for(const x of [-.58,.58])box(.13,.7,.13,x,.44,0,wood,frame);
 for(const y of [.48,.83])box(1.5,.1,.18,0,y,0,wood,frame);
 for(const x of [-.5,.5])box(.13,.13,.85,x,.17,0,wood,frame);
 box(.3,.018,.018,0,.886,.1,scratch,frame); // Preserve the scar after repair.
 const feet=[box(.24,.09,.32,-.68,.045,.23,wedge),box(.24,.09,.32,.7,.045,-.2,wedge)];
 const bindings=[box(.075,.24,.23,-.52,.79,.06,rope,frame),box(.075,.24,.23,.52,.79,.06,rope,frame)];
 const cargo=box(.62,.36,.44,0,.25,-.9,wood); // Unloaded during work; secured near the frame after success.
 const bell=box(.085,.11,.08,.87,.58,0,mat('#947844'));bell.visible=false;
 let state=null,t=0,cueName='idle';
 function cue(name){cueName=name;t=0;onCue({owner:'c2/repair',name,actorId:'npc_c2_porter',objectId:'object_c2_cargo_frame'});}
 function sync(s){state=s;const n=s.repair.stepIds.length,done=s.repair.status==='completed',b=s.board;
  for(let i=0;i<2;i++){const fixed=n>=2||done||(b?.step===1&&b.parts[i].fixed);if(fixed)feet[i].position.set(i?.58:-.58,.045,0);feet[i].rotation.z=fixed?0:(i?-.18:.18);if(b?.step===1){feet[i].position.x=(b.parts[i].x-300)/190;feet[i].position.z=(b.parts[i].y-268)/140;}}
  for(let i=0;i<2;i++){const fixed=n>=3||done||(b?.step===2&&b.parts[i+2].fixed);bindings[i].rotation.z=fixed?0:(i?-.3:.35);}
  cargo.position.set(0,done?1.06:.25,done?0:-.9);bell.visible=s.phase==='past'&&s.repair.rewardChoice==='bell';
 }
 function update(dt){t+=dt;if(!state)return;const done=state.repair.status==='completed',b=state.board;frame.rotation.z=done?0:b?.step===3&&b.pressing?Math.sin(t*18)*.018:Math.sin(t*2)*.014;bell.rotation.z=cueName==='listen'?Math.sin(t*4)*.12:0;}
 return {root,cue,sync,update,getState:()=>({cue:cueName,stable:state?.repair.status==='completed',asset:'procedural graybox',historicalCraftReconstruction:false}),dispose(){root.removeFromParent();geos.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());}};
}
