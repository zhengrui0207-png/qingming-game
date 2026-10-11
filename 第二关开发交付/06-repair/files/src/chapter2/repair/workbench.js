// Spatial teaching simplification. No assertion of historical knot technique.
const targets=[{x:190,y:268},{x:410,y:268},{x:245,y:134},{x:355,y:134}];
const initial=[{x:120,y:298},{x:480,y:298},{x:135,y:200},{x:465,y:200}];
export const inspection=[{id:'scratch',x:302,y:91,label:'木面白痕'},{id:'binding',x:245,y:134,label:'松动绑缚'},{id:'foot',x:190,y:268,label:'歪垫脚'}];
export function createWorkbench(step){
 let selected=step===2?2:0,found=[],parts=initial.map(p=>({...p,fixed:false})),checks=[],pressure=0,pressing=false,direction=0,message='';
 const indexes=()=>step===1?[0,1]:[2,3];
 const near=i=>Math.hypot(parts[i].x-targets[i].x,parts[i].y-targets[i].y)<=30;
 function snapshot(){return {step,selected,found:[...found],parts:parts.map((p,i)=>({...p,target:{...targets[i]}})),checks:[...checks],pressure,pressing,direction,message};}
 function select(index){if(step===0){selected=((index%3)+3)%3;return;}if(step===3){direction=((index%3)+3)%3;pressure=0;return;}if(indexes().includes(index))selected=index;}
 function inspect(index=selected){if(step!==0)return false;select(index);if(index===0){message='表面白痕不是松处，请看绳段与垫脚。';return false;}if(!found.includes(index))found.push(index);message=index===1?'这段绑缚松了。':'这块垫脚歪了。';return found.length===2;}
 function move(x,y){if(![1,2].includes(step)||parts[selected].fixed)return;parts[selected].x=Math.max(70,Math.min(530,x));parts[selected].y=Math.max(60,Math.min(320,y));}
 function drop(){if(![1,2].includes(step))return false;if(near(selected)){Object.assign(parts[selected],targets[selected]);if(step===1)parts[selected].fixed=true;message=step===1?'垫脚已坐实。':'绳段就位，按确认固定。';}else message='再靠近虚线位置一些，放错可直接重试。';const done=step===1&&indexes().every(i=>parts[i].fixed);if(step===1&&parts[selected].fixed&&!done)selected=indexes().find(i=>!parts[i].fixed);return done;}
 function confirm(){if(step===0)return inspect();if(step===1)return drop();if(step===2){if(!near(selected)){message='绳段还交错，请放回虚线导向处。';return false;}Object.assign(parts[selected],targets[selected],{fixed:true});message='绳头固定。';const done=indexes().every(i=>parts[i].fixed);if(!done)selected=indexes().find(i=>!parts[i].fixed);return done;}return false;}
 function command(command){if(command==='confirm')return confirm();if(step===0){if(['left','up'].includes(command))select(selected-1);else select(selected+1);}else if(step===3){if(command==='left')select(0);if(command==='right')select(1);if(command==='down'||command==='up')select(2);}else {const p=parts[selected];move(p.x+(command==='left'?-20:command==='right'?20:0),p.y+(command==='up'?-20:command==='down'?20:0));}return false;}
 function tick(dt,held){if(step!==3)return false;pressing=held;if(!held){pressure=0;return false;}if(checks.includes(direction)){message='这侧已经稳了，换一个方向。';return false;}pressure+=Math.max(0,Math.min(dt,.1));if(pressure>=2){checks.push(direction);pressure=0;message='这一侧稳了，请松手再换方向。';return checks.length===3;}return false;}
 return {snapshot,select,inspect,move,drop,confirm,command,tick};
}
