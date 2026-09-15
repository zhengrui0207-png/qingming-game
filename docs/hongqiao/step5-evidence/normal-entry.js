async(page)=>{
 await page.goto('http://127.0.0.1:5181/',{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__qingming?.getState().loaded,null,{timeout:120000});await page.locator('#start').click();await page.waitForTimeout(500);await page.screenshot({path:'normal-entry.png'});
 const result={url:page.url(),devPanel:await page.locator('#hq-dev').count(),debugGlobal:await page.evaluate(()=>typeof window.__hqProgress),tracker:await page.locator('#hq-tracker').innerText()};if(result.devPanel||result.debugGlobal!=='undefined')throw Error('debug entry leaked');return result;
}
