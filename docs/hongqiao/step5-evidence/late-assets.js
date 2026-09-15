async (page) => {
 const check=(v,m)=>{if(!v)throw Error(m)};let delayed;const out={};
 await page.evaluate(()=>__hqProgress.restoreFixture({schemaVersion:2}));
 await page.route('**/assets/hongqiao/item_hq_rope.glb',r=>{delayed=r;});await page.route('**/assets/hongqiao/item_hq_pole.glb',r=>r.abort('failed'));
 await page.reload({waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__qingming?.getState().loaded,null,{timeout:120000});await page.locator('#start').click();
 check(!!delayed,'rope not delayed');out.initial=await page.evaluate(()=>__hqProgress.getWorld());
 const take=async id=>{await page.evaluate(id=>{const c=__hqProgress.config,n=c.npcs.find(n=>n.id===id),a=c.anchors.find(a=>a.id===n.anchorId);__qingming.setActor(a.position[0],a.position[2]);},id);await page.keyboard.press('e');for(let i=0;i<12&&await page.locator('[data-choice="hq_next"]').count();i++)await page.locator('[data-choice="hq_next"]').click();const choice=await page.evaluate(id=>__hqProgress.config.dialogues.find(d=>d.npcId===id).id+'_permit',id);await page.locator('[data-choice="'+choice+'"]').click();await page.evaluate(id=>{const c=__hqProgress.config,p=c.permissions.find(p=>p.grantedBy===id),i=c.instances.find(i=>i.permissionId===p.id),a=c.anchors.find(a=>a.id===i.anchorId);__qingming.setActor(a.position[0],a.position[2]);},id);await page.keyboard.press('e');};
 await take('npc_hq_he');await take('npc_hq_cheng');await delayed.continue();await page.waitForFunction(()=>__hqProgress.getWorld().instances.find(i=>i.id==='instance_hq_rope_01').loadState==='discarded-collected');out.after=await page.evaluate(()=>({world:__hqProgress.getWorld(),state:__hqProgress.getState()}));check(out.after.world.instances.filter(i=>i.id!=='instance_hq_cloth_01').every(i=>!i.visible),'late item resurrected');check(out.after.state.inventory.item_hq_rope===1&&out.after.state.inventory.item_hq_pole===1,'placeholder not collectable');await page.unrouteAll();
 return out;
}
