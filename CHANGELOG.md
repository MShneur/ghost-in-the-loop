# Changelog — Ghost in the Loop

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
