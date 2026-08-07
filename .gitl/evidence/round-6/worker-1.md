# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 1
- Intended role: Supervisor / integrator
- Executed by: `scheduled-successor-r6-supervisor-plan` (nominal timer 6; timer identity treated as wake cadence only)
- Assignment ID: `R6-SUPERVISOR-PLAN`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: `2026-08-07T12:11:07Z`
- Finished at: `2026-08-07T12:16:52Z`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting branch head before lease claim: `90ce760392c89c2816e80df65d8d08e84a5c2ca4`
- Starting canonical state: Round 5 `audited-transition-ready`, `status: active`, `publishReady: false`, `lease: null`, automatic dispatch to `R6-SUPERVISOR-PLAN`.
- No workflow runs were associated with starting head `90ce760...` when checked.
- `DQ-R4-LIFECYCLE-REVIEW` and `DQ-R5-LONGCHAT-REVIEW` are both `deferred` local questions. Neither is a global stop under the current canonical maker.
- Round-5 bounded Long Chat certification remains preserved; its linear union scan, 8004-match/sample Send-observation path, physical Android, GeckoView, calibrated hardware, and Ghost-causal-dominance exclusions remain explicit.

## Lease
- Claim holder: `scheduled-successor-r6-supervisor-plan`
- Intended role: `supervisor-integrator`
- Nominal timer: 6
- Inspected head: `90ce760392c89c2816e80df65d8d08e84a5c2ca4`
- Lease claim commit: `6ff72ded1b2d57010ddd2f87a46da8ddb40d7622`
- Lease expiry recorded as `2026-08-07T12:56:07Z`.

## Step Performed
Opened a bounded Round-6 planning slice for the user-required host-affixed mobile Ghost shell. No product behavior was authorized or changed. The plan intentionally makes the first specialist assignment research/structure-map only, followed by one-platform/one-mode build, Red Team, mobile/accessibility/performance, and an independent bounded-prototype audit. Full `MOBILE-SHELL-STRUCTURAL` completion is explicitly withheld until later required cross-adapter expansion and final program audit.

## Current Repository Observations
1. `ghost-in-the-loop.user.js` currently renders the primary `#gitl` panel with `position:fixed`. Existing dock/orb/bottom-bar/rail positions are viewport-affixed compatibility UIs, not host-structural mounts.
2. The current composer rail is geometry-driven through `_railBox()` / `_applyRail()`. It hugs the composer visually but remains fixed-position UI rather than a real child or sibling in the host layout.
3. The rail tracker currently uses a `MutationObserver` on `document.body` with `subtree:true` plus a 1200 ms poll to rebind/reposition the input. That existing fallback is not accepted as the observation model for a structural mount because the user brief requires observation scoped to the nearest verified structural container.
4. The current platform registry exposes input/send/stop/assistant selectors and related dispatch behavior, but no adapter-owned `headerActions`, `composerActions`, `composerStack`, `verify`, or `repair` structural mount contract exists.
5. Current source contains no `attachShadow` call, so the brief's custom-element/Shadow-DOM structural portal is new infrastructure rather than an already-implemented mechanism.
6. ChatGPT Send resolution already has reviewed selectors. Round 6 therefore treats the existing host Send node as an invariant: it may not be moved, wrapped, cloned, replaced, or granted a second actuation path.
7. The existing rail remains the fail-closed compatibility fallback when structural verification fails. A fallback result is not counted as structural success.

## Competing Expert Lenses

### Expert A — explicit adapter-owned structural contracts
Use platform-specific discovery functions and verification for header actions, composer actions, and footer stack. This is favored as the first falsifiable approach because the brief is explicitly adapter-owned and the failure consequences near Send are high. Prediction: a ChatGPT fixture/live map can identify one stable in-flow slot and survive controlled host insertions/rerenders while preserving exact Send identity.

### Expert B — generic structural inference
Climb from known anchors, classify flex/grid/block/table structure, and choose a safe parent using reusable rules. Potential benefit is lower selector maintenance across platforms. Main risk is false-positive mount selection under responsive or host markup changes. Prediction: if generic inference cannot select the same intended safe container across materially different fixture structures without hiding/reordering host controls, it should not be the first product implementation.

### Reliability / security / maintenance lens
Structural insertion must fail closed. Every host style mutation must be recorded and exactly reversible. One `data-gitl-mount` identity prevents duplicates. Only the nearest verified structural container may receive repair observation. Verification failure must cleanly unmount and return to the existing rail. No structural feature may create a second Send or Play authority.

### Constrained hardware / mobile lens
A solution that is logically structural but produces observer churn, keyboard/orientation instability, large-text clipping, or narrow-width overlap is not acceptable. Round 6 therefore reserves a dedicated mobile/accessibility/performance assignment and explicitly forbids promoting Playwright emulation to physical Android or GeckoView certification.

### Aggregate user lens
The user-supplied brief values one-handed access and host-native reflow, with blue/red specifically expected to participate in the host layout rather than cover it. External community evidence was not independently gathered during this supervisor step and remains `UNKNOWN`; A1 is required to research it if it can discriminate among teal, blue, red, or the rail fallback.

### Outside-frame candidate
CSS/viewport anchoring could visually follow host controls with less DOM coupling, but for blue/red it would remain overlay-like and therefore fails the user's structural requirement as a primary success path. It remains relevant only as part of the existing compatibility fallback, not as the proposed structural implementation.

