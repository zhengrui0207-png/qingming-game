import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
export default defineConfig({publicDir:false,cacheDir:'docs/chapter2/scene/vite-cache',build:{outDir:'docs/chapter2/scene/build-preview',emptyOutDir:true,rollupOptions:{input:fileURLToPath(new URL('../../../chapter2-scene-preview.html',import.meta.url))}}});
