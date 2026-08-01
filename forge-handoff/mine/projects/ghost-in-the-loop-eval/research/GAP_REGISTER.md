# Ghost in the Loop — Gap Register (Agent B)

**Scope:** `/workspace/dev` @ product `VER 8.6.1`  
**Brief:** `docs/HANDOFF_CURSOR_EVAL.md` §1 invariants, §3 focus areas  
**Sources:** `ghost-in-the-loop.user.js`, `DEVLOG.md` / `CHANGELOG.md` (8.4→8.6.1), `tests/**`, `playwright.config.js`, `diagnostics/gitl-canary.user.js`  
**Constraint:** read-only audit — no product code changes in this track.

### Scoring

| Axis | Scale |
|------|--------|
| Severity | **S0**=4 critical (wrong/missed send, loop stuck, safety-adjacent) · **S1**=3 major reliability · **S2**=2 moderate · **S3**=1 polish/docs |
| Likelihood | **L1**=1 rare/narrow · **L2**=2 intermittent or several platforms · **L3**=3 common / field-confirmed class |
| Blast radius | **local**=1 one host/path · **platform**=2 one adapter family · **global**=3 engine-wide |
| **Score** | severity × likelihood × blast (max 36) |

**Status:** `recommend-fix-now` = cheap/safe under §1 invariants; `open` = needs design, device evidence, or larger track (A/C/F/G).

---

## Gap register

