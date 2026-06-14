# Ghost in the Loop — Developer Log

**Purpose:** Every research attempt, failed approach, and architectural decision is recorded here.
Before starting any new work, read the relevant sections — you may be repeating solved problems.

**Format per entry:**
- What was tried
- What happened (outcome)
- Why it failed or why it was chosen
- What to do instead / what we learned

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
