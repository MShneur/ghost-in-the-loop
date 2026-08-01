# HANDOFF — REC-GITL-8.7.0-5348

**Project:** Ghost in the Loop  
**Recommendation ID:** `REC-GITL-8.7.0-5348`  
**Version delivered:** 8.7.0  
**Branch:** `cursor/ghost-loop-eval-5348`

## Decisions (settled)

- Pre-dispatch evidence gate is mandatory before any send journal opens.
- Send tier ladder selects one mechanism pre-journal; form tier stays inert until verified per host.
- Net-read is opt-in, read-only, never actuation source.
- Mobile SEND-001 class is CI-reproducible via Playwright mobile projects.
- No promotion to `main` without human review.

## Deliverables

- Integrated product at `dev/ghost-in-the-loop.user.js` v8.7.0
- Full report: `dev/docs/CURSOR_EVAL_REPORT.md`
- Tests: +5 jest suites, +8 playwright cases vs baseline

## Open

- Real-device Android validation
- Whether to enable form tier on any adapter
- Whether net-read should inform completion detection
- Personal Forge push (ctrl-forge token lacked write access at publish time)

## Next session

Read `dev/docs/CURSOR_EVAL_REPORT.md` §3 open questions. If promoting, run full gate from `dev/` then bump live install per your release process.
