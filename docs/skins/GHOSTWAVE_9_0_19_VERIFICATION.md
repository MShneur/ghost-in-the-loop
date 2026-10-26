# GitL 9.0.19 — Dual Ghostwave skin verification

## Scope
Source-derived skin names `ghostwave` (Ghostwave) and `ghostdock` (Ghostwave Compact). Existing selectors and Send architecture are unchanged. Both themes have real seven-item navigation, Play/Pause/End/Top controls, Run mode and posture, advanced accordions, five placement buttons, and session-only opt-in Auto-Approve in the Auto tab.

## Evidence and boundary
- Real build: `npm run build:extension` and `npm run check:generated` **PASS**; syntax checks on `ghost-in-the-loop.user.js` and `extension/content.js` **PASS**.
- Focused local Jest: v9 compact mobile, AA status, Auto-Approve, and version identity **28/28 tests PASS**.
- Chromium mobile **synthetic fixture**: widths 320 and 390 CSS px; two skins × five placement modes = **20 measured cases**. All seven tabs rendered, no test compositor overlap after scoped 12px near-composer clearance. Right-dock tested additionally at 360 and 412 CSS px. Bounds at 390/800 right dock: Ghostwave 296×390, Ghostwave Compact 276×387, composer top 718, panels bottom 630/627.
- Fixture preview images: `ghostwave-neon-chatgpt-fixture-390.png` and `ghostwave-compact-chatgpt-fixture-390.png` (simulated ChatGPT page, **not** authenticated ChatGPT screenshots).
- Full local v9 Jest: **9 suites red, 27 failures** on **both unmodified 9.0.18 base and dual-skin branch**, with same failing suite names. Both branches were executed independently with the same linked dependencies. No new failing test suites introduced; don't call the entire test suite PASS.
- **NOT_TESTED:** physical Firefox Android, real authenticated ChatGPT DOM/IME/200%-text, and installed extension auto-update. The screenshots are development fixtures only.

## Guardrails
- Preserve source of truth `ghost-in-the-loop.user.js` and generated artifact `extension/content.js`.
- No transport, approval, permissions, or host DOM insertion path changed. Existing `data-placement` only mirrors the selected positioning choice into a CSS selector for the compact skin; the five actual placement handlers remain the existing ones.
- No invented Queue mode or Auto-Approve switch on Run; neither skin silently moves the panel when selected.
- To revert appearance, choose Setup → Skin → Classic or Setup → Reset look.
- No GitHub-hosted Actions invoked; all supplied test receipts derive from local Oracle shell and isolated checkout.
