// Deterministic, seekable tracks: wall-clock advancement is owned by the renderer adapter.
export const BOUNDARIES=Object.freeze([0,3,5,8,10,14,17,20,27,30]);
export const PLACEMENT=Object.freeze({approach:[14,0,0],hold:[10.3,0,0],waiting:[11,0,0],passed:[-16,0,0],mastPivot:[-5,2.85,0],mastLength:7,loweredAngle:87*Math.PI/180});
export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
export const lerp=(a,b,t)=>a+(b-a)*t;
export function sampleIntro(time){
 const t=clamp(time,0,30),shot=Math.min(8,BOUNDARIES.findIndex((v,i)=>i>0&&t<v)-1<0?8:BOUNDARIES.findIndex((v,i)=>i>0&&t<v)-1);
 const shipX=t<3?lerp(14,10.3,smooth(t/3)):t<21?10.3:lerp(10.3,11,smooth((t-21)/5));
 return {time:t,shot,shipYaw:.04*(1-smooth((t-5)/3)),flashback:t>=10&&t<14,shipX,mastAngle:PLACEMENT.loweredAngle*smooth((t-21)/4),brace:1-smooth((t-25)/2),towSlack:smooth((t-20)/1),ropes:[17.3,18.1].map(start=>({deployed:clamp((t-start)/1.3)*(1-smooth((t-25)/2)),thrown:t>=start&&t<27})),done:t>=30};
}
export function sampleEnding(time){const t=clamp(time,0,20);return {time:t,shipX:lerp(11,-16,smooth((t-3)/9)),mastAngle:PLACEMENT.loweredAngle,cloth:true,done:t>=20};}
export function sampleRole(keys,phase){let a=keys[0],b=keys.at(-1);for(let i=1;i<keys.length;i++)if(phase<=keys[i][0]){a=keys[i-1];b=keys[i];break;}const t=smooth((phase-a[0])/(b[0]-a[0]||1));return a.slice(1).map((v,i)=>lerp(v,b[i+1],t));}
export function finalPose(state){return {shipX:state.shipState==='passed'?-16:11,mastAngle:PLACEMENT.loweredAngle,cloth:state.shipState==='passed',brace:0,towSlack:1,ropes:[{deployed:0},{deployed:0}]};}
