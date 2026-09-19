# Ghost in the Loop v9 — Final Autonomous Assembly Receipt

Date: 2026-09-19
Branch: `feature/v9-integration-candidate`
Current head after identity rebind: `099bea04ffd96811d0802ca09f75e7bc77ac6dbc`
Candidate version: `9.0.0-alpha.2`

## Agents of AI
Alt-ssembly Required + Origin + Repo Nanny + Cleanerz + Root Cause + Stresstest + Quorum/Human Gate where consequential.

Named practitioner methods used across gates are recorded in the Batch 5 gate documents. No practitioner participated or endorsed Ghost.

## Roadmap disposition

1. Terminal suffix normalization — complete
2. Stall watchdog — complete
3. Top navigation — complete
4. API-first Export — complete
5. Product shell restoration — complete
6. Package/version identity — complete
7. Activator authority reconciliation — complete
8. Final integration — autonomous portion complete; E4 field canary pending

## Preserved hard architecture

Everything may influence the prompt. Only Play may influence Send.

`setComposerText -> reacquire one valid Send -> click once -> confirm once`

No Enter fallback.
No requestSubmit escalation.
No automatic resend.
No controller-side semantic workflow reasoning.

## Final autonomous findings and corrections

- Mobile touch controls were too small; transport is now two-column on mobile with 40px controls and 38px tabs.
- Generic textarea staging exposed a real verification bug: `innerText` masked textarea `.value`. `nodeText()` now reads textarea/input value first.
- Default Jest authority was stale v8 architecture. v9 certification now uses `jest.v9.config.js`; old suite remains preserved as `test:legacy`.
- v9 update/download metadata was missing and is restored to stable `main`.
- WebExtension identity uses numeric `9.0.0` plus display `9.0.0-alpha.2`.
- PLEX / Model Relay remain pinned to `feature/plex-universal-model-relay` because those canonical files are not on AoA `main`; Human Gate, Quorum and Cleanerz use `main`.

## Verification evidence

### Source / integration
- exact v9 userscript JavaScript parse: PASS
- generated Firefox extension parse: PASS
- deterministic extension wrapper parity: PASS
- userscript/npm/package-lock identity: `9.0.0-alpha.2`
- extension numeric/display identity: `9.0.0` / `9.0.0-alpha.2`
- stable update/download URLs point to `main`
- exactly one `button.click()` Send actuation in userscript
- no `requestSubmit`
- no Enter-key Send route
- v9 payload hashes bound in `.gitl/evidence/v9/candidate-identity.json`

### Browser E3, no external Send
Exact candidate booted on current public ChatGPT and Perplexity pages:
- panel mounts
- Play / Prompt / AoA / Export / Settings present
- Top present
- no boot exception
- no Ghost control clicked

Mobile viewport 412x915:
- ChatGPT panel ratio ~0.62
- Perplexity panel ratio ~0.58
- Play/Stop/Page/Top controls 40px high
- tabs 38px high

### Synthetic E3 Send path
Isolated browser fixture:
- starting assistant terminal: PROCEED
- Ghost staged continuation
- Send actuation count: exactly 1
- user-turn count increased by exactly 1
- composer cleared
- synthetic assistant HALT observed
- Ghost final state: COMPLETE
- round: 1/25

## Evidence ceiling

E3 browser/integration for autonomous paths.
Authenticated Firefox Android/Tampermonkey remains E4 NOT TESTED.

## Required E4 field canary

On exact candidate `feature/v9-integration-candidate`:

ChatGPT:
- >=5 consecutive PROCEED cycles
- HUMAN
- HALT
- no duplicate Sends
- uncertainty fails closed
- watchdog interruption/recovery
- Top on a long/lazy-loaded conversation
- reload
- Export truthfulness
- mobile usability

Perplexity:
same set, including real `/rest/thread/{slug}` Export response shape.

## Disposition

**CANARY / HOLD PUBLICATION**

Autonomous roadmap is complete.
Do not merge/tag/release/publish until E4 field proof passes.

## Next move

Install/test the exact v9 candidate on the owner's Firefox Android authenticated ChatGPT + Perplexity session and return the field report.
