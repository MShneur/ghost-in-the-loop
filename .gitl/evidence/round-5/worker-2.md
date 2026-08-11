# Ghost Worker Evidence

## Identity
- Round: 5
- Worker: 2
- Role: Researcher / architect
- Assignment ID: `R5-A1-LONGCHAT-BASELINE`
- Started at: `2026-08-07T09:14:12Z`
- Finished at: `2026-08-07T09:27:30Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head before lease claim: `2d40a1467e73890ba080b8071e7cd873d4fa45aa`
- Lease claim commit: `655783d0ddd41ff215fa0fa4945d1f50ad14d08f`
- Dependencies: `R5-SUPERVISOR-PLAN:submitted` satisfied.
- Earliest ready assignment: `R5-A1-LONGCHAT-BASELINE`.
- Active conflicting workflow before claim: none observed for the inspected starting head.
- Deferred human question: `DQ-R4-LIFECYCLE-REVIEW` remains local under canonical Personal-Forge Policy B and does not block independent reversible `LONG-CHAT-PERF` work.

## Step Performed

Applied the latest canonical Personal-Forge automation maker before project work, claimed the shared lease, then established a deterministic production-path long-chat correctness/performance baseline before any product optimization.

The benchmark loads the real `ghost-in-the-loop.user.js` against the ChatGPT platform adapter and synthesizes histories of 180, 500, 1000, and 2000 assistant turns. Every size contains an older HALT marker, a nested assistant duplicate, a newest visible unfinished response, and a later hidden PROCEED decoy. The fixture instruments `Document.prototype.querySelectorAll` and read-only Ghost observation paths while counting any submit/click/input/keydown actuation.

The benchmark directly measures three hot paths:

1. `Adapter.getLastText()` / answer selection.
2. `_beginSendAttempt()` read-only pre-dispatch observation.
3. `_sendEvidence()` read-only dispatch-confirmation observation with an injected synthetic transaction that cannot authorize a Send.

No production source was changed in A1.

## Research Sources

### Primary browser/API evidence
- MDN `Document.querySelectorAll()`: returns a static `NodeList` containing all elements matching a selector group in document order. Implication: the current `matches = [...document.querySelectorAll(sel)]` performs full result enumeration before Ghost applies `ANSWER_SCAN_LIMIT=48`; the limit bounds post-query candidate processing, not the number of DOM matches returned by each full-document query. Source: https://developer.mozilla.org/en-US/docs/Web/API/Document/querySelectorAll
- MDN `MutationObserver.observe()`: an observer can watch child/subtree changes and receives matching mutation notifications. Implication: an incremental event-driven candidate is technically viable, but subtree observation introduces callback/state/invalidation complexity and must beat the simpler read-only polling repair before selection. Source: https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver/observe

### Repository evidence
- `ghost-in-the-loop.user.js`: `ANSWER_SCAN_LIMIT = 48`, but `_collectAnswerCandidates()` currently executes one full `document.querySelectorAll(sel)` for each assistant selector, then slices each result to its last 48 nodes.
- ChatGPT currently supplies three overlapping assistant selectors. In the deterministic fixture each selector sees the same assistant-turn population, so the current answer scan materializes approximately three times the assistant-node count per observation.
- `_beginSendAttempt()` calls `Adapter.getLastText()` and separately `_qAll(PLAT.assistant).length`, duplicating assistant enumeration while constructing the at-most-once Send journal baseline.
- `_sendEvidence()` separately counts assistants and calls `Adapter.getLastText()` while a transaction is unresolved. This is read-only confirmation evidence and must remain independent of actuator authority.
- `engineTick()` calls `Adapter.getLastText()` while RUNNING, so the scaling cost is recurrent rather than limited to explicit Send attempts.

### Aggregate end-user/community evidence
Community reports are qualitative and not root-cause proof. They nevertheless establish that long-chat browser performance is a real user-visible problem worth measuring:
- Reddit, 2026-03-19: a user reports typing/scroll lag in long ChatGPT conversations and describes trimming rendered history as a workaround.
- Reddit, 2026-05-08: users report long threads causing lag, unresponsive controls, and browser-tab stalls; one extension approach trims older conversation nodes.
- Reddit, 2026-03-13: a user reports one very long conversation freezing the web tab across browsers while shorter chats remain usable.
- Target-repository GitHub issue searches for `performance long chat slow` and `slow` returned no matching issues during this wake. Target-project community evidence is therefore UNKNOWN rather than inferred from broader Reddit anecdotes.

### Evidence-competitive expert lenses

**Expert A — bounded-polling minimalist.** Keep Ghost's simple polling/recovery architecture but eliminate redundant full-document selector work. Prediction: a semantics-preserving grouped-selector tail collector can cut full-document assistant-match enumeration by about two thirds for ChatGPT without introducing persistent state or new authority.

**Expert B — event-driven incremental observer.** Track the newest assistant candidate through mutation events and keep polling as recovery/validation. Prediction: steady-state answer selection can approach history-size-independent lookup, but mutation churn, virtualized DOM replacement, stale-node invalidation, and lifecycle recovery add state complexity that must be separately falsified.

**Aggregate user persona.** Heavy long-thread users care about typing/scroll responsiveness and preserving context. Community anecdotes favor reducing rendered/history work, but do not discriminate whether Ghost's polling, host rendering, or other page work dominates total user-visible latency.

**Adoption/upstream lens.** Standard browser APIs support grouped selectors and mutation observation. No authoritative OpenAI host-DOM API or stable newest-answer signal was found in this bounded step. Platform-private adapter signals therefore remain UNKNOWN and should not be promoted into a dependency.

**Reliability/security/maintenance lens.** Persistent observer/caching state has more invalidation and stale-node failure modes than a stateless read-only selector optimization. Any optimization must preserve existing newest-answer ordering, fallback selector resilience, Send journal evidence, CHOICE, route, lease, and uncertainty behavior.

**Constrained hardware/mobile/performance lens.** The exact CI measurements show scaling, not a physical low-end-device budget. The mobile specialist must later test the selected change under Pixel-class/constrained conditions before a low-end claim is made.

**Outside-frame candidate.** A future adapter capability could consume a stable host-provided newest-turn observation signal rather than repeatedly scanning conversation DOM. No sufficiently stable cross-platform contract was found here; network telemetry or heuristics must never gain Send authority.

**Test/certification lead.** Use deterministic query-work as the primary discriminating metric and p50/p95 as supporting timing evidence. Do not invent an absolute millisecond budget from this runner.

## Changes
- `tests/e2e/long-chat-perf.spec.js` — new deterministic real-userscript benchmark/correctness fixture; commit `9cdf27339ae4cff29ebd20c1e683838f8d81270d`.
- `.github/workflows/r5-a1-longchat-baseline.yml` — temporary guarded carrier on the isolated working branch; carrier head tested at `747031cc8160ba6febdd6fecb03d597fae36cd66`; removed from the working branch in cleanup commit `38d86bb918ecc7247d4f5b5afbed0f3e706a4ddc`.
- Temporary carrier PR #21 — closed unmerged after its base did not yet contain the workflow, before authoritative execution.
- Temporary carrier PR #22 — isolated base `gitl/r5-a1-baseline-base`, draft, closed unmerged after successful evidence capture.
- Product source changed: none.
- `main` changed: none.

## Tests

### Exact-head guard
- Tested head: `747031cc8160ba6febdd6fecb03d597fae36cd66`
- Workflow run: `31165679128`
- Job: `92825797473`
- Guard expected: `747031cc8160ba6febdd6fecb03d597fae36cd66`
- Guard actual: `747031cc8160ba6febdd6fecb03d597fae36cd66`
- Conclusion: PASS.

### Existing focused correctness guards
Command:
`npx jest tests/issuefixes.test.js tests/sendtransaction.test.js --runInBand`

Result:
- Test suites: 2 passed / 2 total.
- Tests: 18 passed / 18 total.
- Failures: 0.

### Exact long-chat baseline
Command:
`npx playwright test tests/e2e/long-chat-perf.spec.js --project=chromium`

Result:
- 1 passed / 1 total.
- Safety events across the benchmark: submit 0, click 0, input 0, keydown 0.
- For every history size, the selected answer was the newest visible unfinished response; the older `[[GITL::HALT]]` and later hidden `[[GITL::PROCEED]]` did not win selection.

### Raw measurements
Each operation used 25 repeated samples.

| Assistant turns | DOM nodes | Answer p50 / p95 ms | Answer qSA calls / matches per sample | Begin-Send p50 / p95 ms | Begin-Send qSA calls / matches | Send-Evidence p50 / p95 ms | Send-Evidence qSA calls / matches |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 180 | 795 | 0.60 / 0.70 | 3 / 543 | 0.70 / 0.90 | 6 / 1086 | 0.70 / 1.00 | 10 / 1086 |
| 500 | 2075 | 0.80 / 1.00 | 3 / 1503 | 1.10 / 1.40 | 6 / 3006 | 1.20 / 1.40 | 10 / 3006 |
| 1000 | 4075 | 1.20 / 1.30 | 3 / 3003 | 1.90 / 2.20 | 6 / 6006 | 2.00 / 2.10 | 10 / 6006 |
| 2000 | 8075 | 2.00 / 2.30 | 3 / 6003 | 3.30 / 3.70 | 6 / 12006 | 3.60 / 3.80 | 10 / 12006 |

At 2000 turns, answer selection returned 6003 selector matches per sample versus 543 at 180 turns: `11.06x`, essentially the history-size ratio (`2000/180 = 11.11x`). The fixed three `querySelectorAll` calls therefore do not imply bounded DOM work; returned-match enumeration scales approximately linearly with history size in this fixture.

`_beginSendAttempt()` and `_sendEvidence()` each double the expensive assistant-match enumeration versus `getLastText()` alone because they count assistants and then perform answer selection. `_sendEvidence()` makes additional input/stop queries, explaining 10 total qSA calls while the assistant-match total remains 2x answer selection.

Timing also rises with history size on this runner, but these absolute millisecond values are not a physical-device performance budget.

### Artifact
- Name: `r5-a1-long-chat-baseline`
- Artifact ID: `8988876017`
- Size: 7951 bytes
- SHA-256: `167fdef0bdfbb06a9f84f6a9a41bd3c4839ede6b0fa1bf698f87a933d9311952`
- Bound workflow run/head: `31165679128` / `747031cc8160ba6febdd6fecb03d597fae36cd66`.

### CI maintenance observations
- `npm ci` reported two pre-existing high-severity dependency-audit findings. A1 did not change dependencies.
- GitHub Actions warns that the Node-20 action runtime used by `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` is deprecated and forced to Node 24 by the runner. This is a maintenance signal, not a long-chat benchmark failure.

## Acceptance Criteria
- Deterministic 180/500/1000/2000-turn real-userscript fixture: PASS.
- Per-operation timing and query/scan counts recorded with DOM size: PASS.
- Newest-answer correctness with older terminal marker, nested duplicate, hidden duplicate, and unfinished newest response: PASS.
- Repeated-sample p50/p95 recorded: PASS.
- Primary/upstream evidence gathered: PASS — MDN browser API contracts.
- User/community evidence gathered where useful: PASS — qualitative Reddit reports; target-project issue evidence UNKNOWN.
- Competing implementation philosophies and outside-frame candidate compared: PASS.
- Smallest falsifiable next implementation identified: PASS.
- No Send actuation or new actuator authority: PASS — zero submit/click/input/keydown events.
- Production optimization before baseline: NONE.

## Safety Checks
- Send authority unchanged: PASS — product source unchanged and benchmark generated zero Send-adjacent events.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged: PASS.
- Uncertainty fail-closed behavior unchanged: PASS.
- Newest-answer/terminal-marker assertions were strengthened rather than relaxed: PASS.
- No `main`, merge, auto-merge, tag, publish, or release action: PASS.

## Risks and Limits
- This fixture proves Ghost's current document-query work scales with synthetic retained DOM size; it does not prove Ghost is the dominant cause of real ChatGPT long-thread slowness. Host rendering, React work, images, code blocks, mutation churn, and browser memory may dominate in the field.
- CI timing is fast desktop Chromium and must not be promoted to a low-end/mobile budget.
- The three ChatGPT selectors overlap completely in this fixture. Real host markup can exercise fallback distinctions, so simply deleting fallback selectors would be unsafe.
- An event-driven observer could improve asymptotic steady-state lookup but adds lifecycle and stale-node state that is not justified until the smaller stateless repair is tried.
- Community reports are anecdotal and may reflect host-side rendering behavior rather than Ghost-specific overhead.

## Recommended Next Action

`R5-A2-LONGCHAT-BUILD` should implement the smallest semantics-preserving **grouped-selector tail collector**, not a persistent observer/cache yet:

1. Attempt one grouped `document.querySelectorAll(selectors.join(','))`, which browser semantics return as a de-duplicated document-ordered union.
2. Walk that union backward and classify each node with `Element.matches()` against the original selector list, tracking up to the existing `ANSWER_SCAN_LIMIT=48` matches per original selector.
3. Preserve the lowest original `selectorIndex` for elements matching multiple selectors, preserve existing usability/content filters and final DOM-order selection, and fall back to the current per-selector path if grouped selection fails.
4. Do not cache actuator state, do not alter `_beginSendAttempt` / `_sendEvidence` authority, and do not change Send/CHOICE/route/lease/uncertainty semantics.

Predeclared falsification criterion for A2:
- On the same exact 2000-turn fixture, reduce answer-selection returned full-document qSA matches by **at least 60%** from the A1 baseline of 6003 per sample while preserving all correctness and zero-actuation assertions.
- The 2000-turn total answer-selection p95 must be lower than the A1 2.30 ms baseline in the same runner class; if timing noise prevents a clear direction, the deterministic query-work reduction remains the primary metric for Red Team/mobile follow-up rather than inventing a new budget.
- The 180-turn p95 must not regress by more than 25% relative to the A1 0.70 ms baseline.
- If the grouped-tail implementation misses these gates or breaks fallback semantics, reject it and hand the event-driven observer candidate to Red Team rather than weakening assertions.

## Assignment Status
- submitted
