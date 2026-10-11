import * as THREE from 'three';
// The four material scans share an atlas. Sampling stays inside each quadrant,
// so wrapping never leaks a neighboring material into roof or ground surfaces.
export async function loadSurfaces(renderer){
 const loader=new THREE.TextureLoader(),root=import.meta.env.BASE_URL+'assets/textures/';
 const atlas=await loader.loadAsync(root+'song-material-atlas.png');
 atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);
 const plaster=await Promise.all(['Color','NormalGL','Roughness'].map(t=>loader.loadAsync(`${root}Plaster007_1K-JPG_${t}.jpg`)));
 plaster.forEach((t,i)=>{t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(.28,.28);t.anisotropy=8;if(!i)t.colorSpace=THREE.SRGBColorSpace;});
 function apply(m){
  if(!m.userData.hasUV)return;
  const key=m.name.replace(/^QM_/,'').replace(/\.\d+$/,'');
  if(key.startsWith('plaster')){Object.assign(m,{map:plaster[0],normalMap:plaster[1],roughnessMap:plaster[2],normalScale:new THREE.Vector2(.22,.22)});m.color.set('#c6bba4');m.roughness=.95;return;}
  let quadrant,scale,gray=false,bump;
  if(key.startsWith('tile')){quadrant=[0,.5];scale=.85;bump=.045;m.color.set(['#c2c9c7','#c6cbca','#bdc4c3','#c7cbca'][Number(key.slice(-1))]||'#c2c9c7');m.roughness=.92;}
  else if(key.startsWith('wood')){quadrant=[.5,.5];scale=.75;bump=.035;m.color.set(key==='wood_dark'?'#76634c':key==='wood_light'?'#dac097':'#b09a78');m.roughness=.86;}
  else if(/^(ground|path)$/.test(key)){quadrant=[0,0];scale=.28;bump=.025;m.color.set(key==='path'?'#c3baa9':'#b0a68f');m.roughness=1;}
  else if(/cloth|robe|indigo/.test(key)){quadrant=[.5,0];scale=5;gray=true;bump=.0015;m.roughness=.98;}
  else return;
  m.map=atlas;m.normalMap=null;m.roughnessMap=null;
  const ground=/^(ground|path)$/.test(key);
  m.onBeforeCompile=s=>{
   s.vertexShader='varying vec3 vSurface;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvec4 sp=vec4(transformed,1.);\n#ifdef USE_INSTANCING\nsp=instanceMatrix*sp;\n#endif\nvSurface=(modelMatrix*sp).xyz;');
   s.fragmentShader='varying vec3 vSurface;\nvec2 atlasUv(vec2 p){return vec2('+quadrant.join(',')+')+vec2(.001)+abs(fract(p*.5)*2.-1.)*.498;}\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec2 materialUv=vMapUv*${scale.toFixed(3)};vec4 texelColor=texture2D(map,atlasUv(materialUv));
    ${ground?'texelColor=mix(texelColor,texture2D(map,atlasUv(materialUv*.43+vec2(.27,.13))),.45);':''}
    ${gray?'texelColor.rgb=vec3(.74+clamp(dot(texelColor.rgb,vec3(.2126,.7152,.0722))*4.,0.,.24));':''}
    float surfaceHeight=dot(texelColor.rgb,vec3(.2126,.7152,.0722));
    diffuseColor*=texelColor;
    ${ground?'float broad=.94+.055*sin(vSurface.x*.23+sin(vSurface.z*.17)*2.5)+.025*sin(vSurface.z*.63+vSurface.x*.19);diffuseColor.rgb*=broad;':''}`);
   s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>\nvec3 dx=dFdx(-vViewPosition),dy=dFdy(-vViewPosition);vec3 rx=cross(dy,normal),ry=cross(normal,dx);float det=dot(dx,rx);vec3 grad=sign(det)*(dFdx(surfaceHeight)*rx+dFdy(surfaceHeight)*ry);normal=normalize(abs(det)*normal-${bump.toFixed(3)}*grad);`);
  };
  m.customProgramCacheKey=()=>`song-atlas-${key}`;m.needsUpdate=true;
 }
 return {apply,loaded:['song-roof','song-timber','song-earth','song-linen','plaster']};
}
