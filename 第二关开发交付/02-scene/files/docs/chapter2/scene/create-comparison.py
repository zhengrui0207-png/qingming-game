import json,pathlib,html
root=pathlib.Path(__file__).resolve().parents[3];d=root/'docs/chapter2/scene';l=json.loads((root/'src/chapter2/scene/layout.json').read_text());a=json.loads((root/'src/chapter2/scene/anchors.json').read_text());svg=['<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1400" viewBox="0 0 1600 1400"><rect width="1600" height="1400" fill="#f3eedf"/><style>text{font-family:system-ui;fill:#363e35}.label{font-size:20px}</style><text x="50" y="55" font-size="30" font-weight="700">张择端本邻接参考 → D区米制灰盒</text><text x="50" y="90" font-size="18">原图仅用于外形/邻接，右起向左行；下图沿用真实world.json坐标，不按像素比例换算。</text><image href="painting-reference.png" x="50" y="115" width="1500" height="534"/>']
px=lambda x:80+(x+82)*22;py=lambda z:700+(-z-15)*14
svg+=['<rect x="55" y="685" width="1430" height="55" fill="#82a6a4"/><text x="90" y="720" class="label">汴水：S02舟群 / S03岸边，两钓点面向水</text>']
ps=' '.join(f'{px(p[0])},{py(p[2])}' for p in l['road']);svg.append(f'<polyline points="{ps}" stroke="#c6ae86" stroke-width="80" fill="none" stroke-linejoin="round"/>')
for s in l['structures']:
 svg.append(f'<rect x="{px(s["x"]-s["w"]/2)}" y="{py(s["z"]+s["d"]/2)}" width="{s["w"]*22}" height="{s["d"]*14}" fill="#80735f"/>')
 svg.append(f'<text x="{px(s["x"])}" y="{py(s["z"])-10}" text-anchor="middle" fill="#fff" font-size="18">{s["scene"]}</text>')
for an in a['anchors']:
 x,y=px(an['position'][0]),py(an['position'][2]);svg.append(f'<circle cx="{x}" cy="{y}" r="6" fill="#1d6b6b"/>')
 if an['role'] not in ['repair','safe_return','exit']:svg.append(f'<text x="{x+10}" y="{y+20}" font-size="17">{html.escape(an["label"])}</text>')
svg+=['<text x="70" y="1195" class="label">西侧：D终点/交付（x=-75至-78，z=-43）；S12城门归E，当前仅挂接接口，未重复造门。</text><text x="70" y="1230" class="label">东侧：C/D入口（x=-22，z=-20）；S01复用原桥头参照，C安全回返仍为[0,.94,35]。</text><text x="70" y="1270" class="label">S04敞面屋 → S05错落瓦屋 → S06树下低屋 → S07棚伞 → S08负载 → S10/S11两类车辆 → S09木架。</text><text x="70" y="1310" class="label">灰盒布局用于步行和站位核验，非原画精确测绘或正式美术通过。彩楼欢门留城内，不扩建A/B/E/F。</text></svg>']
(d/'comparison.svg').write_text('\n'.join(svg))
