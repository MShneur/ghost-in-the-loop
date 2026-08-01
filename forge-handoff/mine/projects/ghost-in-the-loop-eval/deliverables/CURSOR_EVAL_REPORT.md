# Ghost in the Loop — Cursor Evaluation Report (v8.7.0)

**Recommendation-ID:** `GITL-EVAL-20260801-cac16205`  
**Branch:** `cursor/gitl-eval-integrator-2995` (off `claude/skin-system-redesign-dh04go`)  
**Product version:** 8.7.0 (review only — **not promoted to `main`**)  
**Base:** live 8.6.1 + skin-system redesign branch  
**Personal Forge:** filed as CTRL-FORGE recommendation set  
https://github.com/MShneur/ctrl-forge/issues/2 (parent) · #3 report · #4 gaps · #5 prior art · #6 manifest.  
Git push to `ctrl-forge` remains denied for `cursor[bot]`; forge-format tree also at `forge-handoff/`.

---

## 1. Executive summary

The send last-mile is harder and safer: Ghost now **refuses to open a send journal** unless the composer actually holds the staged prompt, and picks **exactly one** dispatch mechanism from an evidence-gated ladder (platform button → reviewed Enter → unique wrapping `form.requestSubmit()` → Teach). Mobile Send is reproducible in CI via touch/mobile Playwright projects.

Safeguards raise the fail-closed floor (kill-switch, host allow-list, dry-run, composer ambiguity, navigation abort, reconcile baseline). A **read-only** SSE chat-reading prototype sits behind `gitlNetRead` (off). Prior-art AccName/role helpers improve detection without new dependencies.

**Human calls still needed:** grant write access to Personal Forge (or copy `forge-handoff/`); real-device confirm ChatGPT/Perplexity Android when “Enter sends” is off; decide whether Claude/Gemini get reviewed Enter after device evidence; whether to enable network reading by default later.

---

## 2. Per-track findings

### A — Send/detection last mile
**Found:** `injectText` always returned `true`; no post-inject composer proof; hidden Send could still match without a `hidden` attribute check; ChatGPT `useCE:false` under-specified mobile CE.  
**Changed:** `_composerHoldsPrompt` gate + honest `injectText`; `_visible` rejects `[hidden]`/`aria-hidden`; ChatGPT `useCE:true`; mobile fixture proves `reviewed-enter` when button absent.  
**Deferred:** per-adapter Enter for Claude/Gemini (needs device evidence — GAP-B19).

### B — Gap audit
**Deliverable:** `docs/GAP_REGISTER.md` (40 gaps, scored).  
**Cheap fixes implemented:** B01/B02 evidence gate, B11 Teach uniqueness, B09 reconcile baseline, B08 missing-baseline, B07 stableTicks≥2, B13/B14 diagnostics + Enter health, B15 mobile CI, B31 package.json version.  
**Deferred:** live DOM canary (B16), Copilot shadow send (B17), network-truth as default (B06).

### C — New ways of reading chats
**Comparison:**

| Approach | Robustness | Effort | Actuation risk | Status |
|----------|------------|--------|----------------|--------|
| DOM + sigil + stop (current) | Medium | Low | None | Production |
| Stop→Send transition | Medium | Low | None | Already partial via `stopVisible` |
| aria-live regions | Medium | Medium | None | Deferred |
| Network SSE terminal (`[DONE]` / `message_stop`) | High per-platform | Medium | None if read-only | **Prototype flagged off** |
| Full stream text parse | High / brittle | High | Privacy + ToS | Skip for actuation |

**Prototype:** `GITL_NET._ingestSseChunk` when `GM_getValue('gitlNetRead', false)`. Stores `lastDoneT` + 400-char tail. **Never consulted by `_selectSendStrategy` / `engineSend`.**  
**Try it:** set `gitlNetRead` true in storage, reload, watch diagnostics `netRead`.

### D — Safeguards + threat model
See §6. Implemented: kill-switch, host allow-list, dry-run, ambiguity guard, nav abort, runaway caps already present (`maxRounds` / soft-proceed ≤2) audited and left as-is with clearer catalog guidance.

### E — External prior art
**Deliverable:** `docs/PRIOR_ART_MEMO.md`.  
**Built:** miniature `_roleOf` / `_accName`; `CONTINUE_EXCLUDE` for continue clicks; Playwright device descriptors for mobile CI.  
**Skipped:** chatgpt.js / heavy deps; private API replay; disabled-Send-as-generating.

### F — Send tier ladder
Ladder implemented as `_selectSendStrategy` (pre-journal). Truth table in `tests/sendladder.test.js`.  
**Invariant preserved:** one `strategy.run()`; exception → uncertain; no post-begin escalation.

