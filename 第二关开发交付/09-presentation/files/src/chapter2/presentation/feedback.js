// Saved service events only. Host decides which module owns feedback; no reward or timers here.
export function createFeedback(service,audio,{getFrame,anchors=[],enabled=true}={}){
 const mapping={startCast:'cast',resolveCast:'splash',completeRepair:'wheel',sell:'coin',buy:'coin',buyback:'coin',barter:'coin',chooseReward:'coin'};
 const stop=service.subscribe(({action,result})=>{if(!enabled||result.duplicate||!result.changed)return;const name=action.type.split('/')[1];let cue=mapping[name];if(name==='resolveCast'&&action.payload.outcome!=='caught')return;if(name==='chooseReward'&&action.payload.choice!=='cash')return;if(name==='advanceRepair'&&action.payload.stepId==='step_c2_test')cue='rope_test';if(name==='eat')cue=action.payload.offerId==='offer_c2_tea'?'tea_pour':'steam';if(!cue)return;const a=anchors.find(a=>a.id===result.data?.anchorId),f=getFrame?.();if(a&&f&&Math.hypot(a.position[0]-f.actor.x,a.position[2]-f.actor.z)>12)return;audio.cue(cue,{eventId:action.transactionId});});
 return {dispose:stop};
}
