# ChatGPT Layout+

Open-source browser extension for customizing ChatGPT's conversation width, composer width, typography, code blocks and tables.

**Status:** experimental MVP. Not affiliated with OpenAI.

The extension version is the `version` field in `package.json`. The build writes it into `dist/manifest.json`.

## Features

- Three layout presets: Default, Wide, Developer
- Independent conversation and composer widths (640–2000 px)
- Reply font size (12–22 px)
- Expand code blocks and tables
- Enable or disable without uninstalling
- Settings stored with `chrome.storage.sync`

## Limitations

ChatGPT is a third-party SPA and may change CSS class names or DOM. Overrides are best-effort; not every component honors each width preference. This extension does not bypass UI restrictions. Widths are capped by the viewport, and narrow screens fall back toward full width.

## Privacy

The extension requests only the `storage` permission. A content script runs on `https://chatgpt.com/*`.

It saves one object, `layoutPlusSettings`, in `chrome.storage.sync`: `enabled`, `preset`, `conversationWidth`, `composerWidth`, `fontSize`, `expandCode` and `expandTables`. If Chrome sync is turned on, Chrome syncs those preferences to the Google account. The extension has no server of its own.

The content script watches the page DOM (`childList` / `subtree`) and reads element geometry (`getBoundingClientRect`) so it can offset writing-block action buttons when they overlap the fixed title bar. It does not read conversation text and it does not make network requests.

## Install from a GitHub Release

1. Open the [latest release](https://github.com/IgorPaslauski/LayoutPlus/releases/latest) and download `layout-plus-<version>.zip`.
2. Extract the zip. `manifest.json` must sit in the extracted folder, not inside another `dist/` directory.
3. Open `chrome://extensions`.
4. Turn on **Developer mode**.
5. Click **Load unpacked** and select the extracted folder.
6. Open `https://chatgpt.com` and refresh the tab.

## Install from source

Requirements: Node.js 20+ and npm. Chrome or another Chromium browser with Manifest V3.

```bash
npm ci
npm run typecheck
npm test
npm run build
```

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked**.
4. Select this project's **`dist/`** directory.
5. Open `https://chatgpt.com` and click the Layout+ icon.
6. Refresh the ChatGPT tab after installing or updating the extension.

## Development

```bash
npm run dev
```

Rebuilds run automatically. Reload the extension in `chrome://extensions` and refresh the ChatGPT tab after each change.

If the npm registry is unavailable and TypeScript is installed globally, `npm run build:offline` is a fallback. Continuous integration uses `npm run build` only.

## Layout

- `src/settings.ts`: settings types, validation, presets
- `src/popup.ts`: popup controls and sync persistence
- `src/content.ts`: scoped CSS overrides on the ChatGPT page
- `public/`: manifest template and popup HTML/CSS. The template has no `version` field.
- `scripts/build.mjs`: browser bundle and `dist/`
- `scripts/stamp-manifest.cjs`: copies `package.json` version into `dist/manifest.json`
- `tests/`: source checks that do not require a build

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT (see [LICENSE](LICENSE)).
