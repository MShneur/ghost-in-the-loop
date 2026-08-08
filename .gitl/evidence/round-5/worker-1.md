# Ghost Worker Evidence

## Identity
- Round: 5
- Worker: 1
- Role: Supervisor / integrator
- Executed by nominal wake lens: Worker 6 / Devil's Advocate-release auditor
- Assignment ID: `R5-SUPERVISOR-PLAN`
- Started at: `2026-08-07T08:49:30Z`
- Finished at: `2026-08-07T08:56:00Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `a348cadb125a18712f11ea6de02d2a22233736b6`
- Lease state at start: none
- Lease claim commit: `8495cdf395d66c080f5d25eaa9b6aebc88432fe5`
- Dependencies: Round-4 `R4-A5-LIFECYCLE-AUDIT` accepted the bounded lifecycle objective. Human review of whether to accept or reopen that bounded certification remained pending, but the latest canonical Personal-Forge maker makes that question local by default rather than a global roadmap freeze.
- Active conflicting workflow: none observed for the starting head.
- Deferred queue at start: `.gitl/deferred-questions.md` absent.

## Step Performed

Applied the latest canonical Personal-Forge ChatGPT Automation Maker before project work, then reconciled the Ghost control plane with its Policy B local-human-gate rule without changing product behavior.

1. Preserved Round-4 lifecycle certification exactly at the evidence level accepted by its independent audit. No physical Android, Firefox-Android/GeckoView, real browser-scheduler freeze/discard, or calibrated low-end performance claim was promoted.
2. Created `.gitl/deferred-questions.md` with `DQ-R4-LIFECYCLE-REVIEW`, recording the accept-vs-reopen human decision, evidence, dissent, consequences, reversible default, and unblock condition.
3. Opened Round 5 on the next independent release-critical program, `LONG-CHAT-PERF`, because the deferred lifecycle review does not make reversible long-chat research/testing irreversible and therefore is not a true global gate under the maker.
4. Published a dependency-safe Round-5 chain: baseline/research -> smallest evidence-selected build or no-change -> Red Team falsification -> mobile/cross-browser performance -> independent audit.
5. Preserved three competing repository-grounded hypotheses rather than preselecting an optimization.

## Research Sources

### Canonical orchestration evidence
- `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`: canonical v1.0 (2026-08-07). Human decisions are local by default; earliest-ready succession overrides timer number; no executable work may be replaced by idle research; one bounded step must end in a durable handoff.
- `MShneur/Personal-Forge:10-forge-kernel/EVIDENCE_COMPETITIVE_DECISION_PROTOCOL.md`: consequential choices should preserve materially different candidates and run cheap discriminating tests before narrowing.
- `MShneur/Personal-Forge:08-agent-bridge/AGENT_BRIDGE.md` plus live `Agents-of-AI/AoA-QUICK-PROMPT.md`: reusable expert lenses are resolved dynamically rather than hardcoded.

### Repository hot-path evidence
- `ghost-in-the-loop.user.js` defines `ANSWER_SCAN_LIMIT = 48`, but `_collectAnswerCandidates()` executes `document.querySelectorAll(sel)` for each assistant selector before slicing to the final 48 matches. The cap limits later processing, not selector enumeration cost.
- The ChatGPT adapter currently carries three assistant selectors, so a running tick may enumerate overlapping long-chat answer sets multiple times.
- `engineTick()` is scheduled at 2500 ms while RUNNING and calls `Adapter.getLastText()`, which routes through the answer candidate scan.
- `_beginSendAttempt()` and `_sendEvidence()` additionally count assistant elements and read the last answer while a Send transaction is unresolved. Any optimization must preserve the at-most-once Send journal and cannot replace independent delivery evidence with a faster but weaker heuristic.
- `tests/e2e/lifecycle-mobile-perf.spec.js` uses 180 assistant messages for repeated-wake resource testing. It is a useful reference fixture but was not designed to certify long-chat scaling.

### Competing approaches preserved for A1
1. **Bounded-polling minimalist**: keep the simple polling/recovery architecture, but reduce per-tick DOM work through tail-aware lookup, selector consolidation, or validated caching if measurements show selector enumeration dominates.
2. **Event-driven incremental observer**: track the newest assistant turn through DOM mutations and retain polling as a correctness/recovery backstop. This may improve scaling but increases observer/state complexity and stale-node risk.
3. **Outside-frame candidate**: reduce repeated conversation-DOM scanning through a portable adapter observation capability or other read-only signal. Network telemetry/heuristics must never gain actuator or Send authority.

### Aggregate user/community evidence
- UNKNOWN in this bounded supervisor planning step. No community sentiment was fabricated. `R5-A1-LONGCHAT-BASELINE` explicitly requires community/adoption evidence when it can discriminate approaches.

## Changes
- `.gitl/autopilot-state.json` — lease claim only during this step.
- `.gitl/deferred-questions.md` — created durable local human-review queue; commit `fe2053dac6241381b9b03835225ef8aea3d5ab23`.
- `.gitl/orchestration/round-plan.json` — opened Round 5 and published the dependency-safe long-chat chain; commit `94a98eb0e324bb4927df0c6243109af9d0f95d69`.
- `.gitl/evidence/round-5/worker-1.md` — this record.
- Product/generated source changed: none.
- Temporary workflow/carrier created: none.

## Tests
- Canonical maker and decision protocol read: PASS.
- Current Ghost state/plan/succession/task prompt/evidence contract read: PASS.
- Round-4 Worker-6 audit read: PASS.
- Starting branch head verified: `a348cadb125a18712f11ea6de02d2a22233736b6`.
- Conflicting workflow on the starting head: none observed.
- Source inspection for long-chat hypotheses: PASS.
- Existing 180-message lifecycle-mobile fixture inspected: PASS.
- Product/unit/browser benchmark execution: NOT RUN — this assignment is the supervisor planning step and deliberately does not infer a performance winner. Exact-head measurement is the next A1 assignment.

## Acceptance Criteria
- Preserve Round-4 evidence scope and queue its human review locally: PASS.
- Do not let the local human review freeze independent `LONG-CHAT-PERF`: PASS.
- Make `LONG-CHAT-PERF` active: PASS.
- Publish a dependency-safe research/build/Red-Team/mobile/audit chain with only A1 ready: PASS.
- Preserve competing performance hypotheses instead of selecting a favored implementation before measurement: PASS.
- Keep every remaining required release-critical program: PASS.

## Safety Checks
- Send authority unchanged: PASS — no product source changed.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS.
- Uncertainty fail-closed behavior unchanged: PASS.
- No `main`, merge, auto-merge, tag, publish, or release action: PASS.

## Risks and Limits
- The dominant long-chat bottleneck is still UNKNOWN. Full selector enumeration before the 48-candidate slice is a concrete scaling hypothesis, not a measured conclusion.
- The existing 180-message fixture is not evidence for 500/1000/2000-turn scaling.
- A more event-driven design may reduce polling cost but could increase mutation-observer churn and state invalidation complexity; it must beat the simpler approach on discriminating measurements before selection.
- Older project-local `.gitl/orchestration/README.md` and `.gitl/orchestration/task-prompts.md` still describe the former global `review-after-round` freeze. The canonical maker is now authoritative for orchestration behavior, so this does not block the maker-aware chain, but the text remains documentation/control-plane drift that should be reconciled in an authorized coordination/docs step.
- The deferred Round-4 question must be surfaced again before final certification. Advancing independent work does not silently answer it.

## Recommended Next Action

The next eligible wake should claim `R5-A1-LONGCHAT-BASELINE`, build and execute a deterministic exact-head long-chat benchmark/correctness fixture across materially different history sizes, compare the preserved approaches with predeclared metrics, and identify the smallest falsifiable optimization only after measurements.

## Assignment Status
- submitted
