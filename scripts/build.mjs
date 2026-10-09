import {build, context} from 'esbuild';
import {cp, mkdir, rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
const require = createRequire(import.meta.url);
const {stampManifest} = require('./stamp-manifest.cjs');
const root = resolve(import.meta.dirname, '..');
const outdir = resolve(root, 'dist');
await rm(outdir, {recursive:true, force:true});
await mkdir(outdir, {recursive:true});
await cp(resolve(root,'public'),outdir,{recursive:true});
stampManifest(root);
const config = {
  entryPoints: {content: resolve(root,'src/content.ts'), popup: resolve(root,'src/popup.ts')},
  outdir, bundle:true, format:'iife', platform:'browser', target:'chrome114',
  minify: !process.argv.includes('--watch'), logLevel:'info'
};
if (process.argv.includes('--watch')) {
  const ctx = await context(config); await ctx.watch(); console.log('Watching source files. Reload the extension after changes.');
} else { await build(config); console.log('Extension built in dist/'); }
