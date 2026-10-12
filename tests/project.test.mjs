import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {loadSource} from './load-source.mjs';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path,root),'utf8');
test('version is defined only in package.json', () => {
  const manifest = JSON.parse(read('public/manifest.json'));
  assert.equal('version' in manifest, false);
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
});
test('manifest limits permissions and origins', () => {
  const manifest=JSON.parse(read('public/manifest.json'));
  assert.equal(manifest.manifest_version,3);
  assert.deepEqual(manifest.permissions,['storage']);
  assert.deepEqual(manifest.content_scripts[0].matches,['https://chatgpt.com/*']);
  assert.equal(manifest.icons['128'], 'icons/icon128.png');
});
test('popup ids match controls', () => {
  const html=read('public/popup.html');
  for(const id of ['enabled','conversationWidth','composerWidth','fontSize','expandCode','expandTables','reset','status']) {
    assert.ok(html.includes(`id="${id}"`), `Missing ${id}`);
  }
});
test('no remote script or telemetry',()=>{
  const manifest=read('public/manifest.json');
  assert.ok(!manifest.includes('http://'));
  assert.ok(!manifest.includes('https://*'));
  assert.ok(!read('src/content.ts').includes('fetch('));
});

test('writing-block fix only offsets action buttons', () => {
  const content=read('src/content.ts');
  assert.match(content, /header\.sticky > div:last-child/);
  assert.match(content, /--layout-plus-writing-actions-offset/);
  assert.match(content, /getBoundingClientRect\(\)\.bottom/);
  assert.ok(!content.includes('header.sticky {\n    top: calc('));
});

test('popup and manifest use the same locale catalog', async () => {
  const {ENGLISH} = await loadSource('../src/i18n.ts');
  const en = JSON.parse(read('public/_locales/en/messages.json'));
  const pt = JSON.parse(read('public/_locales/pt_BR/messages.json'));
  const manifest = read('public/manifest.json');
  const html = read('public/popup.html');
  const popup = read('src/popup.ts');
  const used = new Set([
    ...[...manifest.matchAll(/__MSG_(\w+)__/g)].map(match => match[1]),
    ...[...html.matchAll(/data-i18n(?:-title|-label)?="(\w+)"/g)].map(match => match[1]),
    ...[...popup.matchAll(/\bt\('(\w+)'\)/g)].map(match => match[1])
  ]);
  assert.deepEqual(Object.keys(en).sort(), Object.keys(pt).sort());
  assert.deepEqual(Object.keys(ENGLISH).sort(), Object.keys(en).sort());
  for (const key of used) assert.ok(ENGLISH[key], `missing catalog key ${key}`);
  for (const [key, message] of Object.entries(ENGLISH)) {
    assert.equal(en[key].message, message);
    assert.equal(typeof pt[key].message, 'string');
    assert.ok(pt[key].message.length > 0);
  }
  const parsed = JSON.parse(manifest);
  assert.equal(parsed.default_locale, 'en');
});

test('CSS has balanced braces', () => {
  const content=read('src/content.ts');
  const css=content.match(/const CSS = `([\s\S]*?)`;/)?.[1];
  assert.ok(css);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
