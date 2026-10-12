import {ancestorClips, breakoutActive} from './breakout';
import {pageReport, RUNTIME_KEY} from './page';
import {appliedWidth, sidebarMode, DEFAULT_SETTINGS, normalizeSettings, SETTINGS_KEY, type Settings} from './settings';

const STYLE_ID = 'layout-plus-style';
const ROOT_ATTRIBUTE = 'data-layout-plus';
let current = DEFAULT_SETTINGS;

// Scope changes to the conversation surface. Avoid hashed CSS classes,
// reading messages, or touching React-managed nodes.
const CSS = `
  html[data-layout-plus="on"] [data-app-shell-main-content-layout] {
    --thread-content-expanded-max-width: var(--layout-plus-conversation);
    --thread-content-compact-max-width: var(--layout-plus-conversation);
  }

  /* Conversation width is driven by the native responsive width chain. */
  html[data-layout-plus="on"] [data-thread-user-message-navigation-content] {
    max-width: min(100%, calc(var(--layout-plus-conversation) + var(--thread-body-inline-padding, 16px) * 2)) !important;
    min-width: 0;
  }

  /* The composer footer owns an independent copy of the width chain. */
  html[data-layout-plus="on"] [data-pip-obstacle="thread-footer"] {
    --thread-content-max-width: var(--layout-plus-composer) !important;
    --thread-body-max-width: calc(var(--layout-plus-composer) + var(--thread-body-inline-padding, 16px) * 2) !important;
    max-width: min(100%, var(--thread-body-max-width)) !important;
    min-width: 0;
  }
  html[data-layout-plus="on"] [data-chatgpt-composer][data-composer-placement="thread"] {
    max-width: 100%;
    min-width: 0;
  }
  html[data-layout-plus-composer-min="on"] [data-chatgpt-composer][data-composer-placement="thread"] {
    min-height: var(--layout-plus-composer-min);
  }
  html[data-layout-plus-composer-max="on"] [data-chatgpt-composer][data-composer-placement="thread"] {
    max-height: var(--layout-plus-composer-max);
    overflow-y: auto;
  }

  /* Keep the native writing-block header/title in its original position.
     Only the action buttons receive a temporary offset when overlapping the
     fixed ChatGPT toolbar. */
  html[data-layout-plus="on"] [data-oai-writing-block-surface] header.sticky {
    top: 0 !important;
  }
  html[data-layout-plus="on"] [data-oai-writing-block-surface] header.sticky > div:last-child {
    transform: translateY(var(--layout-plus-writing-actions-offset, 0px));
  }

  html[data-layout-plus="on"] [data-markdown-text-style="assistant-message"] {
    font-size: var(--layout-plus-font);
    line-height: var(--layout-plus-line);
  }
  html[data-layout-plus="on"] [data-markdown-text-style="assistant-message"] p {
    margin-block: var(--layout-plus-paragraph);
  }
  html[data-layout-plus-font="serif"] [data-markdown-text-style="assistant-message"] {
    font-family: Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, serif;
  }
  html[data-layout-plus-font="readable"] [data-markdown-text-style="assistant-message"] {
    font-family: Verdana, "Segoe UI", "Trebuchet MS", sans-serif;
  }
  html[data-layout-plus-focus="on"] [data-layout-plus-earlier] {
    opacity: 0.45;
    max-height: 8lh;
    overflow: hidden;
  }
  html[data-layout-plus-focus="on"] [data-layout-plus-earlier]:hover {
    opacity: 1;
    max-height: none;
    overflow: visible;
  }
  html[data-layout-plus="on"] [data-markdown-text-style="assistant-message"] > * {
    max-width: var(--layout-plus-text);
    margin-inline: auto;
  }

  html[data-layout-plus="on"] [data-markdown-text-style="assistant-message"] pre,
  html[data-layout-plus="on"] [data-markdown-text-style="assistant-message"] code {
    font-size: var(--layout-plus-code-font);
    line-height: var(--layout-plus-code-line);
  }
  html[data-layout-plus-code-wrap="on"] [data-markdown-text-style="assistant-message"] pre {
    white-space: pre-wrap;
  }
  html[data-layout-plus-code-max="on"] [data-markdown-text-style="assistant-message"] pre {
    max-height: var(--layout-plus-code-max);
    overflow: auto;
  }
  html[data-layout-plus="on"][data-layout-plus-code="on"]
  [data-markdown-text-style="assistant-message"] pre {
    max-width: 100%;
    width: 100%;
    margin-inline: 0;
    overflow-x: auto;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] table {
    display: block;
    width: 100%;
    max-width: 100%;
    margin-inline: 0;
    overflow-x: auto;
    border-collapse: separate;
    border-spacing: 0;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    background: Canvas;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] :is(td, th):first-child {
    position: sticky;
    left: 0;
    z-index: 1;
    background: Canvas;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] thead th:first-child {
    z-index: 3;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] tbody tr:nth-child(even) :is(td, th) {
    background: color-mix(in srgb, CanvasText 6%, Canvas);
  }
  html[data-layout-plus="on"][data-layout-plus-media="on"]
  [data-markdown-text-style="assistant-message"] :is(img, video, svg) {
    max-width: 100%;
    height: auto;
    margin-inline: 0;
  }
  html[data-layout-plus="on"][data-layout-plus-breakout="on"]
  [data-markdown-text-style="assistant-message"] :is(pre, table, img) {
    width: calc(100vw - 48px);
    max-width: calc(100vw - 48px);
    position: relative;
    left: 50%;
    transform: translateX(-50%);
  }

  @media (min-width: 769px) {
    html[data-layout-plus="on"][data-layout-plus-sidebar="set"] nav {
      width: var(--layout-plus-sidebar) !important;
      min-width: 0 !important;
      max-width: var(--layout-plus-sidebar) !important;
      flex-basis: var(--layout-plus-sidebar) !important;
      overflow: hidden !important;
    }
  }

  @media (max-width: 768px) {
    html[data-layout-plus="on"] [data-app-shell-main-content-layout] {
      --thread-content-expanded-max-width: 100%;
      --thread-content-compact-max-width: 100%;
    }
    html[data-layout-plus="on"] [data-pip-obstacle="thread-footer"] {
      --thread-content-max-width: 100% !important;
      --thread-body-max-width: 100% !important;
    }
    html[data-layout-plus="on"][data-layout-plus-breakout="on"]
    [data-markdown-text-style="assistant-message"] :is(pre, table, img) {
      width: 100%;
      max-width: 100%;
      left: auto;
      transform: none;
    }
  }
`;

