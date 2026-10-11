from pathlib import Path
import gzip, shutil, json, hashlib
source=Path('dist-ecs'); target=Path('output/ecs-release-v42'); target.mkdir(parents=True,exist_ok=True)
files=[source/'index.html',*source.glob('assets/index-*.js'),*source.glob('assets/index-*.css')]
files += [source/'assets'/n for n in ['qingming-world.glb','a-qing.glb','song-scholar-v2-animated.glb','skiff.glb','street-life.glb','world.json']]
files += [source/'assets/textures'/n for n in ['willow-spray.png','song-material-atlas.png','Plaster007_1K-JPG_Color.jpg','Plaster007_1K-JPG_NormalGL.jpg','Plaster007_1K-JPG_Roughness.jpg']]
manifest={}
for f in files:
 rel=f.relative_to(source); dest=target/rel;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(f,dest)
 manifest[str(rel)]={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
 if f.suffix in ['.glb','.json','.js','.css','.html']:
  with f.open('rb') as incoming,gzip.open(str(dest)+'.gz','wb',compresslevel=6) as out:shutil.copyfileobj(incoming,out)
(target/'release.json').write_text(json.dumps({'version':'4.2','files':manifest},ensure_ascii=False,indent=2))
print('Runtime files:',len(files),'World download:',(target/'assets/qingming-world.glb.gz').stat().st_size,'bytes gzip')
