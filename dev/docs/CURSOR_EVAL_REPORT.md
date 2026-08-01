# Ghost in the Loop — Cursor Eval Report (v8.7.0)

**Branch:** `cursor/eval-upgrade-7f27` (off `claude/skin-system-redesign-dh04go`)  
**Status:** Ready for review on Personal Forge — **not promoted to main**  
**Version:** 8.7.0

---

## 1. Executive summary

This evaluation integrated the HANDOFF_CURSOR_EVAL multi-track brief into a single
test-backed branch. The focus was **internal verification first** — reproducing the
mobile Send failure class in CI, hardening the send path with evidence gates, and
documenting gaps rather than blind selector patches.

### Fixed / shipped on this branch
- Pre-dispatch **prompt staging verification** — Send only proceeds when the composer
  actually holds the injected text.
- **Send tier ladder** extracted to `_selectDispatchStrategy` (button → Enter → form submit).
- **Safeguards:** ambiguity guard, kill-switch, per-site disable, dry-run mode.
- **Network-read prototype** for ChatGPT SSE (flagged off: `gitlNetRead`).
- **Mobile CI** project (`mobile-chrome` / Pixel 5 + touch) with passing repro tests.

### Proposed but deferred (needs human call or real device)
- Live-site selector canary / drift detection.
- Full Perplexity socket.io text parsing.
- Android Firefox certification (CI emulates mobile; not GeckoView).
- UI toggles for dry-run / kill-switch (GM keys work today; panel UI not added).

### Invariants
All §1 handoff invariants preserved. Each has an existing or new test guarding it.

---

## 2. Per-track findings

### Track A — Send/detection last mile

| Platform | Send resolution | Confirmation |
|----------|-----------------|--------------|
| ChatGPT desktop | Unique reviewed `button[data-testid="send-button"]` etc. | Composer cleared + stop/network |
| ChatGPT mobile web | No unique button → `reviewed-enter` (8.6.1 + 8.7.0 staging gate) | Composer cleared; uncertain if Enter disabled in settings |
| Perplexity | Button or `reviewed-enter` | Same evidence model |
| Others (reviewed) | Reviewed button first; form tier if no button/enter | At-most-once journal |

**Changes:** `_composerHoldsPrompt`, `_nudgeComposerActivation`, staging pause codes
`COMPOSER-002` / `COMPOSER-003`.

**Tests:** `safeguards870.test.js`, `mobile-send.spec.js`

### Track B — Gap register (prioritized)

| ID | Gap | Sev × Lik | Blast | Repro / pointer |
|----|-----|-----------|-------|-----------------|
| G1 | No live DOM canary when platforms ship new composer | H × H | All sends | Manual — no automated drift alert |
| G2 | `execCommand` insert may not enable Send on some builds | M × H | Mobile CGPT | Field SEND-001; mitigated by Enter + staging gate |
| G3 | Network completion is pulse-only for most platforms | M × M | Stuck "generating" | DEVLOG 8.5.2; `gitlNetRead` prototype only |
| G4 | CI ≠ real Android GeckoView | M × M | Mobile-only bugs | Playwright mobile-chrome approximates, not certifies |
| G5 | `form.requestSubmit` tier rarely reached | L × L | Edge desktop forms | Only when button+enter both null |
| G6 | No panel UI for safeguards flags | L × L | Operator UX | Set `dryRun`/`gitlKillSwitch` via GM console |
| G7 | Selector memory never learns send (by design) | — | Teach Mode required on drift | `selmem.test.js` |

**Cheap fix shipped:** G2 mitigation (staging gate + nudge). Rest filed above.

### Track C — New ways of reading chats

| Approach | Robustness | Effort | Status |
|----------|------------|--------|--------|
| Network SSE parse (ChatGPT) | High when API stable | High | **Prototype** — `gitlNetRead` flag |
| `aria-live` regions | Medium cross-platform | Medium | Not implemented — recommend next |
| Stop→Send transition | Medium | Low | Already partial via `stopVisible` |
| Debounced text stable | Medium | Low | `_observeReplyText` exists (8.5.2) |

**Flag:** `GM_setValue('gitlNetRead', true)` then reload. Read-only; never actuates.

### Track D — Safeguards + threat model

**Shipped:**
- `gitlKillSwitch` — global off
- `gitlSiteDisabled` — `{"chatgpt.com": true}` per host
- `_composerAmbiguous` / `_sendSelectionAmbiguous`
- `dryRun` — logs path, no journal

