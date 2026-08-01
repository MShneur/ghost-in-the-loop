## Agent E external prior art memo: dependency-light techniques for GITL

Scope: read-only review of external prior art for a single dependency-light userscript/IIFE. Recommendation language below treats each source as a technique source, not as a dependency to vendor.

### Shortlist table

| Candidate / prior art | License | Size / dependency cost | Technique worth extracting | IIFE fit | Recommendation |
|---|---:|---:|---|---|---|
| Playwright role + ARIA-first locators (`getByRole`, `getByLabel`, strictness) - https://playwright.dev/docs/locators | Apache-2.0 (`microsoft/playwright`) | Huge framework, but technique is zero-runtime; already dev-only in repo | Locate controls by role + computed accessible name; fail when more than one actuator matches instead of picking `.first()`; include implicit roles and accessible names from `aria-labelledby`, `aria-label`, `<label>`, placeholder/title, and text | Excellent as a small helper; do not import Playwright | **BUILD**: implement a tiny `roleOf(el)` + `accName(el)` helper and use it as a fallback/score input for `_heurInput`, `_heurSend`, and diagnostics. Preserve current "heuristic send is not an actuator" invariant. |
| Playwright device descriptors - https://playwright.dev/docs/emulation | Apache-2.0 | Dev-test only; repo already imports `devices` in `playwright.config.js` | Use canonical device bundles (`viewport`, `userAgent`, `deviceScaleFactor`, `isMobile`, `hasTouch`, `defaultBrowserType`) for mobile smoke testing instead of hand-tuned viewport-only tests | No userscript impact | **BUILD (CI/test)**: add a small opt-in mobile smoke project, e.g. Chromium `Pixel 7` and WebKit/`iPhone 13` when browsers are available, covering orb geometry, composer detection, reviewed-button/Enter fallback. Keep full suite desktop to control time. |
| `lijiarui/claude-auto-continue` - https://github.com/lijiarui/claude-auto-continue | MIT | Small MV3 extension (~589 KB repo); no runtime library | Continue-button scanning with exact/prefix allowlist, explicit exclude list (`continue with`, cancel/delete/logout), visible/enabled gate, WeakMap cooldown, MutationObserver + 2s poll fallback | Very good; pure DOM, tiny | **BUILD**: port the guard stack for `Adapter.clickContinue()`/continue labels. The negative list is the valuable piece because "Continue with Google" and destructive dialogs are common false positives. |
| `timothy22000/claude-autocontinue` - https://github.com/timothy22000/claude-autocontinue | MIT | Small extension (~1 MB repo); uses extension APIs for background tabs | Two-part gate: visible Continue button AND trigger phrase in the last assistant message only; delay before click; cap auto-continues; avoids body-wide stale-history matches | Good technique; background service worker parts do not fit userscript | **BUILD partial**: for Claude continue only, require the tool-use/max-token phrase in the newest assistant cluster before clicking Continue. Skip background-tab polling and token-minimization flow. |
| `pykrete67/prompt-queue-extension` / LLM Prompt Queue - https://github.com/pykrete67/prompt-queue-extension | README says MIT; GitHub license not detected | Small (~61 KB repo); vanilla MV3 | Completion monitor: do not use disabled Send as "still generating" because empty composers disable send after completion; require `hasSeenGenerating`, `minWaitTime`, and 4 consecutive idle polls; use Stop/streaming indicators first | Good as a logic pattern | **BUILD partial**: strengthen completion tests with "disabled send after empty composer is idle" fixtures and consider `hasSeenGenerating + N idle checks` where GITL currently relies on stop/network/stable ticks. |
| `yueyueL/Auto-Prompt` - https://github.com/yueyueL/Auto-Prompt | README says MIT; GitHub license not detected | Small extension (~1.1 MB repo); no frameworks | Multi-site completion recipe: ChatGPT = send readiness + DOM stability + stop absent; Gemini/Grok/Claude = stop/spinner/typing absent; ProseMirror-safe injection | Useful corroboration, not novel | **BUILD only as tests/docs**: its best ideas overlap with GITL and LLM Prompt Queue. Use examples as fixtures for platform-specific "stop absent" cases. |
| `adamlui/chatgpt-auto-continue` - https://github.com/adamlui/chatgpt-auto-continue and `KudoAI/chatgpt.js` - https://github.com/KudoAI/chatgpt.js | No GitHub-detected license for repos; userscript comments say chatgpt.js MIT | Userscript is ~34 KB but pulls chatgpt.js and remote locale/config data; chatgpt.js repo is large (~724 MB disk usage) | Simple polling cadence: check Continue every 500ms, back off to 5s after click | Poor as dependency; cadence is the only light technique | **SKIP dependency**. If needed, copy the "longer cooldown after a Continue click" idea only. |
| `eps1lon/dom-accessibility-api` - https://github.com/eps1lon/dom-accessibility-api | MIT | npm unpacked ~276 KB, zero deps | Standards-based accessible-name computation | Too large to inline whole package | **SKIP dependency, BUILD miniature**: implement only the subset GITL needs (`aria-labelledby`, `aria-label`, native label, placeholder/title, text content). |
| `A11yance/aria-query` - https://github.com/A11yance/aria-query | Apache-2.0 | Small package (~2.3 MB repo) but role tables are overkill | HTML element to implicit ARIA role mapping | Too much table data for IIFE | **SKIP dependency, BUILD tiny map**: hard-code only roles needed by chat composers and actuators: `button`, `textbox`, `searchbox`, `form`, submit/button inputs. |
| Accessibility tree / ARIA snapshot tooling - Playwright `toMatchAriaSnapshot`, AccName spec https://w3c.github.io/accname/ | Specs/tooling vary | Test-only if Playwright; zero runtime if used in fixture tests | Assert the semantic tree rather than CSS classes; expose computed role/name in diagnostics | Good for tests/diagnostics | **BUILD test/diagnostic slices**: add diagnostic lines like `role=button name="Send message"` and e2e fixtures that fail if duplicate named buttons would break strictness. |

