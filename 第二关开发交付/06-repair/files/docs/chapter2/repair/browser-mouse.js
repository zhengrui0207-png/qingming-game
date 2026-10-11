async page => {
 const read=()=>page.evaluate(()=>window.__repairPreview.inspect());
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 const evidence=[];
 await page.locator('#repair').click();await page.locator('[data-action=start]').click();
 let s=await read();check(s.snapshot.travel.energy.reserved===18,'reserve18');evidence.push({id:'real-begin',actor:s.actor,energy:s.snapshot.travel.energy});
 await page.locator('[data-inspect="0"]').click();s=await read();check(s.snapshot.chapter2.repair.stepIds.length===0,'scratch must not advance');
 await page.screenshot({path:'01-inspect.png'});
 await page.locator('[data-inspect="1"]').click();await page.locator('[data-inspect="2"]').click();
 await page.keyboard.press('Escape');s=await read();check(s.snapshot.travel.energy.reserved===0&&s.snapshot.chapter2.repair.stepIds.length===1&&s.camera.owner===null&&s.locks.length===0,'cancel saved confirmed step');evidence.push({id:'cancel-confirmed-step',repair:s.snapshot.chapter2.repair,energy:s.snapshot.travel.energy});
 await page.locator('#repair').click();await page.locator('[data-action=start]').click();
 const drag=async(i,x,y)=>{const box=await page.locator('[data-part="'+i+'"]').boundingBox();const target=await page.locator('.repair-work svg').evaluate((el,p)=>{const t=el.createSVGPoint();t.x=p[0];t.y=p[1];const q=t.matrixTransform(el.getScreenCTM());return {x:q.x,y:q.y};},[x,y]);await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(target.x,target.y,{steps:12});await page.mouse.up();};
 await drag(0,190,268);await drag(1,410,268);s=await read();check(s.snapshot.chapter2.repair.stepIds.length===2,'two supports manually placed');
 await drag(2,245,134);await page.locator('[data-action=confirm]').click();await drag(3,355,134);await page.screenshot({path:'02-rope-placed.png'});await page.locator('[data-action=confirm]').click();
 s=await read();check(s.module.board.step===3,'rope fixed');evidence.push({id:'actual-mouse-drag',stepIds:s.snapshot.chapter2.repair.stepIds});
 return evidence;
}
