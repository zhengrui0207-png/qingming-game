async page => {
 await page.evaluate(()=>window.__scenePreview.beginWalk());
 const sample=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();function sample(now){times.push(now-last);last=now;if(times.length>=360){const sorted=[...times].sort((a,b)=>a-b);resolve({method:'360 RAF frames during continuous real movement; no per-frame raycast diagnostic polling',samples:times.length,averageFrameMs:times.reduce((a,b)=>a+b,0)/times.length,p95FrameMs:sorted[Math.floor(times.length*.95)],viewport:[innerWidth,innerHeight],dpr:devicePixelRatio});}else requestAnimationFrame(sample);}requestAnimationFrame(sample);}));
 const state=await page.evaluate(()=>window.__scenePreview.inspect());
 sample.drawCalls=state.performance.drawCalls;sample.triangles=state.performance.triangles;sample.actor=state.actor;
 await page.evaluate(()=>window.__scenePreview.view('anchor_c2_fishing_a'));
 return sample;
}
