# Ghost in the Loop — Architecture Reference

**For:** developers, contributors, and AI assistants making changes.
**Read before:** touching any platform adapter, the signal engine, or the loop engine.

---

## File Structure

```
ghost-in-the-loop.user.js    Main userscript (~2400 lines)
extension/
  manifest.json              Firefox MV3 manifest
  content.js                 Built from userscript via sed extraction + GM shim header
tests/
  setup.js                   VM harness: mocks GM_*, injects export hook into IIFE
  *.test.js                  Unit tests (126 total)
docs/
  ARCHITECTURE.md            This file
CHANGELOG.md                 What shipped per version
DEVLOG.md                    What was tried, what failed, why — read before researching
```

---

## Layer Map (in file order)

| Layer | Lines (approx) | Responsibility |
|-------|----------------|----------------|
| **0** | 1–45 | `@UserScript` header, IIFE wrapper, version guard `__GITL_V7__` |
| **0.3** | 46–165 | Constants: VER, sigils, FUZZY lists |
| **0.5** | 166–245 | Boot safety: `safeBoot()`, `claimTabLock()`, `releaseTabLock()`, `assertInteractionSafe()`, `GhostBus` init |
| **0.7** | 246–330 | Network interceptor: `GITL_NET`, fetch/XHR proxy, `AI_ENDPOINTS` |
| **1** | 331–460 | Platform profiles `PROFILES{}`, `_q()`, `_qAll()`, `Adapter{}` |
| **2** | 461–570 | Libraries: `PERSONA_LIBRARY`, `WORKFLOW_LIBRARY` |
| **3** | 571–700 | State: `GHOST{}`, `DIAG{}`, `platformHealth()`, `Timeline{}` |
| **4** | 701–870 | Recovery engine: `RecoveryEngine{}` |
| **5** | 871–935 | Signal engine: `parseProgress()`, `detectSignal()` |
| **6** | 936–1010 | Payloads, roadmap helpers |
| **7** | 1011–1090 | Loop engine: `engineSend()`, `engineHalt()`, `enginePause()`, `engineTick()` |
| **8** | 1091–1250 | Start/stop/queue, SPA route watcher |
| **9** | 1251–1760 | Export: `extractMessages()`, `buildFilename()`, `apiExportChatGPT()`, `buildCapsuleV2()`, `exportCapsuleV2()` |
| **10** | 1761–1800 | Audio |
| **11** | 1801–2300 | UI: `renderXxx()` functions, CSS, `render()` |
| **12** | 2300–2403 | Boot: `safeBoot(() => { ... })`, final IIFE close |

---

## Signal Engine Contract

**Function:** `detectSignal(fullText) → { signal, confidence, progress }`

**Scoring (additive, not exclusive):**

```
Sigil HALT     [[GITL::HALT]]      hScore += 4
Sigil PROCEED  [[GITL::PROCEED]]   pScore += 4
Legacy HALT    SYSTEM_HALT         hScore += 3  (only if sigil absent)
Legacy PROCEED PROCEED             pScore += 3  (only if sigil absent — see Bug 1 in DEVLOG)
Fuzzy HALT     e.g. "task complete" hScore += 2
Fuzzy PROCEED  e.g. "shall i cont." pScore += 2
Custom HALT    user-defined         hScore += 2
Custom PROCEED user-defined         pScore += 2
Progress mid   [Step N of M] N<M    pScore += 2
Progress final [Step N of M] N≥M    hScore += 1
```

**Decision (HALT-FIRST — inviolable):**
```
hScore ≥ 3 AND hScore ≥ pScore  →  halt
pScore ≥ 3                       →  proceed
otherwise                        →  none
```

**⚠ Known footgun:** `LEGACY_PROCEED = 'PROCEED'` is a substring of `[[GITL::PROCEED]]`. The `else-if` guard in the legacy check must never be removed. See DEVLOG.md Bug 1.

---

## Tab Lock Protocol

**Key format:** `gitl:lock:{hostname}:{first 3 pathname segments}`

**Claim:** write `{tabId, ts}` JSON to GM storage. Succeeds if key is empty, expired (>8s), or owned by this tab.

**Heartbeat:** every 5s via `startTabHeartbeat()`. If claim fails during heartbeat, loop is paused.

**Release:** `beforeunload` event. Must clear own entry only — never clear another tab's lock.

**`assertInteractionSafe()`:** called before every `engineSend()`. Returns `{ok, reason}`. Reasons: `ok`, `tab-not-focused`, `tab-lock-held-by-other`.

---

## Platform Adapter Protocol

Each platform entry in `PROFILES{}` must have:

