# Ghost in the Loop — Architecture Reference

**For:** developers, contributors, and AI assistants making changes.
**Read before:** touching any platform adapter, the signal engine, or the loop engine.

---

## File Structure

```
ghost-in-the-loop.user.js    Canonical userscript source (~5400 lines)
extension/
  manifest.json              Firefox MV3 manifest
  content.js                 Deterministically generated; never hand-edit
diagnostics/
  gitl-canary.user.js        Standalone execution canary (NOT core; see its README)
  README.md
scripts/
  build-extension.js         Canonical source → Firefox content artifact
tests/
  setup.js                   VM harness: mocks GM_*, injects export hook into IIFE
  *.test.js                  Jest unit and contract suites
  e2e/*.spec.js              Playwright, run in BOTH Chromium and Firefox (Gecko)
docs/
  ARCHITECTURE.md            This file
  RELEASE-CANDIDATE-8.8.md   Candidate/stable boundary and bounded evidence ledger
CHANGELOG.md                 What shipped per version
DEVLOG.md                    What was tried, what failed, why — read before researching
```

---

## Layer Map (in file order)

| Layer | Responsibility |
|-------|----------------|
| **0** | Header, constants, transactional boot, focus guard, and verified tab lease |
| **0.7** | Metadata-only network correlation (`GITL_NET`) |
| **1** | Platform profiles, read-only selector memory, reviewed actuator lookup, and adapter |
| **2** | Persona/workflow libraries and transactional Workshop import |
| **3** | State, health, redacted diagnostics, bounded timeline, and incident reporter |
| **4** | Signal parsing and workflow/roadmap payloads |
| **5** | At-most-once send transaction, confirmation, reconciliation, and loop engine |
| **6** | Validated transcript export, experimental Capsule, and transactional config import |
| **7** | Tokenized UI, basic safety controls, and Advanced surfaces |
| **8** | Fail-loud beacon, isolated boot phases, sentinel, and final startup |

*(Line-number ranges above are approximate and drift with edits; use them as a
reading order, not addresses.)*

---

## Boot Contract (v8.2.0 — transactional)

`safeBoot()` waits for `document.body`, then runs boot as isolated phases:

- **Critical** (`styles → panel → render`): a failure throws → `_gitlFatal()`
  (beacon `error:boot` + visible banner + `GM_notification`). The panel is the
  product; if it can't render, fail LOUD, never blank+silent.
- **Optional** (`continue-observer, heartbeat, tab-lock, bus, panel-sentinel,
  boot-retry, prior-error-surface`): each caught; a failure pushes to
  `GHOST._degraded` + Timeline `boot_phase{ok:false}` and is logged, but can
  never suppress the panel or later phases.
- The singleton `window.__GITL_V8__` is set to `true` **only after** the
  critical phases succeed (a failed attempt no longer blocks a same-page retry;
  an in-flight marker prevents concurrent double-exec).

**Boot beacon** (`<html data-gitl-boot>`): `started` → `ok:<ver>` |
`no-panel:<ver>` | `error:<stage>` | `remounted:N` | `sentinel-open`. Visible in
a plain page-save — the primary field diagnostic.

**Panel sentinel** (`startPanelSentinel`): treats the panel as down when
disconnected OR `display:none`/`visibility:hidden`/zero-size; re-mounts (same
node, state intact); capped 5/30s with a circuit breaker + visible note.
Safe because Ghost never hides its own root (collapse hides only `.g-body`).

