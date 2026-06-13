# 👻 Ghost in the Loop — v7.0.0

[![CI](https://github.com/MShneur/ghost-in-the-loop/actions/workflows/test.yml/badge.svg)](https://github.com/MShneur/ghost-in-the-loop/actions/workflows/test.yml)
[![Install](https://img.shields.io/badge/Install-Tampermonkey-green)](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue)](LICENSE)

**Universal AI workflow engine.** Eliminates the manual "proceed" step between AI reasoning steps — auto-proceeds through multi-step conversations with loop control, workflow pipelines, personas, structured export, diagnostics, and boot safety.

Works on: **ChatGPT · Claude · Perplexity · Gemini · DeepSeek · Copilot · Grok · Manus** + generic adapter for **Mistral · Kimi · Qwen · Meta AI · Poe · HuggingChat · You.com · Pi · Z.ai · Genspark · MiniMax · LMArena · Duck.ai** and any other chat interface via custom selectors.

---

## How It Works

1. You type a prompt and press ▶
2. Ghost appends a loop protocol to your message
3. The AI works step-by-step, ending each response with `[[GITL::PROCEED]]` or `[[GITL::HALT]]`
4. Ghost auto-sends until the task is done
5. Completion chime + full conversation export

**Three modes:** Loop (step-by-step) · Think First (AI plans batches) · Roadmap Autopilot (AI generates steps → runs them all).

---

## Install

### Tampermonkey (Chrome, Firefox, Edge, Safari)

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click: [![Install](https://img.shields.io/badge/Install-Tampermonkey-green)](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)
3. Click "Install" in the Tampermonkey prompt

### Firefox Extension (no Tampermonkey needed)

1. Clone repo
2. Firefox → `about:debugging` → This Firefox → Load Temporary Add-on → `extension/manifest.json`

---

## Features

| Feature | Description |
|---------|-------------|
| **Boot safety** | `safeBoot()` + tab lock + focus guard — prevents multi-tab conflicts and background token burn |
| **Network interceptor** | Proxies fetch/XHR to capture AI responses before DOM paint — more reliable signal detection |
| **Health badge 🟢🟡🔴** | Live adapter health score (0–100) in panel header — green means ready |
| **Recovery engine** | 5-strategy send fallback: contenteditable → native setter → direct value → Enter key → refocus retry |
| **Timeline log** | Append-only event log (500 entries, GM storage) — every send/halt/pause/failure recorded |
| **Capsule v2** | SHA-256 deduplicated export → `.gitl.json` with DAG-linked messages and resume token |
| **Cross-tab bus** | BroadcastChannel relay for cooperative multi-tab handoff (user-initiated, never auto-injected) |
| **Roadmap Autopilot** | AI generates a numbered roadmap → Ghost runs every step → final synthesis |
| **Prompt Queue** | Paste your own steps, one per line — runs hands-free |
| **Handoff Capsule** | One-click: mission + roadmap position + last output → paste into any model to resume |
| **8 personas** | Researcher · Builder · Red Team · Devil's Advocate · Tester · Customer Voice · Executive · Round Table |
| **6 workflows** | Deep Research · R&D Lab · Shipyard · Debate · Pre-Mortem · Trollproof |
| **Halt-first signal** | HALT always beats PROCEED. No exception. Weighted: sigils (+4) > legacy (+3) > fuzzy (+2) |
| **Anti-automation delay** | Randomized 8–15s between sends (2s on first round) |
| **Deep export** | Expands collapsed Thinking/Reasoning, exports reasoning logs |
| **Rescue mode** | Stuck chat? Exports last 10 messages + state for fresh context |
| **Walk-away alerts** | Desktop notification on complete/pause/error |
| **SPA route detection** | Pauses on conversation switch, clears selector cache |
| **Crash recovery** | State persists on close, resume offered on reload |
| **Watchdog** | 90s warning, 180s hard pause — no silent hanging |
| **Config backup** | Export/restore all settings as JSON |
| **CI tested** | 126 unit tests across 7 suites — runs on every push |

---

## Architecture

```
Layer 0:   Constants + Boot Safety (safeBoot, tab lock, focus guard)
Layer 0.5: Network Interceptor (fetch/XHR proxy, GITL_NET)
Layer 0.7: Selector Doctor + Health Scoring
Layer 1:   Platform Adapters (all DOM access isolated here)
Layer 2:   State Store (GHOST object)
Layer 3:   Diagnostics + Timeline (event log)
Layer 4:   Signal Engine (pure logic — detectSignal, parseProgress)
Layer 5:   Loop Engine + Recovery Engine + GhostBus
Layer 6:   Export (Capsule v2, SHA-256 dedup)
Layer 7:   UI (render, panel, tabs)
```

The loop engine never touches the DOM directly. All DOM access goes through Layer 1 adapters.

---

## For Developers / Future AI Collaborators

Before making changes, read:

- **[DEVLOG.md](DEVLOG.md)** — what was tried, what failed, why. Read this before researching anything — it may already be answered.
- **[CHANGELOG.md](CHANGELOG.md)** — what shipped in each version and what bugs were found.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — technical deep-dive: selector patterns, signal scoring, adapter protocol, known platform quirks.

**Every push must update at minimum:** DEVLOG.md (what changed and why) and CHANGELOG.md (what shipped or what failed).

---

## License

AGPL-3.0 — see [LICENSE](LICENSE)
