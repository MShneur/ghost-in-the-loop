# Exporter upstream intelligence — 2026-10-18

## Incident and scope
- Source: user screenshot from Firefox Android, Ghost 9.0.1-alpha.10. Confirmation dialog reports 951 recovered turns with completeness unverified.
- The count is not independently verified as the full conversation. It may reflect UI virtualization, API shape mismatch, rich media, or other platform behavior. Diagnose provenance before modifying parsers again.
- Releasing a DOM loader with more scroll passes is **not** a substitute for authenticated field proof of full history.
- Prior attempts: alpha.7 validated archive mapping, alpha.8 added speculative paginated API, alpha.9/10 refined UI. New task focuses on observable recovery and proper provenance, not falsely promoting partial to full.

## Landscape and qualified donors
- 100 GitHub search-result metadata records: `docs/research/chatgpt-exporters-top100-metadata-2026-10-18.json`. This is a metadata **landscape**, NOT 100 code reviews, rankings, licenses cleared for reuse, or proof all 100 products export ChatGPT.
- Read-only radar executable: `scripts/upstream-exporter-radar.py --days 7`. It checks **seven curated public upstream repos**, their recent commits and releases; returned 19 keyword-relevant commit titles and zero HTTP errors in Oracle field run. Keyword hits are intake leads requiring verification, not automatically accepted fixes.
- High-priority projects:
  - [pionxzh/chatgpt-exporter](https://github.com/pionxzh/chatgpt-exporter): active MIT userscript/export source; examine request/response adaptation, rich-turn fallback and attachment handling before adopting.
  - [rashidazarang/chatgpt-chat-exporter](https://github.com/rashidazarang/chatgpt-chat-exporter): MIT; assess export behavior and API assumptions.
  - [Kin-Zhang/anychat-exporter](https://github.com/Kin-Zhang/anychat-exporter): MIT; compare DOM virtualization handling.
  - [Soluna-Angelito/chatgpt-conversation-exporter](https://github.com/Soluna-Angelito/chatgpt-conversation-exporter): MIT; inspect fetch-response interception carefully for privacy and compatibility.
  - [ha0xin/chatgpt-multimodal-exporter](https://github.com/ha0xin/chatgpt-multimodal-exporter): MIT; inspect rich media features.
  - [EpochTX/ChatGPT_Exporter](https://github.com/EpochTX/ChatGPT_Exporter): LICENSE UNKNOWN; reference behavior only; no code copying.
  - [huhusmang/ChatGPT-Exporter](https://github.com/huhusmang/ChatGPT-Exporter): LICENSE UNKNOWN; reference behavior only; no code copying.
- Automated source-diff review must identify *why* ChatGPT platform access changed, the relevant request/response shapes, which projects altered code, and any license/security limitation. No auto-import or auto-publish.

## Product acceptance
- User needs lightweight dimmed overlay (ghost indicator); Pause/Resume, Cancel no save, Save Partial; request-first, bounded progressively loaded DOM fallback; original scroll location restored; never lie about completeness.
- Filename `GITL_Platform_[GhostVaultProject]_ReadableTitle_ConversationId_UTCtimestamp_FULL-or-PARTIAL.md/json` with filename sanitization.
- Distinguish Ghost Project Vault name from the actual ChatGPT folder: don't infer a folder from chat URL when no grounded label exists.
- No secret/token capture, no off-origin relay, no auto-send, no hidden background login, no UA spoofing.
- Desktop mode: Firefox's Request Desktop Site may reload the page; separate hidden desktop rendering is NOT TESTED and not represented as a supported fallback.

## Verification and next diagnostic
- Offline tests and Chromium mobile mock with forced HTTP error can prove modal behavior; only real authenticated Firefox Android with same chat can establish full-history recovery and titles.
- Collect **metadata-only** next field report: Ghost version, page history status/reason, number of turns, UI fallback passes, whether content includes start/end. Avoid chat text, tokens, cookies and URLs.
- Retain this as source review record; the main product and GitHub remain canonical.
