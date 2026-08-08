# Ghost Worker Evidence — R6 XA5 Final Mobile-Shell Audit

## Identity
- Round: 6
- Assignment: R6-XA5-MOBILE-SHELL-FINAL-AUDIT
- Executed by: gha-r6-xa5-31236866121
- Audited coordination head: 669100d0238a0883b57d820e94c69d08fc500a9d
- Finished: 2026-08-08T03:17:42.883Z

## Verdict
**NEEDS-RECOVERY before MOBILE-SHELL-STRUCTURAL may close.** The deterministic/hosted ChatGPT+Claude structural candidate remains accepted at its explicitly bounded scope, but ordinary clean-head CI/carrier hygiene is not yet satisfied. No live-host or physical-platform claim is promoted.

## Exact Source/Test Bindings
Current branch blob checks passed for the reviewed deterministic paths:
- ChatGPT Blue: 53cc902428a3fc1496a83ad1bf0bd1bbe6752c84
- ChatGPT Red Team: b8b5048dbc042626294423e28b337eb27d6c6b63
- ChatGPT mobile/perf: 8231a2aea014dcaedba9c38c25b4249f56bc9646
- Claude structure contract: d6fbadcdf80b7c7e212b9278bfa88f1418ca00fe
- Claude Blue: 88277ddbcb268e7a25a9b2f54197f8fc08c4ddcc
- Cross-adapter Red Team: 64c099b51fedfdfb7f86a76d4142f092dde20129
- Cross-adapter mobile/perf: 542e54145944f8ab2f32a126179a4afed063bcce

## Actions Bindings Rechecked
- ChatGPT A2X: run 31212815306 / job 92979379882 / artifact 9007360537 / sha256:9e16eefdef5cac7e500ef94cd4b1f98d0fae45711a78539513ba84333f5458bb — job conclusion success.
- Claude XA2X: run 31232161711 / job 93037980854 / artifact 9014184272 / sha256:3f4ba74aed0043a80cfce65bac4b7b38262fbd409557abfb983046663c105292 — job conclusion success.
- Cross-adapter XA3: run 31233469721 / job 93041660298 / artifact 9014621827 / sha256:a4cf8cd699ba2dd0d00f9367dd237c4de34ca4722ff4ecc9822c5cc828e8ef24 — job conclusion success.
- Cross-adapter XA4: run 31236146715 / job 93048904768 / artifact 9015459673 / sha256:5cbee843a66db1f423e9fa86c750d9f206135ff2b44d4ac46a4db13bd8e633b4 — job conclusion success.

## Accepted Bounded Claims
- One independently specified non-ChatGPT path exists: Claude has its own deterministic capability contract and Blue fixture; it does not inherit ChatGPT insertion rules.
- Certified site-specific -> standard adapter-aware structural protocol -> rail remains the authority order. Wrong/stale/missing/clipped/ambiguous signatures demote rather than guessing.
- Exact Send identity, zero passive actuation, scoped repair/cleanup, native-control reachability, 320 CSS px/200% text/reduced-motion/focus checks, desktop Firefox correctness, and Chromium 1x/4x/6x invariant stress are supported only at their recorded deterministic/hosted scopes.
- The weak generic global-first-editor H2 baseline was measurably worse on the bounded deterministic fixture comparison (1/2 misselection versus 0/2 adapter-owned); this is not a universal performance claim.

## Rejected / Unknown Claims
- Current live ChatGPT insertion: UNKNOWN / NOT CERTIFIED.
- Current live Claude insertion: UNKNOWN / NOT CERTIFIED.
- Physical Android/WebView/GeckoView, real IME/browser-toolbar combinations, real assistive technology, and calibrated low-end hardware: NOT CERTIFIED.
- Fixture evidence does not enable live structural activation.

## Release/CI Hygiene Blocker
Current .github/workflows/test.yml still contains the temporary XA2X registered-CI job and references .github/xa2x-run.sh, while that runner file is absent. Temporary carrier cleanup is therefore incomplete.

The ordinary E2E job attached to Claude XA2X run 31232161711 (job 93037980915) concluded failure while the assignment-specific XA2X job passed. Connected log review recorded 197 passed, 7 skipped, 7 failed. Failures included mobile-profile assertions executing in desktop projects, volatile long-chat timing thresholds, and a repo-nanny Send-evidence test declaration error. These failures are not converted into a product-candidate failure, but they prevent a clean-head ordinary-CI claim.

## Dependency Audit Risk
Two high-severity npm audit findings remain recorded from prior install logs. Package identity/exploitability/remediation remain outside this bounded audit; do not blanket-upgrade unattended.

## Smallest Recovery
R6-XA5X-CI-HYGIENE-RECOVERY must remove only the residual XA2X workflow job, run ordinary clean-head CI on the isolated branch, preserve the full existing safety assertions, and classify any remaining ordinary E2E failure before Round 6 can close. If failures remain, create the smallest test/config/product recovery from reproduced evidence rather than weakening gates. Research remains lower priority.
