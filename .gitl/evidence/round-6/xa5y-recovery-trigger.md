# R6 XA5Y Ordinary E2E Recovery Trigger

- Assignment: `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY`.
- Purpose: recover the expired same-assignment lease, claim a fresh canonical XA5Y lease, apply only the three XA5X-classified test routing/structure repairs, and hand off connector-level cleanup of temporary XA5Y carrier residue before clean-head CI certification.
- Pre-recovery authoritative head before carrier repair: `390f4b224b410957bb1efd76f80baa2c4e03d33e`.
- Prior XA5Y carrier run: `31240071999` / job `93059441669` completed failure after successfully claiming the lease; the repair push was rejected only because it bundled `.github/workflows/test.yml` mutation under an Actions token without workflow-file authority.
- Prior canonical lease: `gha-r6-xa5y-31240071999`, assignment `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY`, expired `2026-08-08T05:27:51Z`.
- Recovery precheck: branch stayed at the prior lease-claim head until this coordination-only carrier repair; run `31240071999` is completed/failed and no later assignment work was durable. XA5Y remains the earliest executable assignment and research remains ineligible.
- Carrier decoupling commit: `25b963a747badb18fdf556cd8db37c52354f2afc`.
- The repaired carrier no longer asks the Actions token to create/update/delete workflow files. It must claim canonical state before touching Playwright routing or the Repo-Nanny test structure. Temporary carrier cleanup is a separate leased connector-level assignment.
- Product source changes, threshold loosening, Send/CHOICE/route/lease/uncertainty weakening, main/merge/auto-merge/tag/publish/release, and live/physical certification promotion are forbidden.
- Coordination bootstrap note: this trigger and carrier repair are temporary orchestration writes required to obtain an execution-capable lease carrier. No product/test semantic file is changed before the carrier's canonical lease claim.
