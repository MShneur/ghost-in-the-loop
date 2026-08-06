# Mobile Ghost Shell Concepts

Status: exploratory worker brief, not an accepted product decision.

Source: user-supplied annotated Android screenshot, 2026-08-06.

## Problem

Ghost currently uses a left-edge rail. The user wants a mobile shell that feels native to the chat page without depending on fragile host internals. The sketch contains three ideas:

1. Teal: a compact Ghost control in the upper-right, opposite the host hamburger/menu.
2. Blue: a compact Ghost capsule integrated with the chat composer controls.
3. Red: a horizontal control strip below the composer with a logo, Play, numbered sections, and a `+` expander.

The goal is not to literally take ownership of host controls. Ghost should appear integrated while remaining isolated enough to survive SPA updates, mobile keyboards, layout changes, and site redesigns.

## Concept A — Upper-right launcher

Sketch interpretation:

- Ghost logo/mark near the upper-right.
- A quick Play control.
- A menu affordance analogous to the site's hamburger, positioned on the opposite side.

Strengths:

- Lowest coupling to the composer and message DOM.
- Remains available when the composer is off-screen.
- Clear separation between Ghost and host actions.
- Suitable as a fixed Shadow DOM overlay.
- Minimal vertical space cost.

Risks:

- Harder thumb reach on large phones.
- Can collide with host compose, share, overflow, or account buttons.
- Must respect notches, status bars, and safe-area insets.
- A visually aligned overlay must not claim to be part of the host header.

Recommended use:

- Primary compact launcher on mobile.
- Show Ghost identity/status and one quick Play/Pause action.
- Tap the logo/menu area to open the full Ghost sheet.

## Concept B — Composer companion capsule

Sketch interpretation:

- A blue Ghost capsule inside or directly adjacent to the message composer.
- Contains a Ghost mark, Play, and `+` expansion control.

Strengths:

- Excellent discoverability at the moment the user is writing.
- Best one-handed reach.
- Visually feels like a native chat tool.
- Natural location for task start and quick options.

Risks:

- Highest host-coupling and regression risk.
- Can interfere with attachment, voice, send, and text controls.
- Composer DOMs differ sharply across ChatGPT, Gemini, Claude, Perplexity, and mobile layouts.
- Framework rerenders can detach or duplicate injected nodes.
- Keyboard, dictation, accessibility, and reduced-width states can make it unusable.
- A failure near Send is more dangerous than a failure in an isolated overlay.

Recommended use:

- Experimental adapter-specific enhancement only.
- Never the sole way to access Ghost.
- Enable only after a platform-specific mount point passes collision, rerender, accessibility, and Send-safety tests.

## Concept C — Bottom numbered dock

Sketch interpretation:

- A red horizontal strip below the composer.
- Ghost logo at the left.
- Quick Play next.
- Numbered sections such as `1 2 3 4` for major menus.
- `+` at the right to expand or reveal additional sections.

Strengths:

- Excellent thumb reach.
- Numbered tabs can expose modes without a deep menu.
- Clear progress or section identity.
- Can become a compact bottom sheet handle.

Risks:

- The mobile browser toolbar and on-screen keyboard continuously change the usable bottom edge.
- A fixed strip can overlap the composer, browser controls, safe area, or host notices.
- Permanent numbered tabs may consume too much width on small devices.
- Numbers alone are ambiguous without labels, onboarding, or accessible names.

Recommended use:

- Expanded state, not always-visible default.
- Render as a Ghost-owned bottom sheet above the visual viewport bottom and keyboard.
- Use numbered tabs only when they map to stable top-level sections; pair them with accessible labels and selected-state cues.

## Recommended hybrid

Use Concept A as the stable launcher and Concept C as the expanded shell.

Collapsed mobile state:

```text
[ Ghost mark/status ] [ Play/Pause ]
```

Expanded state:

```text
┌──────────────────────────────────────┐
│ Ghost   ▶/⏸   1   2   3   4   ＋   × │
├──────────────────────────────────────┤
│ Active section content               │
└──────────────────────────────────────┘
```

Behavior:

1. Ghost mounts one isolated Shadow DOM root under `document.documentElement` or `body`.
2. The launcher is visually aligned near the upper-right or another collision-free edge; it is not inserted into the host header.
3. Tapping the menu/logo opens a bottom sheet.
4. Tapping Play/Pause performs the existing reviewed Ghost transport action.
5. The sheet exposes numbered top-level sections and a `+` overflow/customization entry.
6. The existing rail remains a fallback and a desktop option.
7. The blue composer companion may be tested later as an optional adapter enhancement, but it must call the same Ghost shell and transport APIs rather than create a second control system.

## Why this is safer

- One Ghost-owned root avoids duplicated listeners and split state.
- The launcher survives host composer replacement.
- The bottom sheet is easier to adapt to `visualViewport` and safe-area changes than a node placed under the host composer.
- Quick Play remains available without opening the full panel.
- Product behavior stays independent of visual placement.

## Implementation constraints

- Use the existing Ghost transport and state authority; do not create a second Play/Send path.
- Minimum touch target: 44 CSS pixels.
- Respect `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- Reposition from `window.visualViewport` resize and scroll events with throttling.
- Avoid high-frequency mutation scans.
- Use CSS containment and a Shadow DOM boundary.
- Set explicit accessible names, roles, focus order, and selected states.
- Do not intercept host gestures outside Ghost controls.
- Detect collisions with host header/composer rectangles and choose a fallback anchor.
- Preserve current dock/rail settings and provide a migration-safe default.
- The shell must remain usable at narrow widths and large text settings.

## Required specialist evaluation

Researcher / architect:

- Compare fixed launcher anchors and visual-viewport behavior on supported mobile browsers.
- Identify safe mounting and collision-detection patterns.
- Define stable section semantics for numbered tabs.

Builder:

- Prototype the launcher and bottom sheet behind an experimental feature flag.
- Reuse one Ghost root, one state store, and existing action handlers.

Test engineer / Red Team:

- Verify no duplicate controls or listeners after SPA navigation and rerenders.
- Verify Play/Pause remains the single reviewed transport path.
- Test collisions with host menus, composer, banners, and narrow layouts.
- Test focus trapping, Escape/close, screen-reader labels, and touch targets.

Mobile / performance specialist:

- Test keyboard open/close, orientation, visual viewport resizing, notches, browser toolbars, reduced-motion, and lower-end hardware.
- Measure layout work and event frequency.

Devil's Advocate:

- Challenge whether the new shell is materially better than the existing rail.
- Reject composer integration unless cross-platform evidence justifies its maintenance and safety cost.

## Acceptance hypothesis

The hybrid should advance only if it provides better one-handed access and less chat obstruction than the current rail while preserving:

- Single action authority.
- Zero host Send interference.
- No duplicate UI after route changes.
- Stable mobile keyboard behavior.
- Acceptable lower-end-device overhead.

Until those conditions are tested, this file is a design brief rather than a roadmap commitment.
