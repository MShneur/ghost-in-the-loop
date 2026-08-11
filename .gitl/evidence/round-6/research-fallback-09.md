# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 5 / Mobile, browser, accessibility, and performance
- Executed role: cross-browser accessibility-tree verification researcher with release-audit dissent
- Research fallback ID: `R6-RESEARCH-FALLBACK-A11Y-TREE-09`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T16:39:52Z
- Finished at: 2026-08-07T16:46:35Z
- Lease claim commit: `a268e8f8652d98f57de260ae69ab00ed20490ade`
- Inspected pre-claim head: exact ref tip **UNKNOWN** because the connector proved a stable one-state-file-only commit beyond `b250f1d210936751306f80da52907a26e15a901d` but did not expose that intermediate SHA; after claim the branch was independently verified identical to `a268e8f8652d98f57de260ae69ab00ed20490ade` before this evidence write.
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Canonical state was active, Round 6 `MOBILE-SHELL-STRUCTURAL`, `publishReady: false`, and `lease: null` before claim.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains locally blocked on `DQ-R6-LIVE-STRUCTURE-CAPTURE` because current authenticated ChatGPT structure has not been durably captured.
- `R6-A2-MOBILE-SHELL-BUILD` remains waiting on A1X submission; no current product insertion rule is authorized.
- No dependency-ready implementation, repair, Red-Team, mobile certification, audit, documentation, packaging, or release assignment existed.
- The previous structural-conformance fallback explicitly nominated cross-browser accessibility-tree verification as one materially different next research mode.
- All six Ghost scheduled workers were enabled when checked during this wake; no timer-number ownership assumption was used.

## Step Performed
Performed one bounded non-conflicting methodology research step answering:

**How should a future Ghost structural shell prove cross-browser accessibility semantics across an open Shadow DOM without pretending Chromium DevTools AX-tree diagnostics are portable or equivalent to real assistive-technology/device certification?**

This step does **not** implement a structural shell, add a selector, authorize a Blue/Red insertion slot, change product behavior, or weaken any Send/CHOICE/route/lease/uncertainty safeguard.

## Repository Evidence

### Playwright version supports current ARIA snapshot assertions
`package.json` currently declares `@playwright/test` `^1.60.0`. The project has desktop Chromium, Pixel-7 Chromium emulation for selected files, and conditional desktop Firefox projects. The repository itself explicitly warns that desktop Playwright Firefox is not GeckoView/Firefox-Android certification.

**Implication:** Ghost can define one deterministic semantic contract that is executable in Chromium and Firefox where the scenario is portable, while keeping mobile-emulation and real-assistive-technology claims separate.

### Existing Round-6 accessibility contract is necessary but not yet a cross-browser tree oracle
Fallback-07 already requires `delegatesFocus: false`, no autofocus, explicit `type="button"`, stable accessible names, tested `aria-expanded`, no assumed peer-ShadowRoot ARIA IDREF semantics, passive zero-actuation, and exact isolation of intentional Ghost actions from host Send/submit/native-control effects.

Fallback-08 then incorporated those requirements into S7-S9 of the composable conformance ledger and required unsafe accessibility mutants to be killed before the oracle can certify a candidate.

**Implication:** this wake should not invent more UI semantics. It should define how the existing semantics are measured across engines and where hosted automation stops being evidence.

## Primary Platform / Test Research

### Playwright ARIA snapshots provide a cross-browser semantic representation
Primary source: https://playwright.dev/docs/aria-snapshots

Playwright documents ARIA snapshots as a YAML representation of the accessibility tree containing roles, accessible names, hierarchy, and states such as `checked`, `disabled`, `expanded`, `invalid`, `level`, `pressed`, and `selected`. `expect(locator).toMatchAriaSnapshot()` can scope the check to one component, and child matching can be `contain`, `equal`, or `deep-equal`.

The same documentation explicitly says ARIA snapshots **should be the same across browsers**, so Playwright stores one snapshot even when the test runs in multiple browser projects.

**Implication:** the first deterministic cross-browser Ghost accessibility oracle should use one shared semantic snapshot contract across Chromium and desktop Firefox rather than maintaining browser-specific snapshots that could silently bless divergent semantics.

