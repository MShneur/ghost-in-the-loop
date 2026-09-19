# Ghost in the Loop v9 — Batch 5C Return

Date: 2026-09-19
Branch: `feature/v9-product-shell-5c`
Base: `feature/v9-product-shell-5b`

## Implemented
- Observational round progress bar from `round/max`.
- Optional exact display marker: `[[GITL::STAGE:X/Y]]`.
- Stage markers are mechanically parsed, bounded, and never influence Send, continuation, workflow advancement, or terminal authority.
- Missing/malformed stage markers are ignored; Ghost shows workflow plan count instead of guessing.
- Sound cues and GM notifications restored as separate opt-in preferences.
- v9 defaults both feedback channels OFF; legacy preference values may migrate.
- Test Sound / Test Notification controls added.
- Diagnostic report now includes progress and feedback preference state.

## Architecture preserved
Everything may influence the prompt. Only Play may influence Send.
Final Ghost/AoA terminal markers remain the only control authority.
No Enter, requestSubmit, resend, host navigation, or semantic workflow controller added.

## Stresstest
- Dedicated source-contract test added: `tests/v9-product-shell-5c.test.js`.
- Branch diff vs 5B is limited to AoA gate doc, userscript, and 5C test.
- Container execution of the exact GitHub artifact is currently blocked because this runtime cannot resolve raw.githubusercontent.com. Therefore executable syntax/test PASS is NOT claimed in this return.
- Required next verification: run exact branch artifact in a runtime with GitHub access, then E4 Firefox Android canary later.

## Progress
Major roadmap: 4/8 complete.
Batch 5: 5A + 5B + 5C implemented. Batch 5 integration verification is next before marking the major batch complete.
