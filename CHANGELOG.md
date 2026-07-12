# Changelog

## [8.1.1] — SELF-HEALING BASE

### 🐞 FIX — DeepSeek clicked "Copy" instead of Send (field report)
The heuristic send-finder scored ANY icon button near the composer (svg icon +1,
proximity +3 = past the 3.5 threshold), so DeepSeek's message "Copy" button won
and the prompt got copied instead of sent.
- **Semantic gate:** a candidate now needs a POSITIVE send signal (send word in
  its label, `type=submit`, or same `<form>` as the composer). Icon + proximity
  alone can never win again.
- **Veto list expanded** to every message-action verb: copy, download, share,
  edit, delete, regenerate, retry, like/dislike, read-aloud, translate, DeepThink…
- **The veto now guards EVERY tier** — configured selectors and learned selectors
  pass through `_sendLooksSafe()` too, so a rotted `div[class*="send"]` match
  can't hand back a share widget.

### 🐞 FIX — Models that don't echo the sigil stranded the loop ("No signal detected")
DeepSeek (and some custom GPTs) answer fully but never print `[[GITL::PROCEED]]`.
The run used to hard-pause after ~12 s of quiet.
- **Sigil-free completion fallback:** when a reply finishes (generation ended,
  text stable) with no sigil, Ghost now auto-continues ONCE with a protocol
  reminder, and only pauses after **2 consecutive** sigil-free replies.
  Every nudge still consumes a round, so drift guard / round limit keep their grip.
- Streak resets the moment a real PROCEED/HALT arrives.
- Fixed a latent crash: `Timeline.add()` (no such method) in the roadmap re-ask path.

### 🔄 Re-detect actually finds the box now (field report: "refresh sometimes fails")
Re-detect was one-shot — pressed at the exact moment an SPA is mid-remount, it
missed and told you to try again.
- **Keeps watching for 12 s** after a miss (MutationObserver + interval); reports
  success the moment the composer appears, with a spinning 🔄 the whole time.
