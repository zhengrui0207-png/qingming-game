async page => {
 await page.waitForFunction(()=>document.getElementById('hud')?.textContent.includes('路线与反向回访完成') || window.__sceneError,null,{timeout:180000,polling:1000});
 return await page.evaluate(()=>window.__scenePreview.inspect());
}
