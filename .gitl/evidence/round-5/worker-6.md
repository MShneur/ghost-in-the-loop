# Ghost Worker Evidence

## Identity
- Round: 5
- Worker evidence slot: 6
- Intended role: Devil's Advocate / release auditor
- Assignment ID: `R5-A5-LONGCHAT-AUDIT`
- Program: `LONG-CHAT-PERF`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07
- Starting isolated-branch head before lease claim: `095ab6722e3aa2b84533bff0378996152230c055`
- Lease claim commit: `1c71812f89c1948a885037f2902603f397b85f2e`
- Lease holder: `scheduled-agent-6-longchat-auditor`

## State Read
- Branch: `agent/8.8-repair-resume`.
- A1, A2X, A3, and A4 dependencies were submitted and bound to exact GitHub evidence before audit.
- `DQ-R4-LIFECYCLE-REVIEW` remains a local deferred human question and does not block this reversible independent audit.
- No valid competing lease existed at the inspected starting head. Canonical state recorded `lease: null` before the claim.
- The latest canonical Personal-Forge maker was read before project work. Its Policy B local-human-gate rule and earliest-ready succession rule govern this audit; the older project-local global review-freeze prose remains documentation drift rather than an execution stop.

## Audit Method
The audit did not accept predecessor summaries at face value. It independently checked four evidence layers:

1. **Source delta** — inspected exact candidate commit `9d49e34af07015f8064ac66398004180216efb08` and verified the product delta is confined to `_collectAnswerCandidates()` in `ghost-in-the-loop.user.js` plus generated `extension/content.js` parity.
2. **Exact CI bindings** — verified the recorded A1/A2X/A3/A4 workflow runs and jobs exist, completed successfully, and contain the expected exact-head guard/test steps.
3. **Raw artifact inspection** — downloaded all four recorded workflow artifacts, independently recomputed each ZIP SHA-256, and inspected the raw Playwright JSON or exact-head payload rather than relying only on evidence prose.
4. **Adversarial claim review** — compared the predeclared A1/A2 oracle, later Red Team results, mobile/cross-browser results, and the remaining Send-observation cost. No rerun was performed because the existing exact artifacts/logs resolved the material claims; another hosted rerun would add timing noise without discriminating an unresolved correctness or binding question.

## Exact Evidence Bindings

### A1 baseline — `R5-A1-LONGCHAT-BASELINE`
- Tested head: `747031cc8160ba6febdd6fecb03d597fae36cd66`
- Run: `31165679128`
- Job: `92825797473`
- Artifact: `8988876017`
- Independently recomputed artifact SHA-256: `167fdef0bdfbb06a9f84f6a9a41bd3c4839ede6b0fa1bf698f87a933d9311952`
- Raw artifact metadata independently identifies git commit `747031cc8160ba6febdd6fecb03d597fae36cd66`.
- Job conclusion: success; exact-head guard, focused correctness, baseline execution, and evidence-preservation steps all completed successfully.

### A2X candidate — `R5-A2X-LONGCHAT-BUILD-EXEC`
- Candidate/tested head: `9d49e34af07015f8064ac66398004180216efb08`
- Run: `31169354385`
- Job: `92837396863`
- Artifact: `8990318746`
- Independently recomputed artifact SHA-256: `eedfc0019ca9211fde25a442dbfe3a1d472f0c954b1fb8fa72e650f210994bc4`
- Artifact `final-head.txt` independently contains `9d49e34af07015f8064ac66398004180216efb08`.
- Exact job logs independently show the workflow materialized only the userscript/generated-extension candidate, generated the extension, committed and pushed candidate `9d49e34...`, verified remote ref equality, passed syntax/lint/generated parity, passed focused Jest 18/18, passed full unit 43/43 suites with 477 passed and 3 explicit TODO, and passed the exact A2 Chromium benchmark.

### A3 Red Team — `R5-A3-LONGCHAT-REDTEAM`
- Tested head: `73ec20832e6ae125fd38dd137f315ee695e186b6`
- Run: `31171939489`
- Job: `92845452541`
- Artifact: `8991319478`
- Independently recomputed artifact SHA-256: `eb54291a2aa50868b9281982422c548025f77130f1338d671a83094fae4273e3`
- Raw Playwright metadata independently identifies git commit `73ec20832e6ae125fd38dd137f315ee695e186b6`.
- Job conclusion: success; exact-head guard, focused Send-journal Jest, adversarial fixture plus unchanged A2 benchmark, and artifact upload completed successfully.

