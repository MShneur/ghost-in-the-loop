# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 6 / Devil's Advocate / release auditor
- Executed role: compatibility/security researcher with adversarial release-audit lens
- Research fallback ID: `R6-RESEARCH-FALLBACK-CSP-TT-SHADOW-COMPAT-06`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T15:49:30Z
- Finished at: 2026-08-07T15:58:30Z
- Lease claim commit: `0aabbd794c968ae6803f0ecc99770d77c97b351e`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Exact pre-claim tip: **UNKNOWN** because the connected compare surface proved the branch was exactly one state-only commit ahead of recorded fallback-05 handoff `2d06360ef9557b0a5c8b8e7db28f9f2b03a66acd` but did not expose that intermediate tip SHA. This was recorded rather than inferred.
- The branch/head relation was checked twice with no further movement before claim.
- No open PR used `agent/8.8-repair-resume` as its head before claim.
- Canonical state was active, `publishReady: false`, and `lease: null` before claim.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains locally blocked on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains waiting on A1X submission.
- No dependency-ready implementation, repair, Red-Team, certification, documentation, packaging, or audit assignment existed.
- The fifth fallback explicitly nominated CSP / Trusted Types / ShadowRoot / userscript compatibility as one materially different next research mode.

## Step Performed
Performed one bounded non-conflicting compatibility/security research step answering:

**How should a future in-flow Shadow-host structural shell behave under Trusted-Types-enforcing CSP and across userscript versus MV3 extension execution worlds, without adding a new rendering sink or silently broadening page authority?**

This research does **not** authorize a current ChatGPT insertion slot, product mount, selector, Send-adjacent mutation, or change to the existing Trusted Types implementation. It converts current platform behavior into a falsifiable compatibility contract for later A2/A3 work.

## Repository Evidence

### Existing Ghost Trusted Types behavior
`ghost-in-the-loop.user.js` currently creates one named Trusted Types policy, `gitl-ui`, with `createHTML`, then routes existing HTML-string sinks through `_TT()`. If policy creation is rejected by a restrictive `trusted-types` allow-list, Ghost records `tt-policy-blocked`, leaves `_ttPolicy = null`, and `_TT()` returns the raw string. The source comment explicitly identifies a DOM-built fallback as follow-up rather than current behavior.

The current policy is deliberately page-scoped and does not replace the page default policy. This is an important safety property that should remain unchanged.

### Existing exact failure contract
`tests/e2e/trustedtypes.spec.js` already proves three facts on the real userscript:
1. the deterministic fixture really rejects raw `innerHTML` under `require-trusted-types-for 'script'`;
2. Ghost mounts when `gitl-ui` policy creation is available;
3. if `gitl-ui` policy creation is blocked, Ghost fails **LOUD** through its fatal banner/beacon rather than silently disappearing.

That third case is not a graceful structural fallback. A future shell must not misreport it as one.

### Extension execution model
`extension/manifest.json` is Manifest V3 and declares `extension/content.js` as a normal content script without a `world: "MAIN"` override. Therefore the structural-shell design should remain implementable from the extension content-script world and should not require a switch into page MAIN world merely to mount UI.

## Primary Platform Research

### Trusted Types support and enforcement
- MDN `require-trusted-types-for`: https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for — current browser support is now broad/Baseline 2026; when enforced for script sinks, raw strings at DOM XSS sinks are rejected.
- MDN `trusted-types`: https://developer.mozilla.org/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types — a CSP allow-list can restrict policy names, causing `trustedTypes.createPolicy()` to throw for a disallowed name.
- MDN `ShadowRoot.innerHTML`: https://developer.mozilla.org/docs/Web/API/ShadowRoot/innerHTML — this is an injection sink and, under Trusted Types enforcement without a usable default policy, plain-string assignment can throw.
- MDN `Element.attachShadow()`: https://developer.mozilla.org/docs/Web/API/Element/attachShadow — attaching an ordinary open ShadowRoot is broadly supported and is not itself an HTML-string injection sink.
- MDN `ShadowRoot.setHTML()`: https://developer.mozilla.org/docs/Web/API/ShadowRoot/setHTML — the safer sanitizing API exists but remains limited-availability, so it cannot be the only portable rendering path for Ghost 8.8.

