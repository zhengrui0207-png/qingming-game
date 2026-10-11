import * as THREE from 'three';
import { makeHistorySites, nearestHistorySite, sourcesFor } from './history.js';
import {nearestHistoryPerson} from './people-history.js';
import {historyExcerpts} from './history-excerpts.js';
import {segmentBlocked} from './interaction/core.js';
export function createStorefronts(scene,world,{registry,getPeople=()=>[],onOpen=()=>{},onClose=()=>{}}={}){
 const signs=[];
 for(const s of world.shops){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');
  const dark=s.type==='wine'||s.type==='herb';ctx.fillStyle=dark?'#392c22':'#cfb88b';ctx.fillRect(0,0,1024,256);ctx.strokeStyle=dark?'#b59559':'#5c4a32';ctx.lineWidth=16;ctx.strokeRect(14,14,996,228);
  ctx.fillStyle=dark?'#f0dcae':'#292f24';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 133px "Songti SC", "Noto Serif SC", serif';ctx.fillText(s.name,512,132,940);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const board=new THREE.Mesh(new THREE.BoxGeometry(Math.min(s.w*.75,4.1),.97,.09),new THREE.MeshStandardMaterial({map:tex,roughness:.92}));board.position.set(s.sign.x,s.sign.y,s.sign.z);board.rotation.y=s.yaw;scene.add(board);signs.push(board);
 }
 // Warm vapour rises only from food stalls and tea furnaces.
 const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d');const g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,249,228,.65)');g.addColorStop(1,'rgba(255,249,228,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);
 const vaporTexture=new THREE.CanvasTexture(c),steam=[];
 for(const s of world.shops.filter(s=>s.featured&&['tea','food'].includes(s.type)))for(let i=0;i<5;i++){
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:vaporTexture,transparent:true,opacity:.15,depthWrite:false}));scene.add(sprite);steam.push({s,i,sprite});
 }
 const authoredSites=makeHistorySites(world);
 // Legacy automatic adapter retains the exact footprint, hysteresis and F reader.
 for(const site of authoredSites)registry?.register({id:'landmark_'+site.history.key,type:'landmark',anchor:{position:[site.x,.94,site.z],layer:site.history.key==='bridge'?'bridge':'ground'},radius:4.8,enabled:true,trigger:'automatic',legacySite:site,action:()=>openDetails()});
 const sites=registry?registry.entries().filter(e=>e.type==='landmark').map(e=>e.legacySite):authoredSites;
 const card=document.createElement('aside');card.id='shop-card';card.hidden=true;card.setAttribute('aria-label','附近地标或人物的历史介绍');
 card.innerHTML=`<button id="close-shop-card" aria-label="收起历史介绍" title="收起历史介绍">×</button><small id="shop-type"></small><h3 id="shop-name"></h3><p id="shop-wares"></p>
 <section class="history-peek"><span id="history-first-label">建筑</span><h4 id="history-architecture-title"></h4><p id="history-architecture"></p></section>
 <section class="history-peek" id="history-second-peek"><span id="history-second-label">风俗</span><h4 id="history-culture-title"></h4><p id="shop-story"></p></section>
 <div class="history-peek-foot"><span>依据古籍与博物馆资料</span><button id="read-history">展开阅读 <kbd>F</kbd></button></div>`;
 document.getElementById('hud').append(card);
 // Identify the selected street resident in a crowd; quest NPCs already have nameplates.
 const personCanvas=document.createElement('canvas');personCanvas.width=384;personCanvas.height=96;
 const personTexture=new THREE.CanvasTexture(personCanvas);personTexture.colorSpace=THREE.SRGBColorSpace;
 const personLabel=new THREE.Sprite(new THREE.SpriteMaterial({map:personTexture,depthTest:true}));personLabel.visible=false;personLabel.scale.set(1.8,.45,1);scene.add(personLabel);
 let labelKey=null;
 const dialog=document.createElement('dialog');dialog.id='history-dialog';dialog.setAttribute('aria-labelledby','history-title');
 dialog.innerHTML=`<button class="close" id="close-history" aria-label="关闭历史介绍">×</button><span class="eyebrow">汴京风物志</span><h2 id="history-title"></h2><p id="history-look"></p><div id="history-reading"></div><section class="history-sources"><h3>原文与出处</h3><ol id="history-source-list"></ol></section><button id="continue-history" class="primary">回到街市</button>`;
 document.body.append(dialog);
 let nearby=null,renderedKey=null,openedKey=null,dismissedKey=null;
 document.getElementById('close-shop-card').onclick=()=>{dismissedKey=nearby?.history.key;card.hidden=true;};
 const set=(id,value)=>document.getElementById(id).textContent=value;
 function fillCard(entry){
  card.dataset.kind=entry.kind??'landmark';
  set('history-first-label',entry.peekLabels?.[0]??'建筑');set('history-second-label',entry.peekLabels?.[1]??'风俗');
  document.getElementById('history-second-peek').hidden=entry.kind==='person';
  set('shop-type',entry.category);set('shop-name',entry.shortName??entry.name);set('shop-wares',entry.look);
  set('history-architecture-title',entry.architecture.title);set('history-architecture',entry.architecture.text);
  set('history-culture-title',entry.culture.title);set('shop-story',entry.culture.text);
 }
 function openDetails(){
  if(!nearby||dialog.open)return;const entry=nearby.history,refs=sourcesFor(entry);openedKey=entry.key;
  set('history-title',entry.name);set('history-look',entry.look);
  const reading=document.getElementById('history-reading');reading.replaceChildren();
  for(const [label,f] of [[entry.readingLabels?.[0]??'看建筑',entry.architecture],[entry.readingLabels?.[1]??'读风俗',entry.culture]]){
   const section=document.createElement('section'),tag=document.createElement('span'),title=document.createElement('h3'),p=document.createElement('p'),more=document.createElement('p'),citations=document.createElement('div');
   tag.className='reading-label';tag.textContent=label;title.textContent=f.title;p.textContent=f.text;more.textContent=f.more;citations.className='history-citations';
   for(const id of f.sources){const n=refs.findIndex(r=>r.id===id);const citation=document.createElement('span');citation.textContent='['+(n+1)+'] '+refs[n].title;citations.append(citation);}
   section.append(tag,title,p);if(f.more!==f.text)section.append(more);section.append(citations);reading.append(section);
  }
  const list=document.getElementById('history-source-list');list.replaceChildren();
  for(const ref of refs){
   const li=document.createElement('li'),title=document.createElement('span'),small=document.createElement('small');
   title.className='history-source-title';title.textContent=ref.title;small.textContent=ref.kind;li.append(title,small);
   for(const excerpt of historyExcerpts[ref.id]??[]){const quote=document.createElement('blockquote');quote.textContent=excerpt;li.append(quote);}
   list.append(li);
  }
  onOpen();dialog.showModal();dialog.scrollTop=0;
 }
 function closeDetails(){if(!dialog.open)return;dialog.close();openedKey=null;onClose();}
 document.getElementById('read-history').onclick=openDetails;document.getElementById('close-history').onclick=closeDetails;document.getElementById('continue-history').onclick=closeDetails;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeDetails();});
 return {
  openDetails,closeDetails,isOpen:()=>dialog.open,
  update(t,actor,playing){
   for(const {s,i,sprite} of steam){const age=(t*.35+i*.2)%1;sprite.position.set(s.front.x+Math.sin(t*.6+i)*age*.18,2.03+age*1.6,s.front.z+Math.cos(i)*.15);sprite.scale.setScalar(.18+age*.5);sprite.material.opacity=Math.sin(age*Math.PI)*.16;}
   const person=nearestHistoryPerson(actor,getPeople(),nearby,(a,p)=>!segmentBlocked({x:a.x,y:a.height,z:a.z},p,world.colliders));
   personLabel.visible=!!(playing&&person?.id.startsWith('street-'));
   if(personLabel.visible){
    personLabel.position.set(person.x,person.y+2.65,person.z);
    if(labelKey!==person.history.key){labelKey=person.history.key;const ctx=personCanvas.getContext('2d');ctx.clearRect(0,0,384,96);ctx.fillStyle='#173330ed';ctx.fillRect(0,0,384,96);ctx.fillStyle='#f5e5bd';ctx.textAlign='center';ctx.font='bold 42px serif';ctx.fillText(person.history.name.split(' · ')[0]+' · 图志',192,62);personTexture.needsUpdate=true;}
   }
   nearby=person??nearestHistorySite(actor,sites,nearby);if(!nearby||nearby.history.key!==dismissedKey)dismissedKey=null;card.hidden=!playing||!nearby||nearby.history.key===dismissedKey;
   if(nearby&&nearby.history.key!==renderedKey){renderedKey=nearby.history.key;fillCard(nearby.history);}
  },getState:()=>({signs:signs.length,nearby:nearby?.history.name,historyKey:nearby?.history.key,historySites:sites.length,people:getPeople().map(p=>({id:p.id,assetId:p.assetId,x:p.x,y:p.y??.94,z:p.z,layer:p.layer??'ground'})),reading:dialog.open,openedKey,sourceCount:nearby?sourcesFor(nearby.history).length:0,steamSources:steam.length/5})
 };
}
