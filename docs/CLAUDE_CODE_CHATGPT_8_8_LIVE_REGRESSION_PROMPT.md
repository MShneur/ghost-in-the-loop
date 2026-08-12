# Claude Code Prompt — Ghost in the Loop 8.8 ChatGPT Live Regression

You are taking over an active Ghost in the Loop field-regression investigation.

Repository: `MShneur/ghost-in-the-loop`
Working branch: `hotfix/8.8-chatgpt-live-send`
Draft PR: `#36`
Stable base when the investigation began: `main@3fa1ad3ec6bef342260864f28693331b4f3cfd6f`

Your goal is not to defend the existing hotfix. Independently reproduce, critique, improve, or replace it with the smallest evidence-backed production repair.

## Start by reading durable state

Before changing code, read at minimum:

- `docs/CHATGPT_8_8_LIVE_REGRESSION_HANDOFF.md`
- `diagnostics/gitl-chatgpt-8.8-hotfix.user.js`
- `tests/chatgpt-live-hotfix.test.js`
- `ghost-in-the-loop.user.js`
- `package.json`
- `playwright.config.js`
- `.github/workflows/test.yml`
- `.gitl/orchestration/README.md`
- `.gitl/autopilot-state.json`
- `.gitl/orchestration/round-plan.json`
- `.gitl/orchestration/task-prompts.md`
- `.gitl/orchestration/evidence-contract.md`
- applicable `.gitl/user-directives/`, `.gitl/deferred-questions.md`, and relevant Round-6/7/8 evidence
- `docs/RELEASE-CANDIDATE-8.8.md`

Also inspect PR #36, its current diff, current CI, recent related commits/issues, and any newer branch movement before writing.

## Personal Forge

Ghost's orchestration documentation says the durable control plane is coordinated with a canonical Personal-Forge maker/coordination record. If your environment has Personal Forge access, locate and read the existing Ghost coordination record before changing project direction, then reconcile it with GitHub durable state.

Do **not** copy private Personal Forge content into this public repository, logs, third-party services, or chat. Summarize only non-sensitive decisions/evidence that must become durable GitHub state.

If Personal Forge is not accessible from Claude Code, explicitly record `Personal Forge unavailable in this environment` and continue from authoritative GitHub state. Do not invent its contents and do not block narrow reversible debugging solely because Forge is unavailable.

## Field failure to reproduce

User reports after updating to 8.8.0 on real ChatGPT:

1. Pressing Ghost controls such as Adaptive/committee-related controls does not appear to activate them and instead the page jumps/scrolls toward the beginning/top.
2. Starting a normal Proceed/Continue path inserts the continuation text into the ChatGPT composer but does not actually send it.

Treat those as field facts. The exact DOM/event cause is still open.

## Important evidence boundary

8.8 had extensive deterministic/hosted testing, but its own release evidence explicitly left exact current live ChatGPT structural insertion/binding `UNKNOWN / NOT CERTIFIED`. Do not cite fixture/CI success as proof that real ChatGPT works.

A previous connected authenticated browser carrier used by ChatGPT in this investigation returned HTTP 404, so no fresh authenticated live DOM capture was obtained there.

## Current hypothesis and temporary hotfix

The production ChatGPT adapter has reviewed Send selectors including `Send`, `Send prompt`, data-testid send/submit, and `form button[type=submit]`. When no unique reviewed button resolves, it may choose one reviewed synthetic Enter dispatch.

A plausible current-host drift is a real Send button such as `button[type=button][aria-label="Send message"]`: Ghost injects text, misses the real button, fires synthetic Enter, and ChatGPT no longer submits that synthetic event.

The temporary diagnostic userscript on this branch intercepts Ghost's untrusted Enter and, only when exactly one safe semantic Send resolves, substitutes exactly one button click. It also prevents default browser/host action on `#gitl button` clicks while allowing Ghost handlers to run.

Do not assume this hypothesis is correct. Try to falsify it.

## Non-negotiable Send safety

Preserve the current at-most-once/single-dispatch contract.

Do **not** casually restore a sequential actuator escalation chain such as:

`button click -> Enter -> beforeinput/insertParagraph -> requestSubmit`

That can create duplicate sends if an earlier mechanism succeeds slowly. Preferred architecture is:

`resolve exact authority -> choose one actuator before transaction -> fire once -> observe confirmation -> otherwise uncertainty/manual recovery`.

Fail closed on ambiguous Send identity. Never widen authority just to make a test pass.

## Tools and environments to use if actually available

Probe the environment first; do not claim tools you did not use.

Expected repository/local capabilities may include:

- normal shell, git, grep/ripgrep, diff, Node/npm;
- Node.js 20 parity with CI;
- Jest + jsdom;
- Playwright;
- Chromium and Firefox;
- repository npm scripts for build, generated parity, certification, lint, unit, E2E, BUILD-IDENTITY, packaging and candidate checks;
- GitHub CLI/API or connected GitHub access;
- GitHub Actions as an ordinary CI oracle and, when authorized by project rules, a guarded temporary execution carrier;
- existing tests under `tests/` and `tests/e2e/` covering send safety, structural behavior, mobile, lifecycle, long chat, repair/resume, accessibility and performance;
- diagnostics userscripts/canaries under `diagnostics/`;
- Tampermonkey/userscript installation for human field testing.

