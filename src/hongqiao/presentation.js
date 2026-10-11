import {questStage} from './state.js';

// Step 7 attaches its actual renderer here. This module never moves the existing cargo ship/camera.
export function createPresentation({config,store,acquire,onEndingPlaceholder,onClosing}) {
  let adapter=null,running=null,release=null,sequence=0,endingEligible=false,replaying=false,reviewState=null;
  store.subscribe(event=>{if(event.action.type==='completeQuest')endingEligible=true;});
  const sceneState=()=>({shipState:store.getState().worldState.shipState??'waiting',introSeen:store.getState().introSeen,endingPending:store.getState().endingPending});
  function finish(kind,token,skipped=false) {
    if(token!==sequence||running!==kind)return;
    running=null;release?.();release=null;
    const wasReview=replaying;replaying=false;
    if(!wasReview)store.dispatch({type:kind==='intro'?'finishIntro':'finishEnding',skipped});
    adapter?.applyState?.(wasReview?reviewState:sceneState());reviewState=null;
    if(kind==='ending'&&!wasReview)onClosing();
  }
  function play(kind,review=false) {
    if(running)return false;
    if(kind==='intro'){
      if(!adapter?.playIntro)return false;
      if(!review){const result=store.dispatch({type:'beginIntro'});if(!result.changed)return false;}
    } else {
      if(questStage(store.getState(),config)!=='completed'||(!review&&!endingEligible))return false;
      if(!review)endingEligible=false;
      if(!adapter?.playEnding){onEndingPlaceholder();return false;}
    }
    replaying=review;reviewState=review?sceneState():null;
    running=kind;const token=++sequence;release=acquire('presentation',()=>skip());
    try {
      const result=adapter[kind==='intro'?'playIntro':'playEnding']({review,config:config.narrative[kind],state:sceneState(),finish:()=>finish(kind,token),isCurrent:()=>token===sequence&&running===kind});
      Promise.resolve(result).catch(error=>{console.error('[Hongqiao presentation]',error);finish(kind,token);});
    } catch(error){console.error('[Hongqiao presentation]',error);finish(kind,token);}
    return true;
  }
  const skip=()=>{const kind=running,token=sequence;if(!kind)return;try{adapter?.cancel?.();}finally{finish(kind,token,true);}};
  const pause=()=>adapter?.setPaused?.(document.hidden||!document.hasFocus());
  document.addEventListener('visibilitychange',pause);addEventListener('blur',pause);addEventListener('focus',pause);
  addEventListener('keydown',event=>{if(!running)return;if(adapter?.allowsGameCamera?.()&&['KeyV','Equal','Minus'].includes(event.code))return;event.stopImmediatePropagation();event.preventDefault();if(event.code==='Escape'&&!event.repeat)skip();},true);
  return {
    attach(next){if(running)skip();adapter=next;adapter?.applyState?.(sceneState());},
    start(){if(questStage(store.getState(),config)!=='completed')play('intro');},
    playEnding:()=>play('ending'),
    replayIntro:()=>play('intro',true),
    replayEnding:()=>play('ending',true),
    finishEnding(){store.dispatch({type:'finishEnding'});adapter?.applyState?.(sceneState());},
    getState:()=>({...sceneState(),running,replaying,adapterAttached:!!adapter}),
    skip,
  };
}
