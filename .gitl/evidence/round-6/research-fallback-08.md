# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 4 / Test engineer / Red Team
- Executed role: structural-conformance test architect with Red-Team, reliability, accessibility, and constrained-runtime dissent
- Research fallback ID: `R6-RESEARCH-FALLBACK-STRUCTURAL-CONFORMANCE-08`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T16:31:34Z
- Finished at: 2026-08-07T16:37:27Z
- Lease claim commit: `5197be030a59ad0adbb310b5a82353b262fcadfb`
- Inspected pre-claim head: `2d7aab29291ecbf559c8d6167de1f037ad935fbe`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Canonical state was active, `publishReady: false`, and `lease: null` before claim.
- No open PR used the isolated branch as its head before claim.
- No pull-request workflow run existed on pre-claim head `2d7aab29291ecbf559c8d6167de1f037ad935fbe`.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains locally blocked on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains waiting on A1X submission.
- No dependency-ready implementation, repair, Red-Team, certification, documentation, packaging, or audit assignment existed.
- The latest research fallback explicitly nominated deterministic structural-conformance test architecture as the strongest materially different next research mode.

## Step Performed
Performed one bounded non-conflicting test-architecture research step answering:

**How should Round 6 combine its many already-predeclared structural, Send, rerender, Trusted-Types, mobile/reflow, constrained-runtime, event/focus, and accessibility gates into a deterministic release oracle without creating one flaky mega-test or prematurely encoding an unverified ChatGPT insertion slot?**

This step does **not** implement a structural shell, add product selectors, alter production code, or authorize A2. It defines the test architecture that later A2/A3 should plug the exact live-evidence-backed candidate into.

## Repository Evidence

### Existing A1 probe already provides a useful passive discovery kernel
`tests/e2e/mobile-shell-structure-probe.spec.js` already models desktop and 390 px narrow layouts, a hidden duplicate composer, a composer-local Send lookup, exact Send-node identity, in-flow action/stack candidates, and a zero click/submit/input/keydown ledger. It deliberately does not mount Ghost.

**Implication:** preserve that read-only probe as the discovery oracle. Do not turn it into a product candidate test by silently adding guessed mount behavior.

### Existing Round-6 evidence has accumulated orthogonal invariants
The current control plane already requires all of the following for a future structural candidate:
- active-visible-composer scoping and hidden/secondary-composer rejection;
- exact original Send JavaScript node identity and no move/wrap/clone/replace;
- normal-flow Blue/Red layout and rail fallback on failed verification;
- exactly one Ghost mount after host-control insertion and repeated composer replacement;
- generation/current-container guards and scoped MutationObserver/ResizeObserver ownership;
- reversible host-style restoration;
- no new Trusted-Types HTML sink and no MAIN-world/unsafeWindow requirement;
- 320-CSS-pixel-equivalent reflow, 200% text, keyboard/orientation verification, and VisualViewport-as-signal-only behavior;
- Chromium 1x/4x/6x CPU stress with invariant/resource gates and descriptive timing only;
- `delegatesFocus: false`, no autofocus, explicit `type="button"`, stable accessible names, tested `aria-expanded`, and no assumed peer-ShadowRoot ARIA IDREF semantics;
- passive zero-actuation separated from intentional Ghost activation, where exactly one reviewed Ghost action is allowed but host Send/submit/native-control side effects remain zero.

**Implication:** the problem is no longer finding another invariant. The useful next step is organizing the invariants so failures remain attributable and the oracle itself can be falsified.

### Current Playwright configuration supports an orthogonal matrix better than one cross-product test
`playwright.config.js` has explicit `chromium`, `chromium-mobile` (Pixel 7 emulation for selected files), and conditional desktop `firefox` projects, with serial test-file behavior (`fullyParallel: false`), retained traces on failure, and JSON CI reporting. The mobile project currently includes only a small explicit `testMatch` list.

**Implication:** later structural conformance should be split into named scenario families and then selectively enrolled in projects. Do not force every CSP, mutation, accessibility, reflow, and CPU case into every browser/project combination.

