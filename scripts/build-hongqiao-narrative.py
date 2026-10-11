"""Rebuild Step 5 additions from the approved local manuscripts; no remote generation."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[1]
docs=Path(sys.argv[1]) if len(sys.argv)>1 else root.parent.parent/'清明上河图'
plot=(docs/'虹桥急情_完整剧情稿_v1.0.md').read_text();stories=(docs/'虹桥人物故事集_通关解锁版_v1.1.md').read_text();base=json.loads((root/'src/hongqiao/config.json').read_text())
blocks={m.group(1):m.group(2) for m in re.finditer(r'^### (HQ_\d+) [^\n]+\n(.*?)(?=^### HQ_|^## \d+\.|\Z)',plot,re.M|re.S)}
# Exact paragraph/title/source audit: existing story config is the sole runtime source.
audit=[];introductions={}
for i,block in enumerate(re.split(r'^## [二三四五]、',stories,flags=re.M)[1:]):
 body=block.split('**回访引入句**')[0];sections=re.findall(r'^### \d\. ([^\n]+)\n(.*?)(?=^### |\Z)',body,re.M|re.S);story=base['stories'][i]
 assert len(sections)==3
 for j,(title,content) in enumerate(sections):
  paragraphs=[p.strip() for p in re.split(r'\n\s*\n',content.strip()) if p.strip()]
  assert title==story['sections'][j]['title'] and paragraphs==story['sections'][j]['paragraphs'],story['storyId']
 note=re.search(r'\*\*取材小签\*\*：([^\n]+)',block)[1];assert story['sourceNotes']==[note]
 introductions[story['npcId']]=re.search(r'\*\*回访引入句\*\*：“([^\n]+)”',block)[1]
 audit.append({'storyId':story['storyId'],'sections':3,'paragraphs':sum(len(s['paragraphs']) for s in story['sections']),'exactMatch':True,'sourceNotesMatch':True})
# Preserve all six storyboard table columns verbatim as presentation metadata.
rows=[line for line in blocks['HQ_00'].splitlines() if re.match(r'\| 0[1-9] /',line)]
times=[0,3,5,8,10,14,17,20,27,30]
shots=[]
for i,line in enumerate(rows):
 cells=[v.strip() for v in line.strip('|').split('|')]
 shots.append({'id':f'HQ_00_shot_{i+1:02}','start':times[i],'end':times[i+1],'timing':cells[0],'framing':cells[1],'camera':cells[2],'action':cells[3],'audio':cells[4],'cut':cells[5]})
assert len(shots)==9
quoted=lambda text:[re.sub(r'^>\s?','',s).strip() for s in text.splitlines() if s.startswith('>') and s.strip('> ')]
ending=quoted(blocks['HQ_43'].split('完成卡：')[0])
journal=quoted(blocks['HQ_43'].split('书生的见闻正文（创作，不作为史料）：')[1])[0]
card=quoted(blocks['HQ_43'].split('完成卡：')[1].split('书生的见闻正文')[0])
choices={}
for d in base['dialogues']:
 if d['npcId']==base['quest']['giverId']:continue
 labels=re.findall(r'^- “([^”]+)” →',blocks[d['sourceNode']],re.M)
 assert len(labels)==2
 choices[d['npcId']]={'confirm':labels[0],'followup':labels[1]}
phases=[]
for i,line in enumerate(l for l in blocks['HQ_42'].splitlines() if re.match(r'\| \d+–\d+ 秒',l)):
 cells=[v.strip() for v in line.strip('|').split('|')];a,b=map(int,re.findall(r'\d+',cells[0]));phases.append({'id':f'HQ_42_phase_{i+1}','start':a,'end':b,'action':cells[1],'audio':cells[2]})
data={'contentVersion':2,'intro':{'id':'HQ_00','title':'桥下惊呼','duration':30,'shots':shots,'autoStartWhenAdapterReady':True,'startAnchorId':'anchor_hq_ship_approach','endAnchorId':'anchor_hq_ship_wait'},'ending':{'id':'HQ_42','duration':20,'phases':phases,'startAnchorId':'anchor_hq_ship_wait','endAnchorId':'anchor_hq_ship_end'},'closing':{'id':'HQ_43','lines':ending},'completionCard':{'id':'hq_completion_card','lines':card},'journal':{'id':'journal_hq','title':'汴京见闻·虹桥','text':journal,'contentType':'书生见闻 · 游戏创作'},'choiceLabels':choices,'storyIntroductions':introductions,'guide':{'idleSeconds':90,'idleHint':'可在任务栏选择一位街坊，请他指路','initialHint':'去岸边问问发生了什么。','missing':{'item_hq_rope':'缆绳在何伯的货堆边。','item_hq_pole':'竹篙在阿成守着的工具架上。','item_hq_cloth':'护货布在方娘子摊侧。'},'culture':{'id':'explore_hq_bridge','codexId':'K02','anchorId':'anchor_hq_tools','offset':[0,0,1.6]}},'rewardCodexIds':['npc_hq_zhou','K01','K03','journal_hq'],'audit':audit}
(root/'src/hongqiao/narrative.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print(json.dumps(audit,ensure_ascii=False))
