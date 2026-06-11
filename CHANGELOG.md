# Changelog

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
