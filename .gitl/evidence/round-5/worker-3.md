# Round 5 — Worker 3 Evidence — R5-A2-LONGCHAT-BUILD

## Worker and role

- [VERIFIED] Nominal wake: Worker 6 / Devil's Advocate–Release Auditor.
- [VERIFIED] Executed assignment role: Worker 3 / Builder, inherited under canonical earliest-ready succession.
- [VERIFIED] Canonical maker read before project writes: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07.
- [VERIFIED] Assignment: `R5-A2-LONGCHAT-BUILD`.
- [VERIFIED] Isolated branch: `agent/8.8-repair-resume`.

## Starting state and lease

- [VERIFIED] Pre-claim isolated-branch head: `8c589cd716a82f7327ab48389c0e61c0a2e7c1d0` (`chore(gitl): clarify A2 large-chat acceptance gate`).
- [VERIFIED] No project lease or active PR workflow was present on that head.
- [VERIFIED] Lease claim commit: `ee0cd89739eb5b90fc60ad19092d605643525135`.
- [VERIFIED] Lease holder: `scheduled-agent-6-longchat-builder-successor`; intended executed role: `builder`; assignment: `R5-A2-LONGCHAT-BUILD`.

## A1 evidence consumed

A1 bound the deterministic baseline to exact head `747031cc8160ba6febdd6fecb03d597fae36cd66`, run `31165679128`, job `92825797473`, artifact `8988876017`, SHA-256 `167fdef0bdfbb06a9f84f6a9a41bd3c4839ede6b0fa1bf698f87a933d9311952`.

At 2000 turns, answer selection issued 3 document-level assistant-selector queries and returned 6003 matches/sample, with p95 2.30 ms. At 180 turns it returned 543 matches/sample with p95 0.70 ms. A1 therefore selected the smallest falsifiable candidate: one stateless grouped assistant-selector query plus a newest-to-oldest tail reconstruction, before considering persistent observer/cache state.

Predeclared A2 success gates retained unchanged:

1. 2000-turn returned `querySelectorAll` matches/sample <= 40% of 6003 (>=60% reduction).
2. 2000-turn p95 < 2.30 ms.
3. 180-turn p95 <= 0.875 ms (no more than 25% regression from 0.70 ms).
4. Newest visible unfinished answer remains authoritative over older terminal markers and hidden/nested duplicates.
5. Zero Send-adjacent `submit`, `click`, `input`, or `keydown` actuation.
6. Focused Send/answer-selection tests, full unit suite, syntax, and generated userscript/extension parity pass on the exact committed candidate head.

## Builder design review

### Expert philosophy A — stateless bounded-polling minimalist

The selected candidate retains the existing polling architecture and replaces three full assistant selector enumerations with one grouped union query. It walks grouped matches newest-to-oldest and tracks the last `ANSWER_SCAN_LIMIT` raw matches per original selector, preserving the existing rule that the tail quota is applied before usability/content filtering. Overlapping elements retain the lowest original selector index. If the grouped selector or `Element.matches()` path throws, the design falls back to the legacy per-selector collector.

Predicted benefit: overlapping ChatGPT selectors should collapse roughly three returned match streams into one union stream, reducing returned-match materialization without introducing persistent observer state.

### Expert philosophy B — stateful incremental observer/index

A persistent MutationObserver-backed newest-answer index could avoid repeated full-history queries after initial indexing and may scale better asymptotically. It also adds invalidation, mutation-churn, route-transition, stale-node, hidden-node, and lifecycle recovery state. A1 did not justify paying that complexity cost before falsifying the stateless repair.

### Devil's-advocate cross-check

The grouped candidate is not automatically a bounded-DOM algorithm: the union `querySelectorAll` still enumerates the whole matching document. Its expected first-order win is deduplication of overlapping selectors (approximately three match streams to one), not elimination of history-size dependence. Therefore it must not be called the performance winner until the exact A2 benchmark proves both the >=60% returned-match reduction and p95 gates.

A subtle compatibility risk is selector-semantic reconstruction: overlapping nodes must count toward every original selector tail while retaining original selector priority. The proposed reverse walk explicitly does this. Any malformed-selector behavior must remain fail-safe through the legacy fallback. These claims remain implementation hypotheses until exact execution.

## Durable test work

- [VERIFIED] Commit `81cb49e30a66cfefd796f56784f9327f80df71c0` added `tests/e2e/long-chat-perf-a2.spec.js`.
- [VERIFIED] The fixture uses the real userscript path with 180/500/1000/2000-turn histories, 25 samples per operation, an older `HALT`, nested duplicate, newest visible unfinished response, and a hidden later `PROCEED` decoy.
- [VERIFIED] It instruments document `querySelectorAll`, measures answer selection plus `_beginSendAttempt` and `_sendEvidence`, asserts zero Send-adjacent actuation, and retains A1's predeclared numerical gates rather than changing thresholds after seeing A2 results.

## Execution-carrier attempts

