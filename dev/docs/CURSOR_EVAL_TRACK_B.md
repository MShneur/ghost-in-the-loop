# Ghost in the Loop — Track B System Gap Audit

Audit date: 2026-08-01  
Audited product: `dev/ghost-in-the-loop.user.js`  
Audited baseline: `2c12317` (`origin/claude/skin-system-redesign-dh04go`)

## Executive result

The strongest safety code is concentrated around in-process Send selection.
The largest remaining risks sit immediately outside that boundary:

1. repository-root CI tests the stale root product, not the active `dev/`
   product;
2. the at-most-once journal is memory-only until `beforeunload`, so a hard
   crash can erase an attempted Send;
3. Manus classifies every `[data-event-id]` turn as an assistant candidate even
   though its own exporter proves those nodes include user turns;
4. completion accepts a control sigil anywhere in the tail, including quoted
   examples;
5. the generated extension cannot observe page-world network traffic, despite
   reporting its observer as active.

The 428-test unit baseline and 74-test two-engine browser baseline were green.
That does not close the findings above: many safety-critical tests assert source
strings rather than executing the state transitions they claim to protect.

Live authenticated DOMs were not available in this environment. Selector-drift
findings therefore use repository evidence, internal DOM assumptions, mock
fixtures, and the absence of per-platform behavior tests. They should be
confirmed with captured, redacted live DOM before changing platform selectors.

## Priority and rating

- **P0** — release or actuation boundary can be invalidated; address before
  relying on unattended operation.
- **P1** — credible wrong-transition, false-confirmation, or fail-silent path.
- **P2** — significant diagnosability, parity, or regression-detection gap.
- **P3** — maintenance/tooling issue with limited product-runtime impact.
- Likelihood is the chance of encountering the path, not certainty of harm.

## Prioritized gap register

