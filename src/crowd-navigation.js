import {blocked,bridgeHeight,moveActor} from './world.js';

// A short local detour is only requested after waiting. The authored circuit and
// the player's controller remain unchanged; each traversed edge is still swept.
export function findCrowdDetour(person,world,others,{pose,sweep,config,retreat=false}){
 const step=config.detourGrid,extent=Math.ceil(config.detourRadius/step);
 const margin=config.detourRadius+config.radius+1;
 const localWorld={...world,colliders:world.colliders.filter(c=>Math.abs(c.x-person.x)<margin+c.w/2&&Math.abs(c.z-person.z)<margin+c.d/2)};
 const surface=(x,z)=>{
  const bridge=Math.abs(z)<18;
  if(bridge&&Math.abs(x)>world.bridge.halfWidth-config.radius-.12)return null;
  if(Math.abs(x)>Math.max(config.detourStreetWidth,Math.abs(person.x))||Math.abs(z)>world.bounds.z-.5)return null;
  if(!bridge&&blocked(x,z,localWorld,config.radius))return null;
  return {x,z,y:bridge?bridgeHeight(z,world.bridge):.94,layer:bridge?'bridge':'ground'};
 };
 // Similar faces affect route preference, not collision size: inflated bodies
 // can otherwise imprison a resident between two perfectly passable people.
 const obstacles=others.filter(b=>Math.abs(b.x-person.x)<margin+(b.radius??config.radius)&&Math.abs(b.z-person.z)<margin+(b.radius??config.radius));
 const edge=(a,b)=>{
  if(sweep(a,b,obstacles,person.radius)<.999)return false;
  const g=moveActor({x:a.x,z:a.z,height:a.y,layer:a.layer,mode:'walk'},b.x-a.x,b.z-a.z,localWorld);
  return g.mode==='walk'&&Math.hypot(g.x-b.x,g.z-b.z)<.015&&Math.abs(g.height-b.y)<.15;
 };
 const goals=[];
 for(const ahead of retreat?[-1.5,-3,-5]:config.detourLookahead)for(const offset of [person.offset,...config.detourOffsets]){
  const q=pose(person,person.distance+ahead,offset),s=surface(q.x,q.z);
  if(s&&Math.hypot(s.x-person.x,s.z-person.z)<=config.detourRadius-.5&&
   sweep({...s,x:s.x-.001},{...s,x:s.x+.001},obstacles,person.radius)===1&&
   obstacles.every(b=>!Number.isFinite(b.x)||Math.abs((b.y??b.height??.94)-s.y)>config.layerTolerance||Math.hypot(b.x-s.x,b.z-s.z)>=Math.max(person.radius+(b.radius??config.radius)+config.personalGap+.025,b.assetId&&b.assetId===person.assetId?config.sameAssetGap:0)))goals.push({...s,distance:person.distance+ahead,offset});
 }
 if(!goals.length)return null;
 const heuristic=p=>Math.min(...goals.map(g=>Math.hypot(g.x-p.x,g.z-p.z)));
 const key=(i,j)=>i+','+j,origin={i:0,j:0,x:person.x,z:person.z,y:person.y,layer:person.layer,g:0,parent:null};
 const open=[origin],visited=new Map([[key(0,0),origin]]),closed=new Set();let expanded=0;
 origin.f=heuristic(origin);
 while(open.length&&expanded++<config.detourNodeLimit){
  let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;
  const current=open.splice(best,1)[0],id=key(current.i,current.j);if(closed.has(id))continue;closed.add(id);
  for(const goal of goals)if(Math.hypot(goal.x-current.x,goal.z-current.z)<=step*1.5&&edge(current,goal)){
   const points=[goal];for(let p=current;p.parent;p=p.parent)points.unshift({x:p.x,z:p.z,y:p.y,layer:p.layer});
   // String-pull only across collision-free, supported edges.
   const smooth=[];let from=origin;
   for(let i=0;i<points.length;){let last=i;for(let j=i+1;j<points.length;j++){if(!edge(from,points[j]))break;last=j;}smooth.push(points[last]);from=points[last];i=last+1;}
   return {points:smooth,distance:goal.distance,offset:goal.offset};
  }
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const i=current.i+di,j=current.j+dj,k=key(i,j);if(Math.abs(i)>extent||Math.abs(j)>extent||closed.has(k))continue;
   const p=surface(person.x+i*step,person.z+j*step);if(!p||!edge(current,p))continue;
   const resemblance=obstacles.some(b=>b.assetId&&b.assetId===person.assetId&&Math.abs((b.y??.94)-p.y)<config.layerTolerance&&Math.hypot(b.x-p.x,b.z-p.z)<config.sameAssetGap)?.6:0;
   const g=current.g+Math.hypot(di,dj)*step+resemblance;if(visited.has(k)&&visited.get(k).g<=g)continue;
   const node={...p,i,j,g,f:g+heuristic(p),parent:current};visited.set(k,node);open.push(node);
  }
 }
 return null;
}