```js
{
  label: 'PlatformName',          // shown in UI
  host:  ['domain.com'],          // matched against location.hostname
  input: ['selector1', 'sel2'],   // tried in order, first match wins
  send:  ['selector1', 'sel2'],
  stop:  ['selector1', 'sel2'],
  assistant: ['selector1'],       // message elements
  inject: 'contenteditable'|'value'|'textarea',
  // optional:
  apiExport: async () => {},       // platform-native export if available
}
```

`Adapter.getInput()` tries each selector in `PLAT.input[]` until one matches.
`Adapter.injectText(el, text)` uses the `inject` mode to set text without destroying editor state.

**⚠ Never use `innerHTML = ''` on platform input elements.** Destroys ProseMirror state on Claude and Perplexity. Use `replaceChildren()` or target only the GITL panel.

---

## Extension Build Process

`extension/content.js` is built from `ghost-in-the-loop.user.js` via:

```bash
# 1. Write GM shim header
cat GM_SHIM > extension/content.js

# 2. Extract engine body (line 43 to end-1, skipping IIFE wrapper lines)
sed -n "43,$((total-1))p" ghost-in-the-loop.user.js >> extension/content.js

# 3. Close the _initStore().then() wrapper
echo '});' >> extension/content.js
```

The GM shim maps `GM_getValue`/`GM_setValue` to `browser.storage.local` via an async init + in-memory cache.

**Do not hand-edit `extension/content.js`.** It is a build artifact. Changes belong in `ghost-in-the-loop.user.js`.

---

## Test Harness — Two Tiers

### Tier 1: Unit tests (jest + jsdom) — `tests/*.test.js`

The userscript is an IIFE — tests can't access its locals directly.
`tests/setup.js` injects an export hook string into the instrumented source just before the closing `})()`. The hook uses `eval(name)` inside the closure to read locals and writes them to a `__GITL_TEST_SINK__` object passed in from the VM context.

**Run:** `npm test` (135 tests)

**Covers:**
- Pure-logic functions (signal engine, Timeline, tab lock, capsule, health scoring)
- Structural/static analysis (module presence, invariants, no-top-level-DOM)

**Cannot catch:** boot-order bugs — jsdom always has `document.body`, so `document-start` timing crashes are invisible here.

### Tier 2: E2E boot-timing (Playwright + chromium) — `tests/e2e/*.spec.js`

Injects the userscript via `addInitScript` (runs at `document-start`, before HTML parse) against `tests/e2e/mock-chat.html`. This is the ONLY tier that catches the class of bug where top-level DOM mutation crashes because `head`/`body` are null.

**Run:** `npm run test:e2e` (requires `npx playwright install chromium`)

**Covers:**
- Script survives `document-start` injection without throwing
- Panel mounts to DOM after boot
- Styles inject without null-head crash
- Boot writes a timeline event (proves script reached end of `safeBoot`)
- DOM read of assistant message

**Why this tier exists:** the v7.0.0-patch2 boot crash (see DEVLOG) shipped because unit tests can't simulate injection timing. Any future boot-order regression is now caught here.

**Naming convention:** unit tests = `.test.js` (jest), e2e tests = `.spec.js` (Playwright). They never collide — jest's `testMatch` is scoped to `.test.js` only.

### Still NOT covered by either tier
- Real AI site DOM (selectors drift per deployment) — test manually on ChatGPT + Claude before shipping adapter changes
- Real SSE network interception
- Tab lock across genuinely separate browser tabs (e2e uses one context)

---

## Network Interceptor Endpoints

```js
'/backend-api/conversation'   // ChatGPT
'/api/organizations'          // Claude
'/socket.io/'                 // Perplexity
'/api/v1/chat/completions'    // DeepSeek / OpenAI-compatible
'/chat/conversation'          // HuggingChat
'/api/chat'                   // Generic
'/bard'                       // Gemini
'/turn/'                      // Copilot
```

The interceptor supplements DOM detection — it does NOT replace it. Sending still requires DOM selector resolution. The interceptor improves response detection latency and reliability, especially on platforms with virtualized DOM that re-renders messages.

---

## Known Platform Quirks

| Platform | Issue | Current handling |
|----------|-------|-----------------|
| Claude | ProseMirror editor — `innerHTML = ''` destroys it | `injectText` uses execCommand or dispatchEvent |
| Perplexity | ProseMirror same issue | Same fix |
| Manus | Virtualized chat — DOM re-renders cause duplicate message extraction | SHA-256 dedup in Capsule v2; harvest scrolls the viewport |
| ChatGPT | Has native API export endpoint | `apiExportChatGPT()` tries `/backend-api/conversation/{id}` |
| Gemini | Send button selector drifts with deployments | Multiple selector fallbacks in `PROFILES.gemini.send[]` |
| Copilot | Uses `/turn/` SSE endpoint | Covered by network interceptor |
