# Ghost in the Loop v9 — Batch 4 Export Return

Date: 2026-09-19
Branch: `feature/v9-export-restoration`
Base: `feature/v9-top-navigation`

## Scope
API-first Export restoration only. Play, watchdog, Top, package identity, and product shell were frozen.

## Implemented
- ChatGPT archive parsing follows `current_node` parent pointers when available, preserving the active branch/regeneration path.
- Perplexity archive parsing supports current/future-tolerant `entries` / `thread.entries` / `messages` shapes and exposed `steps` / `reasoning_steps`.
- Platform-exposed reasoning/steps may be exported under the explicit label **Platform-visible reasoning**. Ghost does not claim hidden chain-of-thought access.
- DOM remains a fallback and is plainly labeled **visible page fallback** / **may be incomplete**.
- Markdown and cleaned JSON remain default outputs.
- Raw platform JSON is optional and OFF by default; user must explicitly enable it.
- Novice status says either **full platform history** or **may be incomplete**.
- No host controls are expanded/clicked to reveal reasoning.
- Export does not call Play transport, composer staging, Send, requestSubmit, or Enter.

## Evidence
- Exact userscript fetched from GitHub branch through Azure browser runtime: HTTP 200.
- Exact artifact JavaScript parse: PASS.
- Branch diff vs Top: only `ghost-in-the-loop.user.js` plus `tests/v9-export-restoration.test.js`.
- Focused source contracts added for ChatGPT active-chain parsing, Perplexity entries/steps, truthful fallback labeling, reasoning labeling, raw opt-in, and Send isolation.

## Remaining E4
Authenticated Firefox Android:
1. ChatGPT real conversation export: compare visible thread with Markdown + JSON.
2. ChatGPT branch/regeneration conversation if available.
3. Perplexity real thread: verify current `/rest/thread/{slug}` response shape and entries/steps mapping.
4. Confirm platform-visible reasoning appears only when the platform exposes it.
5. Confirm fallback wording when archive API is unavailable.
6. Confirm raw JSON stays absent by default and appears only after opt-in.

## Claim ceiling
E2/source+runtime parse only. Not field-certified.

## Next
Batch 5: restore rich product shell in isolated UI/prompt batches without changing Play Send authority.
