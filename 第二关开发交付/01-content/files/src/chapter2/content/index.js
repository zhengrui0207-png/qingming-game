import definition from './content.json' with {type:'json'};
const freeze = v => {if(v && typeof v==='object'){for(const x of Object.values(v))freeze(x);Object.freeze(v);}return v;};
export const content=freeze(definition);
export const getStory=id=>content.stories.find(s=>s.id===id)??null;
export const getDialogue=id=>content.dialogues.find(d=>d.id===id)??null;
export default content;
