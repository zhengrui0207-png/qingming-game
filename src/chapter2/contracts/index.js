// P0 contract only. Not mounted in the game; no wallet or quest mutations here.
import definition from './contract.json' with {type: 'json'};
const freeze = value => { if (value && typeof value === 'object') { for (const v of Object.values(value)) freeze(v); Object.freeze(value); } return value; };
export const contract = freeze(definition);
export const CONTRACT_VERSION = contract.contractVersion;
export const ids = freeze({
 region: contract.region.id, entry: contract.entry.id, mainQuest: contract.region.mainQuestId,
 npcs: Object.fromEntries(contract.npcs.map(x => [x.role,x.id])),
 items: Object.fromEntries(contract.items.map(x => [x.id,x])),
 anchors: contract.anchors.map(x => x.id),
 stories: contract.stories.map(x => x.id),
 actions: contract.actions.map(x => x.type),
});
export const itemDefinition = id => contract.items.find(x => x.id === id) ?? null;
export function emptyChapter2Extension() {
 return {travel:{
   initialized:false,regionId:'region_c',wallet:{coins:0},
   energy:{current:0,max:contract.balance.maxEnergy,reserved:0,passiveSeconds:0},
   instances:{},collection:{},storyReadingProgress:{},readStoryIds:[],
   commerce:{receipts:[],buyback:[],shopStock:{},barterCounts:{}},
   relief:{debt:0,firstCastGuaranteed:false,recoveryEpoch:0},
   fishing:{sequence:0,pendingCast:null,rareMisses:0,tutorialCompleted:false,tokenObtained:false},
   transactions:{saveEpoch:null,nextSequence:0,committedThrough:0,recent:[]}
 },chapter2:{
   contractVersion:CONTRACT_VERSION,entryCount:0,safeAnchorId:null,mainStatus:'available',
   goalIds:[],quests:Object.fromEntries(contract.quests.map(q=>[q.id,{status:'available'}])),repair:{status:'available',stepIds:[],reserved:0,rewardChoice:null},
   storyStages:{},presentations:{intro:'unseen',ending:'unseen'},
   timing:{firstOperativeAt:null,events:[],externalInterruptions:[]}
 }};
}
