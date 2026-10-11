/** Frozen P0 interfaces. The implementation belongs to 03 (service) and 00/10 (runtime adapters). */
export type Release = () => void;
export type Layer = 'ground'|'bridge';
export type CancelReason = 'escape'|'blur'|'hidden'|'region-leave'|'dispose'|'user';
export interface ItemInstance { id:string; itemId:string; ownership:'owned'|'borrowed'|'sold'|'bartered'; protected:boolean; firstObtainedAt:string; sourceId:string }
export interface CollectionRecord {firstObtainedAt:string; totalObtained:number; sourceIds:string[]}
export interface ReadingPosition {contentVersion:number; sectionId:string; paragraphIndex:number}
export interface Chapter2Extension {
 travel:{initialized:boolean; regionId:'region_c'|'region_d'|'region_e'; wallet:{coins:number};
 energy:{current:number;max:100;reserved:number;passiveSeconds:number};
 instances:Record<string,ItemInstance>; collection:Record<string,CollectionRecord>;
 storyReadingProgress:Record<string,ReadingPosition>;readStoryIds:string[];
 commerce:{receipts:TradeReceipt[];buyback:string[];shopStock:Record<string,number>;barterCounts:Record<string,number>};
 relief:{debt:number;firstCastGuaranteed:boolean;recoveryEpoch:number};
 fishing:{sequence:number;pendingCast:PendingCast|null;rareMisses:number;tutorialCompleted:boolean;tokenObtained:boolean};
 transactions:{saveEpoch:string|null;nextSequence:number;committedThrough:number;recent:TransactionReceipt[]}};
 chapter2:{contractVersion:'1.0.0';entryCount:number;safeAnchorId:string|null;mainStatus:'available'|'active'|'completed';
 goalIds:string[]; quests:Record<string,{status:'available'|'active'|'completed'}>;
 repair:{status:'available'|'active'|'ready'|'completed';stepIds:string[];reserved:number;rewardChoice:null|'cash'|'bell'};
 storyStages:Record<string,string>;presentations:{intro:'unseen'|'pending'|'seen';ending:'unseen'|'pending'|'seen'};
 timing:{firstOperativeAt:string|null;events:TimingEvent[];externalInterruptions:{start:string;end:string|null;note:string}[]}};
}
export interface PendingCast {id:string;pointId:string;mode:'normal'|'simple'|'tutorial'|'token'|'relief';chargedEnergy:number;startedAt:string;seed:number}
export interface TradeReceipt {id:string;shopId:string;kind:'sell'|'buy'|'barter'|'buyback';lines:{itemId:string;quantity:number;instanceId?:string}[];coins:number;debtPaid:number;at:string;buybackEligible:boolean;buybackPrice:number|null}
export interface TransactionReceipt {id:string;fingerprint:string;result:DispatchResult}
export interface TimingEvent {id:string;at:string;operativeSeconds:number;detail?:string}
export interface Action {type:string;transactionId?:string;payload:Record<string,unknown>}
export type DispatchResult = {ok:true;changed:boolean;saved:true;transactionId?:string;duplicate?:boolean;data?:Record<string,unknown>} |
 {ok:false;changed:false;saved:false;error:{code:string;message:string;retryable:boolean};transactionId?:string};
export interface SharedService {
 /** Frozen complete v3 snapshot, including all legacy HQ fields. Never return mutable state. */
 getState():Readonly<Chapter2Extension & Record<string,unknown>>;
 subscribe(listener:(event:{action:Action;result:DispatchResult;state:ReturnType<SharedService['getState']>})=>void):Release;
 /** Synchronous local verified save; no UI-owned storage writes. */
 dispatch(action:Action):DispatchResult;
 createTransactionId():string;
 getStatus():{saved:boolean;message:string;errorCode:string|null};
 retrySave():DispatchResult;
}
export interface ActivityFrame {regionId:string;operative:boolean;visible:boolean;focused:boolean;actor:{x:number;z:number;height:number;layer:Layer;mode:string};wallNow:string}
export interface CameraPose {position:[number,number,number];target:[number,number,number];fov?:number}
export interface CameraLease {setPose(pose:CameraPose):void;release():void}
export interface ModuleContext {
 scene:unknown;world:unknown;service:SharedService;baseURL:string;toast(message:string):void;
 registry:{register(entry:{id:string;type:string;anchor?:{position:[number,number,number];layer:Layer};getPosition?:()=>{x:number;y:number;z:number};layer?:Layer;radius?:number;enabled?:boolean|(()=>boolean);trigger?:'E'|'automatic';label:string;action:()=>void}):Release};
 locks:{acquire(owner:string,onCancel?:()=>void):Release;readonly locked:boolean;snapshot():string[]};
 gate:{held(code:string):boolean;keys():string[]};
 camera:{borrow(owner:string,onCancel:()=>void):CameraLease|null};
 ports:{getFrame():ActivityFrame;input:{subscribe(owner:string,listener:(command:'confirm'|'cancel'|'left'|'right'|'up'|'down')=>boolean):Release};
 openBook(page:'inventory'|'collection'|'stories',storyId?:string):void;
 navigate(anchorId:string):void};
}
export interface Chapter2Module {update(dt:number,frame:ActivityFrame):void;cancel(reason:CancelReason):void;dispose():void;getState():Readonly<Record<string,unknown>>}
export type CreateModule = (context:ModuleContext) => Chapter2Module;
