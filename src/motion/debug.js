import * as THREE from 'three';
import {supportAt,bridgeHeight} from '../world.js';
import {motionConfig as config} from './config.js';
export function createMotionDebug(scene,world,getActor){
 const root=new THREE.Group();root.name='Movement collision and support debug';scene.add(root);
 function line(points,color){const l=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))),new THREE.LineBasicMaterial({color,depthTest:false,transparent:true,opacity:.65}));root.add(l);return l}
 for(const c of world.colliders){const mesh=new THREE.Box3Helper(new THREE.Box3(new THREE.Vector3(c.x-c.w/2,.94,c.z-c.d/2),new THREE.Vector3(c.x+c.w/2,Math.max(1.5,c.h??2)+.94,c.z+c.d/2)),0xe0a76b);root.add(mesh)}
 for(const side of [-1,1]){const points=[];for(let z=-18;z<=18;z+=.5)points.push([side*(world.bridge.halfWidth-config.bridgeRailInset),bridgeHeight(z,world.bridge)+.1,z]);line(points,0xff5577)}
 for(const x of [-2,0,2]){const points=[];for(let z=-18;z<=18;z+=.5)points.push([x,bridgeHeight(z,world.bridge),z]);line(points,0x49d9ac)}
 const ring=new THREE.Mesh(new THREE.RingGeometry(config.radius-.015,config.radius,32),new THREE.MeshBasicMaterial({color:0x49d9ac,side:THREE.DoubleSide,depthTest:false}));ring.rotation.x=-Math.PI/2;root.add(ring);
 const probe=line([[0,0,0],[0,1,0]],0xfbe878);
 const panel=document.createElement('aside');panel.id='motion-debug';Object.assign(panel.style,{position:'fixed',left:'16px',bottom:'80px',padding:'12px',maxWidth:'320px',background:'#162b2bea',color:'#fff',font:'12px monospace',zIndex:45});
 const button=document.createElement('button');Object.assign(button.style,{background:'#234a43',color:'#fff',border:'1px solid #70aa96',padding:'6px 10px'});button.textContent='隐藏碰撞/地面';button.onclick=()=>{root.visible=!root.visible;button.textContent=root.visible?'隐藏碰撞/地面':'显示碰撞/地面'};const text=document.createElement('pre');text.style.whiteSpace='pre-wrap';panel.append(button,text);document.body.append(panel);
 let state;
 function update(){panel.hidden=!document.body.classList.contains('playing');const actor=getActor(),support=supportAt(actor.x,actor.z,world,actor.layer);ring.position.set(actor.x,actor.height+.045,actor.z);probe.geometry.setFromPoints([new THREE.Vector3(actor.x,actor.height+config.maxStepUp,actor.z),new THREE.Vector3(actor.x,actor.height-config.maxSnapDown,actor.z)]);state={actor,support,config,visible:root.visible};text.textContent=`${actor.mode} / ${actor.layer} / ${support?.source??'无支撑'}\n位置 ${actor.x.toFixed(2)}, ${actor.height.toFixed(2)}, ${actor.z.toFixed(2)}\n半径 ${config.radius} · 子步 ${config.substep}\n台阶≤${config.maxStepUp} · 下贴≤${config.maxSnapDown}\n坡度≤${config.maxSlope}（高/水平距）\n金色：原障碍代理；红色：桥栏边界\n绿色：可行走桥面；黄线：贴地范围`}
 update();return {update,getState:()=>state};
}
