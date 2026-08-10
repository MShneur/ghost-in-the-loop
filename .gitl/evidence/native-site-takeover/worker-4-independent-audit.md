# Native Site Takeover — Worker 4 Independent Audit

Date: 2026-08-10
Role: Worker 4 — Independent Verification / Mobile / Accessibility / Performance / Release Audit

## Gate

**BOUNDED PASS — ChatGPT native-takeover slice is independently green at the exact audited head.**

This is not a release/publication authorization. It certifies the current ChatGPT slice at deterministic CI/browser-fixture scope with explicit limits below. The branch directive remains the authority for this development line; the inherited Round-9 complete/HALT state remains frozen release-candidate history and was not rewritten.

## Exact audited head

- Repository: `MShneur/ghost-in-the-loop`
- Branch: `feature/native-site-takeover`
- Audited head: `dd174a01d3404927f308e47d53d59f3bd7001c65`
- Workflow: `Worker 4 Native ChatGPT Audit`
- Run: `31441762543`
- Job: `93627764466`
- Conclusion: **success**
- Stable/release branches touched: **none**

The audit/evidence commit written after this run is coordination-only and does not change the audited product/runtime head.

## Repairs completed before the final run

Two remaining red suites were stale verification assumptions, not runtime Send regressions.

1. `tests/rail.test.js` still required the legacy rail tracker to start unconditionally in rail mode. Native takeover intentionally suppresses that tracker while `NativeSiteMount.ownsRail()` is true. The test now requires `_applyRail()` routing plus the native-ownership guard and verifies the legacy tracker runs only when native ownership is absent.
2. `tests/package-candidate.test.js` copied the frozen Round-7 identity record for `agent/8.8-repair-resume` into temporary fixtures containing current feature-branch payload bytes. The fixture now creates its own self-consistent identity from its copied bytes. Historical Round-7 release identity evidence remains untouched and package-oracle strictness is unchanged.

The Worker 4 workflow was also hardened so a unit failure emits failed-suite annotations, downstream diagnostics can still execute, Jest JSON is preserved outside Playwright's result directory, and repaired unit tests themselves trigger the audit.

## Unit / Send / adjacent-regression gate

Final Jest artifact:

- suites: **45/45 passed**
- tests: **493 passed, 0 failed, 3 todo, 496 total**
- runtime-error suites: **0**

This clears the prior Round-10 shared-Send harness failure without weakening the invalid-state or valid-state Send semantics. Existing CHOICE, route, lease, composer-staging, uncertainty, rail, packaging, and related unit coverage all ran in the full suite.

## Native takeover and cross-browser behavior

Current-head Playwright lanes passed:

- Chromium desktop: **PASS**
- Chromium mobile / Pixel 7 profile: **PASS**
- Firefox / Gecko project: **PASS**
- whole-composer replacement / fail-closed probe: **PASS**

The production takeover spec positively asserts:

- the original reviewed Send node remains the exact same connected node and stays in the original composer-actions parent;
- passive native mount/repair produces zero `click`, `submit`, `input`, or `keydown` events;
- composer focus remains on the original input;
- exactly one in-flow Ghost host mounts only after structural verification;
- ambiguous Send structure stays on the existing rail;
- replacing Send after mount removes only Ghost and restores the rail;
- action-row growth repairs by moving the same Ghost host while preserving the same Send node;
- the passive rail is suppressed only while native verification remains active.

WebKit is **UNAVAILABLE in the current Playwright configuration**: this branch defines Chromium, Chromium-mobile, and conditional Firefox projects only. No WebKit result is claimed.

## Accessibility / focus

Current-head production tests positively verify:

- focus remains on the ChatGPT composer through passive native mount;
- both Ghost controls are non-submit `button` controls;
- accessible names are exactly `Start or resume Ghost automation` and `Open Ghost panel`;
- ambiguous structure and fail-closed repair preserve focus and cause no passive actuation.

