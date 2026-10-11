async (page) => {
 await page.waitForFunction(()=>window.__fishingPreview?.ready,{timeout:20000});
 const journal=await page.evaluate(()=>window.__fishingEvidence??{checks:[],console:[],networkFailures:[],screenshots:[],samples:[]});
 const observe=()=>page.evaluate(()=>window.__fishingPreview.inspect());
 const check=(name,pass,detail)=>{journal.checks.push({name,pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
 const start=await observe();
 const sample=page.getByRole('combobox',{name:'下一杆服务种子样本',exact:true});
 await sample.selectOption('junk');await page.locator('canvas').click();await page.keyboard.press('e');await page.getByRole('button',{name:'抛竿 · 精力−4',exact:true}).click();
 await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='bite',{timeout:20000});await page.getByRole('button',{name:'收杆',exact:true}).click();await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='result',{timeout:10000});
 const junk=await observe();check('real service junk sample and permanent record',junk.module.result.itemId.includes('junk_')&&!!junk.snapshot.travel.collection[junk.module.result.itemId],junk.module.result);
 journal.samples.push({kind:'DEV强制服务种子：杂物',point:junk.module.pointId,itemId:junk.module.result.itemId,elapsedSeconds:junk.module.elapsedSeconds});
 await page.screenshot({path:'/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/04-fishing/qingming-game/docs/chapter2/fishing/output/playwright/05-junk.png'});journal.screenshots.push('05-junk.png');
 await page.getByRole('button',{name:'再钓一杆',exact:true}).click();await sample.selectOption('rare');await page.getByRole('button',{name:'抛竿 · 精力−4',exact:true}).click();
 await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='bite',{timeout:20000});await page.getByRole('button',{name:'收杆',exact:true}).click();await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='result',{timeout:10000});
 const rare=await observe();check('continue casts reuse camera and settle rare sample once',rare.module.result.itemId==='item_c2_rare_copper_piece'&&rare.snapshot.inventory.item_c2_rare_copper_piece===1,rare.module.result);
 check('rare resets pity',rare.snapshot.travel.fishing.rareMisses===0,rare.snapshot.travel.fishing.rareMisses);
 journal.samples.push({kind:'DEV强制服务种子：珍稀',point:rare.module.pointId,itemId:rare.module.result.itemId,elapsedSeconds:rare.module.elapsedSeconds});
 await page.screenshot({path:'/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/04-fishing/qingming-game/docs/chapter2/fishing/output/playwright/06-rare.png'});journal.screenshots.push('06-rare.png');
 await page.getByRole('button',{name:'离开 · Esc',exact:true}).click();const done=await observe();check('after repeat casts camera restores exact control state and no lock remains',done.camera.owner===null&&done.camera.yaw===start.camera.yaw&&done.camera.pitch===start.camera.pitch&&done.camera.distance===start.camera.distance&&done.locks.length===0,done.camera);
 await sample.selectOption('random');await page.evaluate(value=>{window.__fishingEvidence=value;},journal);return journal;
}
