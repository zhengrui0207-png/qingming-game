// Historical interpretation is kept separate from fictional shop names and model layout.
// Retrieved 2026-09-09. Ancient-text passages are paraphrased from the linked editions.
export const historySources={
 painting:{title:'故宫博物院｜张择端清明上河图卷',url:'https://www.dpm.org.cn/collection/paint/228226.html',kind:'馆藏介绍'},
 roof:{title:'故宫博物院｜悬山顶',url:'https://www.dpm.org.cn/lemmas/244118.html',kind:'建筑术语'},
 study:{title:'故宫博物院｜张择端《清明上河图》卷新探',url:'https://img.dpm.org.cn/Uploads/File/2018/06/05/u5b167df5352f9.pdf',kind:'研究论文 · PDF'},
 river:{title:'《东京梦华录》卷一·河道',url:'https://www.shidianguji.com/book/SK1074/chapter/1lxuisuxdip0u',kind:'古籍原文'},
 wine:{title:'《东京梦华录》卷二·酒楼',url:'https://www.shidianguji.com/book/HY0001/chapter/HY0001_16',kind:'古籍原文'},
 east:{title:'《东京梦华录》卷二·东角楼街巷',url:'https://www.shidianguji.com/book/HY0001/chapter/HY0001_14',kind:'古籍原文'},
 pan:{title:'《东京梦华录》卷二·潘楼东街巷',url:'https://www.shidianguji.com/book/HY0001/chapter/HY0001_15',kind:'古籍原文'},
 food:{title:'《东京梦华录》卷四·食店',url:'https://www.shidianguji.com/book/HY0001/chapter/HY0001_41',kind:'古籍原文'},
 festival:{title:'《东京梦华录》卷七·清明节',url:'https://zh.wikisource.org/zh-hans/東京夢華錄/卷七',kind:'古籍原文'},
 tea:{title:'故宫博物院《紫禁城》｜点茶的步骤',url:'https://www.dpm.org.cn/Uploads/File/2023/08/29/u64ed569143033.pdf',kind:'博物馆刊物 · PDF'},
 tools:{title:'故宫博物院｜宋代茶饼及茶具',url:'https://www.dpm.org.cn/subject_tea/single/detail/260805.html',kind:'专题展览'}
};
const fact=(title,text,sources,more)=>({title,text,sources,more:more||text});
export const architectureFacts={
 eaves:fact('悬山：屋顶伸出山墙','抬头看屋顶两端：两坡屋面越出侧面的山墙，是辨认悬山形制的线索。它和檐角是否翘起是两回事。',['roof'],'故宫建筑词条将悬山解释为前后两坡、桁檩向两侧山墙或山柱之外挑出的屋顶。观察时要看屋顶端部与墙体的关系。本游戏借用了这种出挑轮廓，构件比例仍有简化。'),
 frontage:fact('大店门楼与小铺敞棚','故宫的画卷介绍把大店的彩楼欢门与小店的敞棚并提。宋都市街面的层次，也来自铺面规模和开敞方式的不同。',['painting'],'沿街看过去，门面、棚架和柜台并不需要统一。眼前的开敞柜台与低棚，是据画中不同规模的商业空间作的设计补全，并非对某一家原铺的测绘。'),
 courtyard:fact('酒楼里的厅院与小阁','《东京梦华录》写任店：进门后有长廊，天井两侧分出小阁。酒楼通过廊、院与阁组织不同的宴饮空间。',['wine'],'书中还写到丰乐楼的多层楼阁与连接楼体的飞桥。这里讲的是汴京著名大酒楼的空间做法；眼前“桥头酒肆”是游戏店名，不能把它认作任店或丰乐楼。'),
 textile:fact('交易规模写在门面上','《东京梦华录》记界身巷的金银彩帛交易，特意描写它的高大屋宇与宽阔门面。商铺的尺度能提示经营规模。',['east'],'这条记载说的是汴京的界身巷。游戏把彩帛铺配置在虹桥街市，是为了展示这一行业；宽柜与挂布仅是帮助辨认的场景陈设，不能据此确定画中某屋原来的用途。'),
 roofs:fact('组合院落与错落屋顶','研究者从画中辨认出多种院落组合及屋面开口。读建筑时，可以一起看主屋、附屋、转角和院落的关系。',['study'],'故宫所刊研究讨论了画中的转角楼、门楼、天窗与多样院落组合。本游戏只表达了主屋与较低附屋之间的层次，尚未完整重建这些构造。')
};
export const cultureFacts={
 tea:[
  fact('点茶：茶末、汤瓶与茶筅','宋代流行把茶研成细末，先调成膏，再注热水，以茶筅或匙击拂出汤花。柜上的汤瓶负责注水，茶盏承接茶汤。',['tea','tools'],'“点”指注汤的动作。先碎茶、碾磨与过筛，再温盏、调膏、注汤、击拂，器具各有分工。故宫展览还用南宋《茶具图赞》说明宋代茶具的多样性；后出的茶具图谱可作时代参照，不能直接证明画中每家茶坊都配齐同样器物。'),
  fact('五更灯火里的茶坊交易','《东京梦华录》记一些茶坊五更点灯，兼有衣服、图画等买卖，天明散市，称“鬼市子”。茶坊也承接城市交往。',['pan'],'同篇还记北山子茶坊有被称为仙洞、仙桥的游赏空间，仕女往往夜间到那里吃茶。五更的买卖与夜间的游赏，呈现了不同茶坊承接的活动；这些是特定地点的记载，不代表每家茶坊都如此经营。')
 ],
 wine:[
  fact('正店与脚店的城市网络','《东京梦华录》列汴京正店七十二户，并把其余许多酒店称为脚店。这些名称让我们看到酒店之间的规模与层次。',['wine'],'“七十二”是这部文献对正店的记数。书中还描绘了丰乐楼的多层楼阁、飞桥栏槛，以及日夜汇聚的酒客。把店名、入口、宴饮空间和客流一起读，能看到酒店在都市交往中的分量。'),
  fact('彩楼欢门：酒家的迎客门面','书中写汴京酒店在门首结扎彩楼欢门，还描绘灯烛与帘幕。进入酒楼之前，门面已经在向行人招徕生意。',['wine'],'“彩楼欢门”可理解为门前装饰性的迎客构架，不等同于屋里用于承重的梁柱。眼前的酒幌和挑檐用于提示经营内容；左侧高架则是对装饰性门面的游戏演绎。')
 ],
 food:[
  fact('食客会点单，店家要记清','《东京梦华录》描写食店招待者拿着纸与箸询问客人，再向厨房报菜；冷热、做法各有要求，送错还会被责罚。',['food'],'书里还分列川饭店、南食店及多种面食。“分茶”在《食店》这一篇中也用来称某类较大的食店，不能只望文生义地理解成一种泡茶动作。游戏的蒸笼铺借此展示街头饮食，但没有把全部菜单都做成模型。'),
  fact('寒食与清明的街头滋味','《东京梦华录》记寒食前备食，也记清明坊市出售麦糕、乳酪等食品。出郊者归来还会带回炊饼和各样小物。',['festival'],'清明的拜扫、游春与买卖在这段记载里同时出现。文中还说人们把面制燕子用柳条串起，插在门楣。这里提供的是宋人节俗背景，不据此断言画中每个摊位都在卖某一种节令食品。')
 ],
 cloth:[
  fact('彩帛进入专门的交易街巷','《东京梦华录》提到纱行和界身巷，后者集中金银彩帛交易。布帛既进入日常穿着，也处于更大规模的商业往来中。',['east'],'“帛”是丝织品的总称。文献把界身巷写成金银彩帛交易之所，并强调宽阔门面与大宗交易，提醒我们：眼前的小柜台之外，当时还有汇集商人的专门交易空间。'),
  fact('同一街口，一天换几场市','潘楼附近从五更起买卖衣物书画，随后有食物和手作材料，傍晚又有头饰等货品。市集的内容随一天的时段变化。',['east'],'这不是一份现代式的固定营业时间表，而是孟元老对市井节奏的回忆。站在布帛铺前，可以把店铺与流动摊贩一起看：街面还承担了早市、零售和手工业材料交换。')
 ],
 grain:[
  fact('汴河把东南粮食送进京城','《东京梦华录·河道》把汴河与东南粮运联系起来，并说都城公私生活都依赖这条水路的供给。米铺背后连着远方产地。',['river'],'看米袋时，也可以回头看河里的货船：河道承担跨地区运输，岸边承担停靠和转运，粮食再进入城市生活。眼前米行的位置是游戏补全，不能认作史料点名的仓场或官营机构。'),
  fact('货船、码头与街上车马','画卷把漕船、岸边作业与车马放在同一片街市中。粮货到达河岸后，还需要有人搬运并沿街转送。',['painting','river'],'将眼前牛车、担夫与米铺连起来看，可以理解水运和陆运的衔接。运输与买卖的联系来自画卷和文献；游戏中每包粮食的来源、数量与去向没有史料对应。')
 ],
 herb:[
  fact('药铺已有专门的经营名目','《东京梦华录·潘楼东街巷》点出李生菜小儿药铺、仇防御药铺等店名。小儿药铺的称谓，提示了面向特定需求的经营。',['pan'],'同篇还沿街点出下马刘家药铺等商号，把药铺与茶坊、酒店、桥头市集放在同一条城市游历路线里。药铺并非孤立存在，它与居民行旅的日常活动相邻。这里的柜格形制属于游戏陈设。'),
  fact('香药也在繁华商街中出售','《东京梦华录》把香药铺席与珠宝、匹帛生意并列在潘楼街一带。香药在宋代城市消费中有明确的经营空间。',['east'],'在《东角楼街巷》中，香药铺席与珠宝、匹帛相邻，附近还有金银彩帛交易和多样小食。这条记述的价值在于展示商业门类如何汇聚在街巷里；“香药”的古代经营范围不宜直接套用现代店铺分类。')
 ],
 paper:[
  fact('笺纸店与书画买卖','《东京梦华录·酒楼》写大货行通往笺纸店；其他街巷记载又出现书画买卖。纸与书画进入了日常的城市商业空间。',['wine','east'],'笺纸可用于书写等活动。店铺不必被想象成现代书店：纸张售卖、书画交易与其他行业可能处在相邻街巷。眼前“文墨纸铺”的书册与笔架是帮助理解的陈设。'),
  fact('清明街头的纸制楼阁','《东京梦华录·清明节》记纸马铺在街面用纸叠成楼阁。纸制品也参与了祭祀与节俗，除了书写，还有不同的生活用途。',['festival'],'纸马铺与笺纸店属于不同经营门类。清明这一篇同时写拜扫、郊游、树下宴饮和归途购物，纸制楼阁就出现在这幅节日生活图景中。借纸铺读这段记载，可以认识纸张在书写以外的礼俗用途。')
 ]
};
const shopNote='店名、位置与陈设为游戏设计；历史讲解对应宋代行业和建筑背景，并非对画中此屋的确定考证。';
export function shopHistory(shop){
 const peers=shop.historyIndex??Math.floor(shop.id/7);
 const culture=cultureFacts[shop.type]?.[peers%2]||cultureFacts.tea[0];
 const architecture=shop.type==='wine'?architectureFacts.courtyard:shop.type==='cloth'?architectureFacts.textile:shop.id%3===0?architectureFacts.eaves:shop.id%3===1?architectureFacts.frontage:architectureFacts.roofs;
 return {key:'shop-'+shop.id,name:shop.name,category:'宋代街市 · 建筑与风俗',architecture,culture,note:shop.historyNote||shopNote,look:shop.wares};
}
export const landmarks=[
 {key:'bridge',name:'汴水虹桥',category:'水陆交会 · 木构桥梁',x:0,z:0,w:8,d:36,architecture:fact('无水中桥柱的木构拱桥','《东京梦华录·河道》记虹桥用巨木架起、桥下无柱；画中高起的木拱，也让船只与桥上行人分层通过。',['river','painting'],'文献对虹桥的记述是理解这类桥梁的重要参照。画中桥梁的具体名称与位置涉及考证，本游戏沿用“虹桥”的通称，不将它与文献中某一座桥的里程位置直接等同。'),culture:fact('船过桥前，要先放倒桅杆','故宫的画卷介绍特别提到：桥下一艘漕船正在放倒桅杆，艄工忙碌，引来围观。桥头热闹与航运操作紧密相连。',['painting'],'看桥时不妨同时观察桥面、桥孔与船桅。画家把通航中的忙碌和岸上的围观组织在一起。游戏以斜放船桅与索具表现桥前的货船轮廓，船只穿桥仍是简化模拟。'),note:'桥形依据画卷重建；具体接头、尺寸与交通过程有简化。',look:'桥面木板 · 拱下巨木 · 放倒的船桅'},
 {key:'quay-east',name:'汴河东侧码头',category:'城市供给 · 舟运与搬载',x:32,z:14,w:5,d:9,architecture:fact('让停靠处避开主航道','故宫所刊研究注意到画中凹入河岸的停泊空间，并讨论它与装卸、仓储的联系。码头的位置影响船只进出。',['study'],'这是研究者对画面空间的解读，不是测量所得的港务规划图。游戏的木栈桥是便于玩家上下船而设计，未精确复制画中港湾的形状。'),culture:fact('一条水路，供养一座都城','《东京梦华录》写汴河把东南的粮食和物产运入京城。靠岸、搬运、转送与沿街买卖，构成都城供给的一部分。',['river'],'河上的船不只有游赏用途。读这片街景时，货物、担夫和车马同样值得观察：它们让远方运来的物资进入近处的日常生活。'),note:'码头名称与木栈桥位置为游戏设计；航运背景依据史料。',look:'停靠船只 · 岸边货包 · 牛车与担夫'},
 {key:'gateway',name:'街口彩楼构架',category:'招徕与装饰 · 商业门面',x:-23,z:45,w:9,d:3,architecture:fact('彩楼欢门与承重屋架','《东京梦华录》记酒店在门首结扎彩楼欢门。这类装饰构架突出入口，与房屋内部的承重梁柱承担不同作用。',['wine'],'先看构架所在的位置：它在街口或门前，强调迎客和装饰。眼前高架只是结合参考图做的视觉演绎，其构造没有达到考古复原的精度。'),culture:fact('门面也会向行人介绍生意','故宫介绍画卷时并提大店的彩楼欢门和小铺的敞棚。繁华街市的商业形象，有高大的迎客构架，也有开敞的小摊。',['painting'],'可以沿街比较酒幌、匾额和开敞柜台，观察店家如何把入口与货物展示给行人。这里借游戏场景引导看图，不逐一认定原画门架的店铺归属。'),note:'此处高架的用途未作确定考证；借它介绍文献中的彩楼欢门。',look:'门前高架 · 横木与立柱 · 店铺入口'}
];
landmarks.push({...landmarks[1],key:'quay-west',name:'汴河北侧码头',x:-17,z:-14,w:4,d:8});
export function buildingDistance(actor,building){
 const dx=actor.x-building.x,dz=actor.z-building.z,a=building.yaw||0;
 const x=dx*Math.cos(a)-dz*Math.sin(a),z=dx*Math.sin(a)+dz*Math.cos(a);
 return Math.hypot(Math.max(Math.abs(x)-building.w/2,0),Math.max(Math.abs(z)-building.d/2,0));
}
export function makeHistorySites(world){
 const counts={};return [...world.shops.map(s=>{const historyIndex=counts[s.type]||0;counts[s.type]=historyIndex+1;return {...s,history:shopHistory({...s,historyIndex})};}),...landmarks.map(s=>({...s,history:s}))];
}
export function nearestHistorySite(actor,sites,current=null){
 // A bridge visitor should hear about the bridge, not a shop beyond the river bank.
 if(actor.layer==='bridge')return sites.find(s=>s.history.key==='bridge');
 const candidates=sites.filter(s=>s.history.key!=='bridge').map(s=>({s,d:buildingDistance(actor,s)})).filter(p=>p.d<4.8);
 candidates.sort((a,b)=>a.d-b.d);
 if(!candidates.length)return null;
 const previous=candidates.find(p=>p.s.history.key===current?.history.key);
 return previous&&previous.d<candidates[0].d+.65?previous.s:candidates[0].s;
}
export function sourcesFor(entry){return entry.refs??[...new Set([...entry.architecture.sources,...entry.culture.sources])].map(id=>({id,...historySources[id]}));}
