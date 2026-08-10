# Round 10 — Worker 3 bounded repair follow-up

Date: 2026-08-10
Role: Worker 3 — Test Engineer / Red Team
Branch: `feature/native-site-takeover`

## Scope

One bounded verification-harness repair only. No production behavior, Send path, takeover assertions, protected branches, release channels, tags, merges, or publication were changed.

## Source-of-truth heads

- Head inspected before repair: `51b58f5a7ffd33754d45b56b7e9b6d2f8f5e497c`.
- Repair commit: `6a471f20170b4b33a2d76398975ef951605f6ac8`.
- Protected branches were not written.

## Findings

1. The earlier native-takeover boot/readiness defect is already repaired in the committed E2E: `tests/e2e/native-chatgpt-takeover.spec.js` waits for `#gitl` with `{ state: 'attached' }`, while the successful-takeover assertions still require the passive rail to be hidden/suppressed. No assertion was weakened.
2. Worker 4 CI run `31416476528` is real and its `Full unit suite` step failed. A manual rerun was requested; attempt 2 job `93582226374` reproduced the same step-level failure.
3. The Worker 4 evidence attributes that unit failure to `tests/repo-nanny/round10-shared-send-contract.test.js`, but that path is absent from both the audited `a8f5b3964423c27dc9e4d2906ad77058ab45a926` tree and the current branch tree. Therefore no source-of-truth code change was made against that phantom file and no runtime Send behavior was changed on the basis of it.
4. The committed Worker 4 workflow only retriggered on the two native E2E files or the workflow itself. It did not retrigger when shared-Send tests, the Jest harness, or production/generated source changed, allowing a relevant repair to miss independent audit.

## Repair

Updated `.github/workflows/worker4-native-chatgpt-audit.yml` push paths to include:

- `ghost-in-the-loop.user.js`
- `extension/content.js`
- `tests/setup.js`
- `tests/repo-nanny/**`
- `tests/e2e/repo-nanny/send-evidence.spec.js`

The existing native takeover paths and all existing audit commands/assertions remain unchanged.

## Commands / API actions and results

- Read current branch ref and exact required directive/workforce/plan/evidence files through the GitHub connector.
- Read `tests/e2e/native-chatgpt-takeover.spec.js`: verified `waitForSelector('#gitl', { state: 'attached' })` and retained rail-suppression/passive-zero-activity assertions.
- Read audited commit tree for `a8f5b3964423c27dc9e4d2906ad77058ab45a926`: no `tests/repo-nanny/round10-shared-send-contract.test.js` entry.
- Re-ran Worker 4 job `93546591176` via GitHub Actions. Attempt 2 created job `93582226374`; base certification/syntax passed, full unit suite failed, downstream browser lanes were skipped, artifact upload succeeded.
- Updated only `.github/workflows/worker4-native-chatgpt-audit.yml`, producing repair commit `6a471f20170b4b33a2d76398975ef951605f6ac8`.

## CI status

The connector-authored contents commit did not itself create a new GitHub Actions run (GitHub token/app-authored commits commonly do not recursively trigger Actions). The last observed independent audit remains run `31416476528`, attempt 2 job `93582226374`, on historical head `a8f5b3964423c27dc9e4d2906ad77058ab45a926`; it failed at the unit step before browser lanes.

This repair closes the concrete trigger gap but does not falsely certify the current repair head. A fresh workflow-dispatch or ordinary qualifying push at/after `6a471f20170b4b33a2d76398975ef951605f6ac8` is still required for current-head independent certification.
