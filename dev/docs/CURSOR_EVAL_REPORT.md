# Ghost in the Loop — Cursor Evaluation Report (v8.7.0)

**Recommendation ID:** `REC-GITL-8.7.0-5348`  
**Branch:** `cursor/ghost-loop-eval-5348` (base: `claude/skin-system-redesign-dh04go`)  
**Integrated version:** `8.7.0`  
**Date:** 2026-08-01  
**Status:** Recommendation only — **not for promotion to `main`**

---

## 1. Executive summary

A whole-system evaluation (tracks A–G per `dev/docs/HANDOFF_CURSOR_EVAL.md`) hardened the send/detection last mile, raised the safeguard floor, and closed the mobile SEND-001 reproduction gap in CI. All nine non-negotiable invariants (§1 of the handoff) remain intact and are guarded by tests.

**Fixed / shipped**

| Area | Outcome |
|------|---------|
| Pre-dispatch evidence gate | Composer must hold staged prompt before any send mechanism is chosen (`COMPOSER-002`) |
| Send tier ladder | Documented pre-journal selection: taught → button → Enter → form (form tier inert) |
| Safeguards | Ambiguity guards, kill switch, per-site disable, dry-run |
| Net-read prototype | ChatGPT SSE parser via `GITL_NET`, off by default, read-only by contract |
| Mobile CI | `mobile-chromium` + `mobile-firefox` projects; four SEND-001-class repros |
| Gap fixes | ChatGPT trusted endpoints updated; JSON-patch SSE op accumulation |

**Proposed / deferred (needs human call)**

- Enable **form tier** on a live site only after per-platform verification (double-send history).
- Turn **net-read** on for field trials; decide whether it ever informs detection (not actuation).
- Real Android device pass — CI emulates mobile DOM/touch, not GeckoView quirks.
- Promote v8.7.0 to `main` after human review of this recommendation.

**Verification (final integrated branch)**

```
Test Suites: 41 passed, 41 total
Tests:       490 passed, 490 total
Playwright:  82 passed (chromium, firefox, mobile-chromium, mobile-firefox)
Extension:   Generated extension artifact is current.
```

Baseline at start: 36 jest suites / 428 tests, 74 playwright, parity current.

---

## 2. Per-track findings

### Track A — Pre-dispatch evidence gate

**Found:** `injectText` could report success while a strict editor dropped text; worse, a composer holding pre-existing user text could be sent as-is because the journal opened without verifying staged content.

**Changed:** `engineSend` now calls `_promptStagedInComposer()` (head+tail signature via `_normStagedText`) before `_selectSendStrategy` or `_beginSendAttempt`. Failure → `COMPOSER-002`, loud pause, no transaction.

**Tests:** `tests/evidencegate.test.js` (source-contract on gate block).

**Deferred:** Per-platform staging tables in docs — behavior is uniform; platform-specific edge cases (e.g. Gemini contenteditable) need field notes if failures appear.

### Track B — Gap register

| Priority | Gap | Repro / signal | Fix status |
|----------|-----|----------------|------------|
| P0 | ChatGPT stream endpoint moved; trusted pulses never fired | Live ChatGPT: heuristic-only completion | **Fixed** — `/backend-api/f/conversation`, `/api/v0/chat/completion` added to `GITL_NET.AI_ENDPOINTS` |
| P0 | `_composerText` trusted `.value` on CE divs | Broken-composer e2e caught fake staging | **Fixed** — `.value` only on INPUT/TEXTAREA |
| P1 | Form submit tier unverified on live sites | v8.4.2 double-send history | **Inert** — machinery + tests only |
| P2 | Scroll-listener regression | DEVLOG rail-jump incident | **Fenced** — `perfmemo.test.js` asserts no per-scroll listeners |
| P2 | Other hosts' SSE shapes (Claude, Gemini) | N/A until net-read expanded | Deferred |

### Track C — Chat-reading comparison

| Option | Robustness | Effort | Actuation risk | Decision |
|--------|------------|--------|----------------|----------|
| DOM observation (current) | Medium — breaks on shadow DOM / lazy render | Low | None (read path) | **Keep primary** |
| Network SSE tap (`GITL_NET`) | High on ChatGPT when endpoint current | Medium | Low if read-only | **Prototype, flag off** |
| Clipboard / export scrape | Low | Low | None | Skip |
| Accessibility tree API | Medium (future) | High in userscript | None | Research only |

**Prototype:** `GITL_NET.netRead` + `_sseChatGptFeed()` — snapshots, JSON-patch ops, `[DONE]`. Settings → Advanced → **Net read**. Contract test proves never used by actuation.

### Track D — Safeguards / threat model

**Changed**

