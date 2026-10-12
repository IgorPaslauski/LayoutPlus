export const SETTINGS_KEY = 'layoutPlusSettings';
export type Preset = 'default' | 'wide' | 'developer' | 'reading' | 'custom';
export type FontChoice = 'system' | 'serif' | 'readable';
export interface Settings {
  enabled: boolean;
  preset: Preset;
  conversationWidth: number;
  textWidth: number;
  composerWidth: number;
  composerMinHeight: number;
  composerMaxHeight: number;
  fontSize: number;
  lineHeight: number;
  paragraphGap: number;
  fontChoice: FontChoice;
  focusLatest: boolean;
  codeFontSize: number;
  codeLineHeight: number;
  codeWrap: boolean;
  codeMaxHeight: number;
  expandCode: boolean;
  expandTables: boolean;
  expandMedia: boolean;
  breakout: boolean;
}
export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  preset: 'wide',
  conversationWidth: 1200,
  textWidth: 72,
  composerWidth: 1000,
  composerMinHeight: 0,
  composerMaxHeight: 0,
  fontSize: 16,
  lineHeight: 16,
  paragraphGap: 12,
  fontChoice: 'system',
  focusLatest: false,
  codeFontSize: 13,
  codeLineHeight: 15,
  codeWrap: false,
  codeMaxHeight: 0,
  expandCode: true,
  expandTables: true,
  expandMedia: true,
  breakout: false
};
type PresetFields = Pick<Settings, 'conversationWidth'|'textWidth'|'composerWidth'|'composerMinHeight'|'composerMaxHeight'|'fontSize'|'lineHeight'|'paragraphGap'|'fontChoice'|'focusLatest'|'codeFontSize'|'codeLineHeight'|'codeWrap'|'codeMaxHeight'|'expandCode'|'expandTables'|'expandMedia'|'breakout'>;
const comfortable = {lineHeight: 16, paragraphGap: 12, fontChoice: 'system' as const, focusLatest: false};
const codeDefaults = {codeFontSize: 13, codeLineHeight: 15, codeWrap: false, codeMaxHeight: 0};
const heights = {composerMinHeight: 0, composerMaxHeight: 0};
export const PRESETS: Record<Exclude<Preset, 'custom'>, PresetFields> = {
  default: {conversationWidth: 768, textWidth: 68, composerWidth: 768, fontSize: 16, expandCode: false, expandTables: false, expandMedia: false, breakout: false, ...comfortable, ...codeDefaults, ...heights},
  wide: {conversationWidth: 1200, textWidth: 72, composerWidth: 1000, fontSize: 16, expandCode: true, expandTables: true, expandMedia: true, breakout: false, ...comfortable, ...codeDefaults, ...heights},
  developer: {conversationWidth: 1600, textWidth: 72, composerWidth: 1300, fontSize: 15, expandCode: true, expandTables: true, expandMedia: true, breakout: true, ...comfortable, lineHeight: 15, ...codeDefaults, codeFontSize: 14, codeLineHeight: 16, codeMaxHeight: 480, ...heights, composerMinHeight: 120, composerMaxHeight: 320},
  reading: {conversationWidth: 840, textWidth: 66, composerWidth: 720, fontSize: 18, lineHeight: 17, paragraphGap: 16, fontChoice: 'serif', focusLatest: true, expandCode: false, expandTables: false, expandMedia: false, breakout: false, ...codeDefaults, ...heights, composerMaxHeight: 160}
};
const FONTS: FontChoice[] = ['system', 'serif', 'readable'];
const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : fallback;
function codeMaxHeight(value: unknown): number {
  const next = clamp(value, 0, 800, DEFAULT_SETTINGS.codeMaxHeight);
  return next === 0 ? 0 : Math.max(160, next);
}
export function normalizeSettings(input: unknown): Settings {
  const value = input && typeof input === 'object' ? input as Partial<Settings> : {};
  const preset: Preset = ['default', 'wide', 'developer', 'reading', 'custom'].includes(value.preset ?? '') ? value.preset! : DEFAULT_SETTINGS.preset;
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_SETTINGS.enabled,
    preset,
    conversationWidth: clamp(value.conversationWidth, 480, 2000, DEFAULT_SETTINGS.conversationWidth),
    textWidth: clamp(value.textWidth, 50, 85, DEFAULT_SETTINGS.textWidth),
    composerWidth: clamp(value.composerWidth, 480, 2000, DEFAULT_SETTINGS.composerWidth),
    composerMinHeight: clamp(value.composerMinHeight, 0, 320, DEFAULT_SETTINGS.composerMinHeight),
    composerMaxHeight: clamp(value.composerMaxHeight, 0, 480, DEFAULT_SETTINGS.composerMaxHeight),
    fontSize: clamp(value.fontSize, 12, 22, DEFAULT_SETTINGS.fontSize),
    lineHeight: clamp(value.lineHeight, 14, 20, DEFAULT_SETTINGS.lineHeight),
    paragraphGap: clamp(value.paragraphGap, 8, 28, DEFAULT_SETTINGS.paragraphGap),
    fontChoice: FONTS.includes(value.fontChoice as FontChoice) ? value.fontChoice as FontChoice : DEFAULT_SETTINGS.fontChoice,
    focusLatest: typeof value.focusLatest === 'boolean' ? value.focusLatest : DEFAULT_SETTINGS.focusLatest,
    codeFontSize: clamp(value.codeFontSize, 11, 20, DEFAULT_SETTINGS.codeFontSize),
    codeLineHeight: clamp(value.codeLineHeight, 12, 20, DEFAULT_SETTINGS.codeLineHeight),
    codeWrap: typeof value.codeWrap === 'boolean' ? value.codeWrap : DEFAULT_SETTINGS.codeWrap,
    codeMaxHeight: codeMaxHeight(value.codeMaxHeight),
    expandCode: typeof value.expandCode === 'boolean' ? value.expandCode : DEFAULT_SETTINGS.expandCode,
    expandTables: typeof value.expandTables === 'boolean' ? value.expandTables : DEFAULT_SETTINGS.expandTables,
    expandMedia: typeof value.expandMedia === 'boolean' ? value.expandMedia : DEFAULT_SETTINGS.expandMedia,
    breakout: typeof value.breakout === 'boolean' ? value.breakout : DEFAULT_SETTINGS.breakout
  };
}
export function applyPreset(settings: Settings, preset: Exclude<Preset, 'custom'>): Settings {
  return { ...settings, preset, ...PRESETS[preset] };
}

/** Cap a saved width to the current window. The saved number itself is unchanged. */
export function appliedWidth(saved: number, viewport: number): number {
  if (!Number.isFinite(viewport) || viewport <= 0) return saved;
  if (viewport <= 768) return Math.max(1, Math.round(viewport));
  return Math.min(saved, Math.max(320, Math.round(viewport - 32)));
}