function breakoutState(settings: Settings): 'on' | 'off' {
  const sample = document.querySelector('[data-markdown-text-style="assistant-message"] :is(pre, table, img)');
  const clipped = sample
    ? ancestorClips(sample, element => {
      const style = getComputedStyle(element as Element);
      return {overflowX: style.overflowX, overflowY: style.overflowY};
    })
    : false;
  return breakoutActive(settings.enabled && settings.breakout, window.innerWidth, clipped) ? 'on' : 'off';
}
function render(settings: Settings): void {
  current = settings;
  const root = document.documentElement;
  root.setAttribute(ROOT_ATTRIBUTE, settings.enabled ? 'on' : 'off');
  root.setAttribute('data-layout-plus-code', settings.expandCode ? 'on' : 'off');
  root.setAttribute('data-layout-plus-tables', settings.expandTables ? 'on' : 'off');
  root.setAttribute('data-layout-plus-media', settings.expandMedia ? 'on' : 'off');
  root.setAttribute('data-layout-plus-breakout', breakoutState(settings));
  root.style.setProperty('--layout-plus-conversation', `${appliedWidth(settings.conversationWidth, window.innerWidth)}px`);
  root.style.setProperty('--layout-plus-text', `${settings.textWidth}ch`);
  root.style.setProperty('--layout-plus-composer', `${appliedWidth(settings.composerWidth, window.innerWidth)}px`);
  root.setAttribute('data-layout-plus-composer-min', settings.composerMinHeight > 0 ? 'on' : 'off');
  root.setAttribute('data-layout-plus-composer-max', settings.composerMaxHeight > 0 ? 'on' : 'off');
  root.style.setProperty('--layout-plus-composer-min', `${settings.composerMinHeight}px`);
  root.style.setProperty('--layout-plus-composer-max', `${settings.composerMaxHeight}px`);
  root.setAttribute('data-layout-plus-font', settings.fontChoice);
  root.setAttribute('data-layout-plus-focus', settings.enabled && settings.focusLatest ? 'on' : 'off');
  root.style.setProperty('--layout-plus-font', `${settings.fontSize}px`);
  root.style.setProperty('--layout-plus-line', `${settings.lineHeight / 10}`);
  root.style.setProperty('--layout-plus-paragraph', `${settings.paragraphGap}px`);
  root.setAttribute('data-layout-plus-code-wrap', settings.codeWrap ? 'on' : 'off');
  root.setAttribute('data-layout-plus-code-max', settings.codeMaxHeight > 0 ? 'on' : 'off');
  root.style.setProperty('--layout-plus-code-font', `${settings.codeFontSize}px`);
  root.style.setProperty('--layout-plus-code-line', `${settings.codeLineHeight / 10}`);
  root.style.setProperty('--layout-plus-code-max', `${settings.codeMaxHeight}px`);
  root.setAttribute('data-layout-plus-sidebar', settings.enabled ? sidebarMode(settings.sidebarAdjust, window.innerWidth) : 'native');
  root.style.setProperty('--layout-plus-sidebar', `${settings.sidebarWidth}px`);
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!settings.enabled) {
    document.querySelectorAll<HTMLElement>('[data-oai-writing-block-surface] header.sticky').forEach(
      header => header.style.removeProperty('--layout-plus-writing-actions-offset')
    );
    style?.remove();
    return;
  }
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    (document.head ?? document.documentElement).appendChild(style);
  }
  if (style.textContent !== CSS) style.textContent = CSS;
  scheduleWritingAlignment();
}