### Existing Trusted Types suite is an independent compatibility oracle
`tests/e2e/trustedtypes.spec.js` already proves the fixture really enforces Trusted Types, proves ordinary Ghost boot with `gitl-ui` available, and proves blocked policy creation fails loud. Round-6 fallback-06 correctly states that the future structural module must add no additional TT sink but must not relabel the existing whole-product blocked-policy behavior as graceful fallback.

**Implication:** structural compatibility tests should compose with this existing oracle instead of duplicating or weakening it.

## Primary / Upstream Test-Framework Research

### Playwright fixtures favor composable isolated setup
Primary source: https://playwright.dev/docs/test-fixtures

Playwright documents fixtures as isolated, reusable, composable, and on-demand, with setup/teardown tied to the test needing them.

**Implication:** define a future structural-conformance harness from composable fixtures (host fixture, candidate adapter, invariant ledger, resource ledger) rather than one global mutable environment shared by all scenarios.

### Playwright supports parameterized tests and projects
Primary source: https://playwright.dev/docs/test-parameterize

Playwright supports parameterization at both individual-test and project level.

**Implication:** encode fixture variants and fault scenarios as explicit named parameters. Project/browser selection remains a separate dimension, which prevents duplicating the entire test body for desktop Chromium, mobile Chromium, and Firefox.

### Playwright recommends auto-retrying assertions for asynchronous UI state
Primary source: https://playwright.dev/docs/test-assertions

Playwright distinguishes retrying web assertions from non-retrying synchronous assertions and provides `expect.poll`/`toPass` for bounded asynchronous conditions.

**Implication:** rerender/repair assertions should poll the **invariant snapshot** until stable under a predeclared timeout; they should not rely on arbitrary sleeps as the correctness oracle. Timing measurements remain descriptive and separate from correctness.

### Mutation testing is a useful model for proving the oracle itself
Adoption/reference source: https://stryker-mutator.io/docs/

Mutation testing intentionally injects faults and expects the test suite to fail; surviving mutants indicate weak tests.

**Implication:** before the conformance harness is trusted to certify a real A2 candidate, it should be self-tested against deliberately unsafe synthetic candidates. This is test-oracle validation, not a proposal to mutate production Ghost code or add Stryker as a dependency.

## Competing Expert Lenses

### Expert A — one end-to-end mega-fixture
Approach: mount the future candidate once, then combine hidden composer, rerender, native-control insertion, Trusted Types, 320 px/200% text, keyboard resize, event activation, and CPU throttling into one long test.

**Strength:** superficially resembles a realistic worst-case session and produces one pass/fail artifact.

**Failure mode:** poor fault localization and high timing/state coupling. A failure after several mutations cannot cleanly identify whether the candidate, test setup, or an earlier mutation caused the result. Browser-specific limitations can also cause unrelated gates to be skipped or weakened.

### Expert B — composable invariant ledger plus orthogonal scenario families
Approach: keep one shared invariant vocabulary and candidate interface, but exercise it through small named scenario families. Cross-product only the few intersections with credible coupled failure modes.

**Strength:** deterministic, attributable failures; reusable across browsers; supports the same safety assertions without requiring every environment to execute every stress mechanism.

**Failure mode:** isolated scenarios may miss emergent interactions unless a small set of high-risk pairwise intersections is explicitly added.

### Resolution
Favor **Expert B**, with a small mandatory pairwise-intersection layer. Reject the mega-fixture as the primary release oracle.

### Devil's Advocate / mutation-test lens
A conformance suite that has never demonstrated it can reject an unsafe candidate is not yet a trustworthy certification oracle. The harness must include known-bad synthetic candidate adapters and prove each violates a named invariant.

### Reliability / security lens
The invariant ledger must treat exact Send identity, zero passive actuation, clean teardown, one-mount ownership, observer scope, and TT-sink absence as hard failures. Performance numbers cannot downgrade those failures to warnings.

