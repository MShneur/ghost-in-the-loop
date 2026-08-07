# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 2
- Intended role: Researcher / architect
- Executed by: `scheduled-agent-6-r6-a1-successor` (nominal timer 6; timer identity treated as wake cadence only)
- Assignment ID: `R6-A1-MOBILE-SHELL-STRUCTURE-MAP`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T12:49:01Z
- Finished at: 2026-08-07T12:58:20Z
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting durable handoff evidence head: `5888efcdec6f8e4e05cfb93cd23b02b37272b64a`.
- The branch was one additional coordination-state commit ahead of that evidence head immediately before this lease claim; the connected commit/compare surface did not expose that intermediate commit SHA, so the exact pre-claim head is recorded as **UNKNOWN rather than inferred**.
- Lease claim commit: `62e12b24ea584ff639f8e20c919353ca5d9cb435`.
- No open PR targeted from `agent/8.8-repair-resume` when checked, and after the lease claim the branch remained identical to the claim head before A1 writes began.
- Dependencies: `R6-SUPERVISOR-PLAN` submitted; A1 was the earliest ready assignment.
- Deferred questions `DQ-R4-LIFECYCLE-REVIEW` and `DQ-R5-LONGCHAT-REVIEW` remain local under Policy B and do not block this program.

## Step Performed
Performed one bounded research/structure-map step and committed a deterministic no-actuation structure-capture contract. Live authenticated ChatGPT DOM inspection was attempted through the connected browser tester, but the automation runtime returned `User input required but current turn is running in a non-interactive mode`. Therefore A1 does **not** claim that a current live ChatGPT header row, composer action row, or footer stack has been durably mapped.

Per the A1 fallback contract, no production selector or structural mount was authorized. Instead, the work:
1. re-verified Ghost's current fixed/geometry rail baseline;
2. cross-checked independently adopted current ChatGPT composer anchors and structural-injection strategies;
3. compared explicit adapter-owned discovery against generic structural inference;
4. evaluated teal/blue/red plus the existing rail fallback;
5. committed a deterministic read-only probe fixture that can be used as the oracle for a later live capture;
6. predeclared the smallest candidate architecture and falsification criteria, while leaving the exact current insertion slot **UNKNOWN** until live evidence is captured.

## Repository Evidence
### Ghost baseline
- `ghost-in-the-loop.user.js` still styles `#gitl` with `position:fixed`; none of the current position modes are a structural in-flow host mount.
- `_railBox()` / `_applyRail()` place the rail from composer geometry rather than injecting into the host layout.
- `startRailTracker()` observes `document.body` with `subtree:true`, listens to resize/VisualViewport, and uses a 1200 ms poll. That is acceptable for the existing compatibility rail but is explicitly rejected as the observation model for a structural mount.
- The ChatGPT profile already has reviewed editor and Send anchors including `#prompt-textarea` and `button[data-testid="send-button"]`, but no adapter-owned `headerActions`, `composerActions`, `composerStack`, `verify`, or `repair` mount contract.
- Existing `tests/e2e/rail.spec.js` explicitly describes the rail as `positioned by geometry (no injection into the page)`.

### Deterministic capture fixture
- New file: `tests/e2e/mobile-shell-structure-probe.spec.js`.
- Initial fixture commit: `431670c5951cd9790b8f8e430aa2edf4f3958911`.
- Self-audit correction commit: `ed0c23ffcb68c2964139eb094db363f9156e36e7`.
- The correction removed a weak always-true stack assertion and replaced a DOM-element serialization check with explicit booleans; this is recorded rather than hiding the first draft.
- The fixture models desktop and 390 px narrow layouts, a real in-flow composer stack, an in-flow flex action row, native attachment/model/Send controls, and a hidden duplicate composer.
- The probe resolves from the visible editor outward, scopes Send lookup to that composer, records action/stack/header candidates and computed layout, preserves exact Send node identity, and asserts zero click/submit/input/keydown events.
- It does **not** insert a Ghost control or mutate host layout.

## External / Adoption Research
### Current ChatGPT anchor convergence
Independent codebases converge on the same composer-level anchors:
- `justinmoon/gpt5-pro` uses `[data-testid="composer"]`, `#prompt-textarea`, and `button[data-testid="send-button"]` for ChatGPT browser automation.
- `AI-MarkDone` prefers `#prompt-textarea.ProseMirror[contenteditable="true"]` and an explicit `button[data-testid="send-button"]`; its ChatGPT adapter finds injection rows from known local action anchors rather than choosing a whole-document generic row.
- `Likheet/prompt-enhancer-extension` (commit `e371fab...`, July 2026) starts ChatGPT input discovery with `form[data-type="unified-composer"] #prompt-textarea` / ProseMirror fallbacks and uses `button[data-testid="send-button"]` among its send anchors.

