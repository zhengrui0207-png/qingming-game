// Preserve ferry route clocks and paths; only offset the rendered/collision pose around the new cargo hull.
export function avoidCargo(pose,hull){
 if(!hull)return pose;
 const s=Math.abs(Math.sin(pose.angle)),c=Math.abs(Math.cos(pose.angle));
 const halfX=s*4+c*1.325,halfZ=c*4+s*1.325,near=hull.w/2+halfX+1,dx=Math.abs(pose.x-hull.x);
 if(dx>=near+14)return pose;
 let weight=Math.min(1,(near+14-dx)/14);weight=weight*weight*(3-2*weight);
 const side=pose.z>=hull.z?1:-1,safe=hull.z+side*(hull.d/2+halfZ+1);
 return {...pose,z:pose.z+(safe-pose.z)*weight};
}
