# R6-XA5R Final Mobile-Shell Audit Retry

## Assignment

- Assignment: `R6-XA5R-MOBILE-SHELL-FINAL-AUDIT-RETRY`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Executed role: successor Devil's Advocate / release auditor
- Lease holder: `scheduled-worker-5-r6-xa5r-final-audit-retry-04`
- Lease claim commit: `75d78922db648467b3a449067bf735a873339678`
- Inspected pre-claim branch head: `b91dc52d5c29192914bc4cc861f92b788960e2b1`
- Audit scope: coordination/evidence only; no product or test-semantic change is authorized.

## Verdict

**ACCEPTED — BOUNDED DETERMINISTIC/HOSTED ROUND-6 SCOPE.**

`MOBILE-SHELL-STRUCTURAL` may close only at the deterministic/hosted scope proven by the exact ChatGPT + Claude fixture, Red-Team, hosted mobile/accessibility/resource, and ordinary clean-head CI evidence below. This verdict does **not** certify current live ChatGPT or Claude structural insertion and does **not** certify physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, or calibrated low-end-device performance.

The original XA5 `NEEDS-CI-HYGIENE-RECOVERY` verdict is superseded only for the previously identified CI-hygiene blocker. Its accepted deterministic/hosted structural findings and rejected live/physical claims remain unchanged.

## Original Audit Delta

The prior final audit withheld closure for two CI-hygiene reasons rather than a demonstrated deterministic structural-candidate failure: stale XA2X workflow residue and a failing ordinary E2E path.

Independent retry review finds that blocker resolved:

1. Current `.github/workflows/test.yml` contains only the normal `unit` and `e2e` jobs; no XA2X or XA5Y registered carrier job remains.
2. `.github/xa2x-run.sh` is absent.
3. `.github/workflows/r6-xa5y-recovery.yml` is absent.
4. The exact ordinary clean-head run `31243297853` on `1a10c592c7023ee01b71b133762ebcb628f550bc` is green: unit/base job `93067642887` passed 43/43 suites with 477 passed and 3 TODO; E2E job `93067642856` passed 221 with 10 skipped and 0 failed.
5. Unit artifact `9017679611` has SHA-256 `21010b0264391dc3f10b30555d30e58e4667183ef95c1fde985a4bedece1445a`; E2E artifact `9017711998` has SHA-256 `29a71737b4a40bf13ba69fc5abc3be76bb18d185e82633e57587a76fe84b65d0`.
6. Comparing the exact clean-head CI target to this audit lease head shows only `.gitl/autopilot-state.json`, `.gitl/orchestration/round-plan.json`, and `.gitl/evidence/round-6/xa5yz-clean-head-ci-verify.md` changed after the clean test head. No product or test-semantic file changed after the green ordinary run.

The three XA5X ordinary-E2E failure classes were corrected without weakening their underlying oracles: the Pixel-class lifecycle fixture is routed only to `chromium-mobile`, the Round-5 A2 numerical timing oracle remains unchanged and Chromium-scoped while the separate Firefox correctness lane remains, and the Repo-Nanny Send-evidence tests are restored as top-level siblings with their original one-click/one-confirmation assertions.

## Exact Deterministic/Hosted Bindings Re-Audited

### ChatGPT deterministic structural path

- Blue prototype source blob: `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`
- Red-Team source blob: `b8b5048dbc042626294423e28b337eb27d6c6b63`
- Hosted mobile/perf source blob: `8231a2aea014dcaedba9c38c25b4249f56bc9646`
- Exact repository A2X run/job/artifact: `31212815306` / `92979379882` / `9007360537`
- A2X artifact SHA-256: `9e16eefdef5cac7e500ef94cd4b1f98d0fae45711a78539513ba84333f5458bb`
- Exact A2X tested head: `e9712e2e6c0945befb531d65b1a4468bbd05a4f1`

The accepted ChatGPT candidate remains fixture-gated, in-flow, open-Shadow, exact caller-supplied Send identity preserving, scoped/coalesced in repair, and fail-closed to the existing rail when strict structural verification fails. Deterministic Red Team previously found and forced repair of a clipped-overflow false positive rather than blessing it.