### Top highest-ROI technique to implement now

**Implement a tiny Playwright-inspired role/name locator layer, then keep dispatch strict.**

Concrete, testable shape:

1. Add small pure helpers near `_heurInput` / `_heurSend`:
   - `_roleOf(el)`: explicit `role` first, then small implicit map for `button`, `textarea`, `[contenteditable=true]`, `input[type=submit|button|text|search]`.
   - `_accName(el)`: resolve `aria-labelledby` ID references; then `aria-label`; then associated `<label for>`, ancestor `<label>`; then `placeholder` / `title`; then button text / SVG `<title>`. Normalize whitespace and cap length.
2. Use `_accName(el)` instead of the current ad hoc `[aria-label,title,data-testid,textContent]` join inside `_sendLooksSafe` / `_heurSend` scoring, while retaining the current `id`, `data-testid`, popup-toggle, and `SEND_VETO` surfaces.
3. Add a "strict candidate" fallback:
   - For send diagnostics/candidates: scan `button,[role="button"],input[type="submit"],input[type="button"]`; require role `button`, visible/enabled, veto-safe, positive send name or submit type; if more than one top-tier candidate with the same confidence exists, return `null` and surface a diagnostic rather than picking one.
   - For input: scan `textarea,[contenteditable="true"],[role="textbox"],input[type="text"],input[type="search"]`; require role `textbox/searchbox` and visible; boost names/placeholders containing `message|prompt|ask|chat|reply`.
4. Unit tests:
   - `aria-labelledby` gives a send name when button text is only an icon.
   - SVG `<title>Send</title>` counts as accessible name but `Copy` remains vetoed.
   - Two visible `button aria-label="Send"` candidates are strict-ambiguous and not clicked.
   - `Continue with Google` is never clicked by continue logic.
   - Empty-composer disabled Send does not imply generation.

Why this is highest ROI: GITL already has the safety architecture (reviewed selectors, `_sendLooksSafe`, at-most-once send transaction). The current weak point is name/role extraction quality. A tiny AccName/role subset improves send/input detection, diagnostics, and mobile resilience without adding a dependency or expanding autonomous actuator authority.

### Protocol / reply-stream reverse-engineering findings

