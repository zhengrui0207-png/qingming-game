import fs from 'node:fs';
import {validateHongqiao} from '../src/hongqiao/validate.js';
const c=JSON.parse(fs.readFileSync(new URL('../src/hongqiao/config.json',import.meta.url))),w=JSON.parse(fs.readFileSync(new URL('../public/assets/world.json',import.meta.url)));
const result=validateHongqiao(c,w);
for(const a of c.assets)if(!fs.existsSync(new URL('../public/'+a.path,import.meta.url)))result.errors.push('缺失资产: '+a.path);
result.ok=result.errors.length===0;console.log(JSON.stringify(result,null,2));process.exitCode=result.ok?0:1;
