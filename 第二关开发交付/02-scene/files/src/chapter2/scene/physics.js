import {moveActor, supportAt} from '../../world.js';
import {segmentBlocked} from '../../interaction/core.js';
import layout from './layout.json' with {type:'json'};
import manifest from './anchors.json' with {type:'json'};
export {layout,manifest};
export const inScope=(x,z)=>x>=layout.scope.minX&&x<=layout.scope.maxX&&z>=layout.scope.minZ&&z<=layout.scope.maxZ;
export const colliderInScope=c=>inScope(c.x-c.w/2,c.z-c.d/2)&&inScope(c.x+c.w/2,c.z+c.d/2);
// Immutable input; 00/10 can choose this runtime copy without mutating legacy world.json.
export function createWorldOverlay(base){return {...base,colliders:[...base.colliders.filter(c=>!colliderInScope(c)),...layout.colliders],chapter2SupportSurfaces:layout.supportSurfaces};}
export function supportForD(x,z,world){const s=layout.supportSurfaces.find(s=>x>=s.minX&&x<=s.maxX&&z>=s.minZ&&z<=s.maxZ);return s?{...supportAt(x,z,world),surfaceId:s.id}:null;}
export function canInteract(actor,anchor,world){const p=anchor.position;if(actor.layer!==anchor.layer||actor.mode!=='walk'||Math.abs(actor.height-p[1])>.8||Math.hypot(actor.x-p[0],actor.z-p[2])>1.8)return false;if(segmentBlocked({x:actor.x,y:actor.height,z:actor.z},{x:p[0],y:p[1],z:p[2]},world.colliders))return false;const r=moveActor({...actor},p[0]-actor.x,p[2]-actor.z,world);return r.mode==='walk'&&r.layer===actor.layer&&Math.hypot(r.x-p[0],r.z-p[2])<.1;}
export function walkRoute(route,world,{reverse=false,step=.12}={}){const points=reverse?[...route.waypoints].reverse():route.waypoints;let actor={x:points[0][0],z:points[0][2],height:points[0][1],mode:'walk',layer:'ground'},samples=[];for(const p of points.slice(1)){const length=Math.hypot(p[0]-actor.x,p[2]-actor.z),n=Math.ceil(length/step),dx=(p[0]-actor.x)/n,dz=(p[2]-actor.z)/n;for(let i=0;i<n;i++){actor=moveActor(actor,dx,dz,world);samples.push({...actor});}if(Math.hypot(actor.x-p[0],actor.z-p[2])>.05)throw Error('Route blocked: '+route.id+' '+JSON.stringify(actor)+' target '+p);}return {actor,samples};}
