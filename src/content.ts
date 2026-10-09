import {DEFAULT_SETTINGS, normalizeSettings, SETTINGS_KEY, type Settings} from './settings';

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
  }

  html[data-layout-plus="on"][data-layout-plus-code="on"]
  [data-markdown-text-style="assistant-message"] pre {
    max-width: 100%;
    overflow-x: auto;
  }
  html[data-layout-plus="on"][data-layout-plus-tables="on"]
  [data-markdown-text-style="assistant-message"] table {
    width: 100%;
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
  }
`;

function render(settings: Settings): void {
  current = settings;
  const root = document.documentElement;
  root.setAttribute(ROOT_ATTRIBUTE, settings.enabled ? 'on' : 'off');
  root.setAttribute('data-layout-plus-code', settings.expandCode ? 'on' : 'off');
  root.setAttribute('data-layout-plus-tables', settings.expandTables ? 'on' : 'off');
  root.style.setProperty('--layout-plus-conversation', `${settings.conversationWidth}px`);
  root.style.setProperty('--layout-plus-composer', `${settings.composerWidth}px`);
  root.style.setProperty('--layout-plus-font', `${settings.fontSize}px`);
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
function scheduleWritingAlignment(): void {
  if (alignmentPending) return;
  alignmentPending = true;
  requestAnimationFrame(alignWritingActions);
}
window.addEventListener('scroll', scheduleWritingAlignment, {capture: true, passive: true});
window.addEventListener('resize', scheduleWritingAlignment, {passive: true});
window.addEventListener('pageshow', scheduleWritingAlignment);
const writingObserver = new MutationObserver(scheduleWritingAlignment);
writingObserver.observe(document.documentElement, {childList: true, subtree: true});
scheduleWritingAlignment();