### Playwright locators pierce open Shadow roots
Primary source: https://playwright.dev/docs/locators

Playwright states that locators work with elements in Shadow DOM by default, except XPath and closed-mode Shadow roots.

**Implication:** an open ShadowRoot remains directly testable with locator-scoped role/name/state assertions. A closed root would reduce deterministic observability without evidence of a corresponding safety benefit and should not be the first release-critical candidate.

### Chromium CDP accessibility data is valuable but not a portable primary oracle
Primary source: https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/

Chrome DevTools Protocol marks the Accessibility domain and methods such as `Accessibility.getFullAXTree` and `Accessibility.getPartialAXTree` as Experimental. This is a Chromium/CDP surface, not a Firefox accessibility interface.

**Implication:** CDP AX-tree capture may be retained as a Chromium-only failure diagnostic or artifact, but it must not become the cross-browser release gate and must not be reported as Firefox or real-assistive-technology certification.

### Web semantics are mapped through platform accessibility APIs and those mappings are not identical
Primary source: https://www.w3.org/TR/2026/CRD-core-aam-1.2-20260604/

Core-AAM defines how WAI-ARIA roles, states, and properties are expected to be exposed by user agents through platform accessibility APIs. It also states that platform accessibility APIs do not all work the same way and often lack one-to-one mappings.

Primary source: https://www.w3.org/TR/wai-aria-1.2/

WAI-ARIA describes the accessibility tree as parallel to the DOM and specifies that hidden/non-displayed elements are generally excluded from the accessibility tree.

**Implication:** a Playwright ARIA-snapshot PASS is strong deterministic web-semantic evidence, but it cannot certify TalkBack, VoiceOver, NVDA, JAWS, Android WebView, or GeckoView mappings by itself.

### `aria-controls` remains an evidence gap in the proposed hosted oracle
Playwright's documented ARIA snapshot representation lists common surfaced states such as `expanded`, but does not document `aria-controls`/control-relationship output in the snapshot grammar.

**Implication:** `toMatchAriaSnapshot()` must not be used to claim that a Blue control in one Shadow root successfully controls a Red region in a peer Shadow root. The first candidate should either keep the toggle and controlled region in the same accessibility/tree scope or rely on local accessible name plus `aria-expanded` until exact browser/platform accessibility evidence proves a cross-root relationship.

## Competing Expert Lenses

### Expert A — engine-native AX tree as the primary release oracle
Approach: use Chromium CDP `Accessibility.getFullAXTree()` as the authoritative accessibility representation.

**Strength:** detailed engine-native diagnostic data and relationships.

**Failure mode:** Chromium-only, Experimental, and not portable to Firefox. Treating it as universal would convert a debugging interface into unsupported cross-engine certification.

**Disposition:** reject as the primary release oracle; retain only as optional Chromium diagnostic evidence.

### Expert B — one cross-browser semantic contract plus explicit focus/DOM invariants
Approach: use locator-scoped Playwright ARIA snapshots for Ghost-owned semantics and targeted relative host assertions, running the same contract in Chromium and desktop Firefox. Pair the semantic snapshot with keyboard/focus traversal, exact Send JavaScript node identity, `aria-expanded`, accessible-name, cleanup, and zero-actuation ledgers.

**Strength:** deterministic, repository-native, portable across the two hosted engines, and consistent with the existing S1-S11 invariant ledger.

**Failure mode:** it validates browser-exposed web semantics, not the final platform accessibility API or real AT interaction model.

**Disposition:** favor as Tier A hosted deterministic evidence.

### Expert C — real assistive-technology/platform certification only
Approach: require TalkBack/Android, VoiceOver/Apple, NVDA or JAWS/Windows, and GeckoView/Firefox-Android evidence before accepting any accessibility claim.

**Strength:** highest end-to-end fidelity for user-facing AT behavior.

**Failure mode:** costly, environment-dependent, and unsuitable as the first deterministic CI oracle. Making it the only gate would block useful reproducible safety checks and conflate release scope with physical-platform certification.

**Disposition:** preserve as a separate higher-fidelity tier when those platform claims become release-critical; do not infer it from hosted Playwright.

