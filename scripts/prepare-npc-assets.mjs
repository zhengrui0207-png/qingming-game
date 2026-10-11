import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {NodeIO} from '../output/characters-45/tooling/node_modules/@gltf-transform/core/dist/index.js';
import {ALL_EXTENSIONS} from '../output/characters-45/tooling/node_modules/@gltf-transform/extensions/dist/index.js';
import {textureCompress,draco} from '../output/characters-45/tooling/node_modules/@gltf-transform/functions/dist/index.js';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)('../output/characters-45/tooling/node_modules/sharp');
import draco3d from '../output/characters-45/tooling/node_modules/draco3dgltf/draco3dgltf.js';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.encoder':await draco3d.createEncoderModule(),'draco3d.decoder':await draco3d.createDecoderModule()});
const only=process.argv[2];
const selected=JSON.parse(await fs.readFile('output/npc-integration/selected-assets.json','utf8'));
if(only&&!selected.some(a=>a.id===only))throw Error('Unknown character: '+only);
const result=only?JSON.parse(await fs.readFile('public/assets/characters/catalog.json','utf8')).filter(a=>a.id!==only):[];
await fs.mkdir('public/assets/characters',{recursive:true});await fs.mkdir('public/assets/draco',{recursive:true});
for(const f of ['draco_decoder.wasm','draco_wasm_wrapper.js','draco_decoder.js'])await fs.copyFile(`node_modules/three/examples/jsm/libs/draco/gltf/${f}`,`public/assets/draco/${f}`);
for(const a of selected.filter(a=>!only||a.id===only)){
 const doc=await io.read(a.source),root=doc.getRoot();
 const triangles=root.listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
 const before={skins:root.listSkins().length,animations:root.listAnimations().map(c=>c.getName()),triangles};
 const path=`public/assets/characters/${a.id}.glb`;
 await doc.transform(textureCompress({encoder:sharp,resize:[1024,1024]}),draco());await io.write(path,doc);
 const checked=await io.read(path);if(checked.getRoot().listAnimations().length!==before.animations.length||checked.getRoot().listSkins().length!==before.skins)throw Error(`${a.id} changed rig/animation`);
 const bytes=await fs.readFile(path);const {source,sourceSha256,...publicMetadata}=a;
 result.push({...publicMetadata,...before,file:`assets/characters/${a.id}.glb`,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),textureMax:1024});
 console.log(a.id,before.skins,before.animations.join(','),bytes.length);
}
result.sort((a,b)=>a.number-b.number);
await fs.writeFile('public/assets/characters/catalog.json',JSON.stringify(result,null,2));
console.log('Packaged',result.length,'characters; bytes',result.reduce((s,a)=>s+a.bytes,0));
