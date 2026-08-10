# User Directive — Native Site Takeover Development Round

Date: 2026-08-10
Authority: explicit user instruction in ChatGPT
Branch: `feature/native-site-takeover`

## Decision

The prior 8.8 release candidate remains frozen and unpublished. A new development round is explicitly opened on `feature/native-site-takeover` to promote the already-tested Round-6 native structural prototypes into the actual Ghost product.

This directive supersedes the legacy `complete-awaiting-publication-authority` / HALT state **only for work on this branch**. It does not authorize changing `main`, `release/8.8.0-staging`, or `agent/8.8-repair-resume`.

## Product target

Rebuild Ghost so that, on safely verified supported AI sites, compact Ghost controls mount in-flow inside the site's native composer/action area rather than showing a separate side dock/rail. The existing rail remains the fail-closed fallback when native structural verification is absent or uncertain.

Start with ChatGPT and Claude because Round 6 already produced deterministic native-mount prototypes for both. Promote proven primitives rather than restarting research.

## Non-negotiable invariants

- Never move, wrap, clone, replace, or broaden authority over the site's real Send control.
- Passive mount/repair performs zero Send, submit, input, or keydown actuation and does not steal focus.
- Preserve at-most-once Send, CHOICE, route, lease, composer-staging, and uncertainty safeguards unchanged.
- Accessibility defects already reproduced must be repaired in the rebuilt UI before release.
- No merge, auto-merge, tag, publication, GitHub Release, store upload, or stable-channel mutation without separate explicit user authority.

## Execution strategy

Build -> test changed artifact -> repair concrete failure -> final gate. Do not return to cadence-driven broad research or repeat already-green test lanes unless the product artifact changed or freshness requires it.

Use Personal Forge testing capabilities where useful: Playwright, BrowserStack, Checkly, Percy when available, Axe, Lighthouse/LHCI, and dependency/update signals. Do not require a service merely because it exists; classify unavailable optional lanes without blocking core delivery.

## First implementation assignment

Promote the smallest proven ChatGPT native-mount primitive from Round-6 evidence into `ghost-in-the-loop.user.js`, with focused production tests proving:

1. one in-flow Ghost native control host mounts only when the verified structural contract resolves;
2. exact Send-node identity is preserved;
3. passive mount/repair produces zero Send/submit/input/keydown activity;
4. failure demotes cleanly to the existing rail;
5. the separate visible rail is suppressed only while native mounting is verified.

Then hand the exact tested head to the Red Team worker. Do not self-certify.