- Clears **all** element caches now (the heuristic tier's 4 s cache was missed before).
- Resets stale network stream counters (aborted background XHRs could fake
  "still generating" after an app-switch).
- One-time gentle focus nudge for editors that only mount their composer on focus
  (never steals focus if you're typing somewhere).
- **Silent self-heal:** returning to the tab with a detached cached composer now
  drops caches automatically — most manual 🔄 presses just disappear.

### 🧠 NEW — Selector Memory (self-healing locators)
The industry-standard tier GITL was missing (Healenium-style): when configured
selectors fail but the role/meaning heuristic finds the element, Ghost derives a
STABLE selector from it (id > data-testid > aria-label > name > placeholder) —
verified unique — and remembers it per-host. Next session tries the learned
selector right after the configured ones, so a site redesign pays the heuristic
cost once and the fix survives reloads. Capped at 12 hosts, self-pruning,
learned send-selectors are veto-checked.

### ⚠ Reporter — deduped + deeper
- Identical auto-captures within 10 min no longer rebuild/re-send duplicates
  (the `_seen` dedupe was declared in v7.1 but never wired).
- Reports now include learned-selector state for the host.
- 🔍 Probe selectors now shows all three tiers: configured / learned / heuristic.

### 🌐 Workshop — share does the work now
- **Share button** copies a paste-ready GitHub Discussions post: item list +
  the full `.gitl.json` bundle in a code block. Then opens the how-to.
- **Skins ride in the bundle:** exporting includes your active custom skin
  (validated tokens only); importing a bundle with a skin applies it. A single
  file now shares a complete look-and-brains pack. Skin-only bundles are valid.
- Import stays additive-only: built-ins immutable, clashes auto-rename,
  invalid skins skipped, never fatal.

## [8.1.0] — 2026-07-12

First production release since 8.0.0. Promotes dev builds d6–d13. Two of these are correctness fixes for things that were silently broken in 8.0.0.

### Fixed
- **Personas, thinking posture and strategy never reached the model.** The directive block was assembled on exactly one code path — "user typed a fresh prompt." Starting a run from the Personas tab, resuming an existing chat, or un-pausing all sent a bare `Continue.` So unless you retyped your task every time, nothing you configured was ever transmitted. Now built by `runDirectives()` and delivered once per run on **every** entry path.
- **Network detection was dead in production.** `GITL_NET` patched the *sandbox* `window.fetch`; under `@grant GM_*` the userscript is isolated, so the page's real requests never crossed the hook (it only ever "worked" in the test harness). Now hooks `unsafeWindow` — the page's real window.
- **Perplexity paused itself mid-thought.** Deep Research produces no DOM growth and no stop button for minutes, tripping the stale-tick counter. The stale counter is now held while the network channel shows the model is still working. Per-platform stale budgets.
- **Send failed silently when a site redesigned its buttons.** Added heuristic role/meaning-based element finders, `form.requestSubmit()` and ClipboardEvent paste tiers, and per-host tier memory.

### Added
- **Skin engine** — skins are *data*, not code: a whitelist of CSS custom properties plus enumerated effect flags. A skin cannot add, remove, or restructure controls, and unknown tokens are dropped, so community skins stay compatible across versions. 13 presets (Classic, Aurora, Glass, Metal, Neon, Clay, Liquid, OLED, Paper, HUD, Nova, Ion, Flow), import/export as `.gitl.json`, one-tap accent swatches + hue slider. See `docs/SKINS.md`.
- **🌙 Unattended mode** (opt-in, default off) — keeps a run going in a background tab. Relaxes only the focus guard; the tab lock is never relaxed. Moves the engine loop onto a Web Worker ticker, since browsers throttle hidden-tab timers. The tab must stay open — this is not server-side execution.
- **🔎 Explain mode** — tap ⓘ, then tap any control for a plain-English description; the click is swallowed so nothing fires.
- **Modular Run tab** — Transport and Progress are bordered units with icon headers. Strategy and Thinking live under Advanced.
- Roadmap auto-recovery: one automatic format re-request when the model plans but omits the `[[GITL::ROADMAP]]` block.

### Changed
- Thinking postures renamed to say what they do: **Locked** (exact plan) · **Adaptive** (plan may grow mid-run) · **Audit** (locked plan + final gap review). Storage keys unchanged.
- Export actions are now a divided-row list: **Export** (full record) · **Capsule v2** (resumable JSON) · **Handoff** (AI briefs the next chat) · **Backup Handoff** (Ghost writes a lighter one when the chat is dead).
- Collapsed dock shows a progress bar and step count instead of raw counters.
- 180 ms panel entrance animation.

### Testing
468 unit tests passing. Playwright e2e has **not** been run against live sites for this release.


## [8.0.0] — DEV BUILD (features complete, UI reskin pending)

> Working build. Not pushed. Items below are locked + unit-tested unless marked ⏳ unfinished.

### Send-confirmation watchdog (fixes mobile stuck-screen)
A send was previously assumed successful the instant the button was clicked / Enter pressed. If a notification stole focus at that exact moment (`assertInteractionSafe` blocks on `!document.hasFocus()`), the keystroke could be swallowed and the loop would sit parked forever. Now, after every send, generation must actually begin — `Adapter.isGenerating()` true OR output text grows — within `SEND_CONFIRM_MS` (9s). If not, the send re-fires up to `SEND_MAX_RETRIES` (2) before pausing with a captured report. New helpers: `_onSendOk`, `_confirmSend`, `_refireSend`; confirmation branch at top of `engineTick`.

### Round limit → soft checkpoint (fixes "stopped short at 19/20")
Root cause of the early-stop reports: `maxRounds` (default 20) hard-paused a chat that was legitimately running longer (e.g. to 24). The cap now pauses in a dedicated `LIMIT` state instead of stranding the run — *"Hit 20 auto-continues — still going. ▶ to run 20 more."* One tap (expanded panel, collapsed mini-bar, or Alt+P, all via new `primaryAction()` dispatcher) extends the cap by one increment and resumes. Asks again every increment, so a runaway loop still can't burn tokens unattended. New: `engineLimit()`, `extendLimit()`, `LIMIT` state in status/mini-bar with pulsing ▶.

### Reporter module (zero embedded credentials)
Structured trouble reports assembled automatically on send-unconfirmed, early stalls, and probe failures; plus a manual "⚠ Report a problem" button. Pluggable transport: clipboard copy (default), pre-filled GitHub issue URL (one tap, no login-as-maintainer), and a drop-in `REPORT_WORKER_URL` slot for a future silent relay. No write token is ever shipped in the script. In-panel banner with 📋 Copy / ↗ Open issue.

### Flow tab — usability rebuild
Previously a dead end on mobile: select a workflow, see "Reset", no ▶, no guidance, tapping a stage did nothing. Now: a ▶ Start workflow button on the tab itself, plain-language "how this works," per-stage vertical INSERT buttons (drop one stage's prompt into the chat box manually), and ▶ Start respects the Pause-between toggle (required for Lens Relay model-swapping). New: `startWorkflow()`, `insertPrompt()`.

### Per-tab help icons
Each tab gets a small `?` that deep-links to that tab's help section, with a back button that returns to the originating tab. New `TAB_HELP` map, `prevTab` state.

### Workshop — community content (custom personas & workflows)
Create custom personas (Roles) and workflows (Flow), each with a ★ badge and tap-twice delete. Export all custom items to one shareable `.gitl.json` bundle; import others' bundles additively (built-ins immutable, custom-id clashes auto-rename). Shared Import/Export/Share row in both tabs; Share deep-links to GitHub Discussions + `workshop`-tagged issue submission. Safeties: 512 KB/200-item caps, field truncation, per-item validation, and `_esc()` markup-injection guard on all custom text. New `Workshop` module + `allPersonas()`/`allWorkflows()` merge accessors. Covered by 17 new unit tests (`tests/workshop.test.js`).

### ⏳ Unfinished in this build (do not release until done)
- Evolving / Extended thinking-posture prompts (synthesize from Perplexity research dump)
- Firefox `content.js` rebuild from this engine
- Playwright e2e re-run (unit at 157/157)
- README pass

## [7.0.0] — STABLE (2026-06-14)

**51/51 e2e tests passing across 11 Playwright spec files. 140/140 unit tests passing.**

All real bugs found by Replit's test suite have been fixed. The boot-a failure that persisted across multiple Replit rounds was confirmed as stale-code false positive — our fix was already in main, and Replit's fresh-checkout run confirms 51/51 green.

### Test coverage at stable
135 unit tests (jest) + 51 e2e tests (Playwright chromium). Runs on every push via GitHub Actions two-job CI (unit + e2e jobs).

### Complete bug history for this version

| Patch | Bug | Found by | Fixed |
|-------|-----|----------|-------|
| patch1 | HALT-first bypass — `LEGACY_PROCEED` is substring of sigil, double-counting defeated halt invariant | CI (jest signal.test.js) | else-if guard on legacy keywords |
| patch1 | Non-deterministic SHA-256 fallback used Math.random() | CI (jest capsule.test.js) | djb2 deterministic hash |
| patch2 | `GM_addStyle` + `panel.appendChild` at module scope crashed at document-start | Replit Playwright round 1 | `injectStyles()` + `mountPanel()` inside `safeBoot()` |
| patch3 | Input selectors matched GITL's own settings textarea | Replit Playwright round 2 | `_isOwnUI()` excludes `#gitl` descendants from all DOM queries |
| patch4 | MutationObserver blind to CSS-revealed Continue buttons | Replit Playwright round 3 | Added `attributes: true` with `attributeFilter` to observer |



From Replit e2e round 3.

### Improvement
- **MutationObserver now watches attributes** (`style`, `class`, `hidden`, `disabled`, `aria-hidden`) in addition to childList/subtree. A "Continue generating" button revealed via CSS (rather than freshly inserted into the DOM) now triggers the auto-click fast-path. Still debounced 300ms and gated on `state === 'RUNNING'`.

### Not bugs (documented in DEVLOG)
- Export returning early on a page with zero messages is correct behavior, not a defect. An empty conversation has nothing to export.

### Tests
- `tests/e2e/behavior.spec.js` added.

## [7.0.0-patch3] — Own-UI selector exclusion (2026-06-13)

From Replit e2e round 2.

### Bug fix
- **Selector collision with own UI:** the input/recovery selectors (e.g. `textarea:not([disabled])`) could match GITL's own settings textarea (`#cfg-sites`). Added `_isOwnUI(el)` helper; `_q()` and `_qAll()` now skip any element inside `#gitl`. Hardened `mountPanel()` to remove a stray pre-existing `#gitl`.
- Tests: 5 static-analysis tests in `structure.test.js`. Unit suite now 140.

### Not a regression (documented in DEVLOG)
- Replit's reported boot crash at "line 1978" was a stale checkout predating patch2. Live `main` has the panel mount inside `mountPanel()` within `safeBoot()`, fully guarded.

## [7.0.0-patch2] — Boot Crash Fix (2026-06-13)

Found by a Replit headful Playwright test injecting at `document-start` — the timing our unit tests couldn't simulate.

### Bug fix (CRITICAL — script failed to load)
- **Top-level DOM mutation crash:** `GM_addStyle()` and `document.body.appendChild(panel)` ran at module-eval time, outside `safeBoot()`. At `document-start`, `document.head` and `document.body` are null → `TypeError: Cannot read properties of null (reading 'appendChild')` → script halted before any storage write.
- **Fix:** Wrapped both in deferred functions (`injectStyles()` with head/documentElement fallback; `mountPanel()` with null-body guard), called inside `safeBoot()` before `render()`. Added idempotency guards.
- **Lesson:** `safeBoot()` only protects code inside its callback. Zero DOM mutation allowed at top level.

### Tests added
- `tests/boot.test.js` — 9 static-analysis tests ensuring no unguarded top-level DOM mutation. Unit suite now 135 tests.
- `tests/e2e/boot.spec.js` — 6 Playwright tests injecting at real `document-start` timing against `tests/e2e/mock-chat.html`. This is the tier that actually reproduces the crash.
- CI now runs two jobs: `unit` (jest) and `e2e` (Playwright + chromium).

### Known gap (now closed)
- Unit tests run in jsdom where `document.body` already exists — they cannot catch `document-start` boot-order bugs. The Playwright e2e tier closes this gap.

## [7.0.0-patch1] — CI Bug Fixes (2026-06-13, same day as v7.0.0)

Found by the 126-test CI suite that was added alongside v7.0.0. Both bugs were in the code before CI existed — they shipped silently.

### Bug fixes

**HALT-first bypass (CRITICAL)**
- `LEGACY_PROCEED = 'PROCEED'` is a substring of `'[[GITL::PROCEED]]'`. When the sigil fired, the legacy keyword check also fired, adding 3 unearned points to `pScore`. With both sigils present: `hScore=4`, `pScore=7` → condition `hScore >= pScore` failed → proceed won.
- Impact: any response containing both sigils would always proceed, never halt. The most important invariant was silently broken.
- Fix: `else-if` — legacy check only fires when the sigil is absent. See `detectSignal()`.
- Test: `signal.test.js` — "HALT wins when both sigils present"

**Non-deterministic SHA-256 fallback (MEDIUM)**
- `gitlSha256()` catch block used `Math.random()`. When `crypto.subtle.digest` throws, identical messages got different hashes every time → deduplication silently failed.
- Fix: Replaced `Math.random()` with deterministic djb2 hash in fallback path.
- Test: `capsule.test.js` — "same input → same hash"

### CI infrastructure added
- `tests/setup.js` — VM harness with GM_* mocks, crypto shim, history shim, IIFE export hook
- `tests/version.test.js` — version consistency (8 tests)
- `tests/structure.test.js` — S0-S5 module presence + security invariants (44 tests)
- `tests/signal.test.js` — `detectSignal()` + `parseProgress()` (21 tests)
- `tests/timeline.test.js` — Timeline record/cap/query/persistence (8 tests)
- `tests/health.test.js` — `platformHealth()` scoring + `randomDelay()` bounds (9 tests)
- `tests/capsule.test.js` — SHA-256 dedup + capsule v2 schema (15 tests)
- `tests/tablock.test.js` — tab lock claim/release/expiry/corrupt (13 tests)
- `.github/workflows/test.yml` — runs on every push + PR to main

## [7.0.0] — The Runtime Controller

Built from a multi-AI research synthesis: 7 analysis documents, 5 ChatGPT GPT sessions (Code, Ethical Hacker, HTML/CSS/JS, Software Architect), DeepSeek, Gemini, Perplexity, and Kimi — each analyzing the codebase, competitors, and failure modes independently. Claude synthesized, critiqued, and built.

### S0 — Boot Safety (fixes v7.0-alpha loading failures)
- **`safeBoot()`**: rAF + DOMContentLoaded boot guard — MutationObserver and render only fire once document.body exists. Catches and logs boot errors to GM storage.
- **Tab lock**: `crypto.randomUUID()` per-tab identity, heartbeat every 5s via `GM_setValue` with 8s expiry. Only one GITL instance per conversation route runs the loop. Auto-pauses if lock is lost.
- **Focus guard**: `assertInteractionSafe()` gate on every `engineSend` — blocks sends when tab lacks focus or another tab holds the lock. Prevents background token burn.
- **`beforeunload` cleanup**: releases tab lock on tab close.

### S1 — Network Interceptor
- **Fetch proxy**: intercepts `window.fetch` responses to known AI endpoints, clones the stream, parses SSE `data:` lines in a non-blocking background reader.
- **XHR proxy**: fallback for platforms not using fetch — hooks `XMLHttpRequest.prototype.open/send`.
- **8 endpoint patterns**: ChatGPT, Claude, Perplexity, DeepSeek, HuggingChat, Gemini, Copilot, generic.
- **`GITL_NET.bus`**: `EventTarget` emitting `gitl:net` custom events with `{raw, isDone, ts}`. Supplements DOM detection — does not replace it.

### S2 — Selector Doctor + Health Badge
- **`platformHealth()`**: scores platform readiness 0–100 across four axes: canRead (25), canInject (30), canSend (30), canExport (15).
- **🟢🟡🔴 badge**: visible in panel header next to platform name. Green ≥80, Yellow ≥40, Red <40.
- **Diagnostics integration**: health score, network interceptor status, and tab ID shown in Diagnostics panel.

### S3 — Timeline (Event Log)
- **Append-only event log**: capped at 500 entries in `GM_setValue`. Records boot, send success/failure, halt, pause, diagnostics, recovery attempts, exports.
- **`Timeline.record(type, data)`**: every significant system event is logged with platform, workflow, and ISO timestamp.
- **`Timeline.failures()`** and **`Timeline.since(ms)`**: query helpers for observability and failure learning.

### S4 — Recovery Engine + GhostBus
- **`RecoveryEngine.recoverSend(text)`**: 5-strategy escalation chain with exponential backoff (500ms→1s→2s→4s→8s): contenteditable reinsert → native setter → direct value → Enter key dispatch → refocus + retry. Every attempt logged to Timeline.
- **Wired into `engineSend`**: when primary inject or input-finding fails, RecoveryEngine takes over before pausing.
- **`GhostBus`**: `BroadcastChannel('gitl.bus.v1')` for cross-tab communication. Discovers peer tabs, sends handoff capsules. **Security**: received handoffs are stored for user to manually apply — never auto-injected.

### S5 — Enhanced Export: Capsule v2
- **`gitlSha256(text)`**: Web Crypto API hash for message deduplication — eliminates duplicates from virtualized DOM re-renders.
- **`buildCapsuleV2(messages)`**: produces `gitl.capsule.v2` JSON with DAG-linked messages (parentId), SHA-256 fingerprints, resume token, health snapshot, and timeline summary.
- **💊 Capsule v2 button**: new export option in the Export tab. Downloads `.gitl.json` files.
- **Deduplication count**: capsule reports how many duplicate messages were removed.

### Architecture
- Version guard updated to `__GITL_V7__`
- All v6.9.0 features preserved: 20+ platform adapters, workflows, personas, diagnostics, export modes, handoff, roadmap autopilot, prompt queue, API-first export, rescue mode, walk-away alerts.
- Extension wrapper rebuilt for Firefox MV3.

## [6.9.0] — Standing on Shoulders

We audited the top open-source exporters' actual code (pionxzh/chatgpt-exporter 2.5k★, socketteer/Claude-Conversation-Exporter, SaveMyPhind, claude-chat-handoff) to absorb their lessons instead of re-living their bugs.

### The lesson
The mature exporters don't scrape the DOM — they call the platform's own conversation API: complete history, exact roles, structured thinking, immune to virtualization and UI redesigns.

### Added — API-first export
- **ChatGPT**: session token via `/api/auth/session`, conversation via `backend-api/conversation/{id}`, then a parent-pointer walk of the node tree from `current_node` — which correctly resolves branches and regenerations, something DOM scraping can never do (technique: pionxzh)
- **Claude**: `/api/organizations/{org}/chat_conversations/{id}?tree=True&render_all_tools=true` — full tool calls and thinking blocks as structured data (technique: socketteer), **improved**: orgId is auto-fetched from `/api/organizations` instead of making the user paste it manually (their #1 setup complaint)
- DOM extraction remains as automatic fallback (and the primary path on Manus, Gemini and others without a mined API — our virtualized harvest stays unique there)
- Veil shows a short "Fetching from platform archive" flow on the API path; failures log to Diagnostics and fall through silently to DOM


## [6.8.1]

### Added
- Quiet "♡ Support Ghost" link: footer of the Setup tab and the Help → Feedback section, in both the userscript and the Firefox extension. Points at GitHub Sponsors via a single `SUPPORT_URL` constant (one-line swap if the destination ever changes). Deliberately muted styling — visible to those who look, invisible to those who don't.


## [6.8.0] — Structure Survives

### Fixed
- **Tables export as tables**: Manus (and any platform's) HTML tables were flattening into numbered-list soup in exports. Extraction now serializes every `<table>` into a proper markdown pipe table in place.

### Added
- **📎 File manifest**: Manus creates files mid-task (scripts, PRDs, syntheses — its working artifacts). Exports now end with a "Files created in this task" list so nothing silently vanishes, with a reminder that contents live in Manus's file panel and should be downloaded before the session expires.
- **FUNDING.yml scaffold** (commented/inert): uncomment a line and add a handle to activate GitHub's Sponsor button.

### Honest limits
- File CONTENTS can't be scraped from the chat DOM — Manus stores them server-side behind its viewer. The manifest tells you what to download; pulling actual contents would need Manus's authenticated API and is out of scope for a userscript.


## [6.7.0] — Evidence-Based Handoff

The generic "Capsule" is gone. We researched how the community actually transfers context between AI models (handoff extensions, claude-chat-handoff, the Handoff Prompt pattern, conversation-handoff MCP) and rebuilt around the validated patterns.

### What the research said
- Context transfer between models is a real, established need — it's a whole product category
- The consensus format is an **AI-written structured briefing**, not a scraped transcript: raw transcripts bury decisions in noise
- A scraped file has exactly one irreplaceable job: a chat that's **full/stuck and can't be prompted anymore**

### Changed
- **📦 Capsule file → 🛟 Rescue file**: purpose-named for its real use case (dead/stuck chats). Now includes the last 10 messages VERBATIM (both roles), mission, state, and resumption instructions — modeled on the proven stuck-chat recovery format.
- **📦 Ask in chat → 🤝 Handoff**: promoted to the primary transfer path, since the AI's own structured briefing is the community-validated format.
- Export tab and Help now teach the three-purpose model: *Working chat → Handoff. Dead chat → Rescue. Records → Export.*


## [6.6.0] — The Veil

Export is no longer a silent mystery. Users see what's happening, how far along it is, and have a safe way out.

### Added — export progress overlay ("the Veil")
- Screen dims softly; a 👻 with a spinning ring sits center-stage with a named step list: Reading chat → Opening thinking blocks → Collecting every message → Building your file (✓ done / ▶ current)
- **Real progress bar** with % — computed from the actual page length on virtualized chats; indeterminate slide animation when a phase has no measurable length
- **Stall watchdog**: quiet for 8s → "Still working — the page is slow. Don't reload." Quiet for 25s → "This looks stuck. Cancel is safe — Ghost keeps what it collected."
- **Safe Cancel**: aborts the harvest mid-scroll and exports everything collected so far — no more page reloads out of uncertainty

### Changed — the Capsule earns its keep
- Now opens with a one-line purpose statement: *a baton, not a record — paste into a fresh AI to continue; use Export for the full transcript*
- Captures the **Mission** (your first prompt) and the last **5** outputs, alongside roadmap position and state
- **Idle guidance**: exporting a capsule with no loop state (no roadmap, no workflow, zero rounds) now tells you "Ask in chat" or Export may serve better, instead of silently producing a generic file


## [6.5.0] — The Friendly Ghost

UX pass driven by real user testing. The goal: nobody should need a tutorial.

### Fixed — Manus export completeness (root cause from field evidence)
- The harvest's blind 150-step safety cap stopped ~⅔ through long chats (this one was 115,000px tall and needed ~235 steps). The cap is now computed from the actual chat height (up to 800 steps), with live "Harvesting… N%" progress.
- **Bottom settle**: virtualizers render the tail late — harvest now forces scroll-to-bottom twice with longer waits, so the last outputs are captured.
- **Fragment merging**: Manus plan-steps exported as ~170 separate one-line "Assistant" sections; consecutive same-role fragments now merge into readable blocks.

### UX — window controls that behave like windows
- Collapse control is now context-aware: docked panels use ◀ expand / ▶ collapse (horizontal, matching the edge), floating panels use ＋ / － like every window the user already knows.
- Docked + collapsed: the entire strip is the tap-to-expand target — only ▶ stays the play button.

### UX — Help Center (the ? button)
- One topic per view, picked by pills: Start · Run · Auto · Flow · Roles · Export · Setup · Feedback — FAQ-style, written in plain language.
- Answers the real questions: "Export vs Capsule?", "Roadmap vs Workflow?", "Why did it pause?"
- Feedback section links GitHub issues and tells users exactly what to include (version, platform, Probe output).


## [6.4.0] — Field Repairs

Built from real-world Manus testing: actual exported files and saved page DOM drove every fix.

### Fixed — Manus export (evidence-based)
- **Root causes found in the real DOM**: Manus virtualizes the chat (off-screen turns don't exist in the DOM), nests `data-event-id` containers (one match contained the whole thread → duplicated mega-blobs), uses a Tiptap ProseMirror input (the visible `<textarea>` belongs to the Monaco code viewer — a decoy), and collapses steps with CSS grid animation instead of `<details>`/aria-expanded.
- **Scroll harvest**: on Manus, export now scrolls the virtualized list top→bottom collecting every turn by event id, in order, with correct user/assistant roles
- **Chrome stripping**: UI noise (Task completed, Suggested follow-ups, View more, Knowledge recalled, counters) removed from exports
- **Nested-match dedupe** in the generic extractor: ancestors of other matches are dropped, duplicate texts skipped
- **Manus profile corrected**: ProseMirror-first input (useCE), `[data-event-id]` turns
- **Thinking expansion** now opens Manus-style grid-collapsed step sections (only genuinely collapsed ones)

### Added
- **Word tabs**: Run · Auto · Flow · Roles · Export · Setup — no more emoji guessing
- **? help view** (header button): what every tab does, plus Roadmap-vs-Workflow explained with a concrete example (Workflow = your fixed recipe; Roadmap = AI invents the plan for this task)
- **📦 Ask in chat**: second capsule path — Ghost prompts the AI to write its own complete handoff report (mission, everything tried, failures + why, current state, next steps, fresh-AI instructions) in one code block. Works even where DOM scraping is hostile.
- **Structured queue editor**: one input per step, ＋ Add step, ✕ remove; during a run each step shows ✓ done / ▶ current / · pending with strikethrough on completion
- **Dock position** (▐): panel docks to the screen edge; collapsed it's a 32px vertical tab that blocks nothing — the closest safe equivalent to living inside the site's own UI


## [6.3.0] — Deep Export

**Export the thinking, not just the chat.** Reasoning logs on most platforms hide behind collapsed "Thinking" toggles that scrapers miss — the known workaround is expanding every toggle by hand before exporting. Ghost now does that automatically, from inside the page.

### Added
- **💭 Thinking logs** (Export tab, on by default): before extracting, Ghost auto-expands collapsed reasoning — opens every `<details>` block and clicks Thinking/Thought/Reasoning/Show-steps toggles (3 passes, marks what it clicked, never touches its own panel) — then captures thinking blocks per message.
- Markdown exports render thinking as `> 💭 Thinking` blockquotes above each response; JSON exports carry a `thinking` field per message.
- Works on Manus, DeepSeek, ChatGPT, Gemini, Claude and any platform using standard collapse patterns — no separate exporter extension needed.

### Notes
- Thinking text is subtracted from the main body to avoid double-capture; if a platform interleaves it non-contiguously, minor duplication may remain
- Handoff Capsules intentionally stay thinking-free (final outputs only)


## [6.2.0] — The Autopilot

**Walk away with everything ready.** The roadmap is no longer something you write — the AI researches the task, plans it, and Ghost executes the whole plan unattended.

### Added
- **🗺 Roadmap Autopilot** (third mode): response 1 is research + a machine-readable plan under `[[GITL::ROADMAP]]`; Ghost parses the numbered steps, runs each one as its own focused prompt, then fires a final synthesis prompt that compiles the deliverable and HALTs. Steps persist across crashes; Flow tab shows live ✓/▶/· progress.
- **Prompt Queue**: paste your own steps (one per line) in the Flow tab — they run hands-free on the same roadmap engine. AI-planned or user-planned, one executor.
- **📦 Handoff Capsule** (Export tab): one file containing mission/state YAML, roadmap position, the last 3 outputs, and an explicit next-lens contract (independent assessment, continue from ▶, deliverable-first, sigil protocol). Built for model-to-model relay — the state-export pattern, productized.
- **Lens Relay workflow**: a real model-switch round table. Pause-between on → swap the model (Perplexity selector or any manual switch) → press ▶. Four escalating lens turns: independent take → gaps → synthesis candidate → verified consensus.
- **Live Round Table on Perplexity**: the Round Table persona auto-switches to a model-relay variant on Perplexity — independent assessment, no default agreement, code-block output, names the next model each turn.
- **Walk-away notifications**: desktop notification on complete / pause / error (Settings toggle, permission requested on enable).
- **Config backup & restore**: every Ghost setting to/from one JSON file (Export tab).
- **Shadow DOM piercing**: when normal selectors miss, the adapter walks shadow roots (throttled, depth-capped) — Copilot-style shadow UIs and future platforms become reachable.
- **Auto-probe on failure**: input-missing, inject-failed, and no-output pauses now run the selector probe automatically and open Diagnostics — the panel tells you what broke.

### UI/UX — Small Package, Many Options
- **Hard mobile guarantee**: panel body is capped at min(52vh, 380px) and scrolls internally — the panel can never over-cover the chat on a phone, regardless of tab content. Panel width also capped to the viewport.
- **Six focused icon tabs** (with tooltips): ▶ Run · 🗺 Autopilot · 🔁 Workflows · 🎭 Personas · ⬇ Export · ⚙ Settings. The first tab is the standard continue experience and nothing else.
- **Autopilot gets its own tab**: roadmap progress + prompt queue moved out of Workflows — each tab now does one job.
- **Progressive disclosure**: Export and Settings show only the essentials; everything power-user (filters, slug, backup/restore, signal window, custom keywords, custom sites, diagnostics) lives behind a persisted "Advanced ▾" expander.
- Settings basics reduced to: max rounds, sound, notify, position, quick start.

### Changed
- Roadmap mode and workflows are mutually exclusive (roadmap wins) to prevent prompt collisions
- Crash recovery message reports roadmap position
- Mode buttons compacted to fit three modes

### Notes
- Roadmap capture requires the numbered list format; if the AI free-styles, Ghost pauses with a clear message instead of guessing


## [6.1.0] — The Open Door

**Root cause fixed: the generic adapter was dead code.** v6.0's generic fallback could never run — Tampermonkey only injects on `@match` domains, and only the 8 dedicated platforms were listed. Any unlisted site (like Manus) never loaded the script at all. v6.1.0 opens the door.

### Added
- **Manus** dedicated platform profile (`manus.im`) with best-effort fallback selector chains
- **13 labeled generic platforms** now in the `@match` list, routed through a widened generic adapter: Mistral, Kimi, Qwen, Meta AI, Poe, HuggingChat, You.com, Pi, Z.ai, Genspark, MiniMax, LMArena, Duck.ai
- **Custom sites** (Settings): per-host selector overrides as JSON, persisted via GM storage and prepended at adapter init — fix any platform without touching code. Pair with Tampermonkey "User matches" to activate on any URL.
- **Selector probe** (Settings → Diagnostics): one click live-tests input/send/stop/assistant chains and reports the winning selector + match count — the fast path for diagnosing a broken or new platform
- **Quick-start card**: 3-step onboarding on first run, dismissible, reopenable from Settings (closes the onboarding gap flagged in the v6.0 pre-build committee)

### Changed
- Generic adapter selector chains widened (role="textbox", data-testid send/stop, markdown/prose/assistant message patterns) — substantially higher hit rate on unknown chat UIs
- Generic adapter now labels known hosts (shows "Kimi", not "Generic")

### Notes
- Manus and generic-roster selectors are unverified fallback chains by design — run Probe on first use and report winners (or paste overrides into Custom sites)


## [6.0.0] — 2026-06-07

### Architecture
- Complete rewrite: 5-layer architecture (adapters → state → diagnostics → signal → engine)
- Loop engine never touches DOM — all DOM access through platform adapters
- Single GHOST state object replaces split CONFIG/STATE
- Generic fallback adapter for unknown platforms

### New Features
- **Claude platform support** with ProseMirror-aware selectors
- **Workflow pipelines** (6): Deep Research, R&D Lab, Shipyard, Debate, Pre-Mortem, Trollproof
- **Persona library** (8): Researcher, Builder, Red Team, Devil's Advocate, Tester, Customer Voice, Executive, Round Table
- **Tabbed UI**: Run | Flow | Personas | Export | Settings
- **Project ticker**: persistent name used as export filename prefix
- **Enhanced export**: Markdown/JSON format, filter by role or code blocks, role labels toggle, filename preview
- **Diagnostics panel**: adapter, platform, selector, send path, signal, round, state, errors
- **First-run hint**: shows onboarding tooltip for new users
- **Workflow auto-advance**: HALT signal on active workflow injects next stage prompt automatically
- **Pause between stages** toggle for workflow pipelines

### Reliability
- Unique sigils `[[GITL::PROCEED]]` / `[[GITL::HALT]]` as primary signals (legacy keywords as fallback)
- Confidence-scored signal detection (sigils +4, legacy +3, fuzzy +2, progress +2)
- Halt-first priority: HALT always wins when both signals present
- Randomized 8–15s delay with adaptive shortening on planning rounds (2s for round 1)
- 5-path send: contenteditable → native setter → direct value → button retries → Enter key
- ProseMirror fix: selectAll+insertText instead of innerHTML clear (preserves editor state)
- MutationObserver gated by sendInProgress flag (prevents double-fire race condition)
- Minimum response length guard (< 50 chars → don't evaluate signal)
- SPA route detection via pushState/replaceState patching + selector cache invalidation
- Send lock with 1.5s cooldown prevents double-sends
- Crash recovery with manual-refresh disambiguation (only flags recovery if loop was RUNNING)
- Two-stage watchdog: 90s soft warning, 180s hard pause
- Selector cache with route-change invalidation

### UI
- Collapsible panel with single play/pause button when minimized
- 5 position presets (4 corners + bottom bar)
- Drag-to-reposition
- Keyboard shortcuts: Alt+P toggle, Alt+S stop
- Completion chime

### Firefox Extension
- Updated MV3 wrapper with GM↔browser.storage.local shim

---


*A record of decisions made, problems identified, and improvements implemented with varying degrees of elegance.*

---

## [4.2.0] — Think First

**The core question this release answered:** what happens when the user doesn't know how complex the task is?

Loop mode assumed you already understood the scope — that you'd handed the AI a known multi-step task and simply needed someone to handle the relay. This worked well for structured work. It worked considerably less well when the task was open-ended, poorly scoped, or genuinely complex in ways the user hadn't anticipated. In those cases, the AI would invent a step count, commit to it prematurely, and produce output that was technically structured but architecturally wrong.

**Think First mode** addresses this by inverting the sequence. The first response is dedicated entirely to planning — the AI reads the task, assesses its genuine complexity, determines an appropriate batch count at approximately 80% of its comfortable response capacity (a deliberate margin, chosen because the back 20% of a full-capacity response is where precision goes to die), and states the plan explicitly before touching any actual work. Subsequent responses execute the plan, one batch at a time.

The 80% figure is not arbitrary. Extended research into AI output degradation patterns consistently shows that accuracy and coherence decline toward the end of near-capacity responses as the model prioritizes completion over correctness. Capping at 80% is the difference between a response that finishes cleanly and one that rushes.

**Also in this release:**
- Mode toggle preserved across sessions
- Progress bar now parses both `[Step X of Y]` and `[Batch X of Y]` formats
- Payload preview updates dynamically when switching modes
- Panel UI refined for clarity

---

## [4.1.0] — The Payload Becomes Visible

**The core question this release answered:** why should the user have to trust something they can't see?

The original architecture injected the loop protocol silently and completely. Users installing a third-party script were asked, implicitly, to trust that the text being appended to their prompts was benign, purposeful, and not doing something strange. This was a reasonable concern and an unreasonable ask.

This release introduced the payload preview panel — a collapsible section showing exactly what text gets appended to every prompt, in plain language, before it's sent. The intent was dual: transparency for the cautious user, and utility for anyone who wanted to understand *why* the protocol wording was chosen the way it was.

The progress bar was also introduced in this release. The loop had always tracked rounds internally, but the absence of visible feedback created an uncomfortable experience — the user pressed play and then had no indication whether things were proceeding or whether something had quietly gone wrong. Parsing the AI's `[Step X/Y]` output and rendering it as a visual bar addressed this without requiring any changes to the core loop logic.

**Also in this release:**
- Cycle-aware Play: completing or stopping a task automatically resets the payload flag, so the next prompt starts fresh without manual intervention
- Round counter displayed in panel

---

## [4.0.0] — The Platform Problem

**The core question this release answered:** why does a workflow automation script only work on one website?

The V3 architecture was ChatGPT-specific in ways that were architectural rather than incidental — the selector logic, the text injection method, and the send detection were all hardcoded around ChatGPT's React-controlled textarea and specific button attributes. Expanding platform support required rethinking injection as a solved problem with known variants rather than a single implementation.

Three injection paths were implemented and mapped to platforms:
1. React native setter (ChatGPT)
2. ContentEditable with execCommand (Gemini, Perplexity)
3. Plain textarea with synthetic events (DeepSeek, Copilot, Grok)

Each platform received a profile — an object containing its selector chains, injection method, and behavioral flags — allowing the detection and execution logic to remain platform-agnostic. Selector chains were implemented as ordered fallback arrays rather than single selectors, drawing on observed DOM patterns across platforms and building in resilience against minor UI revisions.

MutationObserver was added alongside the polling loop specifically to handle the "Continue generating" button in ChatGPT — a UI element that appears and disappears dynamically and benefits from immediate detection rather than waiting for the next poll cycle.

**Also in this release:**
- Draggable panel with persisted position
- Keyboard shortcuts (Alt+P, Alt+S)
- Round limit with configurable cap
- Completion chime (two-tone, Web Audio API)

---

## [3.0.0] — The State Machine

*Prior to public release. Documented here for completeness.*

The V1 and V2 implementations were functionally correct but behaviorally fragile — if the AI produced a response that contained neither the continuation signal nor the stop signal (a clarifying question, a protocol deviation, an unexpected formatting choice), the loop would continue polling indefinitely, silently burning through the user's token allocation with nothing to show for it.

V3 introduced a strict three-state machine: RUNNING, PAUSED, and COMPLETE. Deviation from the expected response pattern triggered an automatic transition to PAUSED, flagging the deviation explicitly rather than ignoring it. This was accompanied by moving the operational parameters from manual entry to automatic injection — the V1/V2 requirement that users type the protocol rules before engaging the loop was identified as the kind of design decision that sounds reasonable in planning and fails immediately in practice.

---

*All version numbers follow [Semantic Versioning](https://semver.org).*

---

## [5.0.0] — Reliability Core

**The question that drove this release:** what if every assumption about signal detection, text injection, and loop lifecycle was wrong?

An extended audit — cross-referencing Code Copilot's architectural proposals, a PHP developer's DOM resilience review, competitive analysis of adamlui/chatgpt-auto-continue, fogel.dev's MutationObserver research, and Mozilla's WebExtension documentation — revealed that the v4 architecture was correct in intention but fragile in execution. The selector chains worked but weren't cached. The signal detection worked but couldn't distinguish a quoted `PROCEED` from a real one. The send engine worked but had no lock, no fallback timing, and no defense against automation detection heuristics.

v5.0 is a clean rewrite around six principles:

1. **Halt-first priority.** HALT always wins. A false halt costs one click to resume; a false proceed costs tokens, context, and potentially an automation flag. The prior "proceed beats halt" rule was reversed after red-team analysis showed it created silent runaway conditions.

2. **Confidence scoring.** Signals are weighted: unique sigils (`[[GITL::PROCEED]]`) score +4, legacy keywords +3, fuzzy patterns +2, progress bars +2. Minimum threshold of 3 required to act. The panel shows the score so the user can see exactly why the script did or didn't continue.

3. **Randomized inter-message delay.** 8–15 seconds, drawn uniformly at random. This is not a performance feature — it is a defense against automation detection on platforms that monitor message cadence. The delay adds latency the user is already absent for and costs nothing.

4. **Watchdog timer.** Borrowed from embedded systems practice. Stage 1 (soft, 90s) logs a warning. Stage 2 (hard, 180s) pauses the loop. Every successful DOM mutation or send operation resets the timer. If feeds stop, the script assumes it's stuck — selector break, network failure, or platform error state — and fails safely.

5. **Send lock + triple fallback.** The send engine acquires a lock (preventing double-sends from tick/observer race conditions), injects text, waits 500ms for the platform to enable the send button, clicks it if found, retries once at 600ms, and falls back to a synthetic Enter keypress if both button attempts fail. The lock releases after 1500ms. The panel reports which path succeeded.

6. **Unique signal tokens.** `[[GITL::PROCEED]]` and `[[GITL::HALT]]` are vanishingly unlikely to appear in normal AI output, code blocks, or quoted text. The engine still recognizes legacy `PROCEED`/`SYSTEM_HALT` (weighted lower) for backward compatibility and third-party workflows.

**Also in this release:**
- Firefox Manifest V3 extension with GM↔browser.storage shim
- SPA route detection via pushState/replaceState monkey-patching
- Selector caching with route-change invalidation
- TXT and JSON export of full conversations
- Crash recovery via beforeunload state persistence
- Default round cap reduced from 50 to 20
- Diagnostic event log visible in the panel
- Collapsible panel with corner/bottom-bar position presets
