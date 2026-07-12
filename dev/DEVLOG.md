# Ghost in the Loop — Developer Log

**Purpose:** Every research attempt, failed approach, and architectural decision is recorded here.
Before starting any new work, read the relevant sections — you may be repeating solved problems.

**Format per entry:**
- What was tried
- What happened (outcome)
- Why it failed or why it was chosen
- What to do instead / what we learned

---

## v8.1.0 — Self-healing base (send safety, sigil-free loops, selector memory)

### The DeepSeek "Copy" incident — why the send heuristic was structurally unsafe
- **Tried (v7→8.0):** score-based send finder: send-word +4, submit +2, svg-icon +1, same-form +3, proximity<320px +3, threshold 3.5, veto list of ~10 words.
- **What happened:** on DeepSeek, the assistant reply's Copy button (svg icon, ~200px from the composer) scored 1+3=4 → clicked. User's prompt was copied, not sent. Three retries in engineSend meant it clicked Copy repeatedly before falling through to Enter.
- **Why it failed:** proximity+icon describes EVERY message-action button on a chat page. A veto list can never enumerate them all; the scoring itself must require positive intent.
- **Learned / done instead:** (1) hard rule — candidates need a semantic positive (send word / type=submit / same-form) before scoring; (2) veto expanded to message-action verbs anyway (defense in depth); (3) the veto now wraps ALL tiers via `_sendLooksSafe()`, because configured selectors rot too (`div[class*="send"]` can match a share widget after a redesign). Regression suite: `tests/sendsafety.test.js`.

### Sigil-free models (DeepSeek) — completion must not depend on the model's cooperation
- **Tried:** relying on `[[GITL::PROCEED]]/[[GITL::HALT]]` echoes; stale-tick pause after ~12s quiet.
- **What happened:** DeepSeek regularly answers fully, formats output in a code block, and never prints the sigil → every round ended in "No signal detected — review output".
- **Learned:** quiescence (generation ended + text stable) IS the completion signal; the sigil is only the intent channel. Done instead: soft-proceed — one automatic "continue + protocol reminder" per sigil-free reply, pause only after 2 consecutive misses. Bounded by rounds/drift as usual. Do NOT raise the streak cap: a model that ignores the protocol twice will ignore it forever, and silent infinite nudging would burn the user's quota.

