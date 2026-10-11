async (page) => {
 await page.setViewportSize({width:1280,height:800});await page.waitForFunction(()=>window.__presentationPreview?.ready,{timeout:120000});await page.evaluate(()=>{window.__presentationPreview.setManual(true);document.body.classList.add('compact');});
 const rows=[];
 for(const [choice,id,times] of [[null,'intro_c2',[1.2,4.5,8.7]],['bell','ending_c2',[2.3,7.5,14.6]]]){
  for(let i=0;i<times.length;i++){
   await page.evaluate(choice=>{const p=window.__presentationPreview;p.prepare(choice);},choice);
   await page.evaluate(t=>{const p=window.__presentationPreview;p.step(t);p.presentation.setPaused(true);},times[i]);
   rows.push(await page.evaluate(()=>{const x=window.__presentationPreview.inspect();return {shot:x.module.frame,staging:x.module.staging,camera:x.camera};}));
   await page.screenshot({path:'output/playwright/'+id+'-'+(i+1)+'.png'});
   await page.evaluate(()=>window.__presentationPreview.presentation.cancel('inspection'));
  }
 }
 return rows;
}