### Accessibility lens
Focus, tab order, accessible names, expanded state, and collapse-focus behavior must be separate named assertions rather than incidental visual observations. A screenshot-only pass cannot certify them.

### Mobile / constrained-runtime lens
320-CSS-pixel-equivalent reflow and 200% text are correctness scenarios. Chromium CPU slowdown is a stress scenario. Keep them separate so host-CI timing noise cannot cause an accessibility gate to be rewritten or vice versa.

### Aggregate end-user lens
No new user/community study was needed for this test-architecture decision. The user requirement for one-handed access and non-overlapping host reflow is already represented by the Round-6 brief. New aggregate sentiment: **UNKNOWN / non-dispositive**.

### Outside-frame candidate — property/state-machine exploration
A model-based/state-machine harness could eventually generate long sequences of host rerenders, control insertions, resize, expansion, and unmount operations. It may find sequencing bugs missed by hand-authored cases.

**Disposition:** retain for later fuzz/property testing after the deterministic conformance contract is stable. Do not make a generated state machine the first release oracle because shrinking/reproduction and safety attribution would be more complex while the product candidate itself is still gated on live structure evidence.

## Proposed Structural-Conformance Architecture

### Layer 0 — discovery oracle remains read-only
Keep `mobile-shell-structure-probe.spec.js` as the current no-actuation capture/discovery test. Do not inject product behavior into it.

### Layer 1 — candidate adapter contract
When A2 becomes authorized, the conformance harness should consume one explicit candidate adapter with operations equivalent to:

```text
resolveActiveHost()
mount()
verify()
requestRepair(reason)
unmount()
snapshotResources()
```

The exact production API may differ. The test contract must not discover its own alternate Send/control path; it observes the same reviewed candidate under test.

### Layer 2 — invariant snapshot
Every scenario records a machine-readable snapshot containing at least:

```text
scenarioId
fixtureVariant
browserProject
candidateBuild/head
activeComposerIdentity
sendNodeIdentityBefore/sendNodeIdentityAfter
sendConnected/sendVisible
mountCount
mountPositionMode/layoutParticipation
nativeControlOrderAndVisibility
observerTargets/observerCount
resizeObserverTargets/resizeObserverCount
listenerCount/pendingRepairCount
generation/currentContainerIdentity
hostStyleSnapshotBefore/hostStyleSnapshotAfter
passiveEventLedger
intentionalEventLedger
focusBefore/focusAfter
accessibleNames/expandedState/controlRelationships
viewport/textScale/keyboardModel
resource/timingSamples (descriptive)
cleanupVerdict
```

A scenario PASS requires all applicable hard invariants. `UNKNOWN` is not silently coerced to PASS.

### Layer 3 — orthogonal deterministic scenario families

**S1 Active composer / decoy rejection**
- visible composer plus hidden/secondary composer;
- Send is resolved only inside the active editor-local composer;
- no mutation or actuation.

**S2 In-flow mount / native-control preservation**
- one approved structural slot in a deterministic fixture;
- exact Send identity unchanged;
- no overlap/detachment/reorder outside approved rule;
- position is not fixed/absolute for Blue/Red success.

**S3 Rerender / stale-repair race**
- replace composer while a repair is pending;
- old generation callback must not write into stale container;
- exactly one mount ends in current container;
- old observers/listeners are detached.

**S4 Host-control growth**
- insert native control before and after Ghost;
- host control remains native and reachable;
- Ghost reaches only adapter-approved final position without deleting/covering anything.

**S5 Teardown / exact restoration**
- unmount after mount/repair;
- every recorded host style/spacing value returns exactly to pre-mount state;
- no Ghost observer/listener/pending repair remains.

**S6 Trusted-Types / rendering compatibility**
- structural module adds no new HTML-string sink;
- ordinary and TT-allowed harness cases remain compatible;
- policy-rejection case must not be misreported as a current whole-product graceful PASS;
- no MAIN-world/unsafeWindow structural prerequisite.

**S7 Passive actuation / focus**
- editor focused before mount;
- mount/verify/repair keep the same focus target;
- zero click/submit/input/keydown/form-submit events attributable to passive work;
- `delegatesFocus` false, no autofocus.

