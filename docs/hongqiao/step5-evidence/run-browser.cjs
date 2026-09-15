const {chromium}=require('/Users/zhengrui/.npm/_npx/31e32ef8478fbf80/node_modules/playwright-core');
const fs=require('fs'),path=require('path');
(async()=>{
 const dir=__dirname;process.chdir(dir);const browser=await chromium.launch({channel:'chrome',headless:process.env.HEADLESS==='1',args:['--enable-unsafe-swiftshader']});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();
 let phase='boot';const prefix=process.env.EVIDENCE_PREFIX??'browser';
 const consoleEntries=[],requests=[];page.on('console',m=>{if(['error','warning'].includes(m.type()))consoleEntries.push({phase,type:m.type(),text:m.text()})});page.on('pageerror',e=>consoleEntries.push({phase,type:'pageerror',text:e.message}));page.on('response',r=>requests.push({phase,url:r.url(),status:r.status()}));page.on('requestfailed',r=>requests.push({phase,url:r.url(),failure:r.failure()}));
 try{for(const name of process.argv.slice(2)){phase=name;console.log('START',name);const fn=eval('('+fs.readFileSync(path.join(dir,name),'utf8')+')');const result=await fn(page);fs.writeFileSync(path.join(dir,name.replace('.js','-evidence.json')),JSON.stringify(result,null,2));console.log('PASS',name);}}
 catch(e){console.error(e);fs.writeFileSync('failure-state.json',JSON.stringify({url:page.url(),text:await page.locator('body').innerText().catch(()=>''),state:await page.evaluate(()=>({q:window.__hqProgress?.getState(),d:window.__hqProgress?.getDialogue(),i:window.__interaction?.getState()})).catch(()=>null)},null,2));await page.screenshot({path:'failure.png'}).catch(()=>{});process.exitCode=1;}
 finally{fs.writeFileSync(prefix+'-console.json',JSON.stringify(consoleEntries,null,2));fs.writeFileSync(prefix+'-network.json',JSON.stringify(requests,null,2));await browser.close();}
})();
