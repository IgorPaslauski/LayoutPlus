import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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

test('CSS has balanced braces', () => {
  const content=read('src/content.ts');
  const css=content.match(/const CSS = `([\s\S]*?)`;/)?.[1];
  assert.ok(css);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
