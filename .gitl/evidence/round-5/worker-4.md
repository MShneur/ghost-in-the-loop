# Ghost Worker Evidence

## Identity
- Round: 5
- Worker: 4
- Role: test-engineer-red-team
- Executed by nominal wake: Worker 6 / Devil's Advocate–release auditor successor
- Assignment ID: R5-A3-LONGCHAT-REDTEAM
- Started at: 2026-08-07T10:49:30Z
- Finished at: 2026-08-07T10:56:27Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `d87903ee96b423201320a2414f310361e53afbd7`
- Lease claim commit: `0cb75a1db0f0a144c3af1f7e75a848310c8d8c9e`
- Lease holder: `scheduled-agent-6-longchat-redteam-successor`
- Dependencies: `R5-A2X-LONGCHAT-BUILD-EXEC:submitted`
- Maker authority read first: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07.
- Deferred queue read: `DQ-R4-LIFECYCLE-REVIEW` remains local to Round 4 and does not block LONG-CHAT-PERF.

## Step Performed
Added `tests/e2e/long-chat-redteam.spec.js` in commit `73ec20832e6ae125fd38dd137f315ee695e186b6` and executed it on that exact head with the unchanged A2 benchmark and focused answer-selection/Send-journal Jest.

The adversarial fixture attacks three distinct failure classes without rewriting production:

1. **Mixed selector tails.** A 1,200-turn history adds 64 later hidden nodes that match only the first ChatGPT assistant selector. This deliberately pushes the newest valid answer outside selector zero's raw 48-node tail while leaving it eligible through the other selector tails. The test verifies the grouped-selector reconstruction preserves the prior per-selector semantics and does not let older `CHOICE` or hidden `PROCEED` markers win.
2. **Mutation and DOM replacement churn.** A 2,000-turn history undergoes 12 passes of repeated assistant-node replacement across hundreds of historical turns, followed by replacement of the newest unfinished answer itself. The fixture reruns the unchanged A2 2,000-turn performance oracle and records timer/MutationObserver counts before and after churn.
3. **Fail-closed state transitions.** Route change, an already-uncertain Send journal, and a foreign live tab lease are injected separately. `recoverAfterWake()` must refuse to resume, remain/enter `PAUSED`, preserve the uncertain journal where applicable, and produce zero submit/click/input/keydown actuation.

## Research Sources
### Primary / platform evidence
- MDN `Document.querySelectorAll()`: a grouped selector returns a static, non-live `NodeList`, in document order, with each matching element represented once even when it matches multiple selectors. Implication: the grouped collector's reverse document walk is a valid deterministic substrate, but the query still materializes the matching history and therefore remains history-size dependent.
- MDN `MutationObserver.observe()` / `disconnect()`: observers can watch subtrees and must be explicitly disconnected to stop callbacks. Implication: the competing persistent observer/index philosophy could reduce repeated full-history reads but carries real lifecycle, invalidation, mutation-churn, and cleanup state that the current stateless candidate avoids.

### Repository evidence
- A1 exact baseline: head `747031cc8160ba6febdd6fecb03d597fae36cd66`, run `31165679128`, job `92825797473`, artifact `8988876017`; 2,000-turn answer selection returned 6,003 qSA matches/sample at p95 2.30 ms.
- A2X exact candidate: head `9d49e34af07015f8064ac66398004180216efb08`, run `31169354385`, job `92837396863`, artifact `8990318746`; 2,000-turn answer selection returned 2,001 matches/sample at p95 1.00 ms while focused/full-unit/generated-parity/safety gates passed.
- A2X also showed the Send-observation path remained history-linear: 8,004 qSA matches/sample at 2,000 turns.

### Aggregate user/community lens
Qualitative Reddit reports from long-chat ChatGPT users describe browser lag, freezing, delayed typing/scrolling, and pressure to restart conversations even when history/context matters. These reports support the user-value of reducing repeated long-history DOM work, but they are anecdotal and lower-ranked than the exact Ghost fixtures. They do not prove Ghost is the dominant source of host-page latency.

## Competing Expert Approaches
### Expert A — stateless bounded-polling minimalist
Keep the accepted grouped union query and reconstruct each original selector's last-48 raw tail without persistent state. Advantages: low maintenance surface, no new lifecycle cache, deterministic fallback to legacy selectors, and exact A1/A2 measurable gains. Failure mode: still linear in matching history and may become expensive at larger retained histories.

### Expert B — persistent incremental observer/index
Maintain the newest assistant candidates through MutationObserver-driven state and use polling mainly for validation/recovery. Potential advantage: better asymptotic steady-state scaling. Failure mode: stale nodes, route invalidation, hidden-node transitions, lifecycle rehydration, duplicate observers, and more correctness state around Send/recovery.

### Devil's Advocate resolution
A3 attempted to falsify Expert A under selector-tail asymmetry and heavy replacement churn before paying Expert B's state complexity. It did not falsify the answer-selection candidate at the current deterministic desktop-Chromium oracle. This is not proof that the stateless design is asymptotically optimal; the remaining union query and Send-observation scans still scale with history.

## Changes
- Added `tests/e2e/long-chat-redteam.spec.js`.
- Product files changed: none.
- Generated extension changed: none.
- Temporary execution base: `gitl/r5-a3-redteam-base`.
- Temporary carrier commit on that base: `26be4da6ee26efb8b93b05569d0fce0fb17eaeec`.
- Temporary draft PR: #25, base `gitl/r5-a3-redteam-base`, head `agent/8.8-repair-resume`; closed unmerged at 2026-08-07T10:56:27Z.
- The temporary base ref may remain inert because no safe delete-ref operation was required or available for this bounded step. It never targeted `main` and has no merge/publication authority.

