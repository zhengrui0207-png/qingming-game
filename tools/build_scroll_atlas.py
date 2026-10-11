#!/usr/bin/env python3
"""Build vector annotations and an offline atlas; the source JPEG is unchanged."""
from pathlib import Path
import hashlib
import json
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output/full-scroll"
DATA = json.loads((OUT / "annotations.json").read_text())
IMAGE = OUT / DATA["image"]["file"]
assert hashlib.sha1(IMAGE.read_bytes()).hexdigest() == "5adcde2072c563ba48a4f2a8758f2b466e0e540b", "Incomplete or changed source image"
ZONES = DATA["zones"]
SCENES = DATA["scenes"]


def source_svg(rect, overlays="", attrs=""):
    vb = " ".join(map(str, rect))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" {attrs}><image href="original-scroll.jpg" x="0" y="0" width="38414" height="1800"/>{overlays}</svg>'


def zone_overlays(include_labels=False):
    parts = []
    for z in ZONES:
        x, y, w, h = z["bounds"]
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{z["color"]}" fill-opacity="0.035" stroke="{z["color"]}" stroke-width="4" vector-effect="non-scaling-stroke"/>')
    return "".join(parts)


def pins(prefix="", interactive=False):
    result = []
    for s in SCENES:
        x, y = s["point"]
        col = "#a9691b" if s["zone"] == "D" else "#426b6e"
        attrs = f' tabindex="0" role="button" aria-label="{s["id"]} {s["title"]}" data-scene="{s["id"]}" class="pin"' if interactive else ""
        result.append(f'<g id="{prefix}{s["id"]}" transform="translate({x} {y})"{attrs}><title>{s["id"]} {s["title"]} · {s["scope"]}</title><circle r="90" fill="{col}" stroke="#fff5df" stroke-width="2" vector-effect="non-scaling-stroke"/><text text-anchor="middle" dominant-baseline="central" font-size="88" font-weight="700" fill="white">{s["id"][1:]}</text></g>')
    return "".join(result)


def make_overview():
    scale = 2260 / 36800
    items = [f'<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="465" viewBox="0 0 2400 465"><style>text{{font-family:"PingFang SC","Microsoft YaHei",sans-serif}}.small{{font-size:24px;fill:#6b6251}}</style><rect width="2400" height="465" fill="#f5efdf"/><text x="70" y="67" font-size="42" fill="#302c23" font-weight="600">清明上河图 · 全卷六区</text><text x="2330" y="68" text-anchor="end" class="small">观卷方向：从右向左 ←</text><text x="70" y="107" class="small">张择端本画心｜彩色边界为游戏开发分区｜C 为第一关，D 为第二关</text>']
    items.append(f'<svg x="70" y="182" width="2260" height="111" viewBox="820 0 36800 1800"><image href="original-scroll.jpg" width="38414" height="1800"/>{zone_overlays()}</svg>')
    for z in ZONES:
        x, _, w, _ = z["bounds"]
        sx = 70 + (x - 820) * scale
        sw = w * scale
        center = sx + sw / 2
        items.append(f'<rect x="{sx:.2f}" y="310" width="{sw:.2f}" height="10" fill="{z["color"]}"/><text x="{center:.2f}" y="161" text-anchor="middle" font-size="28" fill="{z["color"]}" font-weight="700">{z["id"]} · {z["name"]}</text><text x="{center:.2f}" y="365" text-anchor="middle" font-size="24" fill="#302c23">{escape(z["phase"])}</text>')
    items.append('<text x="70" y="420" class="small">底图：Wikimedia Commons 完整扫描；作品核对：故宫博物院。排除装裱与题跋，不把画卷当作测绘地图。</text></svg>')
    return "".join(items)


