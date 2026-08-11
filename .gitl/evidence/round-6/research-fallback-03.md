# Ghost Research Fallback Evidence

## Identity
- Round: 6
- Nominal timer lens: scheduled successor / mobile-browser-accessibility-performance
- Executed role: bounded research fallback with researcher-architect and reliability dissent
- Research fallback ID: `R6-RESEARCH-FALLBACK-MOBILE-REFLOW-03`
- Program: `MOBILE-SHELL-STRUCTURAL`
- Started at: 2026-08-07T14:26:10Z
- Finished at: 2026-08-07T14:28:39Z
- Canonical maker: `MShneur/Personal-Forge:08-agent-bridge/CHATGPT_AUTOMATION_MAKER.md`, canonical v1.0 dated 2026-08-07

## State Read
- Branch: `agent/8.8-repair-resume`.
- Pre-recovery branch head: `a68465c811115993a07202aedb157932f853cf37` with completed `research-fallback-02` evidence but a stale still-recorded lease/currentStep.
- Incomplete-handoff recovery commit: `bcd845c457de5abb15b71f17647acca362ae599f`.
- Recovery proof: `research-fallback-02.md` records `Finished at: 2026-08-07T14:16:10Z`, no workflow run was associated with head `a68465c...`, and the branch had not moved after the evidence commit. The recovery changed only coordination state and released that prior lease.
- Starting head for this bounded fallback: `bcd845c457de5abb15b71f17647acca362ae599f`.
- Lease claim commit: `8c8591fe5b34cd60419b4be78eca4c8a510e8b3f`.
- Re-read after claim confirmed the lease belongs to `R6-RESEARCH-FALLBACK-MOBILE-REFLOW-03`, acquired `2026-08-07T14:26:10Z`, expiring `2026-08-07T15:11:10Z`.
- `R6-A1X-MOBILE-SHELL-LIVE-STRUCTURE-CAPTURE` remains blocked locally on `DQ-R6-LIVE-STRUCTURE-CAPTURE`; `R6-A2-MOBILE-SHELL-BUILD` remains dependency-waiting.
- No dependency-ready implementation, test, certification, documentation, packaging, or audit assignment exists while the exact current-host insertion rule is unknown.
- This is deliberately a third and materially different post-A1X fallback: it does not repeat live-browser permission attempts, the deterministic structure probe, adoption-drift research, or Shadow/custom-element lifecycle research.

## Research Question
What mobile virtual-keyboard, narrow-width, orientation, and enlarged-text behaviors must the eventual Blue/Red structural shell survive, and which browser APIs are safe only as measurement signals rather than placement authority?

This research can narrow A2/Red-Team/mobile certification criteria without knowing the current authenticated ChatGPT insertion slot. It cannot authorize a product selector, insertion index, host style mutation, or Send-adjacent behavior.

## Primary Standards / Browser Evidence

### Chrome Android on-screen keyboard behavior
Source: https://developer.chrome.com/blog/viewport-resize-behavior

Chrome documents that since Chrome 108 on Android, the default on-screen-keyboard behavior resizes only the **Visual Viewport**, not the **Layout Viewport**. The viewport meta `interactive-widget` key can instead request `resizes-content` or `overlays-content`; the default is `resizes-visual`. Chrome explicitly notes that this change does **not** apply to WebView.

Implications:
- A structural Ghost mount cannot assume that keyboard appearance changes the layout viewport height.
- Fixed/viewport-relative compensation is especially fragile and is not a valid substitute for normal host flow.
- Android Chrome browser evidence must not be silently promoted to Android WebView behavior.

### Current MDN viewport-meta reference
Source: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/name/viewport

MDN, last modified 2026-04-22, documents `interactive-widget=resizes-visual|resizes-content|overlays-content` and states that `resizes-visual` is the default. Under the default, the virtual keyboard resizes the visual viewport without changing page layout; `resizes-content` changes layout; `overlays-content` changes neither viewport.

Implications:
- The eventual mount must remain correct under at least two materially different keyboard resize models: visual-only resize and content/layout resize.
- Ghost should observe the host page's chosen behavior rather than mutate the page's viewport meta policy. The userscript does not own that document-level application policy.

### VisualViewport
Source: https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport/resize_event

MDN marks the `VisualViewport.resize` event as Baseline / widely available and states it fires when the visual viewport is resized.

