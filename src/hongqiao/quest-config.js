// Compose executable choices over the surveyed anchors and approved text. No copy of story bodies.
export function buildQuestConfig(base, narrative) {
  const c = structuredClone(base);
  c.narrative = narrative;
  for(const story of c.stories)story.contentType='narrative_fiction';
  c.quest.rewardCodexIds = narrative.rewardCodexIds;
  c.codex.push({...narrative.journal, sources: [], sourceNotes: '书生、四位街坊及本次取物经历为游戏创作，不作为史料。'});
  for (const d of c.dialogues) {
    const close = {id: d.id + '_close', label: '暂时离开', effect: {type: 'close'}};
    const story = {id: d.id + '_story', label: '听听你的故事', goto: 'storyIntro'};
    const storyId = c.npcs.find(n => n.id === d.npcId).storyId;
    d.nodes.storyIntro = {lines: [c.npcs.find(n => n.id === d.npcId).name + '：' + narrative.storyIntroductions[d.npcId]], choices: [{id: d.id + '_read', label: '阅读人物故事', effect: {type: 'openStory', storyId}}, close]};
    if (d.npcId !== c.quest.giverId) {
      const labels = narrative.choiceLabels[d.npcId];
      const choices = [{id: d.id + '_permit', label: labels.confirm, effect: d.confirmEffect}, {id: d.id + '_ask', label: labels.followup, goto: 'followup'}, close];
      d.nodes.first.lines.push(...d.nodes.accepted.lines.slice(2));
      d.nodes.first.choices = choices; d.nodes.accepted.choices = choices;
      d.nodes.followup = {lines: d.optionalFollowup.lines, choices: [{id: d.id + '_return', label: '继续', goto: '$entry', choicesOnly: true}]};
      d.nodes.permitted.choices = [close]; d.nodes.collected.choices = [close]; d.nodes.completed.choices = [story, close];
    } else {
      const lines = d.nodes.HQ_01.lines;
      d.nodes.afterAccept = {lines: [lines.at(-1)], choices: [{...close, label: '这就动身'}]};
      d.nodes.HQ_01.lines = lines.slice(0,4).map((line,i) => (i===1?'书生':'老周') + '：' + line);
      d.nodes.HQ_01.choices = [
        {id:'hq_accept',label:'我这就去。',effect:{type:'acceptQuest',questId:c.quest.id},goto:'afterAccept'},
        {id:'hq_wait',label:'我先看看周围。',effect:{type:'close'}},
        {id:'hq_zhou_ask',label:'聊聊龙船',goto:'foreshadow'},
      ];
      d.nodes.foreshadow = {lines:['老周：年轻时见过龙船底下。上头再好看，底下也得看清。'],choices:[{id:'hq_zhou_back',label:'继续',goto:'$entry',choicesOnly:true}]};
      d.nodes.HQ_40.choices = [{id:'hq_keep_searching',label:'我再去找找',effect:{type:'close'}},{id:'hq_guide',label:'帮我指路',effect:{type:'chooseGuide'}}];
      d.nodes.HQ_41.choices = [{id:'hq_deliver',label:'交给您。',effect:{type:'completeQuest',questId:c.quest.id}},{id:'hq_no_delivery',label:'我再看看周围。',effect:{type:'close'}}];
      d.nodes.HQ_44.choices = [story,{id:'hq_revisit_ending',label:'回顾收尾',effect:{type:'showClosing'}},close];
    }
    delete d.choices; // Legacy survey-only choices were not bound to a node.
  }
  return c;
}
