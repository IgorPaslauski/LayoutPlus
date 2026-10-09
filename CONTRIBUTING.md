# Contributing

Issues and pull requests are welcome. Keep changes scoped to layout. Do not collect conversation content, and do not add permissions or hosts beyond `storage` and `https://chatgpt.com/*`.

## Setup

```bash
npm ci
npm run typecheck
npm test
npm run build
node scripts/verify-dist.mjs
```

Use Node.js 20 or newer. Open a pull request with test steps. Include screenshots when the layout changes. Try a narrow viewport, a wide viewport, tables, code blocks and a long chat.

Do not paste personal chat content into issues or pull requests.

## Releases

A release edits two places only:

1. `version` in `package.json` (`x.y.z`)
2. A matching section in `CHANGELOG.md`

Do not edit `public/manifest.json`, the tests, the workflows or the build scripts to bump the version. Merge to `main`, wait for CI, then push an annotated tag `vX.Y.Z` equal to `package.json`. The release workflow checks that SemVer tag, builds `dist/`, and publishes `layout-plus-X.Y.Z.zip`.