Implication:
- `visualViewport.resize` is a reasonable **verification/scheduling signal** for keyboard/tool-bar/zoom transitions.
- It must not become primary placement authority for Blue/Red. The structural requirement is an in-flow host child/sibling, not a geometry-following overlay.
- Any listener must be bounded, coalesced with the mount manager's existing repair scheduler, and removed on unmount.

### VirtualKeyboard API
Sources:
- https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard_API
- https://developer.mozilla.org/en-US/docs/Web/API/VirtualKeyboard

MDN marks the VirtualKeyboard API as experimental and **Limited availability / not Baseline**. It can expose geometry and `keyboard-inset-*` CSS environment variables, and can opt into overlay behavior.

Implications:
- `navigator.virtualKeyboard`, `geometrychange`, `overlaysContent`, and `keyboard-inset-*` must not be required for the first portable structural shell.
- They may be feature-detected later for diagnostics or optional optimization only after a browser/device matrix proves value.
- Ghost must not opt the host page into overlay behavior merely to simplify its own layout. That would change host keyboard semantics and undermine the structural-fallback boundary.

### WCAG 2.2 Reflow
Sources:
- https://www.w3.org/WAI/WCAG22/Understanding/reflow
- https://www.w3.org/TR/WCAG22/

WCAG 2.2 Success Criterion 1.4.10 requires content, except inherently two-dimensional content, to remain usable without loss of information/functionality or two-dimensional scrolling at a width equivalent to **320 CSS pixels** for vertically scrolling content.

Implication:
- A Round-6 mobile/accessibility gate should explicitly exercise a 320-CSS-pixel-equivalent layout. Ghost must not cause page-wide horizontal scrolling or make its own/native controls unreachable at that width.
- If Blue cannot fit without hiding, clipping, or forcing host controls outside the usable flow, the correct result is to reject/fallback at that breakpoint rather than squeeze Send/editor functionality.

### WCAG 2.2 Resize Text
Sources:
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text
- https://www.w3.org/WAI/WCAG21/Techniques/failures/F69

WCAG Success Criterion 1.4.4 requires text to resize to **200%** without loss of content or functionality. W3C failure F69 specifically identifies controls/text becoming clipped, truncated, or obscured at 200% as a failure pattern.

Implication:
- 200% text scaling is a first-class structural-shell falsification gate, not cosmetic polish.
- Ghost must not retain a fixed-height control container that clips its labels or pushes native actions out of reach at enlarged text.

## Competing Expert Lenses

### Expert A — host-flow purist
The mount should rely only on the verified host row/stack and let the host's own layout react to keyboard, orientation, and browser chrome. VisualViewport is used for telemetry/assertions only.

Strength: lowest independent geometry state and closest to the user-confirmed structural requirement. Failure mode: if the host itself fails to reserve space for an expanded Red row or its sticky footer uses JavaScript-calculated offsets, Ghost may need an adapter-specific reversible accommodation rather than pure passive flow.

### Expert B — adaptive-viewport engineer
Use `visualViewport.resize` as an input to reverify crowding, latest-message reachability, and fallback state during keyboard/orientation transitions.

Strength: catches cases where the visual viewport shrinks while layout viewport dimensions stay stable. Failure mode: turning the event into immediate pixel positioning would recreate the overlay architecture and cause resize storms or double compensation.

Resolution: use Expert B's signal inside Expert A's in-flow architecture. It schedules a bounded revalidation; it does not determine x/y/bottom placement.

### Accessibility lens
A Blue/Red design that passes at a nominal 390/412 px phone width can still fail users who zoom or enlarge text. The release gate needs 320-CSS-pixel-equivalent reflow and 200% text scaling with no clipping, hidden native controls, two-dimensional scrolling introduced by Ghost, or loss of text-entry/Send functionality.

### Reliability / security lens
Ghost does not own the host page's viewport meta tag or virtual-keyboard policy. It must not mutate `interactive-widget`, set `navigator.virtualKeyboard.overlaysContent`, programmatically show/hide the keyboard, or intercept host focus in order to make its shell fit. Ambiguity or unsafe crowding falls back to the existing rail.

### Mobile / constrained-hardware lens
Keyboard and orientation transitions can emit bursts of resize/scroll/layout events. Reverification must be coalesced to one pending bounded pass, must not synchronously write layout on every VisualViewport event, and must expose callback/repair counts for performance certification. Physical Android and embedded WebView remain separate evidence targets.

