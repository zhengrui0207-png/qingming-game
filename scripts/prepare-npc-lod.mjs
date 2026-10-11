import fs from 'node:fs/promises';
import {NodeIO} from '../output/characters-45/tooling/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../output/characters-45/tooling/node_modules/@gltf-transform/extensions/dist/index.js';
import {compactPrimitive,prune,draco} from '../output/characters-45/tooling/node_modules/@gltf-transform/functions/dist/index.js';
import {MeshoptSimplifier} from '../output/characters-45/tooling/node_modules/meshoptimizer/index.js';
import draco3d from '../output/characters-45/tooling/node_modules/draco3dgltf/draco3dgltf.js';
await MeshoptSimplifier.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});
const catalog=JSON.parse(await fs.readFile('public/assets/characters/catalog.json','utf8'));
const only=process.argv[2];
if(only&&!catalog.some(a=>a.id===only))throw Error('Unknown character: '+only);
for(const a of catalog.filter(a=>!only||a.id===only)){
 const doc=await io.read('public/'+a.file),r=doc.getRoot();r.listAnimations().forEach(x=>x.dispose());
 // Runtime reuses the full-detail material, so LODs need no second copy of textures.
 for(const m of r.listMeshes())for(const p of m.listPrimitives())p.setMaterial(null);
 for(const m of r.listMeshes())for(const p of m.listPrimitives()){
  const source=p.getIndices();if(!source||source.getCount()<300)continue;
  const [indices]=MeshoptSimplifier.simplifySloppy(Uint32Array.from(source.getArray()),Float32Array.from(p.getAttribute('POSITION').getArray()),3,null,Math.max(90,Math.floor(source.getCount()*.10/3)*3),.025);
  p.setIndices(doc.createAccessor().setType('SCALAR').setBuffer(r.listBuffers()[0]).setArray(indices));compactPrimitive(p);
 }
 await doc.transform(prune(),draco());
 a.lodFile=`assets/characters/${a.id}.lod.glb`;
 await io.write('public/'+a.lodFile,doc);
 a.lodTriangles=r.listMeshes().reduce((s,m)=>s+m.listPrimitives().reduce((n,p)=>n+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
 a.lodBytes=(await fs.stat('public/'+a.lodFile)).size;
 console.log(a.id,a.triangles,'->',a.lodTriangles,a.lodBytes);
}
await fs.writeFile('public/assets/characters/catalog.json',JSON.stringify(catalog,null,2));