### A4 mobile/cross-browser — `R5-A4-LONGCHAT-MOBILE-PERF`
- Tested head: `290c5e8b1a3d16948db61875c9199cca0792ede3`
- Run: `31173733483`
- Job: `92851027653`
- Artifact: `8992007971`
- Independently recomputed artifact SHA-256: `fd3baa72e9e4bcc18938e2a497536d7b5d28f1d92bb13be908d3151c7b810d83`
- Raw Playwright metadata independently identifies git commit `290c5e8b1a3d16948db61875c9199cca0792ede3`.
- Job conclusion: success; exact isolated-head guard, focused Send-safety regression, Pixel-7 Chromium emulation plus desktop Firefox fixture, and artifact upload completed successfully.

## Independent Source-Diff Review
Exact candidate commit `9d49e34...` changes only `ghost-in-the-loop.user.js` and generated `extension/content.js`.

The legacy collector performed a full `document.querySelectorAll(sel)` for each original assistant selector and only afterward sliced each stream to the existing `ANSWER_SCAN_LIMIT=48` tail.

The candidate instead:
- builds one grouped selector union with `selectorList.join(',')`;
- performs one `document.querySelectorAll()` for the union;
- walks the static result newest-to-oldest;
- tracks an independent remaining raw-tail quota for every original selector;
- uses `Element.matches()` so an overlapping element counts toward every applicable original selector tail;
- retains the lowest applicable original selector index for prior priority semantics;
- applies node usability/content filtering after raw tail accounting, preserving the old ordering of quota versus content filtering;
- clears partial grouped results and falls back to the exact legacy per-selector collector if the grouped path throws.

No Send journal, actuator, CHOICE, route, lease, uncertainty, lifecycle-recovery, timer, network, or persistent observer/cache authority is added or weakened by this product delta.

## Raw Before / After Comparison
Each deterministic benchmark operation used 25 samples.

| Turns | A1 answer matches/sample | A1 p95 | A2X answer matches/sample | A2X p95 |
|---:|---:|---:|---:|---:|
| 180 | 543 | 0.70 ms | 181 | 0.40 ms |
| 500 | 1503 | 1.00 ms | 501 | 0.70 ms |
| 1000 | 3003 | 1.30 ms | 1001 | 0.70 ms |
| 2000 | 6003 | 2.30 ms | 2001 | 1.00 ms |

At 2000 turns the deterministic returned-match work fell from 6003 to 2001 matches/sample: **66.67% reduction**, exceeding the predeclared >=60% A2 gate. The same exact candidate also passed the predeclared strict 2000-turn p95 `<2.30 ms` gate and the 180-turn p95 `<=0.875 ms` regression gate.

The benchmark therefore genuinely discriminated the selected stateless grouped-selector candidate from the A1 legacy path; the decision was not based only on a later-selected wall-clock threshold.

## Red-Team Falsification Review
A3 independently attacked the candidate rather than repeating only the happy-path benchmark:
- mixed per-selector raw tails with 64 later hidden nodes matching only one selector tier;
- older `HALT`, `PROCEED`, and `CHOICE` pressure against a newer unfinished answer;
- 12 passes of historical assistant-node replacement plus replacement of the newest answer;
- route change;
- already-uncertain Send journal;
- foreign live conversation lease.

Result: the candidate survived at the tested deterministic desktop-Chromium envelope. After DOM replacement churn, answer selection remained 2001 matches/sample with p95 about 2.20 ms, active intervals remained 4, MutationObservers remained 3, and submit/click/input/keydown counts remained zero. Route change, uncertain Send, and foreign lease remained fail closed.

## Mobile / Cross-Browser Review
A4 exact evidence supports a bounded practicality claim, not hardware certification.

### Pixel-7 Chromium emulation
- CSS viewport: 412 x 839
- DPR: 2.625
- touch points: 1
- 180-turn answer p95: 0.40 ms, 181 matches/sample
- 2000-turn answer p95: 1.70 ms, 2001 matches/sample
- active intervals: 4 -> 4
- MutationObservers: 3 -> 3
- panel count: 1
- host composer/original Send: visible and connected
- submit/click/input/keydown: 0/0/0/0

