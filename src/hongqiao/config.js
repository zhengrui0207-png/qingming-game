import base from './config.json';
import narrative from './narrative.json';
import {buildQuestConfig} from './quest-config.js';
export default buildQuestConfig(base, narrative);