### Aggregate end-user lens
The intended gain is one-handed access near the composer. That benefit is invalid if Blue reduces editor usability, hides attachment/voice/Send controls, or becomes hard to reach with the keyboard open or text enlarged. Reach is therefore subordinate to native-control preservation and reflow.

### Outside-frame candidate — Blue trigger + Red overflow
A compact Blue trigger could eventually open a Red in-flow row rather than packing all Ghost controls into the composer action row. This may reduce Blue crowding while retaining thumb reach.

Failure mode: Red requires a verified footer stack, message-list spacing/scroll anchoring, keyboard behavior, and latest-message reachability that remain UNKNOWN without current-host evidence. It stays a later candidate, not a workaround for A1X.

### Test / certification lead
The useful output of this research is a predeclared failure matrix. A future build must fail rather than adjust the oracle if any host/native safety invariant breaks.

## Novel Finding / Decision
This fallback materially narrows the eventual mobile contract:

1. **Keyboard geometry is verification input, not mount authority.** Blue/Red remain normal-flow structural mounts even when the Visual Viewport shrinks.
2. **Support both visual-only and layout-resize keyboard models.** The implementation must not double-compensate when the host/browser already reflows content.
3. **Do not mutate host viewport/keyboard policy.** No viewport-meta edit, no `overlaysContent` opt-in, no programmatic keyboard show/hide for structural operation.
4. **VirtualKeyboard API is optional only.** Its limited availability prevents it from becoming a baseline dependency.
5. **WebView is a distinct Android evidence surface.** Chrome's documented Android behavior explicitly excludes WebView, so browser emulation cannot certify embedded WebView.
6. **Accessibility thresholds become explicit falsification gates:** 320-CSS-pixel-equivalent reflow and 200% text scaling without Ghost-caused loss/clipping/obscuring/two-dimensional scrolling.
7. **A VisualViewport listener, if used, is one removable/coalesced signal.** It cannot perform immediate geometry writes or create another global poll/observer system.
8. **Blue must be allowed to reject itself at constrained width.** No exact minimum editor width is invented before current-host capture; A1X/A2 must derive any host-specific threshold from live structure and native-control behavior.
9. **Red expansion under keyboard is a separate certification surface.** The row must remain in host flow, preserve composer/latest-message reachability, and collapse cleanly; failure returns to the rail rather than adding viewport offsets.
10. The exact current ChatGPT insertion row/child position remains **UNKNOWN**. A1X and A2 remain blocked exactly as before.

## Predeclared A2 / Red-Team / Mobile Falsification Addendum
When A1X eventually supplies a live insertion rule, the smallest structural build should additionally prove:

1. **320 CSS px equivalent:** no Ghost-caused horizontal page scrolling, native-control disappearance, or loss of editor/Send functionality. If the verified host row cannot safely absorb Blue, the structural attempt rejects/falls back.
2. **200% text:** Ghost labels/controls and nearby native controls are not clipped, truncated, obscured, or made unreachable; no fixed Ghost height may create such clipping.
3. **Keyboard model A — visual-only resize:** simulate a visual viewport height contraction while layout viewport dimensions stay stable. The mount remains in the verified host row/stack, exact Send identity is unchanged, and no manual bottom-offset compensation is introduced.
4. **Keyboard model B — content/layout resize:** simulate layout viewport contraction. The same mount follows host layout without applying a second keyboard inset or duplicate repair.
5. **Overlay-style keyboard model / optional VirtualKeyboard case:** if detectable, failure to prove content clearance must fail closed. Ghost may read geometry for diagnostics but may not switch the host into overlay mode.
6. **Orientation:** portrait-to-landscape and back yields exactly one connected mount, one current container generation, no duplicated observers, and original Send identity preserved.
7. **Large text + narrow width together:** combine 200% text with a narrow viewport. Blue must not preserve itself by hiding, moving, wrapping, cloning, or replacing native Send/tools; fallback is allowed and expected when structural verification fails.
8. **VisualViewport event storm:** repeated resize events produce at most one pending coalesced verification/repair pass per frame or equivalent bounded scheduler tick, no synchronous size-changing write loop, and no unbounded listener accumulation.
9. **Unmount cleanup:** remove any VisualViewport/orientation listeners plus scoped MutationObserver/ResizeObserver and pending repair token; rail fallback resumes with no stale host padding/offset.
10. **Red keyboard expansion:** when tested later, expansion must increase host layout height rather than cover content; composer and latest message remain reachable; collapse restores prior host layout exactly.
11. **No viewport ownership:** assert that Ghost never edits `<meta name="viewport">`, `interactive-widget`, host input focus policy, or `navigator.virtualKeyboard.overlaysContent` as part of normal structural mounting.
12. **Platform claim discipline:** Pixel/Chromium emulation may validate deterministic geometry transitions, but physical Android and WebView/GeckoView remain uncertified until separately executed.