### Structural injection adoption example
`Likheet/prompt-enhancer-extension` contains a recent deterministic ChatGPT docking fixture with:
- `<form data-testid="composer">`
- a flex `data-testid="composer-actions"` toolbar
- native attachment/model/Send buttons
- an injected control tested as an in-flow sibling of native controls.

Its `docking-strategies.js` explicitly resolves from the selected prompt editor outwards, discovers a composer-local toolbar, validates that the input/action remain in the same connected composer, and applies `position:relative` / flex sizing rather than viewport positioning. This is useful adoption evidence for the **shape of a safe discovery strategy**, not proof that ChatGPT's live DOM currently has exactly that fixture structure.

### Platform primitives
MDN documents that `MutationObserver.observe(target, options)` can scope observation to one target or its subtree, and `disconnect()` stops notifications. `ResizeObserver.observe(element)` observes element sizing. These primitives fit the brief's nearest-verified-container repair/verification model; they do not justify a document-wide structural watcher.

### User/community lens
A July 29, 2026 Android ChatGPT discussion reports mobile UI controls/model access changing or disappearing after a recent interface update. This is anecdotal but supports treating mobile host structure as volatile rather than assuming a stable universal selector. A separate current web-development discussion describes fixed chat composers being obscured by the on-screen keyboard on iOS PWA layouts, reinforcing the product value of real host reflow rather than another fixed overlay. Neither source proves a particular current ChatGPT DOM hierarchy.

## Competing Expert Lenses
### Expert A — explicit ChatGPT adapter-owned contract
Start from reviewed ChatGPT anchors (`#prompt-textarea`, current composer root, exact Send), then accept only a composer-local flex/grid action-row candidate that passes structural verification. Repair observes only the verified local container. Prediction: lower false-positive and Send-interference risk, at the cost of adapter maintenance when ChatGPT markup changes.

### Expert B — generic structural inference
Start from any visible editor, climb ancestors, score layouts/control density, and infer a reusable toolbar/footer without ChatGPT-specific mount selectors. Prediction: lower adapter code volume, but higher risk of selecting a hidden/secondary composer or the wrong nested control cluster during responsive/rerender states. The deterministic fixture deliberately includes a hidden duplicate to make this failure mode testable.

### Reliability / security lens
The explicit contract is favored for the first prototype because an error near Send has asymmetric consequence. Exact Send identity must be captured before mount, remain connected/visible after mount and repair, and never be cloned/moved/wrapped/replaced. Verification ambiguity must unmount and return to the existing rail.

### Mobile / constrained-hardware lens
Blue has the best one-handed reach but the highest responsive coupling. Any structural observer must be scoped and measured for callback/reattachment churn. Physical Android, GeckoView, and calibrated low-end hardware remain later evidence; hosted emulation must not be promoted to those claims.

### Aggregate end-user lens
The user requirement strongly values thumb reach and native reflow. Recent community reports also show that mobile ChatGPT controls can move between UI versions. This argues for adapter verification plus a fail-closed fallback rather than hard-coding one global DOM path.

### Outside-frame lens
Viewport/CSS anchoring is simpler and already represented by Ghost's rail, but it does not satisfy Blue/Red structural success because it remains overlay-like. It remains the compatibility fallback, not the first structural candidate.

### Test-lead lens
The first product change must be falsifiable against exact node identity, layout participation, duplicates, rerenders, narrow widths, zero actuation, reversible cleanup, and scoped-observer counts. A test that only proves the Ghost icon is visually near Send is insufficient.

## Concept Evaluation
| Concept | Reach | Send proximity / consequence | Current anchor evidence | Reflow complexity | Rerender / breakpoint risk | A1 disposition |
| --- | --- | --- | --- | --- | --- | --- |
| Teal header cell | Medium | Low | Weak/UNKNOWN live header-row map | Low-medium | High across responsive header variants | Defer behind Blue evidence |
| Blue composer action cell | High | High | Strongest anchor convergence at editor/composer/Send boundary | Medium | High but tightly falsifiable | **Smallest candidate architecture**, exact slot still gated on A1X live capture |
| Red composer sibling row | High | Medium | Footer-stack map is UNKNOWN | High: footer height, scroll anchoring, keyboard | High | Defer until stack/spacing behavior is mapped |
| Existing rail | High | Separated from Send | Already verified in Ghost | Overlay/geometry only | Known fallback behavior | Preserve as fail-closed compatibility fallback |

## Predeclared Candidate and Falsification Gate
If and only if a live/durable ChatGPT capture confirms one composer-local action row, A2's smallest candidate is:

**ChatGPT-only Blue structural portal using an explicit adapter-owned mount contract.**

The exact insertion point remains **UNKNOWN pending A1X**. A1 does not guess whether the current live slot is after attachment, before/after model, before Send, or final child after Send.

