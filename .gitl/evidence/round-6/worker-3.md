# Ghost Worker Evidence

## Identity
- Round: 6
- Worker evidence slot: 3
- Intended role: Builder
- Executed by: `scheduled-successor-r6-a2-prototype-11`
- Executed role: builder with test-first delivery-pressure lens
- Assignment ID: `R6-A2-MOBILE-SHELL-BUILD`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T17:24:09Z
- Canonical maker observed first: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.1 dated 2026-08-07
- User delivery authority: `.gitl/user-directives/2026-08-07-release-pressure.md`

## State Read
- Branch: `agent/8.8-repair-resume`.
- Starting authoritative state blob before lease: `565f85d71b96cd1a24cf5abfc2dd3db5aee36297`.
- Prior durable delivery-pressure evidence head recorded by state: `77c017cb0f3aaad1aa71e765f92c1325835bb8da`.
- Before claim, canonical state was active, `publishReady: false`, `lease: null`, research fallback temporarily ineligible, and `R6-A2-MOBILE-SHELL-BUILD` was the earliest ready executable assignment.
- The branch comparison from `77c017cb...` showed only the completed reconciliation state handoff before this A2 lease; no open PR used `agent/8.8-repair-resume` as its head.
- Lease claim commit: `37869851a67c4da7fb9ee434f5d3a24c4065c710`.
- Lease holder: `scheduled-successor-r6-a2-prototype-11`.
- Dependencies satisfied for prototype development: `R6-DP-RECONCILE-01:submitted`; A1 structure-map remains truthfully blocked on live evidence, while the release-pressure directive explicitly separates deterministic prototype development from live adapter certification.
- Live authenticated ChatGPT structure and exact live Blue insertion slot remain **UNKNOWN** and were not guessed.

## Step Performed
Performed one bounded implementation/test-artifact attempt under the Delivery-Pressure Checkpoint.

Instead of adding another research note, this wake created a deterministic fixture-owned Blue structural prototype that Builder and Red Team can execute and falsify. The artifact is deliberately incapable of becoming a live ChatGPT binding: it requires a fixture-only proof token (`data-gitl-prototype-contract="fixture-blue-v1"`) before structural mutation is attempted.

No production userscript/extension source was changed. This is intentional for the first `prototypeOnly` A2 step: the implementation is executable candidate behavior in the deterministic Playwright harness, while live adapter selectors and production activation stay dormant until A1X supplies current-host evidence.

## Research / Design Inputs Applied
### Repository evidence
- Round-6 worker-2 evidence requires active-composer scoping, exact Send identity, in-flow placement, one mount, scoped repair, no passive actuation, and rail fallback on verification failure.
- `mobile-shell-concepts.md` requires Blue to be a real in-flow composer action cell and prohibits moving, wrapping, cloning, or replacing Send.
- `research-fallback-08.md` requires a falsifiable structural oracle and known-bad mutants rather than accepting rail fallback as candidate success.
- `research-fallback-10.md` reinforces the broader rule that structural verification must observe behavior rather than gain new host-control authority to hide failures.

### Builder position
Create the smallest executable primitive now: one ordinary in-flow host, one open ShadowRoot, direct reviewed-action callbacks, scoped observers, and explicit rejection reasons. Do not build a generic framework or infer a live ChatGPT slot.

### Red-Team dissent incorporated before handoff
The first draft had two avoidable oracle/cleanup risks: DOM elements were returned across `page.evaluate` boundaries, and repair moving Ghost could generate its own MutationObserver record and schedule redundant repair. These were corrected in follow-up commit `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec` rather than deferred to Red Team.

### Reliability / security lens
The prototype verifies the exact caller-supplied Send node, never changes Send or its parent, never mutates host inline style, never uses document-wide structural observation, and fails closed to the existing rail state on candidate verification loss.

### Accessibility / interaction lens
The ShadowRoot uses `delegatesFocus:false`; passive mount does not autofocus; both Ghost controls are explicit `type="button"` with local accessible names; intentional activation calls only supplied Ghost callbacks and the fixture asserts zero Send click/form-submit side effects.

### Trusted Types / constrained-runtime lens
Shadow content is built with DOM APIs and `textContent`; no `innerHTML`/HTML-string sink is introduced. Observer repair is coalesced through one `requestAnimationFrame` pending slot and generation guard.

## Changes
### Lease claim
- `.gitl/autopilot-state.json`
- Commit: `37869851a67c4da7fb9ee434f5d3a24c4065c710`

### Prototype artifact
- New file: `tests/e2e/mobile-shell-blue-prototype.spec.js`
- Initial executable prototype commit: `305e430abc51f8b49a0e76e74687eb18014951c1`
- Self-audit hardening commit: `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec`

### Prototype behavior
The deterministic candidate:
1. requires an explicit experimental enable gate and fixture-only verified-container proof token;
2. accepts the already-resolved exact Send node rather than discovering an alternate Send path;
3. creates one ordinary `div[data-gitl-mount="blue-prototype"]` as an in-flow child of the verified action row;
4. creates one open ShadowRoot using DOM APIs only;
5. exposes two direct Ghost callback controls (`Toggle Ghost`, `Open Ghost menu`) with `type="button"`;
6. records no host style mutation;
7. owns one MutationObserver scoped only to the verified container and one ResizeObserver scoped to the container/mount;
8. coalesces repair through one RAF slot with generation checking;
9. moves only the Ghost-owned host when a native control appears after it;
10. suppresses the observer record produced by its own Ghost-only reposition so repair does not self-loop;
11. removes only Ghost-owned structure and disconnects resources on failure/unmount;
12. returns explicit structural-rejection reasons so unsafe mutants cannot masquerade as a structural PASS merely because the rail still exists.