- `_reviewedSend`: uniqueness across **whole** selector set → `SEND-004` on ambiguity.
- `_ambiguousComposerCount()` → `COMPOSER-003` before inject.
- Disabled reviewed button → `SEND-003` (points to Teach Send).
- `GHOST.safety`: kill switch, dry-run, per-site disable (`gitlSiteOff`).
- Settings UI + Run tab banners; `engineTick` pauses loud if switch flipped mid-run.
- Dry-run: stages + reports path; journal never opens.

**Threat model (abbreviated)**

| Threat | Mitigation |
|--------|------------|
| Wrong element clicked (popup, dictation) | `SEND_VETO`, `_sendLooksSafe`, reviewed-only actuation |
| Double send | At-most-once journal; tier chosen once pre-journal |
| Send while tab lost lease | `verifyTabLease` before send |
| Automation on wrong site/tab | Per-site disable, kill switch |
| Silent failure | Loud pause + Reporter codes |
| Malicious page spoofing composer | Evidence gate + composer ambiguity guard |
| Net-read data exfil | In-memory only, off by default, not in export |

**Tests:** `tests/safeguards.test.js`.

### Track E — External prior art

| Source | Technique | License | Build or skip |
|--------|-----------|---------|---------------|
| Playwright `getByRole` | Role/aria-first locators | Apache-2.0 | **Skip dep** — inform heuristics only |
| Playwright device descriptors | Mobile CI emulation | Apache-2.0 | **Build** — adopted in `playwright.config.js` |
| ChatGPT Auto-Continue (userscript ecosystem) | Completion polling | varies | **Skip** — conflicts with at-most-once |
| CompletionChime-style FSM | State machine for stream done | MIT-ish | **Partial** — SSE `[DONE]` terminal only |
| OSS chat-CLI SSE adapters | JSON-patch framing | varies | **Build** — patch op accumulator in parser |

Highest ROI implemented: Playwright mobile projects + SSE patch parsing (no new runtime deps in the IIFE).

### Track F — Send tier truth table

Selection order in `_selectSendStrategy` (before `_beginSendAttempt`):

1. Human-taught control (Teach Mode)
2. Unique reviewed Send button
3. Reviewed `dispatchFallback: 'enter'`
4. Reviewed `form.requestSubmit()` — **no adapter declares `dispatchFallback: 'form'`** → tier unreachable in production

| Scenario | Mechanism chosen | Dispatches | Second fire possible? |
|----------|------------------|------------|------------------------|
| Taught button present | taught | 1 click | No — journal blocks re-entry |
| Reviewed button unique | reviewed-button | 1 click | No |
| No button, Enter fallback | reviewed-enter | 1 keydown | No |
| Button present but disabled | none | 0 | `SEND-003` pause |
| Multiple reviewed candidates | none | 0 | `SEND-004` pause |
| Composer not staged | none | 0 | `COMPOSER-002` pre-journal |
| Dry-run | none | 0 | Journal never opens |

**Tests:** `tests/sendtiers.test.js`, updated `sendtransaction.test.js`, `sendlayered.test.js`.

### Track G — Mobile CI + perf

**Changed:** Playwright projects `mobile-chromium` (Pixel 7) and `mobile-firefox` (touch, 412×915, Android UA). `tests/e2e/mobile-send.spec.js` — four scenarios. `tests/perfmemo.test.js` — `stopVisible` 400ms memo, no scroll listeners.

**Perf note:** `_composerText` narrowed to honest sources; `stopVisible` caches during live send scans.

---

## 3. Open questions (need human / device)

1. **Real Android Firefox/Chrome** — Does reviewed Enter on live chatgpt.com match CI mocks?
2. **Form tier** — Which host, if any, should declare `dispatchFallback: 'form'` first?
3. **Net-read** — Should parsed stream text ever feed `_confirmSend` / completion detection?
4. **Promotion** — Merge to `main` and bump live install URL, or hold for field soak?

---

## 4. Verification block (paste)

```text
$ cd dev && npx jest
Test Suites: 41 passed, 41 total
Tests:       490 passed, 490 total
Time:        ~1.4s

$ npx playwright test
82 passed (~51s)
Projects: chromium, firefox, mobile-chromium, mobile-firefox

$ node scripts/build-extension.js --check
Generated extension artifact is current.
```

---

## 5. Personal Forge handoff

This report is registered as recommendation **`REC-GITL-8.7.0-5348`**.

- Manifest: `personal-forge/recommendations/REC-GITL-8.7.0-5348/RECOMMENDATION.yaml`
- Source branch: `cursor/ghost-loop-eval-5348` on `MShneur/ghost-in-the-loop`
- Alternate branch tag: `recommendation/REC-GITL-8.7.0-5348`

Push to `MShneur/ctrl-forge` `mine/projects/` was attempted; integration token lacks push permission — copy manifest + report into Personal Forge manually or grant push access and re-run push script.