### Claude independently specified structural path

- Claude structure-contract blob: `d6fbadcdf80b7c7e212b9278bfa88f1418ca00fe`
- Claude Blue source blob: `88277ddbcb268e7a25a9b2f54197f8fc08c4ddcc`
- XA2X exact repository run/job/artifact: `31232161711` / `93037980854` / `9014184272`
- XA2X artifact SHA-256: `3f4ba74aed0043a80cfce65bac4b7b38262fbd409557abfb983046663c105292`
- Exact tested head: `4e5b49165891ea37e291f6089b1f2f6596350d48`

Independent job-log review resolves a potential trigger-head ambiguity: the XA2X carrier claimed and pushed tested head `4e5b49165891ea37e291f6089b1f2f6596350d48` inside the workflow before executing the gates, and the uploaded artifact environment recorded that same `TESTED_HEAD`. The workflow trigger head therefore does not invalidate the exact tested-head binding.

The Claude contract remains independently specified: visible-decoy, hidden/secondary-composer, wrong-site, duplicate/replaced Send, ambiguity, clipping, and demotion cases are adapter-owned. No ChatGPT insertion rule is inherited by analogy.

### Cross-adapter Red Team

- Source blob: `64c099b51fedfdfb7f86a76d4142f092dde20129`
- Tested head: `0f9683d19cf85899e20162eb072a0800fbd12777`
- Run/job/artifact: `31233469721` / `93041660298` / `9014621827`
- Artifact SHA-256: `a4cf8cd699ba2dd0d00f9367dd237c4de34ca4722ff4ecc9822c5cc828e8ef24`

The matrix passed exact wrong-site/signature rejection, stale/missing/clipped/ambiguous demotion, hidden/secondary-composer and decoy rejection, exact Send preservation, zero passive actuation, bounded repair/cleanup, and mutant sensitivity across ChatGPT + Claude deterministic fixtures.

The observed `1/2` error from a deliberately weak global-first-visible-editor baseline versus `0/2` for adapter-owned scoped identity/signature resolution is accepted only as a bounded locality/safety result for these fixtures. It is **not** a performance or universal-superiority claim against every possible future standard protocol.

### Cross-adapter hosted mobile/accessibility/resource path

- Source blob: `542e54145944f8ab2f32a126179a4afed063bcce`
- Tested head: `6ab649f6510db2be3dfe918a0f31ec99e5ea789e`
- Run/job/artifact: `31236146715` / `93048904768` / `9015459673`
- Artifact SHA-256: `5cbee843a66db1f423e9fa86c750d9f206135ff2b44d4ac46a4db13bd8e633b4`
- Gate ledger: `deps=0, syntax=0, base=0, lint=0, unit=0, focused=0, browsers=0, matrix=0`

Bounded hosted evidence covers Pixel-class Chromium, 320 CSS px, 200% text, reduced motion, orientation/VisualViewport perturbation, focus preservation after reflow/native-control growth, native-control reachability, exact Send identity, zero passive actuation, bounded observer/listener/pending-repair accounting, clean teardown, desktop Firefox correctness, narrow clipping demotion, and Chromium 1x/4x/6x invariant stress with descriptive timing only.

## Authority Separation Re-Audit

The accepted authority order remains:

1. **Certified site-specific structural runner** only when reviewed site identity **and** the adapter-owned current structural capability/signature satisfy its certified contract.
2. **Standard adapter-aware structural protocol** when the specialized contract is unavailable or fails verification.
3. **Existing rail fallback** when structural capability is absent, stale, clipped, ambiguous, or otherwise unverifiable.

Structural-mount authority remains separate from input/Send actuation authority. Hostname, reviewed Send selectors, or one platform's insertion rule do not grant another platform structural authority. Failed specialized verification demotes; it never widens authority.

## Safety / Fail-Closed Review

Accepted deterministic/hosted claims retain all existing safeguards:

