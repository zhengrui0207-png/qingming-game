import './progress-ui.css';
import {questStage} from './state.js';

export function createProgressUI({config, store, development, canOpen, onOpen, onClose, toast}) {
  const el = (tag, text, parent) => {const node = document.createElement(tag); if (text !== undefined) node.textContent = text; parent?.append(node); return node;};
  const button = (text, parent, action) => {const b = el('button', text, parent); b.type = 'button'; b.onclick = action; return b;};
  const dialog = el('dialog', undefined, document.body); dialog.id = 'hq-book'; dialog.setAttribute('aria-label', '汴京见闻与行囊');
  const notice = el('div', undefined, document.body); notice.id = 'hq-save'; notice.setAttribute('role','status');
  const openButton = button('见闻 / 行囊 I', document.querySelector('.top-actions'), () => open()); openButton.id = 'hq-open';
  let leaf=0,storyLeaf=0;
  let page = 'inventory', currentStory = null, reader = null, saveTimer, opened = false, pendingPermit = null, replayIntro=null,replayEnding=null;
  function renderStatus() {
    const status = store.getStatus(); notice.replaceChildren();
    notice.hidden = status.saved && !['recovered','migrated'].includes(status.kind) || status.kind === 'new';
    el('span',status.message,notice);
    if (!status.saved && status.kind !== 'new') button('重试保存',notice,() => store.retrySave());
    else button('知道了',notice,() => {notice.hidden = true;});
  }
  function recordPosition() {
    clearTimeout(saveTimer);
    if (!reader || !currentStory || !dialog.open) return;
    const rect = reader.getBoundingClientRect();
    const paragraphs = [...reader.querySelectorAll('[data-section]')].filter(p=>!p.hidden);
    const visible = paragraphs.filter(p => {const r=p.getBoundingClientRect(); return r.top < rect.bottom && r.bottom > rect.top;});
    const last = paragraphs.at(-1), lastRect = last?.getBoundingClientRect();
    const target = lastRect && lastRect.bottom <= rect.bottom + 1 && lastRect.top >= rect.top ? last : visible[0];
    if (target) store.dispatch({type:'readParagraph', storyId:currentStory, sectionId:target.dataset.section, paragraphIndex:Number(target.dataset.index)});
  }
  function close() {recordPosition(); if (!opened) return; opened=false; dialog.close(); reader=null; currentStory=null; pendingPermit=null; onClose();}
  function open() {if (!canOpen()) return; if (opened) {close(); return;} onOpen(); opened=true; page='inventory'; render(); dialog.showModal();}
  function showPage(next) {recordPosition(); reader=null; currentStory=null; pendingPermit=null; page=next;leaf=0; render();}
  function render() {
    const state = store.getState(); dialog.replaceChildren();
    const nav = el('nav',undefined,dialog);
    button('行囊',nav,() => showPage('inventory')); button('见闻图鉴',nav,() => showPage('codex')); button('人物故事',nav,() => showPage('stories')); button('关闭 Esc',nav,close);
    if(replayIntro&&(state.introSeen||state.quests[config.quest.id]?.status==='completed'))button('回顾开场',nav,()=>{close();replayIntro();});
    if(replayEnding&&state.quests[config.quest.id]?.status==='completed')button('回顾过桥',nav,()=>{close();replayEnding();});
    if (page === 'permit') {
      const permission = config.permissions.find(p => p.id === pendingPermit), npc = config.npcs.find(n => n.id === permission.grantedBy);
      el('h2','开发测试 · 模拟取用许可',dialog); el('p',`${npc.name}答应借出物品。确认仅授予取用许可，物品仍需走近后拾取。`,dialog);
      button('确认取用许可',dialog,() => {store.dispatch({type:'grantPermission',permissionId:permission.id});close();});
      button('取消，不授权',dialog,close); return;
    }
    if (page === 'inventory') {
      el('h2','行囊',dialog);el('small','当前持有数量；交出物品后，见闻仍会保留。',dialog);
      for (const item of config.items) {const row=el('article',undefined,dialog);el('h3',`${item.name} × ${state.inventory[item.id] ?? 0}`,row);el('p',item.description,row);}
    } else if (page === 'codex') {
      el('h2','汴京见闻',dialog);
      if (!state.unlockedCodexIds.length) el('p','尚无记录。取得物品后，会记下物品用途与借物人的简介。',dialog);
      for (const item of config.items.filter(i => state.unlockedCodexIds.includes(i.id))) {const row=el('article',undefined,dialog);el('h3',item.name,row);el('p',item.description,row);el('small','剧情道具 · 游戏创作',row);}
      for (const npc of config.npcs.filter(n => state.unlockedCodexIds.includes(n.id))) {const row=el('article',undefined,dialog),story=config.stories.find(s=>s.storyId===npc.storyId);el('h3',npc.name,row);el('p',story.summary,row);el('small','人物简介 · 人物及经历为艺术创作',row);}
      for (const culture of config.codex.filter(k => state.unlockedCodexIds.includes(k.id))) {const row=el('article',undefined,dialog);el('h3',culture.title,row);el('small',culture.contentType,row);el('p',culture.text,row);el('small',culture.sourceNotes,row);for(const source of culture.sources){const a=el('a',source.title,row);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';}}
    } else if (page === 'stories') {
      el('h2','虹桥人物',dialog);
      for (const story of config.stories) {
        const row=el('article',undefined,dialog),unlocked=state.unlockedStoryIds.includes(story.storyId);
        el('h3',`${config.npcs.find(n=>n.id===story.npcId).name} · ${story.title}`,row);
        if (state.unlockedCodexIds.includes(story.npcId) || unlocked) el('p',story.summary,row);
        if (unlocked) {
          const read=state.readStoryIds.includes(story.storyId),version=state.readContentVersions[story.storyId];
          el('small',read ? version===story.contentVersion?'已读':'故事已更新 · 保留旧版已读记录' : '未读',row);
          button('阅读 '+story.title,row,()=>readStory(story.storyId));
        } else {row.dataset.locked='true';el('small','完成「虹桥急情」后开放全文',row);}
      }
    }
    paginate();
    const status=el('small',store.getStatus().message,dialog);status.className='hq-book-status';
  }
  function pager(count,index,change){
    const footer=el('footer',undefined,dialog);footer.className='hq-pages';
    const prev=button('← 上一页',footer,()=>change(index-1));prev.disabled=index===0;
    el('span',`第 ${index+1} 页 / 共 ${count} 页`,footer).setAttribute('aria-live','polite');
    const next=button('下一页 →',footer,()=>change(index+1));next.disabled=index===count-1;
  }
  function paginate(){
    const articles=[...dialog.querySelectorAll(':scope > article')],count=Math.max(1,Math.ceil(articles.length/2));leaf=Math.min(leaf,count-1);
    const spread=el('div',undefined,dialog);spread.className='hq-book-spread';
    articles.forEach((article,i)=>{article.hidden=Math.floor(i/2)!==leaf;spread.append(article);});
    pager(count,leaf,value=>{leaf=value;render();});dialog.dataset.page=page;dialog.dataset.leaf=leaf;
  }
  function paginateStory(index){
    const paragraphs=[...reader.querySelectorAll('[data-section]')],count=Math.max(1,Math.ceil(paragraphs.length/2));storyLeaf=Math.max(0,Math.min(index,count-1));
    paragraphs.forEach((p,i)=>p.hidden=Math.floor(i/2)!==storyLeaf);
    for(const heading of reader.querySelectorAll('h3')){let next=heading.nextElementSibling,visible=false;while(next&&next.tagName!=='H3'){visible||=!next.hidden;next=next.nextElementSibling;}heading.hidden=!visible;}
    dialog.querySelector('.hq-pages')?.remove();pager(count,storyLeaf,value=>{recordPosition();paginateStory(value);});reader.scrollTop=0;dialog.dataset.leaf=storyLeaf;
    reader.classList.remove('hq-turn');void reader.offsetWidth;reader.classList.add('hq-turn');
  }
  function readStory(id) {
    recordPosition(); const state=store.getState(),story=config.stories.find(s=>s.storyId===id);
    if (!story || !state.unlockedStoryIds.includes(id)) return;
    currentStory=id; reader=null; page='reading'; dialog.replaceChildren();
    const nav=el('nav',undefined,dialog);button('返回人物故事',nav,()=>showPage('stories'));button('关闭 Esc',nav,close);
    el('h2',story.title,dialog);el('small',story.creationLabel,dialog);
    reader=el('div',undefined,dialog);reader.id='hq-reader';reader.tabIndex=0;reader.setAttribute('aria-label',story.title+'正文');
    for(const section of story.sections){el('h3',section.title,reader);section.paragraphs.forEach((text,index)=>{const p=el('p',text,reader);p.dataset.section=section.id;p.dataset.index=index;});}
    const notes=el('details',undefined,dialog);el('summary','取材与创作说明',notes);for(const text of story.sourceNotes)el('p',text,notes);
    const position=state.storyReadingProgress[id];
    const paragraphs=[...reader.querySelectorAll('[data-section]')];const index=position?paragraphs.findIndex(p=>p.dataset.section===position.sectionId&&Number(p.dataset.index)===position.paragraphIndex):0;paginateStory(Math.floor(Math.max(0,index)/2));dialog.dataset.page='reading';
    reader.addEventListener('scroll',()=>{clearTimeout(saveTimer);saveTimer=setTimeout(recordPosition,160);});
    // Merely opening the story does not mark it read.
  }
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  addEventListener('blur',recordPosition);
  addEventListener('pagehide',recordPosition);
  document.addEventListener('visibilitychange',recordPosition);
  store.subscribe(event=>{renderStatus();if(event.action.type==='collect'&&event.status.saved)toast('已获得：'+config.items.find(i=>config.instances.find(x=>x.id===event.action.instanceId)?.itemId===i.id).name);if(opened&&page!=='reading'&&page!=='permit')render();});
  renderStatus();
  if(development){
    const panel=el('details',undefined,document.body);panel.id='hq-dev';el('summary','虹桥开发测试',panel);
    el('small','正式流程请与附近人物交谈；以下仅用于状态测试。',panel);
    for(const permit of config.permissions){const npc=config.npcs.find(n=>n.id===permit.grantedBy);button('模拟'+npc.name+'授权',panel,()=>{if(!canOpen())return;if(!opened){onOpen();opened=true;dialog.showModal();}pendingPermit=permit.id;page='permit';render();});}
    button('模拟已接任务（样本）',panel,()=>{const s=store.getState();if(s.quests[config.quest.id]?.status!=='completed'){s.quests[config.quest.id]={status:'active'};store.restoreFixture(s);}});
    const status=el('small',undefined,panel);const update=()=>{const s=store.getState();status.textContent=`阶段 ${questStage(s,config)} · 许可 ${s.permissions.length}/3 · 已收集 ${s.worldState.collectedInstanceIds.length}/3`;};store.subscribe(update);update();
  }
  function openStories(id) {if(!opened)open();if(!opened)return;showPage('stories');if(id)readStory(id);}
  function openCodex() {if(!opened)open();if(opened)showPage('codex');}
  return {setReplayHandler:(fn,ending)=>{replayIntro=fn;replayEnding=ending;},open,close,isOpen:()=>opened,readStory,openStories,openCodex};
}