| ID | Priority / severity | Likelihood | Blast radius | Concrete repro or code pointer | Existing coverage | Recommendation |
|---|---|---:|---|---|---|---|
| B-01 | **P0 / Critical** | Certain | Every development release and PR | Root `ghost-in-the-loop.user.js` is 8.0.0, root `package.json` is 7.0.0, and root `.github/workflows/test.yml` runs commands at repository root. The active product is now 8.6.2 under `dev/`; `dev/.github/workflows/test.yml` is not a GitHub Actions entry point. | `dev/tests/source-of-truth.test.js` only proves there is no `dev/dev` tree. It does not inspect repository root or the active workflow. | Establish one source root. Immediate option: make root CI run with `working-directory: dev` and compare root promotion artifacts explicitly. Long term: remove the shadow tree or generate promotions deterministically. |
| B-02 | **P0 / Critical** | Medium | Any run interrupted after actuation; duplicate prompt/token/action risk | `_beginSendAttempt()` (`ghost-in-the-loop.user.js:2410`) assigns `L.sendTxn` only in memory. `crashState` is first written in `beforeunload` (`:3183`), which is not guaranteed on process kill, browser crash, power loss, or mobile eviction. A fresh boot can therefore forget an already-fired dispatch. | `sendtransaction.test.js` checks source ordering. Recovery tests cover a synthetic saved `crashState`, not loss before `beforeunload`. | Persist a redacted journal synchronously at transaction begin and on each state transition; clear only after commit/reconciliation. Store IDs, counts, lengths, timestamps, and hashes—never prompt/response text. Test a second runtime boot without firing `beforeunload`. |
| B-03 | **P0 / Critical** | High on Manus | Manus completion and Send confirmation | Manus declares `assistant: ['[data-event-id]', ...]` (`:624`). Its own `harvestManus()` says `[data-event-id]` means top-level **turns** and classifies `items-end` as user. A newly mounted user turn can raise assistant count, confirm Send in `_sendEvidence()`, and later expose protocol text as the “last answer.” | No Manus adapter behavior test. Export tests do not connect role classification to completion. | Reuse one role-aware Manus turn classifier for export and completion. Add a fixture with user and assistant event nodes; prove user text and user-mounted count changes cannot confirm or complete a round. |
| B-04 | **P0 / High** | Certain in packaged extension | All extension network evidence; completion and Send confirmation lose an advertised witness | `UW` falls back to the content-script `window` when `unsafeWindow` is absent (`:319`). The source comment requires `world:"MAIN"`, but `extension/manifest.json` declares no main-world script or bridge. The generated extension therefore patches its isolated world, not site fetch/XHR/WebSocket. | Net tests inject the userscript directly into a page. No test loads the packaged extension or proves a real page request reaches `GITL_NET`. | Add a minimal main-world observer plus metadata-only bridge, or disable extension network capability honestly. Test a packaged temporary extension against fetch, XHR, and WS fixtures in both engines. |
| B-05 | **P1 / High** | Medium | All platforms; false PROCEED can auto-send, false HALT can stop work | `detectSignal()` uses `tail.includes(SIGIL_*)` (`:2224`). Focused repro: a long response ending “The protocol example is `[[GITL::PROCEED]]`, but do not continue” returns `{signal:"proceed", confidence:4}`. `_terminalReplyReady()` does not require the marker at the answer tail. | Signal tests assert embedded markers fire; there are no quoted, fenced-code, negated, or non-terminal marker cases. | Require the control marker as a standalone terminal line after stripping fenced code/quotes, or bind readiness to `_answerTerminalAtTail()`. Add adversarial signal cases. |
| B-06 | **P1 / High** | Medium | All reviewed adapters; false send commit | `_sendEvidence()` (`:2437`) confirms when raw assistant-selector count increases or selected text grows by five characters. Broad/nested selectors can change from hydration, citation expansion, virtualization, or a user turn (B-03) without proving dispatch. | Transaction tests are source-contract checks. No behavior test mutates unrelated assistant-matching DOM after a click. | Track one role-validated answer identity/fingerprint from before dispatch. Require a new assistant turn or correlated composer-clear evidence; add unrelated-DOM and virtualization regressions. |
| B-07 | **P1 / High** | High under selector drift | All platforms; prompt can be injected into a hidden/decoy/wrong editor | `_q()` returns the first connected non-Ghost match without requiring visibility, editability, uniqueness, or composer geometry. `Adapter.peekInput()` gives that configured match precedence over taught/memory locators. `COMPOSER-001` nevertheless describes the result as unique. | Heuristic input scoring is tested; configured input ambiguity and hidden/decoy editors are not. | Introduce a composer resolver that returns candidate count and evidence. Before actuation require one visible editable composer and exact staged text. Define an explicit taught override path for a wrong configured match. |
| B-08 | **P1 / High** | Medium | Enter/taught/button paths on reactive editors | `engineSend()` trusts `Adapter.injectText()` returning `true`; contenteditable injection returns true even when framework state did not accept the text. After 500 ms it can open the transaction without checking the exact intended prompt remains staged. | No behavior test drives a controlled editor that rejects synthetic input. | Add a normalized exact-text staging gate before strategy selection. On mismatch capture COMPOSER error and pause before the journal opens. |
| B-09 | **P1 / High** | Medium when SEND-002 occurs | Uncertain-send recovery; stale-answer transition or accidental re-entry | `reconcileUncertainSend(true)` (`:2590`) increments the round but does not restore `replyBaseline`, reset reply stability, or update `lastDispatchConfirmedAt`. `false` marks the transaction failed, after which ▶ can resume engine parsing while the unsent prompt remains in the composer. Crash-recovered transactions also lack the original baseline. | No behavior test invokes either reconciliation branch; only function presence/source is checked. | Model two explicit states: human-confirmed-delivered (restore original baseline) and manual-send-required (engine cannot resume until a second acknowledgement observes delivery). Persist enough redacted baseline metadata for crash recovery. |
| B-10 | **P1 / High** | Medium on generic/custom sites | All 13 generic hosts plus custom sites using Teach Send | A taught Send bypasses `PLAT.reviewed`, but generic answer selectors include broad classes such as `message`, `response`, and `prose`. Teaching an actuator does not review the assistant reader, so user/page text can drive an authorized Send. | Teach tests prove capture and veto only on a tiny mock. No generic-host end-to-end completion test. | Treat teaching as capability-specific: require a role-validated reader (and taught composer) before unattended looping, or keep taught Send manual-only on unreviewed readers. Surface this distinction in diagnostics. |
| B-11 | **P1 / High** | Low–Medium | Same-host navigation during/after Send | The route exemption now correctly uses `sendPending`/`lastDispatchConfirmedAt` (`:3044`), but it still ignores **any** same-host route within 15 seconds. A user navigating to settings or another conversation in that window is treated like conversation-ID assignment. | Route e2e covers one hash assignment and one old-send case, not a different conversation during pending/recent Send. | Compare platform route classes/conversation identity. During unresolved Send, unexpected route changes should mark uncertain and pause. Add same-host other-conversation cases. |
| B-12 | **P1 / High** | Medium | Long-running sessions; runaway guard | Corrected here: Continue now requires one exact visible enabled host control, excludes Ghost UI, and checks tab safety. The observer now updates `lastActivity` only after a click. Residual: Continue uses synchronous `claimTabLock`, not the pre-actuation yield/re-read lease used by Send. | New `continuesafety.test.js` behavior tests own UI, ambiguity, valid actuation, and unrelated DOM churn. Existing browser test did not actually expose/set RUNNING and asserted only that GM storage existed. | Route all token-consuming actuators through a common reviewed-actuation gate with lease verification. Repair the browser test so it asserts a real click and negative cases. |
| B-13 | **P1 / High** | Medium | Models/sites that omit protocol markers | After five idle ticks (about 12.5 s by default), a complete sigil-free response triggers an automatic Continue; this happens twice even if the response is a clarifying question, refusal, or request for user input (`engineTick():2839+`). | `selmem.test.js` checks only that the source contains a two-nudge bound. | Make soft-proceed opt-in or add conservative clarification/refusal/question detection. Add behavior tests proving questions pause rather than auto-answering “Continue.” |
| B-14 | **P1 / High** | High over time | Eight reviewed profiles and 13 generic hosts | Reviewed profiles contain broad fallbacks (`textarea`, `div[contenteditable]`, `button[type=submit]`, class-contains selectors). No profile has a maintained DOM fixture proving input/send/stop/assistant roles. | Trap-focused Send e2e exists, but not one adapter contract test per platform. Copilot and Manus have zero named test references; most others are mentioned without exercising selectors. | Maintain redacted DOM snapshots/canaries per reviewed platform. Test candidate counts, visibility, role, and a completed-turn timeline. Run a read-only scheduled live canary that never clicks. |
| B-15 | **P1 / High** | Medium | Generation detection and composer+network send confirmation | Trusted endpoint pulses count unconditionally for 1.5 s. Endpoint fragments include broad paths such as `/api/organizations` and `/api/chat`, not scoped by current platform or post-send window. Any matching background request can report generation; paired with composer clear it can help confirm Send. | Unit tests explicitly lock “trusted pulse counts unconditionally.” No concurrent background-request timeline test. | Scope trusted transports per adapter and transaction ID/time window. Distinguish start/chunk/done. Keep unrelated auth/list traffic out of completion evidence. |
| B-16 | **P1 / High** | Low–Medium | Multi-tab unattended safety, especially extension | Corrected here: generated extension caches now observe peer `storage.local` changes. Residual: the storage lock remains a non-atomic last-writer-wins protocol, and no test runs two extension contexts through a simultaneous empty-lock race. | Userscript lock tests share one synchronous mock store. New `extensionstorage.test.js` proves peer cache updates, not full lease arbitration. | Add a two-context packaged-extension race test. If storage-event latency violates the 35–79 ms verification window, use an extension background authority or longer bounded arbitration. |
| B-17 | **P2 / Medium** | High during incidents | Diagnostics can misstate actual authority | `DIAG.runProbe()` (`:1755`) reports the first raw selector match without own-UI/visibility/veto/uniqueness checks and omits taught selectors. `platformHealth()` (`:1783`) reports Send false for a valid reviewed Enter fallback and reports Stop from a mounted, possibly hidden node. | Diagnostics tests focus on privacy/redaction, not truthfulness against adapter resolution. | Build probe output from the same resolvers used at runtime: candidate count, visible count, veto result, taught/profile source, selected dispatch strategy, and effective Stop state. |
| B-18 | **P2 / Medium** | High once failures occur | Completion, workflow, route, Teach, and sentinel failures | Stable codes cover boot/composer/send/adapter/export, but watchdog timeout (`:2725`), short response (`:2746`), roadmap format (`:2804`), no-sigil exhaustion (`:2859`), route pause, Teach rejection, and sentinel breaker (`:5879`) do not capture dedicated reports. Most pause reasons are also dropped by timeline string sanitization. | Error-catalog tests assert only existing codes. No matrix maps pause sites to loud diagnostics. | Add completion/route/panel/teach codes and a source/behavior matrix requiring every non-user-requested error pause to capture once before pausing. Keep metadata bounded. |
| B-19 | **P2 / High** | High for the reported field class | Mobile-web behavior | Firefox uses a 412×915 viewport and Android UA, but no touch context, mobile project, mobile Chromium, soft-keyboard/VisualViewport sequence, or mobile composer/send fixture exists. The exact ChatGPT/Perplexity failure remains unreproduced. | Both engines pass 74 tests; that validates engines, not mobile interaction. | Add explicit mobile projects and fixtures with buttonless composer state, touch input, visual viewport changes, and exact staged-text/Enter behavior. Keep real-device certification separate. |
| B-20 | **P2 / High** | Certain | Regression confidence across send/completion/recovery | `engineSend`, `_sendEvidence`, `_confirmSend`, `engineTick`, and reconciliation are primarily checked by substring/order assertions. No unit test executes a full dispatch→evidence→commit/uncertain state transition. | Browser tests cover boot, UI, Teach, traps, and export; none starts a real loop through confirmation. | Add a deterministic state-machine harness with fake time and controlled adapter/network witnesses. Keep source-contract tests only for properties that cannot be behavior-tested. |
| B-21 | **P2 / Medium** | Medium | Network diagnostics | `GITL_NET.install()` sets `active=true` before patch attempts (`:412`). Individual fetch/XHR/WS patch failures only log to console; `lastNetInstallError` is written only by the outer catch. Health can therefore say observer active when no transport was patched. | Net boot tests prove the panel survives hardened properties, not capability truth. | Track installed transports individually and compute active from successes. Surface a redacted BOOT-002 when all transports fail. |
| B-22 | **P2 / Medium** | Medium | Visibility and selector safety | Corrected here: `_visible()` now rejects `hidden`, `aria-hidden`, CSS-hidden/collapsed, and opacity-zero controls; reviewed selectors are globally deduplicated and require exactly one candidate; taught selectors fail closed after cardinality drift. | New behavior tests cover distinct reviewed controls, duplicate taught controls, and hidden taught controls. | Extend the same candidate object/cardinality contract to composers, Stop, assistant readers, and Continue lease verification. |
| B-23 | **P2 / Medium** | Medium | Attended safety | Corrected here: the real pre-send gate now blocks a hidden document even when `hasFocus()` reports true. Previously only the unused/helper safety check considered `document.hidden`. | New behavior case in `unattended.test.js`. | Consolidate `isTabSafeToAct()` and `assertInteractionSafe()` so future policy changes cannot drift. |
| B-24 | **P2 / Medium** | Certain before correction | Development version/release metadata | Corrected here: active package and lock metadata were 8.5.2 while runtime/manifest were 8.6.1. Version tests did not inspect package metadata. Root-tree drift remains B-01. | `version.test.js` now compares userscript header, runtime constant, manifest, package, lock root, and lock package root. | Keep this gate and add a repository-root promotion parity check once source layout is settled. |
| B-25 | **P3 / Medium** | Certain in tooling | CI/test runner only; no userscript runtime dependency | `npm audit` reports two high-severity transitive dev vulnerabilities: `brace-expansion` DoS and `js-yaml` merge-key DoS. | No audit job or dependency policy in CI. | Upgrade the test toolchain in a separate change, then rerun all tests. Do not treat this as a product-runtime vulnerability because dependencies are development-only. |

