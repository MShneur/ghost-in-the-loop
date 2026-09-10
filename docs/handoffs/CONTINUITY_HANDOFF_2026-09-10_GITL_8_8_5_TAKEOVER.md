# Ghost in the Loop — 8.8.5 Continuity Handoff

Date: 2026-09-10
Status: NOT RELEASE-READY
Primary repo: `MShneur/ghost-in-the-loop`

## Read this first

This handoff exists because the prior chat got stuck in a diagnosis/repetition loop. Do not restart the investigation from scratch. Continue from the exact verified state below.

## Current verified refs

- `main` head: `0187587d7020ae8bdd34a68a86eac81d9dcce46f`
- `agent/8.8.5-send-router` head: `8512ef77b149168c0d75284a47f1710b2e6f6ac1`
- `hotfix/8.8.5-p0-perplexity-fallback-ui` head: `05721b82bdf36985418071990080aaecb13de00a`
- This handoff branch: `handoff/8.8.5-continuity-2026-09-10`

Do not merge stale 8.8.3/8.8.4 recovery branches wholesale. Use current `main` plus the two 8.8.5 branches above as the working evidence.

## User goal

Ship a genuinely usable Ghost build. The base requirement is simple:

1. Play/Resume must actually continue the conversation.
2. If the primary path fails BEFORE any ambiguous send, Ghost should try a different known-safe route.
3. Alpha/Beta/Gamma/Delta must be visible/selectable in the REAL production Run panel, not hidden in a sidecar tester.
4. ChatGPT Firefox/Android and Perplexity both need to work.
5. Rich diagnostics should tell us which route/method failed and which fallback succeeded.
6. Never auto-fire another actuator after an ambiguous post-send state; duplicate sends are unacceptable.

## Confirmed field failures

### ChatGPT — Firefox 155 Android

Observed on live 8.8.4:

- Round 1 sends successfully.
- Round 2 logs `send_attempted` with `path: reviewed-button`.
- No new user turn/generation is confirmed.
- Later redetect sees `input:true`, `send:false`.
- Network observer active but trusted pulse stale.
- Ghost pauses with `SEND-002` / `send-uncertain`.

This proves the 18s confirmation extension alone did not fix the issue. The likely boundary is dispatch authority / host reconciliation / stale or replaced Send control, not merely confirmation timeout.

### Perplexity

Observed on live panel:

- Ghost reports input/read/send ready.
- `COMPOSER-002` occurs before dispatch.
- The same roadmap command can appear doubled in the Lexical/contenteditable composer.
- Exact prompt verification then fails.
- Resume returns to waiting instead of completing a safe pre-send retry.

The current contenteditable injection path can emit multiple input-like operations after `execCommand('insertText')`; Perplexity/Lexical is the strongest current suspect for duplicate staging.

## Confirmed architecture drift / implementation miss

The user repeatedly asked for Alpha/Beta/Gamma/Delta redundancy, but the live 8.8.4 production panel still only exposes normal Start/Resume/Stop (plus health-gated Repair & Resume).

A separate recovery script has Alpha/Beta/Gamma/Delta, but that does NOT satisfy the requirement because:

- it is not integrated into the real production panel;
- Alpha/Beta/Gamma mainly vary composer staging;
- several of them converge on the same `button.click()` send actuation;
- production therefore still effectively has one reviewed-button dispatch path in the failure case.

The older repo contains a broader diagnostic ladder that tested distinct actuation mechanisms, including:

- reviewed `HTMLElement.click()`;
- semantic exact-one click;
- explicit `MouseEvent` path;
- `form.requestSubmit(exact reviewed submitter)`;
- reviewed Enter dispatch;
- two-phase exact-text + exact-authority + one-click candidate.

The new production router must preserve the at-most-once invariant by choosing one route BEFORE opening the send transaction.

## 8.8.5 work already started

### Branch: `agent/8.8.5-send-router`

Contains an 8.8.5 assembler/router direction with:

