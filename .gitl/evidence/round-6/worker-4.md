# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 4
- Intended role: Test engineer / Red Team
- Executed by: `scheduled-worker-1-r6-a3-handoff-repair-16`
- Assignment ID: `R6-A3-MOBILE-SHELL-REDTEAM`
- Started at: 2026-08-07T20:00:16Z
- Finished at: 2026-08-07T20:09:57Z

## State Read
- Branch: `agent/8.8-repair-resume`
- Initial A3 carrier result commit: `6958dbf601cb9c97e735cab0dd516504234f31e4`
- Initial failing run/job: `31213429856` / `92981355836`
- Lease claim commit: `94d3d9953b893cae3851801a1e64aa4345d8e326`

## Step Performed
The first Red Team carrier found one reproducible semantic failure in both Chromium and Firefox: a deliberately overflow-clipped narrow composer could still be reported as `structural`. This recovery applied the smallest fixture-only fail-closed correction: when a verified structural container clips an axis, the exact Send and Ghost mount must remain within the container's visible bounds (1 CSS px deterministic tolerance) or structural mode is rejected. The Red oracle was strengthened to require a clipping-specific rejection reason.

## Research Sources
- Repository brief: Blue is valid only when host controls remain visible/reachable and narrow crowding fails closed.
- Initial Red Team run 31213429856: all prerequisite gates passed; only overflow-clipped structural acceptance failed in Chromium and Firefox.
- No new external research was performed; executable repair outranked research under maker v1.1 delivery pressure.

## Changes
- Candidate prototype blob after working-tree repair: `53cc902428a3fc1496a83ad1bf0bd1bbe6752c84`
- Red Team oracle blob after pin/assertion update: `b8b5048dbc042626294423e28b337eb27d6c6b63`
- Production userscript/extension behavior: unchanged.
- Temporary workflow and trigger: removed by this transaction.

## Tests
- Guard: **success**
- Patch/syntax: **success**
- npm ci: **success**
- cert:base/generated parity: **success**
- lint: **success**
- focused Send/route/lease safety: **success**
- browser install: **success**
- Blue Chromium+Firefox: **success**
- A3 Red Team Chromium+Firefox: **success**
- Repair carrier run: `31214560411`
- Job label: `repair` (numeric job ID to be bound by successor connector inspection)
- Artifact: `9008001890`
- Artifact digest: `0da54eefef64cc4ae4ccacc3b20ffe8488f0e3daea80706c2378d57d9fce31e9`
- Overall: **PASS**

## Acceptance Criteria
- Reproduce and preserve initial overflow failure: **PASS** — run 31213429856 / job 92981355836.
- Host-control churn, whole-row replacement, token loss, cleanup: **success** as part of Red suite.
- Clipped Blue/Send may not remain structural: **success**.
- Existing Blue structural suite remains green: **success**.
- Focused Send/route/lease safeguards remain green: **success**.
- Live ChatGPT structural certification: **NOT TESTED / NOT CLAIMED**.

## Safety Checks
- Send authority unchanged: YES.
- CHOICE behavior unchanged: YES.
- Route and lease safety unchanged: YES.
- No `main`, merge, auto-merge, tag, publish, or release action: YES.

## Risks and Limits
This is deterministic fixture certification only. It does not prove the current authenticated ChatGPT insertion slot, physical Android/WebView, GeckoView/Firefox-Android, or real assistive-technology behavior. The 1 CSS px bound is only deterministic geometry tolerance, not permission to cover or displace host controls.

## Recommended Next Action
Advance to `R6-A4-MOBILE-SHELL-MOBILE-PERF`; do not return to research.

## Assignment Status
- submitted
