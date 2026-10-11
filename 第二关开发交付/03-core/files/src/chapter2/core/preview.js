import {createSharedService,configuration as C,developmentSaveKey} from './service.js';
import {defaultState} from '../../hongqiao/state.js';
const saveKey=developmentSaveKey({development:import.meta.env.DEV,url:location.href,session:'core-preview'});
const anchors=C.anchors.map(x=>({...x,position:[0,.94,0],surfaceEvidence:'DEV fixture only, no actual reachability evidence'}));
let fail=false;
const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>{if(fail)throw Error('DEV injected QuotaExceededError');localStorage.setItem(k,v);}};
const frame={regionId:'region_d',operative:true,visible:true,focused:true,actor:{x:0,z:0,height:.94,layer:'ground',mode:'walk'}};
const service=createSharedService({storage,saveKey,development:import.meta.env.DEV,anchors,ports:{getFrame:()=>frame},onError:()=>{}});
const result=document.querySelector('#result');
const send=(name,payload={})=>service.dispatch({type:`c2/${name}`,transactionId:service.createTransactionId(),payload});
function render(){const s=service.getState();document.querySelector('#key').textContent=`隔离存档键：${saveKey}`;document.querySelector('#summary').innerHTML=`<div>铜钱<strong>${s.travel.wallet.coins} 文</strong></div><div>精力<strong>${s.travel.energy.current} / 100</strong></div><div>预留<strong>${s.travel.energy.reserved}</strong></div><div>区域<strong>${s.travel.regionId}</strong></div>`;document.querySelector('#status').textContent=service.getStatus().message;document.querySelector('#snapshot').textContent=JSON.stringify(s,null,2);}
function show(fn){try{result.textContent=JSON.stringify(fn(),null,2);}catch(e){result.textContent=e.stack;}render();}
function must(name,payload){const r=send(name,payload);if(!r.ok)throw Error(JSON.stringify(r));return r;}
document.querySelector('#prepare').onclick=()=>show(()=>service.restoreFixture(window.coreSample));
const response=await fetch('/docs/chapter2/core/samples/automation-fresh-origin.json');const sample=await response.json();window.coreSample=JSON.parse(sample.keys['qingming:hongqiao:save']);
document.querySelector('#fixture').onclick=()=>show(()=>{const s=defaultState();s.quests.hongqiao_01={status:'completed'};s.endingSeen=true;s.fixtureSource='DEV hand-authored completed-HQ fixture; NOT user gameplay';return service.restoreFixture(s);});
document.querySelector('#enter').onclick=()=>show(()=>send('enterChapter2',{entryId:C.entry.id}));
document.querySelector('#tutorial').onclick=()=>show(()=>{must('acceptQuest',{questId:'quest_c2_fishing_intro'});const r=must('startCast',{pointId:'point_c2_a',mode:'tutorial'});return send('resolveCast',{castId:r.data.cast.id,outcome:'caught'});});
document.querySelector('#start').onclick=()=>show(()=>send('startCast',{pointId:'point_c2_a',mode:'normal'}));
document.querySelector('#resolve').onclick=()=>show(()=>send('resolveCast',{castId:service.getState().travel.fishing.pendingCast?.id??'none',outcome:'caught'}));
document.querySelector('#sell').onclick=()=>show(()=>send('sell',{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}));
function repair(choice){must('acceptQuest',{questId:'quest_c2_main'});must('acceptQuest',{questId:'quest_c2_repair'});must('beginRepair',{repairId:C.repair.id});for(const stepId of C.repair.stepIds)must('advanceRepair',{repairId:C.repair.id,stepId});must('completeRepair',{repairId:C.repair.id});return send('chooseReward',{repairId:C.repair.id,choice});}
document.querySelector('#cash').onclick=()=>show(()=>repair('cash'));document.querySelector('#bell').onclick=()=>show(()=>repair('bell'));
document.querySelector('#fail').onclick=()=>show(()=>{fail=true;return {failureInjected:true};});
document.querySelector('#retry').onclick=()=>show(()=>{fail=false;return service.retrySave();});
document.querySelector('#reload').onclick=()=>location.reload();
service.subscribe(render);render();window.corePreview={service,send,frame,saveKey,setFailure:value=>{fail=value;},getStorage:()=>Object.fromEntries([saveKey,saveKey+':backup'].map(k=>[k,localStorage.getItem(k)]))};