## Platform selector drift matrix

| Profile | Main drift/false-positive surface | Behavior coverage |
|---|---|---|
| ChatGPT | Broad `textarea`, class-contains Send fallback, terminal Continue control; buttonless Enter path depends on synthetic key behavior | Generic trap tests, Teach mock, and Enter source contract; no current ChatGPT DOM fixture |
| Perplexity | `div[class*="prose"]` / `break-words` answer selectors and broad submit button; persistent socket classification | Heartbeat filter and source-order tests; no selector/timeline fixture |
| Gemini | Generic contenteditable/textarea input and broad `model-response` containers | Trusted Types boot only; no adapter behavior |
| DeepSeek | Class-contains Send/Stop/markdown selectors | Historical Copy-trap veto; no current adapter fixture |
| Copilot | Old custom-element assistant selector and open-shadow traversal assumption | No named adapter behavior test |
| Grok | Broad message/bot/response answer classes and submit fallbacks | Historical popup trap and synthetic route test; no answer fixture |
| Claude | Presence selector `div[data-is-streaming]` can match `data-is-streaming="false"`; broad ProseMirror input | Export parser references only; no adapter behavior |
| Manus | `[data-event-id]` includes user and assistant turns (B-03) | No adapter behavior |
| Generic roster | One unreviewed profile for 13 hosts; broad message/response/prose classes become actuation-relevant after Teach Send | No per-host fixtures |

