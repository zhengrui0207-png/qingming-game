async page => {
 await page.setViewportSize({width:1440,height:900});
 await page.waitForFunction(()=>window.__scenePreview?.ready);
 await page.locator('#game').focus();
 const before=await page.evaluate(()=>window.__scenePreview.inspect().actor);
 await page.keyboard.down('KeyW'); await page.waitForTimeout(650); await page.keyboard.up('KeyW');
 const after=await page.evaluate(()=>window.__scenePreview.inspect().actor);
 await page.getByRole('button',{name:'连续实走并反向回访'}).click();
 return {keyboard:{method:'real keyboard W 650ms',before,after}};
}
