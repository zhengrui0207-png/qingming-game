/** Real camera lease used only by the independent preview. Main supplies its own P0 port. */
export function createPreviewCamera({capture,restore,setPose}){
 let current=null;
 function release(token){if(current!==token)return;current=null;restore(token.snapshot);}
 return {borrow(owner,onCancel){if(current){if(!owner.startsWith('presentation:'))return null;const prior=current;prior.onCancel();if(current===prior)release(prior);if(current)return null;}
  const token={owner,onCancel,snapshot:capture()};current=token;let released=false;
  return {setPose(pose){if(!released&&current===token)setPose(pose);},release(){if(released)return;released=true;release(token);}};
 },get owner(){return current?.owner??null;},cancel(){const token=current;if(!token)return;token.onCancel();if(current===token)release(token);}};
}
