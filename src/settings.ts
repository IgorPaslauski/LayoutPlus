export const SETTINGS_KEY = 'layoutPlusSettings';
export type Preset = 'default' | 'wide' | 'developer' | 'custom';
export interface Settings {
  enabled: boolean;
  preset: Preset;
  conversationWidth: number;
  composerWidth: number;
  fontSize: number;
  expandCode: boolean;
  expandTables: boolean;
}
export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  preset: 'wide',
  conversationWidth: 1200,
  composerWidth: 1000,
  fontSize: 16,
  expandCode: true,
  expandTables: true
};
export const PRESETS: Record<Exclude<Preset, 'custom'>, Pick<Settings, 'conversationWidth'|'composerWidth'|'fontSize'|'expandCode'|'expandTables'>> = {
  default: {conversationWidth: 768, composerWidth: 768, fontSize: 16, expandCode: false, expandTables: false},
  wide: {conversationWidth: 1200, composerWidth: 1000, fontSize: 16, expandCode: true, expandTables: true},
  developer: {conversationWidth: 1600, composerWidth: 1300, fontSize: 15, expandCode: true, expandTables: true}
};
const clamp = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.max(min, Math.min(max, value))) : fallback;
export function normalizeSettings(input: unknown): Settings {
  const value = input && typeof input === 'object' ? input as Partial<Settings> : {};
  const preset: Preset = ['default', 'wide', 'developer', 'custom'].includes(value.preset ?? '') ? value.preset! : DEFAULT_SETTINGS.preset;
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULT_SETTINGS.enabled,
    preset,
    conversationWidth: clamp(value.conversationWidth, 640, 2000, DEFAULT_SETTINGS.conversationWidth),
    composerWidth: clamp(value.composerWidth, 640, 2000, DEFAULT_SETTINGS.composerWidth),
    fontSize: clamp(value.fontSize, 12, 22, DEFAULT_SETTINGS.fontSize),
    expandCode: typeof value.expandCode === 'boolean' ? value.expandCode : DEFAULT_SETTINGS.expandCode,
    expandTables: typeof value.expandTables === 'boolean' ? value.expandTables : DEFAULT_SETTINGS.expandTables
  };
}
export function applyPreset(settings: Settings, preset: Exclude<Preset, 'custom'>): Settings {
  return { ...settings, preset, ...PRESETS[preset] };
}
