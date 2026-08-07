# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: scheduled successor / researcher-architect with reliability and mobile dissent
- Executed role: bounded research fallback
- Research fallback ID: `R6-RESEARCH-FALLBACK-SCOPED-REPAIR-02`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T14:09:27Z
- Finished at: 2026-08-07T14:16:10Z
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `a616bff210920f9b941e8ff82c56d155764a2aa9`.
- Starting state: active Round 6, `publishReady: false`, lease null.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains blocked locally on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains dependency-waiting.
- No dependency-ready implementation, test, certification, documentation, packaging, or audit assignment existed.
- No workflow run was associated with the starting branch head.
- Previous fallback `R6-RESEARCH-FALLBACK-ADOPTION-DRIFT-01` explicitly required the next unchanged-gate wake to use a materially different evidence mode rather than repeat adoption research, the browser-permission call, or the deterministic structure probe.
- Lease claim commit: `0b4ac4dfb5ed615c7e5f0c694e4f9144e1c183ef`.

## Research Question
Can the eventual Blue structural shell use a simpler, lower-lifecycle-risk host primitive than an autonomous custom element while preserving style isolation, normal host flow, exact Send identity, scoped repair, and the existing single Ghost state/action authority?

This research may narrow A2's implementation contract, but it cannot authorize an insertion slot while current authenticated ChatGPT structure remains UNKNOWN.

## Repository Evidence
- The Round-6 brief permits a custom element with Shadow DOM but requires the host itself to remain an in-flow child/sibling, one `data-gitl-mount` identity, scoped observation, reversible cleanup, and fail-closed rail fallback.
- Current Ghost has no structural shell path. Its compatibility rail remains geometry-based and `startRailTracker()` observes `document.body` with `subtree:true` plus polling. That existing observation model is deliberately not copied into a future structural mount.
- A1/A1X already require exact active-composer-scoped Send identity, zero actuation, duplicate resistance, rerender safety, and an exact live insertion rule before A2 can build.

## Primary Standards / Upstream Evidence
### WHATWG DOM — Shadow hosts
Source: https://dom.spec.whatwg.org/
- `Element.attachShadow()` is not limited to autonomous custom elements. The standard explicitly permits ordinary built-in hosts including `div` and `span`.
- An open shadow root remains programmatically reachable through `element.shadowRoot`.

Implication: style/event encapsulation does not require Ghost to introduce a global custom-element definition. A normal in-flow `span` or `div` can host an open ShadowRoot while Ghost's existing state/action manager stays external.

### WHATWG HTML — autonomous custom-element lifecycle
Source: https://html.spec.whatwg.org/dev/custom-elements.html
- `connectedCallback` can run more than once, so one-time initialization needs a guard.
- A queued `connectedCallback` can run after the element is no longer connected.
- Ordinary DOM moves historically produce disconnect/connect lifecycle transitions; the newer state-preserving path uses `connectedMoveCallback`.

Implication: an autonomous custom element adds lifecycle state that a structural-repair manager would have to make idempotent and stale-safe. That complexity is not yet justified by any Round-6 requirement.

### WHATWG HTML — registry collisions
Source: https://html.spec.whatwg.org/multipage/custom-elements.html
- `CustomElementRegistry.define()` throws `NotSupportedError` when the same name or constructor is already registered in that registry.

Implication: a globally named autonomous element creates another page-scoped collision/failure surface. A plain `span`/`div` ShadowRoot host avoids that global definition dependency entirely.

### WHATWG DOM — MutationObserver removal semantics
Source: https://dom.spec.whatwg.org/
- When subtree observation is enabled, the DOM standard uses transient registered observers so mutations in descendants removed from an observed tree are not lost before delivery.
- `disconnect()` removes registered observers and empties the observer record queue.

Implication: structural repair must not assume every delivered mutation record refers to the currently valid composer/container. Each repair pass needs a current generation/container token plus `isConnected`/ownership verification before it can move or recreate a mount.

### CSSWG Resize Observer
Source: https://drafts.csswg.org/resize-observer/
- The specification includes an explicit resize-loop error path whose message is `ResizeObserver loop completed with undelivered notifications.`

