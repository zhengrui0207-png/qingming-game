async page => {
 await page.evaluate(()=>window.__scenePreview.overview(true));
 await page.waitForTimeout(450);
 await page.screenshot({path:'overview.png',scale:'css'});
 const result=[];
 for(const role of ['fishing_a','fishing_b','porter','merchant','food_vendor','delivery']){
  await page.evaluate(id=>window.__scenePreview.view(id),'anchor_c2_'+role);
  await page.waitForTimeout(700);
  await page.screenshot({path:role+'.png',scale:'css'});
  result.push({id:role,actor:await page.evaluate(()=>window.__scenePreview.inspect().actor),kind:'diagnostic view positioning after complete continuous route; not walking proof'});
 }
 const dl=page.waitForEvent('download');
 await page.evaluate(()=>window.__scenePreview.exportGraybox());
 const download=await dl;
 await download.saveAs('../../../public/assets/chapter2/scene/d-graybox.glb');
 return result;
}
