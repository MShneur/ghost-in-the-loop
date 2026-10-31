# Ghost 9.0.22 | Provenance and independently selectable exporters

## Verified upstream source as of 2026-10-31

1. pionxzh/chatgpt-exporter: https://github.com/pionxzh/chatgpt-exporter ; inspected commit 6935bc1 ; MIT. 2.37.1 released 2026-10-12. It implements official ChatGPT conversation archival data, HTML, Markdown and JSON. Ghost independently implements the legacy mapping reader and paginated reader, without copying source code. Upstream long-chat field completeness not independently reproduced.
2. vaulthunt3r/dialogue-export: https://github.com/vaulthunt3r/dialogue-export ; inspected commit 70c60e9 ; MIT. The upstream README reports a 301-message ChatGPT verification in 0.5.2 and successful very-long-text capture in 0.5.5 on 2026-10-24. Ghost extracts mechanisms: cache virtualized windows with stable IDs, seek beginning and then sweep forward, restore original scroll, fail partial if completeness unverified. It is not upstream code copy.
3. Kin-Zhang/anychat-exporter: https://github.com/Kin-Zhang/anychat-exporter ; inspected commit 84d3a03 ; MIT. README claims multi-provider formats for ChatGPT, Claude, Gemini and AI Studio. Those platform-specific long-chat field claims were not independently verified. Ghost retains conservative DOM fallback and universal escaped HTML, not upstream code.

## Real Ghost buttons

- Export 1 (ChatGPT): paged authenticated conversation history. No legacy or scroll invocation.
- Export 2 (ChatGPT): distinct legacy conversation mapping and current-node proof. Perplexity uses its existing REST reader, explicitly labeled PARTIAL until independently verified. No paged history invocation.
- Export 3 (ChatGPT): DOM scroller and virtualized turn cache. Does not invoke conversation history network endpoints. Other AI sites read rendered page only, marked PARTIAL.
- Auto: tries 1, then 2, then 3 until verified complete. If no method establishes completeness, retains safely orderable content and marks PARTIAL.
- Separate Save as dropdown offers HTML, Markdown, JSON. Each explicit method writes a filename with E1/E2/E3. Existing Copy MD, Save MD/HTML/JSON and Project Vault preserved under compact Other save options.

## Tests and limits

- 65 passing focused Jest tests across eight suites before final browser test.
- Simulated mobile Chromium at 360 px: all three distinct button clicks generated an HTML file. E1 made only paged history request, E2 only legacy history request, E3 made no history requests. E1/E2 sample fixtures verified FULL, E3 showed PARTIAL.
- These are Ghost isolated tests, not a claim that the current authenticated Firefox Android/ChatGPT field path is proven. Upstream verified 301-message results do not automatically transfer to Ghost.
- Generated extension parity, lint, and tests must be rerun after final code changes. No network upload, paid model calls, GitHub-hosted Actions or main-branch release. Keep the PR draft until owner field acceptance.

## Preview installation channel

- Candidate userscript: https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/feature/9.0.21-mobile-export-fallback/ghost-in-the-loop.user.js
- Its Tampermonkey update/download URLs intentionally track this review branch rather than stable main, so a preview install is not silently replaced by stable 9.0.20.
- The preview is NOT automatically installed into Firefox Android; install via the browser userscript manager when ready and check that only one Ghost script is enabled for ChatGPT.
- No merge, automatic publication or production stable update is authorized.
