import {sampleRoute,streetHeight} from './life-paths.js';
import {blocked,moveActor} from './world.js';
import {findCrowdDetour} from './crowd-navigation.js';
export const crowdConfig=Object.freeze({radius:.46,personalGap:.12,maxStep:.04,maxCatchup:.24,layerTolerance:1.8,spawnGap:.4,sameAssetGap:2.4,laneVariation:.34,yieldSpeed:.48,detourAfter:1.5,detourRetry:3,detourGrid:.5,detourRadius:9,detourStreetWidth:4.2,detourLookahead:[2.5,4,6,8],detourOffsets:[0,-.6,.6,-1.2,1.2,-1.6,1.6],detourNodeLimit:700,plansPerUpdate:1});
export const crowdLayer=p=>Math.abs(p.z)<18&&Math.abs(p.x)<3.8?'bridge':'ground';
export function sameFloor(a,b){return Math.abs((a.height??a.y??.94)-(b.height??b.y??.94))<crowdConfig.layerTolerance&&(a.layer===b.layer||!a.layer||!b.layer||Math.abs(a.z)>17||Math.abs(b.z)>17);}
// Swept discs catch even a complete crossing in one long frame. Existing overlap
// may separate, but cannot get deeper. Heights keep boats and bridge walkers apart.
export function sweepPeople(from,to,others,radius=crowdConfig.radius,gap=crowdConfig.personalGap){
 const dx=to.x-from.x,dz=to.z-from.z,a=dx*dx+dz*dz;if(a<1e-12)return 1;
 let fraction=1;
 for(const b of others){if(b===from||b.active===false||!Number.isFinite(b.x)||!sameFloor(from,b))continue;
  const x=from.x-b.x,z=from.z-b.z,r=radius+(b.radius??crowdConfig.radius)+gap,c=x*x+z*z-r*r,dot=x*dx+z*dz;
  if(c<=0){if(dot<0)fraction=0;continue;}if(dot>=0)continue;
  const discriminant=dot*dot-a*c;if(discriminant<0)continue;
  const hit=(-dot-Math.sqrt(discriminant))/a;if(hit>=0&&hit<=fraction)fraction=Math.max(0,hit-.002/Math.sqrt(a));
 }
 return fraction;
}
export function stopAtPeople(from,to,others,radius=.32){if(from.mode!=='walk')return to;const f=sweepPeople(from,to,others,radius);return f===1?to:{...from,x:from.x+(to.x-from.x)*f,z:from.z+(to.z-from.z)*f,height:from.height+(to.height-from.height)*f};}
const routePose=(p,d=p.distance,offset=p.offset)=>{const q=sampleRoute(p.route,d);offset+=Math.sin(d*.19+(p.phase??0))*.18;q.x+=Math.cos(q.angle)*offset;q.z-=Math.sin(q.angle)*offset;q.y=streetHeight(q.x,q.z);q.layer=crowdLayer(q);return q;};
export function initializeCrowd(people,world,rand,stationary=[]){
 const placed=[...stationary,...people.filter(p=>!p.route&&p.role!=='骑马人'&&p.role!=='乘客'&&p.role!=='船夫')];
 people.forEach((p,i)=>{p.id=`street-${String(i).padStart(3,'0')}`;p.radius=p.radius??crowdConfig.radius;if(!p.route||p.active===false)return;
  p.offset=(rand()-.5)*2*crowdConfig.laneVariation;p.speed=rand()<.22?1.35+rand()*.5:.45+rand()*.55;p.nextPause=8+rand()*45;p.pauseUntil=0;p.waiting=0;
  let found=false;
  for(let attempt=0;attempt<240;attempt++){
   p.distance=rand()*p.route.length;const q=routePose(p);
   if(q.layer==='ground'&&blocked(q.x,q.z,world,p.radius))continue;
   if(placed.some(b=>sameFloor(q,b)&&Math.hypot(q.x-b.x,q.z-b.z)<p.radius+(b.radius??crowdConfig.radius)+crowdConfig.spawnGap+(p.assetId===b.assetId?crowdConfig.sameAssetGap:0)))continue;
   Object.assign(p,q);p.angle=q.angle;found=true;placed.push(p);break;
  }if(!found)p.active=false;
 });
}
export function advanceCrowd(people,world,dt,time,external=[],rand=Math.random){
 dt=Math.min(Math.max(dt,0),crowdConfig.maxCatchup);const steps=Math.max(1,Math.ceil(dt/crowdConfig.maxStep)),h=dt/steps;
 const start=new Map(people.filter(p=>p.route&&p.active!==false).map(p=>[p,{x:p.x,z:p.z}]));
 let plansRemaining=crowdConfig.plansPerUpdate;
 for(let step=0;step<steps;step++)for(const p of people){
  if(!p.route||p.active===false)continue;
  if(time>=p.nextPause){p.pauseUntil=time+1.2+rand()*3.6;p.nextPause=p.pauseUntil+17+rand()*57;}
  if(time<p.pauseUntil)continue;
  const others=[...people.filter(b=>b!==p&&b.active!==false&&!['乘客','船夫','骑马人','赶牛人','车夫'].includes(b.role)),...external];
  if(p.detour){
   const target=p.detour.points[0],dx=target.x-p.x,dz=target.z-p.z,distance=Math.hypot(dx,dz),fraction=Math.min(1,p.speed*h/Math.max(distance,1e-6));
   const next={x:p.x+dx*fraction,z:p.z+dz*fraction};next.y=streetHeight(next.x,next.z);next.layer=crowdLayer(next);
   const g=moveActor({x:p.x,z:p.z,height:p.y,layer:p.layer,mode:'walk'},next.x-p.x,next.z-p.z,world);
   if(sweepPeople(p,next,others,p.radius)===1&&g.mode==='walk'&&Math.hypot(g.x-next.x,g.z-next.z)<.015){Object.assign(p,next,{x:g.x,z:g.z,y:g.height,layer:g.layer});p.angle=Math.atan2(dx,dz);p.waiting=0;if(fraction===1)p.detour.points.shift();if(!p.detour.points.length){p.distance=p.detour.distance;p.offset=p.detour.offset;p.detour=null;}}
   else {p.waiting+=h;if(p.waiting>crowdConfig.detourAfter){
    // Replan from attained route progress, not the abandoned detour's origin.
    let closest=Infinity,resume=p.distance;const end=p.detour.distance,direction=Math.sign(end-p.distance)||1;
    for(let d=p.distance;direction*(end-d)>=0;d+=direction*.2){const q=sampleRoute(p.route,d),error=Math.hypot(q.x-p.x,q.z-p.z);if(error<closest){closest=error;resume=d;}}
    p.distance=resume;p.detour=null;p.nextDetour=time+.2;
   }}
   continue;
  }
  const next=routePose(p,p.distance+p.speed*h),desiredDistance=Math.hypot(next.x-p.x,next.z-p.z),reach=Math.min(1,p.speed*h/Math.max(1e-6,desiredDistance));
  // A route corner may change its lateral offset abruptly; walk through it at
  // the resident's speed instead of snapping across the corner in one frame.
  if(reach<1){next.x=p.x+(next.x-p.x)*reach;next.z=p.z+(next.z-p.z)*reach;next.y=streetHeight(next.x,next.z);next.layer=crowdLayer(next);}
  const f=sweepPeople(p,next,others,p.radius);
  // A faster walker waits behind an identical model instead of forming a clone pair.
  const cloneAhead=others.some(b=>p.assetId&&p.assetId===b.assetId&&sameFloor(p,b)&&Math.cos((b.angle??next.angle)-next.angle)>.5&&(b.x-p.x)*Math.sin(next.angle)+(b.z-p.z)*Math.cos(next.angle)>0&&Math.hypot(next.x-b.x,next.z-b.z)<crowdConfig.sameAssetGap);
  let accepted=false;
  const laneWidth=Math.abs(next.z)<18?world.bridge.halfWidth-crowdConfig.radius-.12:crowdConfig.detourStreetWidth;
  if(f>=.999&&!cloneAhead&&Math.abs(next.x)<=Math.max(laneWidth,Math.abs(p.x))){const ground=moveActor({x:p.x,z:p.z,height:p.y,layer:p.layer,mode:'walk'},next.x-p.x,next.z-p.z,world);if(ground.mode==='walk'&&Math.hypot(ground.x-next.x,ground.z-next.z)<.015){Object.assign(p,next,{x:ground.x,z:ground.z,y:ground.height,layer:ground.layer});p.distance+=p.speed*h*reach;accepted=true;}}
  if(!accepted){
   p.waiting+=h;
   if(plansRemaining&&p.waiting>crowdConfig.detourAfter&&time>=(p.nextDetour??0)){
    plansRemaining--;
    p.nextDetour=time+crowdConfig.detourRetry+(p.phase??0)%1;
    p.detour=findCrowdDetour(p,world,others,{pose:routePose,sweep:sweepPeople,config:crowdConfig});
    if(!p.detour)p.detour=findCrowdDetour(p,world,others,{pose:routePose,sweep:sweepPeople,config:crowdConfig,retreat:true});
    if(p.detour)continue;
   }
  }else p.waiting=0;
 }
 for(const [p,s] of start){const dx=p.x-s.x,dz=p.z-s.z;p.travelSpeed=dt?Math.hypot(dx,dz)/dt:0;p.walking=p.travelSpeed>.025;
  // Rejoining a route may still be a lateral/backward step relative to its tangent.
  // The displayed heading follows the accepted displacement, including retreats.
  if(p.walking)p.angle=Math.atan2(dx,dz);
 }
}
