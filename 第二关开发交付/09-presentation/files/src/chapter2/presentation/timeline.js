import content from '../content/content.json' with {type:'json'};
const intro=content.presentations.find(p=>p.id==='intro_c2'),ending=content.presentations.find(p=>p.id==='ending_c2');
// Local editorial timing only; the frozen formal dialogue and stable shot IDs are retained.
export const sequences=Object.freeze({
 intro_c2:{...intro,durationSeconds:12,shots:[
 {...intro.shots[0],start:0,end:3,framing:'全景',from:{position:[-20,9,-9],target:[-29,1.5,-22],fov:50},to:{position:[-25,5,-17],target:[-34,1.4,-28],fov:50},beats:[{at:0,line:0}],cues:[]},
 {...intro.shots[1],start:3,end:7.2,framing:'近景',from:{position:[-60.6,3.15,-37.7],target:[-63,1.75,-40.6],fov:43},to:{position:[-61.2,2.65,-38.2],target:[-63,1.8,-40.7],fov:43},beats:[{at:0,line:0},{at:2.25,line:1}],cues:[{at:.4,id:'rope_test'},{at:2.4,id:'tea_pour'}]},
 {...intro.shots[2],start:7.2,end:12,framing:'特写转中景',from:{position:[-55.6,2.8,-36.2],target:[-54,1.95,-34.8],fov:35},to:{position:[-57,3.2,-38],target:[-54,1.85,-34.7],fov:48},beats:[{at:0,line:0},{at:2.4,line:1}],cues:[{at:0,id:'cup_set'}]}
 ]},
 ending_c2:{...ending,durationSeconds:16,shots:[
 {...ending.shots[0],start:0,end:5.5,framing:'近景',from:{position:[-72.4,3,-40.6],target:[-75,1.55,-43],fov:43},to:{position:[-73,2.7,-40.8],target:[-75,1.5,-43],fov:43},beats:[{at:0,line:0}],cues:[{at:.65,id:'rope_test'},{at:3.7,id:'wheel'}]},
 {...ending.shots[1],start:5.5,end:10,framing:'特写',from:{position:[-73.8,2.65,-40.9],target:[-75.25,1.99,-42.5],fov:34},to:{position:[-74.1,2.65,-40.95],target:[-75.25,1.99,-42.5],fov:34},beats:[{at:0,line:0}],cues:[{at:.35,id:'tea_pour'},{at:2.4,id:'cup_set'}]},
 {...ending.shots[2],start:10,end:16,framing:'中景转全景',from:{position:[-71.8,3.7,-39.2],target:[-75,1.7,-43],fov:48},to:{position:[-72,6.8,-40],target:[-78,1.7,-43],fov:52},beats:[{at:0,line:0}],cues:[{at:2.8,id:'wheel'}]}
 ]}
});
const lerp=(a,b,t)=>a+(b-a)*t;
export function sample(id,time){const seq=sequences[id];if(!seq)throw Error('Unknown D presentation');const t=Math.max(0,Math.min(time,seq.durationSeconds)),shot=seq.shots.find(s=>t<s.end)??seq.shots.at(-1),u=(t-shot.start)/(shot.end-shot.start),smooth=u*u*(3-2*u);let beat=shot.beats[0];for(const b of shot.beats)if(t-shot.start>=b.at)beat=b;const line=shot.lines[beat.line];return {id,time:t,duration:seq.durationSeconds,shotId:shot.id,framing:shot.framing,shotProgress:u,anchorId:shot.anchorId,subtitle:line.text,speakerId:line.speakerId,pose:{position:shot.from.position.map((v,i)=>lerp(v,shot.to.position[i],smooth)),target:shot.from.target.map((v,i)=>lerp(v,shot.to.target[i],smooth)),fov:lerp(shot.from.fov,shot.to.fov,smooth)}};}
export function cuesBetween(id,previous,current){return sequences[id].shots.flatMap(s=>s.cues.map((c,i)=>({...c,at:s.start+c.at,eventId:`${s.id}:${i}`}))).filter(c=>c.at>previous&&c.at<=current);}