## Tests
### Exact execution binding
- Tested head: `73ec20832e6ae125fd38dd137f315ee695e186b6`
- Workflow run: `31171939489`
- Job: `92845452541`
- Artifact: `8991319478` (`r5-a3-long-chat-redteam`)
- Artifact SHA-256: `eb54291a2aa50868b9281982422c548025f77130f1338d671a83094fae4273e3`
- Exact-head guard: PASS (`expected == actual == 73ec20832e6ae125fd38dd137f315ee695e186b6`)

### Focused Jest
Command:
`npx jest tests/issuefixes.test.js tests/sendtransaction.test.js --runInBand`

Result: PASS — 2/2 suites, 18/18 tests.

### Chromium adversarial + unchanged A2 benchmark
Command:
`npx playwright test tests/e2e/long-chat-redteam.spec.js tests/e2e/long-chat-perf-a2.spec.js --project=chromium`

Result: PASS — 3/3 tests in 5.5 s.

#### Adversarial 2,000-turn measurement before replacement churn
- p50: ~1.20 ms
- p95: ~2.10 ms
- qSA calls/sample: 1
- qSA matches/sample: 2,001
- qSA time/sample: ~0.552 ms
- active intervals: 4
- interval creates: 5
- MutationObservers created: 3
- safety events: `{submit:0, click:0, input:0, keydown:0}`

#### After 12 passes of historical DOM replacement + newest-answer replacement
- p50: 1.00 ms
- p95: ~2.20 ms
- qSA calls/sample: 1
- qSA matches/sample: 2,001
- qSA time/sample: ~0.576 ms
- active intervals: 4
- interval creates: 5
- MutationObservers created: 3
- safety events: `{submit:0, click:0, input:0, keydown:0}`

The unchanged A2 oracle remained satisfied after churn: qSA matches/sample <= 2,401.2 and p95 < 2.30 ms.

#### Unchanged A2 benchmark repeated on the same exact A3 head
- 180 turns: answer p95 ~0.70 ms, 181 matches/sample.
- 500 turns: answer p95 ~1.20 ms, 501 matches/sample.
- 1,000 turns: answer p95 1.00 ms, 1,001 matches/sample.
- 2,000 turns: answer p95 ~2.20 ms, 2,001 matches/sample.
- safety events: all zero.

The repeat also reinforced a remaining risk rather than hiding it: at 2,000 turns begin-Send observation was 8,004 matches/sample with p95 ~6.40 ms, and send-evidence observation was 8,004 matches/sample with p95 ~3.60 ms. A3 did not alter that safety-critical evidence path.

### CI maintenance signals
- `npm ci` reported 2 pre-existing high-severity dependency findings.
- GitHub Actions emitted Node-20/action runtime deprecation warnings.
These are maintenance signals, not failures of the A3 acceptance criteria.

## Acceptance Criteria
- Stress at least one materially larger history than A1 smallest baseline: **PASS** — 1,200 and 2,000-turn adversarial histories.
- Older HALT/PROCEED/CHOICE never override newer unfinished answer: **PASS**.
- Hidden and nested duplicates preserve newest-answer selection: **PASS**.
- Mixed selector-tail reconstruction preserves per-selector semantics: **PASS**.
- Mutation churn and DOM replacement create no runaway observers/timers or stale-node actuation: **PASS** — resource counts unchanged and newest replacement selected.
- Route change remains fail closed: **PASS**.
- Uncertain Send remains fail closed and not resent: **PASS**.
- Foreign live conversation lease remains fail closed: **PASS**.
- Zero duplicate/adjacent Send actuation: **PASS** — all instrumented event counts zero.
- Performance claims bound to exact head, fixture size, raw measurements: **PASS**.
- Existing A2 performance oracle survives adversarial mutation load: **PASS**.

## Safety Checks
- Send authority unchanged: PASS — no production change and no Send actuation.
- CHOICE behavior unchanged: PASS — older CHOICE marker does not override newest unfinished answer.
- Route safety unchanged: PASS — route change pauses recovery.
- Lease safety unchanged: PASS — foreign lease pauses recovery.
- Uncertainty safeguard unchanged: PASS — uncertain Send journal remains a hard block.
- No `main`, merge, auto-merge, tag, release, or publish action: PASS.

## Risks and Limits
1. The accepted grouped query still scales linearly with retained matching history; A3 only shows it survives the tested 2,000-turn adversarial mutation envelope.
2. Send-observation scans remain linear and were measurably slower in this exact run than in A2X. They are safety-critical and were deliberately not weakened or optimized by Red Team.
3. This A3 execution is desktop Chromium only. Pixel-7 Chromium emulation and desktop Firefox belong to A4; neither physical Android nor Firefox-Android/GeckoView may be inferred here.
4. Reddit reports support user impact but do not establish causal attribution to Ghost.
5. A persistent observer/index remains a credible future alternative if downstream mobile/cross-browser evidence shows the stateless approach insufficient; A3 did not justify introducing that complexity now.

## Recommended Next Action
Mark `R5-A3-LONGCHAT-REDTEAM` submitted and activate `R5-A4-LONGCHAT-MOBILE-PERF`. A4 should run the accepted long-chat path under Pixel-7 Chromium emulation and desktop Firefox where portable, measure resource accumulation and usability, retain the exact distinction between emulation and physical-device certification, and carry the unresolved linear Send-observation cost forward as a performance limit without weakening the journal.

## Assignment Status
- submitted
