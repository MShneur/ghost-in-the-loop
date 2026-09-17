# Ghost in the Loop v9 — Batch 3 Top Navigation Return

Date: 2026-09-17 ET
Role: master architect integration return
Implementation branch: `feature/v9-top-navigation`
Baseline: `feature/v9-stall-watchdog` @ `18db57bf81b0b0a4fc5fd3f862b367d6f92b5dc7`

## Requested delta

Add compact `↑ Top` beside `↻ Page` so a user can reach the earliest available prompt in long ChatGPT/Perplexity conversations, including lazy-loaded history, without touching Play transport or conversation state.

## Implementation

Product commit: `6d8d205c3292016ba7bbf6bf4ca68443c267fac6`
Test commit: `5ddaf13dc3c8ecfcb2a9468b65ff4ac37bc0773c`

The branch was first fast-forwarded from the stale placeholder baseline to the completed watchdog candidate, so it contains Batch 1 terminal normalization + Batch 2 watchdog before the Top delta.

### Navigation behavior

- compact `↑ Top` rendered immediately beside `↻ Page`;
- disabled while Play is `RUNNING`, sending, watchdog recovery is active, or a Top operation is already running;
- conversation scroll container is detected from actual user/assistant nodes and scrollable ancestors first;
- ChatGPT + Perplexity fall through to main/role-main candidates, then `document.scrollingElement` / document root;
- bounded loop: max 24 passes, 500 ms between passes;
- progress signature includes conversation-node count, scroll extent, and first-turn fingerprint so prepended/lazy-loaded history resets stability;
- stops only after repeated stable observations at top or the hard pass bound;
- plain status: `Going to first prompt…`, `Loading older chat…`, `At top`;
- pointerdown default is prevented on the Top button to avoid stealing composer focus on touch/pointer activation.

## Preservation audit

Preserved:

- Play remains the only Send authority;
- no composer mutation in Top;
- no Send lookup/click in Top;
- no Enter/requestSubmit/dispatch escalation;
- no loop-state mutation in Top;
- no URL/hash/history mutation;
- no Ghost panel position mutation;
- watchdog and Export implementation left unchanged except report gains a Top capability flag;
- Reload remains real page reload.

## Evidence

- GitHub diff review: PASS. Relative to watchdog baseline, only `ghost-in-the-loop.user.js` and `tests/v9-top-navigation.test.js` changed.
- Source contract test added for adjacency, RUNNING disable, scroll-container detection, bounded lazy-load loop, prepended-history signature, no Send/composer/URL/state/panel mutations, and focus protection.
- Local standalone algorithm harness: PASS for already-at-top, lazy-prepend-then-stable, and continuously-changing-history bounded at 24 passes.
- Exact repository Jest/browser suite: NOT RUN in this chat because the container has no GitHub network/checkout and GitHub-hosted Actions are intentionally not dispatched.
- Real authenticated Firefox Android: NOT TESTED. E4 still required before release claim.

## Claim ceiling

E0 source review + isolated algorithm harness only for this batch. No E3/E4 claim.

## Remaining risk

Real ChatGPT and Perplexity may use host-specific scroll-container/lazy-load behavior that differs from the generic ancestry detector. The owner field canary remains authoritative for final acceptance.

## Disposition

`CANARY/HOLD` — implementation is isolated and architecture-safe, but exact-host field proof remains pending.

## Next move

Batch 4: API-first Export restoration and novice-facing export language, still isolated from Play/Send authority.
