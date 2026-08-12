# ChatGPT 8.8 Live Regression — Durable Handoff

Date: 2026-08-12
Repository: `MShneur/ghost-in-the-loop`
Stable base inspected: `main@3fa1ad3ec6bef342260864f28693331b4f3cfd6f`
Working branch: `hotfix/8.8-chatgpt-live-send`
Draft PR: #36
Claude Code handoff prompt: `docs/CLAUDE_CODE_CHATGPT_8_8_LIVE_REGRESSION_PROMPT.md`

## User-reported field failure

After updating to Ghost in the Loop 8.8.0 on ChatGPT:

1. Ghost-owned controls such as Adaptive / committee-related controls appeared not to activate and instead the page jumped/scrolled toward the top.
2. Starting a normal Proceed/Continue path inserted the continuation text into the ChatGPT composer but did not actually dispatch/send it.

Treat this as a real field regression until live authenticated verification proves otherwise.

## What the 8.8 evidence actually proved

The 8.8 release process had extensive deterministic/hosted evidence: Jest, Playwright, Chromium/Firefox, mobile emulation, structural tests, Red Team, lifecycle tests, long-chat/performance work, build identity, packaging, and multiple BrowserStack/live-host investigation branches.

However, the release-candidate documentation explicitly bounded the result: exact current live ChatGPT structural insertion/binding was `UNKNOWN / NOT CERTIFIED`, and no qualifying authenticated live capture had been obtained. The final Round-6 structural audit likewise accepted only bounded deterministic/hosted scope.

This is the key process failure: for a userscript whose core purpose is to manipulate the real composer and dispatch real messages, current authenticated live-host actuation must be a release gate, not an optional footnote.

## Current production architecture relevant to the failure

Ghost 8.8.0's ChatGPT adapter includes reviewed Send selectors such as:

- `button[data-testid="send-button"]`
- `button[aria-label="Send prompt"]`
- `button[aria-label="Send"]`
- `form button[type="submit"]`
- broad reviewed data-testid/class send fallbacks

When no unique reviewed Send button resolves, ChatGPT is allowed a reviewed single-dispatch fallback: one synthetic Enter `keydown` on the composer. That mechanism was introduced to support mobile ChatGPT while preserving the at-most-once journal: select one mechanism before dispatch, fire it once, then observe confirmation or enter uncertainty. Do not regress to the older multi-tier escalation chain merely to obtain a pass.

A current semantic label such as `aria-label="Send message"` is not explicitly covered by the main 8.8 adapter. A plausible field failure is therefore:

`Ghost injects Continue -> reviewed button selector misses live Send -> synthetic Enter is dispatched -> current ChatGPT ignores/does not submit the synthetic event -> text remains in composer.`

This is a high-confidence hypothesis, not a claimed authenticated-live DOM observation. The connected browser carrier available during this investigation returned HTTP 404, so exact current live ChatGPT DOM binding remains unverified.

## Narrow field hotfix implemented on this branch

File: `diagnostics/gitl-chatgpt-8.8-hotfix.user.js`

The shim is deliberately separate from the production userscript so it can be field-tested and removed without changing `main`.

### Send substitution

The shim listens in capture phase for an untrusted synthetic Enter on a recognized ChatGPT composer while Ghost is mounted. Before ChatGPT receives the synthetic key event, it searches locally for a unique safe semantic Send button, including `aria-label="Send message"` and closely related reviewed Send identities.

When exactly one safe semantic Send resolves:

1. prevent the synthetic Enter;
2. stop its propagation to ChatGPT;
3. invoke exactly one click on that exact Send node.

This preserves one-dispatch authority. It does not fire Enter and then click.

When no unique semantic Send resolves, or multiple candidates are present, the shim does not invent authority. It leaves Ghost's existing reviewed Enter path untouched.

Safety vetoes reject disabled controls, popup/menu controls, and surfaces suggesting stop/voice/mic/attach/upload/tool/model/picker/dropdown/emoji/format/cancel.

### Ghost-button default-action guard

The shim also cancels browser/host default actions for `#gitl button` clicks while allowing Ghost's own click handlers to execute normally. Ghost controls are transport/configuration controls, not host-form submitters or anchors. This is a narrow defensive response to the reported jump-to-top symptom.

Do not treat this as proof of the scroll root cause until live reproduction exists.

## Regression coverage

File: `tests/chatgpt-live-hotfix.test.js`

The regression suite proves:

