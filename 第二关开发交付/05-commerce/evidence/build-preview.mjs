import {build} from 'vite';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
await build({root,configFile:false,build:{outDir:'docs/chapter2/commerce/build-preview',emptyOutDir:true,copyPublicDir:false,rollupOptions:{input:fileURLToPath(new URL('../../../chapter2-commerce-preview.html',import.meta.url))}}});
