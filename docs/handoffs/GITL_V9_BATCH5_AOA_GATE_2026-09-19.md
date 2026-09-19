# Ghost in the Loop v9 — Batch 5 AoA / Human Gate

Date: 2026-09-19
Branch: `feature/v9-product-shell-5a`
Baseline: `feature/v9-export-restoration` @ `86adc67ede4ac7fc37e535d6c9bf5a81aec16acc`

## Agents of AI used
- Origin 1.2.0: pre-design authority / preserve-built-first.
- Quorum 1.0 + Human Gate 1.1: consequential shell-restoration decision.
- Cleanerz 1.0: old v8 coupling / repair-the-repair check.
- Repo Nanny: live repo truth / archaeology only.
- Stresstest 1.0: verification contract for each sub-batch.

## Named method lenses (live-sourced; no participation or endorsement implied)

### Method seat
- Heavy: Don Norman — human-centered design: solve core/root issues, people first, system view, iterative testing.
  Source: https://jnd.org/the-four-fundamental-principles-ofhuman-centered-design-and-application/
- Light: Jakob Nielsen — progressive disclosure: preserve power while keeping novice surface small.
  Source: https://www.nngroup.com/articles/progressive-disclosure/

### Evidence seat
- Heavy: Jared Spool — observation -> inference -> design decision; use frustration/user journey evidence rather than feature count.
  Source: https://www.uie.com/wp-assets/transcripts/is_design_metrically_opposed.html
- Light: Dana Chisnell — experience-the-experience / usability-test the actual path.
  Source: https://ui.uie.com/workshops/dana-jared

### Operator seat
- Heavy: Kent Beck — large changes in small safe steps; separate behavior/structure and keep changes interruptible.
  Sources: https://newsletter.kentbeck.com/p/free-idea-train-on-changes-not-on ; https://newsletter.kentbeck.com/p/empirical-software-design-qa
- Light: Pete Hodgson — feature toggles/safe rollout, but constrain toggle complexity.
  Source: https://martinfowler.com/articles/feature-toggles.html

### Adversary seat
- Heavy: Bruce Schneier — complexity multiplies failure/security risk; keep trusted mechanisms simple.
  Sources: https://www.schneier.com/essays/archives/1999/11/a_plea_for_simplicit.html ; https://www.schneier.com/academic/archives/2025/03/complexity-is-the-worst-enemy-of-security.html
- Light: Troy Hunt — apply security/risk controls proportionally; design decisions are where security mistakes start.
  Sources: https://www.troyhunt.com/workshops/ ; https://www.troyhunt.com/its-app-sec-in-usa-and-hack-yourself/

### Affected/mobile-accessibility seat
- Heavy: Luke Wroblewski — mobile-first, large touch targets, primary actions easy to hit.
  Source: https://www.lukew.com/mobilefirst/07-chapter-5/index.html
- Light: Sara Soueidan — inclusive web UI; new visual features must not create access barriers.
  Source: https://www.sarasoueidan.com/

## Repo archaeology
The v8.1 production userscript contains substantial removed capability: skin/theme engine, sound, Quick Start/help, personas, workflows, postures, roadmap/stage, custom import/export and Workshop. Current v9 intentionally removed most of these from the core while preserving Play/Export.

## Independent findings
- Method: restore capability, but hide expert complexity behind progressive disclosure.
- Evidence: feature-count parity is not acceptance; verify the actual novice/mobile journey.
- Operator: a single broad restoration batch is too large; slice into reversible UI/prompt/telemetry increments.
- Adversary: never reintroduce alternate Send paths, host-control automation, or semantic controller logic through a “feature restoration” back door.
- Affected: the Android/mobile panel must remain compact; touch controls must not become dense or tiny.

## Spike / strongest dissent
Case against restoration: v9 simplification deliberately removed most of v8's surface area; restoring it risks recreating the exact complexity that made transport reliability hard to reason about.

Disposition: ACCEPTED in part. Restore useful capability, but not old architecture. Rebuild features as data/UI layers above the v9 transport boundary.

## Decision
Do NOT restore the old shell as one Batch 5.

Split:
1. **5A — Appearance + Quick Start/help**: skins/colors as token data only; no prompt or transport changes.
2. **5B — Prompt capability**: personas, workflows, postures, custom imports; all influence prompt construction only, never Send.
3. **5C — Progress + feedback**: roadmap/stage display, sound and notification preferences; observation/UI only.

## Hard preservation
- Play remains sole Send authority.
- No Enter/requestSubmit escalation.
- No automatic resend.
- Watchdog, Top and Export behavior frozen during 5A.
- Mobile-first compact panel.
- Imported/custom data must be escaped and validated before display/use.

## Human Gate
Human choice: NO for this split. It is reversible and directly follows owner intent + current architecture.
Escalate only if a later sub-batch requires changing the Play contract or permissions.

## Progress
Major roadmap: 4/8 complete.
Batch 5: gate 1/4 complete -> 5A implementation next.
