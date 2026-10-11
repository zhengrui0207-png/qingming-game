import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';

// Meter-scale traveling waves. The same time and height functions drive the
// vertex surface, its normals and buoyancy, so motion is visible from all angles.
function noise2(x,y){
 const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);};
 const i=Math.floor(x),j=Math.floor(y);let u=x-i,v=y-j;u=u*u*(3-2*u);v=v*v*(3-2*v);
 return (hash(i,j)*(1-u)+hash(i+1,j)*u)*(1-v)+(hash(i,j+1)*(1-u)+hash(i+1,j+1)*u)*v;
}
export function riverHeight(x,z,t){
 const warp=noise2(x*.38-t*.12,z*.38)*2.8;
 return .05+.027*Math.sin(x*1.9+z*.72-t*2.8+warp)+.014*Math.sin(x*4.2-z*2.1-t*4.9+warp*.7)+.007*Math.sin(x*7.6+z*4.3-t*7.3);
}
const waves=`
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float wave(vec2 p){float warp=noise(p*.38-vec2(time*.12,0.))*2.8;return .027*sin(p.x*1.9+p.y*.72-time*2.8+warp)+.014*sin(p.x*4.2-p.y*2.1-time*4.9+warp*.7)+.007*sin(p.x*7.6+p.y*4.3-time*7.3);}
`;
export function createRiver(scene,sun){
 const water=new Water(new THREE.PlaneGeometry(190,32,380,80),{textureWidth:1024,textureHeight:512,waterColor:0x315f60,sunColor:0xffedcc,sunDirection:sun.position.clone().normalize(),fog:true});
 water.position.y=.05;water.rotation.x=-Math.PI/2;water.material.name='Bian River · flowing surface';
 const u=water.material.uniforms;u.uBoat={value:new THREE.Vector4(32,7,Math.PI/2,0)};u.uSwim={value:new THREE.Vector4(0,0,0,0)};
 water.material.vertexShader=`
 uniform mat4 textureMatrix;uniform float time;varying vec4 mirrorCoord;varying vec4 worldPosition;
 #include <common>
 #include <fog_pars_vertex>
 #include <shadowmap_pars_vertex>
 #include <logdepthbuf_pars_vertex>
 ${waves}
 void main(){vec3 displaced=position;vec2 riverP=(modelMatrix*vec4(position,1.)).xz;displaced.z+=wave(riverP);
 worldPosition=modelMatrix*vec4(displaced,1.);mirrorCoord=textureMatrix*worldPosition;
 vec4 mvPosition=modelViewMatrix*vec4(displaced,1.);gl_Position=projectionMatrix*mvPosition;
 #include <beginnormal_vertex>
 #include <defaultnormal_vertex>
 #include <logdepthbuf_vertex>
 #include <fog_vertex>
 #include <shadowmap_vertex>
 }`;
 water.material.fragmentShader=`
 uniform sampler2D mirrorSampler;uniform float time;uniform vec3 eye;uniform vec3 sunDirection;uniform vec3 sunColor;
 uniform vec4 uBoat;uniform vec4 uSwim;varying vec4 mirrorCoord;varying vec4 worldPosition;
 #include <common>
 #include <packing>
 #include <bsdfs>
 #include <fog_pars_fragment>
 #include <logdepthbuf_pars_fragment>
 #include <lights_pars_begin>
 #include <shadowmap_pars_fragment>
 #include <shadowmask_pars_fragment>
 ${waves}
 void main(){
 #include <logdepthbuf_fragment>
 vec2 p=worldPosition.xz;vec2 flowing=p-vec2(time*.92,time*.025);
 float dx=(wave(p+vec2(.028,0))-wave(p-vec2(.028,0)))/.056;
 float dz=(wave(p+vec2(0,.028))-wave(p-vec2(0,.028)))/.056;
 float fine=noise(flowing*6.)-noise(flowing*6.+vec2(.06,0.));
 float microX=(noise(flowing*5.+vec2(.10,0.))-noise(flowing*5.-vec2(.10,0.)))*.48;
 float microZ=(noise(flowing*5.+vec2(0.,.10))-noise(flowing*5.-vec2(0.,.10)))*.48;
 vec3 n=normalize(vec3(-dx*.55+microX,1.,-dz*.55+microZ));
 vec3 v=normalize(eye-worldPosition.xyz);float fresnel=.10+.65*pow(1.-max(dot(v,n),0.),4.);
 vec2 reflectionUV=mirrorCoord.xy/mirrorCoord.w+n.xz*.046;
 vec3 reflected=texture2D(mirrorSampler,reflectionUV).rgb;
 float depth=(1.-smoothstep(10.5,14.0,abs(p.y)));
 float swirls=noise(flowing*.24)*.6+noise(flowing*.72)*.25+noise(flowing*2.)*.15;
 vec3 deep=vec3(.065,.115,.111),shallow=vec3(.115,.135,.095);
 vec3 body=mix(shallow,deep,depth)*( .8+swirls*.34 );
 float light=.75+max(dot(n,normalize(sunDirection)),0.)*.32;
 vec3 color=mix(body*light,reflected*.86,fresnel);
 vec3 halfV=normalize(normalize(sunDirection)+v);
 float sparkle=pow(max(dot(n,halfV),0.),180.)*.85;
 color+=sunColor*sparkle;
 // Fragmented current crests advect across the river in +X, rather than oscillating in place.
 float streak=pow(max(0.,sin(flowing.y*8.+noise(flowing*.55)*9.+flowing.x*.32)),20.);
 streak*=smoothstep(.58,.88,noise(flowing*vec2(1.1,2.3)));
 color+=vec3(.22,.31,.29)*streak*.055;
 float bank=(1.-smoothstep(0.,.65,abs(abs(p.y)-15.5)))*smoothstep(.42,.75,noise(flowing*vec2(2.,6.)));
 color=mix(color,vec3(.42,.49,.39),bank*.35);
 vec2 f=vec2(sin(uBoat.z),cos(uBoat.z)),delta=p-uBoat.xy;
 float behind=-dot(delta,f)-1.1,across=abs(dot(delta,vec2(f.y,-f.x)));
 float wake=exp(-pow((across-(.8+max(behind,0.)*.34))/.14,2.))*step(0.,behind)*exp(-max(behind,0.)*.15)*min(abs(uBoat.w)/3.,1.);
 wake*=.6+.4*sin(behind*6.-time*9.);
 vec2 sd=p-uSwim.xy;float sr=length(sd);float swim=(.5+.5*sin(sr*15.-time*8.))*exp(-sr*1.4)*uSwim.w;
 color=mix(color,vec3(.56,.67,.59),clamp(wake*.8+swim*.17,0.,.75));
 color*=.48+.52*getShadowMask();
 gl_FragColor=vec4(color,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 #include <fog_fragment>
 }`;
 scene.add(water);
 // Planar reflection is refreshed at 30 Hz; wave shading and buoyancy still run every frame.
 const drawReflection=water.onBeforeRender;let reflectedAt=-1;
 water.onBeforeRender=function(...args){if(u.time.value-reflectedAt<1/30)return;reflectedAt=u.time.value;drawReflection.apply(this,args);};
 // Streaks provide clear, stable visual cues for current direction even from the bridge.
 let seed=77;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const flowData=Array.from({length:65},()=>({x:rand()*184-92,z:rand()*29-14.5,length:.35+rand()*1.4,width:.035+rand()*.085,speed:.65+rand()*.55,phase:rand()*6.28}));
 const flowMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;void main(){vec2 p=vUv*2.-1.;float a=exp(-p.y*p.y*8.)*pow(max(0.,1.-p.x*p.x),2.)*.10;gl_FragColor=vec4(.65,.77,.71,a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const flowMesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),flowMaterial,flowData.length);flowMesh.frustumCulled=false;flowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(flowMesh);
 const dummy=new THREE.Object3D();dummy.rotation.x=-Math.PI/2;
 // Persistent wakes remain in world space, spread and fade after the craft passes.
 const wakeCount=180,history=[];let lastWake=-1;
 const wakeGeo=new THREE.PlaneGeometry(1,1);wakeGeo.setAttribute('wakeAlpha',new THREE.InstancedBufferAttribute(new Float32Array(wakeCount),1));
 const wakeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'attribute float wakeAlpha;varying float a;varying vec2 vUv;void main(){a=wakeAlpha;vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}',fragmentShader:'varying float a;varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float ring=exp(-pow((r-.66)/.09,2.));float broken=.5+.5*sin(atan(p.y,p.x)*13.+r*20.);gl_FragColor=vec4(.66,.8,.75,ring*a*(.4+broken*.6));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
 const wakes=new THREE.InstancedMesh(wakeGeo,wakeMat,wakeCount);wakes.frustumCulled=false;wakes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scene.add(wakes);
 function update(t,dt,boat,actor,boatMode,moving,ferries=[]){
  u.time.value=t;u.uBoat.value.set(boat.x,boat.z,boat.angle,boatMode?boat.speed:0);u.uSwim.value.set(actor.x,actor.z,0,actor.mode==='swim'&&!boatMode?1:0);
  flowData.forEach((p,i)=>{const x=((p.x+t*p.speed+92)%184)-92;dummy.position.set(x,riverHeight(x,p.z,t)+.01,p.z+Math.sin(t*.2+p.phase)*.08);dummy.rotation.set(-Math.PI/2,0,.035*Math.sin(t*.1+p.phase));dummy.scale.set(p.length,p.width,1);dummy.updateMatrix();flowMesh.setMatrixAt(i,dummy.matrix);});flowMesh.instanceMatrix.needsUpdate=true;
  if(moving&&(boatMode||actor.mode==='swim')&&t-lastWake>.14){const a=boatMode?boat.angle:0;history.push({x:actor.x-(boatMode?Math.sin(a)*1.6:0),z:actor.z-(boatMode?Math.cos(a)*1.6:0),t,boat:boatMode});if(history.length>wakeCount)history.shift();lastWake=t;}
  if(Math.floor(t*5)!==Math.floor((t-dt)*5))for(const f of ferries){if(f.speed>.1)history.push({x:f.x-Math.sin(f.angle)*3.4,z:f.z-Math.cos(f.angle)*3.4,t,boat:true});}while(history.length>wakeCount)history.shift();
  const alpha=wakeGeo.attributes.wakeAlpha;
  for(let i=0;i<wakeCount;i++){const p=history[i];const age=p?t-p.t:100;alpha.setX(i,age<5?(1-age/5)*(p.boat?.065:.09):0);if(p&&age<5){const scale=(p.boat?.8:.45)+age*.8;dummy.position.set(p.x+age*.17,.14,p.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(scale*1.5,scale,1);}else dummy.scale.setScalar(0);dummy.updateMatrix();wakes.setMatrixAt(i,dummy.matrix);}alpha.needsUpdate=true;wakes.instanceMatrix.needsUpdate=true;
 }
 return {water,update,height:riverHeight,getState:()=>({time:u.time.value,currentDirection:'+X',currentSpeed:.92,wakeCount:history.length,displacedVertices:water.geometry.attributes.position.count,version:4,reflection:'planar',microRipples:true})};
}
