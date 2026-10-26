# Selected original A/D GitL skins — source-locked implementation

**Owner selection:** A **Edge Rail** and D **Command Selector** from the `gitl_four_independent_concepts.html` four-panel 2×2 study created in the 2026-10-26 Ghost-in-the-Loop conversation. **Do not use later generated iPhone renders**; they were explicitly rejected as reinterpretations.

## What was selected — do not redesign

- **A · EDGE RAIL (Chisel / LogicArchitect / Gridlock study):** Dark #07182a, thin cyan #37d4e8 border/accent, a **61px seven-label vertical rail** at the left *inside* the 294px Ghost control panel, compact adjacent Run workspace with ready/round progress, Play/Pause/End/Top, Loop/Plan First/Roadmap, posture, and native advanced accordions. Real ChatGPT remains behind the overlay.
- **D · COMMAND SELECTOR (Distiller / Sieve / Burden study):** Muted slate #111b2a and pale blue #9fbeea, **one compact Run section selector**, seven genuine destinations in an on-demand dropdown (not a permanent top icon row); same real Run workspace and existing native controls. On change/section selection the dropdown closes; Escape also closes.
- Neither is a generic color-only skin. Each has its own independently-scoped CSS **navigation grammar**. Never substitute top rubber-stamp icon tabs for either. Do not create separate applications, fake task inputs, AI agents, Home panels, Queue modes, or person icons on the Run screen.

## Source of truth

- Existing userscript: `ghost-in-the-loop.user.js` (v9.0.20), `SKINS` entries `edge-rail`, `command-selector`.
- Styling: uniquely scoped `#gitl9.skin-edge-rail` and `#gitl9.skin-command-selector` appended to existing styles, not changes to execution/send code.
- Markup: one existing `nav.g-site-nav` with **seven original `data-tab` button handlers**, relocated by CSS into A's rail or D's overlay. D's `data-a="skin-nav-trigger"` only toggles that existing nav, never sends a message.
- First-page actions: `data-a="play"`, `pause`, `stop` (label End), `top`. Real `runMode`, real `postureId`; no new execution path. Existing `details[data-g-acc]` remain available.
- Appearance selection persists to `v9.skin` using original Setup → Appearance. All 15 earlier skins (13 original plus two Ghostwave) still work; opt-in A/D only.
- `extension/content.js` is a generated mirror of the userscript and must stay byte-identical to `scripts/build-extension.js` output.

## Scope, verification, rollout

**Implementation is a theme/layout adaptation of two owner-selected visual sources, not permission for another concept competition.** No automations/AI traffic in these tests. Maintain the [bounded compact mobile PRD](GITL_COMPACT_MOBILE_SHELL_PRD.md) safety controls. D intentionally requires one additional tap to access the seven-section menu; this is an owner-selected exception to the default always-visible top tabs.

Verification receipts are in PR and tests. Source syntax, the 15-skin selection contract, seven-tab navigation, A vertical rail geometry, D dropdown open/switch/close, and classic baseline behavior can be checked in off-host fixtures. Do **not** call these fixtures authenticated Firefox Android acceptance. The live host composer, drag positions, remount, and zoom must still be field-checked after release.

**Failure behavior:** select Classic to roll back via Setup → Appearance → Skin; no user data migration or settings reset needed.