### Re-detect was one-shot — the button raced the SPA remount
- **What happened:** users press 🔄 at the exact moment the framework is rebuilding the composer; a single synchronous probe misses, message says "try again".
- **Done instead:** 12s MutationObserver+interval watch after a miss; ALL caches cleared (the heuristic tier's 4s cache was previously missed — a stale-but-connected wrong element could survive re-detect); network stream counters zeroed; silent visibilitychange self-heal for the browser→app→browser case.

### Selector memory (Healenium pattern, minimal port)
- **Chosen:** persist a derived stable selector (id > data-testid > aria-label > name > placeholder, verified UNIQUE at learn time) per-host after a heuristic rescue; try it between configured and heuristic tiers. 12-host LRU cap. Learned send selectors re-checked against the veto at lookup.
- **Rejected:** remote selector config (KeepChatGPT-style) — a remotely updatable selector feed is a supply-chain risk for a script that types into people's AI accounts; fingerprint similarity scoring (full Healenium) — overkill vs. the one-attribute derive, and heavy in a userscript.

### Workshop share
- Share was a doc link. Now `shareText()` builds the Discussions post (item list + bundle in a code block) and copies it. Skins ride in the bundle through the existing skin validator, so the security boundary is unchanged (token whitelist, fx enum, size caps).

## Session: v7.1.0 — IN PROGRESS (not yet released)

Working build. Nothing pushed. Unit suite at 157/157 (was 140; +17 Workshop safety tests). Each feature below was syntax-checked and the full suite re-run before moving on.

### Root-cause corrections (don't repeat these)
- **"Stopped short at 19/20" was NOT an early-HALT bug.** First diagnosis added progress-mismatch HALT detection — wrong. Real cause: the hard `maxRounds=20` cap silently paused a chat that legitimately needed ~24 rounds. Reverted the mismatch logic. **Lesson: a hard cap that stops without asking reads as "the script broke," not "a limit was hit." Always surface limits as a soft checkpoint with one-tap continuation.**
- **Mobile stuck-screen** was a send that was never confirmed: `engineSend` assumed success the instant it clicked/pressed Enter, and `assertInteractionSafe` blocks on `!document.hasFocus()`, so a notification stealing focus at the send moment swallowed the keystroke and the loop parked forever. Fix: confirm generation actually started (`isGenerating()` or output grew) within `SEND_CONFIRM_MS`, re-fire up to `SEND_MAX_RETRIES`, else pause + report.

### What shipped in this build
- **Send-confirmation watchdog** (`_onSendOk`/`_confirmSend`/`_refireSend`, branch atop `engineTick`).
- **Round limit → soft `LIMIT` checkpoint** with `engineLimit()`/`extendLimit()`, routed through one `primaryAction()` dispatcher (mini-bar, Run play, Alt+P all consistent).
- **Drift checkpoint UI (3a/3b)**: prominent `Step X/Y` counter + separate dim **drift-guard countdown** (`N left of 25`, amber ≤5, own ↻ reset). At the ceiling: **Continue / ⊕ Reground / ✋ Stop & wait**. Reground re-anchors to `L.originalTask` (captured at launch).
- **Re-detect button (3c)**: `reDetect()` clears `_cache` + `_deepLast`, re-resolves `PLAT`, re-probes — fixes browser→app→"can't find input" without a reload.
- **Reporter module**: zero embedded credentials; clipboard / pre-filled-issue / drop-in worker transports.
- **Veil**: Popover-API top-layer (feature-detected fallback) fixes "behind the app"; FPS-gated 3-ghost parallax; `visibilitychange` re-assert.
- **Gold left-edge dock** (`dock-left` position). **Host-menu injection was rejected** by committee on the certainty bar — 21 host menus × React re-renders = unmeetable "won't break / won't lag." The dock is our own top-layer element; no host-DOM coupling.
- **Workshop** (community content) — see ARCHITECTURE "Workshop layer".

### Workshop — design decisions (committee)
- **One combined `.gitl.json` bundle**, either array may be empty. (Single file = one share link; matches VS Code/Obsidian/extension norms.)
- **Import is purely additive.** Built-in ids are IMMUTABLE; custom-id clashes auto-rename (`x` → `x_2`). Rationale: a bad/malicious import must never destroy existing items or break core behavior. Verified by `tests/workshop.test.js` (built-in-overwrite attempts produce a renamed copy, original untouched).
- **Import/Export UI in Roles + Flow** (in-context), one shared module, not a separate tab.
- **Safeties path**: 512 KB file cap before parse, 200-item cap, per-field truncation, per-item validation (skip-not-fail), and an `_esc()` helper so imported label/inject/stage text can never inject markup into Ghost's own panel (previous persona/flow renderers interpolated raw strings — closed).

### Still open before release
- Evolving/Extended posture prompts (synthesize from Perplexity dump in project files).
- Firefox `content.js` rebuild from this engine.
- Playwright e2e re-run.
- Final CHANGELOG/README pass.

---

## Session: v7.0.0 — Replit e2e final round: 51/51 (2026-06-14)

### Result
51/51 tests passing across 11 spec files. All real bugs found and fixed.

### The boot-a story (resolved)
Every Replit round after patch2 reported "boot-a" failing at "line 1978 — document.body.appendChild(panel) at module scope." Each time it was stale code: Replit's `boot.spec.js` `buildInjectable()` was evaluating a pre-patch2 checkout.

What Replit described as "the fix" after their final round:
```js
const panel = document.createElement('div');
panel.id = 'gitl';
function mountPanel() {
  if (!document.getElementById('gitl')) document.body.appendChild(panel);
}
```

Our code (since patch2/patch3) already had exactly this — with a stronger guard (`_panelMounted || !document.body`) plus defense-in-depth removal of stale `#gitl` nodes. Functionally identical. They arrived at the same answer on fresh code.

### Lesson: map injected line numbers to source before diagnosing
Injected line number ≠ source file line number. Header strip = 41 lines. Injected line N = file line N+41. When a Replit report says "line 1978 crash" and our file has that call at line 2018 INSIDE a guarded function, the report is stale. Always verify with `grep -nP "^document\.body\."` (zero-indented = true module scope).

### Final coverage (11 spec files, 51 tests)
| Spec | What it covers |
|------|----------------|
| boot | document-start safety, panel mount, Timeline event, VER, PLAT.label |
| capsule | dedup, SHA-256 hex field, parentId chain, short-message filter, ISO timestamp, resume block |
| focusguard | isTabSafeToAct (3 failure modes), assertInteractionSafe (3 cases) |
| ghostbus | init, sendHandoff Timeline, self-filter, peer discovery, handoff receive + GM store, round-trip clear, cross-page BroadcastChannel |
| heartbeat | expired-lock reclaim, fresh-lock block, stolen-lock pause, releaseTabLock |
| idempotency | no panel duplication, no duplicate style injection |
| recovery | full exhaustion chain (all 5 strategies), native-setter partial success, ce-reinsert skip |
| send | send_ok recorded, focus gate, re-entrancy guard, round counter, state guard |
| spa | loop pause on pushState, cache clear, _lastHref update, rapid pushState |
| tablock | lock claimed on boot, tabId match, cross-context block, key format |
| veil | lazy mount, show visibility + labels, step title update, hide, cancel button |

---



Replit ran behavioral tests: 2 reported failures. One real improvement, one test artifact.

### Test 1 — Continue button on CSS reveal (REAL improvement made)
- Replit: MutationObserver watched only `{ childList: true, subtree: true }`. A button revealed via `style.display = 'block'` is an *attribute* mutation — observer was blind to it.
- Assessment: partly valid. The observer is a fast-path; the loop tick `setInterval` is the primary continue-click driver, and the observer is correctly gated on `state === 'RUNNING'` (we must never click anything when the user hasn't started a loop). But watching attributes is a cheap, legitimate robustness gain — some platforms reveal a pre-rendered Continue button via CSS rather than inserting it.
- Fix: added `attributes: true` with `attributeFilter: ['style','class','hidden','disabled','aria-hidden']`. Callback still debounced 300ms and still early-exits when not RUNNING, so cost is negligible.
- Note on Replit's test: it toggled `display` on a button on the generic mock host, where `continueLabels` is empty by design (only ChatGPT has continue labels), and likely without the loop RUNNING. So `clickContinue()` correctly returned false. The observer change makes the mechanism fire; actual click still requires a matching host + RUNNING loop.

### Test 2 — Export on empty page (NOT a bug — correct behavior)
- Replit: `runExport()` on a page with no assistant messages returns early via `alert('no messages found')`, so no download fires; `waitForEvent('download')` times out.
- Assessment: this is correct. You cannot export a conversation that has zero messages. The early-return + alert is intended UX.
- No code change. The test needs real assistant message DOM nodes (see `tests/e2e/behavior.spec.js` which uses the mock page's existing assistant message).
- **Lesson:** "function returned early and didn't produce output" is only a bug if output was actually expected. An empty conversation has nothing to export. Test fixtures must contain the data the function operates on.

### Tests added
- `tests/e2e/behavior.spec.js` — continue-click mechanism + export-with-real-messages.

---



Replit ran the full extended e2e suite: 12/13 passed. Two findings.

### Finding 1 — reported boot crash was STALE CODE (not a real bug)
- Replit reported `document.body.appendChild(panel)` crashing at **line 1978** at module scope, with no `mountPanel()` present.
- Verified against live `main` (commit 8569d31): that call is at **line 2003**, inside `mountPanel()`, guarded by `if (_panelMounted || !document.body) return;`, called inside `safeBoot()`.
- Conclusion: Replit's checkout predated patch2 (commit 92120cb). Their stack trace line numbers (1978→2434→2436) match the pre-patch2 layout.
- `boot.test.js` static analysis confirms all 9 guards pass on current code.
- **Lesson:** when an e2e report's line numbers don't match the repo, suspect stale checkout before assuming regression. Always `git fetch` and diff before re-fixing.

### Finding 2 — own-UI selector collision (REAL bug, now fixed)
- Replit noticed the recovery test had a false-pass: `PLAT.input` fallback selector `textarea:not([disabled])` matched GITL's OWN settings textarea (`#cfg-sites`).
- Impact: on a page where the AI's real input isn't found, recovery/inject could type into our own panel's settings field instead of the chat.
- Fix: added `_isOwnUI(el)` helper (`el.closest('#gitl')`). Both `_q()` and `_qAll()` now skip any element inside the GITL panel.
- Also hardened `mountPanel()` to remove a stray pre-existing `#gitl` (defense-in-depth against harnesses that re-eval the IIFE and bypass the `__GITL_V7__` guard).
- Tests: 5 new static-analysis tests in `structure.test.js`. Unit suite now 140.
- **Lesson:** any selector that reads the host page can accidentally match our own injected UI. All DOM queries for page elements must exclude `#gitl` descendants.

### Note on Replit's idempotency observation
Replit correctly observed their idempotency test passing was partly a counting artifact — re-running the IIFE in their harness creates a second `#gitl` because each eval makes a new `const panel`. In production this can't happen: the `__GITL_V7__` guard (top of IIFE) prevents a second run entirely. Their harness resets `window` between evals, bypassing it. The `mountPanel` hardening above covers the harness case too.

---

## Session: v7.0.0-patch2 — Boot crash found by Replit Playwright test (2026-06-13)

### What broke (CRITICAL — script never loaded)
Replit ran a headful Playwright test injecting the script at `document-start` against a mock chat page. The script crashed with:

```
TypeError: Cannot read properties of null (reading 'appendChild')
  at window.GM_addStyle (line 18)
  at <anonymous> (line 1850)
```

### Root cause
Two DOM mutations ran at **top-level during script eval**, outside the `safeBoot()` guard:
1. `GM_addStyle(...)` at line ~1849 — `GM_addStyle` internally does `document.head.appendChild()`, but `document.head` is `null` at `document-start`.
2. `document.body.appendChild(panel)` at line ~1996 — `document.body` also null at `document-start`.

The crash halted the script before any `GM_setValue` ran, so the test saw an empty store.

### The irony
v7.0.0 *added* `safeBoot()` specifically to fix "DOM not ready" crashes — but only the MutationObserver and `render()` were moved inside it. The two static top-level DOM mutations were never moved. The guard existed; the dangerous calls were just outside it.

### Fix
- Wrapped `GM_addStyle` in a deferred `injectStyles()` function with a `document.head || document.documentElement` fallback and try/catch.
- Wrapped `document.body.appendChild(panel)` in a deferred `mountPanel()` with a null-body guard.
- Both now called inside `safeBoot()` before `render()`.
- Added idempotency guards (`_stylesInjected`, `_panelMounted`) so they can't double-fire.

### Lesson — generalizable
`safeBoot()` only protects the code path *inside its callback*. Any DOM-touching statement at module scope runs immediately at eval time, before the guard. **Rule: zero DOM mutation at top level. `createElement` is fine (no tree needed); `appendChild`/`GM_addStyle`/`head`/`body` access must be deferred into safeBoot.**

### Test that now guards it
`tests/boot.test.js` (9 static-analysis tests):
- GM_addStyle not called at top level
- panel appendChild not at top level
- both wrapped in named functions with null guards
- both called inside safeBoot before render
- idempotency guards present

### Why our existing CI didn't catch it
Our 126 tests were unit tests of pure logic in a jsdom environment where `document.body` already exists. They never simulated `document-start` injection timing. The Replit test used real Playwright at `document-start`, which is the only way to catch this class of bug. **Takeaway: add a Playwright/browser-timing test tier for boot-order bugs. Unit tests can't see them.**

---

## Session: v7.0.0 — The Runtime Controller (2026-06-13)

### Research method
Sent the codebase to 7 independent AI systems simultaneously (ChatGPT Code GPT, ChatGPT Ethical Hacker GPT, ChatGPT HTML/CSS/JS GPT, ChatGPT Software Architect GPT, DeepSeek, Gemini Flash, Kimi/Moonshot, Perplexity). Each analyzed the code and proposed v9.0 independently. Claude synthesized, critiqued, and extracted what was valid.

### What each source contributed

| Source | Valid signal | Discarded |
|--------|-------------|-----------|
| Perplexity | Best root-cause of v7.0-alpha failure: `document-start` timing, tab conflicts, scope explosion. Best merge priority ordering (P0→P4). | Citations pointed to wrong GitHub repos (`tryghost/ghost`, not ours). |
| Kimi Deep Dive | Tab lock implementation, `safeBoot()` pattern, SHA-256 capsule schema, Timeline/RecoveryEngine code structures. | WebGPU/ONNX/ShadowRealm proposals — zero browser support for userscripts. |
| ChatGPT Software Architect GPT | Definitive verdict on multi-tab: "not_safely_yet". Required fixes named exactly: `tab_ownership_lock`, `conversation_identity_guard`, `active_tab_guard`. Confirmed `pause-on-route-change` and `pre-send dry-run` as high value. | General YAML scorecard had no implementation code. |
| ChatGPT HTML/CSS/JS GPT | `safeBoot()` implementation with rAF + error-to-GM_setValue. `platformHealth()` scoring formula (canRead 25, canInject 30, canSend 30, canExport 15). `gitlSafetyCheck()` sensitive content gate. | Some selector patterns were for a different DOM structure. |
| ChatGPT Code GPT | `ArtifactStore` + `MemoryStore` CRUD patterns with `safeJSONGet/Set`, UID, capped `.slice(-300)`. Directly portable code. | Full architecture tree (Runtime/Knowledge/Orchestration) — too heavy for v7 single-file. |
| ChatGPT Ethical Hacker GPT | "State Graph > Prompt Chain" — store events/objects/relationships not flat text. `diffResponses(a,b)` for cross-model comparison. | Backend server proposals. CRDT/WebRTC. All infeasible for userscript. |
| Gemini Flash | AI_ENDPOINTS list for network interceptor (8 endpoints, directly used). `verifyBasicStructure()` heuristic (3 quick quality checks). | Entire greenfield rewrite — didn't start from v6.9.0, lost 1888 lines of working code. CDN dependencies (Transformers.js 200MB, Dexie.js). `BaseProvider` abstraction solves wrong problem (we inject text, don't call APIs). Auto-executes cross-tab handoffs without user consent — security flaw. |
| DeepSeek | Fallback chain pattern, escalating strategy architecture. | Analyzed a different codebase structure entirely (`script.js` not our userscript). |

### What was cut and why

| Feature | Cut reason |
|---------|-----------|
| Shadow DOM panel isolation (S6) | CSS defense, not blocking for v7. Deferred to v7.1. |
| StateGraph / LangGraph-style routing | Too heavy for single-file userscript. v8+ |
| WebGPU / ONNX local models | No browser support in Tampermonkey context |
| Backend server / REST API | Fundamentally wrong architecture for userscript |
| Community `sites.json` CDN | Infrastructure investment — v8+ |
| Quality gates / adversarial prompt pipeline | Complex infra, not blocking |
| OpenTelemetry | Overkill for GM_setValue-based logging |
| Plugin system / ShadowRealm API | No browser support |
| AI Diff Engine | Interesting, deferred — v8+ |
| GhostHooks (beforeSend/afterSend) | Clean pattern, deferred — v8+ |

### Bugs found by CI tests (found AFTER shipping v7.0.0)

**Bug 1 — HALT-first bypass (CRITICAL)**
- **What broke:** `LEGACY_PROCEED = 'PROCEED'` is a literal substring of `'[[GITL::PROCEED]]'`. When the sigil fired, the legacy check ALSO fired (+3 extra to pScore). With both sigils present: hScore=4, pScore=7. Condition `hScore >= pScore` failed. Proceed won instead of halt.
- **Impact:** The most important invariant in the codebase was silently broken. Any response containing both sigils would always proceed, never halt.
- **Fix:** `else-if` — legacy only fires when sigil is absent. See `detectSignal()`.
- **Lesson:** Never test signal logic manually. String substring matching is non-obvious. This is exactly why we have CI.
- **Test that catches it:** `signal.test.js` — "HALT wins when both sigils present"

**Bug 2 — Non-deterministic SHA-256 fallback (MEDIUM)**
- **What broke:** `gitlSha256()` catch block used `Math.random()`. When `crypto.subtle.digest` throws (e.g. when crypto unavailable), every identical message gets a different hash. Deduplication silently fails.
- **Impact:** Capsule v2 deduplication produces no deduplication in environments without crypto.subtle.
- **Fix:** Replaced `Math.random()` fallback with deterministic djb2 hash.
- **Lesson:** Fallback paths need the same determinism guarantees as primary paths.
- **Test that catches it:** `capsule.test.js` — "same input → same hash"

### What NOT to do next session

- Do not add Dexie.js or Transformers.js as `@require` dependencies — they are CDN-hosted, can break on network issues, and Transformers.js is 200MB
- Do not rewrite from scratch — the existing adapter layer for 20+ platforms took many sessions to tune
- Do not auto-execute received BroadcastChannel messages — security risk
- Do not use `innerHTML = ''` on panel elements that contain ProseMirror editors (Claude, Perplexity) — destroys editor state. Already fixed in v6.0. Do not reintroduce.
- Do not assume `PROCEED` as a standalone legacy keyword is safe — it's a substring of the sigil. Always check sigil first.

---

## Session: v7.0.0-alpha — FAILED BUILD (2026-06-12 night)

### What was attempted
A different Claude session attempted to build v7.0.0 directly from v6.x by adding features without the research synthesis step.

### What failed
- **Script did not load on any site.** Root causes (diagnosed by Perplexity post-mortem):
  1. `document-start` run timing — the script tried to access `document.body` before it existed. `MutationObserver` and `render()` were called at top-level without a boot guard.
  2. No tab ownership mechanism — multiple open tabs all tried to run simultaneously, causing GM_setValue race conditions.
  3. Scope explosion — too many features added in one pass without testing between steps.

### What we learned
- Boot guard is non-negotiable before any DOM or GM access
- Multi-tab conflicts are silent and catastrophic — tab lock must ship before any new features
- Build incrementally, test between every step

---

## Session: v6.0.0 (prior to this log)

### Known decisions (reconstructed)

**MutationObserver + setInterval double-fire race condition**
- Attempted: using both MutationObserver and setInterval to detect response completion
- Failed: both fired simultaneously on the same response, causing double-sends
- Fix: setInterval only as tick driver; MutationObserver debounced and gated by `isSending` lock

**`innerHTML = ''` panel reset**
- Attempted: clearing panel by setting `innerHTML = ''` on the container
- Failed: destroyed ProseMirror editor state on Claude and Perplexity — input became unresponsive
- Fix: use `panel.replaceChildren(newElement)` instead, or target only the GITL panel element

**Unique sigils over keyword matching**
- Attempted: plain `PROCEED` / `SYSTEM_HALT` keyword detection
- Failed: false positives from code blocks, documentation, and AI responses that happened to mention these words
- Fix: `[[GITL::PROCEED]]` / `[[GITL::HALT]]` — bracket format never appears naturally in AI output

**Confidence scoring over binary match**
- Attempted: binary signal detection (match or no match)
- Failed: ambiguous responses (AI writing about the concept of proceeding, or partial matches) caused false fires
- Fix: weighted scoring (sigils +4, legacy +3, fuzzy +2, progress +2) with threshold ≥3

---

## Deferred Work (not failed — just not yet)

| Item | Why deferred | Target |
|------|-------------|--------|
| Shadow DOM panel isolation | CSS defense, not blocking | v7.1 |
| `diffResponses(a,b)` AI Diff Engine | Needs cross-platform message capture infrastructure | v8 |
| StateGraph workflow routing | Requires refactor of loop engine | v8 |
| Remote `sites.json` hydration | Infrastructure + CDN decision needed | v7.1 |
| GhostHooks (beforeSend/afterSend) | Clean pattern, no blocking use case yet | v8 |
| Task type inference (`gitlInferTaskType`) | Routing system not built yet | v8 |
| Platform-specific API export (ChatGPT) | Auth flow varies per account tier | v7.1 |

---

## Push Discipline (required every session)

Every push to `main` must update:

1. **DEVLOG.md** — what was tried this session, what failed, what shipped, any lessons
2. **CHANGELOG.md** — what version shipped, what bugs were found and fixed
3. **README.md** — if any user-facing feature changed (features table, install steps, architecture diagram)
4. **docs/ARCHITECTURE.md** — if any new module was added or internal contract changed

Do not push code without documentation. Future sessions (including other AIs) will read these files before touching the code.
