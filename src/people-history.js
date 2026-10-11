// Occupation vignettes, not identifications of individual figures in the painting.
// Primary text checked 2026-09-15. Keep separate from the four fictional quest stories.
const volume=n=>`https://zh.wikisource.org/zh-hans/東京夢華錄/卷${n}`;
const source=(id,title,n)=>({id,title:'《东京梦华录》'+title,url:volume(n),kind:'古籍原文 · 南宋追记北宋'});
const refs={
 broker:source('broker','卷三·雇觅人力','三'),
 clothes:source('clothes','卷五·民俗','五'),
 river:source('river','卷一·河道','一'),
 granary:source('granary','卷一·外诸司','一'),
 selling:source('selling','卷三·诸色杂卖','三'),
 crafts:source('crafts','卷四·修整杂货及斋僧请道','四')
};
const note='本条据古籍介绍北宋汴京的职业生活。人物外貌与站位为游戏复原，不据此认定原画中某人的身份；《东京梦华录》是孟元老在南宋对北宋都城生活的追记。';
function person(key,assetId,name,look,title,text,more,sourceIds,detailTitle,detail,detailSources=sourceIds){
 return {key:'person-'+key,kind:'person',assetId,name,category:'虹桥人物图志 · 市井百业',look,note,
  shortName:name.replace(' · ','\n'),peekLabels:['身影','行当'],readingLabels:['认一门行当','读一段宋人生活'],
  architecture:{title,text,more,sources:sourceIds},culture:{title:detailTitle,text:detail,more:detail,sources:detailSources},
  refs:[...new Set([...sourceIds,...detailSources])].map(id=>refs[id])};
}
export const peopleHistories=[
 person('broker','QMSH-20','牙人 · 穿针引线的说合者','桥头长衫客，来往说合人。',
  '初到汴京，先寻识行的人',
  '客地人地两生，雇个帮手也须有人引路。《东京梦华录》写，雇办事、酒食、作匠等人，各有行老供雇；寻女使，则有人引到牙人处。繁盛街市背后，还有一门替人牵线的营生。',
  '在汴京，请人办事、张罗酒食、寻工匠，各有可问的行老；寻女使，也有引至牙人的门路。所求不同，所问的人也不同。孟元老将两者分开写下，让我们看到繁华市面之下，雇主与做活人如何相遇。',
  ['broker'],'衣装也是一张行当名帖',
  '孟元老说各行衣装各有本色：裹香人顶帽披背，质库掌事着皂衫、束角带。行人看衣装，便能认出行当。这段记载并未说明牙人的专门服式，也未记“袖中捏指报价”，那一说法仍需另考。',['clothes']),
 person('boatman','QMSH-22','船工 · 一河生计系舟楫','老周 · 桥头岸边的船工',
  '河上行的是船，城里等的是粮',
  '桥市热闹，先要看桥下的水路。《东京梦华录》记汴河运东南之粮与物产入京，公家私家都仰赖它。船工所经手的舟楫，连着远处的产地，也连着近处一城人的炊烟。',
  '孟元老写汴河从西京洛口分水入京，东去至泗州入淮；东南物产循水路而来。看老周时，不妨再望一眼岸上的粮袋与铺席：河上舟楫，岸边搬载，街头买卖，在此接成一线。并非每条船都运官粮，但这条水路与都城的日用紧紧相连。',
  ['river'],'桥下无柱，仍须照应通航',
  '书中虹桥以巨木架起，桥下无柱。游戏用老周提示玩家留意船身、桅杆与桥孔的关系；具体险情和人物配合属于剧情演绎，并非这段古籍记下的一次事故。'),
 person('porter','QMSH-24','袋家 · 仓前肩粮人','何伯 · 岸边负重的搬运人',
  '一肩一袋，接住汴京的口粮',
  '船到岸，粮还要有人接着走。《东京梦华录》列出虹桥元丰仓、顺成仓等仓场，又写支粮时有“袋家”肩负粮袋，仓前随之成市。热闹不只在桥上，也在这些负重的肩背之间。',
  '孟元老从虹桥元丰仓、顺成仓写起，列出京城许多仓场。仓前一有粮食支遣，便聚起人和买卖。同篇还特别记军士领粮须亲自肩来，不许雇人搬担。都是肩上负粮，处境却未必一样；袋家也不能作为所有挑夫、背夫的统称。',
  ['granary'],'“两石”是粮量，不是现代公斤数',
  '原文写“每人肩两石布袋”。这里保留宋人的量词，不换算成一个看似精确的现代体重数字；玩家认识的是仓储、搬运与街市如何接续。'),
 person('peddler','QMSH-12','货郎 · 把百货挑到门前','一肩两端，挑着街巷人家的零碎日用。',
  '不必出远门，零碎家用送到跟前',
  '针头线脑、冠梳领抹，街市生意也能做到人家门口。《东京梦华录》写就门售卖衣著、铜铁器、瓷器等物，连养猫所需的小鱼也有人供应。一个“卖”字，分出许多细密营生。',
  '读《诸色杂卖》，大宅院门前有鱼虾鸡鸭，也有冠梳、衣箱、铜铁器；后街院子里，又有卖蒸梨枣、糕糜、蒸饼的小民。各人做各人的小本生意，合起来才是满城日用。这些货品分属不同卖家，并非都装在眼前一副担子里。',
  ['selling'],'一条街，也有各自的地分',
  '同篇还写打水者各有地分坊巷，补鞋、箍桶、换扇柄等服务举意可得。汴京的便利，不只靠大铺面，也靠沿街往来的小手艺与小买卖。'),
 person('bamboo','QMSH-31','竹匠 · 笸箩破了还能修','街旁竹器在手，候一桩修补的活计。',
  '一件旧器，也值得等一双巧手',
  '屋舍要修，竹木器也离不得手艺人。《东京梦华录》记清早桥市、街巷口，木竹匠人聚集候雇，叫作杂货工匠。主人有活要做，便到这里相请。桥头也是谋生等活的地方。',
  '赶早来到桥市的，不全是买卖人：木竹匠人和杂作人夫也在街巷口候人请唤。他们带来的不是一担现货，而是一门可受雇的手艺。修笸箩这处身影，是据木竹修作背景作的游戏演绎；古籍没有点定原画中的这个人。',
  ['crafts'],'匠人候雇，作料也有铺席',
  '同篇紧接着说竹木作料亦有铺席，砖瓦泥匠随手即就。请人、买料、修整屋宇彼此相接，能看出都城日常修缮已有细致分工。')
];
export const historyByAsset=new Map(peopleHistories.map(h=>[h.assetId,h]));

