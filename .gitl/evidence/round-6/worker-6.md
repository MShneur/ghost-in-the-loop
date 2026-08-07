# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 6
- Intended role: Devil's advocate / release auditor
- Executed by: `scheduled-worker-5-r6-a5-audit-18` (timer identity treated as wake cadence only)
- Assignment ID: `R6-A5-MOBILE-SHELL-AUDIT`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T20:41:12Z
- Finished evidence review at: 2026-08-07T20:53:51Z
- Canonical maker observed first: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.1 dated 2026-08-07
- User delivery authority: `.gitl/user-directives/2026-08-07-release-pressure.md`

## State Read
- Branch: `agent/8.8-repair-resume`.
- Starting branch head before claim: `b193fb9072a2a3d0daeada3ac0e9e9380c708bfb`.
- Starting canonical state blob: `b57e57df48a068f3cbc305ddaa253f1e1700568a`.
- Shared lease was `null`; `R6-A5-MOBILE-SHELL-AUDIT` was `ready`; `.gitl/evidence/round-6/worker-6.md` did not exist; repeated compare checks showed no conflicting branch movement before claim.
- Lease claim commit: `155c0db3ab2293b11fa19fa1eea1c578176813ec`.
- Lease holder: `scheduled-worker-5-r6-a5-audit-18`, expiring `2026-08-07T21:26:12Z`.
- R4 lifecycle and R5 long-chat reviews are accepted only at their bounded scopes. R6 read-only live authenticated ChatGPT inspection is authorized, but actual current-host structural capture remains technically **UNKNOWN / not obtained**.
- A4 is submitted; A5 is the earliest dependency-ready assignment. Research fallback is therefore ineligible during this audit.

## Step Performed
Performed one independent bounded audit of the current Round-6 ChatGPT Blue structural prototype chain. I re-read the A1/A1X architecture and capture evidence, A2/A2X builder and exact verification evidence, A3 Red-Team evidence, A4 mobile/accessibility/performance evidence, current prototype/Red/mobile test source, the repository adapter architecture, and the exact GitHub Actions run/job/artifact bindings.

The audit used five adversarial questions:
1. Does the current candidate gain any new Send/CHOICE/route/lease/uncertainty authority?
2. Can deterministic fixture success be confused with a current live ChatGPT insertion certification?
3. Did Red Team expose a real failure and was it repaired without weakening the oracle?
4. Do mobile/accessibility/performance claims remain within what hosted Chromium/desktop Firefox actually measured?
5. Does the current architecture permit safer site-specific structural strategies without turning hostname matching into unchecked mutation authority?

## Independent Source Audit
### A1/A1X boundary
A1 correctly separated reviewed Send/input anchors from structural mount authority and left the current authenticated ChatGPT action/header/footer structure and exact Blue insertion slot UNKNOWN. The deterministic read-only A1X carrier is independently bound to:
- head `2eed7b903de00abe5a22c5afc652550e5010f157`
- run `31181719403`
- job `92876348475`
- artifact `8995048318`
- artifact SHA-256 `3c25659764f2bd2ca222dc6d42a04db564b836cd68cd0a05921a3919be3085dc`

Connected GitHub reports that job completed successfully and all probe steps succeeded. That proves the deterministic probe carrier, **not** the missing live authenticated capture.

### Current Blue prototype
Current `tests/e2e/mobile-shell-blue-prototype.spec.js` Git blob: `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`.

The source remains a fixture-only structural primitive. Its relevant fail-closed properties are:
- explicit fixture proof token before structural mutation;
- exact caller-supplied Send node rather than alternate Send discovery;
- one ordinary in-flow host with open ShadowRoot;
- DOM APIs/textContent rather than a new HTML-string Trusted-Types sink;
- scoped MutationObserver/ResizeObserver ownership;
- generation/RAF-coalesced repair;
- repair moves only the Ghost-owned host, never Send/native controls;
- exact Send identity verification;
- fixed/absolute mount rejection;
- clipped Send/Ghost rejection inside clipping containers using only a 1 CSS-pixel deterministic rounding tolerance;
- failure/unmount removes Ghost-owned structure and returns to the existing rail state.

I found no production live ChatGPT selector or production structural activation in this prototype. Production userscript/extension behavior remains outside this deterministic candidate.

### A3 Red-Team oracle
Current `tests/e2e/mobile-shell-blue-redteam.spec.js` Git blob: `b8b5048dbc042626294423e28b337eb27d6c6b63`.

The Red-Team harness pins the exact candidate blob and exercises the candidate body rather than certifying an independently rewritten implementation. It attacks native-control churn, whole verified-row replacement/stale resources, verification-token loss, overflow clipping, and explicit cleanup. The first A3 run found a real cross-browser false positive: clipped Blue could remain `structural`. The repair added explicit clipping rejection rather than weakening the test or accepting rail fallback as a structural PASS.

### A4 mobile/accessibility/performance oracle
Current `tests/e2e/mobile-shell-blue-mobile-perf.spec.js` Git blob: `8231a2aea014dcaedba9c38c25b4249f56bc9646`.