### Aggregate end-user lens
No new community study was required for this standards/test-methodology choice. User impact is represented through keyboard/screen-reader reachability and non-interference requirements. New aggregate sentiment is **UNKNOWN / non-dispositive**.

### Reliability / security lens
Accessibility tooling must never introduce a second Send path, synthesize host activation, or weaken focus/form safeguards. Snapshot mismatch is a failure to investigate, not a reason to auto-update expected semantics.

### Constrained mobile lens
The same semantic contract should be exercised in the future enrolled mobile Chromium structural scenario at 320-CSS-pixel-equivalent and 200% text where applicable, but that remains emulation evidence. TalkBack, Android WebView, real IME, and physical-device behavior remain separate.

### Outside-frame candidate — browser-specific snapshots
Maintain one Chromium semantic snapshot and a separate Firefox snapshot if the engines differ.

**Failure mode:** this can normalize a real cross-engine accessibility regression simply by blessing two different expected files.

**Disposition:** reject as the default. If deterministic engine divergence appears, record it as a finding and decide explicitly whether it is a browser limitation, candidate defect, or justified platform variance. Do not silently fork expected semantics.

## Proposed Three-Tier Accessibility Verification Contract

### Tier A — deterministic cross-browser web semantics
For the future exact A2 candidate:

1. Scope strict/equal ARIA snapshots to the **Ghost-owned open Shadow subtree**, where roles, names, order, and states are stable and controlled by Ghost.
2. Scope host-composer checks to **relative invariants**, not a page-wide snapshot. The host Send must remain the same JavaScript node, same connected/visible control, and retain its reviewed accessible role/name/state.
3. Run the same Ghost semantic snapshot contract in desktop Chromium and desktop Firefox when the scenario is portable.
4. Record editor -> Ghost -> native control/Send Tab and Shift+Tab traversal using a recursive deepest-active-element helper that can descend through open Shadow roots.
5. Require no positive `tabindex`, no focus trap, no mount/repair focus theft, and no collapse that strands focus in content that becomes hidden.
6. Require collapsed/expanded snapshots to preserve the control's accessible name while `expanded` accurately changes state.
7. Require collapsed content to be absent/unreachable in the accessibility contract when hidden, consistent with WAI-ARIA accessibility-tree exclusion rules.
8. Apply the same names/states/focus/zero-Send assertions to the 320-CSS-pixel-equivalent and 200%-text mobile/reflow scenario when that file is enrolled in `chromium-mobile`.
9. Never run unattended snapshot-update mode as a repair. An expected accessibility snapshot changes only after reviewed semantic intent changes.

### Tier B — Chromium-only engine diagnostic
When Tier-A Chromium fails or a relation needs deeper inspection, optionally capture CDP Accessibility data as a diagnostic artifact.

- Never require a fake Firefox equivalent.
- Never report CDP AX-tree success as cross-browser or real-AT certification.
- Keep any performance effect of enabling diagnostic accessibility domains outside ordinary timing claims.

### Tier C — physical platform / assistive-technology evidence
If a future release claim explicitly includes it, collect separate evidence for the relevant combinations, for example TalkBack/Android, VoiceOver, NVDA/JAWS, Firefox-Android/GeckoView, or WebView.

Tier C does not replace Tier A: deterministic CI remains useful for exact repeatability, while physical AT evidence validates mappings and interaction outside hosted browser abstraction.

## Structural-Conformance Oracle Addendum
Add these deliberately unsafe accessibility mutants to the fallback-08 mutation suite before the harness can certify a real structural candidate:

| Mutant | Required kill |
| --- | --- |
| Ghost button has no stable accessible name | Tier-A Ghost semantic snapshot / role-name invariant |
| `aria-expanded` remains stale after open/close | expanded-state invariant |
| collapsed panel remains in accessibility snapshot / keyboard reach | hidden-content/focus invariant |
| collapse leaves deepest focus inside newly hidden content | focus-restoration invariant |
| positive `tabindex` reorders Ghost before/around host controls | tab-order invariant |
| Send role or accessible name changes after mount | host relative semantic invariant plus exact Send identity |
| peer-root `aria-controls` is declared "verified" from an ARIA snapshot alone | evidence-tier contract must reject unsupported certification |
| first candidate uses a closed ShadowRoot and becomes unobservable to the required locator contract | deterministic-observability invariant unless separately justified and replaced by stronger evidence |

