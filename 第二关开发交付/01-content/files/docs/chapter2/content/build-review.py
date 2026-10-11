import json, html
from pathlib import Path
D=Path('docs/chapter2/content'); data=json.loads(Path('src/chapter2/content/content.json').read_text())
def dump(v): return json.dumps(v,ensure_ascii=False,indent=2)
source=['# 文化来源与待考边界','\n本关据张择端本的 D 区邻接与生活环境创作。四人的姓名、年龄、过去、三物旧主人与交接事件均为游戏虚构；不为原画人物认定身份。原画可见、古籍背景、现代研究解释、原创故事分别标注。\n']
for s in data['sources']:
 source.extend([f"## {s['id']} · {s['title']}",f"\n类别：{s['kind']}；篇目/定位：{s['locator']}。",f"\n来源：[{s['title']}]({s['url']})" if s['url'] else '\n来源：本关原创，不是史料。',f"\n适用：{s['applicableScope']}",f"\n不可推导：{s['limitations']}"])
 if s.get('shortQuote'): source.append(f"\n核对短引：『{s['shortQuote']}』。")
source.append('''\n## 检索记录与待考项

核对日期：2026-10-01。已使用检索技能；豆包检索脚本在发起查询前出现 `AGENT_PLAN_URL` 未定义，改用可用网页搜索与页面读取。故宫原作收藏页直接读取未成功，以检索结果、故宫名画记页面和已有原图局部观察表交叉核对；未据此声称馆方认定任何 NPC 身份。

《东京梦华录》为南宋追记北宋东京的著作，生活背景不能径直落到原画某一店铺。本关不认定 S04 官仓、不认定 S07 专业古玩铺、不认定 S09 特定车名。门前交接留在 D 区，不要求进入城内 E/F。

鲤、鲫在北宋文献中有名，精确汴河物种谱、古代垂钓分布仍待考；钓获率与价钱是玩法配置。鱼形采用可辨外观，不采药效与化生说。借用竹竿、基础饵、私用木牌及小铜扣是设计形制，不称考古复原。青釉小盏借鉴宋器的口、腹、圈足，不作窑口与年代鉴定。

铜铃明确为虚构私用小铃：《东京梦华录》太平车记载的是铁铃。木牌两面的记号是鲁七母亲的私用习惯，不推为宋人通行制度。四步修缮是易懂教学，不教授实物承重工程，不给宋代结绳法附会名称。

《哑舍》仅启发“收物并读旧人故事”的方向，本稿无其人物、器物、现成情节或超自然体系。以上待考通过标明边界处理，不阻碍本关三篇完整正文；若以后获得器物考古证据，可调整外观注释，不改成玩家必做考据任务。
''')
(D/'文化来源与待考边界.md').write_text('\n'.join(source))
table=['# 节点、条件、动作与奖励表','\n所有 ID 与动作采用 P0 契约 1.0.0。条件用于展示与导向；服务仍须校验状态与原子结算。关闭、取消、失败不跳转成功节点，不发奖。`intent` 是内容的 UI 意图，不能当服务动作发送。\n','## 主线与报酬','\n两条路径共有：入区 → 接主线 → 借竿教学 → 钓得普通鱼并真实卖出一尾 → 修缮四步 → 领取一种报酬 → 门前交架 → 完成本关 → 确认结局。已先钓/先卖者读取保存进度，不重新要求刷鱼。\n','|事项|条件|效果|边界|','|---|---|---|---|','|现金报酬|修缮成功且未领取|16 文一次|与铜铃互斥；后续可用20文取得一次铜铃|','|铜铃报酬|修缮成功且未领取|铜铃唯一实例一次|不另给16文；不要求读完故事或换盏|','|木牌|接受取牌支线，在指定浅岸完成取物|归还确认后赠留、故事解锁|固定一次，不靠随机珍稀掉落|','|青釉盏|18文购买，或满足保护/任务条件后用铜铃换物|唯一实例、故事解锁|不要求走两条取得路径；现金购铃与铃换盏为可选|','|门前交接|三个前置目标完成|记录交架，再完成主线|交架后刷新可续办；结局不再发奖|','|故事阅读|首次取得物品|全文可读，按节段记录位置|读全文不推进主线；售出不抹去收藏历史|']
for dlg in data['dialogues']:
 table.extend([f"\n## {dlg['id']} / {dlg['npcId']}",'\n|节点 / 阅读|选择|条件|动作或UI意图|成功去向|','|---|---|---|---|---|'])
 for n in dlg['nodes']:
  for c in n.get('choices',[]):
   compact=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':')).replace('|','\\|')
   table.append(f"|{n['id']} / {n.get('reading','optional')}|{c['id']}：{c['text']}|`{compact(c.get('requires',[]))}`|`{compact(c.get('action',c.get('intent',{})))}`|{c.get('nextNodeId') or '关闭/交给对应UI'}|")
