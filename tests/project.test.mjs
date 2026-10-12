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
  for(const id of ['enabled','conversationWidth','textWidth','composerWidth','composerMinHeight','composerMaxHeight','composerNative','fontSize','lineHeight','paragraphGap','fontChoice','focusLatest','codeFontSize','codeLineHeight','codeMaxHeight','codeWrap','expandCode','expandTables','expandMedia','breakout','sidebarAdjust','sidebarWidth','reset','status']) {
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

test('page warning depends on layout anchors, not conversation text', async () => {
  const {anchorsFound, pageReport, PAGE_ANCHORS} = await loadSource('../src/page.ts');
  const present = new Set(PAGE_ANCHORS);
  assert.equal(anchorsFound(selector => present.has(selector) ? {node: true} : null), true);
  assert.equal(anchorsFound(() => null), false);
  assert.equal(anchorsFound(selector => present.has(selector) ? {node: true} : null), true);
  const missing = pageReport(() => null, true, 400);
  assert.equal(missing.found, false);
  assert.equal(missing.viewport, 400);
  assert.equal(missing.found, false);
  assert.equal(missing.visible, true);
  const source = read('src/page.ts');
  assert.match(read('src/content.ts'), /pageReport\(/);
  assert.ok(!source.includes('innerText'));
  assert.ok(!source.includes('textContent'));
  assert.ok(!source.includes('conversation'));
});

test('saved width is capped to the current window', async () => {
  const {appliedWidth} = await loadSource('../src/settings.ts');
  assert.equal(appliedWidth(1600, 1280), 1248);
  assert.equal(appliedWidth(800, 1440), 800);
  assert.equal(appliedWidth(1600, 0), 1600);
  assert.equal(appliedWidth(1600, 700), 700);
  assert.match(read('src/content.ts'), /appliedWidth\(/);
  assert.ok(!read('src/content.ts').includes('storage.local'));
});

test('reading column stays narrower than code and tables', async () => {
  const {normalizeSettings, PRESETS, DEFAULT_SETTINGS} = await loadSource('../src/settings.ts');
  const developer = normalizeSettings({preset: 'developer', ...PRESETS.developer, enabled: true});
  assert.ok(developer.textWidth >= 50 && developer.textWidth <= 80);
  assert.ok(developer.conversationWidth >= 1400);
  assert.equal(developer.expandCode, true);
  assert.equal(developer.expandTables, true);
  const legacy = normalizeSettings({conversationWidth: 1600, fontSize: 16, enabled: true, preset: 'custom', expandCode: true, expandTables: true});
  assert.equal(legacy.textWidth, DEFAULT_SETTINGS.textWidth);
  assert.match(read('src/content.ts'), /--layout-plus-text/);
  assert.match(read('src/content.ts'), /assistant-message"\] > \*/);
});

test('breakout turns off when a parent clips or the window is narrow', async () => {
  const {ancestorClips, breakoutActive} = await loadSource('../src/breakout.ts');
  const parent = {parentElement: null, overflowX: 'hidden', overflowY: 'visible'};
  const child = {parentElement: parent};
  const styleOf = (node) => ({overflowX: node.overflowX ?? 'visible', overflowY: node.overflowY ?? 'visible'});
  assert.equal(ancestorClips(child, styleOf), true);
  parent.overflowX = 'visible';
  assert.equal(ancestorClips(child, styleOf), false);
  assert.equal(breakoutActive(true, 1400, false), true);
  assert.equal(breakoutActive(true, 1400, true), false);
  assert.equal(breakoutActive(true, 700, false), false);
  assert.equal(breakoutActive(false, 1400, false), false);
  const source = read('src/breakout.ts');
  assert.ok(!source.includes('textContent'));
  assert.ok(!source.includes('innerText'));
});

test('reading preset uses measure, spacing and a system font', async () => {
  const {normalizeSettings, PRESETS} = await loadSource('../src/settings.ts');
  const reading = normalizeSettings({...PRESETS.reading, preset: 'reading', enabled: true});
  assert.ok(reading.lineHeight > PRESETS.developer.lineHeight);
  assert.ok(reading.textWidth < 75);
  assert.equal(reading.fontChoice, 'serif');
  assert.equal(reading.focusLatest, true);
  assert.equal(normalizeSettings({fontChoice: 'remote-font'}).fontChoice, 'system');
  const content = read('src/content.ts');
  assert.match(content, /data-message-author-role/);
  assert.match(content, /data-layout-plus-earlier/);
  assert.ok(!content.includes('fonts.googleapis'));
  assert.ok(!content.includes('fetch('));
});

test('code preset sets its own type and a height cap', async () => {
  const {normalizeSettings, PRESETS} = await loadSource('../src/settings.ts');
  const developer = normalizeSettings({...PRESETS.developer, preset: 'developer', enabled: true});
  assert.equal(developer.codeFontSize, 14);
  assert.equal(developer.codeMaxHeight, 480);
  assert.equal(developer.breakout, true);
  assert.equal(developer.textWidth, 72);
  assert.equal(normalizeSettings({codeMaxHeight: 40}).codeMaxHeight, 160);
  assert.equal(normalizeSettings({codeMaxHeight: 0}).codeMaxHeight, 0);
  assert.match(read('src/content.ts'), /--layout-plus-code-font/);
  assert.ok(!read('src/content.ts').includes('counter-increment'));
});

test('tables scroll inside themselves and images are a separate switch', async () => {
  const {PRESETS} = await loadSource('../src/settings.ts');
  assert.equal(PRESETS.wide.expandMedia, true);
  assert.equal(PRESETS.reading.expandMedia, false);
  const css = read('src/content.ts');
  assert.match(css, /overflow-x: auto/);
  assert.match(css, /position: sticky/);
  assert.match(css, /data-layout-plus-media/);
  assert.ok(!css.includes('innerText'));
});

test('composer height can return to native without a full reset', async () => {
  const {normalizeSettings, PRESETS} = await loadSource('../src/settings.ts');
  assert.equal(PRESETS.developer.composerMinHeight, 120);
  assert.equal(PRESETS.reading.composerMaxHeight, 160);
  assert.equal(normalizeSettings({composerMinHeight: 0, composerMaxHeight: 0}).composerMinHeight, 0);
  assert.match(read('src/content.ts'), /data-chatgpt-composer/);
});

test('sidebar width stays off on a narrow window', async () => {
  const {sidebarMode} = await loadSource('../src/settings.ts');
  assert.equal(sidebarMode(true, 1400), 'set');
  assert.equal(sidebarMode(true, 700), 'native');
  assert.equal(sidebarMode(false, 1400), 'native');
  const content = read('src/content.ts');
  assert.match(content, /min-width: 769px/);
  assert.ok(!content.includes('.click('));
});

test('presentation mode collapses the sidebar and can return', async () => {
  const {normalizeSettings, togglePresentation, PRESETS, DEFAULT_SETTINGS} = await loadSource('../src/settings.ts');
  const entered = togglePresentation(normalizeSettings({...DEFAULT_SETTINGS, preset: 'wide'}));
  assert.equal(entered.preset, 'presentation');
  assert.equal(entered.previousPreset, 'wide');
  assert.equal(entered.sidebarAdjust, true);
  assert.equal(entered.sidebarWidth, 0);
  assert.equal(entered.fontSize, 24);
  assert.equal(entered.textWidth, PRESETS.presentation.textWidth);
  const left = togglePresentation(entered);
  assert.equal(left.preset, 'wide');
  assert.equal(left.sidebarAdjust, false);
  const content = read('src/content.ts');
  assert.ok(!content.includes('upgrade'));
});

test('CSS has balanced braces', () => {
  const content=read('src/content.ts');
  const css=content.match(/const CSS = `([\s\S]*?)`;/)?.[1];
  assert.ok(css);
  assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