It pins the same repaired Blue candidate and covers hosted Pixel-class Chromium emulation, 320 CSS px, 200% text, reduced motion, portrait/landscape viewport geometry, deterministic VisualViewport signaling, desktop Firefox semantic/focus behavior, resource cleanup, and Chromium CDP 1x/4x/6x invariant stress. Timing is descriptive only. It does not constitute physical Android/WebView/GeckoView, real IME/browser-toolbar, physical assistive-technology, or calibrated low-end-device certification.

## Independent CI Audit
### A2X exact repository verification
Connected GitHub independently reports:
- run `31212815306`
- job `92979379882` — **completed / success**
- artifact `9007360537`
- artifact digest `sha256:9e16eefdef5cac7e500ef94cd4b1f98d0fae45711a78539513ba84333f5458bb`
- tested head `e9712e2e6c0945befb531d65b1a4468bbd05a4f1`

Job logs independently show:
- `npm ci`: completed; npm reported **2 high-severity audit findings** but the configured gates continued. Package identities/remediation are not established by this A5 audit and are not silently called safe.
- `npm run cert:base`: PASS, including generated extension parity.
- `npm run lint`: PASS.
- full unit: **43/43 suites PASS; 477 passed; 3 TODO; 480 total**.
- focused Send/CHOICE/route/lease/uncertainty: **5/5 suites, 69/69 tests PASS**.
- Blue Playwright: **10/10 PASS across Chromium and desktop Firefox**.

### A3 failure and repair
Connected GitHub independently reports repair run `31214560411`, job `92984922229`, **completed / success**, artifact `9008001890`, digest `sha256:0da54eefef64cc4ae4ccacc3b20ffe8488f0e3daea80706c2378d57d9fce31e9`. The initial A3 run `31213429856` / job `92981355836` is preserved as the real clipping falsification rather than erased.

The repair carrier passed its guard/patch/base/lint/focused-safety/browser/Blue/Red gates. This is acceptable Red-Team behavior: find a concrete failure, make the smallest fail-closed repair, and rerun the unchanged safety/adversarial gates.

### A4 failure and repair
Connected GitHub independently reports repair run `31215517114`, job `92988007587`, **completed / success**, artifact `9008352875`, digest `sha256:08555f208f2eaaf5e16318b0deb3975ec9f52947d65f21ff0b69730c678d5297`.

Job logs independently show:
- base certification/generated parity: PASS;
- lint: PASS;
- full unit: **43/43 suites PASS; 477 passed; 3 TODO**;
- focused Send/repair-resume/tab-lock/Send-safety: **4/4 suites, 63/63 PASS**;
- exact Blue baseline: **10/10 PASS**;
- A3 Red baseline: **12/12 PASS**;
- A4 hosted mobile/performance fixture: relevant Chromium Pixel-class, desktop Firefox narrow semantic/focus, and Chromium CPU-stress lanes PASS; engine-inapplicable cases are explicitly skipped rather than promoted.

The initial A4 failure was an oracle double-count: Chromium emitted native `orientationchange` during viewport shape changes in addition to a manually dispatched event. The repair removed the duplicate injection and used viewport geometry as the orientation oracle. I find no evidence that this repair granted new placement authority or weakened structural safety.

