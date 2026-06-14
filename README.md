# 👻 Ghost in the Loop

[![CI](https://github.com/MShneur/ghost-in-the-loop/actions/workflows/test.yml/badge.svg)](https://github.com/MShneur/ghost-in-the-loop/actions/workflows/test.yml)
[![Install](https://img.shields.io/badge/Install-Tampermonkey-green)](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue)](LICENSE)

---

The machines can reason.

The answers have been found.

Against all odds, humanity won.

Hunger ended. War faded. The future finally opened its doors.

> *Proceed to the next stage of civilization?*

And suddenly the most advanced technology on Earth is waiting for Steve from accounting to press Enter.

**Ghost in the Loop fixes that.**

Ghost automatically continues multi-step AI conversations across ChatGPT, Claude, Gemini, Perplexity, DeepSeek, Copilot, Grok, Manus, and more.

Because if the AI already knows the next step, somebody should probably let it take it.

---

## How It Works

Humanity's greatest minds spent centuries advancing science.

Ghost needs five steps.

1. You give the AI a mission.
2. Ghost attaches a loop protocol to your message.
3. The AI works through the problem, step by step.
4. Ghost automatically continues the conversation at each stage.
5. You return later and pretend you were involved the whole time.

Three modes. One premise.

**Loop** — step-by-step auto-proceed until the task is complete or the AI admits defeat.

**Think First** — the AI creates a plan before acting. This is generally considered an improvement over most corporate strategy meetings.

**Roadmap Autopilot** — the AI generates a roadmap, then follows it, then completes it. For the first time in recorded history, a roadmap may actually be executed.

---

## Why Ghost Exists

Modern AI can:

✓ Write software  
✓ Analyze research  
✓ Build business plans  
✓ Review code  
✓ Debate ideas across eight distinct personas  
✓ Generate multi-stage roadmaps  
✓ Export a full structured record of everything it did  

Modern AI cannot:

✗ Press Enter

---

## Install

**Tampermonkey** (Chrome, Firefox, Edge, Safari)

1. Install [Tampermonkey](https://www.tampermonkey.net/).
2. Click: [![Install](https://img.shields.io/badge/Install-Tampermonkey-green)](https://raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js)
3. Click "Install."
4. Give an AI a task.
5. Leave.
6. Return to discover that progress occurred entirely without your supervision.

It's unsettling at first. You get used to it.

**Firefox Extension** (no Tampermonkey needed)

1. Clone this repo.
2. Go to `about:debugging` → This Firefox → Load Temporary Add-on → `extension/manifest.json`.
3. See steps 4–6 above.

---

## Features

### Loop Mode

The AI works.  
Ghost listens.  
Steve is no longer a critical dependency.

### Think First

Before taking action, the AI creates a plan. The plan is then followed. This alone puts it ahead of approximately 80% of Q3 initiatives.

### Roadmap Autopilot

The AI generates a numbered roadmap. Ghost runs every step in sequence. The AI synthesizes the results.

Somewhere, a project manager is weeping and they don't know why.

### Prompt Queue

Paste a list of tasks. Walk away. Ghost runs them one after another, in order, without forgetting what it was doing, without needing coffee, and without asking to push the deadline.

Like an intern. Except it shows up on time.

### Personas

Need a Researcher? Ghost has one.  
Need a Builder? Ghost has one.  
Need a Devil's Advocate?

We regret to inform you that Ghost has several.

Choose from: Researcher · Builder · Red Team · Devil's Advocate · Tester · Customer Voice · Executive · Round Table. The Round Table convenes all of them simultaneously, which is exactly as chaotic as it sounds and twice as useful.

### Workflows

Pre-built pipelines for: Deep Research · R&D Lab · Shipyard · Debate · Pre-Mortem · Trollproof.

Trollproof attempts to find every possible objection to your idea before anyone else does. It finds them.

### Recovery Engine

Sometimes websites change.  
Sometimes buttons disappear.  
Sometimes the frontend team chooses violence.

Ghost includes five escalating fallback strategies to keep the workflow moving regardless of what the interface has decided to become today.

### Export

Every conversation can be exported — as Markdown, JSON, or a resumable Capsule that contains the full context, a SHA-256 deduplicated message graph, and a resume token for continuing in a fresh session.

Because eventually someone will ask *"wait, how did we get this result?"*

And for once, you'll have an answer.

### Handoff Capsule

One click. Ghost writes a compressed briefing — mission, current position, last output, open questions — formatted for immediate paste into any AI model.

The baton passes. The work continues. Nobody has to explain anything from scratch.

### Crash Recovery

Browser crashes.  
Tabs close.  
Power goes out.  
Civilizations collapse.

Ghost remembers where it left off.

### Health Badge 🟢🟡🔴

A live readiness score in the panel header. Green means everything's working. Yellow means something's drifting. Red means the platform changed its selectors again, which happens more than anyone would like.

### Walk-Away Alerts

Desktop notification when the loop completes, pauses, or encounters an error. So you can actually leave the room instead of watching a progress bar like it owes you money.

---

## Technical Highlights

For people who want to know what's actually happening under the hood:

| What | How |
|------|-----|
| **Boot safety** | `safeBoot()` defers all DOM work until `document.body` exists. Tab lock via `GM_setValue` heartbeat prevents multi-tab conflicts. Focus guard blocks background token burn. |
| **Signal detection** | Weighted scoring: custom sigils `[[GITL::PROCEED]]` / `[[GITL::HALT]]` (+4), legacy keywords (+3), fuzzy matches (+2). HALT always wins ties. |
| **Network interceptor** | Proxies `fetch` and `XHR` to capture AI responses before DOM paint — faster, more reliable signal detection on platforms with virtualized rendering. |
| **Recovery engine** | 5-strategy send fallback with exponential backoff: contenteditable reinsertion → native setter → direct value → Enter key dispatch → refocus retry. |
| **Anti-automation delay** | Randomized 8–15s between sends (2s on the first round). |
| **SHA-256 deduplication** | Capsule exports deduplicate messages using Web Crypto API hashes — eliminates duplicates from platforms that re-render the DOM on scroll. |
| **Own-UI isolation** | All DOM selectors exclude `#gitl` descendants. Ghost cannot accidentally type into its own panel. This needed to be a feature. |
| **CI tested** | 135 unit tests (jest) + Playwright e2e boot-timing tests. Runs on every push. |

---

## Architecture

```
Layer 0:   Constants + Boot Safety (safeBoot, tab lock, focus guard)
Layer 0.5: Network Interceptor (fetch/XHR proxy)
Layer 0.7: Selector Doctor + Health Scoring
Layer 1:   Platform Adapters (all DOM access isolated here)
Layer 2:   State (GHOST object)
Layer 3:   Diagnostics + Timeline (event log)
Layer 4:   Signal Engine (pure logic — detectSignal, parseProgress)
Layer 5:   Loop Engine + Recovery Engine + GhostBus
Layer 6:   Export (Capsule v2, SHA-256 dedup)
Layer 7:   UI (render, panel, tabs)
```

No external dependencies. Single file. Works anywhere Tampermonkey works.

---

## Supported Platforms

**First-class:** ChatGPT · Claude · Perplexity · Gemini · DeepSeek · Copilot · Grok · Manus

**Generic adapter:** Mistral · Kimi · Qwen · Meta AI · Poe · HuggingChat · You.com · Pi · Z.ai · Genspark · MiniMax · LMArena · Duck.ai

**Custom:** any chat interface, via custom selectors in the settings panel.

---

## For Developers and Future AI Collaborators

Before touching anything, read:

- **[DEVLOG.md](DEVLOG.md)** — what was tried, what failed, and why. If something seems like a good idea, there's a chance it's already in here with a postmortem.
- **[CHANGELOG.md](CHANGELOG.md)** — what shipped, what bugs were found, and what Replit's Playwright tests caught that the unit tests missed.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — contracts, selector patterns, signal scoring, platform quirks, test harness design.

Every push must update at minimum DEVLOG.md and CHANGELOG.md. The project has been built across multiple AI sessions and needs its history documented so future sessions don't re-solve solved problems.

---

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

*Humanity achieved godlike AI. The last bottleneck was a guy named Steve.*

*Steve has been removed from the critical path.*
