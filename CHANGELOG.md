# Changelog

## Unreleased

- The popup, toolbar title and manifest description follow the browser language. English is the fallback and Brazilian Portuguese is included.
- The popup says when the ChatGPT layout anchors are missing. The check looks for elements only, not conversation text.
- A width saved on a large monitor is capped to the current window. The stored number stays the same, and the popup shows the applied width when it is smaller.
- Paragraphs keep a character measure while code, tables and images can use the wider column. The Code preset no longer stretches the paragraph to 1600 px.
- An optional switch lets code, tables and images leave the column. It stays off by default, stays off on a narrow window, and falls back when a parent clips the block.

## 0.2.2

Writing-block collision fix now moves only Copy/Open editor action icons when the fixed ChatGPT titlebar overlaps them; the title and header remain at their native position. Validated with static tests; visual Chrome validation still required.

## 0.2.1

### ChatGPT DOM alignment

Updated the layout stylesheet to use actual ChatGPT CSS width variables and semantic `data-*` anchors from an October 2026 page snapshot. The composer footer now receives a separate width constraint from the conversation transcript. No message contents are collected. ChatGPT DOM is not a stable public API: verify the layout in Chrome following site updates.

### Writing block controls

The writing-block sticky toolbar is offset below the native fixed titlebar to reduce Copy/Open editor overlap with Share/More when scrolling. Verify manually across ChatGPT variants and viewport sizes.