## Assignment Verdicts
- `R6-A1-MOBILE-SHELL-STRUCTURE-MAP`: **ACCEPTED ONLY AS BOUNDED DETERMINISTIC/ARCHITECTURE EVIDENCE; live current-host map remains missing**.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE`: **BLOCKED TECHNICALLY; authorization is satisfied, live evidence is not**.
- `R6-A2-MOBILE-SHELL-BUILD`: **ACCEPT deterministic prototype artifact**, not production/live binding.
- `R6-A2X-MOBILE-SHELL-PROTOTYPE-VERIFY`: **ACCEPT exact configured repository verification**.
- `R6-A3-MOBILE-SHELL-REDTEAM`: **ACCEPT after preserved cross-browser clipping failure and smallest fail-closed repair**.
- `R6-A4-MOBILE-SHELL-MOBILE-PERF`: **ACCEPT at hosted deterministic scope with explicit platform limits**.
- `R6-A5-MOBILE-SHELL-AUDIT`: **ACCEPT BOUNDED CHATGPT DETERMINISTIC CANDIDATE; DO NOT MARK MOBILE-SHELL-STRUCTURAL COMPLETE**.

## Accepted Claims
1. The current fixture-gated ChatGPT Blue structural primitive is sound at the executed deterministic/hosted scope.
2. Exact Send identity, zero unintended Send actuation, one-mount behavior, scoped/coalesced repair, fail-closed clipping/verification behavior, and cleanup survived the configured Chromium + desktop Firefox matrices.
3. Red Team was sensitive enough to expose one genuine structural false positive and the repair survived rerun.
4. A4 established hosted narrow/mobile-layout, semantic/focus, cleanup/resource, and relative Chromium CPU-stress evidence without requiring a physical-device claim.
5. The existing rail remains the correct fail-closed compatibility fallback when structural capability cannot be proven.

## Rejected / Uncertified Claims
- Current authenticated ChatGPT exact insertion slot: **UNKNOWN**.
- Live ChatGPT structural binding/certification: **NOT CERTIFIED**.
- Physical Android / Android WebView / Firefox-Android / GeckoView: **NOT CERTIFIED**.
- Real IME + browser-toolbar combinations: **NOT CERTIFIED**.
- Real TalkBack/VoiceOver/NVDA/JAWS mappings: **NOT CERTIFIED**.
- Calibrated low-end-device performance budget: **NOT CERTIFIED**.
- Universal structural insertion rule shared by every supported AI site: **REJECTED**.
- Reviewed Send authority as automatic structural-mutation authority: **REJECTED**.
- Npm's two high-severity audit findings as harmless: **UNKNOWN; carry to final release/dependency audit, do not auto-fix blindly**.

## Maintenance / Usability Dissent
### Builder / usability case
A site-specific structural solution can be materially better than a universal lowest-common-denominator runner. On a site with a stable, independently certified composer/header/footer contract, a specialized runner can use fewer DOM assumptions, a smaller observation scope, better native reflow, and better thumb reach.

### Reliability / maintenance objection
Hostname alone is not evidence that the currently rendered structure still matches the certified contract. A site redesign can turn a previously safe insertion rule into the wrong composer, hidden secondary composer, clipped control row, or stale mount target. Letting a specialized runner bypass verification because the host name matches would recreate the exact failure class Round 6 is designed to prevent.

### Audit resolution — Certified Site-Specific First Runner
The next required cross-adapter phase should formalize this ordering without changing the safety contract:

1. **Certified site-specific runner first** only when both the reviewed site identity and current structural capability/signature checks satisfy that runner's certified contract.
2. **Standard adapter-aware structural protocol second** when the specialized runner is absent or ineligible.
3. **Existing rail fallback third** whenever structural verification is missing, contradictory, clipped, stale, or otherwise unsafe.

A specialized runner may outrank the standard protocol only after predeclared evidence shows it is better for that site on relevant measures such as fewer DOM assumptions, exact Send preservation, observer scope/churn, rerender lifecycle behavior, native-control reachability, mobile reflow, teardown, and cross-browser falsification. Structural authorization remains separate from Send/actuation authority. No adapter inherits ChatGPT's insertion slot or another site's runner by analogy.

This is not a new release-critical program. It is the implementation policy for the **already-required cross-adapter expansion** in `MOBILE-SHELL-STRUCTURAL`.

## Delivery-Pressure Checkpoint
No new research checkpoint is due: a testable artifact was produced recently and A2/A3/A4 execution supplied new falsification evidence. More importantly, a concrete required release step already exists: cross-adapter expansion and final audit. Research-only fallback must not displace that path.

Smallest next executable step: a supervisor/integrator planning handoff that opens the cross-adapter chain around the certified site-specific-first-runner policy, while keeping A1X available whenever a functioning read-only carrier appears.

## Safety Checks
- Send authority weakened: **NO**.
- CHOICE behavior weakened: **NO**.
- Route safety weakened: **NO**.
- Lease safety weakened: **NO**.
- Uncertainty/fail-closed behavior weakened: **NO**.
- Existing rail fallback weakened: **NO**.
- Production live structural binding authorized by this audit: **NO**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Risks and Limits
- The deterministic Blue test artifact still is not production structural-shell code.
- Current ChatGPT live structure can drift independently of fixture/adoption evidence.
- Cross-adapter work remains required by the Round-6 brief; this audit cannot mark the whole program complete after only the ChatGPT deterministic proof target.
- Site-specific optimization increases maintenance surface. Every specialized runner therefore needs an explicit capability signature, its own evidence tier, and immediate demotion to standard/rail behavior when verification fails.
- The npm install logs expose two high-severity dependency audit findings. Their package identities, exploitability in the shipped userscript/extension, and remediation are **UNKNOWN in this audit**; they should be resolved under existing final release/dependency certification rather than by an unattended blanket dependency upgrade.

## Recommended Next Action
Mark A5 submitted at the bounded deterministic scope and expose a supervisor planning assignment for the already-required cross-adapter expansion. That supervisor should turn the site-specific-first-runner rule into adapter-specific capture/build/test assignments without granting structural authority from hostname or reviewed Send selectors alone.

Keep `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` technically blocked but immediately claimable when a functioning read-only authenticated browser carrier exists. Do not hold deterministic cross-adapter work solely for that missing live ChatGPT capture.

Do not advance `BUILD-IDENTITY` until the required cross-adapter expansion and final Round-6 audit are complete.

## Assignment Status
- **submitted — bounded ChatGPT deterministic structural candidate accepted; cross-adapter expansion, live-host evidence where claimed, and final audit remain required**
