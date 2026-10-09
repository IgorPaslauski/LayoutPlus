# Changelog

## 0.2.2

Writing-block collision fix now moves only Copy/Open editor action icons when the fixed ChatGPT titlebar overlaps them; the title and header remain at their native position. Validated with static tests; visual Chrome validation still required.

## 0.2.1

### ChatGPT DOM alignment

Updated the layout stylesheet to use actual ChatGPT CSS width variables and semantic `data-*` anchors from an October 2026 page snapshot. The composer footer now receives a separate width constraint from the conversation transcript. No message contents are collected. ChatGPT DOM is not a stable public API: verify the layout in Chrome following site updates.

### Writing block controls

The writing-block sticky toolbar is offset below the native fixed titlebar to reduce Copy/Open editor overlap with Share/More when scrolling. Verify manually across ChatGPT variants and viewport sizes.