1. one Ghost synthetic Enter becomes exactly one click on a unique visible `aria-label="Send message"` button and the host does not receive the synthetic key event;
2. two plausible semantic Send buttons are ambiguous and fail closed;
3. Ghost-owned button default action is prevented while the Ghost button's own click handler still runs.

## Verification completed

Draft PR #36 was opened solely to trigger ordinary repository-native CI. It is not authorization to merge or publish.

CI run: `31598184515` on code-bearing hotfix head `cdf3fdc26884e746c9bc7f8d8f17096db99f55cd` completed successfully.

The normal CI contract includes:

- Node.js 20 / `npm ci`
- extension build and base certification
- JavaScript syntax checks
- Jest unit suite
- BUILD-IDENTITY oracle
- release-candidate packaging oracle
- Playwright Chromium + Firefox browser safety suite

The run completed green. This proves the code-bearing hotfix head is compatible with the repository's deterministic/hosted test contract. Later commits on the branch add documentation only; they do not broaden the live-certification claim.

## Rejected repair direction

Do not restore the historical button -> Enter -> `insertParagraph` -> form-submit actuator escalation chain as a first response. That architecture can create double-dispatch risk when an earlier actuator succeeds slowly. The current single-dispatch journal/uncertainty design was introduced specifically to avoid that failure class.

Prefer semantic identity + exact uniqueness + one selected actuator + confirmation/uncertainty.

## Recommended production repair direction

The field shim is diagnostic/temporary. A production-quality repair should be made in the primary adapter/actuator code after current live DOM evidence is obtained.

Preferred direction:

1. Capture the exact authenticated current ChatGPT composer and Send control on the failing layout(s).
2. Add the smallest reviewed semantic selector/identity needed (for example `aria-label="Send message"` only if actually observed).
3. Preserve exact-node identity and safe-send vetoes.
4. Preserve one-dispatch transaction semantics; no sequential actuator escalation after an unconfirmed dispatch.
5. Make Ghost-owned buttons explicitly `type="button"` where appropriate and/or centrally prevent host default actions without suppressing Ghost handlers.
6. Add a production-level Playwright fixture reproducing the exact live DOM shape and the reported control behavior.
7. Re-run syntax, generated parity, unit, base certification, Playwright Chromium/Firefox, build identity, packaging/checksum gates, and any applicable mobile lanes.
8. Perform an authenticated live canary before any release claim.

## Required new release gate

For ChatGPT support, a release must not be called live-certified/publish-ready unless a current authenticated canary proves the complete path on the actual host:

`Ghost control click -> expected Ghost state mutation -> composer injection -> exact real Send activation -> outbound user message appears -> model generation begins -> one automatic continuation dispatch occurs -> no duplicate send.`

If a current authenticated live canary cannot run, record ChatGPT live support as unverified and block the live-support/release claim. Deterministic fixtures, BrowserStack, emulation, and CI remain supporting evidence, not substitutes.

## Tools and environments relevant to continuation

Use only tools that are actually available in the current environment; verify before claiming use.

Repository-native / known project capabilities:

- Git repository and GitHub PR/Actions workflow.
- Node.js 20 in CI.
- npm scripts in `package.json` for build, generated parity, certification, lint, Jest, Playwright, BUILD-IDENTITY, packaging, and candidate checks.
- Jest + jsdom unit testing.
- Playwright browser testing with Chromium and Firefox in ordinary CI.
- Existing mobile, lifecycle, long-chat, send-safety, structural, repair/resume, accessibility and performance fixtures under `tests/` and `tests/e2e/`.
- Diagnostic userscripts under `diagnostics/`, including the current field hotfix and existing canary machinery.
- Tampermonkey/userscript field testing on real supported sites when a human or authenticated browser carrier is available.
- Historical BrowserStack/live-host branches for Chrome/Edge/Firefox/Safari, macOS, Android, iOS/iPad and device variants. Do not assume credentials/secrets exist; use only configured repository/environment access.
- GitHub Actions can be used as a guarded execution carrier when local execution is unavailable, subject to the repository's orchestration/evidence rules.

External/live capabilities that may or may not exist for a given worker:

- authenticated browser/devtools/Playwright carrier against real ChatGPT;
- web/network research;
- BrowserStack credentials/devices;
- local shell/browser automation beyond the repository's ordinary CI.

Probe these capabilities rather than assuming them.

## Personal Forge and durable coordination

The repository's `.gitl/orchestration/README.md` states that the autonomous control plane combines GitHub durable state with the canonical Personal-Forge maker and explicit user directives. Personal Forge is therefore part of project coordination/roadmap authority, but private Forge content must not be copied into this public repository.

