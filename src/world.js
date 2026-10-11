import {motionConfig as motion} from './motion/config.js';
// Shared movement rules; all coordinates correspond to the Blender export.
export const WATER_LEVEL = 0.08;
export function bridgeHeight(z, bridge) {
  return bridge.base + bridge.rise * Math.max(0, 1 - (z / bridge.halfLength) ** 2);
}
export function inBridge(x, z, world, inset = 0) {
  return Math.abs(x) <= world.bridge.halfWidth - inset && Math.abs(z) <= world.bridge.halfLength;
}
export function groundHeight(x, z, world) {
  const dock = world.docks.find(d => Math.abs(x-d.x) <= d.w/2 && Math.abs(z-d.z) <= d.d/2);
  if (dock) return dock.y;
  return Math.abs(z) >= 18 ? .94 : Math.abs(z) >= 15 ? -.35 + (Math.abs(z)-15)/3*1.29 : -2;
}
export function surfaceAt(x, z, world, layer = 'ground') {
  if (layer === 'bridge' && inBridge(x,z,world)) return {height: bridgeHeight(z,world.bridge), mode:'walk'};
  const height=groundHeight(x,z,world);
  return {height: Math.max(height, -.58), mode:height < -.2 ? 'swim':'walk'};
}
export function blocked(x,z,world,radius=motion.radius) {
  return world.colliders.some(c => Math.abs(x-c.x) < c.w/2+radius && Math.abs(z-c.z) < c.d/2+radius);
}
// Only authored walkable surfaces are queried; city/house meshes are never ground candidates.
export function supportAt(x,z,world,layer='ground') {
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>world.bounds.x||Math.abs(z)>world.bounds.z)return null;
 if(layer==='bridge'&&inBridge(x,z,world))return {...surfaceAt(x,z,world,layer),source:'bridge',slope:Math.abs(2*world.bridge.rise*z/world.bridge.halfLength**2)};
 if(world.groundVoids?.some(v=>Math.abs(x-v.x)<v.w/2&&Math.abs(z-v.z)<v.d/2))return null;
 const dock=world.docks.findIndex(d=>Math.abs(x-d.x)<=d.w/2&&Math.abs(z-d.z)<=d.d/2);
 return {...surfaceAt(x,z,world,layer),source:dock>=0?'dock:'+dock:Math.abs(z)>=18?'bank':Math.abs(z)>=15?'slope':'water',slope:dock>=0||Math.abs(z)>=18||Math.abs(z)<15?0:1.29/3};
}
function validTransition(before,after) {
 if(!after||after.slope>motion.maxSlope)return false;
 // Swimming and climbing out at an authored dock are existing game behavior.
 if(before.mode==='swim'||after.mode==='swim')return true;
 const rise=after.height-before.height;
 return rise<=motion.maxStepUp+motion.contactTolerance && rise>=-motion.maxSnapDown-motion.contactTolerance;
}
function recoverOverlap(state,world) {
 if(state.layer==='bridge'||!blocked(state.x,state.z,world))return state;
 const r=motion.radius+motion.contactTolerance,candidates=[];
 for(const c of world.colliders){
  if(Math.abs(state.x-c.x)>=c.w/2+r||Math.abs(state.z-c.z)>=c.d/2+r)continue;
  for(const [x,z] of [[c.x-c.w/2-r,state.z],[c.x+c.w/2+r,state.z],[state.x,c.z-c.d/2-r],[state.x,c.z+c.d/2+r]]){
   const distance=Math.hypot(x-state.x,z-state.z),ground=supportAt(x,z,world,state.layer);
   if(distance<=motion.recoveryDistance&&!blocked(x,z,world)&&validTransition(state,ground))candidates.push({...state,x,z,...ground,distance});
  }
 }
 candidates.sort((a,b)=>a.distance-b.distance);
 if(!candidates.length)return state;
 const {distance,source,slope,...result}=candidates[0];return result;
}
export function moveActor(state, dx, dz, world) {
 if(![state.x,state.z,state.height,dx,dz].every(Number.isFinite)||!supportAt(state.x,state.z,world,state.layer))return {...state};
 // Reject an unbounded diagnostic displacement instead of hanging the render loop.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/motion.substep));
 if(steps>motion.maxSubsteps)return {...state};
 let s=recoverOverlap({...state},world);
 const safeX=world.bridge.halfWidth-motion.bridgeRailInset,entryX=world.bridge.halfWidth-motion.bridgeEntryInset;
 for(let i=0;i<steps;i++) {
  let nx=Math.max(-world.bounds.x,Math.min(world.bounds.x,s.x+dx/steps));
  let nz=Math.max(-world.bounds.z,Math.min(world.bounds.z,s.z+dz/steps));
  if(s.layer==='bridge'&&Math.abs(nz)<world.bridge.halfLength)nx=Math.max(-safeX,Math.min(safeX,nx));
  if(s.layer!=='bridge'){
   if(blocked(nx,s.z,world))nx=s.x;
   if(blocked(nx,nz,world))nz=s.z;
  }
  let layer=s.layer;
  if(layer!=='bridge'&&s.mode!=='swim'&&Math.abs(s.z)>=world.bridge.halfLength-motion.bridgeEntryTolerance&&Math.abs(nz)<world.bridge.halfLength&&Math.abs(nx)<entryX)layer='bridge';
  if(layer==='bridge'&&Math.abs(nz)>world.bridge.halfLength)layer='ground';
  const ground=supportAt(nx,nz,world,layer);
  if(!validTransition(s,ground))continue;
  s={...s,x:nx,z:nz,layer,height:ground.height,mode:ground.mode};
 }
 return s;
}
export function boatAllowed(x,z,world) {
  if(Math.abs(x)>world.bounds.x-3 || Math.abs(z)>12.6) return false;
  if(world.docks.some(d=>Math.abs(x-d.x)<d.w/2+1 && Math.abs(z-d.z)<d.d/2+2.1)) return false;
  // Leave the moored cargo hulls solid; the central arch is passable from below.
  const hulls=world.boatObstacles ?? [{x:16,z:-1,w:9,d:18},{x:-35,z:-12,w:14,d:4},{x:-57,z:-12,w:16,d:4},{x:49,z:-11,w:16,d:4},{x:58,z:11,w:12,d:4},{x:-30,z:11,w:13,d:4}];
  return !hulls.some(h=>Math.abs(x-h.x)<h.w/2+.9 && Math.abs(z-h.z)<h.d/2+1);
}
export function moveBoat(boat, direction, steering, dt, world) {
 const angle=boat.angle-steering*1.3*dt*(Math.abs(boat.speed)>.2?1:.6);
 const target=direction*(direction>0?5.8:2.6);const speed=boat.speed+(target-boat.speed)*(1-Math.exp(-dt*2.2));
 const x=boat.x+Math.sin(angle)*speed*dt,z=boat.z+Math.cos(angle)*speed*dt;
 return boatAllowed(x,z,world)?{x,z,angle,speed}:{...boat,angle,speed:0};
}
export function getDisembark(boat,world) {
 const dock=world.docks.find(d=>Math.hypot(d.x-boat.x,d.z-boat.z)<d.d/2+4.3);
 if(dock)return {x:dock.x,z:dock.z,layer:'ground',mode:'walk',height:dock.y};
 for (const side of [1,-1]) {
  const x=boat.x+Math.cos(boat.angle)*1.8*side,z=boat.z-Math.sin(boat.angle)*1.8*side;
  if(Math.abs(x)<world.bounds.x && !blocked(x,z,world))return {x,z,layer:'ground',...surfaceAt(x,z,world)};
 }
 return null;
}
