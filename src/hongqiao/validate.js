import {blocked, surfaceAt, moveActor} from '../world.js';
export function validateHongqiao(c, world) {
 const errors=[], need=(ok,msg)=>{if(!ok)errors.push(msg)}, ids=new Set();
 for(const list of [c.anchors,c.assets,c.npcs,c.items,c.instances,c.permissions,c.dialogues,c.stories,c.codex,c.decorations,c.routes]) for(const x of list){const id=x.id??x.storyId;need(id&&!ids.has(id),'重复或缺失 ID: '+id);ids.add(id)}
 const has=(list,id)=>list.some(x=>(x.id??x.storyId)===id), ref=(list,id)=>need(has(list,id),'失效引用: '+id);
 ref(c.assets,c.player.assetId);ref(c.anchors,c.player.anchorId);
 for(const a of c.anchors){need(a.position.length===3&&a.position.every(Number.isFinite),'非法坐标: '+a.id);if(a.kind==='walk'){const [x,y,z]=a.position;need(!blocked(x,z,world),'障碍内锚点: '+a.id);const s=surfaceAt(x,z,world);need(s.mode==='walk'&&Math.abs(y-s.height)<.1,'非法可行走表面: '+a.id)}}
 for(const n of c.npcs){ref(c.assets,n.assetId);ref(c.anchors,n.anchorId);ref(c.stories,n.storyId);need(!!n.name,'NPC 文案为空')}
 for(const i of c.items){ref(c.assets,i.assetId);need(!!i.name&&!!i.description,'物品文案为空')}
 for(const p of c.permissions)ref(c.npcs,p.grantedBy);
 for(const i of c.instances){ref(c.items,i.itemId);ref(c.anchors,i.anchorId);ref(c.permissions,i.permissionId);need(i.quantity===1,'实例数量必须为 1')}
 for(const s of c.stories){ref(c.npcs,s.npcId);need(s.unlockQuestId===c.quest.id,'故事任务失效');need(s.contentVersion===2&&s.sections.length===3&&s.title&&s.summary&&s.contentType&&s.creationLabel&&s.sourceNotes.length,'故事字段缺失');for(const section of s.sections)need(section.id&&section.title&&section.paragraphs.length&&section.paragraphs.every(p=>p.trim()),'故事正文为空')}
 const conditions=new Set(['always','questCompleted','questAccepted','questReady','instanceCollected','hasPermission']),effects=new Set(['grantPermission','acceptQuest','completeQuest']);
 const check=(v,types)=>{need(types.has(v.type),'未知条件/效果: '+v.type);if(v.questId)need(v.questId===c.quest.id,'任务引用失效');if(v.permissionId)ref(c.permissions,v.permissionId);if(v.instanceId)ref(c.instances,v.instanceId)};
 for(const d of c.dialogues){ref(c.npcs,d.npcId);for(const b of d.branches){check(b.when,conditions);need(d.nodes?.[b.node]?.lines?.length,'分支节点失效或空文案: '+b.node)}if(d.confirmEffect)check(d.confirmEffect,effects);for(const choice of d.choices??[])check(choice.effect,effects);need(d.cancelEffects.length===0,'取消不得产生效果')}
 for(const k of c.codex)need(k.title&&k.text&&k.sources.length&&k.sources.every(s=>/^https:\/\//.test(s.url)),'图鉴来源或正文缺失');
 for(const i of c.quest.requiredItems)ref(c.items,i.itemId);for(const id of c.quest.rewardStoryIds)ref(c.stories,id);
 for(const p of c.decorations)need(p.collectible===false&&!has(c.items,p.id),'演出道具不应可拾取');
 for(const id of c.shipRoute.anchorIds)ref(c.anchors,id);
 const routeReports=[];
 for(const r of c.routes){let distance=0;let s={x:r.points[0][0],z:r.points[0][1],layer:'ground',...surfaceAt(...r.points[0],world)};for(const [x,z] of r.points.slice(1)){distance+=Math.hypot(x-s.x,z-s.z);s=moveActor(s,x-s.x,z-s.z,world);need(Math.hypot(x-s.x,z-s.z)<.01&&s.mode==='walk','路线不可步行: '+r.id)}routeReports.push({id:r.id,distance,estimatedSeconds:distance/r.speedForEstimate})}
 return {ok:errors.length===0,errors,routes:routeReports};
}
