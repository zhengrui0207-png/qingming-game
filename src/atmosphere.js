import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
// Half-resolution, denoised ambient occlusion gives eaves and cloth folds depth.
// The live color/water pass remains full resolution.
export function createAtmosphere(renderer,scene,camera,river){
 const composer=new EffectComposer(renderer);const renderPass=new RenderPass(scene,camera);composer.addPass(renderPass);
 const ao=new GTAOPass(scene,camera,Math.ceil(innerWidth*.5),Math.ceil(innerHeight*.5));
 ao.updateGtaoMaterial({radius:.55,distanceExponent:1.8,thickness:.12,distanceFallOff:.8,scale:1,samples:16});
 ao.blendIntensity=.55;ao.updatePdMaterial({radius:5,lumaPhi:8,depthPhi:2,normalPhi:3,rings:2,samples:16});
 const setAoSize=ao.setSize.bind(ao);ao.setSize=(w,h)=>setAoSize(Math.ceil(w*.5),Math.ceil(h*.5));
 // Reflections must not render again in the normal/depth prepass; alpha leaves
 // are excluded because the shared override normal material has no alpha map.
 const original=ao.render.bind(ao);ao.render=(...args)=>{const hidden=[];scene.traverse(o=>{if(o.visible&&(o===river.water||o.material?.alphaTest>0||o.material?.isShaderMaterial)){hidden.push(o);o.visible=false;}});try{original(...args);}finally{hidden.forEach(o=>o.visible=true);}};
 composer.addPass(ao);composer.addPass(new OutputPass());
 return {render:(view=camera)=>{renderPass.camera=view;ao.camera=view;composer.render();},resize:()=>composer.setSize(innerWidth,innerHeight),setEnabled:v=>{ao.enabled=v;},getState:()=>({ambientOcclusion:ao.enabled})};
}
