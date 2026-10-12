import {SETTINGS_KEY, cycleSettings, normalizeSettings, togglePresentation} from './settings';

chrome.commands.onCommand.addListener(command => {
  chrome.storage.sync.get(SETTINGS_KEY).then(stored => {
    const current = normalizeSettings(stored[SETTINGS_KEY]);
    const next = command === 'toggle-enabled'
      ? {...current, enabled: !current.enabled}
      : command === 'toggle-presentation'
        ? togglePresentation(current)
        : command === 'cycle-preset'
          ? cycleSettings(current)
          : current;
    return chrome.storage.sync.set({[SETTINGS_KEY]: next});
  }).catch(() => {});
});