A continuation worker that has Personal Forge access should:

1. locate/read the existing Ghost coordination record / canonical maker before changing project direction;
2. reconcile it with `.gitl/autopilot-state.json`, `.gitl/orchestration/round-plan.json`, task prompts, evidence contracts, user directives and current GitHub branch/CI state;
3. keep private Forge material private;
4. write durable non-sensitive implementation/test evidence to GitHub so work does not exist only in chat or Forge.

If Personal Forge is unavailable in the worker environment, record that limitation and continue from the durable GitHub state without inventing Forge contents.

## Orchestration and safety constraints

Read `.gitl/orchestration/README.md` and linked state/evidence files before broad project work. Important constraints include:

- sweep/reproduce before patching;
- durable evidence over chat summaries;
- check shared lease/branch activity before coordinated writes when operating under the autonomous-round protocol;
- never merge, enable auto-merge, tag, publish, create a GitHub Release, or change the stable public userscript channel without explicit authority;
- never weaken Send, CHOICE, route, lease, uncertainty, exact-identity or structural-demotion safeguards to make tests pass;
- never claim live-site behavior, hardware, sources or tests that were not actually observed.

## Current decision boundary

The branch and PR are ready for independent review and deeper repair work, but they are **not production-certified for live ChatGPT** until an authenticated current-host reproduction/canary succeeds.

The most valuable next step is independent reproduction and repair of the production adapter with a real current ChatGPT composer, followed by a field canary. If that carrier is unavailable, improve deterministic coverage without converting it into a live-certification claim.

---

## Independent takeover correction (2026-08-12)

A subsequent independent sweep reconciled the repository, PR #36, CI, the
attached multi-pass review, `.gitl` state, and the canonical Personal Forge
coordination record. Only non-sensitive coordination conclusions are recorded
here: 8.8.0 is already on the stable channel; this work remains a narrow hotfix;
exact Send identity, at-most-once dispatch, CHOICE, route/lease and uncertainty
gates remain mandatory; native-site takeover is a separate future stream.

### GitHub state at takeover

- `main` remained `3fa1ad3ec6bef342260864f28693331b4f3cfd6f`.
- PR #36 was open, non-draft and mergeable at
  `3995091091fa2a1a2d66dec3ef4a965c2b2dbbe8`, with no review threads or comments.
- GitHub Actions run `31614232189` was green at that SHA. Its logs show 47 Jest
  suites / 505 passed / 3 todo and 221 Playwright tests passed / 3 skipped. This
  corrects the earlier handoff's stale `119 passed` count. The run is still
  deterministic/hosted evidence only.
- No active `.gitl` lease or newer concurrent hotfix branch work was found. The
  frozen Round-9 `.gitl` state describes the completed 8.8.0 release and is not
  authority to merge or publish this candidate.

### Live read-only evidence and falsified assumption

A cloud Chrome carrier was available, but it was signed out. On the current
public `chatgpt.com` composer, a non-sensitive unsent probe revealed exactly one
visible enabled Send node with these facts:

- tag: `button`;
- id: `composer-submit-button`;
- `aria-label="Send prompt"`;
- `data-testid="send-button"`;
- no explicit `type` attribute;
- inside the composer `form`;
- absent while the composer was empty and present after typing.

The probe text was cleared and Send was not actuated. This observation falsifies
the statement that current ChatGPT generally uses `aria-label="Send message"`:
the observed public layout uses two identities already present in 8.8.0. It
does **not** rule out an authenticated, mobile, experiment or account-specific
`Send message` variant. Because the reporter's authenticated failing layout was
not captured, the field root cause remains **UNKNOWN**.

### Corrections to the candidate repair

1. The `button[aria-label="Send message"]` selector remains as a bounded
   compatibility addition, not a proven live-root-cause fix. It does not widen
   the actuator beyond a reviewed exact semantic identity.
2. `_reviewedSend()` now builds a deduplicated union of all safe matches across
   the reviewed selector set and grants click authority only when that union has
   exactly one DOM node. The previous per-selector loop could see two
   `Send message` controls, skip that ambiguous selector, then return one control
   because a later `data-testid` selector happened to match only it. A new
   regression first reproduced that fail-open behavior.
3. The candidate's panel-wide click `preventDefault()` guard was removed. The
   production panel is appended directly to `document.body`, not a ChatGPT form,
   and its buttons are not nested in anchors, so that guard did not demonstrate
   the reported page-jump cause. Instead every rendered Ghost button is
   explicitly normalized to `type="button"`, preserving normal pointer and
   keyboard activation while remaining safe if the panel is ever reparented.