### Test/certification lens
A1 must turn host-layout assumptions into deterministic fixtures/probes before A2 product work. A2 must preserve exact Send identity, in-flow layout, unique mount identity, cleanup, generated parity, and predeclared A1 falsification gates. A3/A4 then attack rerenders, layout pressure, keyboard/orientation/large-text/reduced-motion, observer accumulation, and fallback behavior. A5 independently audits source/run/job/artifact bindings and may only certify the bounded one-platform/one-mode prototype, not the whole MOBILE-SHELL-STRUCTURAL program.

## Research Sources
- Repository brief: `.gitl/briefs/mobile-shell-concepts.md` — requires teal header cell, blue composer action cell, and red composer sibling row to use real host layout; blue/red may not be viewport overlays; rail remains compatibility fallback.
- Repository source: `ghost-in-the-loop.user.js` — current fixed panel/rail, rail geometry, document-body observer/polling, platform adapter selectors, and Send-node lookup behavior.
- MDN `MutationObserver.observe()` — observation can be scoped to a specific target/subtree; supports the brief's nearest-container observation design rather than a document-wide structural watcher: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe
- MDN `MutationObserver.disconnect()` — observer cleanup is explicit and reusable, supporting exact unmount/repair lifecycle requirements: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/disconnect
- MDN `ResizeObserver` — element-level size observation is broadly available and suited to verifying that a mounted cell/row participates in layout; ResizeObserver callbacks can themselves create layout-loop risks and must be measured: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
- MDN `CustomElementRegistry` — the global custom-element registry is broadly available, while newer scoped registry mechanisms have varying support. Round 6 therefore does not pre-require scoped registries: https://developer.mozilla.org/en-US/docs/Web/API/CustomElementRegistry

## Changes
- `.gitl/autopilot-state.json` — lease claim and current-step update, commit `6ff72ded1b2d57010ddd2f87a46da8ddb40d7622`.
- `.gitl/orchestration/round-plan.json` — opened Round 6 and dependency-safe assignment chain, commit `7823a11d63b82531cb26f9e344f596c015fb4400`.
- `.gitl/evidence/round-6/worker-1.md` — this evidence record.
- No product source, generated extension product code, tests, workflows, dependencies, main branch, tags, releases, or publication artifacts changed in this supervisor step.

## Round-6 Dependency Plan
1. `R6-A1-MOBILE-SHELL-STRUCTURE-MAP` — **ready**. Research-only/product-no-change map of ChatGPT structures and competing discovery strategies; evaluate teal/blue/red and predeclare A2 gate.
2. `R6-A2-MOBILE-SHELL-BUILD` — waiting on A1. Implement only one evidence-selected platform/mode behind an experimental path, preserve rail fallback and exact Send identity.
3. `R6-A3-MOBILE-SHELL-REDTEAM` — waiting on A2 submitted-or-blocked. Falsify rerender, host-control insertion, malformed layout, route, cleanup, duplicate, and fail-closed behavior.
4. `R6-A4-MOBILE-SHELL-MOBILE-PERF` — waiting on A3 submitted. Narrow/mobile, keyboard/orientation, large-text, reduced-motion, resource/performance/browser measurement.
5. `R6-A5-MOBILE-SHELL-AUDIT` — waiting on A4. Independent bounded-prototype audit; successful outcome must expose later cross-adapter expansion rather than falsely mark the whole program complete.

Only A1 is activated.

## Acceptance Criteria
- Read maker first: PASS.
- Read state/orchestration/plan/task prompt/evidence contract/succession rule/deferred queue: PASS.
- Read mobile-shell brief and prior Round-5 audit evidence: PASS.
- Inspect current shell/source before defining assignments: PASS.
- Preserve Round-5 bounded certification and explicit exclusions: PASS.
- Keep both deferred questions local: PASS.
- Open an evidence-competitive research/build/Red-Team/mobile/audit chain: PASS.
- Activate only the earliest dependency-ready Round-6 assignment: PASS.
- Preserve BUILD-IDENTITY, DOCS-RECONCILIATION, and FINAL-CERT-PACKAGE: PASS.
- Product implementation during supervisor planning: NONE.
- Main/merge/auto-merge/tag/publish/release action: NONE.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route safety unchanged: PASS.
- Lease safety unchanged: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback preserved: PASS.
- No structural mount claimed as implemented: PASS.

## Risks and Limits
- The project-local orchestration README/task prompt still contain stale `review-after-round` global-freeze wording. Canonical Personal-Forge Policy B and current state govern execution; the drift remains for the later `DOCS-RECONCILIATION` program.
- Current ChatGPT host structure has not yet been durably mapped by A1, so no selector/container or teal/blue/red mode is pre-authorized here.
- A custom element/Shadow DOM design is plausible but not yet proven against all supported browsers, host CSP/Trusted Types conditions, or style/focus interactions.
- Structural UI near the composer has higher Send-safety and responsive-layout consequence than the existing rail. Any ambiguity must fail closed to the rail rather than force insertion.
- Physical Android, Firefox-Android/GeckoView, and calibrated low-end hardware evidence remain outside the current supervisor step.
- The lease-claim state write compacted historical state detail into summaries while preserving the current control fields and durable evidence references. Earlier detailed state remains recoverable in Git history at starting head `90ce760...`; later workers should treat evidence files and Git history as authoritative for prior-round detail rather than inferring lost detail from the compact summary.

## Recommended Next Action
The next eligible wake claims `R6-A1-MOBILE-SHELL-STRUCTURE-MAP` regardless of timer number. It should map current ChatGPT structural rows/columns at desktop and narrow/mobile breakpoints, compare explicit adapter contracts against generic inference and the rail fallback, evaluate teal/blue/red with primary/user evidence, create deterministic structure fixtures/probes, and predeclare the smallest first structural candidate plus falsification gate. It must not change product behavior.

## Assignment Status
- submitted
