# Ghost in the Loop v9.0.21 — mobile layouts and recovery export candidate

**Scope:** Opt-in candidate branch only. Current stable main remains 9.0.20. No merger/deployment/approval bypass.

## Built

- Kept all 17 historical skins and seven functioning sections (Run, Auto, Flow, Personas, AoA, Export, Setup).
- New 1 **Micro Edge Tab** (mint): 244px expanded panel, 31px collapsed side tab.
- New 2 **Top Tab Popover** (violet): 262px expanded panel, compact horizontally scrolling section tabs.
- New 3 **Peek Sheet** (cyan): 350px or less, bottom sheet up to 340px/44dvh, collapsed 86px bottom pill.
- Navigation and thin progress are at the **top** of each new layout, content below. Extra header and section decorations are suppressed only on these three mobile skins.
- Added **Save Chat HTML** (standalone escaped text) while preserving existing **Page Snapshot HTML** (sanitized currently-rendered DOM), Markdown, JSON, Copy MD, and Project Vault.
- ChatGPT partial archive triggers alternative archive then bounded mobile scrolling. Overlap-guided merge retains unverified archive and visible-page additions, but excludes unplaceable fragments. Partial results are explicitly labeled.
- Conservative DOM selector fallback leads for Claude, Gemini, Grok, DeepSeek and Qwen. Other providers and rich media are NOT yet field-certified. No credential capture or upload.

## Phone trial in Firefox Android + Tampermonkey (after installation)

1. Open a ChatGPT conversation and expand Ghost's small tab.
2. Select **Setup > Appearance > Skin**.
3. Select **New 1 - Micro Edge Tab**, **New 2 - Top Tab Popover**, **New 3 - Peek Sheet**. Switch back to **Classic** if you dislike one.
4. Select **Export > Save Chat HTML**. The separate **Page Snapshot HTML** remains in Page backup.
5. For a long conversation, check that an incomplete archive continues scrolling and shows a PARTIAL warning unless full coverage is actually verified. Compare first/last messages with the original conversation.
6. Use **Copy report** to capture metadata-only failure diagnostics if export is still incomplete.

**Proof so far:** JavaScript source/extension generated parity, source-integrity focused Jest, simulated Chromium mobile width checks at 360px and 390px. Real authenticated Firefox Android / Tampermonkey coverage still NOT TESTED. Simulation may miss host shadow DOM, scroll container or extension-specific quirks.

## Preservation / trust

The original single-Send Play/Proceed transport, existing skin settings, seven tabs, multi-step workflows, Auto-Approve session gate, and approval permissions were not intentionally changed. No new off-origin network transfer; HTML is constructed locally. Current data export may still be incomplete. Files/media are not claimed complete. No automated release / push Actions.

## Sources considered

- https://github.com/sisodiabhumca/ai-exporter — in-chat panel, multi-format, Project metadata. Feature claims not independently tested.
- https://github.com/Kin-Zhang/anychat-exporter — multi-platform and HTML.
- https://github.com/pionxzh/chatgpt-exporter — established userscript archive reader.
- https://github.com/Covai-Labs/ace — multi-AI localized exports.
- https://github.com/MShneur/ghost-in-the-loop — working product architecture and owner corrections.
Research drew design/product mechanisms only, not code copying.

## Remaining gates

- Check real ChatGPT Firefox Android with a long authenticated conversation; verify fallback scroll moves physically, state cancellation and progress dialog, first/last turns and partial report.
- Compare one Claude, Gemini, DeepSeek, Qwen, Grok conversation per platform in the actual host/browser before claiming cross-AI extraction.
- Full release/package certification requires approval; this is a review candidate, not stable.
