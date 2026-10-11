import {contract, emptyChapter2Extension} from './index.js';
const result = errors => ({ok:errors.length===0,errors});
const arr = x => Array.isArray(x) ? x : [];
const str = x => typeof x==='string' && x.trim().length>0;
const uint = x => Number.isSafeInteger(x) && x>=0;
const positive = x => uint(x) && x>0;
const obj = x => x!==null && typeof x==='object' && !Array.isArray(x);
const ids = xs => new Set(arr(xs).map(x=>x.id));
function unique(xs, label, errors) { const seen=new Set(); for(const x of arr(xs)){ if(!str(x?.id)||seen.has(x.id))errors.push(`${label}: missing/duplicate id ${x?.id}`);seen.add(x?.id); } }
export function validateContract(c=contract) {
 const e=[]; if(!obj(c))return result(['contract: object required']);
 for(const k of ['npcs','items','anchors','quests','stories','shops','fishingPoints','barters']) {if(!Array.isArray(c[k]))e.push(`${k}: array required`);unique(c[k],k,e);}
 const anchors=ids(c.anchors),npcs=ids(c.npcs),items=new Map(arr(c.items).map(x=>[x.id,x]));
 for(const n of arr(c.npcs))if(!anchors.has(n.anchorId)||!str(n.dialogueId)||!str(n.entryNodeId)||!str(n.assetId))e.push(`npc ${n.id}: reference missing`);
 for(const s of arr(c.shops)){if(!npcs.has(s.npcId)||!anchors.has(s.anchorId))e.push(`shop ${s.id}: reference missing`);for(const o of arr(s.offers))if(!items.has(o.itemId)||!uint(o.price))e.push(`offer ${o.id}: invalid item/price`);}
 unique(arr(c.shops).flatMap(s=>arr(s.offers)),'offers',e);
 for(const q of arr(c.quests))if(!npcs.has(q.giverId))e.push(`quest ${q.id}: invalid giver`);
 for(const s of arr(c.stories))if(!items.get(s.itemId)?.unique||!positive(s.contentVersion)||!arr(s.stageIds).length)e.push(`story ${s.id}: invalid item/version/stages`);
 for(const p of arr(c.fishingPoints))if(!anchors.has(p.anchorId))e.push(`point ${p.id}: invalid anchor`);
 for(const i of arr(c.items)){if(!['fish','junk','rare','treasure','tool','supply','food'].includes(i.category)||typeof i.unique!=='boolean'||typeof i.protectedByDefault!=='boolean'||!['owned','borrowed'].includes(i.ownership))e.push(`item ${i.id}: invalid definition`);for(const k of ['buyPrice','sellPrice'])if(i[k]!==null&&!uint(i[k]))e.push(`item ${i.id}: invalid ${k}`);if(i.ownership==='borrowed'&&(!i.protectedByDefault||i.sellPrice!==null))e.push(`item ${i.id}: borrowed must be protected/unsellable`);}
 if(Object.values(c.balance?.fishing?.weights??{}).reduce((a,b)=>a+b,0)!==100)e.push('fishing weights: must total 100');
 for(const [category,key] of [['fish','fishItemIds'],['junk','junkItemIds'],['rare','rareItemIds']])for(const id of arr(c.balance?.fishing?.[key]))if(!items.has(id)||items.get(id).unique||items.get(id).category!==category)e.push(`random pool ${id}: missing, unique or wrong category`);
 if(!npcs.has(c.repair?.npcId)||!anchors.has(c.repair?.anchorId)||!items.has(c.repair?.reward?.itemId)||!positive(c.repair?.cost)||!uint(c.repair?.reward?.cash)||c.repair?.reward?.exclusive!==true)e.push('repair: invalid reference/cost/exclusive reward');
 const seen=new Set();for(const a of arr(c.actions)){if(!str(a.type)||seen.has(a.type))e.push('actions: duplicate/missing type');seen.add(a.type);for(const k of arr(a.required))if(!(k in (a.payload??{})))e.push(`action ${a.type}: required field undefined ${k}`);}
 for(const b of arr(c.barters))if(!ids(c.shops).has(b.shopId)||!items.has(b.inputItemId)||!items.has(b.outputItemId)||!positive(b.limit))e.push(`barter ${b.id}: invalid reference/limit`);
 if(c.save?.targetSchemaVersion!==3||c.save?.currentSchemaVersion!==2||c.save?.oneWholeSnapshot!==true)e.push('save: expected v2 to v3 whole snapshot');
 return result(e);
}
function accepts(type,value) {
 if(Array.isArray(type))return type.includes(value);
 const refs={entry:[contract.entry.id],region:[contract.region.id,contract.region.previousRegionId,contract.region.futureRegionId],anchor:contract.anchors.map(x=>x.id),quest:contract.quests.map(x=>x.id),mainQuest:[contract.region.mainQuestId],story:contract.stories.map(x=>x.id),storyStage:contract.stories.flatMap(x=>x.stageIds),shop:contract.shops.map(x=>x.id),foodShop:['shop_c2_food'],fisher:['npc_c2_fisher'],offer:contract.shops.flatMap(x=>x.offers).filter(x=>!x.id.startsWith('offer_c2_bread')&&!['offer_c2_congee','offer_c2_tea'].includes(x.id)).map(x=>x.id),foodOffer:contract.shops.find(x=>x.id==='shop_c2_food').offers.map(x=>x.id),fishingPoint:contract.fishingPoints.map(x=>x.id),repair:[contract.repair.id],repairStep:contract.repair.stepIds,deliveryAnchor:['anchor_c2_delivery'],barter:contract.barters.map(x=>x.id)};
 if(refs[type])return refs[type].includes(value);
 if(type==='string')return str(value);if(type==='boolean')return typeof value==='boolean';if(type==='positiveInteger')return positive(value);if(type==='nonnegativeInteger')return uint(value);if(type==='nonnegativeFinite')return Number.isFinite(value)&&value>=0;
 if(type==='saleLines')return Array.isArray(value)&&value.length>0&&value.length<=100&&value.every(line=>obj(line)&&Object.keys(line).every(k=>['itemId','quantity','instanceId'].includes(k))&&contract.items.some(i=>i.id===line.itemId&&i.ownership==='owned'&&i.sellPrice!==null&&positive(line.quantity)&&(!i.unique||(line.quantity===1&&str(line.instanceId)))&&(i.unique||line.instanceId===undefined)));
 return false;
}
export function validateAction(a) {
 if(!obj(a))return result(['action: object required']);
 const spec=contract.actions.find(x=>x.type===a.type);if(!spec)return result(['unknown-action']);const e=[];
 for(const k of Object.keys(a))if(!['type','transactionId','payload'].includes(k))e.push(`action: unexpected ${k}`);
 if(spec.transactionIdRequired&&!/^c2:[A-Za-z0-9_-]+:[1-9][0-9]*$/.test(a.transactionId??''))e.push('transactionId: expected c2:<saveEpoch>:<sequence>');
 if(!obj(a.payload))return result([...e,'payload: object required']);
 for(const k of Object.keys(a.payload))if(!(k in spec.payload))e.push(`payload: unexpected ${k}`);
 for(const k of spec.required)if(!accepts(spec.payload[k],a.payload[k]))e.push(`payload.${k}: invalid ${spec.payload[k]}`);
 for(const [k,v] of Object.entries(a.payload))if(!spec.required.includes(k)&&spec.payload[k]&&!accepts(spec.payload[k],v))e.push(`payload.${k}: invalid value`);
 if(a.payload.offerId&&!contract.shops.find(s=>s.id===a.payload.shopId)?.offers.some(o=>o.id===a.payload.offerId))e.push('offer: wrong shop');
 if(a.payload.barterId&&contract.barters.find(b=>b.id===a.payload.barterId)?.shopId!==a.payload.shopId)e.push('barter: wrong shop');
 if(a.type==='c2/sell')for(const l of arr(a.payload.lines)){const i=contract.items.find(i=>i.id===l.itemId);if(!contract.shops.find(s=>s.id===a.payload.shopId)?.acceptedCategories.includes(i?.category))e.push('sale: wrong shop/category');}
 if(a.type==='c2/readStory'&&!a.payload.sectionId?.startsWith(contract.stories.find(s=>s.id===a.payload.storyId)?.sectionIdPrefix))e.push('section: wrong story');
 if(a.type==='c2/advanceStory'&&!contract.stories.find(s=>s.id===a.payload.storyId)?.stageIds.includes(a.payload.stageId))e.push('stage: wrong story');
 return result(e);
}
export function validateContent(d,{ready=false}={}) {
 const e=[];if(!obj(d))return result(['content: object required']);if(d.contractVersion!==contract.contractVersion)e.push('content: contract version mismatch');if(ready&&d.draft!==false)e.push('content: draft is not ready');
 for(const key of ['npcs','quests','goals','dialogues','stories','sources']){if(!Array.isArray(d[key]))e.push(`${key}: array required`);unique(d[key],key,e);}
 const required={npcs:contract.npcs,quests:contract.quests,stories:contract.stories,goals:contract.quests.flatMap(q=>q.mandatoryGoalIds.map(id=>({id})))};
 for(const [key,rows] of Object.entries(required))for(const row of rows)if(!arr(d[key]).some(x=>x.id===row.id))e.push(`${key}: missing ${row.id}`);
 const srcIds=ids(d.sources);const checkSources=(row)=>{for(const id of arr(row.sourceIds))if(!srcIds.has(id))e.push(`source: unknown ${id}`);};
 const nonempty=(v,label)=>{if(ready&&(!str(v)||/TODO|待补|占位/.test(v)))e.push(`${label}: required text/placeholder`);};
 for(const s of arr(d.sources)){if(!['primary','painting','research','fiction'].includes(s.kind))e.push(`source ${s.id}: invalid kind`);nonempty(s.title,'source title');if(ready&&s.kind!=='fiction'&&(!str(s.locator)||!str(s.url)))e.push(`source ${s.id}: url and locator required`);}
 for(const n of arr(d.npcs)){if(!contract.npcs.some(x=>x.id===n.id))e.push(`npc: unknown ${n.id}`);nonempty(n.name,'npc name');nonempty(n.description,'npc description');checkSources(n);}
 for(const q of arr(d.quests)){nonempty(q.title,'quest title');nonempty(q.summary,'quest summary');}
 for(const g of arr(d.goals))nonempty(g.title,'goal title');
 for(const story of contract.stories){const rule=arr(d.storyRules).find(r=>r.storyId===story.id);if(!rule)e.push(`rules: missing ${story.id}`);else for(const stage of story.stageIds){const row=arr(rule.stages).find(r=>r.id===stage);if(!row||!Array.isArray(row.all)||ready&&!row.all.length)e.push(`rules: missing conditions for ${stage}`);else for(const c of row.all)if(!validateCondition(c).ok)e.push(`rules: invalid condition in ${stage}`);}}
 const allNodes=arr(d.dialogues).flatMap(x=>arr(x.nodes));unique(allNodes,'nodes',e);
 for(const expected of contract.npcs){const dialog=arr(d.dialogues).find(x=>x.id===expected.dialogueId);if(!dialog||dialog.npcId!==expected.id||dialog.entryNodeId!==expected.entryNodeId)e.push(`dialogue: missing/mismatched ${expected.dialogueId}`);}
 for(const dialog of arr(d.dialogues)){const nodes=ids(dialog.nodes);if(!nodes.has(dialog.entryNodeId))e.push(`dialogue ${dialog.id}: missing entry node`);for(const n of arr(dialog.nodes)){if(!n.id?.startsWith('node_c2_'))e.push('node: invalid prefix');nonempty(n.text,'node text');unique(n.choices,'choices',e);for(const ch of arr(n.choices)){nonempty(ch.text,'choice text');if(ch.nextNodeId!==null&&!nodes.has(ch.nextNodeId))e.push(`choice ${ch.id}: invalid nextNodeId`);if(ch.action){const spec=contract.actions.find(a=>a.type===ch.action.type);if(!spec||!validateAction({...ch.action,...(spec.transactionIdRequired?{transactionId:'c2:validation:1'}:{})}).ok)e.push(`choice ${ch.id}: invalid action`);}for(const condition of arr(ch.requires))if(!validateCondition(condition).ok)e.push(`choice ${ch.id}: invalid condition`);}}}
 for(const s of arr(d.stories)){const def=contract.stories.find(x=>x.id===s.id);if(!def||s.itemId!==def.itemId||!positive(s.contentVersion))e.push(`story ${s.id}: invalid item/version`);nonempty(s.title,'story title');nonempty(s.historicalNote,'historical note');checkSources(s);unique(s.sections,'sections',e);if(ready&&(!arr(s.sections).length||!arr(s.sourceIds).length))e.push(`story ${s.id}: sections/sources required`);for(const section of arr(s.sections)){if(!section.id?.startsWith(def?.sectionIdPrefix))e.push(`section ${section.id}: wrong prefix`);nonempty(section.title,'section title');if(!Array.isArray(section.paragraphs)||ready&&!section.paragraphs.length)e.push('paragraphs: array/complete body required');for(const p of arr(section.paragraphs)){if(typeof p!=='string')e.push('paragraph: string required');nonempty(p,'paragraph');}}}
 return result(e);
}
export function validateCondition(c){
 const e=[];if(!obj(c)||!contract.contentConditionKinds.includes(c.kind))return result(['unknown condition']);
 const idType={questStatus:['questId','quest'],goalCompleted:['goalId',null],storyStage:['storyId','story'],itemOwned:['itemId',null],repairStatus:['repairId','repair']}[c.kind];
 if(idType&&!(idType[1]?accepts(idType[1],c[idType[0]]):idType[0]==='goalId'?contract.quests.flatMap(q=>q.mandatoryGoalIds).includes(c.goalId):contract.items.some(i=>i.id===c.itemId)))e.push('condition: invalid entity');
 if(c.kind==='questStatus'&&!['available','active','completed'].includes(c.status))e.push('invalid quest status');
 if(c.kind==='storyStage'&&!contract.stories.find(s=>s.id===c.storyId)?.stageIds.includes(c.stageId))e.push('invalid story stage');
 if(c.kind==='itemOwned'&&!positive(c.quantity))e.push('invalid item quantity');
 if(c.kind==='repairStatus'&&!['available','active','ready','completed'].includes(c.status))e.push('invalid repair status');
 if(c.kind==='rewardChoice'&&!['cash','bell'].includes(c.choice))e.push('invalid reward choice');return result(e);
}
export function validateSceneManifest(d,{ready=false}={}) {
 const e=[];if(!obj(d))return result(['scene: object required']);if(d.contractVersion!==contract.contractVersion||d.regionId!==contract.region.id)e.push('scene: version/region mismatch');if(ready&&d.draft!==false)e.push('scene: draft is not ready');unique(d.anchors,'anchors',e);
 for(const a of contract.anchors){const row=arr(d.anchors).find(x=>x.id===a.id);if(!row)e.push(`anchor: missing ${a.id}`);else {if(!['ground','bridge'].includes(row.layer))e.push(`anchor ${a.id}: invalid layer`);if(row.position!==null||ready)if(!Array.isArray(row.position)||row.position.length!==3||!row.position.every(Number.isFinite))e.push(`anchor ${a.id}: unmeasured/invalid position`);if(ready&&!str(row.surfaceEvidence))e.push(`anchor ${a.id}: surface evidence required`);}}
 for(const row of arr(d.anchors))if(!contract.anchors.some(a=>a.id===row.id))e.push(`anchor: unknown ${row.id}`);
 unique(d.routes,'routes',e);for(const r of arr(d.routes)){if(!ids(d.anchors).has(r.from)||!ids(d.anchors).has(r.to)||!Array.isArray(r.waypoints)||r.waypoints.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))e.push(`route ${r.id}: invalid reference/points`);if(ready&&(r.waypoints.length<2||!str(r.walkEvidence)))e.push(`route ${r.id}: walk evidence required`);}
 if(ready){for(const a of contract.anchors.filter(x=>x.role!=='entry'))if(!arr(d.routes).some(r=>r.from==='anchor_c2_entry'&&r.to===a.id))e.push(`route: missing entry-to-${a.id}`);if(!str(d.boundaryEvidence))e.push('scene: C/D/E boundary evidence required');}
 return result(e);
}
export function validateExtension(d) {
 const e=[];if(!obj(d?.travel)||!obj(d?.chapter2))return result(['extension: travel/chapter2 required']);const t=d.travel,c=d.chapter2;
 if(c.contractVersion!==contract.contractVersion)e.push('extension: version mismatch');
 if(typeof t.initialized!=='boolean'||!accepts('region',t.regionId)||!uint(t.wallet?.coins))e.push('extension: invalid initialized/region/wallet');
 if(t.energy?.max!==contract.balance.maxEnergy||!uint(t.energy?.current)||t.energy.current>t.energy.max||!uint(t.energy?.reserved)||t.energy.reserved>t.energy.current||!Number.isFinite(t.energy?.passiveSeconds)||t.energy.passiveSeconds<0||t.energy.passiveSeconds>=contract.balance.passiveEnergySeconds)e.push('extension: invalid energy/reservation');
 if(!uint(t.relief?.debt)||t.relief.debt>contract.balance.relief.debt||typeof t.relief.firstCastGuaranteed!=='boolean')e.push('extension: invalid relief');
 const uniqueItems=new Set();for(const [id,i] of Object.entries(t.instances??{})){const def=contract.items.find(x=>x.id===i.itemId);if(!def?.unique||i.id!==id||!['owned','borrowed','sold','bartered'].includes(i.ownership)||typeof i.protected!=='boolean'||def.ownership==='borrowed'&&(i.ownership!=='borrowed'||!i.protected)||uniqueItems.has(i.itemId))e.push(`instance ${id}: invalid/duplicate ownership`);uniqueItems.add(i.itemId);}
 for(const [id,x] of Object.entries(t.collection??{}))if(!contract.items.some(i=>i.id===id)||!str(x.firstObtainedAt)||!positive(x.totalObtained))e.push(`collection ${id}: invalid history`);
 if(!['available','active','completed'].includes(c.mainStatus)||!uint(c.entryCount)||c.safeAnchorId!==null&&!accepts('anchor',c.safeAnchorId))e.push('extension: invalid chapter state');
 for(const q of contract.quests)if(!['available','active','completed'].includes(c.quests?.[q.id]?.status))e.push(`quest ${q.id}: invalid state`);
 if(!uint(t.transactions?.nextSequence)||!uint(t.transactions?.committedThrough)||t.initialized&&!str(t.transactions?.saveEpoch))e.push('extension: invalid transaction ledger');
 const r=c.repair;if(!['available','active','ready','completed'].includes(r?.status)||!arr(r?.stepIds).every(x=>contract.repair.stepIds.includes(x))||!uint(r?.reserved)||r.reserved!==t.energy.reserved||![null,'cash','bell'].includes(r.rewardChoice))e.push('extension: invalid repair');
 for(const id of arr(c.goalIds))if(!contract.quests[0].mandatoryGoalIds.includes(id))e.push('extension: invalid goal');
 for(const [id,x] of Object.entries(t.storyReadingProgress??{})){const story=contract.stories.find(s=>s.id===id);if(!story||!positive(x.contentVersion)||!str(x.sectionId)||!x.sectionId.startsWith(story.sectionIdPrefix)||!uint(x.paragraphIndex))e.push(`reading ${id}: invalid position`);}
 for(const id of arr(t.readStoryIds))if(!accepts('story',id))e.push('extension: invalid read story');
 for(const key of Object.keys(emptyChapter2Extension().travel))if(!(key in t))e.push(`extension: missing travel.${key}`);
 for(const key of Object.keys(emptyChapter2Extension().chapter2))if(!(key in c))e.push(`extension: missing chapter2.${key}`);
 return result(e);
}
