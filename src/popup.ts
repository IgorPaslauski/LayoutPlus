import {applyStaticCopy, t} from './i18n';
import {RUNTIME_KEY, type PageReport} from './page';
import {appliedWidth, DEFAULT_SETTINGS, SETTINGS_KEY, PRESETS, applyPreset, applyNamed, deleteNamed, exportPayload, saveNamed, togglePresentation, normalizeSettings, type Settings} from './settings';
applyStaticCopy();
let settings = DEFAULT_SETTINGS;
let viewport = 0;
let writeQueue: Promise<void> = Promise.resolve();
const input = (id: string): HTMLInputElement => document.getElementById(id) as HTMLInputElement;
const label = (id: string): HTMLElement => document.getElementById(id)!;
function widthText(saved: number): string {
  const applied = appliedWidth(saved, viewport);
  if (!viewport || applied === saved) return `${saved} px`;
  return `${saved} px · ${applied}`;
}
function paint(): void {
  input('enabled').checked = settings.enabled;
  label('conversationWidthValue').textContent = widthText(settings.conversationWidth);
  label('composerWidthValue').textContent = widthText(settings.composerWidth);
  input('conversationWidth').value = String(settings.conversationWidth);
  input('composerWidth').value = String(settings.composerWidth);
  input('composerMinHeight').value = String(settings.composerMinHeight);
  label('composerMinHeightValue').textContent = settings.composerMinHeight === 0 ? t('heightNative') : `${settings.composerMinHeight} px`;
  input('composerMaxHeight').value = String(settings.composerMaxHeight);
  label('composerMaxHeightValue').textContent = settings.composerMaxHeight === 0 ? t('heightNative') : `${settings.composerMaxHeight} px`;
  input('fontSize').value = String(settings.fontSize);
  label('fontSizeValue').textContent = `${settings.fontSize} px`;
  input('textWidth').value = String(settings.textWidth);
  label('textWidthValue').textContent = `${settings.textWidth} ch`;
  input('lineHeight').value = String(settings.lineHeight);
  label('lineHeightValue').textContent = (settings.lineHeight / 10).toFixed(1);
  input('paragraphGap').value = String(settings.paragraphGap);
  label('paragraphGapValue').textContent = `${settings.paragraphGap} px`;
  input('fontChoice').value = settings.fontChoice;
  input('focusLatest').checked = settings.focusLatest;
  input('codeFontSize').value = String(settings.codeFontSize);
  label('codeFontSizeValue').textContent = `${settings.codeFontSize} px`;
  input('codeLineHeight').value = String(settings.codeLineHeight);
  label('codeLineHeightValue').textContent = (settings.codeLineHeight / 10).toFixed(1);
  input('codeMaxHeight').value = String(settings.codeMaxHeight);
  label('codeMaxHeightValue').textContent = settings.codeMaxHeight === 0 ? t('codeMaxAuto') : `${settings.codeMaxHeight} px`;
  input('codeWrap').checked = settings.codeWrap;
  input('expandCode').checked = settings.expandCode;
  input('expandTables').checked = settings.expandTables;
  input('expandMedia').checked = settings.expandMedia;
  input('breakout').checked = settings.breakout;
  input('sidebarAdjust').checked = settings.sidebarAdjust;
  input('sidebarWidth').value = String(settings.sidebarWidth);
  label('sidebarWidthValue').textContent = `${settings.sidebarWidth} px`;
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
    button.classList.toggle('active', button.dataset.preset === settings.preset);
    button.setAttribute('aria-pressed', String(button.dataset.preset === settings.preset));
  });
  document.body.classList.toggle('is-off', !settings.enabled);
  const note = document.getElementById('presetNote');
  if (note) note.hidden = settings.preset !== 'custom';
  paintNamed();
}
function paintNamed(): void {
  const list = document.getElementById('namedList');
  if (!list) return;
  list.replaceChildren();
  settings.namedPresets.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'named-item';
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.className = 'named-apply';
    apply.textContent = item.name;
    apply.classList.toggle('active', index === settings.activeNamed);
    apply.addEventListener('click', () => update(applyNamed(settings, index)));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'named-delete';
    remove.textContent = '×';
    remove.setAttribute('aria-label', t('deleteNamed'));
    remove.addEventListener('click', () => update(deleteNamed(settings, index)));
    row.append(apply, remove);
    list.append(row);
  });
}
function paintPage(report: PageReport | undefined): void {
  viewport = report?.viewport ?? 0;
  const note = document.getElementById('pageNote');
  if (note) note.hidden = !(report?.visible === true && report.found === false);
  if (document.getElementById('conversationWidthValue')) {
    label('conversationWidthValue').textContent = widthText(settings.conversationWidth);
    label('composerWidthValue').textContent = widthText(settings.composerWidth);
    label('composerMinHeightValue').textContent = settings.composerMinHeight === 0 ? t('heightNative') : `${settings.composerMinHeight} px`;
    label('composerMaxHeightValue').textContent = settings.composerMaxHeight === 0 ? t('heightNative') : `${settings.composerMaxHeight} px`;
  }
}
function update(next: Settings): void {
  settings = normalizeSettings(next);
  paint();
  label('status').textContent = t('statusSaving');
  const snapshot = {...settings};
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    await chrome.storage.sync.set({[SETTINGS_KEY]: snapshot});
    label('status').textContent = t('statusSaved');
  }).catch(() => { label('status').textContent = t('statusError'); });
}
for (const field of ['conversationWidth','composerWidth','fontSize','textWidth','lineHeight','paragraphGap','codeFontSize','codeLineHeight','codeMaxHeight','composerMinHeight','composerMaxHeight','sidebarWidth'] as const) {
  input(field).addEventListener('input', () => update({...settings, [field]: Number(input(field).value), preset:'custom', activeNamed: -1}));
}
for (const field of ['enabled','expandCode','expandTables','expandMedia','breakout','focusLatest','codeWrap','sidebarAdjust'] as const) {
  input(field).addEventListener('change', () => update({...settings, [field]: input(field).checked, ...(field === 'enabled' ? {} : {preset:'custom' as const, activeNamed: -1})}));
}
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
  button.addEventListener('click', () => {
    const preset = button.dataset.preset as keyof typeof PRESETS;
    if (preset === 'presentation') update(togglePresentation(settings));
    else if (preset in PRESETS) update(applyPreset(settings, preset));
  });
});
label('reset').addEventListener('click', () => update({...DEFAULT_SETTINGS}));
input('fontChoice').addEventListener('change', () => update({...settings, fontChoice: input('fontChoice').value as Settings['fontChoice'], preset: 'custom', activeNamed: -1}));
label('composerNative').addEventListener('click', () => update({...settings, composerMinHeight: 0, composerMaxHeight: 0, preset: 'custom', activeNamed: -1}));
label('saveNamed').addEventListener('click', () => {
  const next = saveNamed(settings, input('presetName').value);
  if (!next) {
    label('status').textContent = cleanEnough(input('presetName').value) ? t('namedFull') : t('namedInvalid');
    return;
  }
  input('presetName').value = '';
  update(next);
});
label('exportNamed').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(exportPayload(settings))], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'layout-plus-presets.json';
  link.click();
  URL.revokeObjectURL(url);
});
input('importNamed').addEventListener('change', () => {
  const file = input('importNamed').files?.[0];
  input('importNamed').value = '';
  if (!file || file.size > 20000) {
    label('status').textContent = t('namedInvalid');
    return;
  }
  file.text().then(text => {
    const parsed = JSON.parse(text) as {layoutPlus?: unknown; presets?: unknown};
    if (parsed.layoutPlus !== 1) throw new Error('shape');
    update({...settings, namedPresets: normalizeSettings({namedPresets: parsed.presets}).namedPresets});
  }).catch(() => { label('status').textContent = t('namedInvalid'); });
});
function cleanEnough(value: string): boolean {
  return value.trim().length > 0;
}
const commandNames: Record<string, string> = {
  'toggle-enabled': 'cmdToggle',
  'cycle-preset': 'cmdCycle',
  'toggle-presentation': 'cmdPresentation'
};
const getCommands = globalThis.chrome?.commands?.getAll?.bind(globalThis.chrome.commands);
if (getCommands) {
  getCommands().then(commands => {
    const hint = document.getElementById('shortcutHint');
    if (!hint) return;
    const parts = commands.flatMap(command => {
      const key = command.name ? commandNames[command.name] : undefined;
      return command.shortcut && key ? [`${command.shortcut} ${t(key)}`] : [];
    });
    hint.hidden = parts.length === 0;
    hint.textContent = parts.join(' · ');
  }).catch(() => {});
}
const session = globalThis.chrome?.storage?.session;
if (session) {
  session.get(RUNTIME_KEY)
    .then(result => paintPage(result[RUNTIME_KEY] as PageReport | undefined))
    .catch(() => paintPage(undefined));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session' && changes[RUNTIME_KEY]) paintPage(changes[RUNTIME_KEY].newValue as PageReport | undefined);
  });
}
const storage = globalThis.chrome?.storage?.sync;
if (storage) {
  storage.get(SETTINGS_KEY)
    .then(result => { settings = normalizeSettings(result[SETTINGS_KEY]); paint(); })
    .catch(() => { settings = DEFAULT_SETTINGS; paint(); label('status').textContent = t('statusStorage'); });
} else {
  paint();
  label('status').textContent = t('statusStorage');
}