| ID | Title | Severity | Likelihood | Blast radius | Score | Repro or code pointer | Cheap/safe fix? | Status |
|----|-------|----------|------------|--------------|-------|----------------------|-----------------|--------|
| GAP-B01 | No pre-dispatch composer evidence gate | S0 | L3 | global | 36 | `engineSend` injects then dispatches with no check that `_composerText(input)` holds the staged prompt (`ghost-in-the-loop.user.js:2473–2502`). Handoff §3 hypothesis. | **yes** — after `injectText`, require composer text contains exact prompt (or normalized equality); else `COMPOSER-001` + `pauseWithProbe`, never open journal | recommend-fix-now |
| GAP-B02 | `injectText` reports success even when text never landed | S0 | L3 | global | 36 | `Adapter.injectText` CE/NS/direct paths always `return true` (`1158–1198`); only null-el returns false. React/ProseMirror can ignore `execCommand`/`InputEvent`. | **yes** — after inject, verify `_composerText` / `indexOf` prompt; return `false` if missing | recommend-fix-now |
| GAP-B03 | Mobile SEND-001 class (button absent / dictation slot) | S0 | L3 | platform | 24 | Field: Android/Firefox chatgpt.com (`DEVLOG` 8.6.1, `CHANGELOG` 8.6.1). `_reviewedSend` unique-button gate (`1016–1036`); ChatGPT/Perplexity now have `dispatchFallback:'enter'` (`543`,`556`) — **Claude/Gemini/DeepSeek/Grok/Copilot/Manus do not**. | **partial** — Enter already shipped for CG/PPLX; do **not** blanket-add Enter without per-adapter review (invariant #1/#3). Prefer evidence gate (B01) + Teach + Agent F tiers | open |
| GAP-B04 | Programmatic inject may not enable Send button | S1 | L3 | platform | 18 | Handoff §3; mobile ChatGPT hides Send until native keystroke. After inject, `getSendBtn()` still null → Enter path. If Enter setting off / editor ignores synthetic keydown → SEND-002 uncertain. No test asserts post-inject enabled button. | **yes (observe-only)** — diagnostic: log `btnEnabled` after inject; pause loud if neither enabled reviewed btn nor declared Enter fallback | recommend-fix-now |
| GAP-B05 | Reviewed Enter is keydown-only; `pressEnter` is dead | S1 | L2 | platform | 12 | Enter strategy fires only `keydown` (`2487–2492`). `Adapter.pressEnter` (`1200–1207`) also emits `beforeinput insertParagraph` + keypress/keyup but is **never called**. Some ProseMirror builds need beforeinput. | **careful** — do **not** wire full `pressEnter` as-is (multi-event risk of double-submit). Pick **one** reviewed event per adapter after evidence; keep single `strategy.run()` | open |
| GAP-B06 | No network-truth completion (pulse-only GITL_NET) | S0 | L2 | global | 24 | `GITL_NET` timestamps/bytes only (`320–521`); `streaming()` is advisory (`391–396`). Completion is DOM+sigil+stop (`2721–2727`, `_terminalReplyReady` `2380`). Heartbeat false-generation fixed 8.5.2 but content never parsed. | **no (cheap)** — Agent C prototype behind flag; read-only, never actuation | open |
| GAP-B07 | Completion stability window is one tick only | S1 | L2 | global | 18 | `_terminalReplyReady` requires `obs.stableTicks>=1` (`2380`) with 2.5s ticker → ~one quiet interval. Streaming pause mid-token can look “stable”. | **yes** — raise default to `>=2` (or platform override) + source-contract test; no actuation change | recommend-fix-now |
| GAP-B08 | `_replyAdvancedBeyondBaseline` true when baseline null | S1 | L2 | global | 18 | `if(!b)return true` (`2379`). After crash recover / human reconcile without baseline, stale PROCEED/HALT can satisfy `_terminalReplyReady` immediately. | **yes** — treat missing baseline as “not advanced” unless assistant count/text grew since reconcile/boot marker | recommend-fix-now |
| GAP-B09 | `reconcileUncertainSend(true)` skips replyBaseline / phase reset | S1 | L2 | global | 18 | `_confirmSend` sets `replyBaseline` (`2539`); `reconcileUncertainSend` (`2577–2604`) does not. Also does not clear `replyKey`/`replyStableTicks`. Pairs with B08 → possible immediate re-Continue on old sigil. | **yes** — mirror `_confirmSend` baseline + fingerprint reset on human-confirmed delivery | recommend-fix-now |
| GAP-B10 | Uncertain send never auto-reconciles from late evidence | S2 | L2 | global | 12 | After deadline, `_markSendUncertain` pauses (`2554–2572`). Late assistant growth ignored until human taps “I see it”. Safe (invariant #2) but UX sticky on slow links (>9s `SEND_CONFIRM_MS`). | **no** — optional observe-only banner “assistant grew — confirm?” without auto-commit; product call | open |
| GAP-B11 | TeachStore `matchEl` does not require uniqueness | S1 | L2 | global | 18 | `_reviewedSend` requires `matches.length === 1` (`1034`); `TeachStore.matchEl` returns **first** visible hit (`993–1008`). Duplicate mobile controls → wrong actuator despite veto. | **yes** — require exactly one match (same as reviewed selectors); else null + teach hint | recommend-fix-now |
| GAP-B12 | Taught send authority on unreviewed/generic hosts | S2 | L2 | platform | 8 | By design (`1017–1020`, DEVLOG 8.6.0). 13 `GENERIC_HOSTS` (`630–643`) otherwise manual. Drift of taught selector is higher risk than reviewed profiles. | **partial** — uniqueness (B11) + re-veto already present; add “taught selector stale” probe when matchEl null while stored | open |
| GAP-B13 | SEND-001 / COMPOSER guidance omits Teach Mode | S3 | L3 | global | 9 | `ERROR_CATALOG['SEND-001']` (`1899–1901`) says manual Send only; Teach UI exists (`4770–4791`) but catalog/guidance not updated for 8.6.0. | **yes** — one-line guidance: use Teach Send / Teach Input | recommend-fix-now |
| GAP-B14 | `platformHealth.send` ignores Enter fallback | S2 | L3 | platform | 12 | `canSend = !!send` button only (`1777–1783`). ChatGPT/Perplexity mobile: Enter works but health/Teach/`capabilities.send` report false → false SEND-001 class in diagnostics. | **yes** — `canSend = !!btn \|\| (reviewed && dispatchFallback==='enter' && !!input)` for **diagnostics only** (not new actuation) | recommend-fix-now |
| GAP-B15 | No mobile-emulation CI project (touch) | S1 | L3 | global | 27 | `playwright.config.js` Firefox uses mobile viewport+UA (`58–68`) but **not** `devices['Pixel 5']` / `hasTouch:true`. Mock always has enabled Send (`tests/e2e/mock-chat.html:22`). Handoff Agent G. | **yes** — add Playwright mobile project + fixture with disabled/absent Send + Enter path e2e (tests/config only) | recommend-fix-now |
| GAP-B16 | No live-DOM selector canary / drift detection | S1 | L3 | global | 27 | `diagnostics/gitl-canary.user.js` covers inject/boot/panel only (`canary.test.js`). No CI or periodic probe against live chatgpt/claude/… DOM. Selector arrays (`534–627`) rot silently until field SEND-001/ADAPTER-001. | **no (fully cheap)** — needs outbound live fetch or maintainer script; start with offline fixture snapshots per platform | open |
| GAP-B17 | `_reviewedSend` has no Shadow DOM walk | S1 | L2 | platform | 12 | `_q` walks shadow for input/stop (`711–731`); `_reviewedSend` uses light-DOM `querySelectorAll` only (`1022–1035`). Copilot (`cib-*`, `582–591`) historically shadow-heavy → false SEND-001. | **careful** — shadow-aware unique match + veto; needs Copilot fixture tests | open |
| GAP-B18 | Composer lookup is first-match, not unique | S1 | L2 | global | 18 | `_q('in', …)` returns first hit (`711–719`); COMPOSER-001 text claims “uniquely identifiable” (`2469`) but code does not enforce uniqueness. Wrong composer risk on multi-input pages. | **yes** — if >1 visible PEER composers, pause (ambiguity) instead of first-match (Agent D) | open |
| GAP-B19 | Claude / Gemini / others lack `dispatchFallback` | S1 | L2 | platform | 12 | Only 2 adapters opt into Enter (`sendlayered.test.js` asserts count===2). Mobile Claude/Gemini ProseMirror same class as ChatGPT failure. | **no** — per-platform evidence first (Agent A/F); do not copy Enter blindly | open |
| GAP-B20 | DeepSeek / Grok class\* send selectors brittle | S2 | L2 | platform | 8 | DeepSeek `div[class*="send"]` (`576`); historically mislearned share/copy (DEVLOG 8.2.1). Veto helps; uniqueness+class drift still fragile. | **partial** — prefer aria-label tiers; Teach Mode escape hatch exists | open |
| GAP-B21 | Answer detection still DOM-fragile (non-PPLX) | S2 | L2 | platform | 8 | v8.5.3 sharpened Perplexity (`_selectAnswerCandidate` `1103–1119`). ChatGPT/Claude/Gemini rely on role/class lists; virtualized Gemini needs scroll nudge (`1143–1145`). No network text. | **no** — Agent C | open |
| GAP-B22 | Fuzzy proceed/halt can false-trigger | S2 | L2 | global | 12 | `FUZZY_PROCEED` / `FUZZY_HALT` (`2198–2204`) add +2; threshold 3 with progress can proceed/halt without sigil (`2243–2245`). Soft-proceed nudge path (`2826–2846`) also continues. | **partial** — require sigil OR (fuzzy∧stable∧!generating∧advanced); tests in `signal.test.js` | open |
| GAP-B23 | Heartbeat / streaming edge residual | S1 | L2 | platform | 12 | 8.5.2 filters Socket.IO heartbeats (`_wsFrameIsMeaningful` `369–381`). Residual: format change reclassifies control as content → stuck “generating”; or content misclassified → early read. DOM gate is fallback but `isGenerating` can still delay. | **no** — keep DOM override; Agent C network-truth | open |
| GAP-B24 | `isGenerating` ORs stop ∪ network pulse | S2 | L2 | global | 12 | `Adapter.isGenerating` (`1139`). Stale `_open` or heuristic pulse inside `expectUntil` blocks send (`2460–2464`) / completion. `reDetect` zeros counters (`3118–3119`) but normal tick does not. | **partial** — already have terminal override (`2726–2727`); add max pulse-age cap for “generating” without stop | open |
| GAP-B25 | ChatGPT `useCE:false` / `useNS:true` vs mobile CE | S2 | L2 | platform | 8 | Profile flags (`544`) assume textarea native setter; mobile uses contenteditable (attribute branch still CE). Flag mismatch confuses maintainers; paste tier may not run if `useCE` false and attribute missing on wrapper. | **yes** — set `useCE:true` for ChatGPT or document CE-first; no actuation widening | open |
| GAP-B26 | Untested: reconcile / inject verify / Enter mobile | S1 | L3 | global | 27 | No Jest behavioral test for `reconcileUncertainSend` baseline; no inject-landing assertion; e2e mock always has Send button; no disabled-Send+Enter scenario. Source contracts cover structure (`sendtransaction`/`sendlayered`/`teach`) not last-mile. | **yes** — add unit + mobile e2e fixtures (no product invariant change) | recommend-fix-now |
| GAP-B27 | Dead / misleading `pressEnter` API surface | S3 | L1 | local | 1 | Unused since single-dispatch 8.5.3; readers may think layered Enter still runs. | **yes** — delete or comment “not used by engineSend; do not multi-fire” | open |
| GAP-B28 | Generic hosts: 13 platforms, no reviewed send | S2 | L2 | platform | 8 | `GENERIC_HOSTS` (`630–643`) `reviewed:false` — intentional. Automation only via Teach. No per-host smoke. | **no** — product policy; Teach + docs | open |
| GAP-B29 | Custom site imports force `reviewed:false` | S2 | L1 | local | 2 | (`680`) — correct safety. Combined with no Enter fallback → Teach-only. Catalog ADAPTER-001 doesn’t mention Teach. | **yes** — guidance string only | open |
| GAP-B30 | Diagnostic code gaps for teach / inject-empty / ambiguity | S2 | L2 | global | 12 | Catalog (`1887–1922`): BOOT/COMPOSER/SEND/ADAPTER/EXPORT. No `TEACH-001` (capture failed), no `COMPOSER-002` (inject landed empty), no ambiguity code. `probe_fail`→ADAPTER-001 collapses distinct failures. | **yes** — add codes + envelope fields (taughtKinds, dispatchFallback) | open |
| GAP-B31 | `package.json` version lag (8.5.2 vs VER 8.6.1) | S3 | L1 | local | 1 | `dev/package.json` `"version":"8.5.2"` vs `const VER='8.6.1'` / manifest 8.6.1. | **yes** — bump package.json | recommend-fix-now |
| GAP-B32 | Extension/content hand-edit risk (process) | S3 | L1 | global | 3 | Documented; `--check` in CI. Residual if someone edits `extension/content.js`. | **n/a** — process already gated | open |
| GAP-B33 | Tab lock + focus vs mobile backgrounding | S2 | L2 | platform | 8 | `assertInteractionSafe` / unattended (`291–298`). Mobile Firefox backgrounding → focus loss pauses sends unless unattended. Field “stuck” can be focus, not SEND-001. | **partial** — docs + diagnostic reason already; ensure SEND reports include `tab-not-focused` | open |
| GAP-B34 | Rail / VisualViewport real-device untested | S3 | L2 | platform | 4 | DEVLOG 8.5.0–8.5.1: keyboard geometry needs hardware. E2E desktop only. | **partial** — mobile Playwright project (B15) helps geometry, not real keyboard | open |
| GAP-B35 | Soft-proceed can mask real completion bugs | S2 | L2 | global | 12 | Two sigil-free auto-continues (`2835–2846`) before pause. Looks “working” while markers fail; burns rounds. | **no** — tune streak or require longer quiet window; product call | open |
| GAP-B36 | No canary that Send button became enabled after inject | S1 | L3 | platform | 18 | Same class as B04; zero automated observation that reviewed control transitions disabled→enabled post-inject. | **yes** — fixture: disabled send until `input` event; assert strategy choice / pause | recommend-fix-now |
| GAP-B37 | Enter fallback silent no-op when “Enter sends” disabled | S2 | L2 | platform | 8 | DEVLOG 8.6.1: degrades to uncertain — correct. User may not know to Teach Send or re-enable setting. | **yes** — SEND-002 guidance mention Enter-sends setting + Teach | open |
| GAP-B38 | `_sendEvidence` assistant growth uses `_qAll(PLAT.assistant)` not answer selector | S2 | L1 | platform | 4 | Confirm path (`2429–2432`) counts raw assistant selector matches; answer path uses `_selectAnswerCandidate`. Hidden duplicates can false-confirm or miss. | **partial** — align count with answer candidates | open |
| GAP-B39 | Teach capture: no shadow-target resolution | S2 | L1 | platform | 4 | `_capture` uses `e.target` + `closest` (`1259–1268`); shadow retargeting may teach wrong host element. | **careful** — `composedPath()[0]` for teach target | open |
| GAP-B40 | CI Firefox ≠ Android GeckoView | S2 | L3 | global | 18 | Acknowledged in `playwright.config.js` comments (`14–18`). Mobile field class systematically under-tested. | **partial** — B15 + real-device matrix (Agent G); cannot fully close in CI | open |

---

## Focus-area cross-check (handoff §3)

| Focus | Verdict | Primary IDs |
|-------|---------|-------------|
| Mobile Send SEND-001 class | Still open beyond ChatGPT/Perplexity Enter; no mobile e2e repro | B03, B15, B19, B26, B40 |
| injectText not enabling Send | Plausible; **unverified in CI**; inject always returns true | B01, B02, B04, B36 |
| Network-truth completion missing | Confirmed — pulses only, no SSE/body parse | B06, B21, C-track |
| No mobile CI | Confirmed — viewport/UA only, no touch device project / buttonless fixture | B15, B26, B40 |
| Selector drift / no live DOM canary | Confirmed — boot canary ≠ selector canary | B16, B20 |
| Teach Mode + uncertain-send holes | Teach: non-unique match; Uncertain: no baseline on reconcile; catalog omits Teach | B09, B11, B12, B13 |
| Heartbeat/streaming edge cases | 8.5.2 mitigated; residual format/pulse races | B07, B23, B24 |

---

## Platform adapter snapshot (reviewed)

| Platform | reviewed | dispatchFallback | Shadow-safe send? | Notes |
|----------|----------|------------------|-------------------|-------|
| ChatGPT | yes | enter | n/a (light DOM) | Mobile SEND-001 mitigated; inject enable unverified |
| Perplexity | yes | enter | n/a | Heartbeat fix 8.5.2; staleTicks 24 |
| Gemini | yes | — | n/a | TT enforced; virtual scroll nudge; no Enter |
| Claude | yes | — | n/a | ProseMirror CE; mobile risk like ChatGPT |
| DeepSeek | yes | — | n/a | class* send brittle |
| Copilot | yes | — | **no** (`_reviewedSend`) | Shadow gap B17 |
| Grok | yes | — | n/a | prior mislearn #model-select |
| Manus | yes | — | n/a | Monaco decoy textarea documented |
| Generic ×13 | no | — | n/a | Teach-only actuation |

---

## Untested / under-tested paths

1. Post-inject composer content equality (B01/B02)
2. Disabled/absent Send → Enter single-dispatch in real browser (B15/B26)
3. `reconcileUncertainSend(true)` → next tick does not re-fire on stale sigil (B09/B08)
4. TeachStore multi-match selector (B11)
5. Copilot shadow send resolution (B17)
6. Claude/Gemini mobile buttonless path (B19)
7. Network streaming false positive/negative after Socket.IO format change (B23)
8. Human “Enter sends” disabled → uncertain UX (B37)
9. Composer ambiguity (two textboxes) (B18)

---

## Top 5 cheap/safe fixes (invariant-safe)

These do **not** add post-dispatch escalation, heuristic clicks, `innerHTML`, own-UI actuation, or tab-lock relaxation. Suitable for immediate small PRs (Agent A/D/G or Integrator).

### 1. Pre-dispatch composer evidence gate (+ honest `injectText`) — GAP-B01, B02
After `Adapter.injectText`, require `_composerText(input)` to contain the exact staged prompt (trim/normalize). If not, `Reporter.capture('COMPOSER-001')` + `pauseWithProbe` and **do not** call `_beginSendAttempt`. Make `injectText` return `false` when verification fails.  
**Invariants:** strengthens #1/#7; no second actuator.

### 2. TeachStore unique match — GAP-B11
In `TeachStore.matchEl`, collect visible veto-safe matches; return element only if `length === 1` (mirror `_reviewedSend`).  
**Invariants:** strengthens #1; may fail closed more often (loud pause / re-teach).

### 3. Human reconcile sets reply baseline — GAP-B09 (+ B08)
In `reconcileUncertainSend(true)`, set `replyBaseline` from current assistant fingerprint/counts (same shape as `_confirmSend`) and reset `replyKey`/`replyStableTicks`. Optionally make `_replyAdvancedBeyondBaseline` return `false` when baseline is null during RUNNING.  
**Invariants:** prevents stale-sigil auto-continue; no resend.

### 4. Diagnostics honesty for Enter-capable adapters — GAP-B13, B14
- `platformHealth.send` true when reviewed Enter fallback + composer present (diagnostics only).  
- Update `SEND-001` / `SEND-002` guidance to mention Teach Mode and “Enter sends” setting.  
**Invariants:** display/metadata only.

### 5. Mobile Playwright project + buttonless fixture — GAP-B15, B26, B36
Add a Playwright project (`Pixel 5` or Firefox + `hasTouch: true`) and an e2e fixture where Send is absent/disabled until a real input event; assert Enter single-dispatch or loud SEND-001/COMPOSER pause — **no** product authority widening.  
**Invariants:** tests only; closes CI blind spot for the field class.

**Honorable mentions (also cheap):** bump `package.json` version (B31); raise `stableTicks>=2` (B07).

---

## Explicitly out of scope for “cheap fix” (flag for other tracks)

| Item | Track |
|------|--------|
| Network/SSE authoritative completion | Agent C |
| Full send tier ladder (form.requestSubmit, etc.) | Agent F — selection-before-journal only |
| Per-adapter Enter for Claude/Gemini without device evidence | Agent A |
| Live-site selector canary against production DOMs | Agent G / ops |
| Ambiguity guard + dry-run mode | Agent D |

---

## Invariant watchouts (do not “fix” by weakening)

- Do **not** reintroduce post-`_beginSendAttempt` escalation (DEVLOG 8.4.2 rejected double-send; 8.5.3 single-dispatch).
- Do **not** call unused `pressEnter` multi-event helper as a second fire after keydown.
- Do **not** let heuristics or SelectorMemory click Send.
- Prefer loud `pauseWithProbe` over guessing when composer text or send mechanism is ambiguous.