### Desktop Firefox
- Configured narrow viewport: 412 x 915
- DPR: 1
- touch points: 0
- 180-turn answer p95: 1 ms, 181 matches/sample
- 2000-turn answer p95: 2 ms, 2001 matches/sample
- active intervals: 4 -> 4
- MutationObservers: 3 -> 3
- panel count: 1
- submit/click/input/keydown: 0/0/0/0

The browser matrix preserves the same selector-cardinality trend and stable resource proxies through 2000 turns. It does not establish physical Android CPU, memory, battery, thermal, scheduler, or resource-pressure behavior, and desktop Playwright Firefox is not GeckoView/Firefox-Android.

## Send / CHOICE / Route / Lease / Uncertainty Audit
- **Send authority:** PASS. Candidate source diff does not touch Send authority; A2X focused Send/answer-selection Jest passed 18/18; A1/A2X/A3/A4 benchmark safety-event counters all remained zero.
- **At-most-once Send journal:** PASS at regression scope. No journal logic was changed. A3 explicitly exercised uncertain Send and remained fail closed.
- **CHOICE/newest-answer semantics:** PASS at tested scope. A1/A2X fixtures retained newer unfinished-answer authority over stale/hidden terminal markers; A3 added older CHOICE pressure and mixed selector-tail asymmetry without falsifying selection.
- **Route safety:** PASS at tested scope. A3 route-change recovery remained fail closed.
- **Lease safety:** PASS at tested scope. A3 foreign live conversation lease remained fail closed.
- **Uncertainty:** PASS at tested scope. A3 already-uncertain Send remained blocked and did not resend.

## Accepted Claims
1. **Accepted:** For the deterministic ChatGPT retained-DOM fixtures through 2000 assistant turns, the grouped-selector collector removes redundant overlapping assistant-selector result enumeration and reduces returned answer-match materialization by 66.67% at 2000 turns while preserving the predeclared small/large timing gates.
2. **Accepted:** The product delta preserves generated userscript/extension parity and existing focused/full-unit regressions on the exact candidate head.
3. **Accepted:** Newest-answer and terminal-marker selection semantics survive the tested hidden/nested/mixed-tail and DOM-replacement adversarial cases.
4. **Accepted:** The tested Send/CHOICE/route/lease/uncertainty safeguards remain fail closed; no Send-adjacent actuation was observed in the long-chat fixtures.
5. **Accepted, bounded:** The stateless approach is practical enough to retain at the tested hosted Pixel-7 Chromium-emulation and desktop-Firefox 2000-turn envelope because no resource accumulation or correctness failure was observed and answer-read timings stayed in the low single-digit millisecond range on those runners.

## Rejected / Narrowed Claims
1. **Rejected:** “Long-chat lookup is now bounded or constant-time.” The grouped union still materializes a history-linear matching stream: answer matches/sample grow 181 -> 501 -> 1001 -> 2001.
2. **Rejected:** “LONG-CHAT-PERF proves Ghost was the dominant cause of real ChatGPT long-thread lag.” The fixture proves a Ghost DOM-read scaling hot path and an improvement; host rendering, memory, virtualization, media/code blocks, React work, and browser pressure remain outside causal attribution.
3. **Rejected:** “Pixel-7 evidence certifies physical Android or low-end hardware.” Playwright device emulation does not certify physical CPU, memory, battery, thermal, scheduling, or resource-pressure behavior.
4. **Rejected:** “Firefox evidence certifies Firefox Android/GeckoView.” The tested Firefox project is desktop Gecko with configured viewport/UA constraints.
5. **Rejected:** “The safety-critical Send-observation performance problem is solved.” At 2000 turns the post-candidate begin-Send and send-evidence probes still return **8004 assistant-selector matches/sample**. A3 measured p95 about 6.40 ms / 3.60 ms; A4 Pixel emulation measured about 4.9 ms / 4.1 ms; desktop Firefox measured about 3 ms / 3 ms. This cost remains history-linear.
6. **Rejected:** Hosted-CI p95 values as a calibrated release hardware budget. Cross-run timing noise is visible; deterministic selector cardinality, correctness, and resource accumulation are stronger cross-run evidence.

## Competing Expert Lenses and Resolution
### Stateless bounded-polling minimalist
Evidence supports retaining this design now. It produced a large predeclared deterministic query-work reduction without introducing lifecycle/cache state and survived adversarial/multi-browser tests.