### Generated / production artifacts
- `ghost-in-the-loop.user.js`: unchanged.
- `extension/content.js`: unchanged.
- generated extension artifacts: unchanged by this wake.
- `main`, merge state, tags, publication, release: unchanged.

## Tests
### Tests encoded by the new artifact
The new Playwright specification contains five deterministic cases:
1. desktop in-flow open-Shadow mount with exact Send/focus/passive-event/style invariants;
2. 390 px host-control growth, Ghost-only repair, one-mount invariant, and exact cleanup;
3. intentional Ghost callback activation with zero Send/form-submit actuation;
4. oracle kills for fixed-position and unverified/hidden-container mutants;
5. disabled experimental gate causing zero structural mutation.

### Execution status
Required execution is **NOT YET VERIFIED** and no PASS is claimed.

- Exact candidate artifact head checked before evidence write: `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec`; branch comparison reported it identical at that check.
- Existing `.github/workflows/test.yml` is configured to run on pushes to `agent/**` and would execute base certification, generated parity, lint, unit tests, Chromium, and Firefox browser tests.
- Connected GitHub `fetch_commit_workflow_runs` exposes pull-request-triggered runs only; it returned no observable run for the pushed candidate.
- Connected commit combined-status lookup returned no classic status contexts; GitHub Actions check-runs are therefore not evidenced by that surface.
- The interactive browser carrier is unavailable in this unattended wake (`User input required but current turn is running in a non-interactive mode`).
- A local clone/test carrier was attempted with `git clone --branch agent/8.8-repair-resume --single-branch https://github.com/MShneur/ghost-in-the-loop.git /tmp/ghost88`; the runtime failed DNS resolution with `Could not resolve host: github.com`.

Therefore the following required gates remain **UNKNOWN / UNEXECUTED FROM AN OBSERVABLE CARRIER** for the current prototype head:
- syntax/lint;
- generated parity / base certification;
- focused Send/CHOICE/route/lease/uncertainty regressions;
- five new deterministic Blue prototype cases;
- structural mutant kills in execution;
- full unit suite;
- Chromium/Firefox exact-head browser matrix.

This is an execution-evidence blocker, not a fabricated product failure and not a reason to resume open-ended research.

## Acceptance Criteria
- Read canonical maker v1.1 before Ghost work: **PASS**.
- Read canonical state/orchestration/plan/prompts/evidence contract/succession/deferred queue: **PASS**.
- Read assignment-linked user directive, brief, worker-2 evidence, conformance evidence, and Red reflow evidence: **PASS**.
- No conflicting lease/open branch PR before claim: **PASS**.
- Claim shared lease before durable A2 write: **PASS** (`37869851...`).
- Produce one smallest executable Blue prototype artifact: **PASS** (`tests/e2e/mobile-shell-blue-prototype.spec.js`).
- Keep live ChatGPT binding dormant and exact live insertion slot UNKNOWN: **PASS**.
- In-flow host model, open ShadowRoot, no new HTML-string sink: **PASS BY SOURCE INSPECTION; EXECUTION NOT YET VERIFIED**.
- Preserve exact Send node by candidate contract; never move/wrap/clone/replace Send: **PASS BY SOURCE INSPECTION; EXECUTION NOT YET VERIFIED**.
- One mount / scoped observers / coalesced repair / cleanup: **PASS BY SOURCE INSPECTION; EXECUTION NOT YET VERIFIED**.
- Unsafe fixed-position and unverified-container choices fail visibly: **ENCODED, NOT YET EXECUTED**.
- Generated parity exact: **NOT TESTED**.
- Focused Send/CHOICE/route/lease/uncertainty regressions unchanged: **NOT TESTED**.
- Full unit/browser suites: **NOT TESTED**.
- Live ChatGPT structural certification: **UNKNOWN / NOT CLAIMED**.

Because the assignment explicitly requires executed test evidence, A2 must not be marked submitted yet.

## Safety Checks
- Send authority changed: **NO**.
- Production Send selectors/actions changed: **NO**.
- CHOICE behavior changed: **NO**.
- Route behavior changed: **NO**.
- Lease semantics weakened: **NO**.
- Uncertainty/fail-closed behavior weakened: **NO**.
- Existing rail removed or weakened: **NO**.
- New production live structural binding: **NO**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Risks and Limits
- The artifact is a deterministic prototype and does not yet modify production Ghost behavior.
- Its fixture proof token is deliberately synthetic; it cannot certify current ChatGPT structure.
- The exact current authenticated ChatGPT composer action row and live insertion slot remain UNKNOWN pending A1X.
- The new test source has not yet executed on an observable exact-head carrier, so syntax/runtime assumptions remain unproven.
- Desktop/390 fixture behavior is not physical Android, WebView, GeckoView, real IME, or assistive-technology certification.
- The initial self-audit reduced two plausible test-harness defects, but independent Red Team must still attempt to break the candidate after exact execution evidence exists.

## Recommended Next Action
Create/execute the smallest recovery assignment `R6-A2X-MOBILE-SHELL-PROTOTYPE-VERIFY` before accepting A2. It should obtain an observable exact-head carrier for commit `64b2dd1792e3fb59331ea3f2fc72efb32ae0f3ec` or its evidence/handoff descendants without changing prototype semantics, then run the required base/generated/lint/unit and deterministic browser gates. If a test fails, preserve the exact failure and open the smallest code repair. If all required gates pass, mark A2 submitted and immediately hand the same candidate to `R6-A3-MOBILE-SHELL-REDTEAM`.

Do not return to research fallback while this executable verification/recovery path exists.

## Assignment Status
- **blocked — implementation artifact created; exact-head required tests not yet observable/executed**
