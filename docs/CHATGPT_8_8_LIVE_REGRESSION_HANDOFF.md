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

## Independent takeover — production repair (8.8.1)

A second worker independently reviewed the branch, PR #36, current `main@8.8.0`,
the diagnostic shim, and the multi-agent field reviews, then reconciled against
the Personal-Forge Ghost coordination record (post-release takeover handoff:
8.8 on stable channel; preserve exact reviewed Send identity, at-most-once
dispatch, CHOICE/route/lease/uncertainty; native takeover is future work).

### Reproduced deterministically
- `main@8.8.0` ChatGPT adapter `send` list does **not** contain
  `button[aria-label="Send message"]`; `pressEnter()` has **no callers** in the
  send path (the single-dispatch `reviewed-enter` strategy fires one inline
  `keydown`, so the reports' `pressEnter` concern is moot for the transaction).
- The failure chain is therefore: inject Continue → `_reviewedSend()` returns
  null (no reviewed identity matches the live control) → `engineSend` selects
  the reviewed synthetic-Enter fallback → current ChatGPT ignores the synthetic
  key → text remains in the composer. This matches the field report exactly.

### Evidence for `aria-label="Send message"` (no authenticated live capture available)
Converging, non-authenticated: the repo's own test fixture, the Gemini adapter's
existing use of the identity, multiple independent multi-model reviews, and an
external maintained ChatGPT userscript all cite `aria-label="Send message"` as
the current live composer Send control. The connected browser carrier was
unavailable, so exact authenticated-live DOM remains **UNVERIFIED**.

### Smallest production repair (in `ghost-in-the-loop.user.js`, not the shim)
1. Prepended `'button[aria-label="Send message"]'` to the ChatGPT reviewed
   `send` array. The real control now resolves via `_reviewedSend()` as a single
   reviewed actuator (`reviewed-button` → one `.click()`); the synthetic-Enter
   fallback is not reached. Exact-node identity, uniqueness (fail-closed on
   ambiguity), disabled/`aria-disabled` rejection, `aria-haspopup`/`aria-expanded`
   structural veto and `SEND_VETO` are all preserved. At-most-once/single-dispatch
   is unchanged. No actuator escalation chain was restored.
2. `mountPanel()` installs one panel-scoped, capture-phase guard cancelling only
   the browser default action on `#gitl button` clicks (host-form submit / anchor
   nav → the reported jump-to-top). It does **not** `stopPropagation`, so Ghost's
   own handlers still run; duck-typed (`el.closest`) so it is safe where the
   userscript sandbox does not expose `Element` (a real bug the test suite
   caught). This supersedes the shim's global default-action guard.

The diagnostic shim `diagnostics/gitl-chatgpt-8.8-hotfix.user.js` is now
**superseded** by the production repair and can be retired once the production
fix is field-confirmed.

### Regression coverage added
`tests/chatgpt-send-selector.test.js` — source contract (identity present and
ordered before the generic `form button[type="submit"]`), live-DOM
`_reviewedSend()` resolution returning the exact button, and fail-closed cases
(ambiguous duplicates, disabled, `aria-haspopup` decoy), plus the panel-guard
contract (prevents default, never stops propagation).

### Deterministic verification (this repair, on `hotfix/8.8-chatgpt-live-send`)
- `npm run check:generated` → generated extension current (parity).
- `node -c ghost-in-the-loop.user.js` → OK.
- `npx jest` → 47 suites, 505 passed, 3 todo.
- `npm run cert:base` → exit 0.
- `npm run identity:oracle` → PASS (exact-head), record regenerated for 8.8.1
  with `publishReady:false`, `publicationState:candidate-not-published`.
- `npm run package:oracle` → staged five immutable payload files + deterministic
  metadata.
- `npm run test:e2e` → 119 passed / 3 skipped across Chromium, Firefox,
  chromium-mobile (incl. `send-evidence` production-seam and full UI smoke).

This is **deterministic/hosted evidence only**. Per the release gate below, it is
**not** a live-ChatGPT certification: no authenticated current-host canary was
run in this environment. 8.8.1 must not be called live-certified until the
canary in the "Required new release gate" section succeeds on the actual host.
