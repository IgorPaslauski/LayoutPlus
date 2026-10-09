import {DEFAULT_SETTINGS, SETTINGS_KEY, PRESETS, applyPreset, normalizeSettings, type Settings} from './settings';
let settings = DEFAULT_SETTINGS;
let writeQueue: Promise<void> = Promise.resolve();
const input = (id: string): HTMLInputElement => document.getElementById(id) as HTMLInputElement;
const label = (id: string): HTMLElement => document.getElementById(id)!;
function paint(): void {
  input('enabled').checked = settings.enabled;
  for (const field of ['conversationWidth','composerWidth','fontSize'] as const) {
    input(field).value = String(settings[field]);
    label(`${field}Value`).textContent = `${settings[field]} px`;
  }
  input('expandCode').checked = settings.expandCode;
  input('expandTables').checked = settings.expandTables;
  document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
    button.classList.toggle('active', button.dataset.preset === settings.preset);
  });
}
function update(next: Settings): void {
  settings = normalizeSettings(next);
  paint();
  label('status').textContent = 'Salvando...';
  const snapshot = {...settings};
  writeQueue = writeQueue.catch(() => {}).then(async () => {
    await chrome.storage.sync.set({[SETTINGS_KEY]: snapshot});
    label('status').textContent = 'Salvo automaticamente';
  }).catch(() => { label('status').textContent = 'Erro ao salvar'; });
}
for (const field of ['conversationWidth','composerWidth','fontSize'] as const) {
  input(field).addEventListener('input', () => update({...settings, [field]: Number(input(field).value), preset:'custom'}));
}
for (const field of ['enabled','expandCode','expandTables'] as const) {
  input(field).addEventListener('change', () => update({...settings, [field]: input(field).checked, ...(field === 'enabled' ? {} : {preset:'custom' as const})}));
}
document.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach(button => {
  button.addEventListener('click', () => {
    const preset = button.dataset.preset as keyof typeof PRESETS;
    if (preset in PRESETS) update(applyPreset(settings, preset));
  });
});
label('reset').addEventListener('click', () => update({...DEFAULT_SETTINGS}));
chrome.storage.sync.get(SETTINGS_KEY)
  .then(result => { settings = normalizeSettings(result[SETTINGS_KEY]); paint(); })
  .catch(() => { settings = DEFAULT_SETTINGS; paint(); label('status').textContent = 'Armazenamento indisponível'; });
