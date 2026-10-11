import fs from 'node:fs';
const original=JSON.parse(fs.readFileSync('output/npc-integration/original-npcs.json')),assets=JSON.parse(fs.readFileSync('public/assets/characters/catalog.json')),byAsset=new Map(assets.map(a=>[a.number,a])),chosen=new Map();
function assign(id,n,reason){if(chosen.has(id))throw Error(`Duplicate NPC ${id}`);if(!original.some(p=>p.id===id))throw Error(`Missing NPC ${id}`);chosen.set(id,{assetId:byAsset.get(n).id,reason});}
// The existing story identifies a boatman, porter, errand runner and cloth seller.
for(const [id,n] of [['npc_hq_zhou',22],['npc_hq_he',24],['npc_hq_cheng',18],['npc_hq_fang',44]])assign(id,n,'剧情身份与职业匹配；保留人物名、对话及任务触发');
const fixed={166:17,167:36,168:16,169:8,170:42,171:11,172:9,173:5,174:8,175:34,176:15,177:17,178:19,179:4,180:11,181:8,182:30,183:11,184:9,185:20,186:15,187:19,188:35,189:9,190:17,191:2,192:37,193:45,194:38,195:31,196:41,197:10,198:8,199:29,200:21,201:27,202:1,203:3,204:25,205:25,206:22,207:22,208:22,209:22,210:6,211:42,212:7,213:43};
for(const [index,n] of Object.entries(fixed)){
 const id=`street-${index}`,p=original.find(p=>p.id===id);
 assign(id,n,p.shopType?'原商铺职业/商品类别匹配':p.role==='骑马人'?'官吏身份匹配原骑马角色':p.role==='船夫'||p.role==='车夫'?'交通职业精准匹配':p.role==='赶牛人'?'牲畜随行职业匹配':'原停留区的顾客、手艺人或市井身份匹配');
}
// Ensure all 45 source identities appear, using only existing moving residents.
for(const n of [7,12,13,14,23,26,28,32,33,39,40]){
 if([...chosen.values()].some(x=>x.assetId===byAsset.get(n).id))continue;
 const carry=[12,23,26,28].includes(n),candidates=original.filter(p=>p.kind==='street'&&p.route&&!chosen.has(p.id)&& (carry?p.role==='挑担':p.role==='行人'));
 candidates.sort((a,b)=>{
  const rank=p=>n===23?Math.abs(p.position[2]):[39,40].includes(n)?p.position[2]:Math.abs(p.position[2]-38);
  return rank(a)-rank(b)||a.index-b.index;
 });
 assign(candidates[0].id,n,carry?'原搬运路人职业匹配':'原路人身份大类与所在区域匹配');
}
const residents=[7,6,20,21,29,32,33,39,40,42,43],porters=[12,23,26,28,29];
for(const p of original){if(chosen.has(p.id))continue;const group=p.role==='挑担'?porters:p.role==='携书行人'?[19,7,20]:residents;assign(p.id,group[p.index%group.length],p.role==='挑担'?'搬运职业匹配，沿用原路径':'普通行人身份匹配，复用角色资产');}
const result=original.map(p=>({...p,...chosen.get(p.id),assetName:assets.find(a=>a.id===chosen.get(p.id).assetId).name}));
const counts=Object.fromEntries(assets.map(a=>[a.id,result.filter(p=>p.assetId===a.id).length]));
if(Object.values(counts).some(n=>!n)||result.length!==original.length)throw Error('Population / 45-role coverage invariant failed');
for(const p of result){const a=assets.find(a=>a.id===p.assetId);if(!a.skins&&(p.route||['骑马人','车夫','船夫','乘客','赶牛人'].includes(p.role)))throw Error('Static asset assigned to moving NPC');}
fs.writeFileSync('public/assets/characters/npc-map.json',JSON.stringify(result.map(({id,assetId,assetName,reason})=>({id,assetId,assetName,reason})),null,2));
fs.writeFileSync('output/npc-integration/npc-map-full.json',JSON.stringify(result,null,2));
const csv=v=>'"'+String(v??'').replaceAll('"','""')+'"';
const columns=['旧NPC ID','原职业','区域','新角色ID','新角色','匹配依据','坐标','旋转','缩放','导航路径','碰撞体','交互'];
fs.writeFileSync('output/npc-integration/NPC匹配映射表.csv','\ufeff'+[columns,...result.map(p=>[p.id,p.role,p.region,p.assetId,p.assetName,p.reason,JSON.stringify(p.position),JSON.stringify(p.rotation),JSON.stringify(p.scale),JSON.stringify(p.route),JSON.stringify(p.collision),JSON.stringify(p.interaction)])].map(r=>r.map(csv).join(',')).join('\n'));
console.log(JSON.stringify({original:original.length,replacements:result.length,uniqueAssets:Object.keys(counts).length,counts},null,2));
