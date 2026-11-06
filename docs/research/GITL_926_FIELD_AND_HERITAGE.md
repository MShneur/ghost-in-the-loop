# Ghost 9.0.26: mobile heritage, independent layouts and source-coverage diagnosis

Authority: current PR #59 branch (not stable main). Owner correction November 1, 2026.

## Field evidence from user-supplied exported HTML (content not stored here)

- Exact user-provided filename ended in `22-51-12_PARTIAL.html`. This is a test of actual mobile Ghost export, not a source fixture.
- The readable offline HTML includes **785 numbered message entries** (48 user, 737 assistant), **201 platform-redacted plugin-output placeholders**, **73 assistant turns with empty main text but a visible reasoning field**, and **12 unplaced additional user entries**.
- Reader 1: paged archive returned unreadable text. Reader 2: legacy conversation endpoint HTTP 404. Reader 3: scrolling reached both ends, but end-to-end text coverage was not established.
- Scrolling to the top is therefore NOT the missing acceptance condition. Some output was redacted by the platform, and unreadable records have not been decoded. Neither can be safely relabeled FULL.
- Source evidence is the user's private attachment in the active conversation; we do not copy its user-content into GitHub.

## Original UI source

- Historical Ghost source inspected at commit `6bcdc91ea8`, version **8.0.0**. It uses a `g-hdr` top title, `g-tabs` top navigation with distinct Run/Auto/Flow/Roles/Export/Setup sections, and a prominent `g-btns` Play/Pause/Stop row. Earlier transport and UI code are not copied back.
- Heritage v8 is an adaptation: 46px circular Play, top section chips, individual active content pane, status footer.
- Orbit: 56px floating-style round Play within a two-row header; navigation on demand.
- Folio: two-row segmented section grid, page-like active section body.
- All three share the modern single authorized Play/Send handler, export implementation, accessibility titles, saved skin ID and the seven existing functional sections. Existing five selectable skins are retained.

## Export diagnosis adjustment

- New paged proof records `historyBoundariesConfirmed`, `unreadable`, `missingId`, `undecodable`, `redacted`, `skippedNonConversation`, `mediaExcluded`. It does NOT export extra conversation content, API tokens or binary media.
- Explicit platform-redacted output is never called fully recovered. A paginated archive can have both boundaries confirmed while source text remains incomplete. A DOM pass reaching the top only proves navigation.
- The partial file and recovery dialog now explain source text coverage instead of media gaps. Readers remain separate and secondary.

## Evidence ceilings

- Full source and generated extension parse as JavaScript; same source wrapper schema as `scripts/build-extension.js`.
- Five isolated paginated-reader behavior probes pass: ordinary complete text, redacted text, non-conversational tool omission, unreadable body, user message lacking an ID. These mocks do not constitute browser/field testing.
- Mobile CSS and DOM structural tests added; automated real browser runs and logged-in Android Firefox proof are NOT RUN in this turn.
- **HOLD.** Do not merge to stable or automatically install before genuine Firefox Android acceptance of the three layout choices and the long-chat export result.
