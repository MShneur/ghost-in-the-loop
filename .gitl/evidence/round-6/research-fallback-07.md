# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: Worker 2 / Researcher / architect
- Executed role: accessibility/event-boundary researcher with architect and reliability dissent
- Research fallback ID: `R6-RESEARCH-FALLBACK-SHADOW-A11Y-EVENTS-07`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T16:18:30Z
- Finished at: 2026-08-07T16:28:30Z
- Lease claim commit: `94f886c612664d7b29bd0ccda3aad86b0bd2df5d`
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Exact pre-claim tip: **UNKNOWN** because the connected compare surface proved the branch was exactly one state-only commit ahead of last evidence handoff `2d8384a2c3c7cbe955004daf173decf2079dcfae` but did not expose that intermediate tip SHA. This was recorded rather than inferred.
- No open PR used `agent/8.8-repair-resume` as its head immediately before claim.
- No pull-request workflow run existed on last evidence head `2d8384a2c3c7cbe955004daf173decf2079dcfae`; the only subsequent pre-claim branch difference was `.gitl/autopilot-state.json`.
- Canonical state was active, `publishReady: false`, and `lease: null` before claim.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains locally blocked on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains waiting on A1X submission.
- No dependency-ready implementation, repair, Red-Team, certification, documentation, packaging, or audit assignment existed.
- The previous fallback explicitly nominated Shadow-control accessibility/event-retargeting analysis as one materially different next research mode.

## Step Performed
Performed one bounded non-conflicting accessibility/event-boundary research step answering:

**If a future Blue/Red structural shell uses an open ShadowRoot inside a verified host composer/footer structure, what event, focus, form, and accessibility semantics must be proven so Shadow encapsulation does not create hidden Send or keyboard-accessibility regressions?**

This research does **not** authorize a current ChatGPT insertion slot, product mount, selector, Send-adjacent mutation, or change to the existing rail. It adds a falsifiable interaction/accessibility contract for later A2/A3 work.

## Repository Evidence

### Existing structural probe is intentionally passive
`tests/e2e/mobile-shell-structure-probe.spec.js` already resolves from the visible editor outward, scopes Send to the active composer, preserves exact Send identity, includes a hidden duplicate composer, and asserts zero click/submit/input/keydown events. It does not insert Ghost UI or exercise a Shadow control.

That fixture is a strong **mount-discovery/passive-actuation oracle**, but it does not yet test what happens when a real user intentionally activates a Ghost control inside a ShadowRoot located near host form controls.

### Mobile-shell brief requires one shared action authority
`.gitl/briefs/mobile-shell-concepts.md` requires Blue and Red to be real in-flow host children/siblings, preserve original host controls, use one Ghost state/action authority, and fail closed to the existing rail when structural verification fails. Therefore Shadow encapsulation cannot be treated as a license to create a second interaction model or assume host delegated events cannot see Ghost activation.

## Primary Platform Research

### Shadow DOM is not an event firewall
- MDN `Event.composed`: https://developer.mozilla.org/en-US/docs/Web/API/Event/composed
- MDN `Event.composedPath()`: https://developer.mozilla.org/en-US/docs/Web/API/Event/composedPath

MDN states that user-agent-dispatched UI events such as click/touch/mouse events are composed and can cross a Shadow DOM boundary. `composedPath()` exposes the propagation path for an open ShadowRoot.

**Implication:** an open ShadowRoot isolates DOM/style implementation details, but it does **not** guarantee that a user click on a Ghost control is invisible to host/document delegated event handlers. Later structural certification must instrument the host composer/document boundary and prove that intentional Ghost activation produces no host Send, submit, input, keydown, or native-control side effect. Shadow isolation alone is not evidence of event isolation.

### Focus delegation is optional and can choose an unintended focus target
- MDN `ShadowRoot.delegatesFocus`: https://developer.mozilla.org/en-US/docs/Web/API/ShadowRoot/delegatesFocus

When `delegatesFocus` is true, clicking a non-focusable area or focusing the host can move focus to the first focusable element inside the ShadowRoot, and MDN explicitly notes that the first focusable element may be the wrong one.

**Implication:** the first structural candidate should keep the default `delegatesFocus: false`, use no `autofocus`, and give tab order only to intentional Ghost controls. Mount, verify, repair, and rerender recovery must not steal focus from the editor or another host control. Any later use of delegated focus requires a separate demonstrated accessibility benefit.

### Buttons near a form must be explicitly non-submit controls
- MDN `<button>`: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button

MDN recommends setting `type="button"` for buttons that are not form submitters; an omitted type can behave as a submit button when associated with a form.

**Implication:** every future Ghost Blue/Red interactive `<button>` must set `type="button"` explicitly. Structural mounting near or inside a host composer form must never rely on Shadow/form-association subtleties to prevent submission.

### ARIA element references have tree-scope limits
- MDN reflected attributes / element-reference scope: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Reflected_attributes
- MDN `aria-controls`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-controls
- MDN `aria-expanded`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded
- MDN `aria-label`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label

