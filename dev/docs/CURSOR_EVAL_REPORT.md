# Ghost in the Loop — Cursor Evaluation Report

**Recommendation ID:** `REC-GITL-EVAL-e483`  
**Integrated branch:** `cursor/cursor-eval-upgrade-e483`  
**Personal Forge branch:** `personal-forge/REC-GITL-EVAL-e483`  
**Version:** 8.6.1 → **8.7.0**  
**Date:** 2026-08-01

---

## 1. Executive summary

### Fixed

- **Mobile-web Send last mile (Track A):** Pre-dispatch evidence gate requires the
  live composer to hold the exact normalized prompt and re-validates the chosen
  actuator before `_beginSendAttempt()`. ChatGPT/Perplexity buttonless paths use
  reviewed Enter when no unique Send button resolves.
- **Send tier ladder (Track F):** Evidence-gated pre-journal selection:
  reviewed button → reviewed Enter → reviewed unique form (`requestSubmit`, Claude
  opt-in) → taught control. 64 truth-table cases prove at-most-once dispatch.
- **Runtime safeguards (Track D):** Ambiguity guards, exact staging
  verification, command-bound route identity, global kill-switch, per-site
  enable (generic/custom default off), dry-run preview, hidden-document block.
- **Gap audit cheap fixes (Track B):** Continue safety, visibility/dedup
  hardening, extension storage peer sync, version metadata parity, CI
  `working-directory: dev`.
- **Mobile CI (Track G):** `mobile-firefox` Playwright project, buttonless
  fixture, observer perf bounds, touch orb paths.
- **Network read prototype (Track C):** Off-by-default ChatGPT SSE parser via
  `GITL_NET` — read-only, never actuation.
- **Prior art (Track E):** Build-or-skip shortlist; highest ROI item (mobile
  device descriptors in CI) implemented under Track G.

### Proposed but deferred

- P0 crash-journal persistence (B-02), root-tree promotion parity (B-01)
- Manus role classifier fix (B-03), extension main-world network bridge (B-04)
- Hard rate/run caps, semantic conversation ID, default-off migration for
  reviewed sites
- Live authenticated mobile-web certification (real Android / GeckoView)

### Human calls needed

1. Promote 8.7.0 to `main` after real-device mobile Send validation.
2. Prioritize P0 gap register items before unattended operation on Manus or
   packaged extension network evidence.
3. Whether to enable ChatGPT SSE read probe in production (currently flagged
   off).

All §1 safety invariants remain intact. Every behavior change ships with tests.

---

## 2. Per-track findings

### Track A — Send/detection last mile

**Found:** Mobile buttonless composers need exact staging proof and a single
pre-selected Enter path; disabled reviewed buttons become enabled after
synthetic input events in fixtures.

**Changed:** `_preDispatchEvidence`, `_composerHoldsPrompt`, mobile e2e
fixtures for ChatGPT/Perplexity shapes.

**Deferred:** Real-device Android verification. See `CURSOR_EVAL_TRACK_A.md`.

### Track B — Gap audit

**Found:** 25 prioritized gaps; largest risks outside the in-process Send
boundary (CI root drift, crash journal, Manus role misclassification, extension
network isolation, sigil false positives).

**Changed:** B-12 Continue safety, B-22 visibility/dedup, B-16 extension
storage sync, B-23 hidden document, B-24 version metadata, B-01 CI path fix.

**Deferred:** P0 items B-01 long-term, B-02–B-04 and most P1 register rows.
See `CURSOR_EVAL_TRACK_B.md`.

### Track C — Reading chats

**Found:** SSE framing is the best first network-read target; Socket.IO and
batchexecute are higher fragility.

**Changed:** `_createChatGPTSSEReadProbe()` behind boolean flag, read-only.

**Deferred:** Claude, Perplexity, Gemini parsers; aria-live formalization. See
`CURSOR_EVAL_TRACK_C.md`.

### Track D — Safeguards

**Found:** Composer ambiguity, Send dedup gaps, injection≠staging, route proxy
weakness, no kill-switch/dry-run.

**Changed:** Full pre-dispatch safety envelope documented in threat model.

**Deferred:** Hard quotas, semantic conversation ID. See `CURSOR_EVAL_TRACK_D.md`.

### Track E — Prior art