chrome.storage.sync.get(SETTINGS_KEY)
  .then(result => render(normalizeSettings(result[SETTINGS_KEY])))
  .catch(() => render(DEFAULT_SETTINGS));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[SETTINGS_KEY]) render(normalizeSettings(changes[SETTINGS_KEY].newValue));
});
window.addEventListener('pageshow', () => render(current));

// The native writing-block title stays untouched. Offset only its actions
// when they would cover the fixed Share / More toolbar. Does not read content.
let alignmentPending = false;
function alignWritingActions(): void {
  alignmentPending = false;
  if (!current.enabled) return;
  const toolbar = document.querySelector<HTMLElement>('[data-app-shell-titlebar="true"]');
  const toolbarBottom = toolbar?.getBoundingClientRect().bottom ?? 0;
  for (const header of document.querySelectorAll<HTMLElement>(
    '[data-oai-writing-block-surface] header.sticky'
  )) {
    const actionGroup = header.querySelector<HTMLElement>(':scope > div:last-child');
    if (!actionGroup) continue;
    const rect = header.getBoundingClientRect();
    const visible = rect.bottom > 0 && rect.top < window.innerHeight;
    const offset = visible && toolbarBottom > rect.top
      ? Math.max(0, Math.ceil(toolbarBottom - rect.top + 8))
      : 0;
    header.style.setProperty('--layout-plus-writing-actions-offset', `${offset}px`);
  }
}
function markEarlierMessages(focus: boolean): void {
  const nodes = document.querySelectorAll('[data-message-author-role]');
  nodes.forEach((node, index) => {
    if (focus && index < nodes.length - 1) node.setAttribute('data-layout-plus-earlier', '');
    else node.removeAttribute('data-layout-plus-earlier');
  });
}
function scheduleWritingAlignment(): void {
  if (alignmentPending) return;
  alignmentPending = true;
  requestAnimationFrame(() => {
    alignWritingActions();
    document.documentElement.setAttribute('data-layout-plus-breakout', breakoutState(current));
    markEarlierMessages(current.enabled && current.focusLatest);
    reportPage();
  });
}
let lastPageReport = '';
function reportPage(): void {
  const report = pageReport(
    selector => document.querySelector(selector),
    document.visibilityState === 'visible',
    window.innerWidth
  );
  const encoded = JSON.stringify(report);
  if (encoded === lastPageReport) return;
  lastPageReport = encoded;
  chrome.storage.session.set({[RUNTIME_KEY]: report}).catch(() => {});
}
document.addEventListener('visibilitychange', reportPage);
window.addEventListener('scroll', scheduleWritingAlignment, {capture: true, passive: true});
window.addEventListener('resize', () => render(current), {passive: true});
window.addEventListener('pageshow', scheduleWritingAlignment);
const writingObserver = new MutationObserver(scheduleWritingAlignment);
writingObserver.observe(document.documentElement, {childList: true, subtree: true});
scheduleWritingAlignment();