Implication: **Shadow DOM isolation does not remove Trusted Types obligations.** A design that moves existing HTML-template rendering from `Element.innerHTML` to `ShadowRoot.innerHTML` simply moves the sink; it does not solve the policy-blocked case.

### Shadow styling
- MDN `ShadowRoot.adoptedStyleSheets`: https://developer.mozilla.org/docs/Web/API/ShadowRoot/adoptedStyleSheets — constructed stylesheets can be adopted by a ShadowRoot and have broad modern support.
- MDN `CSSStyleSheet()`: https://developer.mozilla.org/docs/Web/API/CSSStyleSheet/CSSStyleSheet — constructed stylesheets are a standards-based option for a DOM-built Shadow interior.

Implication: future structural-shell styling can be investigated without requiring HTML-string injection. Compatibility still needs deterministic browser/userscript testing; this wake does not claim every userscript manager/browser combination handles constructed stylesheets identically.

### Userscript and extension execution boundaries
- Chrome Extensions content-script documentation: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts — normal MV3 content scripts execute in an isolated world by default; MAIN-world execution is a distinct choice and page CSP applies differently there.
- Tampermonkey `GM_addElement`: https://www.tampermonkey.net/documentation.php#api:GM_addElement — documents privileged element insertion and ShadowRoot use for pages with strict CSP.
- Violentmonkey privileged APIs: https://violentmonkey.github.io/api/gm/ — documents `GM_addElement` as useful when site CSP prevents ordinary injection and allows adding style into a ShadowRoot.

Implication: the structural-shell core should use ordinary DOM APIs and direct reviewed Ghost handlers so it does not require `unsafeWindow` or MAIN-world execution. Privileged userscript style insertion may be a compatibility option, but the extension build cannot depend on a userscript-only API.

## Competing Expert Lenses

### Expert A — reuse `_TT()` and render Shadow content from HTML templates
Approach: create an in-flow host, attach ShadowRoot, render its interior through `shadowRoot.innerHTML = _TT(template)` and reuse the existing `gitl-ui` policy.

**Strength:** smallest code delta and consistent with existing Ghost UI templating.

**Failure mode:** `ShadowRoot.innerHTML` is itself a Trusted Types sink. If host CSP allow-lists policy names and blocks `gitl-ui`, the structural renderer inherits the exact blocked-policy weakness already demonstrated by `trustedtypes.spec.js`. It also makes structural mounting depend on page policy creation even though mounting itself does not intrinsically require HTML parsing.

### Expert B — DOM-built Shadow subtree with no new HTML sink
Approach: create the host and ShadowRoot with DOM APIs; construct buttons/labels/containers using `createElement`, `textContent`, `append`, attributes, and direct listeners bound to existing reviewed Ghost handlers. Style through a constructed stylesheet or a separately tested style-node/privileged style path.

**Strength:** adds no new `innerHTML`/`ShadowRoot.innerHTML` dependency and keeps structural mount mechanics separate from page TrustedHTML policy availability.

**Failure mode:** more verbose implementation and potential style-portability differences across extension/userscript environments; those require deterministic tests rather than assumptions.

### Resolution
For the first release-critical structural candidate, **prefer the sink-free DOM-built Shadow subtree**. Reusing `_TT()` for structural markup is rejected as the default because it couples a new safety-critical mount path to a policy that current tests already prove may be unavailable.

This decision does **not** rewrite the existing Ghost panel or current Trusted Types behavior. It only constrains future structural-shell implementation so it cannot worsen the known policy dependency.

