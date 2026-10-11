"""Authoring source for content data only; no game-state writes or external calls."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'src/chapter2/content';OUT.mkdir(parents=True,exist_ok=True)
C=json.loads((ROOT/'src/chapter2/contracts/contract.json').read_text())
data={'contractVersion':'1.0.0','contentVersion':1,'draft':False,'chapterTitle':'不响的铃','regionId':'region_d','fictionNotice':'四位人物、店铺经营、器物经历与本关事件均为游戏创作；原画外观和古籍生活背景另列出处。','npcs':[],'quests':[],'goals':[],'dialogues':[],'stories':[],'sources':[],'storyRules':[],'items':[],'presentations':[],'activityText':{},'interactionBindings':[]}
def source(id,title,url,locator,kind,scope,limits,quote=''):
 data['sources'].append(dict(id=id,title=title,url=url,locator=locator,kind=kind,applicableScope=scope,limitations=limits,shortQuote=quote,checkedDate='2026-10-01'))
V1='https://zh.wikisource.org/zh-hans/東京夢華錄/卷一';V3='https://zh.wikisource.org/zh-hans/東京夢華錄/卷三';V4='https://zh.wikisource.org/zh-hans/東京夢華錄/卷四'
source('src_c2_painting','张择端《清明上河图》卷：故宫原作说明','https://www.dpm.org.cn/collection/paint/228226.html','原作中段至城门前；本地S02–S11外观对照','painting','舟岸、街路、棚摊、负载行人和车马的画面关系。','不能据图确认本关四人姓名、店号、货物或旧事；门名/桥名研究不用于本关解谜。')
source('src_c2_scan','原作扫描与项目局部观察表','https://commons.wikimedia.org/wiki/File:Alongtheriver_QingMing.jpg','38414×1800扫描；S03/S04/S06/S07/S08/S09/S10','painting','本关场景外观和邻接；原画可见/身份未定分栏。','不把原画像素当三维坐标；画中摊屋经营内容仍未核定。')
source('src_c2_river','孟元老《东京梦华录》卷一·河道',V1,'河道：汴河与东南粮物入京','primary','水运与东京日常供应之间的关系。','南宋追记北宋；不证明S02某船载官粮或S04是官仓。')
source('src_c2_transport','孟元老《东京梦华录》卷三·般载杂卖',V3,'般载杂卖：太平车、平头车、人拽车辆和驮载','primary','车辆形制、运输环境、太平车用铃警示来车。','文中明写铁铃；本关铜铃是虚构私用小铃，不作宋代车铃标准复原，不给原画车强定车名。','中间悬一铁铃')
source('src_c2_labor','孟元老《东京梦华录》卷三·雇觅人力',V3,'雇觅人力：行老供雇','primary','临时雇工与市井分工的背景。','不能据此认定石伯是官仓袋家或某画中人物；不添加袖中报价传闻。')
source('src_c2_daily','孟元老《东京梦华录》卷三·诸色杂卖',V3,'诸色杂卖：修整动使、动使铜铁器、磁器、宿蒸饼','primary','修用具、日用铜铁/瓷器和小民饮食的生活背景。','不证明木牌记数法、铜扣用途、旧物价钱；不把宿蒸饼当本店卖陈食的依据。')
source('src_c2_dawn','孟元老《东京梦华录》卷三·天晓诸人入市、马行街铺席',V3,'早市粥饭点心、卖汤茶；市店购食','primary','早市吃喝、工作人群在店中买食的背景。','不把王家蒸作定为古籍实名店；茶恢复精力是游戏数值。')
source('src_c2_fishmarket','孟元老《东京梦华录》卷四·鱼行',V4,'鱼行：浅抱桶、清水浸鱼、生鱼入市','primary','鱼的保活/流通与渔夫卖鱼的行业背景。','原文未逐列鲤鲫；不能证明两种鱼在本关岸边分布与钓获率，也不复原古籍鱼价。','卖生鱼则用浅抱桶')
source('src_c2_bread','孟元老《东京梦华录》卷四·饼店',V4,'饼店：蒸饼与各类饼食','primary','蒸饼作为城市饼食类别。','本店菜色/白面份量/4文定价是游戏设定，未声称特定古法配方。')
source('src_c2_craft','孟元老《东京梦华录》卷四·修整杂货及斋僧请道',V4,'早晨桥市街巷口木竹工匠、竹木作料铺','primary','临街木竹修整和材料交易背景。','四步修缮为低难度教学简化，不作宋代榫卯/结绳工艺复原。')
source('src_c2_species','苏颂《本草图经》辑文·鲤鱼、鲫鱼','https://jicheng.tw/tcm/book/本草圖經/index.html','鲤鱼、鲫鱼条；站点标底本1211年刘甲本《经史证类备急本草》','primary','北宋文献已记鲤/鲫名称，鲫条的体促、肚大、脊隆外观观察。','这是后世证类本草保存的辑文电子录本，不是1061年原刻扫描；不采药效、化生传说，不映射为北宋汴河精确物种谱。')
source('src_c2_celadon','故宫博物院：耀州窑青釉刻花婴戏纹碗','https://intl.dpm.org.cn/Ceramicsis/1258.html','宋碗：敞口、宽唇、圈足、青釉；北宋晚期纹饰说明','research','青釉、敞口/弧腹/圈足作为本关日用小盏形制参考。','游戏小盏是素面缩小设计，不复制婴戏纹器，不定窑口，不伪称汝官窑或馆藏原件。')
source('src_c2_fiction','《不响的铃》游戏原创内容','','四人、三物、旧脚架、私用记数和交接','fiction','全部个人经历、证言、姓名、货损、饭钱、赊食和报酬分支。','参考器物承载记忆的创作方向，没有使用《哑舍》人物、器物、名称或现成情节。')
profiles=[
 ('fisher','鲁七','渔夫',52,'在岸边卖鱼多年，年轻时替母亲送过鱼，也替丁伯搭过短脚。如今先看鱼活不活，再问价钱；说话慢，算自己那份却从不含糊。','鲁七把浅水桶里的鱼拨开，空着一只手去摸篓边旧绳孔。','少年嫌母亲留鱼给邻人亏了本，长大才懂她记下的是往来照应。母亲现随姐姐住，他留在东京做小买卖。','节制、谨慎，肯教生手；不将同行写成毫无原则的免费提款者。','旧木牌前些日子落进浅水，自己肩痛，不便再俯身摸取。','旧识石伯与丁伯；与顾娘子互买日用什物；王家伙计认识他母亲留下的点痕。',['src_c2_fishmarket','src_c2_species','src_c2_fiction']),
 ('porter','石伯','老脚夫',63,'石伯早年赶脚争快，撞损过顾家新盏。货钱早已赔清，他却多年不肯把师父丁伯的旧木架交给别人。如今每次束货都先空手试一遍，听见铃也不催步。','他扶住旧脚架，拇指反复摩挲一道白色擦痕，又看向没有铃舌的铃。','跟丁伯学搬运，少年失手后把赔钱当作结清，把谨慎当作惩罚；丁伯去世后仍留木架和小铃。','倔强、自重、手上细心；会对新手认错，既不神秘高人也不以悲惨求同情。','脚架绑缚松了；顾娘子来收旧架，他误以为要拆它抵一笔旧账。','鲁七是旧同行；顾娘子父亲曾是货主；小满母亲当年给丁伯与他端过茶。',['src_c2_labor','src_c2_transport','src_c2_craft','src_c2_fiction']),
 ('merchant','顾娘子','杂货铺掌柜',42,'顾娘子接了父亲留下的小摊，认器物先看用过的地方。她记得石伯赔过新盏，也记得父亲把自用旧盏留下待人；她收旧木架，要在铺前给赶脚人歇担。','将小盏的缺口转离手边，拈起底足看一眼，顺手为另一只空篓腾出地方。','幼时帮父亲记货，见过新器卖不出、旧器反有人来寻；接摊后坚持问清物主再收。','爽利、精于辨物，肯讲明价；不假充古董鉴定权威。','缺地方放来客的担具，想收丁伯旧架；石伯把“收旧架”听成了追债。','鲁七供小鱼给熟客；石伯是父亲旧相识；小满在邻近饭铺供茶。',['src_c2_daily','src_c2_fiction']),
 ('food_vendor','王小满','王家蒸作伙计',19,'王小满随母亲在王家蒸作帮忙，先替客人把热盏放稳才报饭钱。他想学出门办事，母亲让他先记熟这一段街上的人；脚夫来迟了，也给人留个歇脚处。','掀蒸笼时先侧脸避汽，端盏前擦去案边水迹，把缺口背向客人。','幼时听母亲讲早市，后来学数饭钱；曾把新盏当成唯一好物，如今认得旧盏为何仍留。','嘴快、眼细、不抢长辈话；乐于学事，也认真追记赊账。','案上缺一副稳当脚架，来客的鱼桶和担具常占过道。','母亲认识鲁七母亲与丁伯；顾娘子是邻摊；石伯由他提一桩旧茶事。',['src_c2_dawn','src_c2_bread','src_c2_fiction'])]
for role,name,job,age,desc,habit,past,personality,trouble,relations,sources in profiles:
 n=next(x for x in C['npcs'] if x['role']==role)
 data['npcs'].append({**n,'name':name,'nameStatus':'finalized','occupation':job,'ageDesign':age,'description':desc,'behaviorCue':habit,'past':past,'personality':personality,'currentDifficulty':trouble,'relationships':relations,'sourceIds':sources,'historicalNote':'职业环境参考古籍，年龄、姓名及全部个人经历虚构；没有给原画具体人物作身份认定。','sceneRefs':{'fisher':['S03'],'porter':['S08','S09'],'merchant':['S07'],'food_vendor':['S04','S06']}[role]})

def story(suffix,title,tip,card,sections,sourceIds,note):
 spec=next(s for s in C['stories'] if s['id']=='story_c2_'+suffix)
 rows=[]
 for i,(heading,paragraphs) in enumerate(sections,1):
  sid=spec['sectionIdPrefix']+f'{i:02}'
  rows.append({'id':sid,'title':heading,'paragraphs':paragraphs,'paragraphIds':[sid+f'_p{j:02}' for j in range(1,len(paragraphs)+1)]})
 data['stories'].append({**spec,'title':title,'acquisitionTip':tip,'objectCard':card,'sections':rows,'sourceIds':sourceIds,'historicalNote':note,'reading':'optional','fullTextOnAcquisition':True,'narrator':'游戏叙事正文；不是从古籍摘出的真实人物传记。','unlockRule':{'kind':'collectionEverObtained','itemId':spec['itemId']},'doesNotRequireFutureRegion':True})

story('marked_token','木牌背面',
 '木牌正面三道深痕，背面五个小点，不像一笔账。',
 '一片掌心长的旧木牌，穿孔边缘被绳勒成斜槽，正面三道刀痕很深，背面五个小点却轻浅。它原是鲁七母亲随鱼桶带着的小记号，落水后由阿青在安全浅岸取回，经鲁七同意赠留。深痕记桶，浅点记她替人留下的五份鱼；不是官府验货凭信，也不能拿它向别人索取鱼钱。',[
 ('三道刀痕',[
 '鲁七把木牌翻过来，先用拇指摸那三道痕。小时候母亲挑鱼进市，他只够提半桶。母亲不逼他认字，在一片木上划三刀，教他沿途数桶，交鱼时数清，回家还要再数一回。他觉得这办法笨，等自己长成，能掂斤两、会说价了，便把木牌丢在旧篓底。',
 '母亲一早出门，桶里的清水总晃湿鞋面。别人问价，她回得快；一到丁伯歇担的屋前，却要停下。她让鲁七提桶，自己挑一尾鱼交过去。鲁七低声问，鱼钱收不收。母亲只说：“这尾算在我这里。”他回家重数铜钱，总疑心这条街占了他们便宜。']),
 ('背面的五点',[
 '后来母亲到姐姐家住，鲁七收拾鱼篓，发现木牌背面还有五个细点。他以为母亲算漏了五笔，提牌去问王家。王家妇人擦着案板笑起来，说那不是欠鱼钱：丁伯替她搬过柴，顾家借过她空器，几个人各有一次急难，鲁七母亲把留下的鱼记着，免得一人受了照应、另一人只站着看。',
 '鲁七记起有一年自己病了，母亲走不开，鱼却照样进了街市。丁伯挑前担，石伯提后桶，送回来时桶底干净，钱也没少一文。他当时只顾数钱，不曾问谁把那段路走完了。木牌背面的点很小，倒比正面三刀更费手。母亲不是不会算，只是那一面没有拿来叫人还账。']),
 ('浅水里的旧物',[
 '前些日子，旧系绳断了，牌滑进近岸浅水。鲁七肩膀不便，自己摸了两回，泥水越搅越浑。见阿青来，他不叫书生涉河，只指安全岸边的一小处，让他借竿把木片带上来。牌上泥一洗，深刀与细点一齐露出。鲁七看了片刻，把木牌擦干，并没有再系回自己的桶。',
 '“三桶鱼，我如今不用它也数得清。”他说，“背面那五点，我倒是许久才看懂。你肯记人家的事，便带着。只是它不抵鱼钱，也不是什么过门凭信。”阿青收入风物志，记清旧主人仍有姓名，不将这片木头说成河里无主的宝物。']),
 ('本街已知的一段',[
 '王小满在蒸作案边见到木牌，认出其中一个点所记的旧事：他母亲那年给搬运人留了饭，后来鲁七母亲送鱼来，谁也没把对方当作白吃的客人。来往久了，两家都能在对方店前放下担具。木牌的刻点是这个小圈子自己的记法，不是东京人人通用的规矩。',
 '本关已弄清两面的不同用途，也弄清鲁七愿意赠牌的缘故。他没有忽然改成不计价的渔夫，卖鱼仍照价收钱；只是再看街上的木架、空桶、热饭时，不只看谁欠了谁。牌边还有一道磨掉的浅痕，可供将来的游历追问；这一段故事已在本街讲完，不必过城门才能得知。'])],
 ['src_c2_fishmarket','src_c2_labor','src_c2_fiction'],
 '浅抱桶和市井雇工参考《东京梦华录》；木牌记桶、刻点记人、母子经历与赠物均为虚构私记，非官方凭信或已证实通行习俗。')

story('silent_bell','他亲手取下的铃舌',
 '铃口磨偏，舌却是亲手取下的；石伯为何留着它？',
 '一只小铜铃，铃口一侧磨薄，内壁留着撞击痕，挂耳穿过的旧绳已经发亮，里面却没有铃舌。旧主人是脚夫丁伯，后来传给石伯，私系于小脚架旁唤同伴。石伯年轻时误把响声当催促，失手碰损两只新盏，赔清后仍留着它。铜铃可作物酬；先问清往事再解除保护，才可换物或出售。',[
 ('一响便走',[
 '石伯年轻时最怕师父歇脚。丁伯把空架往屋前一放，先摸绳，再喝茶；他却看别家的车马已经过去，心里就急。架旁私系着一只小铜铃，丁伯招同伴时摇一下，他便抢着起担。他以为响声就是催人快走，不愿等老人的手在绳上来回摸。',
 '有一回顾家两只新盏束在箱里，木架一边垫得高，另一边还未坐实。丁伯叫他放下吃点东西，他说早到了便能早挣下一脚钱。才绕过摊边，箱身斜过去，两只盏沿撞在一处。碎声很轻，他反倒先听见铜铃乱响。丁伯接住架，叫他别再拉，随后才开箱。']),
 ('赔清了什么',[
 '货钱照约赔清。顾家父亲数完钱，没再多说一句重话。石伯却盯着那只铃，像它方才故意催了自己。丁伯给他一盏茶，盏口也缺了一块，石伯不敢接，怕又碰坏什么。师父把盏放稳，说：“是顾家自用的旧盏。你赔的是新货，莫连吃茶都赔进去。”',
 '石伯后来把铃舌取下，铜铃仍留在架边。起初是怕再听见那一声；再后来，他不靠声音催步，学会用手试架，用眼看左右负载。一条绳用坏了可以换，木上磨损也须查看，不能把每一道伤都涂上好颜色，当它从未受过力。丁伯笑他慢，他便真肯慢一些了。']),
 ('又来收架的人',[
 '丁伯去世后，石伯仍用旧架接短脚。顾家换顾娘子守摊，她说想收这副架，他先想到那两只新盏。顾娘子要在摊前给来客歇担，他却听成把旧木拆作抵钱。他没有问第二句，只答自己再修一修。不是钱没还，是当年那一跤还在他心里，谁提起旧物，他都先低了头。',
 '阿青替他摆正木脚、理好绑缚，手移到白痕处，石伯立刻挡了一下，随后自己松开手：“留着便是。如今歪在这里，与你无干。”试稳后，他把铜铃与工钱一同拿出来，让书生择一样。选择铜铃不是比拿工钱更有德行；两种报酬都抵眼前这一段劳动。']),
 ('铃不必再替人说话',[
 '到了门前，顾娘子接架，先看它能不能稳放，再说顾家那笔旧账早已清了。架留在铺前，赶路人放担，她自己也省得让空篓堵过道。王小满端来的茶没搁在箱盖上，而是稳稳放到案边。石伯看了白痕，才说出铜铃没有坏，是铃舌被他收起了。',
 '这一天不必替铃配新舌，也不用再赔一只盏。阿青若收铃，便记下它的来历；若收钱，石伯后来把铃托给顾娘子，书生仍有一次买到它的机会。木架已经交出，石伯也承认自己曾经争快。旧事并没有被抹掉，但不再替他决定每一步往哪里走。'])],
 ['src_c2_transport','src_c2_craft','src_c2_fiction'],
 '《般载杂卖》写太平车的铁铃；本篇铜铃、私系小脚架、失手与取舌为游戏创作，不能由铁铃记载推出铜铃的原画归属。')

story('celadon_cup','缺口朝哪边',
 '掌柜把缺口转向案里，却不许把这只旧盏叫作废物。',
 '小盏敞口、浅弧腹、圈足，青釉略显灰绿，口沿一处缺损已被长久使用磨钝，底足露胎处留有细擦痕。它原是顾家自用的茶盏，不在石伯当年碰损的新货里。丁伯喝过，王家妇人也曾替人端过。顾娘子把它转离手边，是怕客人碰伤；并不是藏瑕疵，更不说它是宫中名窑宝器。',[
 ('先看盏口',[
 '顾娘子摆旧物，总要先转一次盏。阿青问她是不是怕人见到缺口，她把盏推到亮处：“见得越清越好。这边缺了，喝茶便从另一边喝。拿回去摆着也罢，别认作整器。”父亲教她看胎、看底足，她先学会的却是看人的手：客人端得急，缺口就不该正对着手。',
 '幼时她只爱摊上成对的新盏。新釉照得出窗影，父亲擦完，叫她拿远些，免得裙角扫落。案边这只小盏不成对，底足也磨粗了。她想把它藏到后面，父亲又拿出来，用来喝自己的茶。卖给人的新货须交代清楚，自己用过的东西，也不必一坏就扔。']),
 ('不是那两只',[
 '石伯失手那天，她在摊前听见争论。两只新盏碎了，脚夫赔钱，父亲照约收下。后来丁伯坐到案边，他拿这只旧盏盛茶，又把茶递给不敢伸手的徒弟。小姑娘以为父亲拿破盏罚他，回家闷闷不乐。父亲让她摸底足：磨了多少年，怎么会是今早箱里才来的新货？',
 '王家妇人端汤茶过来时，常替他们擦净案边。她说新器旧器要各归各的账，做事也一样。赔了货，下一回仍能好好做事；一盏茶不该变成另一笔罚钱。顾娘子小时候未必全懂，却记住那天下午，石伯两手抱盏，坐了很久，丁伯也没有催他起来。']),
 ('守摊人的眼光',[
 '后来父亲把摊交给她。来的人有人只问新不新，有人只问贵不贵，也有人认得这只缺口盏，停下说丁伯从前怎样坐在这里。她没有因此给小盏编一个显赫出身，只记清谁用过。小盏可售，价钱当面说；来历若不肯讲，卖给爱记事的书生便少了半件东西。',
 '她想收丁伯旧架，石伯却总拖着修。她原先以为老人舍不得价钱，直到王小满提起那两只新盏，才明白他还将收架当作追债。她让伙计把空篓挪开，给架留一块地方，等它真的交来便当面说清。话绕了多年，只因一个人怕提旧错，另一个人以为不必再解释。']),
 ('门前一盏热茶',[
 '旧架交接后，王小满端茶，先擦案边，再将盏口转向里侧。他不是怕人发现缺损，是怕来客提着担、伸手太快。石伯看见这个小动作，认出那天下午王家妇人的手势。顾娘子说：“缺口我先说明，架上的伤你也留下。今后的担，稳稳放在这里便好。”',
 '阿青买小盏，或用已经问清来历的铜铃来换，都不会把这些人从旧事里买走。小盏属于他，顾家仍有自己的摊，石伯仍接脚，王小满仍要数饭钱。风物志记下这只盏不是当年摔坏的新货，也记下缺口为何朝里。本关疑问已有回答，无须再去城内寻一位神秘主人。'])],
 ['src_c2_celadon','src_c2_daily','src_c2_dawn','src_c2_fiction'],
 '宋青瓷形制参考馆藏说明；缺口、磨损、茶事和顾家全部关系为虚构。无窑口鉴定、御用身份、器物灵力或原画实名认定。')

quests=[('main','把旧架稳稳送到门前','顾娘子要收丁伯留下的旧木架，石伯却怕它被拆来抵账。阿青学一杆钓鱼、做一次交易，再帮石伯试稳木架，领取一种报酬，到城门前街口交接。','mandatory'),('fishing_intro','借一杆，识一尾','鲁七借出基础竿与免费饵，教阿青钓得一尾普通鱼，再当面收鱼。','mandatory'),('repair','旧架先试稳','辨认表面白痕与真正松动处，摆正垫脚、理好绑缚、空载试稳；成功后选工钱或铜铃。','mandatory'),('token','木牌背面','教学后，鲁七授权阿青在安全岸边用借竿取回落水木牌；固定所得，不涉水，不刷随机池。木牌赠留，旧事在本街讲清。','optional')]
for suffix,title,summary,reading in quests:
 q=next(q for q in C['quests'] if q['id']=='quest_c2_'+suffix)
 data['quests'].append({**q,'title':title,'summary':summary,'reading':reading,'requiresFutureRegion':False,'successText':{'main':'旧架交妥，门前的旧账也说清了。','fishing_intro':'已学会收杆；鱼与其他钓获会记入风物志。','repair':'木架稳了，报酬只领一种。','token':'木牌由鲁七赠留，来历已经可以在本街追问。'}[suffix]})
goals=[('fishing_intro','学钓一尾鱼','教学成功一杆，由resolveCast事务确认；免去刷随机稀有的门槛。'),('first_trade','完成一次交易','一杆教学后在渔夫处卖鱼即可；只算真实成交，关闭菜单或买价预览不算。'),('repair_reward','试稳旧架，领一种报酬','完成四步并chooseReward成功；现金和铜铃均满足。'),('handoff','门前当面交架','前三目标满足后在anchor_c2_delivery交接；仅站进范围不自动结算。')]
for suffix,title,policy in goals:data['goals'].append({'id':'goal_c2_'+suffix,'title':title,'servicePolicy':policy,'reading':'mandatory'})

itemcopy={
 'item_c2_fish_a':('鲫鱼','体侧扁、背较高的小鱼，收杆后暂养清水桶。','《本草图经》辑文记鲫鱼的体形；本关所钓是游戏选型，不能据此确认北宋这段河岸的种群。','银灰体、暗背、深体短躯、无须；不做金鱼品系或鲜艳观赏鱼。',['src_c2_species','src_c2_fishmarket']),
 'item_c2_fish_b':('鲤鱼','身较长，鳞片清楚，收杆时须让鱼入桶。','《本草图经》辑文有鲤鱼条；名称有时代依据，本关掉落率和售价为游戏配置。','自然褐金鳞、流线长体、嘴边须；不做锦鲤配色。',['src_c2_species','src_c2_fishmarket']),
 'item_c2_junk_pottery':('碎陶片','无纹的碎陶小片，边缘经水磨，掌柜按杂物收。','陶/瓷器交易有时代背景；钓出陶片与回收价为创作，不凭碎片认御窑。','灰褐粗陶胎，不混画近代商标或官窑款。',['src_c2_daily']),
 'item_c2_junk_wood':('朽木小件','一块残旧短木，不能充当修缮脚架的好料。','木竹材料铺与修整有古籍背景；本物只作可售杂物，不做可消耗剧情材料。','水浸暗色短木、磨角，无整根大梁或新鲜雕花。',['src_c2_craft']),
 'item_c2_junk_metal':('旧金属件','锈旧的小铁件，用途已经辨不清，按杂物收购。','古籍记日用铜铁器，未据残件强定某种工具。','小弯铁片、深锈；不用螺纹螺栓、拉链或机制零件。',['src_c2_daily']),
 'item_c2_rare_copper_piece':('旧铜扣','小铜环一侧被绳磨薄；可以再钓得，不是唯一故事藏物。','铜器和日用品为时代背景；本物“扣”按穿系用小环设计，不指现代按扣。','圆环状铜扣、铸造不均、绳槽，无弹簧按扣/铆接工业结构。',['src_c2_daily','src_c2_fiction']),
 'treasure_c2_marked_token':('刻痕木牌','正面深刻三刀，背面浅点五次。','鲁七一家私记，全部经历虚构；不是符牌、牙牌、官府通行证。','掌心长不规则木片、穿系孔、三道深刀与背面五点；不做印刷字与皇家纹。',['src_c2_fiction']),
 'treasure_c2_silent_bell':('缺舌铜铃','旧铃耳亮，铃口偏薄，舌是石伯取下的。','古籍太平车是铁铃；游戏铜铃为私用小物，无原画实物认定。','铜质小开口铃、吊耳、内壁敲痕、无铃舌；不同于密闭现代铃铛。',['src_c2_transport','src_c2_fiction']),
 'treasure_c2_celadon_cup':('缺口青釉小盏','敞口圈足的小盏，缺口朝里是为了不碰伤客人。','宋青瓷外观可作参考；本物素面，窑口未定，来历虚构。','敞口浅弧腹、低圈足、灰绿青釉、单处磨钝缺口、露胎足；不仿御用宝器。',['src_c2_celadon','src_c2_fiction']),
 'item_c2_basic_rod':('借用基础钓竿','鲁七借的竹竿，配线、浮子和小钩；不能卖。','钓具采用简单竹竿线钩的美术推演，不声称复原本画某人钓具。','无渔轮的细竹竿、素色线、小木/竹浮子、铁钩；不用碳纤维竿和塑料荧光漂。',['src_c2_fiction']),
 'item_c2_basic_bait':('基础钓饵','一小份面饵，鲁七备给生手，免费可用。','面饵及补充规则为本关教学设计，不宣称古籍记载这个渔夫用的配方。','小布包/陶小碟里的淡色面饵；不做塑料袋或现代瓶饵。',['src_c2_fiction']),
 'food_c2_steamed_bread':('蒸饼','新揭笼的饼食，伙计先让客人坐稳再递来。','《东京梦华录·饼店》有蒸饼；4文和加30精力是游戏数值。','素白面饼放竹笼/木案，不带现代包装、金属速食器。',['src_c2_bread','src_c2_dawn']),
 'food_c2_congee':('粥食','盛一碗热粥，能慢慢吃，不必赶着吞。','早市粥饭有古籍背景；本碗米粥的配料、6文/+45为设计值。','素粥、普通小碗、木匙；不宣称特定药膳。',['src_c2_dawn']),
 'food_c2_tea':('茶','一盏热茶，歇脚时饮，杯盏先放在稳当处。','茶坊、提瓶卖茶有古籍背景；本店煎茶展示及2文/+10为玩法抽象，不强说人人点茶。','朴素茶盏与茶液，具体煎点手法不作工艺任务。',['src_c2_dawn'])}
for spec in C['items']:
 name,desc,note,shape,src=itemcopy[spec['id']]
 data['items'].append({**spec,'name':name,'displayNameStatus':'content-reviewed','shortDescription':desc,'cultureNote':note,'shapeBrief':shape,'sourceIds':src,'historicalClassification':'period-background-with-fictional-game-object','reading':'optional'})
for suffix in ['marked_token','silent_bell','celadon_cup']:
 iid='treasure_c2_'+suffix;known='stage_c2_'+suffix+'_known';resolved='stage_c2_'+suffix+'_resolved'
 conditions=[{'kind':'storyStage','storyId':'story_c2_'+suffix,'stageId':known}]
 if suffix=='marked_token':conditions.append({'kind':'questStatus','questId':'quest_c2_token','status':'completed'})
 if suffix=='silent_bell':conditions.append({'kind':'goalCompleted','goalId':'goal_c2_repair_reward'})
 data['storyRules'].append({'storyId':'story_c2_'+suffix,'stages':[{'id':known,'all':[{'kind':'itemOwned','itemId':iid,'quantity':1}]},{'id':resolved,'all':conditions}],'fullBodyUnlock':'首次取得并写collection后即解锁全文；不把resolved或读完当正文解锁/主线通关条件。','advanceAt':{'marked_token':'鲁七说明牌背面','silent_bell':'石伯承认取下铃舌','celadon_cup':'顾娘子说明缺口的用途'}[suffix]})

def cond(kind,**kw):return {'kind':kind,**kw}
def qs(s,status):return cond('questStatus',questId='quest_c2_'+s,status=status)
def goal(s):return cond('goalCompleted',goalId='goal_c2_'+s)
def owns(id):return cond('itemOwned',itemId=id,quantity=1)
def stage(s,status='known'):return cond('storyStage',storyId='story_c2_'+s,stageId='stage_c2_'+s+'_'+status)
def act(s,**payload):return {'type':'c2/'+s,'payload':payload}
def ch(role,id,text,next=None,action=None,requires=None,intent=None):
 x={'id':'choice_c2_'+role+'_'+id,'text':text,'nextNodeId':'node_c2_'+role+'_'+next if next else None}
 if action:x['action']=action
 if requires:x['requires']=requires
 if intent:x['intent']=intent
 return x
def node(role,id,text,choices,reading='optional',**kw):
 return dict(id='node_c2_'+role+'_'+id,text=text,choices=choices,reading=reading,**kw)
def adddialog(role,nodes):
 n=next(n for n in C['npcs'] if n['role']==role);data['dialogues'].append({'id':n['dialogueId'],'npcId':n['id'],'entryNodeId':n['entryNodeId'],'nodes':nodes})
close=lambda role:ch(role,'leave','改日再说')
shop=lambda id:{'kind':'openShop','shopId':id}

adddialog('fisher',[
 node('fisher','entry','鲁七把手在桶沿一抹：“这街上忙的是车担，水里有水里的性子。你若想试，先借一杆。”',[
 ch('fisher','learn','请教钓鱼','teach',act('acceptQuest',questId='quest_c2_fishing_intro'),[qs('fishing_intro','available')]),
 ch('fisher','resume','接着学收杆','teach',requires=[qs('fishing_intro','active')]),
 ch('fisher','trade','卖鱼','sell',requires=[goal('fishing_intro')]),
 ch('fisher','ask_frame','问石伯的旧架','frame'),ch('fisher','ask_token','问水里的木牌','token_offer',requires=[goal('fishing_intro')]),
 ch('fisher','relief','问如何偿饭钱','debt'),ch('fisher','revisit','问街上近况','revisit',requires=[qs('main','completed')]),close('fisher')]),
 node('fisher','teach','“竿与基础饵借你用，不收钱，也莫转卖。去旁边安全岸沿，见浮子明显沉下再收；轻晃时不必抢。初学这一杆，收成便有普通鱼。”',[
 ch('fisher','go_point','到岸边试一杆',intent={'kind':'navigate','anchorId':'anchor_c2_fishing_a'}),ch('fisher','easy','想用简易收杆','simple'),close('fisher')],'mandatory'),
 node('fisher','simple','“看见收杆提示，点一下便成。鱼还是同一池鱼，不因你手慢便少给。”一杆耗精力4；不足时先吃些东西，走路与交谈照常。',[ch('fisher','simple_go','去钓点',intent={'kind':'navigate','anchorId':'anchor_c2_fishing_a'}),close('fisher')],'optional'),
 node('fisher','sell','“活鱼先入桶。我只收鱼，鲫鱼一尾6文，鲤鱼一尾10文，数好再交。”卖出的实物会离开行囊，风物志的记载留下。',[
 ch('fisher','sell_a','卖一尾鲫鱼','sold',act('sell',shopId='shop_c2_fish',lines=[{'itemId':'item_c2_fish_a','quantity':1}]),[owns('item_c2_fish_a')]),
 ch('fisher','sell_b','卖一尾鲤鱼','sold',act('sell',shopId='shop_c2_fish',lines=[{'itemId':'item_c2_fish_b','quantity':1}]),[owns('item_c2_fish_b')]),ch('fisher','open_sell','查看数量与交易',intent=shop('shop_c2_fish')),close('fisher')],'mandatory'),
 node('fisher','sold','鲁七点清鱼数，把应付的钱交妥：“这一脚做完了。买饭便去王家，旧器到顾娘子摊上问；石伯那副架，也等你一双稳手。”',[ch('fisher','go_porter','去看看旧架',intent={'kind':'navigate','anchorId':'anchor_c2_porter'}),close('fisher')],'mandatory'),
 node('fisher','frame','“年轻时他一听响便急，如今反倒不肯叫铃响。丁伯说过，靠声音催脚，不如先把担试稳。那架子的伤不是今日才有。”',[close('fisher')]),
 node('fisher','token_offer','“旧牌掉在浅水里。你若愿意，用竿从岸上带回来，别涉水。牌本是我家的，取回认过，我便送你留记。”',[
 ch('fisher','token_accept','帮忙取回木牌','token_where',act('acceptQuest',questId='quest_c2_token'),[qs('token','available')]),
 ch('fisher','token_resume','木牌在哪一处？','token_where',requires=[qs('token','active')]),
 ch('fisher','token_known','木牌的三刀与五点','token_truth',requires=[owns('treasure_c2_marked_token')]),close('fisher')]),
 node('fisher','token_where','鲁七指向另一处安全岸沿：“那里近岸浅水有旧木牌的记号；只取这一件，肯收杆便得，不用碰运气。仍耗一杆精力4。”',[ch('fisher','go_token','到那处岸沿',intent={'kind':'navigate','anchorId':'anchor_c2_fishing_b','fishingMode':'token'}),close('fisher')]),
 node('fisher','token_truth','“三刀是母亲教我数桶的，五点是她记给邻人留鱼。我病着那回，丁伯替我走过这段路。我只数了钱，竟没问过谁走的。牌送你，莫把它当过门凭信。”',[
 ch('fisher','token_record','记下这段来历','token_recorded',act('advanceStory',storyId='story_c2_marked_token',stageId='stage_c2_marked_token_resolved'),[stage('marked_token'),qs('token','completed')]),ch('fisher','token_full','读木牌故事',intent={'kind':'openStory','storyId':'story_c2_marked_token'}),close('fisher')]),
 node('fisher','token_recorded','木牌两面的用途已说清。鲁七仍按价卖鱼；这段往来，也已经留在风物志里。',[close('fisher')]),
 node('fisher','debt','“饭钱别躲着。卖鱼的钱先还4文欠账，余下才归你。若欠着饭钱又没力气，我这几只空鱼桶待擦；做完只替你还所欠，不另送钱。”',[
 ch('fisher','work','整理空桶，偿清欠账','debt_done',act('settleReliefWork',npcId='npc_c2_fisher')),ch('fisher','fish_debt','用鱼偿饭钱','sell'),close('fisher')]),
 node('fisher','debt_done','鲁七把应还的饭钱替你交妥：“账清了。竿还借你，再做事也先顾肚子。”这次差事不另增加铜钱。',[close('fisher')]),
 node('fisher','revisit','“架子在顾娘子摊前稳了，来客的桶也不用横在过道上。你要钓便钓；那块木牌只一块，记人倒还能添许多页。”',[ch('fisher','fish_again','去钓鱼',intent={'kind':'navigate','anchorId':'anchor_c2_fishing_a'}),ch('fisher','sell_again','卖鱼','sell'),close('fisher')])])

adddialog('porter',[
 node('porter','entry','石伯拇指按在旧木架的白痕上：“新绳我有，这道伤莫涂。顾娘子来收架，我还没答应拆它。”',[
 ch('porter','main_accept','问清差事，接下帮忙','request',act('acceptQuest',questId='quest_c2_main'),[qs('main','available')]),
 ch('porter','main_resume','接着帮忙','request',requires=[qs('main','active')]),ch('porter','bell_past','问那只不响的铃','bell_past'),
 ch('porter','go_delivery','旧架送往哪里？','delivery_where',requires=[goal('repair_reward')]),ch('porter','done_visit','回访石伯','revisit',requires=[qs('main','completed')]),close('porter')],'mandatory'),
 node('porter','request','“她说收旧架，倒像旧账还没完。我今日肩手吃不住，你帮我试稳，送到城门前街口，当面问个明白。先去鲁七处借竿试一杆，卖鱼挣一笔，认得这街上的买卖。”',[
 ch('porter','go_fisher','先去鲁七处',intent={'kind':'navigate','anchorId':'anchor_c2_fisher'}),
 ch('porter','repair_accept','已经学钓、成交，接修缮','repair_prepare',act('acceptQuest',questId='quest_c2_repair'),[goal('fishing_intro'),goal('first_trade'),qs('repair','available')]),
 ch('porter','repair_continue','继续修缮','repair_prepare',requires=[goal('fishing_intro'),goal('first_trade'),qs('repair','active')]),close('porter')],'mandatory'),
 node('porter','repair_prepare','石伯将货箱卸空：“白痕只是表面擦伤，真正松的是绑缚，还有歪的垫脚。先辨松处，摆正，再理绳，最后空载试稳。工钱16文，或这只铜铃，做成只领一样。”',[
 ch('porter','repair_begin','预留18精力，开始修缮',action=act('beginRepair',repairId='repair_c2_cargo'),intent={'kind':'openRepair','repairId':'repair_c2_cargo'}),ch('porter','need_food','先吃些东西','food_way'),close('porter')],'mandatory'),
 node('porter','food_way','“王家就在沿街敞面屋前。蒸饼4文，粥6文，茶2文；手里一文没有，也还能走到店前问，莫在架边硬撑。”',[ch('porter','go_food','去王家蒸作',intent={'kind':'navigate','anchorId':'anchor_c2_food_vendor'}),close('porter')]),
 node('porter','bell_past','“丁伯留下的。舌不是自己掉的，是我取下来的。我年轻时争一脚快，把顾家新盏撞坏过。钱赔清了，旁人一说收旧物，我却总以为还有账要追。”',[
 ch('porter','bell_resolve','记下铃舌的缘故','bell_recorded',act('advanceStory',storyId='story_c2_silent_bell',stageId='stage_c2_silent_bell_resolved'),[stage('silent_bell'),goal('repair_reward')]),
 ch('porter','bell_read','读铜铃故事',requires=[stage('silent_bell')],intent={'kind':'openStory','storyId':'story_c2_silent_bell'}),close('porter')]),
 node('porter','bell_recorded','铜铃不响的原因已经说清；换出它以后，风物志仍留这段来历。',[close('porter')]),
 node('porter','reward','石伯空载试过，才松开手：“架稳了。十六文工钱，或这只旧铜铃，你择一样合用的。拿钱买饭、拿铃记事，都不耽误交架。”',[
 ch('porter','reward_cash','领16文工钱','reward_taken',act('chooseReward',repairId='repair_c2_cargo',choice='cash'),[cond('repairStatus',repairId='repair_c2_cargo',status='completed')]),
 ch('porter','reward_bell','收下缺舌铜铃','reward_taken',act('chooseReward',repairId='repair_c2_cargo',choice='bell'),[cond('repairStatus',repairId='repair_c2_cargo',status='completed')])],'mandatory',entryFor='repair-completed-unrewarded'),
 node('porter','reward_taken','“这一趟修缮的报酬交妥了。”石伯摸过白痕，将空箱扶正：“去门前街口吧。架我来带，你不用一路替我背着。”',[ch('porter','where_handoff','问交接位置','delivery_where'),ch('porter','hear_past','顺便听铃的往事','bell_past')],'mandatory'),
 node('porter','delivery_where','“城门还在前头，咱们止在门外街口的交架处。看长木架近旁，顾娘子收架；不必过门，不必等车，也不用护送我。”',[ch('porter','go_handoff','去门前交接处',intent={'kind':'navigate','anchorId':'anchor_c2_delivery'}),close('porter')],'mandatory'),
 node('porter','handoff','顾娘子扶住架角：“我父亲那两只新盏，你早赔了。今日收丁伯旧架，是给赶路人歇担，哪里又叫你还钱？”石伯看了白痕，半晌才答：“那就稳稳放下。”',[
 ch('porter','handoff_confirm','在这里交妥旧架','handoff_done',act('handOffCargo',questId='quest_c2_main',anchorId='anchor_c2_delivery'),[goal('fishing_intro'),goal('first_trade'),goal('repair_reward')]),close('porter')],'mandatory',entryFor='anchor_c2_delivery'),
 node('porter','handoff_done','旧架交妥，顾娘子把空篓挪到架边。石伯终于不再按着那道白痕。',[ch('porter','main_finish','完成这桩差事','closing',act('completeMain',questId='quest_c2_main'),[goal('handoff')])],'mandatory',entryFor='handoff-completed-main-active'),
 node('porter','closing','王小满递茶，先擦净案边。石伯接过，笑了一下：“丁伯那年也是这样叫我坐下。你先游你的，我这脚不赶。”长篇来历可在风物志里慢慢读。',[ch('porter','free_roam','继续游历'),ch('porter','book_after','打开风物志',intent={'kind':'openBook','page':'collection'})],'mandatory',entryFor='main-completed'),
 node('porter','revisit','“架留在铺前，我再接短脚，不带它了。修这一回的报酬已付清；你来坐，我愿再说几句，不再叫你干同一遍活。”',[ch('porter','past_again','听旧铃往事','bell_past'),close('porter')])])

adddialog('merchant',[
 node('merchant','entry','顾娘子把缺口盏转向案里：“瑕疵先说明，价钱才好说。旧架还没送来么？摊前正缺个放担的地方。”',[
 ch('merchant','goods','卖杂物、买旧器','goods'),ch('merchant','frame_truth','问为何收石伯旧架','frame'),ch('merchant','cup_origin','问缺口小盏','cup'),
 ch('merchant','trade_bell','铜铃能换什么？','barter'),ch('merchant','bell_later','领了工钱，还想收铃','bell_later',requires=[cond('rewardChoice',choice='cash')]),
 ch('merchant','repurchase','想找回误售物件','buyback'),ch('merchant','revisit','问交架后的铺前','revisit',requires=[qs('main','completed')]),close('merchant')]),
 node('merchant','goods','“碎陶片1文，朽木2文，旧铁件3文，旧铜扣12文。鱼送鲁七，借来的竿与虹桥三件借物不收。青釉盏18文，你要买先看缺口。”',[
 ch('merchant','open_goods','查看杂物与旧器',intent=shop('shop_c2_general')),
 ch('merchant','buy_cup','买缺口青釉小盏（18文）','cup_bought',act('buy',shopId='shop_c2_general',offerId='offer_c2_cup',quantity=1)),close('merchant')]),
 node('merchant','frame','“收的是架，不是账。丁伯从前在这里歇脚，我父亲待过他。我想给来客放担，也省得空篓堵路。那两只新盏石伯早赔清了，他偏不肯问第二句。”',[ch('merchant','tell_porter','去与石伯说清',intent={'kind':'navigate','anchorId':'anchor_c2_porter'}),close('merchant')]),
 node('merchant','cup','“这只从前就是顾家自用的，与你们说的碎新货无关。丁伯用它喝过茶。缺口朝里，是怕赶脚人伸手急，碰伤了；不是把坏处藏着卖你。”',[
 ch('merchant','cup_record','记下小盏来历','cup_recorded',act('advanceStory',storyId='story_c2_celadon_cup',stageId='stage_c2_celadon_cup_resolved'),[stage('celadon_cup')]),
 ch('merchant','cup_story','读小盏故事',requires=[stage('celadon_cup')],intent={'kind':'openStory','storyId':'story_c2_celadon_cup'}),ch('merchant','cup_shop','看看这只盏','goods'),close('merchant')]),
 node('merchant','cup_bought','顾娘子把小盏交给阿青：“缺口我已说明，别从那边饮。”实物已收入行囊，物件卡和完整故事一同留在风物志。',[ch('merchant','cup_question','再问一句来历','cup'),close('merchant')]),
 node('merchant','cup_recorded','小盏与两只新货的区别已经说清；转缺口的用意，也记在风物志里。',[close('merchant')]),
 node('merchant','barter','“旧铃换这只青釉盏，一次便清。先把石伯的往事问明，再在行囊里亲手解除铃的保护；换出去，铜铃仍记在书里，手中实物就归我。”',[ch('merchant','open_barter','查看换物条件',intent=shop('shop_c2_general')),ch('merchant','ask_bell','先问石伯',intent={'kind':'navigate','anchorId':'anchor_c2_porter'}),close('merchant')]),
 node('merchant','bell_later','“你领工钱以后，石伯把铃托给我。你若还想记这段事，可以20文买下，只这一只。先前已收过铃的人，不能再取第二只。”',[
 ch('merchant','buy_bell','买缺舌铜铃（20文）','bell_bought',act('buy',shopId='shop_c2_general',offerId='offer_c2_bell_later',quantity=1),[cond('rewardChoice',choice='cash')]),close('merchant')]),
 node('merchant','bell_bought','铃已交到阿青手中，顾娘子把这笔划清：“还想问铃舌，石伯就在这段街上。”',[ch('merchant','bell_question','去问石伯',intent={'kind':'navigate','anchorId':'anchor_c2_porter'}),close('merchant')]),
 node('merchant','buyback','“误卖来我这儿的，还在回购单里便可找回。按那笔售钱取，不加价；换出去的不是误售，不能假作另一笔取回。先看实物与数量，再认这一笔。”',[ch('merchant','open_buyback','看回购单',intent={'kind':'openShop','shopId':'shop_c2_general','tab':'buyback'}),close('merchant')]),
 node('merchant','revisit','“架稳，担也有地方放。来往人各有生计，不必为一只旧盏停了所有买卖。你带走的是物，我们留下的交情还在。”',[ch('merchant','goods_again','看看物件','goods'),close('merchant')])])

adddialog('food_vendor',[
 node('food_vendor','entry','王小满把笼盖侧着揭起，避开热汽：“先坐稳。饼4文，粥6文，茶2文。肚里有食，才有力替人做事。”',[
 ch('food_vendor','menu','买饭或茶','food'),ch('food_vendor','credit','身上无钱又无力，能否赊食？','relief'),ch('food_vendor','frame_memory','问旧架的白痕','frame'),
 ch('food_vendor','token_points','木牌背面的点痕','token',requires=[stage('marked_token')]),ch('food_vendor','cup_edge','小盏为何缺口朝里？','cup'),
 ch('food_vendor','revisit','交架后再来坐坐','revisit',requires=[qs('main','completed')]),close('food_vendor')]),
 node('food_vendor','food','“蒸饼补30精力，粥补45，茶补10，最多到100。满了便不扣钱。喝茶可歇脚，真要接着干活，先吃饭更合用。”',[
 ch('food_vendor','eat_bread','吃蒸饼（4文）','ate',act('eat',shopId='shop_c2_food',offerId='offer_c2_bread')),
 ch('food_vendor','eat_congee','吃粥（6文）','ate',act('eat',shopId='shop_c2_food',offerId='offer_c2_congee')),
 ch('food_vendor','drink_tea','喝茶（2文）','ate',act('eat',shopId='shop_c2_food',offerId='offer_c2_tea')),ch('food_vendor','food_counter','看当前精力与价钱',intent=shop('shop_c2_food')),close('food_vendor')]),
 node('food_vendor','ate','伙计把饭盏撤到案里，给你的担具留出路：“这一份已付清。再走不迟。”实际补充数值已经记下。',[ch('food_vendor','to_repair','去旧架处',intent={'kind':'navigate','anchorId':'anchor_c2_repair'}),close('food_vendor')]),
 node('food_vendor','relief','“若不足4文、精力也不足一杆，又没有旧饭账，可以先赊一份蒸饼，补30，记4文欠账。下一杆简易收成保一尾鱼；卖鱼所得先偿饭钱。”',[
 ch('food_vendor','request_relief','按条件赊一份蒸饼','relief_given',act('requestRelief',shopId='shop_c2_food')),ch('food_vendor','normal_food','查看正常饭食','food'),close('food_vendor')]),
 node('food_vendor','relief_given','王小满把饼递来，在账边记清：“先吃。4文饭钱随下次卖鱼或领工钱偿，不要刷新来领第二份。”',[ch('food_vendor','relief_fish','去鲁七钓鱼偿账',intent={'kind':'navigate','anchorId':'anchor_c2_fishing_a','fishingMode':'relief'}),close('food_vendor')]),
 node('food_vendor','frame','“那道白痕旧得很，不是今日裂开的。娘说丁伯当年把架放下，叫石伯先喝茶。石伯见盏口缺了，竟不敢端，以为人家罚他。娘说，缺的是自用旧盏，新货另算。”',[close('food_vendor')]),
 node('food_vendor','token','“我娘认得其中一回：她留饭，鲁七母亲后来送鱼，谁也没叫谁白吃。那五个点只记他们几家的来往，不是满街都认的记号。”',[ch('food_vendor','token_book','读木牌故事',intent={'kind':'openStory','storyId':'story_c2_marked_token'}),close('food_vendor')]),
 node('food_vendor','cup','“端茶先把案边水擦了，盏不滑，手才稳。缺口转离客人的手，顾娘子也这样。你看见这个动作，便知道旧盏不是拿来罚谁的。”',[close('food_vendor')]),
 node('food_vendor','revisit','“石伯坐下喝过茶了。以后顾家架上能放担，我这案前也不必挤满桶。你进城前想歇一歇，还是这三样饭茶。”',[ch('food_vendor','food_again','吃饭喝茶','food'),close('food_vendor')])])

# Mechanical information is displayed separately from period dialogue.
rewrites={
 'node_c2_fisher_simple':('“看见收杆提示，点一下便成。鱼还是同一池鱼，不因你手慢便少给。”','每杆耗精力4；不足时不能抛竿，走路与交谈照常。简易模式与普通模式同掉落池。'),
 'node_c2_fisher_sell':('“活鱼先入桶。我只收鱼，鲫鱼一尾6文，鲤鱼一尾10文，数好再交。”','确认成交后实物离开行囊，风物志记录保留。'),
 'node_c2_fisher_token_where':('鲁七指向另一处安全岸沿：“旧牌就在近岸浅水的记号处。只在岸上用竿带回来，别涉水。”','固定木牌支线；每杆精力4，成功必得木牌，不使用普通随机池/珍稀保底。'),
 'node_c2_fisher_debt_done':('鲁七把应还的饭钱替你交妥：“账清了。竿还借你，再做事也先顾肚子。”','本次工作免精力、只偿未还饭钱，不另增加铜钱。'),
 'node_c2_food_vendor_food':('“饼新揭笼，粥也热。喝茶可歇脚，真要接着干活，先吃饭更合用。肚子不空便不必多买。”','蒸饼4文/+30、粥6文/+45、茶2文/+10；精力上限100。满精力不成交，不白扣钱。'),
 'node_c2_food_vendor_ate':('伙计把饭盏撤到案里，给你的担具留出路：“这一份已付清。再走不迟。”','实际补充精力与铜钱扣除，以服务保存成功结果显示。'),
 'node_c2_food_vendor_relief':('“身上没钱，肚里也空，可先赊一份蒸饼，记4文饭钱。卖鱼或领工钱，先偿了再算自己的。旧账没清，我便不能再记第二份。”','条件：铜钱<4、可用精力<4、欠账为0。赊食补30、欠4；下一杆救急保普通鱼，简易收杆不失败。'),
 'node_c2_food_vendor_relief_given':('王小满把饼递来，在账边记清：“先吃。这4文记在我这里，下一脚做成再还。竿鲁七肯借你，别空着肚子硬撑。”','赊食和欠账已同次保存；刷新不能再次领取，下一次收入先偿债。'),
 'node_c2_porter_closing':('王小满递茶，先擦净案边。石伯接过，笑了一下：“丁伯那年也是这样叫我坐下。你先游你的，我这脚不赶。”','主线结束。钓鱼、买卖、三件藏物与长故事可继续自由探索；城门内暂不开放。')}
for d in data['dialogues']:
 for n in d['nodes']:
  if n['id'] in rewrites:n['text'],n['uiNote']=rewrites[n['id']]
  for choice in n['choices']:
   suffix=choice['id'].removeprefix('choice_c2_'+d['npcId'].removeprefix('npc_c2_')+'_')
   choice['id']=n['id'].replace('node_','choice_',1)+'__'+suffix

for s in data['stories']:
 for section in s['sections']:
  section['paragraphs']=[p.replace('本关已弄清','如今已弄清').replace('本关疑问已有回答，无须再去城内寻一位神秘主人。','这一问终于说清，盏还是那只盏，端茶的手势也留在这条街上。').replace('这一段故事已在本街讲完，不必过城门才能得知。','鲁七把最后一滴水擦去，母亲做过的事，也就随着两面的刻痕留下了。').replace('选择铜铃不是比拿工钱更有德行；两种报酬都抵眼前这一段劳动。','拿铃可记旧事，拿钱可买饭；阿青哪样合用，便领哪样。').replace('阿青买小盏，或用已经问清来历的铜铃来换，都不会把这些人从旧事里买走。','阿青买小盏，或用已经问清来历的铜铃来换，顾娘子都将物件当面交清。') for p in section['paragraphs']]

# Non-NPC hooks use existing action types only; 00/10 route them to measured anchors.
data['entryBindings']=[
 {'id':'binding_c2_entry','anchorId':'anchor_c2_entry','label':'沿岸街往城门前游历','action':act('enterChapter2',entryId='entry_c2_from_hongqiao'),'serviceGuards':['hongqiao_01 completed','endingPending=false'],'reading':'mandatory'},
 {'id':'binding_c2_return','anchorId':'anchor_c2_entry','label':'回虹桥','action':act('leaveChapter2',targetRegionId='region_c',anchorId='anchor_c2_entry'),'reading':'optional'},
 {'id':'binding_c2_cast_a','anchorId':'anchor_c2_fishing_a','pointId':'point_c2_a','label':'岸边垂钓','serviceAction':'c2/startCast','modeResolution':'服务根据tutorialCompleted与firstCastGuaranteed选择tutorial/relief；其余normal/simple，不能靠菜单无限选择保鱼模式。'},
 {'id':'binding_c2_cast_b','anchorId':'anchor_c2_fishing_b','pointId':'point_c2_b','label':'浅岸垂钓 / 取木牌','serviceAction':'c2/startCast','modeResolution':'quest_c2_token active且未取得时显示token；普通钓鱼仍走normal/simple。'},
 {'id':'binding_c2_repair','anchorId':'anchor_c2_repair','repairId':'repair_c2_cargo','entryNodeId':'node_c2_porter_repair_prepare','dialogueId':'dialogue_c2_porter','label':'试稳旧架'},
 {'id':'binding_c2_reward','entryNodeId':'node_c2_porter_reward','dialogueId':'dialogue_c2_porter','serviceGuards':['repair.status=completed','repair.rewardChoice=null']},
 {'id':'binding_c2_delivery','anchorId':'anchor_c2_delivery','entryNodeId':'node_c2_porter_handoff','dialogueId':'dialogue_c2_porter','serviceGuards':['前三目标完成','main active','交接锚点可达']},
 {'id':'binding_c2_resume_handoff','entryNodeId':'node_c2_porter_handoff_done','dialogueId':'dialogue_c2_porter','serviceGuards':['goal_c2_handoff已达成','main active'],'purpose':'交架后关闭/刷新仍能完成主线，不再交架或重发奖励。'},
 {'id':'binding_c2_resume_ending','sequenceId':'ending_c2','serviceGuards':['main completed','ending presentation pending'],'purpose':'恢复或跳过演出均只确认seen，不发奖。'}]

def templ(id,actionType,constants,bindings,trigger,npcId=None,shopId=None):
 data['interactionBindings'].append({'id':'binding_c2_'+id,'actionType':'c2/'+actionType,'constantPayload':constants,'bindPayload':bindings,'trigger':trigger,**({'npcId':npcId} if npcId else {}),**({'shopId':shopId} if shopId else {})})
templ('resolve_cast','resolveCast',{}, {'castId':'savedPendingCast.id','outcome':'fishingUI caught/lost/cancelled'},'由钓鱼UI提交同一杆状态；所得物品与数量完全由服务决定。')
templ('sell_lines','sell',{}, {'shopId':'当前真实店铺id','lines':'已确认拥有的itemId/数量/唯一实例id'},'成交确认，整笔原子结算。')
templ('barter','barter',{'shopId':'shop_c2_general','barterId':'barter_c2_bell_for_cup'},{'instanceId':'owned treasure_c2_silent_bell 的永久实例id'},'铃故事resolved、无任务持有需求、玩家明确解保护后确认一次交换。','npc_c2_merchant','shop_c2_general')
templ('buyback','buyback',{}, {'shopId':'凭证原店铺id','receiptId':'当前可回购售出凭证id'},'确认找回同一实物；换物不进误售回购。')
templ('unprotect','toggleProtection',{'protected':False},{'instanceId':'玩家选中owned藏物永久实例id'},'明确点击解除保护；仅声明意愿，服务再检查借用/任务保护。')
for op in ['advanceRepair','cancelRepair','completeRepair']:
 templ(op,op,{'repairId':'repair_c2_cargo'},({'stepId':'当前已按顺序操作的P0步骤ID'} if op=='advanceRepair' else {}),'修缮UI调用；不是对白自动判定四步完成。')
for s in C['stories']:
 suffix=s['id'].removeprefix('story_c2_')
 templ('known_'+suffix,'advanceStory',{'storyId':s['id'],'stageId':'stage_c2_'+suffix+'_known'},{},'首次获得物品后记录known；03须在同一获得事务设置或幂等补记，不能因为UI未打开而漏解锁。')
 templ('read_'+suffix,'readStory',{'storyId':s['id'],'contentVersion':1},{'sectionId':'本故事section.id','paragraphIndex':'本节0起始可见段落位置'},'书页读到对应段落；不从点击打开直接标全文已读。')
for seq in ['intro_c2','ending_c2']:
 templ('ack_'+seq,'ackPresentation',{'sequenceId':seq},{},'自然结束或用户跳过同一确认，不在镜头里发奖励。')

data['presentations']=[
 {'id':'intro_c2','title':'一副旧架，四种说法','durationSeconds':18,'reading':'mandatory','skippable':True,'rewardActions':[],
  'shots':[
   {'id':'shot_c2_intro_01','start':0,'end':5,'framing':'全景','anchorId':'anchor_c2_entry','visual':'由虹桥方向沿临河街望岸边浅桶、过往担具与木架；不穿屋、不变更原画邻接。','lines':[{'speakerId':'npc_c2_fisher','text':'鱼入桶，担也得放稳。'}]},
   {'id':'shot_c2_intro_02','start':5,'end':11,'framing':'近景','anchorId':'anchor_c2_repair','visual':'石伯扶架，王小满端茶经过；对白标注人物名，四人初识无需逐一看长介绍。','lines':[{'speakerId':'npc_c2_porter','text':'理绳便好，这道伤莫涂。'},{'speakerId':'npc_c2_food_vendor','text':'笼揭了，先坐。'}]},
   {'id':'shot_c2_intro_03','start':11,'end':18,'framing':'特写后切中景','anchorId':'anchor_c2_merchant','visual':'特写缺口盏与一只不响的小铃（只展示石伯持物，无发奖），切顾娘子望向旧架；末句阿青旁白可用字幕。','lines':[{'speakerId':'npc_c2_merchant','text':'石伯，这回还不肯交么？'},{'speakerId':'player_aqing','text':'一副旧架，为何人人说得不同？'}]}],
  'skipSummary':'四人相识：鲁七卖鱼，石伯待修旧架，顾娘子来收架，王小满供饭茶。先问石伯差事。','onFinished':act('ackPresentation',sequenceId='intro_c2')},
 {'id':'ending_c2','title':'把担稳稳放下','durationSeconds':12,'reading':'mandatory','skippable':True,'rewardActions':[],
  'shots':[
   {'id':'shot_c2_ending_01','start':0,'end':4,'framing':'近景','anchorId':'anchor_c2_delivery','visual':'顾娘子扶架，白痕还在，空篓稳放；远景只见城门，不穿门。','lines':[{'speakerId':'npc_c2_merchant','text':'旧账清了，架给来客歇担。'}]},
   {'id':'shot_c2_ending_02','start':4,'end':8,'framing':'特写','anchorId':'anchor_c2_delivery','visual':'王小满先擦案边再转盏口，石伯伸手接茶；所有表演不改变库存/钱。','lines':[{'speakerId':'npc_c2_food_vendor','text':'茶放这里，稳当。'}]},
   {'id':'shot_c2_ending_03','start':8,'end':12,'framing':'中景转全景','anchorId':'anchor_c2_delivery','visual':'石伯松开按白痕的手，鲁七在岸街背景招呼；恢复借用前相机与输入。四人表演演员由09安排，不能复制第二份交互NPC。','lines':[{'speakerId':'npc_c2_porter','text':'你先游你的，我这脚不赶。'}]}],
  'skipSummary':'旧架已交给顾娘子，旧账说清。报酬按先前选择保留，风物志继续可读；留在D区自由游历。','onFinished':act('ackPresentation',sequenceId='ending_c2')}]

data['activityText']={
 'fishing':{'beforeCast':'每杆耗精力4。站在安全岸边，可选简易收杆。','waiting':'浮子轻晃，先等一等。','bite':'浮子沉了——收杆。','tensionHigh':'稍松一松。','tensionLow':'再提一点。','lost':'鱼脱钩了。此杆已耗精力4，竿不损坏；可换简易模式。','cancelled':'已收起钓竿，此杆不发物，精力不再扣第二遍。','tutorialCaught':'第一尾鱼已入桶，物件卡也记下了。带给鲁七可卖。','tokenCaught':'鲁七授权取回的木牌已赠留；它不抵鱼钱，三道深痕与五点浅痕可再问他。','reliefCaught':'救急一杆得普通鱼。卖给鲁七，所得先偿饭钱。','savedCaught':'所得已收入行囊并登记风物志。'},
 'repair':{'prepare':'总耗精力18，开始预留，做成才扣；取消释放预留，已经确认的步骤保留。','steps':[{'id':'step_c2_inspect','title':'辨认松处','instruction':'白痕为表面擦伤；找松动绑缚与歪垫脚。贯穿裂木不属于本次安全用具。','success':'看清了。伤痕留着，松处要修。','failure':'表面白痕不是今日松动处；再看绑缚与垫脚。'},{'id':'step_c2_align','title':'摆正垫脚','instruction':'空载摆正支撑，使架脚坐实。','success':'左右坐实了。','failure':'垫脚还歪，先放平再做下一步。'},{'id':'step_c2_fix','title':'理好绑缚','instruction':'把绳段放回正确位置并固定。此为教学简化，不声称复原古法绳结。','success':'绑缚就位，绳头收好。','failure':'绳段交错了，重新摆好；本步不额外扣精力。'},{'id':'step_c2_test','title':'空载试稳','instruction':'请石伯试压摇动，确认后结算。','success':'架稳了，石伯肯松手了。','failure':'还有晃动，再检查前面已完成的步骤。'}],'paused':'已暂停修缮；预留精力释放，确认过的步骤保留。','resumed':'从已确认的步骤继续，不重复扣前面的精力。','completed':'修缮完成，18精力一次结算。请选择16文工钱或缺舌铜铃，只领一种。','rewardAlreadyChosen':'这回报酬已经交妥，不再重复领。'},
 'commerce':{'confirmSell':'确认卖出这些实物？记录仍留在风物志。','confirmBuy':'按显示价钱购入这件物品？','confirmBarter':'将这一只铜铃换给顾娘子，收下青釉盏？交换后仍可读铃的故事。','confirmBuyback':'按原售出总价取回这笔实物？同一实例，不新造藏物。','confirmUnprotect':'解除这件藏物的自选保护？借物与仍须持有的任务物不能解除。','cancelled':'未成交，物与钱都照旧。','settledDebt':'收入先偿饭钱，余款入行囊；两项同次记清。','noStock':'这件已经交出，铺里没有第二件。'},
 'errors':{
 'unknown-action':'这项操作还不能在这里办理。','invalid-action':'数目或所选项目不合，请重新确认。','chapter-locked':'先把虹桥那桩差事和过桥收束完成。','chapter-not-entered':'这桩买卖与用具活动在临河街办理。','unknown-entity':'没有找到这项物件或人物，请关闭后再试。','not-reachable':'要到本人或用具跟前，隔着屋与车不能办理。','invalid-quantity':'持有数量与选中数目不合。','insufficient-coins':'铜钱不够，先卖鱼或收杂物；也可先留着不买。','insufficient-energy':'气力不足以做这项活。仍可走路与交谈，去王家补给即可。','not-owned':'这件实物不在你手里，不能拿来交出。','protected-item':'借物、仍有任务用途或尚未解除保护的藏物不能交出。','wrong-shop':'鱼交鲁七，杂物交顾娘子；饭茶到王家。','out-of-stock':'只有这一件，铺里已经没有余货。','stale-offer':'店里物件已变，重新看清这一单。','duplicate-transaction':'这笔已经记清，不能再领或再交。','cast-pending':'上一杆还未收好，先结束这一杆。','unknown-cast':'这一杆已结束，不能再次领取所得。','activity-busy':'手上这项先结束，再换下一件事。','repair-not-ready':'旧架还没有完整试稳，先做完已提示的步骤。','reward-already-chosen':'报酬已经择定，另一份不能再领。','quest-not-ready':'还有差事未做妥，请看任务追踪。','story-locked':'先取得这件藏物，便能读它的故事。','invalid-position':'这个落脚处还不能安全使用，请回到已提示的岸街。','relief-not-eligible':'尚有饭钱、气力或未清旧账，不能再赊这一份；欠账又无力可问鲁七偿债差事。','save-pending':'上一笔还在记档，先不要再次交易。','save-failed':'这一笔尚未保存，物与钱没有按成功发放；请重试保存，勿再次点成交。'}}

data['mainRoutes']={
 'common':['enterChapter2','acceptQuest quest_c2_main','acceptQuest quest_c2_fishing_intro','startCast tutorial → resolveCast caught','sell one owned fish','acceptQuest quest_c2_repair','beginRepair → four advanceRepair → completeRepair','chooseReward','handOffCargo at anchor_c2_delivery','completeMain','ackPresentation ending_c2'],
 'cash':{'reward':{'coins':16},'requiresTreasures':False,'laterBellOfferId':'offer_c2_bell_later','laterBellPrice':20},
 'bell':{'reward':{'itemId':'treasure_c2_silent_bell','quantity':1},'requiresReading':False,'optionalBarterId':'barter_c2_bell_for_cup'},
 'allowPreacceptedFishingAndTrade':True,'requiresFutureRegion':False,'longStoriesMandatory':False,
 'timingDesign':[{'phase':'初入/开场/问石伯','seconds':[70,110]},{'phase':'到鲁七、借竿、一杆教学及卖鱼','seconds':[150,220]},{'phase':'沿街观赏、必要提示及到旧架','seconds':[150,220]},{'phase':'四步修缮/报酬','seconds':[130,200]},{'phase':'到门前/交接/结局','seconds':[180,250]}],
 'timingStatus':'节奏预算，非实测；必要阅读和交易计入墙钟。可选补给预留60–100秒；迷路/失败/设备延迟仍须真人首玩验证。'}

# Persist complete data and a human-readable text version from the same source.
(OUT/'content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(OUT/'index.js').write_text("import definition from './content.json' with {type:'json'};\nconst freeze = v => {if(v && typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};\nexport const content=freeze(definition);\nexport const getStory=id=>content.stories.find(s=>s.id===id)??null;\nexport const getDialogue=id=>content.dialogues.find(d=>d.id===id)??null;\nexport default content;\n")
DOC=ROOT/'docs/chapter2/content'
md=['# 第二关《不响的铃》完整内容稿','\n2026-10-01｜契约1.0.0｜书生阿青｜D区｜全部个人经历与事件为游戏虚构。','\n## 故事梗概','\n石伯不肯交出丁伯的旧木架，也不许抹掉一道白痕。顾娘子说要“收旧架”，鲁七记得他年轻时只听铃催脚，小满母亲却记得那天端的是一只旧茶盏。阿青先学钓鱼与一笔买卖，再动手试稳绑缚；门前交接才发现货损早已赔清，收架是给赶脚人留个歇担处。物件留伤，往来的人可以开始下一段日常。','\n主线不要求全收集、刷稀有或读完故事；现金与铜铃都能结束差事。']
for n in data['npcs']:
 md += ['\n## '+n['name']+' · '+n['occupation'],'\n'+n['description'],'\n过往：'+n['past'],'\n动作：'+n['behaviorCue'],'\n当下：'+n['currentDifficulty'],'\n关系：'+n['relationships']]
for p in data['presentations']:
 md+=['\n## 演出：'+p['title']+f"（{p['durationSeconds']}秒，可跳过）"]
 for shot in p['shots']:
  md += [f"\n{shot['start']}–{shot['end']}秒｜{shot['framing']}｜{shot['anchorId']}\n\n{shot['visual']}"]
  for l in shot['lines']:md += ['\n'+l['speakerId']+'：'+l['text']]
 md+=['\n跳过摘要：'+p['skipSummary']]
for d in data['dialogues']:
 name=next(n['name'] for n in data['npcs'] if n['id']==d['npcId']);md+=['\n## 全对白：'+name]
 for n in d['nodes']:
  md+=['\n### '+n['id']+'（'+n['reading']+'）','\n'+n['text']]
  if n.get('uiNote'):md+=['\n界面提示：'+n['uiNote']]
  for ch in n['choices']:
   md+=['\n- '+ch['text']+' → '+(ch['nextNodeId'] or '关闭/交由局部界面')+(('；动作 '+ch['action']['type']) if ch.get('action') else '')]
for s in data['stories']:
 md+=['\n## 藏物故事：'+s['title'],'\n获得提示：'+s['acquisitionTip'],'\n物件卡：'+s['objectCard'],'\n正文可选，首次取得即可解锁；问人仅补记阶段，不要求读完通关。']
 for section in s['sections']:
  md+=['\n### '+section['title']+' · '+section['id']]
  for pid,paragraph in zip(section['paragraphIds'],section['paragraphs']):md+=['\n<!-- '+pid+' -->\n'+paragraph]
 md+=['\n史料边界：'+s['historicalNote']]
md+=['\n## 物件与饭食说明']
for i in data['items']:md+=['\n### '+i['name']+' · '+i['id'],'\n'+i['shortDescription'],'\n形制：'+i['shapeBrief'],'\n边界：'+i['cultureNote']]
md+=['\n## 操作、暂停、失败与异常文字','\n以下为局部界面和系统反馈，不让宋人对白承担代码/存档术语。','\n```json\n'+json.dumps(data['activityText'],ensure_ascii=False,indent=2)+'\n```']
(DOC/'第二关_不响的铃_完整剧情与故事.md').write_text('\n'.join(md)+'\n')
