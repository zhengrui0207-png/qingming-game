import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const manifestPath=process.argv[2];
if(!manifestPath)throw new Error('Provide files.json absolute path');
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const delivery=path.dirname(manifestPath), failures=[];
for(const f of manifest.files){
 const file=path.join(delivery,'files',f.path);
 const got=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 if(got!==f.newSHA256)failures.push(f.path);
}
console.log(JSON.stringify({verified:manifest.files.length,failures},null,2));
if(failures.length)process.exitCode=1;
