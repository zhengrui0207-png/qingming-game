// Distance-based closed routes keep motion independent of frame rate.
export function makeRoute(points){
 const segments=points.map((a,i)=>{const b=points[(i+1)%points.length];return {a,b,length:Math.hypot(b[0]-a[0],b[1]-a[1])};});
 return {segments,length:segments.reduce((s,p)=>s+p.length,0)};
}
export function sampleRoute(route,distance){
 let d=((distance%route.length)+route.length)%route.length;
 for(const s of route.segments){if(d<=s.length){const t=s.length?d/s.length:0;return {x:s.a[0]+(s.b[0]-s.a[0])*t,z:s.a[1]+(s.b[1]-s.a[1])*t,angle:Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1])};}d-=s.length;}
 return {x:route.segments[0].a[0],z:route.segments[0].a[1],angle:0};
}
export function streetHeight(x,z){return Math.abs(z)<18&&Math.abs(x)<3.8?.94+7.3*(1-(z/18)**2):.94;}
// A racetrack-shaped ferry circuit: turn radius 3.5m, lower/upper lanes +/-3.5m.
// Its centre and radius keep the moving hull clear of cargo and both docks.
export function ferryPose(t,index=0){
 const radius=3.5,left=index===3?36:-71,right=index===3?72:-1,offset=index===3?-3.9:0,straight=right-left,length=straight*2+Math.PI*radius*2;
 let d=((t*1.05+(index===3?0:index*length/3))%length+length)%length;
 if(d<straight)return {x:left+d,z:5.4+offset,angle:Math.PI/2,speed:1.05};d-=straight;
 if(d<Math.PI*radius){const a=d/radius;return {x:right+radius*Math.sin(a),z:1.9+offset+radius*Math.cos(a),angle:Math.PI/2+a,speed:1.05};}d-=Math.PI*radius;
 if(d<straight)return {x:right-d,z:-1.6+offset,angle:-Math.PI/2,speed:1.05};d-=straight;
 const a=d/radius;return {x:left-radius*Math.sin(a),z:1.9+offset-radius*Math.cos(a),angle:-Math.PI/2+a,speed:1.05};
}

// Heading of the attained displacement, including corners and reverse routes.
export function travelHeading(from,to,fallback=0){const dx=to.x-from.x,dz=to.z-from.z;return Math.hypot(dx,dz)>1e-6?Math.atan2(dx,dz):fallback;}