- original connected Send node identity is preserved;
- no passive structural mount/repair path gains Send/submit/input/keydown authority;
- CHOICE, route, lease, and uncertainty behavior is not weakened;
- malformed, fixed, clipped, hidden, ambiguous, stale, or wrong-site structural candidates fail closed rather than being counted as structural success;
- mount repair remains adapter-scoped, coalesced, generation/current-container guarded, and bounded in owned observers/listeners/pending work;
- cleanup removes Ghost-owned structure and resources without granting broader host mutation authority;
- DOM-built Shadow internals add no new Trusted-Types HTML-string sink;
- delegatesFocus remains false and mount/repair does not autofocus or steal editor focus;
- hosted mobile geometry is a verification signal, not viewport-placement authority.

No safety threshold, exact-identity assertion, clipping/demotion oracle, accessibility oracle, or Round-5 timing threshold was loosened to obtain the clean ordinary CI result.

## Accepted Claims

- ChatGPT Blue deterministic fixture candidate: **accepted at deterministic/hosted scope only**.
- Independently specified Claude structural contract and fixture-gated Blue runner: **accepted at deterministic/hosted scope only**.
- Cross-adapter specialized -> standard -> rail selection/demotion contract: **accepted for the exact deterministic fixtures and hosted matrices reviewed here**.
- Hosted Chromium + desktop Firefox narrow/mobile/accessibility/resource evidence: **accepted only at hosted test scope**.
- XA5Y/YW/YZ CI-hygiene recovery: **accepted as resolving the prior final-audit CI blocker without product/test-semantic weakening**.
- `MOBILE-SHELL-STRUCTURAL`: **complete/certified at this bounded deterministic/hosted Round-6 scope**.

## Rejected / Still UNKNOWN Claims

The following remain rejected or UNKNOWN and must not be inferred from this audit:

- exact current live ChatGPT structural insertion/binding;
- exact current live Claude structural insertion/binding;
- universal site-independent structural inference;
- physical Android behavior;
- Android WebView behavior;
- Firefox-Android/GeckoView behavior;
- real IME/browser-toolbar combinations;
- real TalkBack/VoiceOver/NVDA/JAWS mappings;
- calibrated low-end-device performance budget;
- causal proof that Ghost dominates total host-page lag;
- universal superiority of the specialized runner over every possible standard structural protocol.

Read-only live inspection remains authorized when a functioning carrier exists. Missing live capture remains a local certification/binding gate for those live claims, not a reason to reopen deterministic research or undo the bounded Round-6 completion.

## Independent Dissent / Residual Risks

1. The current green ordinary CI head precedes later `.gitl` coordination-only commits. This is acceptable here only because the exact compare shows no product/test-semantic change after the tested head. A later product/test change would invalidate this audit and require fresh verification.
2. The generic-baseline comparison is intentionally weak and fixture-local. It supports the adapter-owned locality/safety decision used here but should not be cited as a universal performance benchmark.
3. A2X/A4/XA1 installation logs reported two high-severity npm-audit findings. Package identity, shipped exploitability, and remediation remain unestablished at this stage. This risk belongs to the existing later release/dependency audit; an unattended blanket dependency upgrade is not justified by this Round-6 audit.
4. Live-host structural drift remains real operational risk. The bounded deterministic/hosted completion must not be turned into live activation authority without the separately required current-host structural capture/certification.

## Program Decision and Handoff

The prior CI-hygiene blocker is resolved and no contradictory deterministic/hosted evidence remains. Therefore:

- close `MOBILE-SHELL-STRUCTURAL` **only** as `completed-certified-bounded-deterministic-hosted-live-certification-pending`;
- preserve `DQ-R6-LIVE-STRUCTURE-CAPTURE` as read-only authorized but technically not obtained;
- preserve all live/physical claim limits above;
- keep `publishReady=false`;
- expose `BUILD-IDENTITY` as the next release-critical program;
- research fallback remains lower priority while BUILD-IDENTITY, DOCS reconciliation, final certification/package, dependency review, and release-evidence work remain executable.

A supervisor planning handoff should open the next bounded BUILD-IDENTITY round/task; this audit does not invent build identity facts or publish anything.
