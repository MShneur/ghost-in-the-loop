# R6 XA5Y Ordinary E2E Recovery Trigger

- Assignment: `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY`.
- Purpose: recover the expired same-assignment lease, claim a fresh canonical XA5Y lease, apply only the three XA5X-classified test routing/structure repairs, remove all temporary XA5Y carrier residue before the clean test head, and hand off exact ordinary clean-head CI verification.
- Pre-recovery authoritative head: `93c7bdc496f9a2e3053df198d2a1b1e8228b7e11`.
- Carrier-repair commit: `c182ceaf5eff55fa8d0e83ecc1acd44ca799c518`.
- Canonical stale lease: `scheduled-worker-3-r6-xa5y-e2e-recovery-04`, assignment `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY`, expired `2026-08-08T04:22:30Z`.
- Recovery precheck: branch was unchanged at the prior arm head before this coordination repair; connected PR-workflow and classic-status surfaces showed no active work; the lease had expired; XA5Y remained the earliest ready executable assignment; research remained ineligible.
- Product source changes, threshold loosening, Send/CHOICE/route/lease/uncertainty weakening, main/merge/auto-merge/tag/publish/release, and live/physical certification promotion are forbidden.
- Carrier bootstrap is coordination-only. Its first semantic mutation must recover and claim the canonical lease before any test/config repair.
