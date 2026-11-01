# Ghost 9.0.25 — Cleanerz / Origin text-first exporter review

Status: DRAFT candidate. Stable 9.0.23 unchanged. Real Firefox Android E4 not tested.

## User contract

Play-first mobile panel, version in header, one Export conversation primary action and direct HTML options. Markdown is default for handoff. Keep user and assistant text only; JSON and offline HTML are optional. Remove embedded image, SVG, audio and binary media from ordinary exports. Raw platform JSON remains an explicit expert-only option and may contain media/private data. Protect Play/Send, approvals, seven sections, Projects, and cross-AI adapters.

## Root causes

- Prior paged archive counted anonymous tool/system entries as unreadable messages before checking their role. It also required no attachments for FULL status. Neither should invalidate a fully recovered text-only chat.
- Structured text parsing missed nested text or accepted nontext objects as messages. A bounded explicit-text-field reader replaces this behavior.
- Duplicate rendered context and activity entries bloated default exported files. Ordinary handoff now contains only user/assistant messages.
- Screenshot shows installed 9.0.23, not draft 9.0.24. New mobile UI field outcome remains UNKNOWN.
- Genuine missing pages or genuinely unreadable user/assistant text still blocks text verification. DOM-only history stays unverified.

## Verified external patterns and reuse boundaries

- pionxzh/chatgpt-exporter (MIT): paginated/server archive, caching, Markdown and HTML. Release 2.37.1 Oct 12 2026.
- vaulthunt3r/dialogue-export (MIT): virtualized DOM message cache and forward sweep; upstream reports field-tested 301-message and very long text runs.
- Kin-Zhang/anychat-exporter (MIT): supports multiple AI sites, with attachment export OFF by default.
- sisodiabhumca/ai-exporter (license unverified): cursor pagination and Project export research.
- world-wide-dev/chatgpt-export (license unverified): hydration -> local IndexedDB snapshot -> deterministic export. Snapshot coverage must still be verified.
- gildas-lormeau/SingleFile (AGPL): page archival and deferred-content loading, not server conversation authority.

No third-party source was pasted into Ghost. Pinned source-revision registry: GITL_EXPORTER_UPSTREAMS_20261101.json. Read-only revision checker: scripts/check-exporter-upstreams.js. It produces REVIEW/UNCHANGED without installing anything. No hosted Actions, automatic code merges, or release jobs.

## Tests and acceptance ceiling

- Source/extension parity and focused Jest tests verify media exclusion, source text preservation, media-only archive acceptance, real unreadable text rejection, and tool-entry exclusion.
- Synthetic Chromium 360px E1/E2 confirms separate archive endpoints and HTML downloads; E3 full long-chat Firefox Android not run.
- Real Android Firefox / userscript manager on a long authenticated conversation: NOT TESTED.
- Draft remains HOLD until field acceptance and owner approval; stable 9.0.23 remains rollback target.
