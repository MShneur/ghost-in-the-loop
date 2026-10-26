# Ghostwave — GitL v9.0.17 skin candidate

**Status:** implementation candidate on a feature branch; requires live mobile visual validation and normal release/version promotion.  
**Goal:** translate the approved dark neon Ghost concept into an actual selectable skin while keeping the small embedded chat panel and all existing controls.

## Use in the current v9 shell

1. Install a build that includes this candidate through the normal approved release/update process.
2. Open the existing Ghost panel inside ChatGPT.
3. Open **Setup → Skin → Ghostwave**. Accent should be **Auto** to see its intended violet color.
4. To revert, choose **Classic** or select **Reset look**. Skin choice is persisted through the existing `v9.skin` preference.

This is a **built-in v9 skin** in `ghost-in-the-loop.user.js`, also included in generated `extension/content.js`. The older `.gitl.json` file-import directions in `docs/SKINS.md` belong to the legacy v8 engine and do not install this skin into v9.

## Visual recipe

| Surface | Current implementation |
|---|---|
| Root / wells | Midnight navy `#0c1024` / `#0b142b` |
| Buttons/surfaces | Slate blue `#19233b` |
| Borders | Muted blue `#46568a` |
| Readable text | Near-white `#f0f4ff` |
| Secondary text | Slate `#a7b7d8` |
| Active/selection | Violet `#baa5ff`, darker violet well `#34265d` |
| Header | Static indigo/plum/cyan gradient; subtle orbital glow |
| Play | Green gradient `#096c50 → #0da870` on this skin only |
| Active tab | Violet fill with cyan underline and faint halo |
| Animation | Reuse existing CSS-only ghost/status animation; no new timers; reduced-motion respected |

## Guardrails

- Only changes the skin palette, border/glow treatment and current panel styling; it does **not** shrink or rearrange buttons. The pixel-perfect full concept image is an **illustration**, not a promise of identical rendering within the 334px maximum-width panel.
- Seven top-level tabs, `Play` / `Pause` / `End` / `Top`, actual `Loop` / `Plan First` / `Roadmap` modes, two existing Run accordions and all other sections remain unchanged.
- **Queue is in Auto**, not a Run mode. **Auto-Approve remains in Auto, OFF by default**. Do not copy the mockup's misplaced elements into the runtime.
- Existing placements, minimized rail, focus, input, native Send authority, and extension permissions are not modified.
- Implemented with one new `SKINS.ghostwave` entry, `data-skin` attribute for styling scope, and skin-scoped CSS; no external images, font files, requests, or dependencies.

## Verification

- Source/extension JavaScript syntax checks: verified with V8 compilation in the authoring environment.
- Existing single-Send code path: unchanged in the source-edit diff.
- Static verification: seven tabs, source/runtime parity, scoped selectors, version identity preserved.
- Regression test added in `tests/v9-compact-mobile-ui.test.js`: selects Ghostwave, validates colors and preserved tab/Play count, switches back to Classic.
- Full local Jest suite, mobile visual measurements, physical Android Firefox: **NOT_TESTED** in this authoring environment. No hosted Actions triggered.

**Release gate:** keep in PR until the UI regression test and hosted/mobile checks are run and an appropriate release version is approved.