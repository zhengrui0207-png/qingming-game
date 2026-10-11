import {readFileSync,writeFileSync} from 'node:fs';
import {normalizeState} from '../../../src/hongqiao/state.js';
import config from '../../../src/hongqiao/config.json' with {type:'json'};
const rows=[];
for(const file of ['historical-step4-save-samples.json','historical-step5-save-samples.json','automation-fresh-origin.json']){
  const pack=JSON.parse(readFileSync(new URL(`./samples/${file}`,import.meta.url)));
  const snapshots=file==='automation-fresh-origin.json'?Object.entries(pack.keys).map(([k,v])=>[k,JSON.parse(v)]):Object.entries(pack).filter(([,v])=>v?.schemaVersion);
  for(const [name,s] of snapshots){
    const m=normalizeState(s,config);
    const retained={};for(const k of ['permissions','inventory','readStoryIds','storyReadingProgress','readContentVersions','endingPending','endingSeen','introSeen'])if(s[k]!==undefined)retained[k]=JSON.stringify(s[k])===JSON.stringify(m[k]);
    // v1 array inventory and stale story offsets follow the existing documented migration semantics.
    const expectedTransforms=s.introStatus==='playing' && m.introStatus==='seen'?[{field:'introStatus/introSeen',from:'playing/false',to:'seen/true',reason:'Existing HQ reload recovery prevents resuming an orphaned opening presentation'}]:[];
    rows.push({file,name,expectedTransforms,inputVersion:s.schemaVersion,targetVersion:m.schemaVersion,retained,storyCount:m.unlockedStoryIds.length,chapter2Initialized:m.travel.initialized,coins:m.travel.wallet.coins,energy:m.travel.energy.current});
  }
}
writeFileSync(new URL('./migration-report.json',import.meta.url),JSON.stringify({provenance:'P0 retained historical/browser samples; NOT current user save; no personal storage read',rows},null,2));
console.log(JSON.stringify({snapshots:rows.length,targetVersion:3,unexpectedV2Loss:rows.filter(x=>x.inputVersion===2 && Object.entries(x.retained).some(([k,v])=>!v && !(k==='introSeen' && x.expectedTransforms.length))),chapter2FreeGrants:rows.some(x=>x.coins||x.energy)},null,2));
