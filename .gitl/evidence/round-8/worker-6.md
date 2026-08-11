# Ghost Worker Evidence

## Identity
- Round: 8
- Worker: 6
- Role: Devil's Advocate / release docs auditor successor
- Assignment ID: R8-A2-DOCS-REDTEAM-AUDIT
- Started at: 2026-08-08T11:54:26Z
- Finished at: 2026-08-08T11:58:22Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `bbb51a235fa570ed72423fb0aebaf95668881e06`
- Lease state: claimed fresh shared lease at `6b46a0c9b6e07013061457c5ac5754a566dc3c31`; holder `scheduled-successor-r8-a2-docs-redteam-07`; expires `2026-08-08T12:39:26Z`.
- Dependencies: `R8-A1X-CHANGELOG-RECONCILE:submitted`, with authoritative A1X compare `CHANGELOG.md` only, 12 additions, 0 deletions.

## Step Performed

Independently falsified the reconciled release/maintainer documentation against the exact bounded Round-4 through Round-7 evidence and current repository identity. Reviewed `README.md`, `docs/ARCHITECTURE.md`, `docs/RELEASE-CANDIDATE-8.8.md`, `.gitl/orchestration/README.md`, and `CHANGELOG.md`, plus the canonical R4/R5/R6/R7 audits, R7 dependency disposition, Round-8 supervisor/A1/A1X evidence, the user release-pressure directive, deferred-question queue, and current state/plan.

Verdict: **ACCEPTED at bounded documentation-consistency scope.** No release-facing document was found to upgrade the accepted deterministic/hosted evidence into live-host, physical-device, stable-publication, universal timing, or universal dependency-exploitability claims. Documentation remains deliberately non-publication-authoritative.

A current-CI dissent was also classified rather than discarded: pre-claim handoff head `bbb51a235fa570ed72423fb0aebaf95668881e06` ordinary run `31255746448` failed only the preserved Chromium Round-5 A2 grouped-selector timing oracle. Unit/base/BUILD-IDENTITY succeeded. E2E job `93098722670` had 220 passed, 10 skipped, 1 failed; the large-case p95 was about 2.5 ms against `<2.3 ms`, and the retry was `2.3000000000029104 ms` against the same strict `<2.3 ms` gate. Artifact `9021367281` SHA-256 `1f3d63cc3b22994d0021521af4bb822cd35630ae0ff97610b26a8ce9ad88c67d`. This is another same-payload hosted timing-variance observation, not permission to weaken the threshold and not evidence of a Send/CHOICE/route/lease/structural regression.

The A1X implementation-head red run was independently classified from authoritative job logs as the same timing family: run `31254004451`, E2E job `93094537681`, 220 passed / 10 skipped / 1 failed, with first execution large p95 about 2.8 ms against `<2.3 ms` and retry small p95 about 1.2 ms against `<=0.875 ms`; artifact `9020886585`, SHA-256 `3b8d0e63f43ae9ac60ed5396e1bbabd6424e8a7075c5ea9764849df17f827e87`. Its later evidence-only head `486ab3042c9b6ef8c63e6ed803af4ad98ccd1b6c` passed ordinary run `31254107047`. Both observations are retained.

The release-candidate note lists earlier timing runs with the non-exhaustive word `including` and explicitly says universal timing reproducibility is outside scope. Therefore the later A1X/handoff timing observations do not falsify its claim; they extend the exact evidence ledger that FINAL-CERT-PACKAGE must carry.

## Research Sources
- Primary authority: canonical Personal-Forge maker v1.1, applied before repository work. Implication: Delivery-Pressure keeps executable certification work ahead of research; one bounded assignment under a shared lease; durable handoff required.
- User authority: `.gitl/user-directives/2026-08-07-release-pressure.md`. Implication: R4/R5 bounded certifications remain accepted with limits; R6 read-only live inspection is authorized when a functioning carrier exists; missing live capture is a live-certification limit, not a deterministic-development freeze.
- Repository evidence: `.gitl/evidence/round-4/worker-6.md`, `.gitl/evidence/round-5/worker-6.md`, `.gitl/evidence/round-6/final-mobile-shell-audit-retry.md`, `.gitl/evidence/round-7/worker-6-dependency-audit.md`, `.gitl/evidence/round-7/worker-6-final-audit.md`, `.gitl/evidence/round-8/worker-1.md`, `.gitl/evidence/round-8/worker-3.md`, `.gitl/evidence/round-8/worker-5-a1x-handoff-recovery-06.md`.
- Repository identity: candidate `package.json` is `8.8.0`; `main` `package.json` is `8.7.1`; candidate userscript `@updateURL` and `@downloadURL` still point to raw `main`; README install link still points to `main`.
- Inference, explicitly bounded: the later same-payload timing reds strengthen the documented hosted-reproducibility risk. They do not establish a product regression because the failing family is the preserved wall-clock oracle and no product/test-semantic change is present between the relevant coordination heads.

## Changes
- Files changed by this assignment: `.gitl/autopilot-state.json` for lease claim; `.gitl/evidence/round-8/worker-6.md` for this audit. Plan/state handoff follows this evidence commit.
- Product/release-facing docs changed by this auditor: none.
- Generated artifacts: none.
- Temporary files: none.

Independent implementation diff checks:
- `abe986b7faa891cbc7da6f3aa9ebc4b9e775aa42` → `15d355adcbcf0e44e4c181876e4fba5367cb1d19`: only `.gitl/orchestration/README.md`, `README.md`, `docs/ARCHITECTURE.md`, and new `docs/RELEASE-CANDIDATE-8.8.md`.
- `5f6935b3c620e3a952de0b8879b05af98003878c` → `8cb248a2c0fa23c506b8ae913a3ac0525a350990`: only `CHANGELOG.md`, exactly 12 additions and 0 deletions.