**GITL_NET.install()** runs at top level (before `safeBoot`, so it beats the
page's first fetch). Every patch is individually try/caught + the whole method
+ its call site — a hardened page can cost only its own network telemetry,
never the panel.

## Testing engines

E2e runs in **Chromium and Firefox** (`playwright.config.js` advertises the
Firefox project when a Firefox build is present; CI installs both). Firefox is
desktop Gecko — the engine that enforces Trusted Types — not Android GeckoView,
so passes are Gecko-validated, not Android-certified.

---

## Element Lookup and Authority (v8.3)

Input and actuator lookup intentionally have different authority:

1. **Composer observation** — `Adapter.getInput()` tries reviewed profile
   selectors, a previously learned unique read/write composer locator, then a
   role/meaning heuristic. Composer locators may be learned in a 12-host LRU.
2. **Reviewed Send authority** — `Adapter.getSendBtn()` calls `_reviewedSend()`.
   The platform must be marked reviewed, and a configured selector must resolve
   to exactly one visible, enabled, veto-safe element.
3. **Diagnostic Send candidate** — `_heurSend()` may identify a likely control
   for the probe/report, but that element is never clicked.
4. **No actuator memory** — `SelectorMemory.learn('send', …)` and
   `lookup('send')` delete the entry and return `null`.
5. **Cross-cutting veto** — `_sendLooksSafe()` rejects popup toggles, structural
   mismatches, and message-action controls such as Copy/Share/Attach.

`reDetect()` is retrying (12 s MutationObserver + interval) and clears all
caches including the heuristic tier's; a `visibilitychange` handler silently
drops caches when the cached composer is found detached.

Generic/custom sites may receive injected text but remain manual-send until an
adapter is reviewed. Compatibility cannot silently grant actuator authority.

---

## Structural Mount Authority (8.8 candidate)

The 8.8 structural mobile-shell work adds a **separate structural authority plane**. It does not widen input or Send actuation authority.

The accepted structural-selection order is fail-closed:

1. **Certified site-specific structural runner** — eligible only when reviewed site identity and the adapter-owned current structural capability/signature satisfy its certified contract.
2. **Standard adapter-aware structural protocol** — used when the specialized contract is unavailable or fails verification but the standard protocol can verify the host structure safely.
3. **Existing rail fallback** — used when structural capability is absent, stale, clipped, ambiguous, wrong-site, or otherwise unverifiable.

The specialized runner must **demote**, not guess, when its signature fails. A reviewed hostname or Send selector is not sufficient structural authority. Structural mounting preserves the original connected Send-node identity and passive mount/repair paths have no Send, submit, input, or keydown authority.

The accepted ChatGPT + Claude evidence is deterministic/hosted and adapter-owned. It does **not** certify exact current live ChatGPT or Claude insertion. Physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance are also outside the certified scope. Read-only live inspection is separately authorized when a functioning carrier exists; missing capture limits live binding rather than deterministic repository work.

See [RELEASE-CANDIDATE-8.8.md](RELEASE-CANDIDATE-8.8.md) and `.gitl/evidence/round-6/final-mobile-shell-audit-retry.md` for the bounded claim ledger.

---

## 8.8 Candidate Identity and Publication Boundary

The release candidate is not identified by a mutable Git HEAD alone. The bounded BUILD-IDENTITY contract combines:

- semantic version `8.8.0`;
- canonical userscript source plus deterministic generated extension parity;
- immutable hashes of the shipped payload set;
- explicit Git provenance and exact test/CI bindings;
- explicit candidate-versus-stable channel classification;
- independent publication state.

A coordination-only `.gitl` commit may move the branch head without producing a new shipped payload. The identity oracle reports that relationship explicitly rather than pretending the older payload-provenance head is the current exact coordination head.

The isolated `agent/8.8-repair-resume` branch is a **candidate channel**. Stable userscript install/update authority remains `main`, and `publishReady=false` until a separately authorized release step changes that state. Documentation, CI, or candidate completeness alone cannot authorize a merge, tag, GitHub Release, store upload, or stable-channel URL change.

The current dependency disposition is similarly bounded: `brace-expansion@1.1.15` and `js-yaml@3.14.2` are real high-severity indirect nodes in the Jest development graph; the production omit-dev audit reported zero vulnerabilities and no concrete path into the immutable shipped payload was established. Shipped exploitability remains **UNKNOWN / NOT CLAIMED** rather than being declared impossible.

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

**Claim:** write `{tabId, ts}` JSON to GM storage. Succeeds if the key is empty,
expired (>8s), or owned by this tab.

**Pre-actuator verification:** `verifyTabLease()` claims, yields for a short
jitter, then re-reads the key. If two tabs raced from an empty lock, only the
last stored owner reaches the button click.

**Heartbeat:** every 5s via `startTabHeartbeat()`. If claim fails during heartbeat, loop is paused.

**Release:** `beforeunload` event. Must clear own entry only — never clear another tab's lock.

**`assertInteractionSafe()`:** called before every `engineSend()`. Returns `{ok, reason}`. Reasons: `ok`, `tab-not-focused`, `tab-lock-held-by-other`.

---

## Send Transaction Contract (v8.7)

`engineSend()` injects into the resolved composer, verifies that the complete
normalized prompt was actually retained, verifies the tab lease, and selects
exactly one reviewed strategy before the journal opens. A unique reviewed
button wins. An adapter may explicitly opt into one Enter `keydown` only when
no reviewed button resolves. After `_beginSendAttempt()`, no fallback selection
or second actuator is allowed.

The journal state is:

```
dispatching → committed
           ↘ uncertain → committed | failed  (human reconciliation only)
           ↘ failed
```

- `_promptStagedInComposer()` compares the intended and observed composer text;
  a mismatch produces `COMPOSER-002` before any journal or actuator exists.
- `_beginSendAttempt()` records a command id and pre-dispatch observations.
- `_confirmSend()` is the only automatic state transition that increments
  `round` or advances roadmap/workflow state.
- `_sendEvidence()` accepts an assistant DOM transition, or composer-cleared
  plus a visible generation control/trusted correlated network pulse.
- A network pulse alone, a cleared composer alone, or elapsed time never proves
  delivery.
- `_markSendUncertain()` pauses, creates `SEND-002`, and does not retry.
- Crash recovery restores interrupted `dispatching` work as `uncertain`; it
  never replays the command.

Do not introduce universal Enter, form-submit, refocus, multi-click, or retry
fallbacks. Adapter-approved Enter is a pre-journal strategy, never a recovery
step. At-most-once behavior is a product invariant, not a temporary
compatibility tradeoff.

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
  useCE: true|false,              // contenteditable injection path
  useNS: true|false,              // native textarea setter path
  dispatchFallback: 'enter',      // optional, reviewed adapter only
  // optional:
  apiExport: async () => {},       // platform-native export if available
}
```

`Adapter.getInput()` tries each selector in `PLAT.input[]` until one matches.
`Adapter.injectText(el, text)` uses the `inject` mode to set text without destroying editor state.

**⚠ Never use `innerHTML = ''` on platform input elements.** Destroys ProseMirror state on Claude and Perplexity. Use `replaceChildren()` or target only the GITL panel.

---

## Workshop Layer (community content)

Custom personas & workflows live in the `Workshop` module, layered on top of the immutable built-in `PERSONA_LIBRARY` / `WORKFLOW_LIBRARY` constants.

**Read path:** all consumers go through `allPersonas()` / `allWorkflows()`, which return `Object.assign({}, BUILTINS, Workshop.<store>)`. Built-ins always win on key collision at read time; the store is merged on top only for distinct keys. Never read the raw `*_LIBRARY` constant for resolution/UI — always the accessor — or custom items vanish.

**Stores:** `Workshop.personas` / `Workshop.workflows`, persisted as JSON under GM keys `customPersonas` / `customWorkflows` (both in `GM_KEYS`). Loaded once in `safeBoot` via `Workshop.load()`.

**Invariants (enforced + unit-tested in `tests/workshop.test.js`):**
- Built-in ids are immutable. `importBundle`/`addX` seed the "taken" set with built-in keys, so a clashing import is auto-renamed (`researcher` → `researcher_2`), never an overwrite.
- Import requires exact schema and field sets. The entire bundle validates before
  any state changes; one invalid item rejects the batch.
- Safety caps in `WORKSHOP_LIMITS`: 512 KB file (checked before `JSON.parse`),
  200 items, label 40, inject 4000, desc 200, stage 2000, and ≤20 stages.
- Writes are staged. If any persistence step fails, prior memory/storage values
  are restored.
- All custom text is rendered through `_esc()` before interpolation into panel `innerHTML`. Imported strings are untrusted — without this they could inject markup into Ghost's own UI.

**Bundle format** (`exportBundle`):
`{ schema:'gitl-workshop/1', tool, version, exported, personas:[{id,label,inject}], workflows:[{id,label,desc,stages[]}], skin? }`.
`schema` is mandatory and unknown top-level/item fields are rejected.

**UI:** create forms + ★-badged custom items with tap-twice delete in Roles (personas) and Flow (workflows); shared `⬆ Import / ⬇ Export / 🌐 Share` row in both; Share deep-links to the `workshop` help section (GitHub Discussions + `workshop`-tagged issue submission).

---

## Extension Build Process

`extension/content.js` is built from `ghost-in-the-loop.user.js` via:

```bash
npm run build
npm run check:generated
```

`scripts/build-extension.js` finds the userscript metadata terminator, takes the
runtime verbatim, and wraps it with the Firefox GM compatibility layer. No line
number or shell-text extraction is involved. `--check` performs an exact parity
comparison and exits nonzero on drift.

**Do not hand-edit `extension/content.js`.** It is a build artifact. Changes belong in `ghost-in-the-loop.user.js`.

---

## Test Harness — Two Tiers

### Tier 1: Unit tests (jest + jsdom) — `tests/*.test.js`

The userscript is an IIFE — tests can't access its locals directly.
`tests/setup.js` injects an export hook string into the instrumented source just before the closing `})()`. The hook uses `eval(name)` inside the closure to read locals and writes them to a `__GITL_TEST_SINK__` object passed in from the VM context.

**Run:** `npm test`

**Covers:**
- Signal engine, Timeline, verified tab lease, send transactions, redaction,
  export contracts, config/Workshop rollback, Capsule preservation, and health
  scoring.
- Structural/static analysis, generated-source parity, schema and injection
  invariants.

**Cannot catch:** boot-order bugs — jsdom always has `document.body`, so `document-start` timing crashes are invisible here.

### Tier 2: E2E boot/send safety (Playwright) — `tests/e2e/*.spec.js`

Injects the userscript via `addInitScript` (runs at `document-start`, before HTML parse) against `tests/e2e/mock-chat.html`. This is the ONLY tier that catches the class of bug where top-level DOM mutation crashes because `head`/`body` are null.

**Run:** `npm run test:e2e` (requires an installed browser binary; GitHub
Actions installs Chromium and Firefox). Managed terminals may set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chromium`. The mobile
staging contract also runs with Playwright's Pixel 7 device profile.

**Covers:**
- Script survives `document-start` injection without throwing
- Panel mounts to DOM after boot
- Styles inject without null-head crash
- Boot writes a timeline event (proves script reached end of `safeBoot`)
- DOM read of assistant message
- Trusted Types boot behavior and Send-target safety reproductions

**Why this tier exists:** the v7.0.0-patch2 boot crash (see DEVLOG) shipped
because unit tests cannot simulate injection timing. Firefox also exercises the
Gecko/Trusted Types path that previously escaped Chromium-only validation.

**Naming convention:** unit tests = `.test.js` (jest), e2e tests = `.spec.js` (Playwright). They never collide — jest's `testMatch` is scoped to `.test.js` only.

### Still NOT covered by either tier
- Real AI site DOM (selectors drift per deployment) — test manually on ChatGPT + Claude before shipping adapter changes
- Real SSE network interception
- Tab lock across genuinely separate browser tabs (e2e uses one context)

For the 8.8 structural candidate, deterministic ChatGPT/Claude fixtures and hosted matrices add bounded evidence, but they do not change the list above into live-site certification. Exact current live structural insertion still requires qualifying live evidence.

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
| Manus | Virtualized chat may omit or repeat rendered turns | Harvest scrolls; DOM export remains `partial`; Capsule preserves repeats instead of deleting them |
| ChatGPT | Has native API export endpoint | `apiExportChatGPT()` validates supported-turn counts; DOM fallback is visibly `partial` |
| Gemini | Send button selector drifts with deployments | Reviewed selectors only; no heuristic actuator promotion; real-device failures remain device-testable |
| Copilot | Uses `/turn/` SSE endpoint | Covered by network interceptor |