Automated Axe scanning is **UNAVAILABLE / not configured in this branch's current dependency and workflow surface**. Therefore no claim is made that an Axe serious/critical release gate has been completed. That remains a later rebuilt-UI/release gate, not a reason to invent a failure in this currently tested ChatGPT slice.

## Observer / repair / representative performance

A current-head Pixel-class mobile resource/recovery test passed. It instruments intervals and MutationObservers and applies 12 separated wake-recovery pressure windows. The test requires:

- one ticker, heartbeat, bus init, and redetect per recovery window;
- bounded cache-clear work;
- active intervals no more than baseline + 1;
- active observers no more than baseline + 1;
- at most one lock record;
- exactly one Ghost panel/runtime UI instance;
- zero submit/click/input/keydown actuation;
- connected, usable host input and Send controls after repeated recovery.

The lane completed successfully on the exact audited head. This is representative deterministic mobile/resource evidence, not calibrated low-end hardware or physical-device timing certification.

## Generated extension parity / identity

`npm run cert:base && npm run lint` passed on the exact audited head. `cert:base` rebuilds the Firefox extension runtime, checks generated parity, audits the MV3 manifest, and emits the extension artifact index. Generated extension parity and current artifact hashing are therefore green for this head.

The frozen Round-7 release-candidate identity record was deliberately **not** rewritten or treated as the identity of this development branch. It remains provenance for `agent/8.8-repair-resume` and the frozen unpublished 8.8 candidate. A new release/package identity belongs to the later final Human Gate after the takeover rebuild sequence is complete.

## Worker evidence status

- Worker 2 durable ChatGPT build evidence is present and was used as prior evidence.
- No separate durable Worker 3 evidence file was found under `.gitl/evidence/native-site-takeover`; no Worker 3 result is fabricated here. Red-team/fault tests present in the repository remain part of the full regression surface where matched by Jest/selected Playwright lanes.

## Optional external-tool status

- BrowserStack: **UNAVAILABLE** — no usable connector/config/credentials surfaced.
- Checkly: **UNAVAILABLE** — no usable connector/config/credentials surfaced.
- Percy: **UNAVAILABLE** — no usable connector/config/credentials surfaced.
- Lighthouse/LHCI: **UNAVAILABLE in the current branch audit configuration** — no current Worker 4 LHCI lane/config was found.
- Axe: **UNAVAILABLE / not configured** as noted above.
- Personal-Forge: repository/toolbox was inspected for applicable service wiring; no usable BrowserStack/Checkly/Percy/Lighthouse integration surfaced for this run.

Per directive, optional unavailable services are bounded evidence gaps, not blockers by themselves.

## Residual limits / dissent

This audit does **not** certify physical Android/iOS, Firefox Android/GeckoView, Safari/WebKit, Chrome/Edge branded binaries, assistive-technology interaction, live ChatGPT DOM freshness, BrowserStack devices, visual Percy baselines, Axe serious/critical clearance, or Lighthouse field/performance budgets. The release plan still requires those where available/applicable before publication.

The strongest current dissent is therefore scope, not a known red product defect: deterministic current-head behavior is green, but live-host/physical-device/accessibility-tool breadth is not yet certified.

## Handoff to Worker 1

**Next exact action:** accept the ChatGPT native-takeover slice at bounded independent-verification scope and assign Worker 2 the next dependency-ready build step: promote the independently specified Round-6 **Claude native in-flow resolver/mount** into production on `feature/native-site-takeover`, preserving the same exact-Send, zero-passive-actuation, focus, one-host, repair, and rail-demotion invariants. Do not merge, publish, tag, release, or rewrite the frozen 8.8 release-candidate identity.

## Bounded conclusion

`BOUNDED PASS` for the ChatGPT native-takeover slice at exact head `dd174a01d3404927f308e47d53d59f3bd7001c65`. No current deterministic defect remains from the repaired audit. The next work item is Claude takeover promotion, followed later by rebuilt-UI accessibility cleanup, representative live-host/device verification, and a new final package/build identity Human Gate.