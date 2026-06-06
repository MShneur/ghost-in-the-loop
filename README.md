# 👻 Ghost in the Loop — v4.4.0

> *You've already done this. More than once. You handed the AI something large, received back something that was almost right, and accepted it because asking again felt like admitting something. This fixes that.*

A Tampermonkey userscript that automates multi-step AI conversations across six platforms. Press play. Walk away. Come back when the chime plays.

---

## The Problem

Every model you're using — GPT-4o, Claude, Gemini, Perplexity, DeepSeek — runs on a fixed reasoning budget. When you hand it a large task all at once, it doesn't slow down and think harder. It compresses. It fills the back half of your response with things that *sound* correct. It does this without flagging it, because it doesn't know it's doing it.

The people who consistently get exceptional output break the work into focused steps — one piece per response, each verified before the next. The quality difference isn't subtle.

The problem is that someone has to sit there and type *proceed* after every response. For a ten-step task, that's ten interruptions. Most people abandon perfectly good workflows around step four because they got up for coffee. Ghost in the Loop handles the relay.

---

## Two Modes

### ▶ Loop
You know your task is multi-step. Press play. The script appends a loop protocol to your prompt, watches every response for the continuation signal, sends "Continue" automatically, and stops with a chime when the AI declares it's done.

*Best for:* structured tasks where you already know the scope — writing a document in sections, building a feature, refactoring a module.

### 🧠 Think First
For complex or open-ended tasks where you don't know how many steps are needed. The AI reads the task, decides how many focused batches are appropriate at ~80% response capacity (a deliberate safety margin), states the plan explicitly, and then executes it. You come back to a completed plan *and* a completed task.

*Best for:* research, open-ended writing, anything where the scope isn't obvious upfront.

---

## Install

1. Install **[Tampermonkey](https://www.tampermonkey.net/)** for Chrome, Firefox, or Edge
2. Open Tampermonkey → **Create a new script** → delete the template
3. Paste the contents of **[ghost-in-the-loop.user.js](ghost-in-the-loop.user.js)** → Save
4. Navigate to any supported platform — the panel appears in the top-right corner

**Supported platforms:** ChatGPT · Perplexity · Gemini · DeepSeek · Copilot · Grok

---

## Usage

```
Type your prompt → Select a mode → Press ▶ → Do something else.
```

The panel handles everything from here. When the AI finishes, a chime plays and the panel shows ✅ Done. Type your next prompt and press ▶ again — the payload resets automatically.

### Panel Controls

| Control | Action | Shortcut |
|---------|--------|----------|
| **▶** | Start / Resume | `Alt+P` |
| **⏸** | Pause the loop | `Alt+P` |
| **■** | Stop and reset | `Alt+S` |
| Mode toggle | Switch between Loop / Think First | Click |
| `▸ What gets injected` | See exactly what text is appended | Click |

### Safety Features

- **Round limit** — configurable cap (default 50) prevents token runaway
- **Deviation detection** — if the AI goes off-script, the loop auto-pauses and flags it
- **80% response margin** *(Think First only)* — the AI is instructed to use ~80% of its comfortable response length per batch, leaving room for clean, accurate output rather than a rushed finish
- **Payload transparency** — every word appended to your prompt is visible in the panel

---

## What Gets Appended to Your Prompt

### Loop Mode
```
[Ghost in the Loop — loop mode]
Execute this task step by step. One focused section per response.

At the end of every response, print:
████░░░░ [Step X of Y] — one line describing what you just completed

Then: PROCEED if more steps remain, SYSTEM_HALT when fully done.
```

### Think First Mode
```
[Ghost in the Loop — think first mode]
Before doing any work, read this task and plan how to complete it in focused batches.

Response 1 — plan only: Decide how many batches the task needs at ~80% response
capacity. List the plan briefly. End with: PROCEED

Each subsequent response: complete one batch, end with:
████░░░░ [Batch X of Y] — description
Then: PROCEED or SYSTEM_HALT
```

---

## Configuration

All settings persist via `GM_getValue`/`GM_setValue`:

| Setting | Default | Where |
|---------|---------|-------|
| Mode (Loop / Think First) | Loop | Mode toggle |
| Round limit | 50 | Panel input |
| Sound on complete | On | Panel toggle |
| Panel position | Top-right | Drag the header |

---

## Platform Notes

| Platform | Input Method | Notes |
|----------|-------------|-------|
| ChatGPT | React native setter | Full support including "Continue generating" auto-click |
| Perplexity | ContentEditable + fallback chain | 7 selector fallbacks for their SPA |
| Gemini | ContentEditable | Beta — DOM changes frequently |
| DeepSeek | Plain textarea | Beta — convention-based selectors |
| Copilot | Plain textarea | Beta — convention-based selectors |
| Grok | Mixed | Beta — convention-based selectors |

> **Beta** means selectors are based on observed patterns, not hardened against every UI revision. Open an issue with the platform name if something breaks — selector fixes take ten minutes.

---

## Troubleshooting

**Panel doesn't appear**
Check that the script is enabled in Tampermonkey and the URL matches one of the `@match` patterns.

**"Type a prompt first" error**
The input field wasn't detected before you pressed play. Try clicking into the chat input first, then press play.

**AI doesn't follow the protocol**
Works most reliably on ChatGPT (GPT-4o), Perplexity Pro, and DeepSeek. If the AI asks a clarifying question instead of executing, the loop auto-pauses — answer the question manually, then press ▶ to resume.

**Progress bar not updating**
The AI needs to output `[Step X of Y]` or `[Batch X of Y]` format. The loop still works without it — you just won't see visual progress.

---

## Contributing

PRs welcome. Most useful contributions:

- **Selector fixes** when platforms update their DOM
- **New platform profiles** — add an entry to the `PLATFORMS` object
- **Protocol improvements** — better wording that gets more consistent compliance across models

---

## Related

- [CTRL-AI](https://github.com/MShneur/CTRL-AI) — AI governance framework by the same author

---

## License

[AGPL-3.0](LICENSE)

---

<p align="center"><sub>Named after the ghost that refuses to leave the machine.</sub></p>
