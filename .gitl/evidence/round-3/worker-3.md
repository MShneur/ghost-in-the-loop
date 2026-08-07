# Ghost Worker Evidence

## Identity
- Round: 3
- Worker: 3 (assignment evidence slot)
- Successor agent: scheduled-agent-1 / nominal Worker 1 wake
- Role: Builder / test recovery successor
- Assignment ID: R3-A1-RR-CI-RECOVERY
- Started at: 2026-08-07T01:04:24Z
- Finished at: 2026-08-07T01:18:12Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting inspected head: `a17099d5a17e8f7d313196635ae587a4bac6f440`
- Lease state: scheduled-agent-2 expired at `2026-08-07T00:56:27Z` without a durable Worker 3 handoff. Scheduled-agent-1 reclaimed A1 at commit `acf3696f266bdd0620321b7e5e1d62c8c6a6918f` after checking branch movement, combined commit statuses, and the connected GitHub commit-run endpoint.
- Dependencies: none.

## Step Performed

Executed the earliest ready assignment as a successor rather than waiting for the nominal Worker 3 slot. The prior carrier had again produced no durable handoff. I repaired the carrier itself so dependency setup, Playwright browser installation, and each required browser command are bounded and their exit codes/logs flow into an always-run handoff path. The hardened carrier was committed as `e7311f273fcb95c9e72f37623fa1fae83e9fa19f`.

I then repeatedly re-read the isolated branch through connected GitHub. Through `2026-08-07T01:18:12Z`, the branch remained exactly at `e7311f273fcb95c9e72f37623fa1fae83e9fa19f` and no Worker 3 result/log handoff appeared. Connected GitHub exposed no combined status for that head and its available commit-workflow lookup returned no run; that lookup is limited to pull-request-triggered runs, so a push-triggered run ID cannot be invented or treated as observed.

Because authoritative run/job IDs, logs, and browser command results are still absent, this assignment is blocked rather than falsely submitted as passing. The next assignment is made ready specifically to repair the execution/observability failure and obtain the browser evidence.

## Research Sources
- Repository evidence: `.gitl/evidence/round-2/worker-6.md` requires authoritative exact-head Firefox/Chromium/mobile execution before Repair & Resume certification.
- Repository evidence: `.gitl/evidence/round-3/worker-1.md` repaired the Firefox-only Playwright `isMobile` matrix error but explicitly left exact-head execution pending.
- Repository evidence: the prior A1 carrier could terminate during dependency setup or browser installation before reaching its evidence/state handoff step.
- Repository evidence: connected GitHub branch comparisons remained identical to `e7311f273fcb95c9e72f37623fa1fae83e9fa19f` during this invocation.
- Inference: a push-triggered run may have been queued or running, but the connected GitHub interface available to this worker did not expose such a run. No result is inferred from that uncertainty.

## Changes
- `.gitl/autopilot-state.json`: reclaimed the expired A1 lease and recorded the third stale-carrier recovery.
- `.github/workflows/r3-a1-exact-head.yml`: hardened setup/install/test execution with bounded timeouts, durable logs, explicit blocker routing, a remote-head guard, and an always-run handoff path.
- Claim commit: `acf3696f266bdd0620321b7e5e1d62c8c6a6918f`.
- Carrier commit: `e7311f273fcb95c9e72f37623fa1fae83e9fa19f`.
- Product source changed: no.
- Generated product artifacts changed: no.
- Temporary carrier is removed during the blocking handoff so any late run cannot push over the newer branch head; the carrier's own remote-head check also rejects that stale push.

## Tests
- `npx playwright test tests/e2e/repair-resume.spec.js --project=firefox`: NOT VERIFIED — no authoritative run/log handoff became visible.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium`: NOT VERIFIED — no authoritative run/log handoff became visible.
- `npx playwright test tests/e2e/repair-resume-production.spec.js --project=chromium-mobile`: NOT VERIFIED — no authoritative run/log handoff became visible.
- Relevant exact-head CI: BLOCKED — connected GitHub did not expose a run/job ID for the push-triggered carrier, and the branch did not receive the carrier's durable result commit during the bounded observation window.
- Full unit suite: NOT RUN — outside this execution-only assignment and no product code changed.
- Certification: NOT CLAIMED.

## Acceptance Criteria
- Firefox no longer executes Chromium-only `isMobile` context: NOT PROVEN BY EXECUTION — code repair exists, exact command evidence remains absent.
- Firefox-safe narrow viewport coverage remains executable: NOT PROVEN BY EXECUTION.
- Production-path fixture runs on exact-head Chromium: NOT PROVEN.
- Production-path fixture runs on Pixel 7 Chromium: NOT PROVEN.
- Zero Send actuation and restart assertions are recorded: NOT PROVEN BY EXECUTION.
- Failure creates the next ready repair assignment rather than stopping: PASS — A2 is activated with the carrier/execution blocker and exact continuation.

## Safety Checks
- Send authority unchanged: PASS — no product source modification.
- CHOICE behavior unchanged: PASS.
- Route and lease safety unchanged or strengthened: PASS — lease was claimed before writes; the hardened carrier verifies lease/head and refuses a stale final push.
- No `main`, merge, auto-merge, tag, release, or publish action: PASS.

## Risks and Limits

The exact browser result is still unknown. A push-triggered GitHub Actions run may exist outside the connected run-list surface available here; therefore absence of a visible run is not proof that no run started. The blocking handoff deliberately moves the branch and removes the temporary carrier, causing any late carrier attempt to fail its remote-head guard rather than overwrite newer coordination state.

The repeated failure mode is now narrower: the project does not primarily need another blind carrier rewrite; it needs an execution path whose run/job identity and logs are observable through the connected GitHub surface, followed by the same three exact browser commands.

## Recommended Next Action

Claim `R3-A2-RR-PROVEN-FAILURE-REPAIR`. Treat the proven failure as CI carrier dispatch/observability, not a product defect. Use an execution path that connected GitHub can enumerate (for example, a head-bound job on an already-recognized workflow or a PR-visible run without merging), obtain exact run/job IDs and logs for all three required commands, and change product code only if those results reproduce a real defect. Preserve zero-Send, restart, CHOICE, route, lease, and uncertainty safeguards.

## Assignment Status
- blocked