MDN documents that attribute ID references are scoped to the same DOM/shadow DOM, while reflected ARIA element-reference properties can target the same scope or a parent scope but not child/peer shadow scopes.

**Implication:** if Blue and Red become separate Shadow-host portals, the Blue button must not assume that an `aria-controls="red-id"` string can establish a valid relationship across peer ShadowRoots. The first candidate should use self-contained accessible names (`aria-label` or visible local text) and `aria-expanded` on the actual toggling control. A cross-portal control relationship must be proven in the exact DOM/accessibility tree, or semantics should be placed on same-tree light-DOM hosts / a same-root component. No cross-root ARIA relationship is certified by string IDs alone.

## Competing Expert Lenses

### Expert A — Shadow isolation is sufficient interaction isolation
Approach: place buttons inside an open ShadowRoot and assume style/DOM encapsulation prevents host event coupling.

**Strength:** simple mental model and small implementation surface.

**Failure mode:** false. User-agent click/touch events are composed and may reach host/document listeners. A host app using delegated composer events can still observe the activation path. This approach is rejected as a certification assumption.

### Expert B — explicit event/focus boundary contract
Approach: keep the open ShadowRoot for style isolation but treat event, focus, form, and ARIA behavior as independently testable boundaries. Use direct Ghost handlers, explicit `type="button"`, no delegated focus/autofocus, local accessible names, and instrument host ancestor listeners during certification.

**Strength:** turns hidden interaction risk into measurable invariants without expanding Send authority.

**Failure mode:** more test surface and possible platform-specific host delegation behavior; the candidate must be rejected on hosts where Ghost activation cannot be isolated from host side effects.

### Resolution
Favor **Expert B**. Shadow DOM remains a style/DOM isolation tool, not an authority or event-safety boundary.

### Reliability / security lens
- Mount/verify/repair must generate **zero** click, submit, input, keydown, focus, or form-submit actuation.
- Intentional user activation is a separate ledger: exactly one reviewed Ghost action may occur, while host Send/submit/native controls remain untouched.
- Do not synthesize click/keyboard events to prove reachability.
- Do not rely on `event.originalTarget`; MDN marks it non-standard.
- Do not add a generic document listener that changes host behavior merely to suppress propagation.

### Accessibility lens
- Mount and repair may not move focus.
- The editor's existing focus must survive structural insertion and rerender repair.
- Tab order must include Ghost controls only where the adapter-approved structural order makes sense; no positive `tabindex`.
- Controls need stable accessible names independent of volatile host text.
- Expanded/collapsed state must be represented on the actual control.
- Blue-to-Red relationships across separate roots remain **UNKNOWN until exact accessibility-tree verification**.
- Existing 320-CSS-pixel-equivalent and 200%-text gates remain in force.

### Mobile / constrained-hardware lens
No new performance claim is made. Focus/event instrumentation should be deterministic and low-overhead in tests; production code must not add document-wide listeners solely to police Shadow events.

### Aggregate end-user lens
No new community/user study was performed for this standards-level interaction boundary. User impact is inferred only from keyboard/screen-reader/form-safety consequences. Aggregate sentiment: **UNKNOWN / non-dispositive**.

### Outside-frame candidate — first Blue prototype in light DOM
Use a tightly scoped light-DOM Ghost host/control for the first structural experiment, avoiding Shadow event/ARIA cross-root complexity, then compare style-collision risk against the open-Shadow candidate.

This remains a dissent candidate. It may simplify semantics but increases host-style collision risk and does not remove the need for explicit `type="button"`, focus, zero-Send, and delegated-event tests. No architecture switch is authorized before A1X current-host evidence.

## Predeclared Interaction / Accessibility Test Addendum
When A2 is eventually authorized, extend the deterministic structural-conformance fixture so the **same candidate implementation** proves at least:

### Passive mount / repair ledger
1. Active editor is focused before mount; mount preserves that exact focus target.
2. Mount, verify, ResizeObserver/MutationObserver repair, and composer replacement produce zero click, submit, input, keydown, or form-submit events.
3. No `autofocus`; ShadowRoot `delegatesFocus` is false for the first candidate.
4. Original Send JavaScript node identity remains unchanged and connected.
5. Exactly one Ghost host remains after repeated rerender/repair.

### Intentional Ghost activation ledger
6. Every Ghost button has `type="button"`.
7. Pointer activation of a Ghost control invokes exactly one reviewed Ghost handler and zero host Send/submit/native-control actions.
8. Keyboard Space/Enter activation invokes the same Ghost action without host Send/submit side effects.
9. Host composer/document delegated listeners are instrumented so any observable event path is recorded; certification is based on **side-effect isolation**, not the false claim that the event cannot cross the Shadow boundary.
10. No synthetic host click, `requestSubmit`, or submitter is generated by Ghost.

