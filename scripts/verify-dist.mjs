import {readdirSync, readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const expected = ['content.js', 'manifest.json', 'popup.css', 'popup.html', 'popup.js'];
const actual = readdirSync(dist).sort();
const errors = [];

if (actual.join('\n') !== expected.join('\n')) {
  errors.push(`dist files:\n${actual.join('\n') || '(empty)'}`);
}

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) errors.push(`package.json version is not x.y.z: ${pkg.version}`);
if (manifest.version !== pkg.version) errors.push(`dist version ${manifest.version} != package.json ${pkg.version}`);
if (manifest.manifest_version !== 3) errors.push('manifest_version must be 3');
if (JSON.stringify(manifest.permissions) !== JSON.stringify(['storage'])) errors.push('permissions must be ["storage"]');
if (JSON.stringify(manifest.host_permissions) !== JSON.stringify([])) errors.push('host_permissions must be []');
if (JSON.stringify(manifest.content_scripts?.[0]?.matches) !== JSON.stringify(['https://chatgpt.com/*'])) {
  errors.push('content script matches must be ["https://chatgpt.com/*"]');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`dist ok (${pkg.version})`);