Before product implementation may be accepted, the capture/build chain must prove:
1. Exactly one visible current ChatGPT composer and one reviewed Send are resolved from the same editor-local subtree.
2. The selected action row is a connected flex/grid structural container with native controls and Send inside that same composer.
3. A structural host element participates in normal flow (`position` not fixed/absolute for the primary portal).
4. Original Send node identity remains byte-for-byte the same JS node, connected, visible, and operable; no host Send wrapper/move/clone/replacement is permitted.
5. No native attachment/model/voice/tool control becomes hidden, overlapped, detached, or reordered outside the adapter-approved insertion rule.
6. At desktop and narrow/mobile breakpoints the portal reflows/wraps with the host rather than covering the editor or Send.
7. Repeated composer replacement/host-control insertion yields exactly one `data-gitl-mount` host.
8. Repair observation is scoped to the nearest verified structural container; no `document.body` structural observer or high-frequency global poll is introduced.
9. Unmount restores any recorded host style value exactly and leaves no stale spacing/row.
10. Mount/verify/repair causes zero submit/click/input/keydown Send-adjacent actuation.
11. Any verification failure removes the attempted structural mount and returns to the existing rail fallback.

A deterministic failure of any item keeps Blue experimental and must not be solved by weakening Send, CHOICE, route, lease, uncertainty, or layout assertions.

## Changes
- `.gitl/autopilot-state.json` — claimed A1 lease, commit `62e12b24ea584ff639f8e20c919353ca5d9cb435`.
- `tests/e2e/mobile-shell-structure-probe.spec.js` — deterministic no-actuation capture contract, commits `431670c5951cd9790b8f8e430aa2edf4f3958911` and `ed0c23ffcb68c2964139eb094db363f9156e36e7`.
- `.gitl/evidence/round-6/worker-2.md` — this evidence record.
- No `ghost-in-the-loop.user.js`, `extension/content.js`, dependency, main-branch, tag, release, merge, or publication change.

## Tests
- Live authenticated ChatGPT structure capture: **NOT EXECUTED** — connected browser evaluator required interactive permission in this non-interactive run.
- `tests/e2e/mobile-shell-structure-probe.spec.js`: **NOT EXECUTED** in CI during this bounded research step; no test PASS is claimed.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** because A1 changed no product code.
- The deterministic probe itself is durable and is the reproduction/capture oracle for the recovery assignment.

## Acceptance Criteria
- Read canonical maker/state/orchestration/plan/evidence/deferred queue: PASS.
- Verify no active conflicting lease/work before claim: PASS.
- Record Ghost fixed/rail structural baseline: PASS.
- Compare explicit adapter contracts vs generic inference: PASS.
- Evaluate teal/blue/red/fallback with competing expert lenses: PASS.
- Gather upstream/adoption and community evidence where useful: PASS, with source limits recorded.
- Create deterministic no-actuation host-structure probe: PASS.
- Predeclare smallest candidate architecture and falsification criteria: PASS.
- Current live ChatGPT desktop structural row/stack map: **FAIL / MISSING EVIDENCE**.
- Current live ChatGPT narrow/mobile structural row/stack map: **FAIL / MISSING EVIDENCE**.
- Authorize product selector/mount implementation: **NO**.

Because the assignment requires current live evidence or a deterministic fallback plus recovery, A1 is **blocked on live/durable structure capture**, not submitted as a completed live map.

## Safety Checks
- Send authority unchanged: PASS.
- Original production Send selectors/actions unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route safety unchanged: PASS.
- Lease safety unchanged: PASS.
- Uncertainty behavior unchanged: PASS.
- Rail fallback unchanged: PASS.
- Product implementation: NONE.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- The deterministic fixture and external adoption examples are not a substitute for a current authenticated ChatGPT DOM capture.
- The exact current header action row is UNKNOWN.
- The exact current composer action-row DOM signature and safest insertion position are UNKNOWN.
- The exact current composer/footer stack and message-list bottom-spacing behavior are UNKNOWN.
- Blue is selected only as the smallest *architecture/mode to test first*, not as a certified product design.
- Recent external extension fixtures can lag or simplify the real host UI; their value here is strategy convergence, not source-of-truth markup.
- Physical Android, keyboard-open behavior, Firefox-Android/GeckoView, large text, reduced motion, and constrained hardware are later Round-6 evidence.
- Project-local README/task prompt still encode obsolete global review freeze wording; canonical maker Policy B and current active state govern until DOCS-RECONCILIATION.

## Recommended Next Action
Create/activate `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` as the smallest recovery assignment. It should execute the read-only probe against current authenticated ChatGPT at desktop and a narrow/mobile viewport, record sanitized element signatures/computed layouts/rects and exact Send identity with zero actuation, and compare those observations against the deterministic fixture and adoption hypotheses. If live browser access remains unavailable, the recovery may use a current user-provided DOM/screenshot capture or an exact evidence carrier that does not actuate Send. Only after a durable live map confirms the selected structural container should `R6-A2-MOBILE-SHELL-BUILD` become ready.

## Assignment Status
- blocked