def make_second_map():
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="855" viewBox="0 0 2400 855"><style>text{font-family:"PingFang SC","Microsoft YaHei",sans-serif}</style><rect width="2400" height="855" fill="#f5efdf"/><text x="70" y="65" font-size="42" font-weight="600" fill="#302c23">第二关 · 虹桥至城门之间</text><text x="70" y="107" font-size="24" fill="#6b6251">02—11 为 D 区主体；01 是桥头入口参照，12 是城门出口参照。右起向左行。</text>']
    out.append(f'<svg x="70" y="140" width="2260" height="339" viewBox="6200 0 12200 1830"><image href="original-scroll.jpg" width="38414" height="1800"/>{zone_overlays()}{pins()}</svg>')
    for i, s in enumerate(SCENES):
        col = i % 3
        row = i // 3
        x = 70 + col * 760
        y = 542 + row * 64
        color = "#a9691b" if s["zone"] == "D" else "#426b6e"
        out.append(f'<circle cx="{x+19}" cy="{y-9}" r="19" fill="{color}"/><text x="{x+19}" y="{y-9}" text-anchor="middle" dominant-baseline="central" font-size="20" fill="white" font-weight="600">{s["id"][1:]}</text><text x="{x+50}" y="{y}" font-size="26" fill="#302c23">{s["title"]}</text>')
    out.append('<text x="70" y="830" font-size="23" fill="#6b6251">编号表示观察位置，不是游戏任务顺序。店号、货品、木架用途和人物身份尚未核定的部分，在清单中单列。</text></svg>')
    return "".join(out)


(OUT / "全卷六区标注.svg").write_text(make_overview())
(OUT / "第二关原画场景标注.svg").write_text(make_second_map())

zone_buttons = "".join(f'<button type="button" data-zone="{z["id"]}" style="--zone:{z["color"]}"><span>{z["id"]}</span>{z["name"]}</button>' for z in ZONES)
zone_rows = "".join(f'<article class="zone-sheet" id="zone-{z["id"]}"><div class="zone-label" style="color:{z["color"]}"><b>{z["id"]}</b><h3>{z["name"]}</h3><small>{z["phase"]}</small></div>{source_svg(z["bounds"], attrs="class=zone-image role=img aria-label="+z["name"])}<p>{z["landmarks"]}</p><p class="muted">{z["boundary"]}</p></article>' for z in ZONES)
scene_cards = "".join(f'<button type="button" class="scene-card" data-scene="{s["id"]}" id="card-{s["id"]}">{source_svg(s["rect"], attrs="aria-hidden=true")}<span class="scene-number">{s["id"][1:]}</span><span class="scene-title">{s["title"]}</span><small>{s["scope"]} · {s["priority"]}</small></button>' for s in SCENES)
sources = "".join(f'<li><a href="{s["url"]}" target="_blank" rel="noopener">{s["title"]}</a><span>{s["use"]}</span></li>' for s in DATA["sources"])