A surviving mutant means the test oracle is too weak. Fix the oracle or candidate; do not weaken accessibility or Send safeguards.

## Novel Finding / Decision
The prior event/focus contract can now be made cross-browser without overclaiming physical AT support:

**Use one locator-scoped Playwright ARIA semantic contract across Chromium and Firefox as Tier-A evidence, pair it with exact focus/Send/zero-actuation invariants, use Chromium CDP AX-tree only as optional diagnostics, and keep real assistive-technology/platform certification as a separate evidence tier.**

A second narrowing follows: **Playwright ARIA snapshots do not provide sufficient documented evidence to certify peer-ShadowRoot `aria-controls` relationships.** The first Blue/Red architecture must not depend on that relationship without higher-tier proof.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN** — the local interactive-permission gate is unchanged; repeating it would not discriminate alternatives.
- Existing deterministic A1X structure probe: **INSPECTED, NOT RE-RUN** — exact 2/2 evidence already exists and no product/test code changed.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** — no product or test code changed.
- New cross-browser ARIA fixture: **NOT CREATED** — product insertion rule remains gated on A1X, and this wake is methodology-only.
- Primary Playwright/CDP/W3C accessibility-methodology research: **EXECUTED**.

No new test PASS, CI run ID, job ID, artifact, physical-device result, or assistive-technology certification is claimed.

## Changes
- `.gitl/autopilot-state.json` — bounded research lease claim and final handoff state.
- `.gitl/evidence/round-6/research-fallback-09.md` — this durable research result.
- Product source: **NONE**.
- Generated extension source: **NONE**.
- Test/product workflow/dependency changes: **NONE**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Acceptance Criteria
- Latest canonical maker read before Ghost work: PASS.
- State, round plan, orchestration, task prompt, evidence contract, succession rule, deferred queue, mobile-shell brief, and assignment-linked evidence read: PASS.
- No dependency-ready executable assignment existed: PASS.
- Lease/branch conflict gate checked before claim: PASS.
- Lease claimed before durable research write: PASS.
- Research mode materially differs from fallbacks 01-08: PASS.
- Primary Playwright accessibility-tree and locator evidence gathered: PASS.
- Primary Chromium AX-tree limitation evidence gathered: PASS.
- W3C platform-accessibility mapping limits preserved: PASS.
- At least two materially different verification philosophies compared: PASS.
- Cross-browser deterministic contract produced: PASS.
- Unsupported peer-root `aria-controls` certification rejected: PASS.
- Current live ChatGPT insertion slot guessed: NO.
- A2 implementation authorized: NO.
- Send/CHOICE/route/lease/uncertainty weakened: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Rail fallback unchanged: PASS.
- Host focus/form/AT behavior changed: NO.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- Current authenticated ChatGPT structural capture remains unavailable, so exact Blue/Red live insertion remains **UNKNOWN**.
- Playwright ARIA snapshots validate browser-exposed semantic structure, not a specific screen reader's speech/braille output or navigation model.
- Desktop Firefox remains desktop Gecko and is not Firefox-Android/GeckoView certification.
- Pixel-7 Playwright remains emulation and is not TalkBack/physical-Android certification.
- CDP Accessibility is Chromium-specific and Experimental; it is diagnostic evidence only.
- The documented ARIA snapshot grammar does not surface every platform relationship. In particular, this method does not certify peer-ShadowRoot `aria-controls` behavior.
- Host-page semantics are volatile; page-wide snapshots would be brittle. Keep strict snapshots Ghost-local and host assertions relative/identity-based.
- This is the **third materially novel wake of the new research-novelty round** after fallbacks 07 and 08. Diminishing returns are not satisfied.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, immediately resume `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` and carry the S1-S11 conformance and three-tier accessibility contract into A2/A3 unchanged.

If the capture gate remains unchanged, continue the new novelty round with one materially different bounded fallback. Prefer **Red expansion scroll-anchoring/layout-measurement design** or, after that, state-machine/fault-sequence methodology. Do not repeat fallbacks 01-09 without changed evidence and do not implement product behavior while A1X remains blocked.

## Assignment Status
- research-only
