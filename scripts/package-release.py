"""Package only explicitly selected runtime assets from a Vite production build."""
import argparse, hashlib, json, shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source',default='output/step9-build');p.add_argument('--target',default='output/release-step9/qingming');a=p.parse_args()
src=Path(a.source).resolve();dst=Path(a.target).resolve()
if dst.exists(): raise SystemExit('Target exists; choose a new target to preserve previous release: '+str(dst))
files={'index.html',*[str(f.relative_to(src)) for f in (src/'assets').glob('*') if f.suffix in {'.js','.css'}]}
files.update('assets/'+n for n in ['qingming-world.glb','a-qing.glb','song-scholar-v2-animated.glb','skiff.glb','street-life.glb','world.json'])
files.update('assets/textures/'+n for n in ['song-material-atlas.png','willow-spray.png','Plaster007_1K-JPG_Color.jpg','Plaster007_1K-JPG_NormalGL.jpg','Plaster007_1K-JPG_Roughness.jpg','sources.json','README.md'])
files.update('assets/draco/'+n for n in ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js'])
files.update('assets/characters/'+n for n in ['catalog.json','npc-map.json'])
catalog=json.loads((src/'assets/characters/catalog.json').read_text())
assets=catalog if isinstance(catalog,list) else catalog['assets']
for asset in assets:
 for key in ['file','lodFile']:
  if asset.get(key): files.add(asset[key])
files.update('assets/scenery/'+n for n in ['ox.glb','ox-pack.glb','horse.glb','wine.glb','steamer.glb','cargo.glb','placements.json','asset-manifest.json'])
files.update(str(f.relative_to(src)) for f in (src/'assets/portraits').glob('*.png'))
files.update(str(f.relative_to(src)) for f in (src/'assets/fonts').glob('*.woff2'))
files.add('assets/fonts/OFL.txt')
files.update('assets/hongqiao/'+n for n in ['item_hq_rope.glb','item_hq_pole.glb','item_hq_cloth.glb'])
files.update('assets/hongqiao/cinema/'+n for n in ['ship-hq.glb','world-mask.json','bridge-triangles.json'])
files.update(str(f.relative_to(src)) for f in (src/'assets/hongqiao/cinema/audio').glob('*.wav'))
files.add('assets/hongqiao/cinema/audio/manifest.json')
# The global background is a separate user-authored loop, not a street cue.
files.add('assets/audio/ambience/spring_riverside_loop_30s.wav')
# Optional street cues are referenced dynamically by the current runtime.
# Ship runtime fields only; import provenance and local source paths stay private.
street_manifest='assets/audio/street/manifest.json'
street_runtime=None
if (src/street_manifest).is_file():
 raw=json.loads((src/street_manifest).read_text())
 allowed={'id','file','kind','assetId','npcId','npcIds','enabled','trigger','clip','fraction','radius','exitRadius','cooldown','gain','duration','sha256','anchor','line','reason'}
 street_runtime={'version':raw['version'],'files':[{k:v for k,v in entry.items() if k in allowed} for entry in raw['files']]}
 files.add(street_manifest)
 for entry in street_runtime['files']:
  rel=Path(entry['file'])
  if rel.is_absolute() or '..' in rel.parts: raise SystemExit('Unsafe street audio path')
  files.add('assets/audio/street/'+rel.as_posix())
for rel in files:
 f=src/rel
 if not f.is_file() or f.is_symlink() or src not in f.resolve().parents: raise SystemExit('Missing/unsafe runtime file: '+rel)
manifest={}
for rel in sorted(files):
 f=src/rel;out=dst/rel;out.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,out)
 if rel==street_manifest and street_runtime is not None: out.write_text(json.dumps(street_runtime,ensure_ascii=False,indent=2)+'\n')
 manifest[rel]={'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest()}
running=Path('scripts/release-running.md');shutil.copy2(running,dst/'RUNNING.md')
manifest['RUNNING.md']={'bytes':running.stat().st_size,'sha256':hashlib.sha256(running.read_bytes()).hexdigest()}
source_hashes={str(f):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(Path('src').rglob('*')) if f.is_file()}
for name in ['package.json','package-lock.json','index.html']:source_hashes[name]=hashlib.sha256(Path(name).read_bytes()).hexdigest()
(dst/'release-manifest.json').write_text(json.dumps({'delivery':'visual-and-crowd-feedback','base':'./','buildCommand':'npm run build -- --base=./ --outDir='+a.source,'files':manifest,'sourceHashes':source_hashes,'totalBytes':sum(v['bytes'] for v in manifest.values())},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'files':len(manifest),'bytes':sum(v['bytes'] for v in manifest.values()),'target':str(dst)}))
