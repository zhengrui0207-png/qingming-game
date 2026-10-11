async(page)=>{
 await page.getByRole('combobox',{name:'取景定位（非步行证据）',exact:true}).selectOption('anchor_c2_fisher');
 return await page.evaluate(()=>{
  const s=window.__fishingPreview.service,before=s.getState();const tx={type:'c2/sell',transactionId:s.createTransactionId(),payload:{shopId:'shop_c2_fish',lines:[{itemId:'item_c2_fish_a',quantity:1}]}};const first=s.dispatch(tx),after=s.getState(),again=s.dispatch(tx),last=s.getState();
  const checks=[{name:'real core sale at measured fisher consumes fish credits coins keeps collection',pass:first.ok&&after.inventory.item_c2_fish_a===0&&after.travel.wallet.coins>before.travel.wallet.coins&&after.travel.collection.item_c2_fish_a.totalObtained===1},{name:'same sale transaction cannot pay twice',pass:again.ok&&again.duplicate&&last.travel.wallet.coins===after.travel.wallet.coins&&last.travel.commerce.receipts.length===after.travel.commerce.receipts.length},{name:'formal storage unchanged',pass:window.__fishingPreview.inspect().formalSaveUnchanged}];if(checks.some(c=>!c.pass))throw Error(JSON.stringify({first,again,checks}));return {ok:true,scope:'主工程真实核心+实测渔夫站位浏览器localStorage交易检查；直接调用服务，不是05菜单已实现',checks,coinsBefore:before.travel.wallet.coins,coinsAfter:after.travel.wallet.coins};
 });
}