The 27 userscript `@match` entries and 27 extension manifest matches are currently
identical.

## Safety-contract status

| Contract | Status |
|---|---|
| Unique reviewed Send authority | Improved: global distinct-candidate and visibility checks now fail closed. Composer and reader ambiguity remain. |
| At-most-once in one live runtime | Strategy is selected before journal begin and only one dispatch function is called. |
| At-most-once across crash/reload | **Not proven**; journal persistence gap B-02. |
| Trusted Types | Strong browser coverage in Chromium and Firefox; generated extension remains in parity. |
| Own-UI isolation | Send/Teach/query paths covered; Continue was corrected in this track. |
| Single-tab authority | Userscript algorithm unit-covered; extension cache corrected, atomic race still untested. |
| Pause loud | Strong for boot/composer/send/export; incomplete for completion/workflow/route/panel failures. |
| Engine/parity | `dev/` source and generated extension match; repository-root CI/source split remains P0. |

## Cheap, safe corrections included

1. Bumped active development version to 8.6.2 and added package/lock version
   parity checks.
2. Made reviewed Send selection globally unique across selector aliases.
3. Made taught selectors fail closed when a once-unique selector drifts to
   multiple live controls.
4. Hardened visibility checks for hidden and fully transparent controls.
5. Based route exemption on pending/recently confirmed Send, not generic
   activity.
6. Aligned the real focus gate with hidden-document policy.
7. Hardened Continue control resolution and stopped unrelated mutations from
   refreshing watchdog activity.
8. Synchronized generated extension storage caches from peer-tab changes.

All runtime corrections are fail-closed. No platform selector was changed
without live DOM evidence.

## Verification performed

- Baseline: 36 Jest suites / 428 tests passed.
- Baseline browser matrix after installing both local engines: 74/74 passed
  (Chromium + Firefox).
- Final: 38 Jest suites / 439 tests passed; focused corrected behavior suite
  passed.
- Final browser matrix: 74/74 passed (Chromium + Firefox).
- Userscript and generated extension syntax: passed.
- Generated extension parity: current.
- Dependency audit: two high-severity development-only transitive findings
  recorded as B-25.