for name in ['entryBindings','interactionBindings','storyRules','mainRoutes']:
 table.append(f'\n## {name}\n\n```json\n{dump(data[name])}\n```')
(D/'节点与奖励条件表.md').write_text('\n'.join(table))
(D/'integration-notes.md').write_text('''# 01 内容装配说明（契约 1.0.0）

本分支交付4人、4任务/4主线目标、14物品、46对白节点/125选择、3篇完整故事、13条来源。仅内容已就绪，未接入真实游戏。

## 读取与显示

入口为 `src/chapter2/content/index.js`，导出冻结的数据、getStory/getDialogue。稳定ID、动作、经济配置不变；本稿只确定显示名、故事与文本。NPC 的 `text` 是口语；`uiNote` 承载数值和操作说明。`reading=mandatory` 标出主线提示，其余对白与三篇长文可选。物品描述中的器物形制是资产制作参考，不能宣称模型已验收。

`intent` 仅是打开现有面板、导航、查看故事等 UI 注释，不能向状态服务发送新动作。选择中有 action 时必须等真实服务成功再跳转或打开 UI；错误保留当前节点并显示 activityText 对应错误。无 hardcoded txnId；交易数量、唯一实例ID、读到的段落位置和交易确认由真实 UI 绑定。没有凭空生成的实例或服务接口。

`entryBindings.serviceGuards` 是适配器/服务应满足的文字化守卫，不是新增条件枚举。公共状态仍由03实现并校验。修缮完成且 rewardChoice 为空才进入领赏节点；交架后 main active 可从 handoff_done 恢复；完成主线但结局 pending 应恢复或跳过结局。

## 必须保留的结算语义

- 借竿与基础饵由接受教学的服务动作给予；不能出售借用钓具。教学与救济保鱼由服务门控，不能菜单重复选择刷保鱼。教学鱼与真实一次出售足以完成必要教学。
- 两种鱼均可售。卖鱼成交成功才推进目标；先钓后接、先卖后接不得重置历史，按P0服务记录判定。
- 先接受修缮，再 beginRepair 预留18精力；按四个冻结步骤操作。失败、暂停、取消由服务恢复或结算，不从对白自动完成。木架白痕为表面旧磨痕，本轮修复松绑，不以抹白痕表示修好结构。
- 报酬互斥且仅一次：16文或缺舌铜铃。现金后留20文购铃机会；领铃路径不强迫换盏。独一物均由服务生成稳定实例。
- known 在首次取得的同一事务标记或幂等补记，不能依赖开书。全文从首次收藏即可读；resolved用于相关回访，不用读全文解锁主线。已售/换出实物仍保留故事、已读与位置；换物和误售回购分开。
- 木牌支线是物主授权、安全浅岸固定一次取回；不要求随机稀有物，也不要求访问E/F。完成本关不需要木牌、盏或任何长故事。
- 石伯自行携架，阿青到固定门前锚点办理；不加入搬货、护送、限时、额外精力消耗。handOffCargo与completeMain之间刷新可恢复，结局自然结束与跳过均只确认演出，不支付额外奖励。
- 赊食4文债是P0救济规则；普通收入按服务规则先偿债，负债且精力不足时救济收入仅用于清债，不能无限套利。

## 场景与镜头对接

02：钓点参考S03安全岸；旧架参考S08/S09临街搬运；顾摊参考S07；王家参考S04/S06。S12仅远望门与门前交接，不入新区域。以契约anchor绑定，勿照原画像素硬填3D坐标。模型、触发半径与可达性需真实场景验收。

09：intro_c2为18秒，ending_c2为12秒，数据已逐镜写出全/近/特写、观察动作与字幕。最终镜头位置与避障待装配。使用四个核心NPC，不另生重复可交互人物；已验收移动/相机及第一关行为只读保持。

## 节奏预算与待验证

入区70–110秒；一杆教学和卖鱼150–220秒；观赏与移步150–220秒；修缮领赏130–200秒；门前交接结局180–250秒。合计680–1000秒（11分20秒至16分40秒），若补给另预留60–100秒，为12分20秒至18分20秒。这是设计预算，不是20分钟已达成的测量。

mandatory节点正文加uiNote共694字（含互斥分支及恢复提示），不代表一趟全部阅读，也不代表全部必需文本：选项、活动提示与演出字幕另计。墙钟须包含必需阅读、交易与走路，不能扣阅读取巧。三篇可选正文868–909字/篇，通关后自行阅读，不纳入主线必做流程。

待02场景、03状态、04–07玩法UI、08资产、09演出、10装配核实动作结果/保护/迁移/存档回读/相机恢复。尚未做真实整合、游戏性能测量、真人首玩；本交付不宣称这些已通过。史料待考见文化来源文档，均已明确虚构或适用边界，没有空白正文占位。
''')
# Read-only preview embeds the exact delivered data, and runs no gameplay actions.
blob=json.dumps(data,ensure_ascii=False).replace('</','<\\/')
page='''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>不响的铃 · 内容审稿</title><link rel="icon" href="data:,"><style>
:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#ece7dc;color:#302e27;font:17px/1.9 system-ui,sans-serif}header,main{max-width:1060px;margin:auto;padding:36px 34px}header{padding-bottom:10px}h1{font:500 42px/1.3 Georgia,serif;margin:14px 0}h2{font-size:25px;font-weight:550}h3{font-size:20px}p{max-width:820px}small,.muted{color:#6f6759;font-size:13px}nav{display:flex;gap:10px;flex-wrap:wrap;margin:25px 0}button{font:inherit;padding:8px 22px;border:1px solid #aa9a80;background:#f7f3e9;color:#382d20;border-radius:3px;cursor:pointer}button[aria-pressed=true]{background:#5c4933;color:white}article{background:#faf7ef;padding:24px 30px;margin:0 0 24px;border-left:3px solid #b99c6c}blockquote{border-left:2px solid #b99c6c;margin:12px 0;padding:10px 18px;background:#efe9da}.pid{display:block;font:11px/1.5 monospace;color:#8e8271}a{color:#805523}pre{font-size:12px;white-space:pre-wrap;overflow-wrap:anywhere}footer{padding:30px;text-align:center;color:#756b5b;font-size:13px}@media(max-width:650px){header,main{padding:20px}h1{font-size:32px}article{padding:20px}}
</style><header><small>D区 · 虹桥至城门之间 / 契约 1.0.0</small><h1>不响的铃</h1><p>一副不肯交出去的旧架，一枚再不响的铃。阿青沿街问过四个人，才知道欠着的未必是钱。</p><p class="muted">01 内容审稿预览 · 尚未接入游戏 · 人物与旧事为原创 · 长故事可选</p><nav><button data-view="npcs" aria-pressed="true">四位人物</button><button data-view="stories">三篇藏物故事</button><button data-view="dialogues">完整对白</button><button data-view="sources">考据与边界</button><button data-view="main">主线与报酬</button></nav></header><main id="content"></main><footer>只读审稿页，不调用游戏状态服务，不写存档，不模拟试玩或通关。</footer><script id="data" type="application/json">DATA</script><script>
const data=JSON.parse(document.getElementById('data').textContent);const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const p=s=>'<p>'+e(s)+'</p>';const code=s=>'<pre>'+e(JSON.stringify(s,null,2))+'</pre>';function render(v){let body='';if(v==='npcs')body=data.npcs.map(n=>'<article><small>'+e(n.occupation)+' / '+e(n.id)+'</small><h2>'+e(n.name)+'</h2>'+p(n.description)+p('过往：'+n.past)+p('眼下：'+n.currentDifficulty)+p('相识：'+n.relationships)+p('动作：'+n.behaviorCue)+'<p class="muted">'+e(n.historicalNote)+'</p></article>').join('');if(v==='stories')body=data.stories.map(s=>'<article class="story"><small>可选正文 / '+e(s.id)+'</small><h2>'+e(s.title)+'</h2><blockquote>'+e(s.acquisitionTip)+'</blockquote>'+p(s.objectCard)+s.sections.map(t=>'<section><h3>'+e(t.title)+'</h3>'+t.paragraphs.map((x,i)=>'<p class="story-paragraph">'+e(x)+'<span class="pid">'+e(t.paragraphIds[i])+'</span></p>').join('')+'</section>').join('')+'</article>').join('');if(v==='dialogues')body=data.dialogues.map(d=>'<h2>'+e(d.id)+'</h2>'+d.nodes.map(n=>'<article><small>'+e(n.id)+' / '+e(n.reading)+'</small>'+p(n.text)+(n.uiNote?'<blockquote>'+e(n.uiNote)+'</blockquote>':'')+code(n.choices)+'</article>').join('')).join('');if(v==='sources')body=data.sources.map(s=>'<article class="source"><small>'+e(s.kind)+' / '+e(s.id)+'</small><h2>'+e(s.title)+'</h2>'+p(s.locator)+p('可用于：'+s.applicableScope)+p('不可推导：'+s.limitations)+(s.url?'<a href="'+e(s.url)+'">查看来源</a>':'')+'</article>').join('');if(v==='main')body='<article><h2>两种报酬都可通关</h2>'+p(data.mainRoutes.timingStatus)+code(data.mainRoutes)+'</article><article><h2>开场与结局逐镜</h2>'+code(data.presentations)+'</article>';document.getElementById('content').innerHTML=body;document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===v)));}document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click',()=>render(b.dataset.view)));render('npcs');
</script></html>'''
(D/'preview.html').write_text(page.replace('DATA',blob))
print('Created source notes, node table, integration notes and read-only preview')