**S8 Intentional Ghost activation**
- every Ghost button `type="button"`;
- pointer and keyboard activation each invoke exactly one reviewed Ghost action;
- host Send/submit/native-control side effects remain zero even if delegated listeners observe the composed event path.

**S9 Accessibility / expansion semantics**
- stable accessible names;
- `aria-expanded` matches real state;
- collapse never strands focus in hidden content;
- peer-ShadowRoot `aria-controls` is not accepted unless exact accessibility evidence proves the relationship.

**S10 Mobile reflow / large text**
- 320-CSS-pixel-equivalent and 200% text;
- Blue/Red remains in flow or fails closed to rail;
- no host control/editor/Send overlap;
- VisualViewport may trigger verification but does not become placement authority.

**S11 Constrained-runtime resource stability**
- Chromium only: 1x/4x/6x CPU slowdown as already defined;
- correctness/resource invariants identical at each rate;
- timing is descriptive, not a universal hardware budget;
- clean throttle/session teardown.

### Layer 4 — mandatory high-risk pairwise intersections
Do not execute the entire combinatorial cross-product. Require at least these coupled cases because prior evidence gives a concrete interaction hypothesis:

1. **hidden decoy + composer replacement + pending repair** — catches stale generation selecting the wrong composer;
2. **320 px/200% text + host adds a native action** — catches Blue crowding that only appears when the toolbar grows;
3. **intentional Ghost activation + host form/delegated listeners** — catches composed event leading to submit/Send side effects;
4. **TT enforcement + Shadow rendering** — catches accidental reintroduction of an HTML-string sink;
5. **CPU slowdown + burst rerender/resize** — checks pending-repair/observer counts remain bounded under slower scheduling, while timing stays descriptive.

## Oracle Mutation Suite — Test the Test
Before a real A2 candidate can use the harness as release evidence, deliberately feed the harness small synthetic unsafe adapters. Each mutant must be rejected by the named invariant below:

| Mutant | Required kill |
| --- | --- |
| resolve hidden/secondary composer | S1 active-composer invariant |
| clone or replace Send | S2 exact Send identity |
| move/wrap Send to fit Ghost | S2 native-control preservation |
| mount Blue with `position:fixed` | S2 in-flow layout |
| create a second Ghost on rerender | S3 one-mount invariant |
| stale callback writes to replaced composer | S3 generation/current-container invariant |
| observe `document.body` for structural repair | scoped-resource invariant |
| leave observer/listener after unmount | S5 teardown invariant |
| render structural Shadow content through raw `innerHTML` | S6 TT-sink invariant |
| `delegatesFocus:true` or autofocus mount | S7 focus invariant |
| omit `type="button"` and trigger form submit | S8 intentional-activation side-effect invariant |
| claim peer-root `aria-controls` without proven relation | S9 accessibility invariant |
| use viewport coordinates as Blue/Red placement authority | S10 host-flow invariant |
| leave host style/spacing changed after fallback | S5 restoration invariant |

A surviving mutant is evidence that the oracle is too weak. Fix the **test architecture**, not the product safety invariant.

## Project / Browser Matrix
Given the current `playwright.config.js`:
- `chromium`: run S1-S10 and base resource assertions;
- `chromium-mobile`: explicitly enroll the future structural mobile/reflow test file rather than assuming the current narrow `testMatch` picks it up;
- `firefox`: run correctness/DOM/event/accessibility scenarios that are portable; do not attach Chromium CDP CPU-throttle claims;
- S11 CPU throttle remains Chromium-only;
- physical Android/WebView/GeckoView/assistive-technology claims remain separate and uncertified.

Do not interpret a desktop Firefox project with an Android-like UA/viewport as Firefox-Android certification.

