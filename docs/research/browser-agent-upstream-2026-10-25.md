# Browser lifecycle and AI page-reader radar — 2026-10-25

## Incident from user-supplied saved page
- Saved chatgpt.com Codex/browser layout at 2026-10-25 22:29 EDT has residual `#gitl9` CSS but no element with `id=gitl9` in the serialized DOM. SingleFile snapshots cannot prove the exact event that removed it.
- Main 9.0.1-alpha.11 mounts the panel under `document.body` only once and sets `window.__GITL_V9__` after render. No existing UI reattachment follows host SPA root/body replacement. The observed flash/disappearance is consistent with that defect, though E4 is still needed.
- Repair in 9.0.1-alpha.12: reattach the SAME panel to the current body after DOM replacement, retain UI state/event handlers; restore CSS if removed, with a bounded observer, focus/navigation hooks and low-rate fallback. The one-Send path is unchanged. No new provider permissions or network endpoints.

## Upstream sources and dispositions
Use as Scout/Origin leads only; do NOT import libraries into the userscript, add LLM inference, connect authenticated sessions to third-party services, or bypass host restrictions.
- NOW (test-tool research): ChromeDevTools/chrome-devtools-mcp, Oct 22 2026 v1.12.0, navigation-history settings and config reload, https://github.com/ChromeDevTools/chrome-devtools-mcp/releases . Compare lifecycle/DOM detection and diagnostics in controlled test browser.
- NEXT (optional dedicated browser lane): browser-use/browser-use, Oct 15 2026 v0.13.13, OpenAI browser tools and navigation race fixes, https://github.com/browser-use/browser-use/releases . Requires independent auth/permission and source review.
- NEXT (selector resilience evaluation): browserbase/stagehand v4, browser-resident act/observe and iframe/shadow DOM, https://www.browserbase.com/stagehand . Breaking changes and inference/Browserbase cost boundaries require review, not direct GITL dependency.
- NEXT (authenticated browser bridge): browser-use/browser-harness, persistent Chrome via CDP, https://github.com/browser-use/browser-harness . Security review before use with logged-in pages; separate from Ghost's at-most-once Send.
- WATCH (page reading/crawl): unclecode/crawl4ai (upstream active Oct 20), https://github.com/unclecode/crawl4ai . Oracle may already have a local installation but presence/version/usable permission are not attested by this scan.

## Existing scout protocol
- Reuse Personal Forge's existing source registry, fingerprints, dedup rules, and read-only Wheel Check/Origin compare-transfer flow; do not create a second scheduler or scrape logins.
- For each upstream, record latest release SHA/date, license, API/DOM mechanism delta, reproducible fixture, cost, runtime isolation, and security constraints. Verdict: CORROBORATE, IMPROVE, EXTEND, or REJECT.
- Only promote a donor when it improves a defined Ghost acceptance path over the native `MutationObserver` remedy; require E3 browser and E4 Firefox Android authenticated validation before claiming field success.
- Keep private page captures local; do not publish prompts/chat text, cookies, tokens, private URLs or saved-page contents.
