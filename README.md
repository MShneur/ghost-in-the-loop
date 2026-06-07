# 👻 Ghost in the Loop — v5.0.0

> *You've already done this. You handed the AI something large, received back something almost right, and accepted it because asking again felt like admitting something. This fixes that.*

A universal auto-proceed engine for AI chats — available as a **Tampermonkey userscript** and a **Firefox extension**. Halt-first signal priority. Watchdog-protected. Confidence-scored.

---

## What's New in v5.0

**Architecture rewrite.** Not a patch — a clean rebuild based on reliability audits, competitive analysis, and red-team testing.

- **Unique signal tokens** — `[[GITL::PROCEED]]` / `[[GITL::HALT]]` eliminate false positives from code blocks and quoted text. Falls back to legacy `PROCEED`/`SYSTEM_HALT` for backward compatibility.
- **Halt-first priority** — if both halt and proceed signals appear, halt wins. A false halt costs one click; a false proceed costs tokens and trust.
- **Confidence scoring** — signals are weighted (exact sigil: +4, legacy keyword: +3, fuzzy pattern: +2, progress bar: +2). Minimum threshold of 3 required to act. Score visible in the panel.
- **Randomized delay** — 8–15 seconds between responses. Reduces automation detection risk on all platforms.
- **Watchdog** — 90s soft warning, 180s hard pause. Catches stuck loops, selector breaks, and network failures.
- **Send lock** — prevents double-sends from race conditions.
- **SPA route detection** — patches `pushState`/`replaceState`; pauses loop and clears selector cache on navigation.
- **Selector caching** — DOM lookups are cached per element role and invalidated on route change.
- **Export** — download full conversation as TXT or JSON.
- **Crash recovery** — state is persisted on `beforeunload`; previous session detected on reload.
- **Default round cap: 20** (was 50). Configurable up to 999.
- **Firefox extension** — same engine, native install, no Tampermonkey required.

---

## Two Modes

### ▶ Loop
You know your task is multi-step. Press play. The script works through it one piece at a time.

### 🧠 Think First
For complex or open-ended tasks. The AI reads the task, plans its own batch count at ~80% response capacity, then executes automatically.

---

## Install

### Option A: Tampermonkey (any browser)

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. **[Click to install Ghost in the Loop](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)**
3. Tampermonkey will prompt — click Install
4. Open any supported platform — the panel appears

### Option B: Firefox Extension (native)

1. Open Firefox → go to `about:debugging#/runtime/this-firefox`
2. Click **"Load Temporary Add-on…"**
3. Navigate to the `extension/` folder in this repo
4. Select `manifest.json`
5. The extension loads immediately on all supported sites

> **Note:** Temporary add-ons are removed when Firefox restarts. For permanent install, the extension will be submitted to [addons.mozilla.org](https://addons.mozilla.org) (free, pending review).

**Supported platforms:** ChatGPT · Perplexity · Gemini · DeepSeek · Copilot · Grok

---

## Usage

```
Type your prompt → Select mode → Press ▶ → Do something else.
```

| Control | Action | Shortcut |
|---------|--------|----------|
| ▶ | Start / Resume | `Alt+P` |
| ⏸ | Pause | `Alt+P` |
| ■ | Stop & reset | `Alt+S` |
| ▼/▲ | Collapse/expand panel | Click |
| Position buttons | Move panel to any corner or bottom bar | Click |

### What the Panel Shows
- **Live progress bar** — parsed from the AI's `[Step X/Y]` output
- **Signal detection** — current signal type and confidence score
- **Send path** — how the last message was sent (button click vs Enter key)
- **Diagnostic log** — last 8 events with timestamps
- **Export buttons** — download full conversation as TXT or JSON

### Safety Features
- **Halt-first** — HALT always beats PROCEED on collision
- **Round limit** — default 20, configurable
- **Watchdog** — auto-pauses after 90s with no activity
- **Randomized delay** — 8–15s between sends to avoid automation flags
- **Send lock** — prevents double-sends
- **Route detection** — pauses on conversation switch
- **Crash recovery** — detects previous session on page reload

---

## Platform Notes

| Platform | Status | Input Method |
|----------|--------|-------------|
| ChatGPT | ✅ Tested | React native setter + Continue button auto-click |
| Perplexity | ✅ Tested | ContentEditable with fallback chain |
| Gemini | 🔶 Beta | ContentEditable |
| DeepSeek | 🔶 Beta | Textarea |
| Copilot | 🔶 Beta | Textarea |
| Grok | 🔶 Beta | Mixed |

---

## Important: Automation Risk

AI platforms may flag scripted interaction patterns as "unusual activity." This script includes conservative defaults (randomized delays, round caps) to minimize risk, but **aggressive use can still trigger warnings or temporary suspensions.** Don't run multiple loops in parallel tabs on the same account.

---

## Repo Structure

```
ghost-in-the-loop/
├── ghost-in-the-loop.user.js   ← Tampermonkey userscript (standalone)
├── extension/
│   ├── manifest.json           ← Firefox MV3 manifest
│   ├── content.js              ← Same engine + GM shim
│   ├── icon-48.png
│   └── icon-96.png
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## Contributing

PRs welcome — especially selector fixes when platforms update their DOM, new platform profiles, and protocol wording improvements.

## License

[AGPL-3.0](LICENSE)

---

<p align="center"><sub>Named after the ghost that refuses to leave the machine.</sub></p>
