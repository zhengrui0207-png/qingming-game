async (page) => {
 const journal=await page.evaluate(()=>window.__fishingEvidence??{checks:[],console:[],networkFailures:[],screenshots:[],samples:[]});
 const observe=()=>page.evaluate(()=>window.__fishingPreview.inspect());
 const check=(name,pass,detail)=>{journal.checks.push({name,pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail));};
 const view=page.getByRole('combobox',{name:'取景定位（非步行证据）',exact:true});await view.selectOption('anchor_c2_fisher');await page.getByRole('button',{name:'请鲁七托取木牌',exact:true}).click();await view.selectOption('anchor_c2_fishing_b');
 const before=await observe();await page.locator('canvas').click();await page.keyboard.press('e');
 await page.getByRole('checkbox',{name:'取回鲁七的木牌',exact:true}).waitFor();
 await page.getByRole('button',{name:'抛竿 · 精力−4',exact:true}).click();
 const pending=await observe();check('fixed quest mode at measured second shore',pending.snapshot.travel.fishing.pendingCast.mode==='token'&&pending.snapshot.travel.fishing.pendingCast.pointId==='point_c2_b',pending.snapshot.travel.fishing.pendingCast);
 await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='bite',{timeout:20000});await page.getByRole('button',{name:'收杆',exact:true}).click();await page.waitForFunction(()=>window.__fishingPreview.module.getState().phase==='result',{timeout:10000});
 const after=await observe();check('wooden token instance collection and story stage saved',after.snapshot.inventory.treasure_c2_marked_token===1&&after.snapshot.travel.collection.treasure_c2_marked_token.totalObtained===1&&after.snapshot.chapter2.storyStages.story_c2_marked_token==='stage_c2_marked_token_known',after.module.result);
 check('token does not consume rare pity',after.snapshot.travel.fishing.rareMisses===before.snapshot.travel.fishing.rareMisses,{before:before.snapshot.travel.fishing.rareMisses,after:after.snapshot.travel.fishing.rareMisses});
 journal.samples.push({kind:'固定木牌支线（非随机）',point:after.module.pointId,itemId:after.module.result.itemId,elapsedSeconds:after.module.elapsedSeconds});
 await page.screenshot({path:'/Users/zhengrui/Documents/ChatGPT/清明上河图/第二关开发工作区/04-fishing/qingming-game/docs/chapter2/fishing/output/playwright/07-token.png'});journal.screenshots.push('07-token.png');
 await page.keyboard.press('Escape');const done=await observe();check('Esc after success does not duplicate token',done.snapshot.inventory.treasure_c2_marked_token===1&&done.locks.length===0&&done.camera.owner===null,done.locks);
 await page.evaluate(value=>window.__fishingEvidence=value,journal);return journal;
}
