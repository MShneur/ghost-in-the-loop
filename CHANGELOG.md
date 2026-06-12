# Changelog

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