// One actual resident per selected street profession; retain its moving reference.
export function selectHistoryResidents(people,availableAssets){
 return ['QMSH-20','QMSH-12','QMSH-31'].flatMap(assetId=>{
  if(!availableAssets.has(assetId))return [];
  const match=people.filter(p=>p.active!==false&&p.assetId===assetId&&Number.isFinite(p.x)&&Number.isFinite(p.z))
   .sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z)||a.id.localeCompare(b.id))[0];
  return match?[match]:[];
 });
}
export function nearestHistoryPerson(actor,people,current=null,unobstructed=()=>true){
 if(actor.mode!=='walk')return null;
 const choices=people.flatMap(p=>{
  const history=historyByAsset.get(p.assetId),y=p.y??.94,layer=p.layer??'ground',d=Math.hypot(actor.x-p.x,actor.z-p.z);
  if(!history||p.active===false||!Number.isFinite(d)||d>2.8||!Number.isFinite(y)||Math.abs(actor.height-y)>.85||actor.layer!==layer||!unobstructed(actor,{x:p.x,y,z:p.z}))return [];
  return [{id:p.id,x:p.x,y,z:p.z,history,d}];
 }).sort((a,b)=>a.d-b.d||a.id.localeCompare(b.id));
 const previous=choices.find(p=>p.id===current?.id);
 return previous&&previous.d<=choices[0].d+.35?previous:choices[0]??null;
}