Potential live/external capabilities that may exist but must be verified:

- authenticated browser/devtools/Playwright against real `chatgpt.com`;
- Chrome DevTools Protocol or another browser automation carrier;
- BrowserStack credentials and real/hosted devices/browsers;
- web/network research;
- macOS/Safari, Android, iOS/iPad, Firefox/Gecko environments represented by historical BrowserStack/live-host branches.

Do not request or expose secrets. Use existing configured environment variables/secrets only. Do not send private Personal Forge material to external services.

## Preferred investigation sequence

1. **Sweep before patching.** Check repo/branch/PR/CI/current head and adjacent send/control code.
2. **Reproduce current branch behavior deterministically.** Run focused existing tests and the new hotfix regression test.
3. **Attempt authenticated live reproduction if a carrier exists.** Capture exact composer and Send DOM, attributes, containing form/composer structure, relevant event behavior, and what changes before/after a genuine user click. Do not capture unrelated private conversation content; use a disposable/new chat and minimal test text.
4. Determine separately why Ghost UI controls trigger a page jump. Inspect default button type, event default handling, focus restoration, rerender behavior, scroll anchoring, host form ancestry, and any anchor/hash interaction. Do not collapse this into the Send bug without evidence.
5. Falsify the current semantic-Send hypothesis. Check whether `aria-label="Send message"` is actually present and unique, whether the real Send is a button, whether it is disabled/aria-disabled, whether `.click()` is accepted, and whether ChatGPT requires a different trusted interaction path.
6. If live evidence supports a production change, patch the **primary adapter/actuator code**, not only the diagnostic shim. Keep the change minimal and reviewed-site-specific.
7. Add production-level regression fixtures matching the captured live DOM semantics. Include ambiguity/decoy/disabled controls and exact one-dispatch assertions.
8. Make Ghost-owned non-submit controls explicitly `type="button"` where appropriate and/or centralize default-action prevention if evidence supports the scroll fix. Preserve accessibility and keyboard activation.
9. Check adjacent supported ChatGPT layouts: desktop, narrow/mobile, new/old composer variants if available. Do not infer other platforms from ChatGPT.
10. Run the strongest available verification set: syntax, generated parity, unit, focused tests, base certification, Playwright Chromium/Firefox, send-safety/red-team, build identity, packaging/checksum, and applicable mobile/live lanes.
11. If authenticated live access exists, run a final canary proving the entire path: `Ghost control click -> Ghost state mutation -> injection -> exact real Send -> outbound message appears -> generation begins -> one automatic continuation -> no duplicate send`.
12. Write durable evidence to GitHub. Update the handoff/PR with exact commands, run/job IDs, tested SHA, observed limitations, rejected hypotheses, and remaining uncertainty.

## Testing discipline

A test must detect the reported failure, not merely prove our code executed.

Required assertions should cover, where applicable:

- exact Send-node identity;
- one actuator invocation per transaction;
- no hidden/secondary/decoy control chosen;
- ambiguous Send fails closed;
- composer text clears / outbound turn appears / generation evidence begins as appropriate;
- no duplicate turn after delayed confirmation;
- Ghost control click changes intended Ghost state;
- Ghost control click does not navigate, change hash, submit host forms, or jump scroll unexpectedly;
- handlers remain keyboard-accessible;
- route/lease/CHOICE/uncertainty safeguards remain intact.

Use mutation/adversarial tests where they improve confidence. Do not weaken an existing oracle or threshold to obtain green CI.

## Release-process recommendation to preserve

The project should add an explicit live-host release gate for any site claimed as currently supported. For ChatGPT, deterministic fixtures, Playwright, BrowserStack and CI are supporting evidence, not substitutes for a current authenticated canary.

If the canary cannot run, the release state must say live ChatGPT is unverified and must not claim live certification/publish-ready support for that host.

## Git / publication boundaries

- Work on an isolated branch/PR.
- Do not modify `main` directly.
- Do not merge.
- Do not enable auto-merge.
- Do not tag or publish.
- Do not create a GitHub Release.
- Do not change stable userscript update/download URLs.
- Do not expose secrets or private Personal Forge content.

## Expected deliverable

Do the work, do not merely recommend it when it is safely executable.

Return and commit a durable report containing:

- reproduced failure(s) and exact environment;
- root cause with evidence, or `UNKNOWN` if not proven;
- alternatives tested/rejected;
- exact code changes;
- tests added/changed;
- exact commands and CI/live results tied to SHA;
- adjacent risks;
- what remains uncertified;
- one recommended next action if a genuine blocker remains.

If you find that the current hotfix is wrong, replace it rather than defending it. If you cannot obtain live authenticated evidence, improve the deterministic reproduction and production patch only to the level the evidence supports, and label live behavior `UNKNOWN`.