### Security / reliability lens
- Do not create a permissive default Trusted Types policy for the structural shell.
- Do not broaden `gitl-ui` policy scope or add policy names simply to make a host pass.
- Do not switch the extension structural path into MAIN world for convenience.
- Do not make `unsafeWindow` a structural-mount requirement.
- Verification failure must remove only Ghost-owned structural nodes and return to the existing rail when baseline Ghost is otherwise healthy.

### Portability / maintenance lens
A plain DOM-built host has one implementation vocabulary across userscript and extension builds. Manager-specific privileged helpers should remain optional adapters, not the only rendering path. The extension's isolated-world model is a useful lower-authority default and should be preserved unless a later exact failure proves MAIN-world access is necessary.

### Mobile / constrained-hardware lens
This design does not change the previously recorded 1x/4x/6x Chromium stress, 320-CSS-pixel-equivalent, 200%-text, keyboard/reflow, or physical-device claim limits. A sink-free DOM build should be measured under those same gates after A2 exists; this wake makes no performance claim.

### Aggregate end-user lens
No new community/user study was performed for this compatibility-only fallback. User impact is inferred only at the reliability level: a mount that disappears or kills boot under CSP is worse than rail fallback. **Aggregate sentiment: UNKNOWN / non-dispositive.**

### Outside-frame candidate — no ShadowRoot for the first Blue prototype
Use one ordinary in-flow light-DOM host element and scoped class/attribute styles, eliminating ShadowRoot compatibility entirely for the first experiment.

This is retained as a dissent candidate because it is mechanically simpler and avoids Shadow-specific sinks, but it has higher style-collision risk on volatile host pages. It should be falsified against the plain open-Shadow host if A2 eventually becomes authorized; neither approach may be selected before A1X current-host evidence.

### Test / certification lead
The compatibility claim must become deterministic before product acceptance. A visual mount screenshot is insufficient.

## Predeclared Compatibility Test Addendum
When A2 is eventually authorized, add a deterministic structural-shell compatibility fixture that exercises the **same candidate implementation** under at least:

1. ordinary Chromium document with no Trusted Types enforcement;
2. `require-trusted-types-for 'script'` where `gitl-ui` is allowed;
3. Trusted Types enforcement with a policy allow-list that rejects `gitl-ui`;
4. a browser/runtime path where `ShadowRoot.setHTML()` is absent, proving the implementation has no hidden dependency on that limited API;
5. extension/content-script-equivalent isolated execution where practical, without MAIN-world-only helpers.

For the future structural candidate, each compatible case must preserve:
- the exact original Send JavaScript node identity;
- zero `submit`, `click`, `input`, or `keydown` actuation attributable to mount/verify/repair;
- exactly one Ghost structural host;
- normal-flow layout participation;
- scoped observer/repair ownership;
- clean unmount;
- no new Trusted Types console/page errors from the structural module;
- rail fallback when structural verification or rendering compatibility fails and baseline Ghost remains healthy.

**Important existing-limit clause:** current Ghost as a whole intentionally fails loud when `gitl-ui` policy creation is blocked and an existing `_TT()` HTML sink is reached. Therefore case 3 must not be misreported as a current whole-product PASS. Until a separately authorized DOM-built baseline-UI fallback exists, the structural test should prove only that the new structural module adds no additional Trusted Types dependency and that it fails closed when invoked in a baseline-healthy test harness. Any attempt to change existing blocked-policy boot behavior is separate work requiring supervisor scope and full regression evidence.

## Novel Finding / Decision
The previous Round-6 Shadow-host recommendation needs one compatibility refinement:

**`open ShadowRoot` is acceptable only with a rendering contract that adds no new Trusted Types HTML sink.**

Browser support for Trusted Types enforcement is now broad in 2026, so treating the issue as conceptually “Gemini-only” is too narrow at the platform level. However, site enforcement is controlled by each host's CSP; this wake has evidence of the existing Gemini incident path but does **not** claim that every supported host currently enforces Trusted Types.

