# Ghost in the Loop — Cursor Eval Report

**Recommendation ID:** `REC-GITL-EVAL-20260801-A1A5`  
**Branch:** `cursor/eval-upgrade-tracks-a1a5` (off `claude/skin-system-redesign-dh04go`)  
**Version:** 8.7.0  
**Status:** Ready for review — not promoted to `main`

---

## 1. Executive summary

This evaluation integrated Tracks **A, D, F, C (prototype), and G** from
`dev/docs/HANDOFF_CURSOR_EVAL.md`. The highest-impact fix is a **pre-dispatch
evidence gate** plus an explicit **send tier ladder** that chooses one actuator
before the at-most-once journal opens.

**Fixed / shipped in 8.7.0:**
- Composer must hold the intended prompt before Send (`COMPOSER-002`).
- Multiple reviewed Send buttons pause loud (`SEND-003`) instead of guessing.
- Disabled/hidden reviewed buttons block dispatch (`SEND-004`).
- Tier ladder: button → Enter → unique `form.requestSubmit()` → taught.
- Safeguards: dry-run, kill switch, per-site disable map.
- Read-only `GITL_NET_READ` SSE prototype (off by default).
- Mobile CI: `chromium-mobile` project + `mobilesend.spec.js`.

**Deferred (needs human/device or product call):**
- Real Android Firefox field confirmation on chatgpt.com.
- Full network-truth completion for Perplexity socket.io / Gemini batchexecute.
- Push to Personal Forge repo (token lacks write access to `ctrl-forge`).

**All invariants §1 intact.** Every new behavior has a test.

---

## 2. Per-track findings

### A — Send/detection last mile

| Platform | Send resolution | Confirmation |
|---|---|---|
| ChatGPT desktop | Reviewed `send-button` tier | composer cleared + stop or network |
| ChatGPT mobile web | `reviewed-enter` when button absent | same; fails closed if text not staged |
| Perplexity | button or `reviewed-enter` | same |
| Others (reviewed) | button → form → taught | same |

**Changes:** `_composerHoldsPrompt`, `_preDispatchEvidenceGate`, extra `beforeinput`
on contenteditable inject.

### B — Gap register (top rows)

| ID | Severity | Likelihood | Blast | Repro / pointer |
|---|---|---|---|---|
| GAP-001 | High | High | High | Mobile Send disabled until native keystroke — `COMPOSER-002` mitigates false dispatch; real device still needed |
| GAP-002 | High | Med | High | No network-truth completion on most platforms — DOM-only (`engineTick`) |
| GAP-003 | Med | Med | Med | Selector drift undetected until field report — no live canary |
| GAP-004 | Med | Low | High | `execCommand('insertText')` ignored on some Lexical builds — paste tier exists |
| GAP-005 | Low | Med | Low | Shadow DOM send on Copilot — 5s throttle on deep walk |

### C — Reading the chat

| Approach | Robustness | Effort | Shipped? |
|---|---|---|---|
| DOM + stop + stable text | Medium | Low | Yes (existing) |
| Network SSE (ChatGPT) | High | Med | Prototype `GITL_NET_READ`, flag off |
| aria-live regions | Medium | Med | Deferred |
| Stop→Send transition | Medium | Low | Partial via `stopVisible` |

**Try the prototype:** Settings → **Net read (beta)** toggle (`netReadEnabled`).

### D — Safeguards / threat model

| Control | Implementation |
|---|---|
| Ambiguity guard | `SEND-003` when >1 reviewed send match |
| Injected-text verification | `COMPOSER-002` |
| Kill switch | `killSwitch` GM key |
| Per-site enable | `siteDisabled` hostname map |
| Dry run | `dryRun` — no journal opened |
| Navigation abort | Existing `gitl:route` handler (unchanged) |
| Run-away caps | Existing `maxRounds` / drift guard (audited, unchanged) |

**Threat model (abbreviated):**
- **Wrong control click:** veto + ambiguity guard + teach re-veto.
- **Double send:** at-most-once journal; no post-dispatch escalation.
- **Silent failure:** pause loud + Reporter codes.
- **Cross-tab race:** tab lease (unchanged).
- **Stream mis-read:** `GITL_NET_READ` is read-only, never actuates.

### E — External prior art

| Technique | Build or skip | Notes |
|---|---|---|
| Playwright role/aria locators | **Adopt patterns** | Already mirrored in `_heurSend` semantic gate |
| Playwright device descriptors | **Adopted** | `chromium-mobile` project |
| Tampermonkey chat-auto-continue scripts | **Skip deps** | Enter-only patterns absorbed; no `@require` |
| Healenium-style selector memory | **Already have** | `SelectorMemory` (input only) |
| Browser-use / agent frameworks | **Skip** | Violates single-IIFE constraint |

### F — Send tier truth table

| Tier | Path | Fires when | Can fire twice? |
|---|---|---|---|
| 1 | `reviewed-button` | Exactly 1 platform send match | No — single `strategy.run()` |
| 2 | `reviewed-enter` | No button; adapter `dispatchFallback:'enter'` | No |
| 3 | `reviewed-form` | No 1–2; exactly 1 wrapping form | No |
| 4 | `reviewed-taught` | TeachStore valid send | No |
| — | `ambiguous` | >1 send match | Never fires — pauses |
| — | dry-run | Any resolved tier | Never fires journal |

Guarded by `sendtier.test.js`, `sendtransaction.test.js`, `sendlayered.test.js`.

### G — Optimizations + mobile CI

- `chromium-mobile` Playwright project (Pixel 5, touch).
- `mobilesend.spec.js` reproduces buttonless Enter tier.
- Selector cache invalidation via debounced `MutationObserver` (~150ms).

---

## 3. Open questions for the user

1. Confirm on **real Android Firefox** that `reviewed-enter` submits on chatgpt.com with default "Enter sends" enabled.
2. Should **taught send** remain tier 4 (after form) or jump to tier 1 on unreviewed hosts?
3. Create **`personal-forge`** repo or grant push to `ctrl-forge` for recommendation intake?
4. Promote `GITL_NET_READ` to Perplexity WS after field capture of frame shapes?

---

## 4. Verification block

```
$ cd dev && npx jest
Test Suites: 40 passed, 40 total
Tests:       445 passed, 445 total

$ npx playwright test
117 passed (1.0m)
  Projects: chromium, chromium-mobile, firefox

$ node scripts/build-extension.js --check
Generated extension artifact is current.
```

---

*End of report — REC-GITL-EVAL-20260801-A1A5*
