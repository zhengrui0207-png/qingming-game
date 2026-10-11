"""Package the verified NPC-only increment; never includes API credentials or task replies."""
import csv
import difflib
import hashlib
import json
import math
import shutil
import zipfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/npc-integration'
DOCS = ROOT / 'docs/npc-integration'
DOCS.mkdir(parents=True, exist_ok=True)
read = lambda path: json.loads(path.read_text())
catalog = read(ROOT / 'public/assets/characters/catalog.json')
mapping = read(OUT / 'npc-map-full.json')
baseline = read(OUT / 'before-hashes.json')
changed = [p for p, digest in baseline.items() if not (ROOT / p).exists() or hashlib.sha256((ROOT / p).read_bytes()).hexdigest() != digest]
allowed = ['src/main.js', 'src/street-life.js', 'src/hongqiao/npcs.js', 'src/hongqiao/runtime.js']
prior_audit = read(OUT / 'verification-before-flower.json')
assert set(prior_audit['modified_existing_files']) == set(allowed)
assert len(mapping) == 218 and len({row['assetId'] for row in mapping}) == 45

def browser_result(name):
    text = (OUT / name).read_text()
    return json.JSONDecoder().raw_decode(text.split('### Result\n')[1])[0]

browser = browser_result('browser-production.log')
dialogue = browser_result('browser-dialogue.log')['dialogue']
assert browser['state']['npcAssets']['loaded'] == 45
assert not browser['state']['npcAssets']['failures']
assert browser['state']['life']['npcAssets']['replaced'] == 214
assert dialogue['npcId'] == 'npc_hq_fang'
flower = next(a for a in catalog if a['id'] == 'QMSH-45')
assert flower['sourceStatus'] == '修复版已通过（手指限制）'
assert browser['flower']['sourceStatus'] == flower['sourceStatus']
assert browser['sha256'] == flower['sha256']
audit = {
    'date': '2026-09-15', 'source_character_count': 45, 'street_npcs': 214,
    'quest_npcs': 4, 'replaced_total': 218, 'runtime_load_failures': [],
    'unique_runtime_assets': 45, 'finite_street_transforms': True,
    'static_assets': [a['id'] for a in catalog if not a['skins']],
    'runtime_clip_sample': prior_audit['runtime_clip_sample'],
    'dialogue_verified': dialogue,
    'modified_existing_files_by_npc_integration': allowed,
    'shared_workspace_changes_at_packaging': changed,
    'concurrent_changes': 'Other active work modifies cinematic and quest code; this package uses the captured NPC integration source, not those in-progress changes.',
    'original_public_assets_unchanged': True,
    'tests': {'existing_passed': 59, 'integration_passed': 2},
    'trajectory_comparison': '240 updates: people, carts and ferries match original numerically',
    'browser_verification_scope': 'Loading, transforms, active clips, selected street/quest/mounted views and Fang dialogue; not an exhaustive mesh collision or all-animation review',
    'build': 'Vite production build succeeded; existing bundle-size warning remains',
    'runtime_character_bytes': sum(a['bytes'] + a['lodBytes'] for a in catalog),
    'server_deployed': False,
    'flower_repaired': {'source_zip': 'output/characters-45/batch-5/卖花姑娘-修复版.zip', 'game_sha256': flower['sha256'], 'browser_served_sha256_matches': True, 'catalog': browser['flower']},
}
(DOCS / 'verification.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
shutil.copy2(OUT / 'NPC匹配映射表.csv', DOCS / 'NPC匹配映射表.csv')
with (DOCS / '角色资产清单.csv').open('w', encoding='utf-8-sig', newline='') as f:
    w = csv.writer(f)
    w.writerow(['编号', '角色名', '场景实例数', '高精度GLB', '远景GLB', '高精度三角面', '远景三角面', '骨骼皮肤数', '动画', '源资产状态', '已知问题', 'GLB_SHA256'])
    for a in catalog:
        w.writerow([a['id'], a['name'], sum(m['assetId'] == a['id'] for m in mapping), a['file'], a['lodFile'], a['triangles'], a['lodTriangles'], a['skins'], ' / '.join(a['animations']), a['sourceStatus'], a['limitations'], a['sha256']])

report = '''# 《清明上河图》45 种人物接入记录

交付日期：2026-09-15。

五批生成结果已接入现有游戏，共替换 218 个 NPC：214 个街道人物、4 个剧情人物，使用全部 45 种角色。没有增加或删除 NPC。匹配时优先参考职业和所在商铺，普通路人复用适合的居民角色。

## 剧情与商铺匹配

| 原角色 | 新模型 |
| --- | --- |
| 老周 | 22 号船工 |
| 何伯 | 24 号背夫/搬运工 |
| 阿成 | 18 号外卖小哥（跑腿角色） |
| 方娘子 | 44 号绣娘 |

茶坊、酒铺、药铺、工匠等位置已按职业分别分配。完整的原 NPC ID、位置、旋转、缩放、路线、交互字段与分配理由见《NPC匹配映射表.csv》。原场景没有独立 NPC 碰撞体的条目保留 null，没有伪造碰撞或导航数据。

## 运行方式

可直接查看的独立预览：http://127.0.0.1:5187/qingming/。预览基于本次人物接入的生产构建，已包含 45 号修复版。

共享项目另有任务在更新剧情过场，因此开发服务 5186 会随其修改热更新。本次保留独立预览，避免将正在开发的过场错误混入人物交付。人物资源与接入代码已经写入共享项目，没有回滚其他任务的修改。

WASD 移动，Shift 快行，拖动视角，滚轮缩放。靠近剧情人物按 E 交谈，原有上下船、步行和游泳入口保持原状。

生产构建在 `output/npc-integration/build/`，使用 `/qingming/` 作为部署路径。此轮没有更新阿里云线上站点。

## 资源与动画

游戏包含 45 个 GLB 和 45 个远景 LOD GLB，内嵌 PBR 贴图。原始高精度模型仍在 `output/characters-45/`，未覆盖。游戏副本把贴图限制为最长 1024 像素，高精度副本保留源网格、蒙皮和动画；远景副本约数千个三角面。两档人物资源合计约 55 MB，精确字节数见 verification.json。

近处使用独立骨架克隆和源模型自带的 Idle、Walk、职业动作；超过 28 米使用实例化的静态远景网格，人物仍按原路线移动，远景不播放肢体动画。骑马人与乘客使用近景模型和程序化坐姿适配，船夫有轻微划船摆动。这些适配不等同于为所有角色制作了专用骑乘、划船动作。

## 验证结果与范围

- 浏览器实际加载 45/45，失败 0；214 个街道替换加 4 个剧情替换，运行时唯一人物种类为 45。
- 原有 59 项测试、新增 2 项集成测试通过。对旧版与新版分别运行 240 次更新，行人、车马、游船轨迹数据一致。
- 方娘子位置按 E 可以进入原来的剧情对话；街道、剧情角色及骑乘视角已截图抽查。所有街道人物坐标和缩放为有限数值。
- Vite 生产构建成功，仍有原项目体积较大的 JS chunk 提示。
- 人物接入完成时的文件哈希检查：本任务只修改 `main.js`、`street-life.js`、`hongqiao/npcs.js`、`hongqiao/runtime.js` 四个既有文件；新增 `npc-assets.js`。本任务没有修改原有 public 资源、世界数据、路径、碰撞、灯光、镜头及 UI 文件。之后另一个任务继续修改共享项目的过场与剧情代码，当前整个工作区的差异不能全部归于人物接入；详见 verification.json。
- 修复版 45 号在独立预览中实际加载，浏览器下载的 GLB SHA256 与新游戏资产清单一致；近处资源保留三段动画，远景模型同步更新。

这些检查不能替代全部 218 人的逐帧穿模验收。原有城市场景较重，帧率随设备、镜头和可见人物数量变化，没有承诺固定帧率。

## 尚未解决的源资产问题

1. 02 文官、04 文人儒生、05 乘轿贵妇、18 外卖小哥、24 背夫/搬运工、44 绣娘：源交付是静态 PBR 模型，没有可用骨骼和动画。全部安排在原有驻足位置，包括三位剧情角色；它们仍不会播放 Idle/Walk。
2. 45 卖花姑娘已换成用户提供的《卖花姑娘-修复版.zip》：多余手部、重复花篮、下裙和围兜蒙皮问题已在修复版解决，保留花篮与手持花，含 Idle、Walk、展示鲜花三段动作。已重新生成游戏贴图副本和远景模型。仍有手指链不完整的限制：固定握持，长裙采用小幅步态，不能用于完整手指表演。
3. 部分第二批人物存在手指骨骼检查限制，详见资产清单的原始状态与问题字段。模型可加载、动作可播不等于完整 Humanoid 手指规范通过。
4. 坐姿为现有骨架的程序化适配；衣袍、手持道具与马匹、船舷仍可能局部相交。没有改动马匹、船只或碰撞去掩盖这些限制。

本次没有重新调用 Tripo 生成接口，没有新增生成积分消耗。

## 增量包与回退

`qingming-npc-incremental.zip` 包含 45 对人物资源、人物清单与匹配 JSON、Draco 解码器、本说明、核验记录和 `npc-integration.patch`。5 个完成接入时的代码快照放在 `reference-source/`。它不是独立的完整游戏包。

本机项目已经接入，不需要重复应用补丁。迁移到其他副本时先检查补丁兼容性再合并；共享项目的剧情代码正在并行修改，不要直接用 reference-source 整份覆盖当前源码。

包内 `rollback/` 保留上述 4 个既有文件的原版；按原相对路径覆盖可恢复旧人物接入逻辑。人物资源文件为新增，回退代码后不会再加载它们。
'''
(DOCS / 'README.md').write_text(report)

zip_path = OUT / 'qingming-npc-incremental.zip'
files = list((ROOT / 'public/assets/characters').glob('*'))
files += list((ROOT / 'public/assets/draco').glob('*'))
files += list(DOCS.glob('*'))
rollback = {'main.js': 'src/main.js', 'street-life.js': 'src/street-life.js', 'quest-npcs.js': 'src/hongqiao/npcs.js', 'quest-runtime.js': 'src/hongqiao/runtime.js'}
patch = []
for path in allowed + ['src/npc-assets.js']:
    old_name = next((k for k, v in rollback.items() if v == path), None)
    old = (OUT / 'before' / old_name).read_text() if old_name else ''
    new = (OUT / 'integration-source' / path).read_text()
    patch.extend(difflib.unified_diff(old.splitlines(keepends=True), new.splitlines(keepends=True), fromfile='a/' + path if old_name else '/dev/null', tofile='b/' + path))
(OUT / 'npc-integration.patch').write_text(''.join(patch))
with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for path in sorted(files):
        if path.is_file():
            z.write(path, str(path.relative_to(ROOT)))
    z.write(OUT / 'npc-integration.patch', 'npc-integration.patch')
    for path in allowed + ['src/npc-assets.js']:
        z.write(OUT / 'integration-source' / path, 'reference-source/' + path)
    for source, target in rollback.items():
        z.write(OUT / 'before' / source, 'rollback/' + target)
with zipfile.ZipFile(zip_path) as z:
    assert z.testzip() is None
    assert len([p for p in z.namelist() if p.endswith('.glb')]) == 90
print(json.dumps({'package': str(zip_path), 'bytes': zip_path.stat().st_size, 'verified_glbs': 90, 'report': str(DOCS / 'README.md')}, ensure_ascii=False))
