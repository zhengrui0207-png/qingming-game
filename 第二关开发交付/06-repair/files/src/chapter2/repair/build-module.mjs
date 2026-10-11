import {build} from 'vite';
import {fileURLToPath} from 'node:url';
await build({configFile:false,publicDir:false,cacheDir:'docs/chapter2/repair/vite-cache',build:{outDir:'docs/chapter2/repair/build-module',emptyOutDir:true,lib:{entry:fileURLToPath(new URL('./index.js',import.meta.url)),formats:['es'],fileName:'repair'},rollupOptions:{external:['three']}}});