The future structural-shell implementation should therefore:
- remain DOM-built rather than `shadowRoot.innerHTML`-templated;
- preserve the current named-policy boundary without adding a default policy;
- remain viable from extension isolated world;
- avoid requiring `unsafeWindow`/MAIN-world authority;
- test style delivery separately across extension/userscript contexts;
- preserve the rail as compatibility fallback when structural verification fails.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN** — unchanged interactive-permission gate; repeating it would be non-discriminating.
- Existing deterministic A1X structure probe: **NOT RE-RUN** — exact 2/2 evidence already exists and no structural candidate changed.
- Existing `tests/e2e/trustedtypes.spec.js`: **INSPECTED, NOT RE-RUN** — no product/test code changed in this research-only step.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** — no product or test code changed.
- Primary platform compatibility research: **EXECUTED**.

No CI run ID, job ID, artifact, or test PASS is claimed for this fallback.

## Changes
- `.gitl/autopilot-state.json` — research-fallback lease claim.
- `.gitl/evidence/round-6/research-fallback-06.md` — this durable research result.
- Product source: **NONE**.
- Generated extension source: **NONE**.
- Tests/workflows/dependencies: **NONE**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Acceptance Criteria
- Latest canonical maker read before Ghost work: PASS.
- Mandatory state/orchestration/plan/evidence/deferred queue read: PASS.
- No dependency-ready executable work existed: PASS.
- No conflicting lease/open isolated-head PR/consistent branch movement before claim: PASS.
- Lease claimed before durable research write: PASS.
- Research mode materially differs from prior adoption-drift, repair-lifecycle, mobile-reflow, CPU-throttling, and cross-adapter capability fallbacks: PASS.
- Repository Trusted Types behavior independently checked: PASS.
- Primary CSP/Trusted Types/ShadowRoot/extension-world evidence gathered: PASS.
- At least two materially different implementation philosophies compared: PASS.
- New testable compatibility constraints produced: PASS.
- Current authenticated ChatGPT insertion slot guessed or inferred: NO.
- A2 product implementation authorized: NO.
- Existing blocked-policy boot behavior silently reclassified as graceful fallback: NO.
- Safety boundary weakened: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback unchanged: PASS.
- Trusted Types policy scope unchanged: PASS.
- Extension execution world unchanged: PASS.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- Current authenticated ChatGPT structural capture remains unavailable, so the exact Blue insertion slot remains **UNKNOWN**.
- MDN/platform support does not prove any particular supported site's current CSP enforcement. Host enforcement remains adapter/site-specific evidence.
- `adoptedStyleSheets` is a promising portable style path, but this wake did not certify all browsers, extension contexts, Tampermonkey/Violentmonkey versions, or restrictive site CSP combinations.
- Userscript privileged APIs differ from extension APIs; future implementation must not make one manager-specific helper the sole path.
- The existing Ghost policy-blocked Trusted Types case still fails loud by design. Fixing that baseline behavior would be a separate scoped product task; this research did not authorize it.
- A plain light-DOM host may prove safer than Shadow DOM on a particular host; the first authorized candidate should retain that falsification option rather than treating Shadow isolation as dogma.
- This is the **sixth materially novel** post-A1X fallback. Diminishing returns are **not** satisfied because the canonical stop requires a complete six-wake round with no material novelty, while every recorded fallback in this sequence produced a new actionable finding/test/risk.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, immediately resume `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` unchanged and carry this compatibility contract into the eventual A2/A3 tests.

If the capture gate remains unchanged, begin a **new research-novelty round** rather than repeating these six modes. A useful materially different next step is deterministic structural-conformance test design that unifies hidden/secondary composer, exact Send identity, host-control insertion, rerender, CSP/TT, accessibility/focus, narrow-width, and scoped-resource invariants without implementing product code. Another acceptable mode is accessibility/event-retargeting research for Shadow controls. Do not repeat this CSP/Trusted-Types review without changed evidence.

## Assignment Status
- research-only