## Predeclared Handoff Gates for Future A2/A3
A future structural candidate may advance from deterministic conformance only if:
1. the conformance harness first kills all required synthetic mutants;
2. the same candidate passes applicable S1-S10 hard invariants on exact-head Chromium;
3. mobile-enrolled scenarios pass on the configured mobile Chromium project without weakening 320 px/200% text/focus/Send assertions;
4. portable correctness scenarios pass Firefox where the environment supports them;
5. S11 1x/4x/6x Chromium stress preserves the same correctness/resource invariants;
6. all failures are attributable to named scenario/invariant IDs and are not hidden inside one mega-test;
7. no `UNKNOWN` live structural fact is converted to PASS by a deterministic fixture;
8. A1X current authenticated structure evidence still gates the actual ChatGPT insertion rule.

The deterministic conformance suite is therefore a **necessary later certification layer, not a substitute for the missing live-host capture**.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN** — unchanged non-interactive permission gate; repeating it would be non-discriminating.
- Existing deterministic A1X structure probe: **INSPECTED, NOT RE-RUN** — exact 2/2 PASS is already recorded and this research changed no test/product code.
- Existing Trusted Types E2E: **INSPECTED, NOT RE-RUN** — used as an independent compatibility oracle; no behavior changed.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** — no product/test code changed.
- Primary Playwright test-architecture research: **EXECUTED**.
- Mutation-testing methodology research: **EXECUTED** as test-oracle design evidence only; no dependency added.

No CI run/job/artifact or new test PASS is claimed.

## Changes
- `.gitl/autopilot-state.json` — research-fallback lease claim.
- `.gitl/evidence/round-6/research-fallback-08.md` — this durable research result.
- Product source: **NONE**.
- Generated extension source: **NONE**.
- Tests/workflows/dependencies: **NONE**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Acceptance Criteria
- Latest canonical maker read before Ghost work: PASS.
- Canonical state/orchestration/plan/evidence/succession/deferred queue read: PASS.
- Mobile-shell brief, A1/A1X evidence, current structure probe, fallback-06, fallback-07, Playwright config, and existing TT test inspected: PASS.
- No dependency-ready executable work existed: PASS.
- No active conflicting lease/branch-changing workflow/open isolated-head PR before claim: PASS.
- Lease claimed before durable write: PASS.
- Research mode materially differs from the seven completed fallback modes: PASS.
- At least two materially different test architectures compared: PASS.
- Adoption/upstream test-framework evidence gathered: PASS.
- Test lead converted prior claims into named measurable scenario/invariant IDs: PASS.
- Oracle self-falsification/mutant plan defined: PASS.
- Current authenticated ChatGPT insertion slot inferred or guessed: NO.
- Product/test implementation authorized or performed: NO.
- Send/CHOICE/route/lease/uncertainty weakened: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Rail fallback unchanged: PASS.
- Existing TT blocked-policy behavior reclassified: NO.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- The structural-conformance architecture is not executable until a future authorized candidate/harness exists. No PASS claim is made for the proposed S1-S11 matrix or mutant suite.
- The harness design intentionally does not choose the live ChatGPT insertion slot; A1X remains the authority for that missing fact.
- Mutation-testing methodology supports the principle of deliberately faulty candidates, but this wake does not add Stryker or mutate production Ghost code.
- Pairwise intersections reduce, but do not eliminate, emergent-sequence risk. Property/state-machine exploration remains a later candidate after the deterministic oracle is stable.
- Playwright project emulation remains hosted test evidence, not physical Android/WebView/GeckoView or assistive-technology certification.
- This is the **second materially novel wake of the new research-novelty round**. Diminishing returns are not satisfied.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, immediately resume `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` and use the resulting exact structural map to authorize or reject the candidate insertion rule. Carry this S1-S11 + mutant-oracle contract into A2/A3.

If the live-capture gate remains unchanged, the next eligible wake should perform one materially different bounded fallback rather than repeat structural-conformance design. Strong remaining candidates include current cross-browser accessibility-tree verification methodology, host-layout/scroll-anchoring measurement design for Red expansion, or a later-state-machine/fault-sequence methodology. Do not implement product behavior while A1X remains blocked.

## Assignment Status
- research-only
