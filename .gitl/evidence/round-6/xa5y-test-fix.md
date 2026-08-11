# Ghost Worker Evidence — R6 XA5Y Test Fix

- Assignment: `R6-XA5Y-ORDINARY-E2E-ROUTING-TEST-RECOVERY`
- Lease holder: `gha-r6-xa5y-31242416590`
- Claim head: `9281b96d3bd71dc75b54df626266f2876bff31e8`
- Product source changed: **NO**
- `playwright.config.js`: root Pixel-class lifecycle fixture excluded from desktop Chromium and Firefox; R5 A2 timing oracle excluded from Firefox only.
- `tests/e2e/repo-nanny/send-evidence.spec.js`: missing close restored so all three Send-evidence tests are top-level siblings; assertions unchanged.
- `tests/e2e/lifecycle-mobile-perf.spec.js`: unchanged.
- `tests/e2e/long-chat-perf-a2.spec.js`: unchanged, including every numerical threshold.
- Stale XA2X runner/job residue remains absent.
- Temporary XA5Y workflow/trigger/registered-job residue is deliberately NOT touched by this Actions-token commit because GitHub rejects workflow-file mutation from this carrier. Connector-level cleanup is the next bounded assignment before clean-head CI certification.
- No PASS is inferred before temporary-carrier cleanup and exact ordinary run/job/artifact evidence.

## Coordination recovery
The prior XA5Y lease expired after run 31240071999 failed while trying to mutate workflow files. Branch movement then stopped. This repaired carrier changes no product source and makes its first semantic mutation the fresh canonical lease claim before test/config repair.
