# Round 6 A2X Carrier v2 Trigger

- Assignment: `R6-A2X-MOBILE-SHELL-PROTOTYPE-VERIFY`
- Trigger purpose: execute the remaining repository-defined verification gates for the existing deterministic Blue prototype.
- Candidate ancestor: `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec`.
- Pre-trigger authoritative branch head was `7c56558bb8af5946bd80b260af3ba01388752f92`; the branch was rechecked identical immediately before arming the carrier.
- Canonical state had `lease: null`, A2X ready, and research lower priority than executable verification.
- Coordination deviation: the connected contents API requires whole-file replacement for `.gitl/autopilot-state.json`; this bounded carrier recovery therefore did not rewrite the large state file solely to hold a short lease. No product source is changed by this trigger. Any successor seeing the carrier workflow/trigger or branch movement after the arm commit must treat A2X as active conflicting work and HOLD rather than duplicate it.
- Required carrier gates: `npm ci`, `npm run cert:base`, `npm run lint`, full unit suite, focused Send/CHOICE/route/lease/uncertainty Jest regressions, Playwright Chromium+Firefox install, and `tests/e2e/mobile-shell-blue-prototype.spec.js` in both browser projects.
- Result must be recorded durably; no PASS is implied by this trigger.