| Platform / source | License | Size / cost | What it shows | Recommendation |
|---|---:|---:|---|---|
| ChatGPT SSE articles / examples: `/backend-api/(f/)conversation`, `fetch` + `ReadableStream`, `[DONE]`, JSON patch streams. Examples: https://www.cloro.us/blog/how_to_scrape_chatgpt/ , https://dev.to/wilow445/how-i-reverse-engineered-chatgpts-hidden-search-behavior-with-a-chrome-extension-4e1 | Article/source-specific | Private endpoint knowledge; high brittleness | Completion is best witnessed by stream terminal sentinel (`[DONE]`) when already observing the browser's own response clone | **SKIP direct API replay**. Consider **BUILD** only a content-free terminal witness in existing `GITL_NET`: when a cloned stream line contains `[DONE]`, mark `lastDoneT`; do not store reply text or call private endpoints. |
| Claude.ai SSE: `Adithyan-Defender/claude-ai-re-client` https://github.com/Adithyan-Defender/claude-ai-re-client | No GitHub-detected license | Tiny repo (~25 KB) but requires cookies/CDP/TLS impersonation outside browser | Web endpoint `/api/organizations/{org}/chat_conversations/{conv}/completion`; SSE events include `content_block_delta`, `message_stop` | **SKIP direct client**. It is brittle and credential-sensitive. Technique only: `message_stop` is a good terminal event if seen passively. |
| Claude SSE parser: `Yassin-Kassem/claude-stream-parser` https://github.com/Yassin-Kassem/claude-stream-parser | MIT | Tiny (~45 KB), zero-dep library | Simple SSE block parser and event switch (`message_start`, `content_block_delta`, `message_stop`, `ping`, `error`) | **SKIP dependency, BUILD tiny parser only if needed**. A 20-line SSE line splitter is enough for passive terminal witnesses. |
| Claude token tracker: `Krabby24/claude-token-tracker` https://github.com/Krabby24/claude-token-tracker | MIT | Small extension (~100 KB) | Inject in page MAIN world, override `window.fetch`, tee `ReadableStream`, parse SSE while leaving original response intact | **BUILD technique already mostly present**. GITL already clones/reads fetch streams; if adding terminal parsing, keep it timestamp/terminal-only and privacy-preserving. |
| Perplexity reverse-engineered API: `SreejanPersonal/Perplexity-Reverse-Engineered-API` https://github.com/SreejanPersonal/Perplexity-Reverse-Engineered-API | Other / custom | Very small (~13 KB) but websocket protocol replay | Socket.IO / Engine.IO v4: polling handshake at `/socket.io/?EIO=4&transport=polling`, websocket upgrade, meaningful answer frames vs heartbeat frames | **SKIP replay**. GITL already has heartbeat filtering in `_wsFrameIsMeaningful`; keep improving frame filtering, not protocol emulation. |
| Gemini internals: `EricAndrechek/gemini-usage` https://github.com/EricAndrechek/gemini-usage and `hututu001/gemini-web2api` https://github.com/hututu001/gemini-web2api | MIT | Small repos (~73 KB / ~142 KB) | Gemini uses Google `batchexecute`; response has anti-XSSI prefix and length-prefixed frames; requires `at`, `bl`, `f.sid`, RPC IDs | **SKIP direct batchexecute**. Good validation that GITL's `batchexecute` XHR pulse endpoint is correct. Optional terminal parsing is likely more work than ROI because frames are not stable chat text. |

### SKIP list with rationale

- **Do not import Playwright, dom-accessibility-api, aria-query, chatgpt.js, or any browser extension code into the userscript.** All are too large or unnecessary for the IIFE constraint; the useful pieces are small algorithms.
- **Do not replay private ChatGPT/Claude/Perplexity/Gemini web APIs.** This introduces auth/session handling, Cloudflare/TLS/proof-token brittleness, privacy risk, and Terms-of-Service surface. GITL's safer model is passive observation of the user's own page.
- **Do not parse/store full streamed reply payloads for normal loop operation.** Existing DOM reading plus terminal sigils should remain source of truth. If stream parsing is added, parse only terminal markers (`[DONE]`, `message_stop`) and timestamps/byte counts.
- **Do not rely on disabled Send as a generation signal.** Multiple projects explicitly warn it is disabled when the input is empty after a completed reply. Prefer visible Stop / streaming indicator / observed network / stable assistant-tail checks.
- **Do not broaden autonomous send authority from heuristics.** Keep current invariant: heuristic send candidates are diagnostics unless the platform is reviewed or the user taught the control.

### Links / repos found

- Playwright locators: https://playwright.dev/docs/locators
- Playwright device emulation: https://playwright.dev/docs/emulation
- Playwright repo/license: https://github.com/microsoft/playwright
- AccName spec: https://w3c.github.io/accname/
- dom-accessibility-api: https://github.com/eps1lon/dom-accessibility-api
- aria-query: https://github.com/A11yance/aria-query
- ChatGPT Auto-Continue: https://github.com/adamlui/chatgpt-auto-continue
- chatgpt.js: https://github.com/KudoAI/chatgpt.js
- Claude Auto Continue (allowlist/exclude): https://github.com/lijiarui/claude-auto-continue
- Claude Auto-Continue (last assistant gate): https://github.com/timothy22000/claude-autocontinue
- Auto-Prompt: https://github.com/yueyueL/Auto-Prompt
- LLM Prompt Queue: https://github.com/pykrete67/prompt-queue-extension
- PrompQueue: https://github.com/megamen32/promqueue
- ChatGPT SSE / JSON patch article: https://dev.to/wilow445/how-i-reverse-engineered-chatgpts-hidden-search-behavior-with-a-chrome-extension-4e1
- ChatGPT SSE scraping article: https://www.cloro.us/blog/how_to_scrape_chatgpt/
- Perplexity reverse-engineered API: https://github.com/SreejanPersonal/Perplexity-Reverse-Engineered-API
- Gemini internals: https://github.com/EricAndrechek/gemini-usage/blob/main/_docs/GEMINI_API_INTERNALS.md
- Gemini web2api: https://github.com/hututu001/gemini-web2api
- Claude.ai reverse-engineered client: https://github.com/Adithyan-Defender/claude-ai-re-client
- Claude SSE parser: https://github.com/Yassin-Kassem/claude-stream-parser
- Claude token tracker: https://github.com/Krabby24/claude-token-tracker
