export const PAGE_ANCHORS = [
  '[data-app-shell-main-content-layout]',
  '[data-pip-obstacle="thread-footer"]'
] as const;

export const RUNTIME_KEY = 'layoutPlusRuntime';

export interface PageReport {
  found: boolean;
  visible: boolean;
}

/** Presence of layout anchors only. Message text is never an input. */
export function anchorsFound(querySelector: (selector: string) => unknown): boolean {
  return PAGE_ANCHORS.every(selector => querySelector(selector) != null);
}

export function pageReport(querySelector: (selector: string) => unknown, visible: boolean): PageReport {
  return {found: anchorsFound(querySelector), visible};
}