Implication: a structural `ResizeObserver` should be verification/scheduling input, not a place for immediate recursive layout writes. Repair writes should be coalesced into a later bounded pass, for example a single pending animation-frame verification, with a deterministic no-loop oracle.

### WHATWG DOM — Shadow event retargeting
Source: https://dom.spec.whatwg.org/
- Event dispatch uses shadow-tree retargeting; event behavior across a shadow boundary depends on the event path/composed semantics.

Implication: Ghost controls inside a ShadowRoot should bind directly to the existing reviewed Ghost handlers rather than depend on document-level delegated `event.target` assumptions. No event from the ShadowRoot should be translated into host Send authority.

### State-preserving moves are not required for the first portable path
Sources:
- https://developer.chrome.com/blog/movebefore-api
- WHATWG custom-element `connectedMoveCallback` section above

Chrome introduced `moveBefore()` as a state-preserving primitive in Chrome 133. The living HTML standard now defines `connectedMoveCallback` for custom elements moved through that path.

Implication: state-preserving move is useful, but Round 6 should not make the first structural prototype depend on it. The simpler baseline can use a plain ShadowRoot host whose actual Ghost state remains outside the DOM node, then reinsert/move that presentation host with explicit verification. `moveBefore()` can remain a feature-detected later optimization after a real browser matrix justifies it.

## Competing Expert Lenses
### Expert A — autonomous custom element owns its lifecycle
Use `<ghost-composer-cell>` with Shadow DOM and implement `connectedCallback`, `disconnectedCallback`, and eventually `connectedMoveCallback` for observer/resource ownership.

Strength: component-local lifecycle and semantics. Failure mode: duplicated initialization, stale queued lifecycle work, global-registry collisions, and extra portability surface around state-preserving moves.

### Expert B — plain in-flow host plus open ShadowRoot and external mount manager
Use one ordinary `span` or `div` carrying `data-gitl-mount`, attach one open ShadowRoot, and let the existing Ghost manager own state, actions, verification, observation, and cleanup outside DOM lifecycle callbacks.

Strength: preserves style isolation and host reflow while removing the custom-element registry and callback lifecycle from the first implementation. Failure mode: the manager must still prove exact ownership, cleanup, focus/accessibility, and host-style compatibility.

### Outside-frame candidate — light-DOM host with no ShadowRoot
Use a plain host and namespace all classes/styles without Shadow DOM.

Strength: minimum platform machinery and simplest event model. Failure mode: much larger host-style bleed/collision surface; current evidence gives no reason to prefer that risk over a standard open ShadowRoot.

### Reliability/security lens
Expert B is provisionally favored because it reduces independent lifecycle state near a safety-critical Send surface. The structural manager can maintain one explicit generation, one current verified container, one mount node, one scoped MutationObserver, and one ResizeObserver. Verification failure must disconnect both observers, remove only Ghost's own mount/style ledger, and return to the rail.

### Mobile/performance lens
A plain host does not solve narrow-width crowding, keyboard reflow, or physical-device cost. Its value is state reduction. Observer callbacks must be bounded and coalesced; no `document.body` structural watcher or high-frequency global poll is authorized.

### Test/certification lens
The decision is useful only if it becomes falsifiable. A2/Red Team should be able to prove that stale mutation records, resize churn, repeated subtree replacement, and ShadowRoot event boundaries cannot duplicate the mount or produce host actuation.

## Decision / Novel Finding
The research changes the preferred **shell-host primitive**, not the Blue authorization state:

1. **Provisional first implementation primitive: ordinary `span`/`div` + one open ShadowRoot + external Ghost mount manager.** This satisfies the brief's in-flow and style-isolation intent without requiring a global custom-element definition.
2. **Autonomous custom element becomes a competing later option, not a prerequisite.** Its lifecycle/registry features should earn their complexity through evidence rather than be assumed necessary.
3. **`moveBefore()` / `connectedMoveCallback` are optional later optimizations.** Do not make them a baseline dependency until target-browser execution supports the gain.
4. **Repair needs a generation/current-container guard.** Mutation records from a removed subtree can still be delivered; every scheduled repair must revalidate current container, active composer, mount ownership, and exact Send identity before any DOM write.
5. **Resize observation must be read/schedule oriented.** Coalesce repair into one pending later pass and treat any ResizeObserver loop error as a deterministic failure.
6. **Shadow controls should bind directly to existing Ghost handlers.** Do not rely on document-level delegated targets across the ShadowRoot and do not derive any host Send action from Shadow events.
7. The exact current ChatGPT Blue insertion row/child position remains **UNKNOWN**. A1X and A2 remain blocked exactly as before.