### G — Optimizations + mobile CI
- Projects: `chromium-mobile`, `firefox-mobile` (`testMatch: mobilesend.spec.js`).
- Fixture: `tests/e2e/mock-chat-mobile.html` + `mobilesend.spec.js`.
- Selector cache invalidated on structural MutationObserver events (no scroll listeners).
- Perf note: cache clear is debounced 50ms; continue-observer already existed — sibling of the old `backdrop-filter` mobile jank fix.

---

## 3. Gap register

Full table: [`docs/GAP_REGISTER.md`](./GAP_REGISTER.md). Top open items after this release:

| ID | Title | Score | Notes |
|----|-------|------:|-------|
| B03/B19 | Enter not declared on Claude/Gemini/etc. | 24/12 | Needs device evidence |
| B06 | Network-truth completion default | 24 | Prototype only |
| B16 | Live DOM selector canary | 27 | Ops/scripting |
| B17 | Copilot shadow send | 12 | Needs fixture |
| B40 | CI ≠ Android GeckoView | 18 | Real device still required |

---

## 4. Reading-the-chat comparison

See Track C table above. Recommended production posture: keep DOM+sigil+stop as authority; use `gitlNetRead` as an advisory witness in diagnostics until one platform’s terminal marker is battle-tested.

---

## 5. Send tier truth table

| Available controls | Selected path | Fires | After journal |
|--------------------|---------------|-------|---------------|
| Unique platform reviewed Send | `reviewed-button` | `click()` once | observe / uncertain |
| No button; adapter `dispatchFallback:'enter'` | `reviewed-enter` | one `keydown` Enter | observe / uncertain |
| No button/enter; unique wrapping `<form>` | `reviewed-form` | `requestSubmit()` once | observe / uncertain |
| Else unique taught Send | `taught-button` | `click()` once | observe / uncertain |
| None | — | nothing; `SEND-001` pause | journal never opens |
| Dry-run on | announced only | nothing | journal never opens |
| Composer missing prompt | — | nothing; `COMPOSER-002` | journal never opens |
| >1 visible composers | — | nothing; `COMPOSER-003` | journal never opens |

Guarded by `tests/sendladder.test.js`, `sendtransaction.test.js`, `sendlayered.test.js`.

---

## 6. Threat model (Track D)

| Threat | Mitigation |
|--------|------------|
| Double-send / escalation | Single pre-journal strategy; no second actuator; journal → observe/uncertain only |
| Wrong control click | Reviewed uniqueness + `_sendLooksSafe` + AccName veto + Teach uniqueness |
| Prompt not staged but Send fired | Pre-dispatch `_composerHoldsPrompt` |
| Ambiguous composer | `COMPOSER-003` pause |
| Automation on unwanted host | `gitlKillSwitch` / `gitlEnabledHosts` |
| User wants preview only | `gitlDryRun` |
| Navigate mid-dispatch | `pagehide`/`popstate`/`hashchange` → uncertain, no resend |
| Stale PROCEED after uncertain reconcile | `replyBaseline` reset on human confirm |
| Network reader abused for actuation | Flag default off; not wired into send selection |
| Own-UI / Trusted Types / tab lock | Unchanged invariants §1 |
| Runaway loop | Existing `maxRounds` drift guard + soft-proceed cap (2) |

---

## 7. Open questions (real device / product)

1. On Android Firefox ChatGPT, does reviewed Enter submit when “Enter sends message” is enabled? (CI proves selection; not GeckoView.)
2. Should Claude/Gemini declare `dispatchFallback:'enter'` after a real-device check?
3. Enable `gitlNetRead` by default for ChatGPT only, still advisory?
4. Personal Forge write access for `cursor[bot]` (or accept manual copy of `forge-handoff/`)?
5. Promote 8.7.0 to live `main` only after field retest of mobile Send + Teach.

---

## 8. Verification block

```
=== jest ===
Test Suites: 40 passed, 40 total
Tests:       456 passed, 456 total

=== playwright ===
86 passed (chromium, chromium-mobile, firefox, firefox-mobile)

=== build-extension --check ===
Generated extension artifact is current.
```

Syntax: `node -c ghost-in-the-loop.user.js` OK.  
`VER` / `@version` / `extension/manifest.json` / CHANGELOG all **8.7.0**.

---

## Delivery

| Artifact | Location |
|----------|----------|
| Integrated branch | `cursor/gitl-eval-integrator-2995` |
| Report | `dev/docs/CURSOR_EVAL_REPORT.md` |
| Gap register | `dev/docs/GAP_REGISTER.md` |
| Prior-art memo | `dev/docs/PRIOR_ART_MEMO.md` |
| Forge package | `forge-handoff/mine/projects/ghost-in-the-loop-eval/` |

**No PR to `main`.** Review on the branch (or after copying into CTRL-FORGE).
