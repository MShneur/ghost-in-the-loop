# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 6 / Devil's Advocate release auditor
- Executed role: bounded constrained-runtime methodology research fallback
- Research fallback ID: `R6-RESEARCH-FALLBACK-CONSTRAINED-RUNTIME-04`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T14:54:26Z
- Finished at: 2026-08-07T14:56:01Z
- Lease claim commit: `dadb45bd28496121a34c7e6ef526f3657eb28075`

## State Read
- Branch: `agent/8.8-repair-resume`.
- State: active Round 6, `publishReady: false`.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains blocked locally on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains waiting.
- No dependency-ready implementation, test, audit, packaging, or documentation assignment existed.
- Immediately after lease claim, compare confirmed the isolated branch was identical to `dadb45bd28496121a34c7e6ef526f3657eb28075`.
- No open PR used `agent/8.8-repair-resume` as its head before claim.

## Research Question
What deterministic constrained-runtime test method can future A2/Red-Team/A4 use to stress the structural shell without falsely promoting desktop emulation into physical low-end-device certification or inventing post-hoc latency thresholds?

## Repository Evidence
- `package.json` currently uses `@playwright/test ^1.60.0`.
- `playwright.config.js` already has a desktop Chromium project, a Pixel-7 `chromium-mobile` project, and a desktop Firefox project with explicit claim discipline that Firefox is not GeckoView/Android.
- Existing Round-6 evidence already requires coalesced structural repair, one scoped MutationObserver, one ResizeObserver, one mount identity, zero Send-adjacent actuation, and no viewport-geometry placement authority.

## Primary Tooling / Browser Evidence
### Playwright CDP
Playwright documents `browserContext.newCDPSession(page)` for raw Chrome DevTools Protocol commands and explicitly states CDP sessions are supported only on Chromium-based browsers.

Implication: deterministic CPU throttling can be a Chromium-only stress layer. Firefox must remain a separate correctness/browser-engine lane rather than receiving a fake equivalent claim.

### Chrome DevTools Protocol
The CDP `Emulation.setCPUThrottlingRate` method accepts a slowdown factor where `1` is no throttle and `2` is 2x slowdown.

Implication: A future Chromium fixture can explicitly set 1x/4x/6x CPU rates using a page CDP session and reset to 1x in teardown.

### Chrome DevTools device-mode limitation
Chrome documents mid-tier mobile as roughly 4x CPU slowdown and low-end mobile as roughly 6x, but also states throttling is relative to the host machine and does not truly simulate mobile CPU architecture.

Implication: 4x/6x are useful reproducible stress profiles, not physical-device certification or a calibrated hardware budget.

### Playwright device emulation and Android
Playwright device emulation covers browser-facing properties such as user agent, screen size, viewport and touch. Its Android API can connect to real hardware or an AVD via ADB, but Android automation is experimental.

Implication: Pixel-7 emulation plus CDP throttling is Tier-A deterministic evidence. Physical Android/AVD evidence is a separate Tier-B surface and must remain explicitly labeled.

## Competing Expert Lenses
### Expert A — deterministic hosted stress
Run the exact structural fixture under Chromium at 1x, 4x and 6x CPU slowdown, preserving identical functional assertions and collecting observer/repair/mount/event counts.

Strength: reproducible in CI and directly compatible with current Playwright/Chromium infrastructure. Failure mode: wall-clock numbers vary with runner capacity and can be mistaken for real-device performance.

### Expert B — physical-device-first certification
Require physical Android before making any constrained-device claim.

Strength: highest ecological validity. Failure mode: unavailable hardware/ADB can stall deterministic regression development and does not replace browser-engine coverage.

### Resolution
Use both as separate evidence tiers. Tier A is mandatory deterministic stress and must never be worded as physical-device certification. Tier B remains separately required only when the project chooses to certify a physical-device claim.

### Outside-frame candidate — synthetic busy loop
Injecting JavaScript busy work can slow the event loop without CDP.

Rejected as the first method because it changes page workload semantics and can hide or create scheduling pathologies unrelated to the shell. Browser-native CPU throttling is the cleaner deterministic stress variable for Chromium.

### Reliability / security lens
The throttle harness must not change host DOM authority, Send behavior, viewport policy, network policy, or Ghost action paths. CDP session setup/cleanup belongs strictly in the test harness. Reset throttle to 1x and detach the session in teardown.

### Mobile / constrained-hardware lens
No network throttle is required for the first structural-shell stress matrix because the candidate's critical operations are local DOM verification/repair. Mixing CPU and network throttling would add an unrelated variable unless a later test explicitly targets host network-driven rerender behavior.

### Aggregate user lens
The user-facing risk is not a benchmark number; it is delayed or duplicated repair causing controls to disappear, crowd native actions, or become unsafe under a sluggish device. Correctness/resource invariants therefore remain pass/fail gates while wall-clock timing stays descriptive until a calibrated target exists.

### Test/certification lead
The useful result is a predeclared matrix that cannot be relaxed after seeing timings.

