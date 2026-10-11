import * as THREE from 'three';
// Explicit DEV-only samples. No Hongqiao NPC dialogue, permission or quest effects.
export const testDialogue={id:'test_greeting',start:'greeting',nodes:[
 {id:'greeting',speaker:'街坊（交互测试）',text:'书生，请稍候。这是统一交互的测试对白，只验证输入和选项，不接取正式任务。',next:'choice'},
 {id:'choice',speaker:'街坊（交互测试）',text:'是否记下这次测试？取消不会留下记录。',options:[{id:'record',text:'明确确认：记下测试',condition:'canRecord',effects:['recordTest']},{id:'leave',text:'结束交谈',effects:[]}]}
]};
export function createInteractionFixtures({scene,prototype,registry,dialogue}){
 const entities=[];for(let i=0;i<2;i++){const group=prototype.clone(true);group.position.set(i?1.6:.5,.94,33.7);scene.add(group);entities.push(group);const p=new THREE.Vector3();registry.register({id:'test_npc_'+i,type:'npc',entity:group,layer:()=>group.userData.layer??'ground',radius:2,enabled:()=>group.visible,getPosition:()=>group.getWorldPosition(p),label:'与街坊'+(i?'乙':'甲')+'交谈（测试）',action:()=>dialogue.open(testDialogue)});}
 return {move(index,x,y,z,layer='ground'){entities[index].position.set(x,y,z);entities[index].userData.layer=layer;},visible(index,value){entities[index].visible=value;}};
}
