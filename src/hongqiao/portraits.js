// Portraits are local renders of the existing accepted models, never new characters.
export const portraits={
 '书生':{id:'player_scholar',label:'书生'},'阿青':{id:'player_scholar',label:'书生'},
 '老周':{id:'npc_hq_zhou',label:'老周'},'何伯':{id:'npc_hq_he',label:'何伯'},
 '阿成':{id:'npc_hq_cheng',label:'阿成'},'程大年':{id:'npc_hq_cheng',label:'阿成'},'方娘子':{id:'npc_hq_fang',label:'方娘子'}
};
export function speakerPortrait(name){const entry=portraits[name];return entry?{...entry,src:import.meta.env.BASE_URL+'assets/portraits/'+entry.id+'.png'}:null;}
