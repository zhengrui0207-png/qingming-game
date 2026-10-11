// No DOM or quest-specific state: adapters supply positions, conditions and effects.
export const interactionConfig = Object.freeze({radius:1.8,maxHeightDifference:.8,switchMargin:.22,reachTolerance:.1,charactersPerSecond:34});
export function createInputLocks(onChange=()=>{}) {
 const stack=[];
 return {acquire(owner,cancel=()=>{}) {const token={owner,cancel};stack.push(token);onChange();let released=false;return ()=>{if(released)return;released=true;stack.splice(stack.indexOf(token),1);onChange();};},
 get locked(){return stack.length>0;},get top(){return stack.at(-1);},snapshot:()=>stack.map(t=>t.owner)};
}
export function createKeyGate(){const down=new Set();return {press(code,repeat=false){if(repeat||down.has(code))return false;down.add(code);return true;},release:code=>down.delete(code),held:code=>down.has(code),keys:()=>[...down],clear:()=>down.clear()};}
export function segmentBlocked(a,b,colliders){
 return colliders.some(c=>{
  // Authored obstacle volumes, not roofs or decorative foliage. Conservative at foot height.
  if(Math.min(a.y,b.y)>(c.h??3)+.94)return false;
  let lo=0,hi=1;
  for(const [axis,extent] of [['x',c.w],['z',c.d]]){const delta=b[axis]-a[axis],min=c[axis]-extent/2,max=c[axis]+extent/2;
   if(Math.abs(delta)<1e-9){if(a[axis]<min||a[axis]>max)return false;}
   else {let t1=(min-a[axis])/delta,t2=(max-a[axis])/delta;if(t1>t2)[t1,t2]=[t2,t1];lo=Math.max(lo,t1);hi=Math.min(hi,t2);if(lo>hi)return false;}
  }return hi>0.001&&lo<.999;
 });
}
export function createInteractionRegistry({reachable=()=>true,unobstructed=()=>true}={}){
 const entries=new Map();let current=null;
 function register(entry){if(!entry.id||!entry.type||(!entry.entity&&!entry.anchor&&!entry.getPosition)||typeof entry.action!=='function')throw Error('Invalid Interactable: '+entry.id);if(entries.has(entry.id))throw Error('Duplicate Interactable: '+entry.id);const e={radius:interactionConfig.radius,enabled:true,trigger:'E',...entry};entries.set(e.id,e);return ()=>{entries.delete(e.id);if(current===e.id)current=null;};}
 function candidates(actor){return [...entries.values()].filter(e=>e.trigger==='E').flatMap(e=>{
  if(!(typeof e.enabled==='function'?e.enabled():e.enabled))return [];
  const p=e.getPosition?e.getPosition():e.entity?e.entity.getWorldPosition(e.entity.position.clone()):e.anchor.position;
  const pos=Array.isArray(p)?{x:p[0],y:p[1],z:p[2]}:p;
  const layer=typeof e.layer==='function'?e.layer():e.layer??e.anchor?.layer;
  const d=Math.hypot(pos.x-actor.x,pos.z-actor.z);
  if(!Number.isFinite(d)||!Number.isFinite(pos.y)||d>e.radius||Math.abs(pos.y-actor.height)>(e.maxHeightDifference??interactionConfig.maxHeightDifference)||layer!==actor.layer||actor.mode!=='walk'||!unobstructed(actor,pos,e)||!reachable(actor,pos,e))return [];
  return [{entry:e,d}];
 }).sort((a,b)=>a.d-b.d||a.entry.id.localeCompare(b.entry.id));}
 function focus(actor){const all=candidates(actor),old=all.find(x=>x.entry.id===current);const selected=old&&(!all[0]||old.d<=all[0].d+interactionConfig.switchMargin)?old:all[0];current=selected?.entry.id??null;return selected?.entry??null;}
 return {register,focus,activate(actor){const e=focus(actor);if(!e)return false;e.action();return true;},entries:()=>[...entries.values()],get current(){return current;}};
}
export function createDialogueSession(definition,{condition=()=>false,effect=()=>{},onClose=()=>{}}={}){
 const nodes=new Map(definition.nodes.map(n=>[n.id,n]));let node=nodes.get(definition.start),revealed=false,result=null;
 if(!node||nodes.size!==definition.nodes.length)throw Error('Invalid dialogue nodes');
 for(const n of nodes.values()){if(n.next&&!nodes.has(n.next))throw Error('Unknown next node');for(const o of n.options??[])if(o.next&&!nodes.has(o.next))throw Error('Unknown option node');}
 function close(reason){if(result)return;result=reason;onClose(reason);}
 return {get node(){return node;},get revealed(){return revealed;},get result(){return result;},reveal(){revealed=true;},options:()=> (node.options??[]).filter(o=>!o.condition||condition(o.condition)),
 advance(){if(result)return;if(!revealed){revealed=true;return;}if(node.options?.length)return;if(node.next){node=nodes.get(node.next);revealed=false;}else close('completed');},
 choose(id){if(result||!revealed)return false;const option=(node.options??[]).find(o=>o.id===id);if(!option||option.condition&&!condition(option.condition))return false;for(const e of option.effects??[])effect(e);if(option.next){node=nodes.get(option.next);revealed=false;}else close('completed');return true;},cancel:()=>close('cancelled')};
}
