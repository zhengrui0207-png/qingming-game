async (page) => {
  const log=[];
  const check=(ok,name,data)=>{if(!ok)throw Error(name+': '+JSON.stringify(data));log.push({name,passed:true,data});};
  // Only this automation-owned DEV key. No writes to formal save keys.
  const formalBefore=await page.evaluate(()=>localStorage.getItem('qingming:hongqiao:save'));
  await page.evaluate(()=>localStorage.setItem(corePreview.saveKey,JSON.stringify(window.coreSample)));
  await page.reload();await page.waitForFunction(()=>!!window.corePreview);
  const migrated=await page.evaluate(()=>({state:corePreview.service.getState(),storage:corePreview.getStorage(),key:corePreview.saveKey,status:corePreview.service.getStatus()}));
  check(migrated.state.schemaVersion===3 && !migrated.state.travel.initialized && migrated.state.introSeen,'actual localStorage v2 migration with no C2 grants',migrated.status);
  check(JSON.parse(migrated.storage[migrated.key+':backup']).schemaVersion===2,'backup preserves exact old-schema full snapshot');
  await page.getByRole('button',{name:'设置已完成虹桥的测试 fixture'}).click();
  await page.getByRole('button',{name:'正式进入条件检查'}).click();
  await page.getByRole('button',{name:'借竿与教学鱼'}).click();
  const before=await page.evaluate(()=>corePreview.service.getState());
  check(before.travel.energy.current===76 && before.inventory.item_c2_fish_a===1,'entry grant and tutorial real service settlement');
  await page.getByRole('button',{name:'抛出普通钓杆'}).click();
  const cast=await page.evaluate(()=>corePreview.service.getState().travel.fishing.pendingCast);
  await page.reload();await page.waitForFunction(()=>!!window.corePreview);
  const refreshed=await page.evaluate(()=>corePreview.service.getState());
  check(refreshed.travel.energy.current===72 && refreshed.travel.fishing.pendingCast===null && refreshed.travel.fishing.lastCast.seed===cast.seed && refreshed.travel.fishing.lastCast.resultItemId===cast.resultItemId,'reload cancels pending cast without reroll or refund',refreshed.travel.fishing.lastCast);
  const failed=await page.evaluate(()=>{
    corePreview.setFailure(true);
    const id=corePreview.service.createTransactionId(),payload={shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]};
    const result=corePreview.service.dispatch({type:'c2/sell',transactionId:id,payload});
    const blocked=corePreview.send('startCast',{pointId:'point_c2_a',mode:'normal'});
    window.browserSale={id,payload};
    return {result,blocked,state:corePreview.service.getState(),pending:corePreview.service.getPendingSnapshot()};
  });
  check(failed.result.error.code==='save-failed' && failed.blocked.error.code==='save-pending' && failed.state.inventory.item_c2_fish_a===1 && failed.pending.inventory.item_c2_fish_a===0,'failed settlement stays in-page candidate and blocks next cast');
  await page.getByRole('button',{name:'恢复写入并重试'}).click();
  const retry=await page.evaluate(()=>({state:corePreview.service.getState(),duplicate:corePreview.service.dispatch({type:'c2/sell',transactionId:browserSale.id,payload:browserSale.payload}),storage:corePreview.getStorage(),key:corePreview.saveKey}));
  check(retry.state.inventory.item_c2_fish_a===0 && retry.state.travel.wallet.coins===14 && retry.duplicate.duplicate===true && JSON.parse(retry.storage[retry.key]).travel.wallet.coins===14,'verified retry applies once to actual storage',retry.duplicate);
  await page.reload();await page.waitForFunction(()=>!!window.corePreview);
  check(await page.evaluate(()=>corePreview.service.getState().travel.wallet.coins===14),'reload retains settlement, no entry regrant');
  await page.getByRole('button',{name:'维修 · 现金报酬'}).click();
  check(await page.evaluate(()=>corePreview.service.getState().travel.wallet.coins===30 && corePreview.service.getState().travel.energy.current===54),'cash branch actual browser persisted settlement');
  const recovery=await page.evaluate(()=>{
    corePreview.service.retrySave();const expected=corePreview.service.getState();const key=corePreview.saveKey;localStorage.setItem(key,'{broken-core-test');return expected;
  });
  await page.reload();await page.waitForFunction(()=>!!window.corePreview);
  const recovered=await page.evaluate(()=>({state:corePreview.service.getState(),status:corePreview.service.getStatus()}));
  check(recovered.status.kind==='recovered' && recovered.state.travel.wallet.coins===recovery.travel.wallet.coins && recovered.state.chapter2.repair.rewardChoice==='cash','actual browser corrupt-primary recovery',recovered.status);
  await page.getByRole('button',{name:'设置已完成虹桥的测试 fixture'}).click();await page.getByRole('button',{name:'正式进入条件检查'}).click();
  await page.getByRole('button',{name:'维修 · 铜铃报酬'}).click();
  check(await page.evaluate(()=>corePreview.service.getState().chapter2.repair.rewardChoice==='bell' && corePreview.service.getState().inventory.treasure_c2_silent_bell===1 && corePreview.service.getState().travel.wallet.coins===8),'bell branch actual browser persisted settlement');
  const formalAfter=await page.evaluate(()=>localStorage.getItem('qingming:hongqiao:save'));
  check(formalBefore===formalAfter,'formal storage untouched',formalAfter);
  await page.screenshot({path:'/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/03-core/qingming-game/docs/chapter2/core/browser-core.png',fullPage:true});
  return {scope:'independent DEV preview; real localStorage; fixture anchors; not main integration or human playtest',checks:log};
}
