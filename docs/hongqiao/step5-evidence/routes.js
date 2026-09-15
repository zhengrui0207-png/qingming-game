async (page) => {
 await page.goto('http://127.0.0.1:5181/?test',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForFunction(()=>window.__qingming?.getState().loaded,null,{timeout:120000});await page.locator('#start').click();
 const failures=[],rows=[],errors=[],failedRequests=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failedRequests.push({url:r.url(),error:r.failure()}));
 const check=(ok,label)=>{if(!ok)throw Error(label);};
 const state=()=>page.evaluate(()=>__hqProgress.getState());
 const go=async id=>{await page.evaluate(id=>{const c=__hqProgress.config,n=c.npcs.find(x=>x.id===id)??c.instances.find(x=>x.id===id),a=c.anchors.find(x=>x.id===n.anchorId);__qingming.setActor(a.position[0],a.position[2],a.layer);},id);await page.keyboard.press('e');await page.locator('#hq-dialogue[open]').waitFor({timeout:10000});};
 const advance=async()=>{for(let i=0;i<20;i++){const next=page.locator('[data-choice="hq_next"]');if(!await next.count())break;await next.click();}};
 const choose=async id=>{await advance();await page.locator('[data-choice="'+id+'"]').click();};
 const reload=async()=>{await page.reload({waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__qingming?.getState().loaded,null,{timeout:120000});await page.locator('#start').click();};
 const npc=['npc_hq_he','npc_hq_cheng','npc_hq_fang'];const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
 while(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');
 for(let route=0;route<orders.length;route++){
  console.log("ROUTE",route);
  await page.evaluate(()=>__hqProgress.restoreFixture({schemaVersion:2}));
  const evidence={order:orders[route].map(x=>npc[x]),beforeAccept:route===5,stages:[]};
  if(route!==5){await go('npc_hq_zhou');await choose('hq_accept');await page.keyboard.press('Escape');}
  for(const index of orders[route]){
   const id=npc[index];await go(id);const entry=await page.evaluate(()=>__hqProgress.getDialogue());
   if(route===0&&index===0){await advance();await page.keyboard.press('Escape');check((await state()).permissions.length===0,'Esc accidentally authorized');await go(id);await choose('dialogue_hq_he_ask');await choose('dialogue_hq_he_return');}
   const choiceId=await page.evaluate(id=>__hqProgress.config.dialogues.find(d=>d.npcId===id).id+'_permit',id);
   await choose(choiceId);let s=await state();check(s.permissions.length===evidence.stages.length+1,'permission not saved');check(s.worldState.collectedInstanceIds.length===evidence.stages.length,'authorization collected');
   if(route===0&&index===0){await reload();check((await state()).permissions.includes('permit_hq_rope'),'permission refresh');await go(id);check((await page.evaluate(()=>__hqProgress.getDialogue())).nodeId==='permitted','permitted branch');await page.keyboard.press('Escape');}
   await page.evaluate(id=>{const c=__hqProgress.config,permission=c.permissions.find(p=>p.grantedBy===id),item=c.instances.find(i=>i.permissionId===permission.id),a=c.anchors.find(a=>a.id===item.anchorId);__qingming.setActor(a.position[0],a.position[2],a.layer);},id);
   await page.keyboard.press('e');s=await state();check(s.worldState.collectedInstanceIds.length===evidence.stages.length+1,'E did not collect '+id);check(s.unlockedStoryIds.length===0,'stories prematurely unlocked');
   await go(id);check((await page.evaluate(()=>__hqProgress.getDialogue())).nodeId==='collected','collected branch');await page.keyboard.press('Escape');
   console.log("COLLECTED",route,id);
   evidence.stages.push({entry:entry.nodeId,inventory:s.inventory,permissions:s.permissions,collected:s.worldState.collectedInstanceIds});
   if(route===0&&index===1){await reload();check((await state()).worldState.collectedInstanceIds.length===2,'partial pickup refresh');}
  }
  if(route===5){await go('npc_hq_zhou');await choose('hq_accept');await page.keyboard.press('Escape');}
  await go('npc_hq_zhou');check((await page.evaluate(()=>__hqProgress.getDialogue())).nodeId==='HQ_41','not ready');await advance();
  if(route===0){const before=await state();await page.keyboard.press('Escape');check(JSON.stringify(await state())===JSON.stringify(before),'Esc delivered');await reload();await go('npc_hq_zhou');await advance();await page.locator('[data-choice="hq_no_delivery"]').click();check((await state()).quests.hongqiao_01.status==='active','cancel choice delivered');await go('npc_hq_zhou');await advance();await page.keyboard.down('e');await page.keyboard.press('e');await page.keyboard.up('e');check((await state()).quests.hongqiao_01.status==='active','held E delivered');}
  await page.locator('[data-choice="hq_deliver"]').click();await page.locator('#hq-dialogue[data-mode="ending"]').waitFor();
  let s=await state();check(s.quests.hongqiao_01.status==='completed'&&s.unlockedStoryIds.length===4&&s.endingPending,'transaction missing fields');check(Object.values(s.inventory).every(n=>n===0),'items not consumed');check(s.unlockedCodexIds.includes('journal_hq'),'journal missing');
  const replay=await page.evaluate(()=>{const before=__hqProgress.getState();const result=__hqProgress.dispatch({type:'completeQuest',questId:'hongqiao_01'});__hqProgress.refreshUI();return {unchanged:JSON.stringify(before)===JSON.stringify(__hqProgress.getState()),result};});check(replay.unchanged&&!replay.result.changed,'duplicate settlement');
  evidence.completed=s;evidence.replay=replay;
  if(route===0){await page.screenshot({path:'delivery-placeholder.png'});await page.keyboard.press('Escape');await reload();s=await state();check(s.endingPending&&s.worldState.shipState==='passed','completed reload terminal');check((await page.evaluate(()=>__hqProgress.getWorld())).instances.every(i=>!i.visible),'collected revived');evidence.reloaded=s;await page.locator('#hq-tracker').getByRole('button',{name:'继续收尾对白'}).click();}
  else await page.locator('[data-choice="hq_continue_closing"]').click();
  await choose('hq_closing_done');check((await state()).endingSeen&&!(await state()).endingPending,'closing not acknowledged');
  if(route===0)await page.screenshot({path:'completion-card.png'});
  await page.keyboard.press('Escape');await go('npc_hq_zhou');check((await page.evaluate(()=>__hqProgress.getDialogue())).nodeId==='HQ_44','post-completion branch');await page.keyboard.press('Escape');
  rows.push(evidence);fs.writeFileSync("routes-partial.json",JSON.stringify(rows,null,2));console.log("ROUTE PASS",route);
 }
 return {passed:rows.length,rows,errors,failedRequests};
}
