export const ENGLISH: Record<string, string> = {
  extName: 'ChatGPT Layout+',
  extDescription: 'Make ChatGPT wider: conversation, prompt, text, code and tables.',
  actionTitle: 'ChatGPT Layout+',
  enableTitle: 'Turn extension on',
  presetsLabel: 'Presets',
  presetDefault: 'Default',
  presetWide: 'Wide',
  presetDeveloper: 'Code',
  presetReading: 'Read',
  presetPresentation: 'Present',
  presetCustom: 'Manual adjustment',
  pageMissing: 'The layout could not find this page',
  conversation: 'Conversation',
  composer: 'Prompt',
  composerMinHeight: 'Prompt height',
  composerMaxHeight: 'Prompt limit',
  composerNative: 'Native height',
  heightNative: 'Native',
  fontSize: 'Text',
  textWidth: 'Column',
  expandCode: 'Full-width code',
  expandTables: 'Full-width tables',
  expandMedia: 'Full-width images',
  breakout: 'Let blocks leave the column',
  lineHeight: 'Line spacing',
  paragraphGap: 'Paragraph gap',
  fontChoice: 'Font',
  fontSystem: 'System',
  fontSerif: 'Serif',
  fontReadable: 'Readable',
  focusLatest: 'Dim earlier replies',
  codeFontSize: 'Code size',
  codeLineHeight: 'Code spacing',
  codeMaxHeight: 'Code block height',
  codeMaxAuto: 'Auto',
  codeWrap: 'Wrap code lines',
  sidebarAdjust: 'Adjust sidebar',
  sidebarWidth: 'Sidebar',
  presetNamePlaceholder: 'Name',
  saveNamed: 'Save',
  deleteNamed: 'Delete preset',
  exportNamed: 'Export',
  importNamed: 'Import',
  namedFull: 'Four presets already',
  namedInvalid: 'Could not use that preset',
  cmdToggle: 'Turn layout on or off',
  cmdCycle: 'Next preset',
  cmdPresentation: 'Presentation',
  reset: 'Restore',
  statusSaving: 'Saving...',
  statusSaved: 'Saved',
  statusError: "Couldn't save",
  statusStorage: 'Storage unavailable'
};

export function t(key: string, substitutions?: string | string[]): string {
  try {
    const message = globalThis.chrome?.i18n?.getMessage?.(key, substitutions);
    if (message) return message;
  } catch {
    /* Popup opened outside the extension runtime. */
  }
  const template = ENGLISH[key] ?? key;
  if (substitutions === undefined) return template;
  const values = Array.isArray(substitutions) ? substitutions : [substitutions];
  return template.replace(/\$(\d+)/g, (_, index: string) => values[Number(index) - 1] ?? '');
}

export function applyStaticCopy(): void {
  const lang = globalThis.chrome?.i18n?.getUILanguage?.();
  if (lang) document.documentElement.lang = lang;
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach(node => {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach(node => {
    const key = node.dataset.i18nTitle;
    if (key) node.title = t(key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-label]').forEach(node => {
    const key = node.dataset.i18nLabel;
    if (key) node.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll<HTMLInputElement>('[data-i18n-placeholder]').forEach(node => {
    const key = node.dataset.i18nPlaceholder;
    if (key) node.placeholder = t(key);
  });
}