- first-class `#composer-submit-button` ChatGPT selector;
- Alpha = fresh reviewed click;
- Beta = `form.requestSubmit(exact submitter)` when provable;
- Gamma = reviewed Enter fallback;
- Delta = manual host Send;
- two animation-frame reconciliation before final dispatch route selection;
- route health memory/suppression after ambiguous outcomes;
- richer SEND-002 telemetry;
- regression intent for Firefox Android first-send/second-send after composer replacement.

Do not assume this branch is certified or complete. Inspect it and transplant only verified pieces.

### Branch: `hotfix/8.8.5-p0-perplexity-fallback-ui`

This is the preferred continuation branch because it was created specifically to close the remaining P0s:

1. Perplexity single-write Lexical/contenteditable staging.
2. Real Auto / Alpha / Beta / Gamma / Delta controls in the live Run panel.
3. Resume behavior after a safe PRE-SEND failure.
4. Production routing with genuine dispatch-level differences.
5. ChatGPT round-2 + Perplexity regression coverage.

At stop time this branch was NOT finished and NOT release-ready.

## Required implementation tasks

### Task A — Fix Perplexity composer staging

Goal: exact intended prompt is written once and retained.

Audit `injectText()` for `contenteditable` / `PLAT.useCE`.

Likely problem area:

- `execCommand('insertText')`
- followed by an input event
- Lexical may mirror/reconcile that event and duplicate content
- exact staging gate then correctly reports `COMPOSER-002`

Required behavior:

- one authoritative write path per staging attempt;
- verify exact normalized text after host reconciliation;
- if exact text is not retained, stop before Send;
- no second write into the same composer unless the first attempt is observationally proven absent/cleared;
- add a Perplexity/Lexical regression where duplicate staging would fail the test.

### Task B — Fix Resume semantics for PRE-SEND failures

Current normal Resume can simply rearm the ticker / waiting state.

Required distinction:

- PRE-SEND failure (`COMPOSER-001`, `COMPOSER-002`, no send transaction opened): safe to re-stage/retry using the selected/next route.
- POST-SEND ambiguous (`SEND-002`, transaction uncertain): NEVER auto-retry another actuator.

Resume after a PRE-SEND failure should run the recovery path, not just return to observation.

### Task C — Put Auto / Alpha / Beta / Gamma / Delta in the actual Run panel

User explicitly wants visible switching between methods.

Required UI:

- `Auto` default;
- `Alpha`;
- `Beta`;
- `Gamma`;
- `Delta`;
- compact/mobile-friendly controls in the existing Transport section;
- selected route persisted per host;
- diagnostics show selected route and actual route used.

Do not build another separate tester as the primary solution.

### Task D — Make routes genuinely distinct at dispatch boundary

Recommended production meanings:

- Alpha: freshly reacquired current reviewed Send button -> exactly one `.click()`.
- Beta: exact current composer form + exact reviewed submitter -> exactly one `form.requestSubmit(submitter)` when same-form identity is provable.
- Gamma: freshly focused/reconciled composer -> exactly one reviewed Enter dispatch when platform contract explicitly allows it.
- Delta: stage only, Ghost does not actuate; user taps host Send once, Ghost observes acknowledgement.
- Auto: choose among eligible routes BEFORE `_beginSendAttempt()` based on host/platform/round/confirmed route health.

Hard rule: after `_beginSendAttempt()` opens the at-most-once transaction, there is NO automatic alternate actuator in that transaction.

### Task E — ChatGPT Firefox Android round-2 regression

Must reproduce synthetic host replacement:

1. First identical `Continue.` succeeds.
2. Host replaces composer/form/send subtree.
3. Second identical `Continue.` is staged into the fresh composer.
4. Auto selects a fresh eligible dispatch route rather than blindly reusing stale button authority.
5. Exactly one actuator fires.
6. New user turn / generation / trusted evidence confirms success.

### Task F — Perplexity regression

Must include:

