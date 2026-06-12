# 👻 Ghost in the Loop — v6.0.0

**Universal AI workflow engine.** Auto-proceed through multi-step AI conversations with loop control, workflow pipelines, personas, structured export, and diagnostics.

Works on: **ChatGPT · Claude · Perplexity · Gemini · DeepSeek · Copilot · Grok · Manus** — plus a labeled generic adapter for **Mistral, Kimi, Qwen, Meta AI, Poe, HuggingChat, You.com, Pi, Z.ai, Genspark, MiniMax, LMArena, Duck.ai** and any other chat interface via custom selectors.

---

## What It Does

1. You type a prompt and press ▶
2. Ghost appends a loop protocol to your message
3. The AI works step-by-step, ending each response with `[[GITL::PROCEED]]` or `[[GITL::HALT]]`
4. Ghost automatically sends "Continue" until the task is done
5. You get a completion chime and can export the full conversation

**Two modes:** Loop (step-by-step) and Think First (AI plans batches at ~80% capacity).

**Workflow pipelines:** Deep Research, R&D Lab, Shipyard, Debate, Pre-Mortem, Trollproof — each auto-advances through multi-stage prompts.

**8 personas:** Researcher, Builder, Red Team, Devil's Advocate, Tester, Customer Voice, Executive, Round Table.

---

## Install

### Tampermonkey (Chrome, Firefox, Edge, Safari)

[![Install](https://img.shields.io/badge/Install-Tampermonkey-green)](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click the badge above (or open the raw URL)
3. Click "Install" when Tampermonkey prompts

### Firefox Extension (native, no Tampermonkey needed)

1. Download or clone this repo
2. Open Firefox → `about:debugging` → This Firefox
3. Click "Load Temporary Add-on…" → select `extension/manifest.json`

---

## Features

| Feature | Description |
|---------|-------------|
| **8 platforms + 13 generic** | ChatGPT, Claude, Perplexity, Gemini, DeepSeek, Copilot, Grok, Manus — generic adapter pre-wired for Mistral, Kimi, Qwen, Meta AI, Poe, HuggingChat, You.com, Pi, Z.ai, Genspark, MiniMax, LMArena, Duck.ai |
| **Add any site yourself** | Settings → Custom sites: paste per-host selectors (JSON), then add the URL under Tampermonkey → script settings → User matches. No code edit needed. |
| **Selector probe** | Settings → Diagnostics → Probe: live-tests every selector chain and shows the winner, so broken platforms are diagnosed in one click |
| **🗺 Roadmap Autopilot** | Third mode: AI researches the task → outputs a numbered roadmap → Ghost runs every step as its own prompt + a final synthesis. True fire-and-forget. |
| **Prompt Queue** | Flow tab: paste your own steps, one per line — Ghost runs them hands-free on the roadmap engine |
| **📦 Handoff Capsule** | One-click export of mission, roadmap position, last outputs, and a next-lens contract — paste into any fresh model to continue with zero drift |
| **Lens Relay** | Workflow built for real model-switch round tables (Perplexity model selector, or manual switches) — pause between turns, swap the model, press ▶ |
| **Walk-away alerts** | Desktop notification when the loop completes, pauses, or errors |
| **Config backup** | Export/restore every Ghost setting as one JSON file |
| **💭 Deep Export** | Auto-expands collapsed Thinking/Reasoning toggles (incl. Manus grid-collapse steps), then exports reasoning logs alongside responses |
| **🌾 Virtualized harvest** | On Manus, export scrolls the whole virtualized chat collecting every turn — full history, correct roles, UI chrome stripped |
| **🤝 Handoff & 🛟 Rescue** | Handoff: the AI writes a structured briefing in-chat for the next model. Rescue: a stuck/full chat gets scraped (state + last 10 messages verbatim + resumption instructions) into a file for a fresh chat |
| **Unique signal tokens** | `[[GITL::PROCEED]]` / `[[GITL::HALT]]` — no false positives from code blocks |
| **Halt-first priority** | HALT always wins over PROCEED. No exception. |
| **Confidence scoring** | Weighted detection: sigils +4, legacy keywords +3, fuzzy patterns +2 |
| **Anti-automation delay** | Randomized 8–15s between messages (adaptive: 2s on planning rounds) |
| **5-path send redundancy** | contenteditable → native setter → direct value → button retries → Enter key |
| **Workflow pipelines** | 6 multi-stage workflows with auto-advance and pause-between-stages |
| **8 personas** | Injected into the starting prompt to alter AI behavior |
| **Tabbed UI** | Run · Flow · Personas · Export · Settings (+ hidden Diagnostics) |
| **Project ticker** | Persistent project name used as export filename prefix |
| **Enhanced export** | Markdown/JSON, filter by role or code blocks, role labels toggle |
| **SPA route detection** | Pauses loop on conversation switch, clears selector cache |
| **Crash recovery** | Persists state on page close, offers resume on reload |
| **Watchdog** | 90s soft warning, 180s hard pause — no silent hanging |
| **Collapsible panel** | Minimize to a single play/pause button; 5 position presets |
| **Keyboard shortcuts** | Alt+P toggle, Alt+S stop |

---

## Architecture

Five-layer separation — the loop engine never touches the DOM:

```
Layer 0: Constants
Layer 1: Platform Adapters (all DOM access)
Layer 2: State Store (single GHOST object)
Layer 3: Diagnostics
Layer 4: Signal Engine (pure logic)
Layer 5: Loop Engine (state transitions)
```

---

## License

AGPL-3.0 — see [LICENSE](LICENSE)