No host-specific numeric editor-width threshold is predeclared because the current live host structure is still UNKNOWN. The later capture/build must derive a measurable threshold from preserved native controls and text-entry usability rather than inventing one from synthetic fixtures.

## Tests / Execution
- Live authenticated ChatGPT capture: **NOT RE-RUN**. The permission boundary is unchanged; repeating it would not discriminate this research question.
- Existing deterministic A1X structure probe: **NOT RE-RUN**. Prior exact execution already passed 2/2; product/test code did not change in this fallback.
- Product syntax/lint/generated/unit/browser matrix: **NOT APPLICABLE / NOT RUN** because this research changed no product or test code.
- External evidence: primary Chrome/MDN/W3C documentation only for the behavioral/accessibility claims above.
- No claim is made that current ChatGPT uses a particular `interactive-widget` value, VirtualKeyboard API, footer-height model, or action-row width.

## Changes
- `.gitl/autopilot-state.json` — repaired the completed-but-stale `research-fallback-02` handoff in commit `bcd845c457de5abb15b71f17647acca362ae599f`, then claimed this bounded research lease in commit `8c8591fe5b34cd60419b4be78eca4c8a510e8b3f`.
- `.gitl/evidence/round-6/research-fallback-03.md` — this durable research result.
- Product source, generated extension source, tests, workflows, dependencies: **NONE**.

## Acceptance Criteria
- Canonical maker and project state/control plane read before action: PASS.
- Completed-but-stale prior lease repaired only after finished evidence + no workflow + unchanged branch were verified: PASS.
- No dependency-ready executable work existed after recovery: PASS.
- New research mode materially differs from the prior adoption and Shadow-lifecycle fallbacks: PASS.
- Primary browser/accessibility sources converted into falsifiable mobile constraints: PASS.
- Current-host UNKNOWN and A1X gate preserved: PASS.
- Product selector/insertion authorization: NONE.
- Product implementation: NONE.

## Safety Checks
- Send authority unchanged: PASS.
- CHOICE behavior unchanged: PASS.
- Route fail-closed behavior unchanged: PASS.
- Lease semantics preserved: PASS.
- Uncertainty behavior unchanged: PASS.
- Existing rail fallback unchanged: PASS.
- Host viewport/keyboard policy changed: NO.
- `main`, merge, auto-merge, tag, publish, release: NONE.

## Risks and Limits
- The keyboard model findings are browser-platform behavior, not evidence of current authenticated ChatGPT's actual viewport meta configuration or footer implementation.
- VisualViewport availability does not imply keyboard-specific semantics on every engine/device; use it as a transition signal, not proof of keyboard state.
- WCAG thresholds establish accessibility outcomes; they do not choose a ChatGPT insertion slot.
- A plain ShadowRoot host from fallback02 still requires the missing live verified structural container.
- Physical Android, Android WebView, Firefox-Android/GeckoView, real keyboard hardware/IME combinations, and calibrated low-end performance remain uncertified.
- This is the third post-A1X fallback and it produced material novelty. Diminishing returns cannot be declared; the canonical full six-wake no-novelty condition has not occurred.

## Recommended Next Action
If `DQ-R6-LIVE-STRUCTURE-CAPTURE` changes, resume A1X exactly as written and carry forward the new 320-CSS-pixel, 200%-text, dual-keyboard-resize, event-coalescing, cleanup, and platform-claim gates.

If the capture gate remains unchanged, do **not** repeat mobile keyboard/reflow research. The next eligible wake should use another materially different bounded evidence mode, such as physical/constrained-device methodology, browser-extension/userscript CSP/ShadowRoot compatibility, cross-adapter structural-contract evidence, or a deterministic test-design artifact that does not pretend to validate the live ChatGPT slot.

Keep `R6-A2-MOBILE-SHELL-BUILD` waiting until current-host evidence supplies an exact insertion rule.

## Assignment Status
- research-only
