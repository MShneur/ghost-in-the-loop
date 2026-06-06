# 👻 Ghost in the Loop

**Your AI never shuts up — on purpose.**

A Tampermonkey/Violentmonkey userscript that automates multi-step AI conversations. Type your prompt, press Play, and walk away. The script injects a loop protocol, watches for progress signals, and keeps sending "Continue" until the AI says it's done.

Works across **6 platforms**. Zero configuration. No API keys needed.

---

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| **ChatGPT** (chatgpt.com) | ✅ Tested | Full support incl. "Continue generating" auto-click |
| **Perplexity** (perplexity.ai) | ✅ Tested | Multi-fallback selectors for their SPA |
| **Gemini** (gemini.google.com) | 🔶 Beta | ContentEditable injection |
| **DeepSeek** (chat.deepseek.com) | 🔶 Beta | Convention-based selectors |
| **Copilot** (copilot.microsoft.com) | 🔶 Beta | Convention-based selectors |
| **Grok** (grok.com) | 🔶 Beta | Convention-based selectors |

> **Beta** means the DOM selectors are based on common patterns but haven't been battle-tested on every UI revision. If something breaks, open an issue with the platform name and I'll fix the selectors.

---

## How It Works

```
You type a prompt
        │
        ▼
   Press ▶ Play
        │
        ▼
Script silently appends the Loop Protocol ──────────────────────┐
        │                                                       │
        ▼                                                       │
   AI receives your prompt + hidden instructions:               │
   "End each response with [Step X/Y] progress bar.             │
    Last word = PROCEED if more steps, SYSTEM_HALT if done."    │
        │                                                       │
        ▼                                                       │
   AI responds: "...████░░░░ [Step 2/8] — built schema PROCEED"│
        │                                                       │
        ▼                                                       │
   Script sees PROCEED → sends "Continue" ──────────── loops ──┘
        │
        ▼ (when AI outputs SYSTEM_HALT)
        │
   🔔 Chime plays. Script stops. Panel shows ✅ Complete.
        │
        ▼
   Type new prompt → Press ▶ → Fresh cycle starts automatically.
```

---

## Install

### Prerequisites
- [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge) **or** [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox)

### One-Click Install
> Coming soon — Greasy Fork listing

### Manual Install
1. Open Tampermonkey → **Create a new script**
2. Delete the template code
3. Copy the entire contents of [`ghost-in-the-loop.user.js`](ghost-in-the-loop.user.js) and paste it in
4. **Ctrl+S** to save
5. Navigate to any supported AI chat — the panel appears in the top-right corner

---

## Usage

### The Basic Loop
1. **Type your prompt** into the AI's chat input (don't send it yourself)
2. **Press ▶** on the Ghost panel
3. The script appends the loop protocol and sends for you
4. Watch the progress bar fill up as the AI works through steps
5. When the AI outputs `SYSTEM_HALT`, the script stops and plays a chime
6. **Type a new prompt → Press ▶ again** — fresh cycle, fresh protocol injection

### Panel Controls

| Button | Action | Shortcut |
|--------|--------|----------|
| **▶** | Start new cycle / Resume from pause | `Alt+P` |
| **⏸** | Pause the loop (won't send next "Continue") | `Alt+P` |
| **■** | Full stop — resets round counter | `Alt+S` |

### Panel Features
- **Live progress bar** — mirrors the AI's `[Step X/Y]` output
- **Round counter** — how many Continue messages sent
- **Round limit** — safety cap (default 50, configurable)
- **Sound toggle** — two-tone chime on completion
- **▸ Show injected prompt** — expand to see exactly what protocol text is appended
- **Draggable** — grab the header to reposition; position persists across sessions

### Safety Features
- **Round limit**: Caps at 50 by default (configurable 1–999) to prevent runaway token burn
- **Deviation detection**: If the AI responds without `PROCEED` or `SYSTEM_HALT`, the script **auto-pauses** and flags "AI deviated — review output"
- **No hidden behavior**: Click "Show injected prompt" to see every word that gets appended

---

## The Injected Protocol

This is what gets silently appended to your first message each cycle. You can view it anytime in the panel.

```
[LOOP PROTOCOL — follow exactly]
1. Execute this task step by step. One logical chunk per response.
2. At the END of every response, print a progress bar in this exact format:
   ████░░░░ [Step X/Y] — short description of what you just completed
3. After the progress bar, on a new line:
   - If MORE steps remain, your absolute last word must be: PROCEED
   - If the ENTIRE task is COMPLETE, your absolute last word must be: SYSTEM_HALT
4. Do NOT ask clarifying questions. Make reasonable assumptions and execute.
5. Do NOT skip the progress bar or the final keyword. The automation depends on it.
```

---

## Configuration

Settings persist across sessions via `GM_getValue`/`GM_setValue`:

| Setting | Default | Where to change |
|---------|---------|----------------|
| Round limit | 50 | Panel input field |
| Sound on complete | On | Panel toggle |
| Panel position | Top-right | Drag the header |

To modify the injected protocol text, edit the `PAYLOAD_INJECT` constant in the script source.

---

## Troubleshooting

**Script doesn't appear on the page**
- Check Tampermonkey dashboard — is the script enabled?
- Verify the URL matches one of the `@match` patterns

**Play button shows "No input element"**
- The platform may have changed its DOM. Open an issue with the platform name.

**AI doesn't follow the protocol**
- Some models ignore system-style instructions more than others. Works best with ChatGPT (GPT-4/4o), Perplexity Pro, and DeepSeek.
- If the AI asks a clarifying question instead of executing, the script will auto-pause. Answer the question manually, then press ▶ to resume.

**Progress bar not showing in panel**
- The AI needs to output `[Step X/Y]` format. If it uses a different format, the regex won't catch it. The loop still works — you just won't see the visual progress.

---

## Contributing

PRs welcome, especially for:
- **New platform support** — add a profile to the `PLATFORMS` object
- **Selector fixes** — when platforms update their DOM
- **Better protocol text** — if you find wording that gets more reliable compliance from models

---

## License

[AGPL-3.0](LICENSE)

---

## Related Projects

- [chatgpt-auto-continue](https://github.com/adamlui/chatgpt-auto-continue) — Auto-clicks "Continue generating" (single-platform, different use case)
- [CTRL-AI](https://github.com/MShneur/CTRL-AI) — AI governance framework by the same author

---

<p align="center">
  <i>Named after the ghost that refuses to leave the machine.</i><br>
  <sub>A <a href="https://github.com/MShneur/CTRL-AI">CTRL-AI</a> project.</sub>
</p>