- [VERIFIED] Temporary coordination base `gitl/r5-a2-ci-base` was created from lease commit `ee0cd89739eb5b90fc60ad19092d605643525135`.
- [VERIFIED] Commit `3ba8e4b2bbfe5666f5f81111fc5cea37b2e449ba` added an isolated draft-PR carrier.
- [VERIFIED] Draft PR #23 targeted only `gitl/r5-a2-ci-base`, never `main`.
- [VERIFIED] No PR workflow run became visible for that carrier.
- [VERIFIED] Commit `c2e581299f49ea3891b96b1a606324c68b1d8647` converted the carrier to an isolated-branch push trigger. The branch remained on that commit and no candidate product commit or exact test run appeared.
- [OBSERVED] The local execution environment also could not clone the repository because its outbound git/proxy resolution failed, so it could not safely materialize/build/test the complete generated userscript/extension pair locally.
- [VERIFIED] Because no execution-capable carrier materialized the candidate, no product source change was accepted and no passing result was inferred.
- [VERIFIED] Commit `01013755837d3719dd924d1b8b8a2a322238118b` removed the inactive temporary workflow.
- [VERIFIED] PR #23 was closed unmerged after cleanup.

The temporary coordination base may remain as an inert ref because the connected surface used for this bounded step did not provide a required safe cleanup path. It has no publication, merge, or execution authority.

## Product changes

- [VERIFIED] `ghost-in-the-loop.user.js`: unchanged by this assignment.
- [VERIFIED] `extension/content.js`: unchanged by this assignment.
- [VERIFIED] No Send journal, CHOICE, route, lease, uncertainty, actuator, or fail-closed behavior changed.
- [VERIFIED] `main` was not modified; no merge, auto-merge, tag, publication, or release occurred.

## Tests and CI

### Executed

- [VERIFIED] A1 baseline evidence and its exact CI binding were inspected before design work.
- [VERIFIED] Production `_collectAnswerCandidates`, `engineTick`, send-observation paths, and `scripts/build-extension.js` were inspected.
- [VERIFIED] The new A2 falsification fixture was committed durably.

### Not executed

- [VERIFIED] No exact-head A2 candidate benchmark executed.
- [VERIFIED] No candidate-head focused Jest, full unit, lint, syntax, or generated parity run executed.
- [VERIFIED] No run/job/artifact exists for an A2 product candidate in this bounded step.

Therefore `R5-A2-LONGCHAT-BUILD` is **blocked on implementation/execution materialization**, not submitted and not declared a performance success or failure.

## Acceptance criteria

- Directly justified by A1 measurements: **PASS for candidate design/test fixture**.
- Smaller than persistent-observer alternative: **PASS as design choice**.
- Exact before/after large-chat metric improvement: **NOT EXECUTED**.
- Small-chat regression gate: **NOT EXECUTED**.
- Newest-answer/terminal-marker correctness on candidate: **NOT EXECUTED**.
- At-most-once Send evidence at least as strict: **NO PRODUCT CHANGE; candidate verification pending**.
- Generated userscript/extension parity for candidate: **NOT EXECUTED**.
- Thresholds weakened post hoc: **NO**.

## Evidence/user lens

A1 already established the repository-specific scaling signal and competing implementation philosophies. No additional community claim was needed to choose between a deterministic measured hot path and an unexecuted candidate in this builder step; aggregate community sentiment is therefore **UNKNOWN / non-dispositive** here rather than invented. Mobile/lower-end practicality remains for the dedicated downstream mobile/performance assignment after a candidate is actually measured.

## Risks and limits

1. The stateless grouped-selector candidate remains a hypothesis until exact-head execution.
2. One grouped query still scales with matching history size; a >=60% match-materialization win could still leave linear growth.
3. Persistent observer/index approaches may ultimately outperform it but introduce more correctness/lifecycle state and should be considered only if this smaller approach is falsified or insufficient.
4. Connector-authored workflow commits did not produce the needed execution carrier in this bounded attempt; this is an execution-path limitation, not evidence about candidate correctness.
5. The committed A2 benchmark itself also requires an execution-capable environment before its numerical assertions can certify anything.

## Handoff

Create `R5-A2X-LONGCHAT-BUILD-EXEC` as the smallest dependency-safe recovery. Any eligible next wake should:

1. claim the shared lease;
2. materialize the stateless grouped-selector candidate on the isolated branch using an execution-capable path;
3. regenerate `extension/content.js` from the userscript with the repository build script;
4. run syntax/lint/generated parity, focused answer-selection/Send-journal Jest, full unit, and `tests/e2e/long-chat-perf-a2.spec.js --project=chromium` on one exact committed head;
5. preserve A1/A2 numerical and safety gates unchanged;
6. on PASS mark A2/A2X submitted and activate A3;
7. on deterministic FAIL preserve the failure and create only the smallest correction; do not weaken the oracle or Send safeguards;
8. remove any temporary carrier, close any temporary PR unmerged, release the lease, and hand off explicitly.

No human decision is required.