template = r'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><link rel="icon" href="data:,"><title>清明上河图 · 全卷六区图志</title>
<style>
:root{--ink:#302d25;--paper:#f5f0e4;--muted:#70695a;--line:#d8cebc;--amber:#a9691b;--green:#426b6e}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.65}button,a,input{touch-action:manipulation}button{font:inherit;color:inherit;cursor:pointer}a{color:#4c6969;text-underline-offset:4px}button:focus-visible,a:focus-visible,input:focus-visible{outline:3px solid #426b6e;outline-offset:4px}main{max-width:1500px;padding:42px 44px 60px;margin:auto}header{border-top:3px solid var(--ink);padding-top:20px;display:flex;justify-content:space-between;gap:32px;align-items:flex-end}.eyebrow{font-size:12px;letter-spacing:3px;color:var(--muted)}h1{font-family:"Songti SC","STSong",serif;font-size:clamp(28px,4vw,48px);font-weight:600;line-height:1.3;margin:12px 0}header p{max-width:770px;margin:0;color:var(--muted)}.edition{text-align:right;flex-shrink:0;font-size:13px;color:var(--muted)}.overview{margin:30px 0 22px;border:1px solid var(--line);background:#eee1c8;padding:22px 18px 18px}.overview svg{display:block;width:100%;height:auto}.overview p{margin:9px 0 0;font-size:13px;color:var(--muted);text-align:right}.zones{display:flex;flex-direction:row-reverse;gap:8px;margin:20px 0}.zones button{flex:1;border:1px solid var(--line);background:transparent;min-height:54px;line-height:1.5;padding:10px 6px;border-top:3px solid var(--zone)}.zones span{font-weight:700;margin-right:7px;color:var(--zone)}.zones button[aria-pressed=true]{background:#302d25;color:var(--paper)}.zones button[aria-pressed=true] span{color:var(--paper)}section{margin-top:36px}.section-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:12px;gap:15px}h2{font-family:"Songti SC","STSong",serif;font-size:27px;line-height:1.4;margin:0}.section-head small{font-size:13px;color:var(--muted)}.tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:16px 0}.tools button{background:transparent;border:1px solid var(--line);border-radius:3px;padding:7px 13px}.tools label{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;margin-left:auto}.tools input{width:95px;accent-color:var(--amber)}.viewer-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:25px;align-items:start}.canvas-wrap{background:#decba7;border:1px solid var(--line);overflow:hidden}.canvas-wrap svg{display:block;width:100%;height:350px;cursor:grab;touch-action:none}.canvas-wrap svg.dragging{cursor:grabbing}.pin{cursor:pointer}.pin:hover circle,.pin:focus circle{fill:#302d25;stroke-width:4}.viewer-note{font-size:13px;color:var(--muted);margin-top:8px}.description{font-size:14px;line-height:1.8}.description h3{font-size:22px;margin:4px 0 12px;font-family:"Songti SC","STSong",serif}.description p{margin:12px 0}.description strong{display:block;margin-bottom:3px;font-size:12px;letter-spacing:1px}.description .truth{border-left:3px solid var(--amber);padding-left:13px}.description .unknown{border-left:3px solid var(--line);padding-left:13px}.description .type{display:inline-block;font-size:12px;color:var(--green);border-bottom:1px solid var(--line);padding-bottom:5px}.description .sources{font-size:12px;color:var(--muted)}.muted{color:var(--muted)}.scene-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:22px}.scene-card{border:1px solid var(--line);padding:0 0 14px;background:#faf6ed;text-align:left;position:relative;overflow:hidden}.scene-card svg{display:block;width:100%;height:160px;background:#dbc7a2}.scene-number{position:absolute;left:12px;top:12px;font-weight:700;color:white;background:var(--amber);border:1px solid #fff5df;width:31px;height:31px;text-align:center;line-height:29px;border-radius:50%}.scene-title{display:block;margin:12px 14px 4px;font-weight:600;font-size:15px}.scene-card small{display:block;margin:0 14px;color:var(--muted);font-size:12px}.scene-card[aria-pressed=true]{outline:2px solid var(--amber);outline-offset:1px}.callout{margin:24px 0;padding:15px 19px;border-left:3px solid var(--green);background:#e8e9de;font-size:14px}.zone-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;margin-top:22px}.zone-sheet{border-top:2px solid var(--line);padding-top:12px}.zone-label{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}.zone-label b{font-size:28px}.zone-label h3{font-size:19px;margin:0}.zone-label small{margin-left:auto;font-size:12px}.zone-sheet svg{width:100%;height:220px;display:block;background:#e2cea7}.zone-sheet p{margin:8px 0;font-size:13px}.downloads{display:flex;gap:18px;flex-wrap:wrap;margin:20px 0}.sources-list{list-style:none;padding:0;font-size:13px}.sources-list li{margin:12px 0}.sources-list span{display:block;color:var(--muted);margin-top:3px}footer{border-top:1px solid var(--line);margin-top:32px;padding-top:18px;color:var(--muted);font-size:12px}#toast{font-size:13px;color:var(--muted);min-height:24px}.full-view .canvas-wrap svg{height:150px}.no-marks .marker-layer,.no-marks .zone-overlay{display:none}@media(max-width:1050px){main{padding:25px 22px}.viewer-grid{grid-template-columns:1fr}.description{display:grid;grid-template-columns:1fr 1fr;gap:0 22px}.description h3,.description .type{grid-column:1/-1}.scene-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){header{display:block}.edition{text-align:left;margin-top:16px}.zones{display:grid;grid-template-columns:repeat(3,1fr);direction:rtl}.zones button{direction:ltr}.viewer-grid{gap:12px}.description{display:block}.scene-grid,.zone-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.zone-grid{grid-template-columns:1fr}.scene-card svg{height:125px}.scene-title{font-size:14px}.tools label{margin-left:0}.section-head{align-items:flex-start;flex-direction:column}.canvas-wrap svg{height:300px}.overview{padding:14px 8px}.zone-label small{margin-left:0}}@media print{main{max-width:none;padding:20px}.tools,.viewer-grid,.scene-grid,.downloads,.zones{display:none}.zone-grid{grid-template-columns:1fr 1fr}.zone-sheet{break-inside:avoid}.zone-sheet svg{height:160px}a{color:inherit}.overview{margin-top:20px}section{margin-top:22px}}
</style></head><body><main>
<header><div><div class="eyebrow">原画场景档案 · GAME WORLD ATLAS</div><h1>沿画卷，走进汴京</h1><p>从郊野、河湾，经虹桥入城。用同一幅张择端本连接六个区域；第二关细看虹桥之后、城门之前的水陆街市。</p></div><div class="edition">全卷六区标注<br>第二关原画场景清单<br>2026.10.01</div></header>
<div class="overview" id="overview">__OVERVIEW__<p>右起为 A 郊野，左端为 F 城内。C 第一关 → D 第二关。</p></div>
<nav class="zones" aria-label="选择原卷区域">__ZONE_BUTTONS__</nav>
<section id="viewer-section"><div class="section-head"><h2 id="view-title">D · 虹桥通城街段</h2><small id="view-label">十项主体场景；邻区入口、出口另列</small></div>
<div class="tools"><button type="button" id="second-overview">第二关总览</button><button type="button" id="whole-scroll">全卷总览</button><button type="button" id="reset-view">重置视图</button><button type="button" id="toggle-marks" aria-pressed="true">隐藏标注</button><label>缩放 <input id="zoom" type="range" min="100" max="400" step="10" value="100" aria-label="画面缩放"><output id="zoom-value">100%</output></label></div>
<div class="viewer-grid"><div><div class="canvas-wrap"><svg id="zone-view" xmlns="http://www.w3.org/2000/svg" viewBox="8200 0 8200 1800" aria-label="原画区域，点击编号查看场景"><image href="original-scroll.jpg" x="0" y="0" width="38414" height="1800"/><g class="zone-overlay">__ZONE_OVERLAYS__</g><g class="marker-layer">__PINS__</g><rect id="selected-rect" x="0" y="0" width="0" height="0" fill="none" stroke="#fff3ce" stroke-width="3" vector-effect="non-scaling-stroke"/></svg></div><p class="viewer-note">点击编号或下方局部图查看细节。拖动画面可平移，缩放后可细看。编号是观察点，不是任务顺序。</p><div id="toast" role="status" aria-live="polite"></div></div><aside class="description" id="description" aria-live="polite"></aside></div>
</section>
<section id="scenes"><div class="section-head"><h2>十二处原画观察点</h2><small>02—11：第二关主体　01 / 12：邻区交接参照</small></div><div class="scene-grid">__SCENE_CARDS__</div><div class="callout">第二关的重点是近岸舟船、街路棚摊与搬运车马。城楼属于 E；门内彩楼欢门的大型店铺属于 F。经营内容、人物姓名和具体差事进入剧情时，须另标为虚构。</div></section>
<section id="all-zones"><div class="section-head"><h2>六区分幅对照</h2><small>观卷顺序 A → B → C → D → E → F</small></div><div class="zone-grid">__ZONE_ROWS__</div><p class="muted">建议制作顺序：C 虹桥 → D 通城街段 → E 城门 → F 城内 → A 郊野 → B 舟运。最终打通相邻道路与河岸，成为一幅连续画卷。分区不等于六个互不相干的副本。</p></section>
<section><div class="section-head"><h2>下载与出处</h2><small>离线可用；源图像素未改动</small></div><div class="downloads"><a href="全卷六区标注.svg" download>全卷六区标注 SVG</a><a href="第二关原画场景标注.svg" download>第二关标注 SVG</a><a href="../../清明上河图_全卷六区规划.md">六区规划 Markdown</a><a href="../../第二关_虹桥至城门_原画场景清单.md">场景清单 Markdown</a><a href="annotations.json" download>标注坐标 JSON</a></div><ul class="sources-list">__SOURCES__</ul><p class="muted">本地“故宫数字文物库高清截图”分段用于细节交叉核对。完整底图来自 Wikimedia Commons，保留其来源身份；不是故宫下载件，不使用清院本、仇英本或游戏彩版。古籍补充时代生活，不能据此指认某间屋、某个人。</p></section>
<footer>分区与点位为本次游戏设计标注，画心边界取近似值，排除装裱与题跋。原作采用散点透视，图上距离不换算成游戏米数。此交付为内容规划，尚未扩建游戏。</footer>
</main><script>
const atlas=__DATA__;
const zoneMap=Object.fromEntries(atlas.zones.map(z=>[z.id,z]));
const sceneMap=Object.fromEntries(atlas.scenes.map(s=>[s.id,s]));
const svg=document.getElementById('zone-view');
const desc=document.getElementById('description');
const zoom=document.getElementById('zoom');
let base=[8200,0,8200,1800], box=[...base], selectedZone='D', currentScene=null, drag=null, hasMoved=false;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function applyView(){svg.setAttribute('viewBox',box.join(' '));const unit=Math.max(box[2]/Math.max(1,svg.clientWidth),box[3]/Math.max(1,svg.clientHeight));document.querySelectorAll('.pin').forEach(p=>{const s=sceneMap[p.dataset.scene];p.querySelector('circle').setAttribute('r',12*unit);p.querySelector('text').setAttribute('font-size',13*unit);const visible=s.point[0]>=box[0]&&s.point[0]<=box[0]+box[2]&&s.point[1]>=box[1]&&s.point[1]<=box[1]+box[3];p.setAttribute('tabindex',visible?'0':'-1');p.setAttribute('aria-hidden',visible?'false':'true');});}
function setBase(rect){base=[...rect];box=[...base];zoom.value=100;document.getElementById('zoom-value').value='100%';applyView();}
function resetRect(){document.getElementById('selected-rect').setAttribute('width',0);document.getElementById('selected-rect').setAttribute('height',0);}
function setActive(id){document.querySelectorAll('[data-zone]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.zone===id)));}
function clearScene(){currentScene=null;resetRect();document.querySelectorAll('.scene-card').forEach(b=>b.setAttribute('aria-pressed','false'));}
function zoneDescription(z){desc.innerHTML='<span class="type">'+escapeHtml(z.phase)+'</span><h3>'+escapeHtml(z.name)+'</h3><p class="truth"><strong>原画中的视觉锚点</strong>'+escapeHtml(z.landmarks)+'</p><p><strong>边界与邻区</strong>'+escapeHtml(z.boundary)+'</p><p class="unknown"><strong>建场景时保留整体</strong>'+escapeHtml(z.ownership)+'</p><p><strong>体验方向 · 设计建议</strong>'+escapeHtml(z.experience)+'</p>';}
function showZone(id){selectedZone=id;clearScene();setBase(zoneMap[id].bounds);setActive(id);document.getElementById('viewer-section').classList.remove('full-view');document.getElementById('view-title').textContent=id+' · '+zoneMap[id].name;document.getElementById('view-label').textContent=id==='D'?'十项主体场景；邻区入口、出口另列':'彩色边界为游戏开发分区';zoneDescription(zoneMap[id]);document.getElementById('toast').textContent='当前区域 '+id+'；可拖动及缩放。';}
function showSecond(){selectedZone='D';clearScene();setBase([6200,0,12200,1830]);setActive('D');document.getElementById('viewer-section').classList.remove('full-view');document.getElementById('view-title').textContent='第二关 · 虹桥至城门之间';document.getElementById('view-label').textContent='含桥头、城门两处邻区参照';zoneDescription(zoneMap.D);document.getElementById('toast').textContent='金色 02—11 属 D；青色 01、12 是邻区交接参照。';}
function selectScene(id,scroll=false){const s=sceneMap[id];if(!s)return;currentScene=id;selectedZone=s.zone;setActive(s.zone);document.getElementById('viewer-section').classList.remove('full-view');const [x,y,w,h]=s.rect;let pad=100;setBase([Math.max(0,x-pad),Math.max(0,y-pad),w+pad*2,Math.min(1800-y+pad,h+pad*2)]);const rect=document.getElementById('selected-rect');['x','y','width','height'].forEach((k,i)=>rect.setAttribute(k,s.rect[i]));document.getElementById('view-title').textContent=s.id+' · '+s.title;document.getElementById('view-label').textContent=s.scope;document.querySelectorAll('.scene-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scene===id)));const links=s.source_ids.map(id=>{const src=atlas.sources.find(t=>t.id===id);return '<a target="_blank" rel="noopener" href="'+src.url+'">'+escapeHtml(src.title)+'</a>';}).join(' · ');desc.innerHTML='<span class="type">'+escapeHtml(s.scope)+' · '+s.priority+'</span><h3>'+escapeHtml(s.title)+'</h3><p class="truth"><strong>画面可确认</strong>'+escapeHtml(s.visible)+'</p><p class="unknown"><strong>待考，不写成定论</strong>'+escapeHtml(s.uncertain)+'</p><p><strong>游戏用途 · 设计建议</strong>'+escapeHtml(s.use)+'</p><p><strong>制作重点</strong>'+escapeHtml(s.assets)+'</p><p class="sources">'+links+'</p>';document.getElementById('toast').textContent=s.clip_note;history.replaceState(null,'','#'+id);if(scroll)document.getElementById('viewer-section').scrollIntoView({behavior:'smooth',block:'start'});}
document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>{showZone(b.dataset.zone);history.replaceState(null,'','#zone-'+b.dataset.zone);}));
document.querySelectorAll('.scene-card').forEach(b=>b.addEventListener('click',()=>selectScene(b.dataset.scene,true)));
document.querySelectorAll('.pin').forEach(p=>{p.addEventListener('click',()=>{if(!hasMoved)selectScene(p.dataset.scene)});p.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectScene(p.dataset.scene)}})});
document.getElementById('second-overview').onclick=()=>{showSecond();history.replaceState(null,'','#second');};
document.getElementById('whole-scroll').onclick=()=>{selectedZone='all';clearScene();setBase(atlas.image.painted_bounds);setActive('');document.getElementById('viewer-section').classList.add('full-view');document.getElementById('view-title').textContent='全卷 · 从右向左观赏';document.getElementById('view-label').textContent='A → B → C → D → E → F';desc.innerHTML='<h3>同一原卷，连续六区</h3><p>郊野、舟运、虹桥、通城街段、城门、城内百业。</p><p class="unknown">分区为游戏开发设计，不是宋代行政区，也不是历史测绘结果。</p>';history.replaceState(null,'','#all');};
document.getElementById('reset-view').onclick=()=>{setBase(base);document.getElementById('toast').textContent='视图已重置。';};
document.getElementById('toggle-marks').onclick=e=>{const hidden=document.getElementById('viewer-section').classList.toggle('no-marks');e.currentTarget.textContent=hidden?'显示标注':'隐藏标注';e.currentTarget.setAttribute('aria-pressed',String(!hidden));document.getElementById('selected-rect').style.display=hidden?'none':'';};
zoom.oninput=()=>{const factor=Number(zoom.value)/100;const cx=box[0]+box[2]/2,cy=box[1]+box[3]/2;const w=base[2]/factor,h=base[3]/factor;box=[cx-w/2,cy-h/2,w,h];document.getElementById('zoom-value').value=zoom.value+'%';applyView();};
function worldPoint(e){const p=new DOMPoint(e.clientX,e.clientY);return p.matrixTransform(svg.getScreenCTM().inverse());}
svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;hasMoved=false;if(e.target.closest('.pin'))return;const p=worldPoint(e);drag={x:p.x,y:p.y,box:[...box],screenX:e.clientX,screenY:e.clientY};svg.setPointerCapture(e.pointerId);});
svg.addEventListener('pointermove',e=>{if(!drag)return;if(Math.hypot(e.clientX-drag.screenX,e.clientY-drag.screenY)>5){hasMoved=true;svg.classList.add('dragging');}if(!hasMoved)return;const p=worldPoint(e);box=[box[0]+drag.x-p.x,box[1]+drag.y-p.y,box[2],box[3]];applyView();});
svg.addEventListener('pointerup',()=>{drag=null;svg.classList.remove('dragging');});
svg.addEventListener('pointercancel',()=>{drag=null;svg.classList.remove('dragging');});
showZone('D');
window.addEventListener('resize',applyView);
const hash=location.hash.slice(1);if(sceneMap[hash])selectScene(hash);else if(hash==='second')showSecond();else if(hash.startsWith('zone-')&&zoneMap[hash.slice(5)])showZone(hash.slice(5));else if(hash==='all')document.getElementById('whole-scroll').click();
</script></body></html>'''
replacements = {
    "__DATA__": json.dumps(DATA, ensure_ascii=False).replace("</", "<\\/"),
    "__OVERVIEW__": make_overview().replace('xmlns="http://www.w3.org/2000/svg" width="2400" height="465"', 'xmlns="http://www.w3.org/2000/svg"'),
    "__ZONE_BUTTONS__": zone_buttons,
    "__ZONE_OVERLAYS__": zone_overlays(),
    "__PINS__": pins("interactive-", True),
    "__SCENE_CARDS__": scene_cards,
    "__ZONE_ROWS__": zone_rows,
    "__SOURCES__": sources,
}
for key, value in replacements.items():
    template = template.replace(key, value)
(OUT / "清明上河图_全卷六区图志.html").write_text(template)
manifest = {
    "date": DATA["date"],
    "source_file": IMAGE.name,
    "source_page": DATA["sources"][2]["url"],
    "source_url": DATA["sources"][2]["image_url"],
    "width": 38414, "height": 1800,
    "bytes": IMAGE.stat().st_size,
    "sha1": hashlib.sha1(IMAGE.read_bytes()).hexdigest(),
    "sha256": hashlib.sha256(IMAGE.read_bytes()).hexdigest(),
    "source_pixels_modified": False,
    "annotation_method": "SVG vector overlays and viewBox; browser captures only for previews",
    "coordinate_system": "pixel coordinates on original-scroll.jpg; x increases left to right, y top to bottom",
    "zone_ownership_note": "Strip boundaries are approximate design boundaries, not geometric cuts through buildings",
    "local_crosscheck": "/Users/zhengrui/Downloads/清明上河图_故宫数字文物库高清截图_22段",
    "local_crosscheck_segments_present": list(range(2,21)),
    "local_crosscheck_limit": "Screenshots crop the lower part of the painted scene; only used for visual crosschecks",
}
(OUT / "source-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print("Built HTML, two SVG maps and source manifest. Source JPEG unchanged.")
