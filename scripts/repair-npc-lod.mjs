// Repair existing LODs locally: preserve UV/normal/skinning attributes and borders.
// No generation API. Full-detail GLBs and animation clips are never rewritten.
import fs from 'node:fs/promises';import path from 'node:path';import crypto from 'node:crypto';
import {NodeIO} from '../output/characters-45/tooling/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../output/characters-45/tooling/node_modules/@gltf-transform/extensions/dist/index.js';
import {compactPrimitive,prune,draco} from '../output/characters-45/tooling/node_modules/@gltf-transform/functions/dist/index.js';
import {MeshoptSimplifier} from '../output/characters-45/tooling/node_modules/meshoptimizer/index.js';
import draco3d from '../output/characters-45/tooling/node_modules/draco3dgltf/draco3dgltf.js';
const install=process.argv.includes('--install'),selected=process.argv.filter(s=>/^QMSH-\d+$/.test(s));
const catalogPath='public/assets/characters/catalog.json',catalog=JSON.parse(await fs.readFile(catalogPath,'utf8')),output='output/npc-motion-fix/lod-candidates',backup='revisions/npc-motion-fix-before';
await fs.mkdir(output,{recursive:true});await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),records=[];
async function saveBackup(file){const target=path.join(backup,file);await fs.mkdir(path.dirname(target),{recursive:true});try{await fs.copyFile(file,target,2);}catch(e){if(e.code!=='EEXIST')throw e;}}
if(install)await saveBackup(catalogPath);
for(const asset of catalog.filter(a=>!selected.length||selected.includes(a.id))){
 const source=await fs.readFile('public/'+asset.file),doc=await io.readBinary(source),root=doc.getRoot();root.listAnimations().forEach(a=>a.dispose());let before=0,after=0,maxError=0;
 for(const mesh of root.listMeshes())for(const p of mesh.listPrimitives()){
  // Materials intentionally omitted: keep the full mesh's texture atlas at runtime.
  p.setMaterial(null);const index=p.getIndices(),position=p.getAttribute('POSITION');if(!index)throw Error(asset.id+' nonindexed primitive');before+=index.getCount()/3;if(index.getCount()<300){after+=index.getCount()/3;continue;}
  const attributes=['NORMAL','TEXCOORD_0','WEIGHTS_0','JOINTS_0'].map(name=>({name,a:p.getAttribute(name)})).filter(x=>x.a),weights=attributes.flatMap(({name,a})=>Array(a.getElementSize()).fill(name==='TEXCOORD_0'?1:name==='NORMAL'?.2:name==='WEIGHTS_0'?.5:.02));
  const stride=weights.length,data=new Float32Array(position.getCount()*stride);
  for(let i=0;i<position.getCount();i++){let offset=0;for(const {a} of attributes){const values=a.getElement(i,[]);data.set(values,i*stride+offset);offset+=values.length;}}
  const [indices,error]=MeshoptSimplifier.simplifyWithAttributes(Uint32Array.from(index.getArray()),Float32Array.from(position.getArray()),3,data,stride,weights,null,Math.max(90,Math.floor(index.getCount()*.4/3)*3),.01,['LockBorder']);
  p.setIndices(doc.createAccessor().setType('SCALAR').setBuffer(root.listBuffers()[0]).setArray(indices));compactPrimitive(p);after+=indices.length/3;maxError=Math.max(maxError,error);
 }
 await doc.transform(prune(),draco());const bytes=await io.writeBinary(doc),candidate=path.join(output,asset.id+'.lod.glb');await fs.writeFile(candidate,bytes);
 const row={id:asset.id,sourceSha256:hash(source),before,after,error:maxError,bytes:bytes.length,sha256:hash(bytes)};records.push(row);
 
 console.log(asset.id,before,'->',after,'error',maxError.toFixed(5));
}
if(install){for(const row of records){const asset=catalog.find(a=>a.id===row.id),target='public/'+asset.lodFile;await saveBackup(target);await fs.copyFile(path.join(output,row.id+'.lod.glb'),target);Object.assign(asset,{lodTriangles:row.after,lodBytes:row.bytes,lodSha256:row.sha256,lodRevision:'attribute-aware-local-repair-20260916'});}await fs.writeFile(catalogPath,JSON.stringify(catalog,null,2)+'\n');}await fs.writeFile(path.join(output,install?'installed.json':'preview.json'),JSON.stringify(records,null,2)+'\n');