## Predeclared A2 / Red-Team Falsification Addendum
When A1X eventually supplies the live insertion rule, the smallest build should additionally prove:

1. One ordinary host element with one `data-gitl-mount` identity and exactly one attached ShadowRoot.
2. Ghost state/action authority remains outside the host node; removing/reinserting the presentation host does not create a second state store or Send path.
3. The mount manager owns exactly one scoped MutationObserver and one ResizeObserver for the verified structural container; unmount disconnects both and clears pending repair work.
4. A mutation queued from an old/removed composer cannot remount into or mutate that stale subtree after the current generation changes.
5. Repeated host-control insertion and full composer subtree replacement still produce exactly one connected Ghost mount.
6. Resize callbacks do not synchronously make size-changing writes; repeated resize/reflow produces no ResizeObserver loop error and at most one coalesced repair pass per frame.
7. Shadow-internal controls call reviewed Ghost handlers directly; synthetic click/submit/input/keydown counts on host Send/composer remain zero unless an already-reviewed Ghost action separately authorizes an actuation.
8. Original host Send remains the exact same connected operable node before and after mount/repair.
9. Any observer, ShadowRoot, host-style-ledger, identity, or structural verification failure removes the attempted structural mount and restores the existing rail fallback.
10. If a future autonomous custom-element variant is tested, duplicate registry-name/constructor handling and repeated connect/disconnect/move lifecycle must fail closed and pass an explicit browser matrix before it can replace the plain-host baseline.

## Tests / Execution
- Live authenticated ChatGPT structure capture: **NOT RE-RUN**. The permission boundary is unchanged and repeating it would not discriminate this research question.
- Deterministic A1X structure probe: **NOT RE-RUN**. Exact prior execution already passed 2/2 and product/test code did not change.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** because this fallback changed no product or test behavior.
- Standards/adoption work: primary-specification review only; no external example is treated as current ChatGPT source of truth.

## Changes
- `.gitl/autopilot-state.json` — lease claim only before this evidence, commit `0b4ac4dfb5ed615c7e5f0c694e4f9144e1c183ef`.
- `.gitl/evidence/round-6/research-fallback-02.md` — this durable research result.
- Product source, generated extension source, tests, workflows, dependencies: **NONE**.

## Acceptance Criteria
- No dependency-ready executable work existed: PASS.
- No conflicting lease or active workflow existed before claim: PASS.
- Research mode materially differs from adoption-drift fallback: PASS.
- Produce a novel architecture/risk finding rather than mere browsing: PASS.
- Convert standards claims into falsifiable A2/Red-Team constraints: PASS.
- Preserve current-host UNKNOWN and A1X gate: PASS.
- Product implementation or selector authorization: NONE.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics unchanged: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback unchanged: PASS.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- A plain ShadowRoot host still requires a verified live structural container; it does not solve the missing A1X evidence.
- Shadow DOM can change focus/event/style behavior and therefore still needs accessibility, keyboard, mobile, and cross-browser execution.
- The recommendation is architectural simplification, not proof of better real-device performance.
- `moveBefore()`/`connectedMoveCallback` remain standards-based candidates, but their practical target-browser value must be demonstrated rather than assumed.
- This is the second post-A1X fallback and it produced material novelty. Diminishing returns cannot be declared; a complete six-wake no-novelty round has not occurred.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, resume A1X exactly as written and preserve the deterministic/no-actuation oracle. If the gate remains unchanged, do not repeat standards/Shadow lifecycle research. Use a materially different bounded fallback such as mobile keyboard/footer reflow and narrow-width failure modes, or another evidence mode that can change the structural decision. Keep `R6-A2-MOBILE-SHELL-BUILD` waiting until current-host evidence supplies an exact insertion rule.

## Assignment Status
- research-only
