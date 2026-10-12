import {build} from 'esbuild';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export async function loadSource(relativePath) {
  const dir = mkdtempSync(join(tmpdir(), 'layout-plus-'));
  const outfile = join(dir, 'module.mjs');
  await build({
    entryPoints: [fileURLToPath(new URL(relativePath, import.meta.url))],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile,
    logLevel: 'silent'
  });
  return import(pathToFileURL(outfile).href);
}
