// Pure state rules. No DOM, renderer or browser storage dependencies.
import {emptyChapter2Extension} from '../chapter2/contracts/index.js';
import {normalizeCore} from '../chapter2/core/state.js';
export const SCHEMA_VERSION = 3;
const copy = value => structuredClone(value);
const unique = values => [...new Set(values)];
const object = v => v && typeof v === 'object' && !Array.isArray(v);
const list = (v, name) => {
  if (v === undefined) return [];
  if (!Array.isArray(v) || !v.every(x => typeof x === 'string')) throw Error(`Invalid ${name}`);
  return unique(v);
};
export function defaultState() {
  return {schemaVersion: SCHEMA_VERSION, revision: 0, inventory: {}, unlockedCodexIds: [], permissions: [],
    worldState: {collectedInstanceIds: []}, quests: {}, unlockedStoryIds: [], readStoryIds: [],
    storyReadingProgress: {}, readContentVersions: {}, introStatus: 'unseen', introSeen: false,
    endingPending: false, endingSeen: false, ...emptyChapter2Extension()};
}
export function normalizeState(input, config) {
  if (!object(input)) throw Error('Invalid snapshot');
  const version = input.schemaVersion ?? 1;
  if (!Number.isInteger(version) || version < 1 || version > SCHEMA_VERSION) throw Error('Unsupported schemaVersion');
  const s = {...defaultState(), ...copy(input), schemaVersion: SCHEMA_VERSION};
  if (!Number.isSafeInteger(s.revision) || s.revision < 0) throw Error('Invalid revision');
  if (version === 1 && Array.isArray(s.inventory)) s.inventory = Object.fromEntries(unique(s.inventory).map(id => [id, 1]));
  for (const name of ['inventory','quests','worldState','storyReadingProgress','readContentVersions']) {
    if (!object(s[name])) throw Error(`Invalid ${name}`);
  }
  for (const n of Object.values(s.inventory)) if (!Number.isSafeInteger(n) || n < 0) throw Error('Invalid item quantity');
  for (const name of ['permissions','unlockedCodexIds','unlockedStoryIds','readStoryIds']) s[name] = list(s[name], name);
  s.worldState.collectedInstanceIds = list(input.worldState?.collectedInstanceIds ?? (version === 1 ? input.collectedInstanceIds : undefined), 'collectedInstanceIds');
  if (version === 1 && input.questStatus && !s.quests[config.quest.id]) s.quests[config.quest.id] = {status: input.questStatus};
  const q = s.quests[config.quest.id];
  if (q !== undefined && (!object(q) || !['available','active','ready','completed'].includes(q.status))) throw Error('Invalid quest');
  // Ready is derived from quantities; never persist an independent collection counter.
  if (q?.status === 'ready') q.status = 'active';
  for (const i of config.instances) {
    if (s.worldState.collectedInstanceIds.includes(i.id)) {
      const npcId = config.permissions.find(p => p.id === i.permissionId).grantedBy;
      s.permissions = unique([...s.permissions, i.permissionId]);
      s.unlockedCodexIds = unique([...s.unlockedCodexIds, i.itemId, npcId]);
    }
  }
  const storyIds = config.stories.map(x => x.storyId);
  s.unlockedStoryIds = s.unlockedStoryIds.filter(id => !storyIds.includes(id));
  if (q?.status === 'completed') s.unlockedStoryIds = unique([...s.unlockedStoryIds, ...storyIds]);
  if (q?.status === 'completed') {
    s.unlockedCodexIds = unique([...s.unlockedCodexIds, ...(config.quest.rewardCodexIds ?? [])]);
    s.worldState.shipState = 'passed';
  } else if (q?.status === 'active' || s.permissions.length || s.worldState.collectedInstanceIds.length || s.introStatus === 'playing') {
    s.worldState.shipState = 'waiting'; s.introStatus = 'seen'; s.introSeen = true;
  }
  for (const story of config.stories) {
    const p = s.storyReadingProgress[story.storyId];
    const section = story.sections.find(x => x.id === p?.sectionId);
    if (p && (p.contentVersion !== story.contentVersion || !section || !Number.isInteger(p.paragraphIndex) || p.paragraphIndex < 0 || p.paragraphIndex >= section.paragraphs.length)) {
      delete s.storyReadingProgress[story.storyId];
    }
  }
  delete s.collectedInstanceIds;
  delete s.questStatus;
  return normalizeCore(s, version);
}
export function questStage(s, config) {
  const status = s.quests[config.quest.id]?.status ?? 'available';
  return status === 'active' && config.quest.requiredItems.every(i => (s.inventory[i.itemId] ?? 0) >= i.quantity) ? 'ready' : status;
}
export function reduceState(state, action, config) {
  const s = copy(state);
  if (action.type === 'acceptQuest') {
    if (action.questId !== config.quest.id) return {ok:false,reason:'unknown-quest'};
    if (['active','completed'].includes(s.quests[action.questId]?.status)) return {ok:true,changed:false,state};
    s.quests[action.questId] = {...s.quests[action.questId],status:'active'};
    s.unlockedCodexIds = unique([...s.unlockedCodexIds,config.quest.giverId]);
  } else if (action.type === 'completeQuest') {
    if (action.questId !== config.quest.id) return {ok:false,reason:'unknown-quest'};
    if (s.quests[action.questId]?.status === 'completed') return {ok:true,changed:false,state};
    if (questStage(s,config) !== 'ready') return {ok:false,reason:'quest-not-ready'};
    for (const item of config.quest.requiredItems) s.inventory[item.itemId] -= item.quantity;
    s.quests[action.questId] = {...s.quests[action.questId],status:'completed'};
    s.unlockedCodexIds = unique([...s.unlockedCodexIds,...(config.quest.rewardCodexIds ?? [])]);
    s.unlockedStoryIds = unique([...s.unlockedStoryIds,...config.quest.rewardStoryIds]);
    s.endingPending = true; s.endingSeen = false; s.worldState.shipState = 'passing';
  } else if (action.type === 'beginIntro') {
    if (s.introSeen || s.introStatus === 'playing' || questStage(s,config) !== 'available' || s.permissions.length || s.worldState.collectedInstanceIds.length) return {ok:true,changed:false,state};
    s.introStatus = 'playing';
  } else if (action.type === 'finishIntro') {
    if (s.introSeen) return {ok:true,changed:false,state};
    s.introStatus = 'seen'; s.introSeen = true;
    s.worldState.shipState = questStage(s,config) === 'completed' ? 'passed' : 'waiting';
  } else if (action.type === 'finishEnding' || action.type === 'acknowledgeEnding') {
    if (questStage(s,config) !== 'completed') return {ok:false,reason:'quest-not-completed'};
    if (action.type === 'finishEnding' && s.worldState.shipState === 'passed' || action.type === 'acknowledgeEnding' && s.endingSeen && !s.endingPending) return {ok:true,changed:false,state};
    s.worldState.shipState = 'passed';
    if (action.type === 'acknowledgeEnding') {s.endingSeen = true; s.endingPending = false;}
  } else if (action.type === 'unlockCodex') {
    if (action.codexId !== config.narrative?.guide.culture.codexId) return {ok:false,reason:'unknown-exploration'};
    if (s.unlockedCodexIds.includes(action.codexId)) return {ok:true,changed:false,state};
    s.unlockedCodexIds.push(action.codexId);
  } else if (action.type === 'grantPermission') {
    if (!config.permissions.some(p => p.id === action.permissionId)) return {ok: false, reason: 'unknown-permission'};
    if (s.permissions.includes(action.permissionId)) return {ok: true, changed: false, state};
    s.permissions.push(action.permissionId);
  } else if (action.type === 'collect') {
    const i = config.instances.find(x => x.id === action.instanceId);
    if (!i) return {ok: false, reason: 'unknown-instance'};
    if (s.worldState.collectedInstanceIds.includes(i.id)) return {ok: true, changed: false, state};
    if (!s.permissions.includes(i.permissionId)) return {ok: false, reason: 'permission-required'};
    s.worldState.collectedInstanceIds.push(i.id);
    s.inventory[i.itemId] = (s.inventory[i.itemId] ?? 0) + i.quantity;
    const npc = config.permissions.find(p => p.id === i.permissionId).grantedBy;
    s.unlockedCodexIds = unique([...s.unlockedCodexIds, i.itemId, npc]);
  } else if (action.type === 'readParagraph') {
    const story = config.stories.find(x => x.storyId === action.storyId);
    if (!story || !s.unlockedStoryIds.includes(story.storyId) || s.quests[story.unlockQuestId]?.status !== 'completed') return {ok: false, reason: 'story-locked'};
    const section = story.sections.find(x => x.id === action.sectionId);
    const index = action.paragraphIndex;
    if (!section || !Number.isInteger(index) || index < 0 || index >= section.paragraphs.length) return {ok: false, reason: 'invalid-position'};
    const position = {contentVersion: story.contentVersion, sectionId: section.id, paragraphIndex: index};
    if (JSON.stringify(s.storyReadingProgress[story.storyId]) === JSON.stringify(position)) return {ok: true, changed: false, state};
    s.storyReadingProgress[story.storyId] = position;
    if (section === story.sections.at(-1) && index === section.paragraphs.length - 1) {
      s.readStoryIds = unique([...s.readStoryIds, story.storyId]);
      s.readContentVersions[story.storyId] = story.contentVersion;
    }
  } else return {ok: false, reason: 'unknown-action'};
  if (['acceptQuest','grantPermission','collect'].includes(action.type)) {
    s.introStatus = 'seen'; s.introSeen = true;
    s.worldState.shipState = questStage(s,config) === 'completed' ? 'passed' : 'waiting';
  }
  s.revision++;
  return {ok: true, changed: true, state: s};
}
