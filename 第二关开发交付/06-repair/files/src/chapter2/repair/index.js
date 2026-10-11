import {createController} from './controller.js';
import {createRig} from './rig.js';
import {mountUI} from './ui.js';
import {manifest} from '../scene/physics.js';
import './repair.css';
export function create(context){
 const anchors=context.repairAnchors??manifest.anchors;
 const rig=context.repairVisual??createRig(context.scene,anchors.find(a=>a.id==='anchor_c2_repair'),{onCue:context.repairCue});
 let ui=null;const controller=createController(context,{anchors,onChange:s=>{rig.sync(s);ui?.render(s);},cue:name=>rig.cue(name)});
 ui=mountUI(context.repairMount??document.body,controller);rig.sync(controller.getState());ui.render(controller.getState());
 return {...controller,update(dt,frame){controller.update(dt,frame);rig.update(dt);},dispose(){controller.dispose();ui.dispose();rig.dispose();},getVisualState:()=>rig.getState()};
}
