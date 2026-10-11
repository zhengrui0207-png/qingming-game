import {build} from 'vite';
await build({configFile:false,publicDir:false,build:{outDir:'docs/chapter2/presentation/output/build',emptyOutDir:true,rollupOptions:{input:'chapter2-presentation-preview.html'}}});
await build({configFile:false,publicDir:false,build:{outDir:'docs/chapter2/presentation/output/module-build',emptyOutDir:true,lib:{entry:'src/chapter2/presentation/index.js',formats:['es'],fileName:'presentation'},rollupOptions:{external:['three']}}});
