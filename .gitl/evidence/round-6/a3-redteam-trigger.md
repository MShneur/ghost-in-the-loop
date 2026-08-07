# Round 6 A3 Red Team Carrier Trigger

- Assignment: `R6-A3-MOBILE-SHELL-REDTEAM`
- Trigger purpose: execute adversarial falsification against the exact repository-verified Blue prototype before mobile/accessibility/performance certification.
- Red Team test commit: `12a1f81fdf07890cdc3f0f8b7ce0475784d6ef70`.
- Carrier arm commit: `da902acf5b96788924f7bc8f14d508ce58d832b0`.
- Pre-trigger branch was rechecked identical to the carrier arm commit.
- Canonical state had `lease: null`, A3 ready, A2/A2X submitted, and research temporarily ineligible.
- Coordination deviation: the connected contents API requires whole-file replacement for `.gitl/autopilot-state.json`; this bounded Red Team execution therefore uses branch-stability checks plus the temporary workflow/trigger as visible conflicting-work evidence rather than rewriting the large state file solely for a short lease. Any successor seeing this trigger/workflow or subsequent branch movement must HOLD rather than duplicate A3.
- Required carrier gates: `npm ci`, `npm run cert:base`, `npm run lint`, focused Send/route/lease regressions, existing Blue prototype Chromium+Firefox, and A3 Red Team Chromium+Firefox.
- Red Team attacks: host-control insertion churn, whole verified-row replacement/stale-resource cleanup, verification-token loss, overflow/reachability, explicit teardown, one-mount and zero-Send invariants.
- Result must self-report durably; this trigger implies no PASS.
