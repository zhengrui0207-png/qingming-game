import fs from 'node:fs';
import {validateContract,validateAction,validateContent,validateSceneManifest,validateExtension} from '../src/chapter2/contracts/validate.js';
import {emptyChapter2Extension} from '../src/chapter2/contracts/index.js';
const [kind='contract',file,...flags]=process.argv.slice(2);
const methods={contract:validateContract,action:validateAction,content:validateContent,scene:validateSceneManifest,extension:validateExtension};
if(!methods[kind]){console.error('Usage: node scripts/validate-chapter2-contract.mjs contract | action|content|scene|extension file.json [--ready]');process.exit(2);}
try{const data=file?JSON.parse(fs.readFileSync(file,'utf8')):kind==='extension'?emptyChapter2Extension():undefined;
 if(!data&&kind!=='contract')throw Error('JSON file required');
 const r=methods[kind](data,{ready:flags.includes('--ready')});console.log(JSON.stringify({kind,mode:flags.includes('--ready')?'ready':'draft',...r},null,2));if(!r.ok)process.exitCode=1;
}catch(e){console.error(e.message);process.exitCode=2;}
