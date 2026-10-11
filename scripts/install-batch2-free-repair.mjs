import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {NodeIO} from '../output/characters-45/tooling/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../output/characters-45/tooling/node_modules/@gltf-transform/extensions/dist/index.js';
import {textureCompress,draco,compactPrimitive,prune} from '../output/characters-45/tooling/node_modules/@gltf-transform/functions/dist/index.js';
import {MeshoptSimplifier} from '../output/characters-45/tooling/node_modules/meshoptimizer/index.js';
import draco3d from '../output/characters-45/tooling/node_modules/draco3dgltf/draco3dgltf.js';
const root=path.resolve(import.meta.dirname,'..'),repair=path.join(root,'output/characters-45/batch-2/free-repair-v2'),record=path.join(repair,'game-integration'),ids=[8,12,13,14,15,16].map(n=>`QMSH-${String(n).padStart(2,'0')}`),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),sharp=createRequire(import.meta.url)('../output/characters-45/tooling/node_modules/sharp');
const json=async p=>JSON.parse(await fs.readFile(p,'utf8')),catalogPath=path.join(root,'public/assets/characters/catalog.json'),selectedPath=path.join(root,'output/npc-integration/selected-assets.json'),catalog=await json(catalogPath),selected=await json(selectedPath),manifest=await json(path.join(repair,'交付包/交付清单.json'));
await fs.mkdir(path.join(record,'before'),{recursive:true});
const backupFiles=['public/assets/characters/catalog.json','public/assets/characters/npc-map.json','output/npc-integration/selected-assets.json',...ids.flatMap(id=>[`public/assets/characters/${id}.glb`,`public/assets/characters/${id}.lod.glb`])];
for(const relative of backupFiles){const dest=path.join(record,'before',relative);await fs.mkdir(path.dirname(dest),{recursive:true});try{await fs.copyFile(path.join(root,relative),dest,fs.constants.COPYFILE_EXCL)}catch(e){if(e.code!=='EEXIST')throw e;}}
const beforePath=path.join(record,'before-hashes.json');try{await fs.access(beforePath)}catch{const files=await fs.readdir(path.join(root,'public/assets/characters')),out={};for(const f of files){const p=path.join(root,'public/assets/characters',f);if((await fs.stat(p)).isFile())out['public/assets/characters/'+f]=hash(await fs.readFile(p));}for(const f of await fs.readdir(path.join(root,'src')))if(f.endsWith('.js'))out['src/'+f]=hash(await fs.readFile(path.join(root,'src',f)));await fs.writeFile(beforePath,JSON.stringify(out,null,2));}
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});await MeshoptSimplifier.ready;
const triangleCount=d=>d.getRoot().listNodes().filter(n=>n.getMesh()).reduce((s,n)=>s+n.getMesh().listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
const records=[];
for(const id of ids){
 const a=catalog.find(a=>a.id===id),s=selected.find(a=>a.id===id),m=manifest.assets.find(a=>a.asset_id===id);if(!a||!s||m?.status!=='passed_after_local_repair')throw Error('Unapproved character '+id);
 const source=path.join(repair,'交付包',m.raw),sourceBytes=await fs.readFile(source);if(hash(sourceBytes)!==m.raw_sha256)throw Error('Source checksum mismatch '+id);
 const doc=await io.read(source),r=doc.getRoot(),animations=r.listAnimations().map(a=>a.getName()),triangles=triangleCount(doc),joints=r.listSkins()[0].listJoints().length;
 if(triangles!==m.triangles||triangles>20000||animations.length!==3)throw Error('Source structure mismatch '+id);
 await doc.transform(textureCompress({encoder:sharp,resize:[1024,1024]}),draco());const file=`assets/characters/${id}.glb`;await io.write(path.join(root,'public',file),doc);
 const full=await io.read(path.join(root,'public',file));if(triangleCount(full)!==triangles||full.getRoot().listSkins()[0].listJoints().length!==joints||JSON.stringify(full.getRoot().listAnimations().map(a=>a.getName()))!==JSON.stringify(animations))throw Error('Runtime export lost data '+id);
 const bytes=await fs.readFile(path.join(root,'public',file));
 // Same far-distance recipe used by the current game, generated from this repaired skeleton.
 const low=await io.read(path.join(root,'public',file)),lr=low.getRoot();lr.listAnimations().forEach(x=>x.dispose());for(const mesh of lr.listMeshes())for(const p of mesh.listPrimitives()){p.setMaterial(null);const indices=p.getIndices();if(!indices||indices.getCount()<300)continue;const [simple]=MeshoptSimplifier.simplifySloppy(Uint32Array.from(indices.getArray()),Float32Array.from(p.getAttribute('POSITION').getArray()),3,null,Math.max(90,Math.floor(indices.getCount()*.10/3)*3),.025);p.setIndices(low.createAccessor().setType('SCALAR').setBuffer(lr.listBuffers()[0]).setArray(simple));compactPrimitive(p);}
 await low.transform(prune(),draco());const lodFile=`assets/characters/${id}.lod.glb`;await io.write(path.join(root,'public',lodFile),low);const lodBytes=await fs.readFile(path.join(root,'public',lodFile)),lodDecoded=await io.read(path.join(root,'public',lodFile));
 const sourceStatus='passed_after_local_repair',limitations='已本地修复并验证完整五指及三段小幅原地动作；保留 P1 低面数网格细节。';
 Object.assign(a,{sourceStatus,limitations,skins:r.listSkins().length,animations,triangles,bones:joints,file,bytes:bytes.length,sha256:hash(bytes),textureMax:1024,lodFile,lodTriangles:triangleCount(lodDecoded),lodBytes:lodBytes.length,lodSha256:hash(lodBytes),sourceRevision:'batch-2/free-repair-v2',sourceSha256:m.raw_sha256});
 Object.assign(s,{source,sourceSha256:m.raw_sha256,sourceStatus,limitations,sourceRevision:'batch-2/free-repair-v2'});
 records.push({id,name:a.name,source,sourceSha256:m.raw_sha256,file,sha256:a.sha256,bytes:a.bytes,triangles,bones:joints,animations,lodFile,lodTriangles:a.lodTriangles,lodBytes:a.lodBytes,lodSha256:a.lodSha256});console.log(id,triangles,joints,bytes.length,'LOD',a.lodTriangles);
}
// Merge six entries into the latest catalog so unrelated asset work is preserved.
const latestCatalog=await json(catalogPath),latestSelected=await json(selectedPath);
for(const id of ids){Object.assign(latestCatalog.find(a=>a.id===id),catalog.find(a=>a.id===id));Object.assign(latestSelected.find(a=>a.id===id),selected.find(a=>a.id===id));}
await fs.writeFile(catalogPath,JSON.stringify(latestCatalog,null,2));await fs.writeFile(selectedPath,JSON.stringify(latestSelected,null,2));
const mapping=await json(path.join(root,'public/assets/characters/npc-map.json'));await fs.writeFile(path.join(record,'installation.json'),JSON.stringify({date:new Date().toISOString(),repairedAssetCount:6,replacedNpcCount:mapping.filter(x=>ids.includes(x.assetId)).length,npcAssignments:mapping.filter(x=>ids.includes(x.assetId)),credits:0,assets:records},null,2));