## Tests
- Focused tests: no new product test executed; assignment is independent documentation/release-evidence audit with no product/test mutation.
- Full unit suite: not re-run manually. Latest pre-claim ordinary run `31255746448` unit/base/BUILD-IDENTITY job succeeded.
- Browser matrix: latest pre-claim ordinary E2E run `31255746448` failed only the preserved Chromium Round-5 A2 timing oracle; all other E2E assertions passed or were expected skips (220 passed, 10 skipped, 1 failed).
- Certification: documentation claims were traced against exact R4-R7 evidence and current channel identity. Bounded docs-consistency verdict accepted.
- CI on lease-claim head `6b46a0c9b6e07013061457c5ac5754a566dc3c31`: ordinary run `31256110897` was in progress at evidence-write time; do not promote it to PASS/FAIL yet.

## Acceptance Criteria
- Trace release-facing claims to exact evidence: **PASS** — README/architecture/release-candidate/CHANGELOG claim boundaries match the cited R4-R7 audits.
- README install remains stable `main`: **PASS** — install badge/link points to raw `main`; candidate userscript update/download URLs also point to `main`.
- Candidate 8.8 not described as published: **PASS** — docs explicitly say isolated candidate, not promoted/tagged/Release/store/stable output; `publishReady=false` remains explicit.
- Physical/live limits explicit: **PASS** — exact current live ChatGPT/Claude insertion remains UNKNOWN/NOT CERTIFIED; physical Android/WebView/GeckoView, real IME/browser-toolbar, assistive-technology, and calibrated low-end-device claims remain outside scope.
- Long-Chat linear/send-observation and hosted timing variance explicit; no threshold weakened: **PASS** — release-candidate evidence says answer lookup remains history-linear and Send observation remains history-linear at 8004 matches/sample; hosted red/green variance is explicit; thresholds remain unchanged.
- Development-tooling advisories not presented as shipped exploitable or universally harmless: **PASS** — `brace-expansion@1.1.15` and `js-yaml@3.14.2` remain real high-severity Jest-development nodes; omit-dev audit clean; no concrete shipped path; shipped exploitability UNKNOWN / NOT CLAIMED.
- Orchestration policy matches canonical succession/local-human-gate mode: **PASS** — `continuous-local-human-gates`, timer-as-cadence, automatic succession, shared lease, Delivery-Pressure and local-gate policy are all explicit.
- Docs-only diff contains no product/generated/dependency/version/channel mutation: **PASS** — independent compares show only the intended docs/orchestration docs and CHANGELOG changes.
- Preserve corrected A1X diff and red/green CI evidence: **PASS** — 12 additions/0 deletions retained; implementation red and evidence-head green retained and implementation red classified as timing-only from authoritative job logs.
- Preserve current additional timing dissent: **PASS** — run `31255746448` is recorded here as another timing-only red; no universal stability claim is made.
- On acceptance expose FINAL-CERT-PACKAGE planning while keeping `publishReady=false`: **PENDING HANDOFF** — next plan/state transaction only; no packaging/publication action is executed in this assignment.

## Safety Checks
- Send authority unchanged: **PASS** — no product mutation; docs preserve reviewed single-dispatch/exact identity and at-most-once semantics.
- CHOICE behavior unchanged: **PASS** — no product mutation; human-decision semantics not weakened.
- Route and lease safety unchanged: **PASS** — no product mutation; orchestration shared-lease and fail-closed route/lease wording retained.
- Uncertainty handling unchanged: **PASS** — no product mutation; uncertainty pause remains explicit.
- Structural demotion unchanged: **PASS** — specialized → standard → rail fail-closed order remains explicit.
- Round-5 timing thresholds unchanged: **PASS**.
- No `main`, merge, auto-merge, tag, release, store, or publish action: **PASS**.
- `publishReady` remains false: **PASS**.

## Risks and Limits

1. Hosted Long-Chat wall-clock timing remains reproducibly non-reproducible across same-payload/coordination-only heads. The exact ledger now includes the earlier Round-7 observations, A4 claim-head run `31251250525`, A1X implementation red `31254004451`, evidence-only green `31254107047`, and current handoff-head red `31255746448`. Final certification must present the contradictory observations without threshold weakening or universal timing claims.
2. The two high-severity development-tooling advisories remain real upstream findings. No concrete shipped-payload path has been established; universal harmlessness/non-exploitability is not certified.
3. Exact current live ChatGPT/Claude insertion and physical-platform/mobile-assistive-technology/calibrated-low-end claims remain uncertified.
4. Documentation consistency is not publication authorization. Candidate identity remains separate from stable/public identity.
5. The lease-claim-head ordinary CI was still running at evidence-write time and cannot be represented as green or red in this evidence.

## Recommended Next Action

Close DOCS-RECONCILIATION only at bounded documentation-consistency scope and expose a **supervisor planning assignment for FINAL-CERT-PACKAGE**. The supervisor must build the smallest final-cert/package/checksum chain and carry forward: candidate/stable separation, `publishReady=false`, all R4/R5/R6/R7 limits, the full hosted timing red/green ledger through run `31255746448`, the development-tooling advisory disposition, exact immutable payload/provenance bindings, and all Send/CHOICE/route/lease/uncertainty/structural fail-closed invariants. It must not merge, tag, publish, create a Release, or infer live/physical certification.

## Assignment Status
- accepted
