import {build} from '../../node_modules/vite/dist/node/index.js';
const root='/Users/zhengrui/Documents/ChatGPT/3d 打印/qingming-game';
await build({root,configFile:false,publicDir:false,build:{outDir:root+'/.dream-loop/chapter2-2026-10-02/compiled-visual-20261004',emptyOutDir:true,rollupOptions:{input:{main:root+'/index.html',scene:root+'/chapter2-scene-preview.html',fishing:root+'/chapter2-fishing-preview.html'}}}});