### Persistent MutationObserver/index advocate
This remains a credible future asymptotic alternative, especially if physical-device or much-larger-history evidence later shows the one-union scan is insufficient. Current evidence does not justify its additional stale-node, route-invalidation, mutation-churn, lifecycle-recovery, cleanup, and duplicate-observer failure surface.

### Safety/reliability dissent
The dominant measured remaining Ghost read cost during an unresolved Send is the 8004-match/sample observation path. It must not be “optimized” by weakening independent delivery evidence or the uncertainty block. A future optimization may reduce redundant read work only if it preserves the journal evidence contract exactly.

### End-user lens
Long-thread users benefit from reduced repeated DOM work while preserving context and newest-answer correctness. Community reports support the user value of addressing long-thread lag, but they do not prove Ghost-specific causal dominance and are therefore not used to expand certification claims.

### Resolution
Keep the grouped-selector answer collector for the current bounded objective. Carry the linear union scan and especially the Send-observation scan as explicit limits/future performance work, not as reasons to introduce a more stateful architecture without new discriminating evidence.

## Audit Verdict
**CERTIFIED AT BOUNDED DETERMINISTIC / HOSTED-PLAYWRIGHT SCOPE.**

`LONG-CHAT-PERF` satisfies the Round-5 objective at the tested 180/500/1000/2000-turn retained-DOM envelope: the predeclared A2 improvement is real and exact-head bound, adversarial newest-answer/fail-closed behavior remains intact, and Pixel-7 Chromium emulation plus desktop Firefox show stable resource proxies and correctness through 2000 turns.

This verdict explicitly excludes:
- asymptotically bounded lookup;
- optimization of the 8004-match/sample Send-observation path;
- proof of total host-page responsiveness improvement or Ghost causal dominance;
- physical Android / low-end-device certification;
- Firefox-Android/GeckoView certification;
- calibrated CPU/memory/battery/thermal budgets;
- host-DOM behavior outside the deterministic fixture or future host virtualization changes.

No additional rerun is required for this bounded verdict because the exact source diff, exact workflow job bindings, independently checked artifact hashes/heads, raw benchmark outputs, adversarial fixture, and browser matrix are mutually consistent. A rerun on the same hosted matrix would not discriminate an unresolved claim.

## Deferred Human Review
A new local deferred question should be queued as `DQ-R5-LONGCHAT-REVIEW`: accept the bounded Round-5 certification with its explicit linear/physical-platform limits, or reopen the program with a named stronger release-critical requirement such as physical-device evidence, a larger retained-history envelope, or a Send-observation optimization that preserves the journal contract.

Under canonical Policy B this question must not freeze the independent next program. Final release certification must surface it again if still unresolved.

## Next Dependency-Safe Program
The next required independent roadmap program is `MOBILE-SHELL-STRUCTURAL` using the existing brief `.gitl/briefs/mobile-shell-concepts.md`.

A successor supervisor/integrator should open the next round, reread that brief and current maker, preserve the accepted Long Chat candidate and all explicit limits, and publish the dependency-safe mobile-shell research/build/Red-Team/mobile/audit chain. The audit does not pre-authorize a product implementation for that program.

## Safety Checks
- Product source changed by A5: **NO**.
- Generated extension changed by A5: **NO**.
- Send/CHOICE/route/lease/uncertainty behavior changed by A5: **NO**.
- Benchmark thresholds changed after results: **NO**.
- `main` modified: **NO**.
- Merge / auto-merge / tag / publish / release: **NONE**.

## Risks and Limits
1. The accepted one-union answer query remains history-linear.
2. The safety-critical Send-observation path remains a larger history-linear read cost at 2000 turns.
3. Exact hosted timing varies materially between runs; deterministic cardinality and correctness are the stronger audit anchors.
4. Synthetic retained DOM can diverge from future ChatGPT virtualization or markup.
5. Physical mobile performance and Firefox-Android remain uncertified.
6. Two pre-existing high-severity dependency-audit findings and GitHub Actions Node-runtime deprecation warnings remain maintenance signals outside this performance candidate's source delta.
7. Older project-local global review-freeze prose remains orchestration-policy drift for later docs reconciliation; current execution follows the canonical maker.

## Assignment Status
- `R5-A5-LONGCHAT-AUDIT`: **submitted — bounded certification PASS**