**Found:** Playwright role/aria locators inform detection only; device
descriptors fit CI; OSS userscripts confirm Enter/buttonless patterns.

**Changed:** Mobile CI device descriptor (Track G). No new runtime deps.

See `CURSOR_EVAL_TRACK_E.md`.

### Track F — Send tier ladder

**Found:** Teach previously won over adapter selectors; form tier needed
explicit opt-in and wrapper proofs.

**Changed:** `_selectSendMechanism`, 16×4 truth table in `sendlayered.test.js`.

See `CURSOR_EVAL_TRACK_F.md`.

### Track G — Mobile CI + performance

**Found:** No reproducible mobile failure class; observer churn on unrelated
mutations; CI tested stale root tree.

**Changed:** `mobile-firefox` project, `mobile-buttonless.spec.js`,
`observer-performance.spec.js`, CI `dev/` working directory.

See `CURSOR_EVAL_TRACK_G.md`.

---

## 3. Gap register (summary)

Full table: `CURSOR_EVAL_TRACK_B.md` (25 items, B-01–B-25).

| Priority | Count | Top items |
|---|---:|---|
| P0 | 4 | B-01 root CI drift, B-02 crash journal, B-03 Manus roles, B-04 extension net |
| P1 | 14 | B-05 sigil tail, B-06 send evidence, B-07 composer ambiguity, … |
| P2 | 6 | B-17 diagnostics truth, B-20 state-machine tests, … |
| P3 | 1 | B-25 dev dependency audit |

---

## 4. Reading-the-chat comparison

| Option | Robustness | Effort | Decision |
|---|---|---|---|
| ChatGPT SSE | High framing / medium schema | Medium | **Prototype (flag off)** |
| Claude SSE | Medium | Medium | Defer |
| Perplexity Socket.IO | Low–medium | High | Defer |
| Gemini batchexecute | Low–medium | High | Defer |
| aria-live | Medium cross-site | Low–medium | Defer |
| Stop→Send transition | Medium hint only | Low | Defer (existing partial use) |

**Try the prototype:** set the ChatGPT SSE read feature flag to boolean `true`
in runtime config (see Track C doc). Read-only metadata only.

---

## 5. Send tier truth table

See Track F for the full 16-row B/E/F/T availability table.

**Invariant:** Without exact prompt evidence → 0 dispatches. With evidence →
exactly 1 dispatch from the highest available tier. After
`_beginSendAttempt()` → one `strategy.run()`; throws → uncertain, never
escalation.

Guarded by `sendlayered.test.js` (64 cases) and `sendtransaction.test.js`.

---

## 6. Risk / threat model

See `CURSOR_EVAL_TRACK_D.md` for the full table. Summary:

- **Fail-closed by design:** staging mismatch, Send ambiguity, route change
  during bound conversation, lost tab lease, hidden document → loud pause, no
  actuation.
- **Residual:** platform may process one browser event twice internally;
  closed shadow roots not enumerable; taught selector semantic wrongness
  survives veto if metadata looks safe.

---

## 7. Open questions (need real device / product decision)

1. Does authenticated ChatGPT mobile web preserve exact staged text after
   programmatic injection?
2. Do account settings accept synthetic Enter on mobile (Enter-to-send off)?
3. Firefox Android GeckoView confirmation timing vs desktop Gecko CI?
4. Enable hard dispatch quotas? What thresholds?
5. Default-off migration for reviewed built-in sites on fresh install?
6. Promote ChatGPT SSE read probe after live schema validation?

---

## 8. Verification block

**Branch:** `cursor/cursor-eval-upgrade-e483` / `personal-forge/REC-GITL-EVAL-e483`  
**Date:** 2026-08-01

```
$ cd dev && npx jest
Test Suites: 40 passed, 40 total
Tests:       534 passed, 534 total

$ cd dev && npx playwright test
6 skipped
144 passed (chromium + firefox + mobile-firefox)

$ cd dev && node scripts/build-extension.js --check
Generated extension artifact is current.
```

Userscript and extension syntax checks: passed (via Jest canary suite).

---

## Import into Personal Forge

Copy or reference this recommendation from:

`dev/personal-forge/recommendations/REC-GITL-EVAL-e483/MANIFEST.md`

Fetch branch `personal-forge/REC-GITL-EVAL-e483` for the complete tree.
