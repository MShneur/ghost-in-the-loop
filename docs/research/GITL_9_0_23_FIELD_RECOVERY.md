# Ghost 9.0.23 long-conversation recovery candidate (31 October 2026)

Authority: current Ghost repo branch; user-reported Firefox Android screenshots and one locally reviewed partial HTML export. Source: ghost-in-the-loop.user.js. No conversation text or account information included in this public document.

## Root causes confirmed

- One exported HTML contained 583 numbered entries: 20 user entries and 563 assistant/activity entries. Screenshots showed 578 and 583 entries recovered in separate attempts. These entries are not a verified count of user-visible conversation turns.
- E1 returned some unreadable archive content. E2 returned HTTP 404 because the legacy endpoint was unsupported. E3 visited both viewport ends but cannot independently verify complete history; no claim of three fully working alternatives.
- Old top detection waited four short scroll sleeps (less than two seconds); the collector had an unconditional four-minute cap and request aborts were at 12 seconds. Slow ChatGPT virtualization can take longer.
- Android system confirm blocked the page over a large recovery overlay. Scrolling output included at least one unplaceable fragment dropped from the ordered transcript.

## Repair implemented (branch only)

- Five visible UI skins: Original Edge Rail; Animated Ghostwave; three new compact layouts. All historical palette/CSS and Play/Send handlers preserved internally.
- Recovery overlay is non-modal and bottom corner, shows live elapsed timer, idle time, remaining time; controls Pause, +5min, Save Partial, Cancel. No blocking OS confirm.
- Default recovery budget 15 minutes, explicitly extensible; same-origin archive request timer 45 seconds (3 retry attempts for transient failures). DOM stall check now waits up to 12 seconds for actual new messages/geometry before treating the start/end as settled.
- Recovery offers Keep searching / Save PARTIAL / Cancel. Retrying merges with previous collection and separately preserves fragments whose chronological position is unknown in HTML/MD/JSON.
- Legacy 404 is reported as endpoint unsupported, not a generic unexplained failure. No page-only capture is ever labeled FULL.
- Separate export 1, 2, 3 and automatic fallback, existing HTML/MD/JSON and Project Vault stay intact. No new off-site requests or account permission elevation.

## Source references

- https://github.com/pionxzh/chatgpt-exporter (release 2.36.0 includes cached histories, batch progress, redesigned ChatGPT adaptation; modern export implementation)
- https://github.com/vaulthunt3r/dialogue-export (maintainer field-tested cached virtualized scroll and forward sweep; no code copied)
- https://github.com/VitorGaRi/chatgpt-exporter (API and top-to-bottom scrolling options; attachments remain placeholders).

## Verification and ceilings

- Source and extension generated parity; focused Jest regression suite: 70/70 passed on Oracle.
- Mobile Chromium 360px: E1 generated FULL HTML from paginated route only, E2 generated FULL HTML from synthetic legacy mapping, E3 generated PARTIAL HTML without archive requests. E3 additional late DOM message arriving after five seconds was included.
- These are synthetic/browser checks, NOT proof of a full export on authenticated Firefox Android. No live account credential was used and no browser permission was bypassed.
- Release: local isolated candidate only. Stable GitHub main remains 9.0.20. A previous GitHub write/merge operation was explicitly declined; do not reroute around the refusal. GitHub publication requires permission via approved GitHub path. No Actions dispatch.

Next: Once owner authorizes publishing this candidate, verify installed exact SHA on Firefox Android and compare first/last meaningful user+assistant turns and attachments with source. Stop if the 2026 host DOM/API has drifted.
