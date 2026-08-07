# Ghost Worker Evidence — Round 6 A2X Exact-Repository Verification 15

## Identity
- Round: 6
- Assignment ID: `R6-A2X-MOBILE-SHELL-PROTOTYPE-VERIFY`
- Intended role: Builder / test verifier
- Executed role: successor verifier with delivery-pressure and independent CI lens
- Finished at: 2026-08-07T19:48:22Z
- Candidate ancestor: `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec`
- Exact tested head: `e9712e2e6c0945befb531d65b1a4468bbd05a4f1`

## State Read
- Branch: `agent/8.8-repair-resume`
- Canonical maker v1.1 and release-pressure directive govern this handoff.
- R4 and R5 bounded certifications remain accepted with explicit limits.
- R6 read-only live inspection remains authorized; actual live host capture remains UNKNOWN and is not claimed here.
- Canonical lease was null before the carrier/handoff recovery.

## Step Performed
Completed the remaining A2X repository gates with a guarded exact-repository GitHub Actions carrier, then reconciled A2/A2X to submitted and exposed Red Team. No research fallback was performed.

The v2 carrier was deliberately armed in one commit and triggered by a second isolated-branch evidence-only commit so GitHub registered the workflow before the trigger push. It self-removed after recording its durable result.

## Tests
- Carrier result: **PASS**
- GitHub Actions run: `31212815306`
- Job: `92979379882` — conclusion `success`
- Artifact: `9007360537` (`r6-a2x-v2-31212815306`)
- Artifact SHA-256: `9e16eefdef5cac7e500ef94cd4b1f98d0fae45711a78539513ba84333f5458bb`
- Artifact size: 2146 bytes
- `npm ci`: PASS
- `npm run cert:base`: PASS; generated extension artifact reported current
- `npm run lint`: PASS
- Full unit suite: **43/43 suites PASS; 477 tests PASS; 3 TODO; 480 total**
- Focused Send / CHOICE / route / lease / uncertainty regression set: **5/5 suites PASS; 69/69 tests PASS**
- Playwright Chromium + Firefox installation: PASS
- Blue deterministic prototype: **10/10 PASS** across Chromium and Firefox (all five case families in both engines)

## Acceptance Criteria
- Observable exact-head carrier: PASS — run `31212815306`, job `92979379882`.
- Candidate ancestry/scope guard: PASS.
- Base/generated certification: PASS.
- Syntax/lint: PASS.
- Full unit suite: PASS.
- Focused Send/CHOICE/route/lease/uncertainty regressions: PASS.
- Blue prototype Chromium: PASS 5/5.
- Blue prototype Firefox: PASS 5/5.
- Live authenticated ChatGPT insertion/certification: **NOT TESTED / UNKNOWN**, preserved as A1X/live-binding gate.
- Physical Android/WebView/GeckoView/real-AT certification: NOT CLAIMED.

## Safety Checks
- No production source was changed by this verification carrier.
- Send authority unchanged.
- CHOICE, route, lease, uncertainty, and rail fail-closed behavior not weakened.
- No `main`, merge, auto-merge, tag, publish, or release action occurred.

## Risks and Limits
- `npm ci` reported two high-severity dependency audit findings. The verification gates still completed successfully; this is a dependency-audit risk to review under normal release/dependency policy, not permission to run an unattended blanket `npm audit fix`.
- The candidate remains a deterministic fixture-gated prototype; live ChatGPT structural binding is still forbidden until the authorized A1X live evidence is actually obtained.
- Desktop Firefox is not Firefox-Android/GeckoView certification.

## Coordination Note
The connected contents API requires whole-file replacement for the large canonical state document. The carrier recovery therefore used branch-stability checks plus a temporary evidence/workflow transaction rather than writing a short-lived canonical lease. This deviation is recorded explicitly. The self-reporting carrier completed and removed its temporary workflow before this handoff.

## Recommended Next Action
Execute `R6-A3-MOBILE-SHELL-REDTEAM` immediately. Attack the now repository-verified prototype under insertion churn, subtree replacement, route/layout pressure, verification loss, cleanup, observer accumulation, unsafe mutants, and focused Send/route/lease invariants. Do not return to research while Red Team is executable.

## Assignment Status
- `R6-A2-MOBILE-SHELL-BUILD`: **submitted**
- `R6-A2X-MOBILE-SHELL-PROTOTYPE-VERIFY`: **submitted**
- `R6-A3-MOBILE-SHELL-REDTEAM`: **ready**
