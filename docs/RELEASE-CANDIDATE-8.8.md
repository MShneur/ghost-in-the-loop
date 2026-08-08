# Ghost in the Loop 8.8 — Release-Candidate Evidence Boundary

This document describes the **isolated 8.8.0 release candidate** on `agent/8.8-repair-resume`. It is a release-evidence summary, not publication authority.

## Candidate versus stable channel

- Candidate version: `8.8.0` on the isolated `agent/8.8-repair-resume` branch.
- Stable userscript install/update authority remains `main`. The README install badge and the userscript `@updateURL` / `@downloadURL` continue to point at `main`.
- The BUILD-IDENTITY audit observed stable `main` at `8.7.1` while the isolated candidate reported `8.8.0`.
- Candidate identity is defined by semantic version, immutable shipped-payload hashes, explicit Git/test provenance, and candidate/stable channel classification. Coordination-only `.gitl` head movement is not a new shipped payload when those immutable bytes are unchanged.
- `publishReady=false`. No merge to `main`, tag, GitHub Release, store upload, stable-channel URL change, or other publication action is implied or authorized by this document.

The canonical BUILD-IDENTITY evidence is under `.gitl/evidence/round-7/`, including `candidate-identity.json` and `worker-6-final-audit.md`.

## Certification boundaries carried into 8.8

### Round 4 — lifecycle recovery

The lifecycle program is accepted at its bounded deterministic/hosted scope. Synthetic freeze/resume/discard classification, BFCache fixtures, and Pixel-class browser emulation do **not** establish physical Android discard/freeze behavior, real browser scheduler suspension/discard behavior, Firefox-Android/GeckoView lifecycle behavior, or a calibrated low-end-device performance budget.

Canonical audit: `.gitl/evidence/round-4/worker-6.md`.

### Round 5 — long-chat performance

The grouped-selector answer collector reduced redundant returned-match work in the tested retained-DOM envelope and preserved the accepted correctness/safety gates. The result is **not** constant-time or asymptotically bounded: answer lookup remains history-linear, and the safety-critical Send-observation path remains history-linear at the recorded 2000-turn envelope (`8004` assistant-selector matches/sample).

Pixel-7 Playwright emulation is not physical Android certification, desktop Firefox is not GeckoView/Firefox-Android certification, and hosted wall-clock p95 values are not a calibrated hardware budget.

Hosted timing reproducibility remains explicit dissent. Same-payload ordinary CI has produced both green and timing-only red/flaky observations, including runs `31250247148`, `31250442852`, `31250736801`, `31250770870`, and the later A4 claim-head run `31251250525`. These observations do not authorize weakening the accepted Round-5 numerical thresholds and are not, by themselves, evidence of a product-byte regression.

Canonical audit: `.gitl/evidence/round-5/worker-6.md`; later timing reconciliation: `.gitl/evidence/round-7/worker-6-final-audit.md` and `.gitl/evidence/round-8/worker-1.md`.

### Round 6 — structural mobile shell

The ChatGPT + Claude structural program is accepted only at bounded deterministic/hosted cross-adapter scope.

Structural authority is ordered and fail-closed:

1. A certified site-specific structural runner may act only when reviewed site identity and its adapter-owned structural capability/signature pass the certified contract.
2. Otherwise Ghost demotes to the standard adapter-aware structural protocol when that protocol verifies safely.
3. When structural capability is absent, stale, clipped, ambiguous, wrong-site, or otherwise unverifiable, Ghost demotes to the existing rail fallback.

Structural-mount authority is separate from input/Send actuation authority. A structural runner does not inherit Send authority; exact original Send-node identity and zero passive Send actuation remain required by the bounded evidence.

Exact current live ChatGPT insertion and exact current live Claude insertion remain **UNKNOWN / NOT CERTIFIED**. Read-only live authenticated ChatGPT inspection is authorized when a functioning carrier exists, but no current qualifying live capture has been obtained. Physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance remain uncertified.

Canonical audit: `.gitl/evidence/round-6/final-mobile-shell-audit-retry.md`.

### Round 7 — build identity and dependency disposition

BUILD-IDENTITY is accepted only at bounded immutable-payload / explicit-provenance-and-test-binding / candidate-channel / non-published scope. The machine-readable identity oracle distinguishes coordination-only head movement from shipped-payload movement and fails closed on version drift, generated-content drift, payload-hash drift, and candidate/stable-channel confusion.

The exact dependency audit found two high-severity indirect nodes in the Jest development graph:

- `brace-expansion@1.1.15`
- `js-yaml@3.14.2`

`npm audit --omit=dev --json` reported zero vulnerabilities and no concrete path from those development-tooling nodes into the immutable shipped userscript/extension payload was established. That supports a bounded non-shipped release disposition; it does **not** prove the upstream advisories harmless or universally non-exploitable. Shipped exploitability remains **UNKNOWN / NOT CLAIMED**, and no blind dependency upgrade is authorized by this evidence.

Canonical audit: `.gitl/evidence/round-7/worker-6-dependency-audit.md` and `.gitl/evidence/round-7/worker-6-final-audit.md`.

## Safety invariants that documentation must not weaken

Release prose must not imply broader authority than the product/tests establish. In particular, documentation changes do not weaken or bypass:

- reviewed single-dispatch Send authority and exact Send identity;
- at-most-once delivery confirmation and uncertainty pause;
- `[[GITL::CHOICE]]` human-decision behavior;
- route and shared-lease fail-closed behavior;
- specialized → standard → rail structural demotion on uncertainty;
- the accepted Round-5 timing thresholds;
- publication controls.

## What remains outside the declared 8.8 evidence scope

The current candidate does not claim certification for exact live ChatGPT/Claude structural insertion, physical Android, Android WebView, Firefox-Android/GeckoView, real mobile IME/browser-toolbar combinations, real assistive-technology mappings, calibrated low-end hardware performance, universal site-independent structural inference, universal timing reproducibility, or universal non-exploitability of the development-tooling advisories.

Those limits restrict claims; they do not retroactively invalidate the bounded deterministic/hosted certifications recorded above.
