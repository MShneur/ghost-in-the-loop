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

Ghost now fails closed when the page no longer matches a reviewed adapter. It can
identify a composer heuristically, but only one unique, reviewed Send control has
authority to click. If delivery cannot be independently confirmed, Ghost pauses
in an **uncertain** state and never sends the prompt again behind your back.

### Export

Every transcript export reports one of three outcomes:

- **Complete** — a platform archive returned the expected supported turns.
- **Partial** — a DOM fallback, lazy-loaded history, attachment, branch, or filter
  means completeness cannot be proved.
- **Failed** — no usable messages were captured, so no misleading empty export is
  presented as success.

Markdown and `gitl.transcript.v1` JSON include this validation result. Cancel
aborts the active archive request and promises no file.

Because eventually someone will ask *"wait, how did we get this result?"*

And for once, you'll have an answer.

### Handoff and Experimental Capsule

One click. Ghost writes a compressed briefing — mission, current position, last output, open questions — formatted for immediate paste into any AI model.

The baton passes. The work continues. Nobody has to explain anything from scratch.

The separate Capsule v2 machine format is under **Export → Advanced**. It
preserves short and repeated turns, but it is explicitly experimental and Ghost
does not claim that it is resumable until an importer exists.

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
| **Boot safety** | Transactional boot isolates optional subsystems, mounts a fail-loud banner for critical failures, and records stable local error codes. An independent canary distinguishes “Ghost failed” from “the userscript manager never injected it.” |
| **Signal detection** | Weighted scoring: custom sigils `[[GITL::PROCEED]]` / `[[GITL::HALT]]` (+4), legacy keywords (+3), fuzzy matches (+2). HALT always wins ties. |
| **Private diagnostics** | Network telemetry stores timing and byte counts only. Reports omit prompts, message text, full URLs, query strings, and conversation identifiers; users review locally before copying or downloading. |
| **At-most-once send** | A two-phase tab lease gates one reviewed button click. State advances only after an assistant transition or correlated composer-plus-generation evidence. Ambiguity pauses for human reconciliation; there is no blind retry, Enter fallback, or learned Send actuator. |
| **Anti-automation delay** | Randomized 8–15s between sends (2s on the first round). |
| **Truthful export** | Platform API capture is checked against expected counts and unsupported parts. DOM capture is always labeled partial. Capsule hashes are integrity hints, never a reason to delete legitimate repeated turns. |
| **Transactional import** | Config and Workshop bundles require exact schemas, validate every field before mutation, and roll back if persistence fails. |
| **Own-UI isolation** | All DOM selectors exclude `#gitl` descendants. Ghost cannot accidentally type into its own panel. This needed to be a feature. |
| **CI tested** | 371 unit tests (jest) plus Playwright boot-timing and send-safety tests in Chromium and Firefox. Runs on every push and pull request. |

---

## Architecture

```
Layer 0:   Transactional boot + two-phase tab lease
Layer 0.5: Metadata-only network telemetry
Layer 0.7: Selector diagnostics + health scoring
Layer 1:   Reviewed platform adapters; read-only selector learning
Layer 2:   State + persisted send transaction journal
Layer 3:   Redacted diagnostics + bounded timeline
Layer 4:   Signal engine (pure logic)
Layer 5:   At-most-once loop engine + human reconciliation
Layer 6:   Validated export + transactional import
Layer 7:   Basic controls + progressively disclosed advanced UI
```

The userscript is the canonical source. `npm run build` deterministically
generates `extension/content.js`; CI rejects drift. There is no second `dev/`
copy of the product.

No runtime dependencies. One userscript source. Works anywhere Tampermonkey works.

---

## Safety and Troubleshooting

- **Pause** and **Stop** are always text-labeled. Stop preserves the run; Reset is
  a separate Advanced action.
- A guessed Send candidate is diagnostic evidence only. Generic/custom sites are
  manual-send unless they have a reviewed adapter.
- If Ghost attempted a Send but cannot prove delivery, choose either **I see it
  in chat** or leave the prompt for manual Send. Ghost never re-clicks.
- On a failure, open **Settings → Advanced → Diagnostics**. Ghost automatically
  prepares a redacted local report with a stable error code and offers **Review**,
  **Copy**, and **Download**. Public bug reporting never includes report content
  automatically.
- If no Ghost UI or error banner appears at all, install the independent canary
  from [`diagnostics/`](diagnostics/) to determine whether the userscript manager
  executed on that site.

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

Release 8.3.0 was updated by MShneur. Main editor: **Agent CG (ChatGPT)**.

---

## License

AGPL-3.0 — see [LICENSE](LICENSE).

---

*Humanity achieved godlike AI. The last bottleneck was a guy named Steve.*

*Steve has been removed from the critical path.*