### Focus and accessibility semantics
11. Tab order reaches Ghost controls in DOM/visual order without positive `tabindex` and without skipping/trapping the host editor/Send path.
12. Opening/closing any Ghost expansion has an explicit, tested focus policy; collapse does not strand focus in hidden content.
13. Each interactive Ghost control has a stable accessible name from local visible text or `aria-label`.
14. `aria-expanded` reflects the actual expanded state on the toggling control.
15. Any `aria-controls`/element-reference relation across Blue and Red portals must be verified in the exact DOM/accessibility tree; peer-ShadowRoot string-ID references are not accepted by assumption.
16. 320-CSS-pixel-equivalent reflow and 200% text scaling retain the same focus/accessible-name/zero-Send guarantees.

A deterministic failure of any item keeps the structural candidate experimental and must not be solved by weakening Send, CHOICE, route, lease, uncertainty, focus, form, or accessibility assertions.

## Novel Finding / Decision
The earlier recommendation for an open ShadowRoot needs a second refinement beyond Trusted Types:

**Shadow DOM is not an event-safety boundary and separate Shadow portals are not automatically one accessible control relationship.**

For the first release-critical structural candidate:
- keep `delegatesFocus: false`;
- never autofocus on mount/repair;
- explicitly set every Ghost button to `type="button"`;
- bind directly to existing reviewed Ghost handlers;
- distinguish passive zero-actuation from intentional Ghost activation in the test ledger;
- verify host delegated-listener side effects rather than assuming click events are contained;
- use local accessible names and tested `aria-expanded` state;
- do not claim Blue-to-Red `aria-controls` semantics across peer ShadowRoots without exact accessibility-tree evidence.

This materially narrows A2/A3 without changing current product behavior.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN** — unchanged interactive-permission gate; repeating it would be non-discriminating.
- Existing deterministic A1X structure probe: **INSPECTED, NOT RE-RUN** — exact 2/2 evidence already exists and no product/test code changed.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** — no product or test code changed.
- Primary event/focus/form/accessibility standards research: **EXECUTED**.

No CI run ID, job ID, artifact, or test PASS is claimed for this fallback.

## Changes
- `.gitl/autopilot-state.json` — research-fallback lease claim.
- `.gitl/evidence/round-6/research-fallback-07.md` — this durable research result.
- Product source: **NONE**.
- Generated extension source: **NONE**.
- Tests/workflows/dependencies: **NONE**.
- `main`, merge, auto-merge, tag, publish, release: **NONE**.

## Acceptance Criteria
- Latest canonical maker read before Ghost work: PASS.
- Mandatory state/orchestration/plan/evidence/deferred queue read: PASS.
- Assignment-linked mobile-shell brief, Worker-2 evidence, A1X probe, and latest fallback evidence read: PASS.
- No dependency-ready executable work existed: PASS.
- No conflicting lease/open isolated-head PR/consistent branch movement before claim: PASS.
- Lease claimed before durable research write: PASS.
- Research mode materially differs from the six completed first-round post-A1X fallbacks: PASS.
- Primary Shadow event/focus/ARIA/form evidence gathered: PASS.
- At least two materially different interaction philosophies compared: PASS.
- New falsifiable interaction/accessibility constraints produced: PASS.
- Current authenticated ChatGPT insertion slot guessed or inferred: NO.
- A2 product implementation authorized: NO.
- Send/CHOICE/route/lease/uncertainty weakened: NO.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback unchanged: PASS.
- Host form/focus behavior changed: NO.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- Current authenticated ChatGPT structural capture remains unavailable, so the exact Blue insertion slot remains **UNKNOWN**.
- Standards evidence proves event/focus/ARIA rules, not ChatGPT's current delegated event implementation or accessibility tree.
- A document-level listener observing a composed Ghost click is not itself a failure; the release-critical failure is an unintended host side effect. Exact host behavior must be tested after A1X unlocks a real insertion candidate.
- Cross-root ARIA behavior must be verified in target browsers/assistive technologies; this wake does not certify VoiceOver, TalkBack, NVDA, JAWS, or browser-specific accessibility mappings.
- Explicit `type="button"` is required as a defensive invariant even if a particular ShadowRoot structure currently prevents form association.
- Light-DOM versus open-Shadow remains a live implementation comparison; neither is authorized before current-host structural evidence.
- This is the **first materially novel wake of the new research-novelty round** after six novel fallbacks. Diminishing returns are not satisfied.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, immediately resume `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` and carry this event/focus/accessibility contract into A2/A3.

If the capture gate remains unchanged, continue the new novelty round with one materially different bounded fallback. The strongest next candidate is a deterministic **structural-conformance test architecture** that unifies the existing hidden-composer, exact-Send, rerender, observer/resource, CSP/Trusted-Types, keyboard/reflow, CPU-throttle, and this event/focus/accessibility contract into a single test matrix without implementing product behavior. Do not repeat Shadow event/focus research without changed evidence.

## Assignment Status
- research-only