**Threat model (abbreviated):**

| Threat | Mitigation |
|--------|------------|
| Wrong button clicked (Copy/Share) | `_sendLooksSafe` + reviewed-only actuators |
| Double-send | At-most-once journal; truth-table tests |
| Background tab token burn | `assertInteractionSafe` focus + tab lock |
| Prompt not actually staged | `_composerHoldsPrompt` (8.7.0) |
| Ambiguous DOM | Pause loud (`SEND-003`/`COMPOSER-003`) |
| Runaway loop | `maxRounds` (existing); kill-switch (new) |
| Network spoofing generation | DOM completion gate independent of pulses (8.5.2) |

### Track E — External prior art

| Project | Technique | License | Build or skip |
|---------|-----------|---------|---------------|
| [adamlui/chatgpt-auto-continue](https://github.com/adamlui/chatgpt-auto-continue) | chatgpt.js lib + Continue button observer | MIT | **Skip dep** — adopt observer pattern only; GITL already has `clickContinue` |
| [victornpb gist](https://gist.github.com/victornpb/e28bff8ebabf4da2f6d356e2f53a58a8) | MutationObserver + button text match | — | **Skip** — no veto safety |
| [boringresearch/plugin-chatgpt-automation](https://github.com/boringresearch/plugin-chatgpt-automation) | Queue + stop-button absence | — | **Skip** — naive send, no fail-closed |
| Playwright `devices['Pixel 5']` | Mobile CI emulation | Apache-2.0 | **Built** — `mobile-chrome` project |
| Playwright role/aria locators | Detection philosophy | — | **Adopted** — already in `_heurInput`/`_heurSend` |

### Track F — Send tier truth table

| Tier | Path | When selected | Can fire twice? |
|------|------|---------------|---------------|
| 1 | `reviewed-button` | `_reviewedSend()` unique match | No — single `strategy.run()` |
| 2 | `reviewed-enter` | No button; adapter `dispatchFallback:'enter'` | No |
| 3 | `reviewed-form` | No button/enter; unique form+submit | No |
| 4 | (taught) | Inside `_reviewedSend` via TeachStore | No |

Post-journal: observe only → confirm | uncertain. **No escalation.**

**Tests:** `sendtiers.test.js`, `sendtransaction.test.js`, `sendlayered.test.js`

### Track G — Optimizations + mobile CI

- Added `mobile-chrome` Playwright project (Pixel 5, touch).
- `mobile-send.spec.js` — 2 tests, green.
- Throttled mutation invalidation for composer selector cache (`_ensureComposerCacheInvalidation`).
- No per-scroll listeners added (rail unchanged).

---

## 3. Open questions (need real device / product decision)

1. **ChatGPT "Enter sends" disabled** — Enter fallback becomes uncertain; is Teach Send acceptable UX default?
2. **Personal Forge remote** — push target repo name/access (see below).
3. **`gitlNetRead` default-on?** — recommend off until ChatGPT SSE format stable across accounts.
4. **Panel UI for safeguards** — worth a settings row for dry-run/kill-switch?
5. **Real Android Firefox retest** — CI passes mobile-chrome; field SEND-001 may still differ on GeckoView.

---

## 4. Verification block

```
=== JEST ===
Test Suites: 39 passed, 39 total
Tests:       442 passed, 442 total

=== PLAYWRIGHT ===
76 passed (43.4s)
  - chromium: 37 passed
  - firefox: 37 passed
  - mobile-chrome: 2 passed (mobile-send.spec.js)

=== EXTENSION CHECK ===
Generated extension artifact is current.
```

Commands (from `dev/`):
```bash
npx jest
npx playwright test
node scripts/build-extension.js --check
```

---

## 5. Try the branch

```bash
# Install from branch raw URL (after push):
# https://raw.githubusercontent.com/<org>/personal-forge/cursor/eval-upgrade-7f27/dev/ghost-in-the-loop.user.js

# Optional flags (Tampermonkey console / GM storage):
GM_setValue('dryRun', true)          # simulate sends
GM_setValue('gitlKillSwitch', true)  # global off
GM_setValue('gitlNetRead', true)     # network read prototype
GM_setValue('gitlSiteDisabled', JSON.stringify({'example.com': true}))
```