4. The diagnostic shim remains a temporary probe and is not the production
   architecture. Its passing tests do not certify either field symptom.

### Regression coverage

- `tests/chatgpt-send-selector.test.js`: `Send message` compatibility, the
  observed public `Send prompt`/`send-button` shape, same-node selector alias
  deduplication, cross-selector ambiguity rejection, hidden/disabled/
  `aria-disabled`/menu/disclosure decoys, and fresh resolution after node
  replacement.
- `tests/sendtransaction.test.js`: source contract for union-wide exact-one
  dispatch authority while retaining the single selected actuator transaction.
- `tests/e2e/chatgpt-live-regression.spec.js`: real-browser fixture asserting the
  observed public host node is unchanged, a visible alternate Send fails closed,
  Adaptive and committee controls mutate intended Ghost state, every Ghost
  button is `type="button"`, and no host submit, Send click, URL/hash mutation or
  scroll movement occurs.

### Attached review calibration

The review correctly identified the missing compatibility identity and several
legitimate follow-ups, but its primary conclusion exceeded its evidence. Its
`pressEnter()` double-dispatch change is moot for this path because `engineSend`
does not call `pressEnter()`. Its proposed sequential `requestSubmit` / Enter /
click recovery, learned actuator fingerprints and self-healed Send authority
were rejected because they can duplicate a delayed successful send or invent
authority. GhostBus URL disclosure, Claude label casing, taught-selector
uniqueness, FUZZY_CHOICE and a possibly sticky network-open counter remain
separate follow-up candidates; none was bundled into this narrow hotfix.

### Verification boundary

Local runtime: Node `24.14.0`, npm `11.9.0` (CI retains the required Node 20
parity). Completed commands on the working tree:

- `npx jest tests/chatgpt-send-selector.test.js tests/sendtransaction.test.js tests/sendsafety.test.js tests/sendlayered.test.js --runInBand` → 4 suites / 61 passed.
- `npx jest --runInBand` → 47 suites / 513 passed / 3 todo.
- `npm run check:generated` and `npm run lint` → pass.
- `npm run cert:base` → pass.
- `npm run identity:oracle` → pass (`exact-head` before the new commit,
  `publishReady:false`).
- `npm run package:oracle` and `npm run package:check` → pass;
  `SHA256SUMS` hash
  `aeadf0b41bbedb63ee1ca431044b3dabe446f9881b1bd2f4a92a64339a5bb63d`.

`npx playwright test tests/e2e/chatgpt-live-regression.spec.js` was attempted,
but this worker had no installed browser binary. A second attempt with
`PLAYWRIGHT_BROWSERS_PATH=/tmp/gitl-playwright npx playwright install chromium firefox`
reached the download endpoint but received empty/truncated archives. Repository
CI was therefore used as the browser execution oracle.

Final code-bearing head `b7c694e38306f063bfc8d2109127b78359bfa2ac`
completed GitHub Actions run `31619121019` successfully:

- Unit/base job `94189202923`: Node `20.20.2`, npm `10.8.2`; 47 suites /
  513 passed / 3 todo; generated parity, syntax, base certification,
  BUILD-IDENTITY (`head-moved-payload-identical`, `publishReady:false`) and
  packaging passed.
- Playwright job `94189203012`: 237 cases across Chromium, Firefox and selected
  mobile lanes; 227 passed / 10 skipped. All six new ChatGPT regression
  executions passed in Chromium and Firefox.
- Candidate `SHA256SUMS`:
  `aeadf0b41bbedb63ee1ca431044b3dabe446f9881b1bd2f4a92a64339a5bb63d`.
- Artifacts: release-candidate package `9150492288`; base certification
  `9150492815`.

Intermediate run `31618551192` failed the first resolver fixture because its
mock Send was placed 4,700 px off-screen; `_visible()` correctly rejected it,
leaving the fixed alternate as the only visible candidate. The independent
control-state/no-scroll test passed in both engines. Commit `b7c694e` scrolls
the intended mock Send into view before resolver assertions; no production code
changed in that follow-up.

This remains **not live-certified**. One concrete blocker-clearing action remains:
run the authenticated canary in "Required new release gate" on the reporter's
failing layout, capture only the composer/Send/control facts listed above, and
approve release only if exactly one outbound turn and one continuation appear
without a scroll jump.