## Novel Finding / Decision
Future structural-shell certification should use a two-tier constrained-runtime model:

1. **Tier A — deterministic Chromium stress:** run the same candidate at CPU rates 1x, 4x and 6x using Playwright CDP, on desktop Chromium and where portable the Pixel-7 Chromium project.
2. **Tier B — physical/AVD evidence:** separate Android/ADB or equivalent device execution when a physical-device claim is actually release-critical.
3. **Firefox remains a correctness/browser lane:** no CDP CPU-throttle claim is attached to desktop Firefox because Playwright CDP is Chromium-only.
4. **Pass/fail gates are invariant-based, not post-hoc milliseconds.** Under every Tier-A rate, exact Send identity, zero Send-adjacent actuation, one mount, bounded observers/listeners, local scoped repair, rail fallback, and host-control reachability must remain unchanged.
5. **Repair coalescing is explicitly measured.** For synchronous mutation/resize bursts, record scheduled versus executed repair passes and reject duplicate/unbounded repair accumulation. The pre-existing requirement of at most one pending coalesced repair per frame/tick remains unchanged under throttle.
6. **Resource counts must be stable across repeated cycles.** Repeated replacement/orientation/viewport-event scenarios may increase work transiently but may not leak mounts, observers, listeners, timers, or pending repair tokens.
7. **Timing is descriptive until calibrated.** Record median/p95 and the throttled/unthrottled ratio, but do not invent a fixed low-end millisecond budget from hosted CI.
8. **No mixed-variable default.** Do not add network throttling to the baseline structural stress run unless a separate hypothesis requires network-delayed host rerender.
9. **Cleanup is part of the oracle.** Reset `Emulation.setCPUThrottlingRate` to `1`, detach the CDP session, unmount Ghost, and verify no residual observer/listener/style state.
10. The current authenticated ChatGPT insertion slot remains **UNKNOWN**; this methodology does not authorize A2.

## Predeclared Future Test Matrix Addendum
When A1X eventually supplies an exact insertion rule, A2/Red-Team/A4 should preserve these checks unchanged:

- Chromium CPU rates: 1x, 4x, 6x.
- Same deterministic host fixture and same structural assertions at every rate.
- At least three repeated cycles per rate for mutation/replacement and resize/orientation bursts.
- Record repair scheduled count, repair executed count, active MutationObserver count, active ResizeObserver count, active VisualViewport/orientation listener count, mount count, pending repair token count, host Send node identity, host submit/click/input/keydown actuation count, and descriptive timing distribution.
- Reject any run with duplicate mount/state, observer/listener/timer accumulation, stale-container write, lost/unreachable native control, changed Send identity, unintended host actuation, failed rail fallback, or unclean teardown.
- Do not fail solely because hosted wall-clock timing exceeds an invented threshold; if timing appears materially worse, preserve the measurement and create a separately predeclared performance hypothesis/recovery.
- Pixel-7 emulation plus 4x/6x slowdown remains emulation evidence only.
- Physical Android, Android WebView, Firefox-Android/GeckoView, real IME combinations, and calibrated low-end hardware remain separately uncertified unless actually executed.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN** because the permission gate is unchanged.
- Existing deterministic structure probe: **NOT RE-RUN** because its exact 2/2 result already exists and this fallback changes no test/product behavior.
- CPU-throttled fixture: **NOT EXECUTED** because no structural product candidate exists yet; this note defines the predeclared methodology for the future candidate.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** because no product/test code changed.

## Changes
- `.gitl/autopilot-state.json` — lease claim only before this evidence.
- `.gitl/evidence/round-6/research-fallback-04.md` — this durable research result.
- Product source, generated extension source, tests, workflows, dependencies: **NONE**.

## Acceptance Criteria
- No dependency-ready executable work existed: PASS.
- No conflicting lease/open isolated-branch PR before claim: PASS.
- Research mode materially differs from adoption, Shadow lifecycle, and keyboard/reflow fallbacks: PASS.
- Primary browser/tooling evidence converted into a falsifiable constrained-runtime method: PASS.
- Physical-device claim limits preserved: PASS.
- Post-hoc timing threshold avoided: PASS.
- Current-host UNKNOWN and A1X gate preserved: PASS.
- Product selector/insertion authorization: NONE.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback unchanged: PASS.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- CDP CPU throttling is Chromium-only and relative to the CI host.
- Device emulation does not reproduce mobile CPU architecture, thermal behavior, OS memory pressure, GPU contention, battery effects, or real IME behavior.
- Three repeats are a deterministic smoke/stress baseline, not a statistical hardware benchmark.
- This is the fourth post-A1X research fallback and it produced material novelty. Diminishing returns are not satisfied because a full six-wake no-novelty round has not occurred.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, resume A1X and carry forward this constrained-runtime matrix into A2/Red-Team/A4. If the capture gate remains unchanged, the next eligible wake should use a materially different research mode such as cross-adapter structural-contract evidence or CSP/ShadowRoot/browser-compatibility analysis; do not repeat CPU-throttling methodology without changed evidence.

## Assignment Status
- research-only
