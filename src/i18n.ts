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
  presetCustom: 'Manual adjustment',
  pageMissing: 'The layout could not find this page',
  conversation: 'Conversation',
  composer: 'Prompt',
  fontSize: 'Text',
  textWidth: 'Column',
  expandCode: 'Full-width code',
  expandTables: 'Full-width tables',
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
}
