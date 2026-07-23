# GITL Diagnostics

Standalone tools that are **not** part of Ghost core. Install them only when
you're chasing a "Ghost doesn't show up on site X" report.

## `gitl-canary.user.js` — Execution Canary

**The problem it solves.** Ghost's own boot beacon (`<html data-gitl-boot>`)
and its fail-loud banner live *inside* Ghost. If a userscript manager never
executes Ghost on a page at all — an injection or permission problem — that
beacon is never written, and you can't tell that apart from "Ghost executed
and crashed on the first line." The v8.1.x Gemini investigation stalled for
exactly this reason until the fail-loud banner happened to survive and print
the real error (a Trusted Types CSP violation).

The canary is a **separate** userscript, so it isolates the layer:

| Canary badge | Ghost panel | Conclusion |
|---|---|---|
| appears | appears | both fine on this site |
| appears | absent | the fault is in **Ghost** — read the canary's `ghostBoot` field and Ghost's banner |
| absent | absent | the fault is the **manager / injection layer** — no change to Ghost's code can help; check the manager is enabled and permitted on this site |

It renders in a Shadow DOM host attached to `<html>` (survives body
replacement and z-index wars) and is built with DOM APIs — **no `innerHTML`
string sinks** — so it is safe even on Trusted-Types-enforced pages like
Gemini, the very thing that broke Ghost.

### How to use (mobile-friendly)
1. Install `gitl-canary.user.js` in the same userscript manager as Ghost.
2. Load the problem site. A small **GITL CANARY** badge appears top-right.
   Its label also reports Ghost: `ghost:up`, `ghost:<beacon>`, or `ghost:absent`.
3. Tap the badge to expand a copyable JSON report (manager name/version/inject
   mode, body-replacement count, host-removal count, page errors, Ghost's
   `data-gitl-boot`, whether `#gitl` is present, UA). Tap **Copy report** and
   send it.

### What each field means
- `manager` / `managerVersion` / `injectInto` — from `GM_info`; proves the
  manager ran the script and how it injects.
- `bodyChanges` — how many times the page replaced `document.body` (SPA churn).
- `hostRemovals` — how many times the page removed the canary's own host (a
  proxy for how aggressively it would remove Ghost's panel).
- `ghostBoot` / `ghostPanelPresent` — Ghost's beacon and whether its panel is
  in the DOM, read from outside Ghost.
- `errors` — `window.error` / `unhandledrejection` captured on the page.

The canary is versioned independently (`@version` in its header) and has no
dependency on Ghost core.