1. Lexical/contenteditable composer.
2. First staging writes exact prompt once.
3. Composer reconciliation/replacement permitted.
4. `_awaitStagedComposer` confirms exact text.
5. No doubled prompt.
6. A PRE-SEND staging failure can be resumed safely and can select another route.

### Task G — Diagnostics

Reports should include redacted fields only:

- selected route;
- actual route/path;
- staging method;
- composer replaced yes/no;
- composer poll count;
- send control connected/enabled;
- same-form proof yes/no;
- requestSubmit eligible yes/no;
- Enter eligible yes/no;
- user-turn delta;
- trusted network pulse age;
- PRE-SEND vs POST-SEND classification;
- fallback sequence attempted;
- which fallback succeeded.

Never include prompts, selector strings, URLs, conversation IDs, credentials, or raw user-agent text.

## Testing / certification requirements

Do not call 8.8.5 fixed until these pass:

1. `npm run check:committed`
2. `npm run cert:base`
3. `npm run lint`
4. `npm run test:unit`
5. `npm run identity:oracle`
6. `npm run package:oracle`
7. `npm run test:e2e` with Chromium + Firefox installed
8. new ChatGPT round-2 regression
9. new Perplexity duplicate-staging/resume regression
10. extension/userscript parity

Real-device Firefox Android remains the final field proof. Cloud Playwright/Azure cannot be treated as equivalent to the user's real phone session.

## MCP / tool state learned in prior chat

- GitHub connector: working.
- Personal Forge Oracle: working.
- Azure Browser 2: working for fixtures and generic browser tests.
- Cloud browser visiting ChatGPT may hit Cloudflare 403; do not interpret that as a Ghost failure.
- Old Codespaces browser MCP path previously returned 404 and should not be primary.
- Direct OpenRouter and direct NVIDIA free-model access were working in the prior audit.
- Higher-level model-lens/Token Router wrapper was degraded; direct-provider fallback was healthier.

Do not spend another cycle rediscovering these unless the current tool status materially changes.

## External review conclusions already gathered

Independent free-model reviews converged on these likely causes:

- stale/replaced Send authority;
- ProseMirror/React reconciliation lag;
- editor/composer state not fully committed even when text is visibly present;
- need for mutation-aware reacquisition;
- need for first-send/second-send-after-DOM-replacement regression.

Reject any suggestion to fire multiple synthetic actuators after an ambiguous send. That violates the core safety invariant.

## Do NOT repeat these mistakes

- Do not claim Alpha/Beta/Gamma/Delta are integrated when they only exist in a recovery sidecar.
- Do not call a build fixed because mocked desktop tests pass.
- Do not solve a dispatch failure by only extending a confirmation timeout.
- Do not repeatedly inspect the same files without advancing implementation.
- Do not create more testers instead of finishing the production panel and router.
- Do not merge stale hotfix branches wholesale.
- Do not push `main` until the critical tests above are green and the user explicitly authorizes the live push.

## Exact next action for the new chat

1. Read this handoff first.
2. Verify all three refs (`main`, `agent/8.8.5-send-router`, `hotfix/8.8.5-p0-perplexity-fallback-ui`).
3. Continue on `hotfix/8.8.5-p0-perplexity-fallback-ui` or create a fresh child branch from its current head if isolation is needed.
4. Finish Tasks A-G in order without stopping for narrative updates unless a real blocker occurs.
5. Run the complete certification matrix.
6. Return one concise verdict:
   - `RELEASE READY` with exact commit and remaining real-device field risk, or
   - `NOT READY` with the exact failing gate and the smallest next fix.
7. Do not merge/publish until the user explicitly says to push live.

## Definition of done

The next build is done only when:

- ChatGPT round 1 and round 2 are both covered by distinct, safe dispatch behavior;
- Perplexity stages one exact prompt and can recover from safe PRE-SEND failures;
- Auto/Alpha/Beta/Gamma/Delta are visible in the REAL panel;
- Resume means resume/recover, not merely return to waiting;
- diagnostics identify route/fallback history;
- all critical unit/parity/browser tests pass;
- no duplicate-send safety regression exists.
