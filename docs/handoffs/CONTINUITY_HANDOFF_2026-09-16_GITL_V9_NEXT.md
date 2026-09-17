# Ghost in the Loop — v9 Continuity Handoff

Date: 2026-09-16
Owner: Michael S
Repo: `MShneur/ghost-in-the-loop`
Handoff branch: `handoff/v9-next-2026-09-16`
Authority rule: current GitHub state outranks this handoff if newer commits/PRs/issues exist.

## TAKEOVER INSTRUCTION

Do not reconstruct Ghost from chat history. Start from current GitHub truth, then use this handoff as the continuity map.

Activate **Alt-ssembly Required** first. On boot, dynamically refresh the current versions of:

- Personal Forge / Forge skill and `MShneur/Personal-Forge`
- `MShneur/Agents-of-AI`
- `MShneur/CTRL-AI`
- `MShneur/R-Duck`

Use those systems selectively. Do not freeze today’s methods into the project if newer canonical versions exist.

## CURRENT AUTHORITY SNAPSHOT

Current `main` head observed for this handoff:

`d2dd2d82400262d7555612f809c170c23a9adff7`

Current root userscript:

`ghost-in-the-loop.user.js`

Current userscript version:

`9.0.0-alpha.2`

The root userscript is now the normal candidate path. The temporary `/v9/` install path was removed.

PR #46 merged the v9 core rewrite into `main`. Treat 8.8.x branches and PRs as failure archaeology / feature sources unless a specific behavior is intentionally recovered into v9.

## PRODUCT PHILOSOPHY — DO NOT REGRESS THIS

**The AI chat is the reasoning/orchestration engine. Ghost is the mechanical relay and product shell.**

Transport invariant:

`setComposerText -> find/reacquire one valid Send -> click once -> confirm once`

Everything else may influence the prompt, UI, export, settings, or product shell. It must not create a second Send authority.

Preserve:

- at-most-once Send;
- fail closed on ambiguity;
- no Enter / requestSubmit / alternate-actuator escalation after a Send attempt;
- no automatic resend after uncertain acceptance;
- no controller-side semantic interpretation of the conversation body;
- no controller-owned roadmap reasoning;
- no browser/model ranking logic inside Play.

## CURRENT V9 CORE

Play currently:

- has host profiles for Perplexity, ChatGPT, and generic fallback;
- stages continuation text mechanically;
- reacquires current composer/Send after framework reconciliation;
- clicks exactly one selected Send control;
- confirms using generation start / user turn count / composer clear / changed assistant output;
- pauses on uncertainty;
- uses exact terminal markers;
- binds send handling to the prior assistant hash to avoid stale-output replay;
- waits longer before declaring missing terminal / protocol drift.

Export is independent of Play.

Current documented export behavior:

- ChatGPT attempts `/backend-api/conversation/{id}`;
- Perplexity attempts `/rest/thread/{slug}`;
- DOM fallback is labeled partial;
- Export failures must never change Play state.

## KNOWN NEXT WORK — PRIORITY ORDER

### P0 — REAL FIELD PROOF

The v9 alpha is not physically certified yet.

Required real Firefox Android / Tampermonkey canary:

1. Perplexity: at least 5 consecutive PROCEED cycles.
2. ChatGPT: at least 5 consecutive PROCEED cycles.
3. No duplicate user turns.
4. HUMAN pauses immediately.
5. HALT completes immediately.
6. Missing terminal does not interrupt a still-streaming answer.
7. Copy report describes transport state honestly.
8. Page Reload performs a real page reload.
9. Export labels source and partial/full state truthfully.

Do not promote fixture/browser-mock success to field certification.

### P0 — TERMINAL PARSER NORMALIZATION

Current `terminal()` only accepts the final newline-delimited line as an exact marker.

A known mock/host condition can flatten:

`Chunk 1\n[[GITL::PROCEED]]`

into:

`Chunk 1 [[GITL::PROCEED]]`

without changing the semantic terminal marker.

Patch this mechanically, not semantically:

- exact final-line marker remains preferred;
- allow a valid marker only as the final whitespace-separated suffix of the entire response;
- same rule for `[[AOA::RELAY:MODEL_LABEL]]`;
- do not scan arbitrary interior text for markers;
- record whether normalization occurred;
- add positive and negative tests.

The parser must still reject a marker followed by extra non-whitespace text.

### P1 — EXPORT RESTORATION / ALPHA.3

A prior local candidate was built but was not pushed to GitHub. Treat the following as a specification, not as an available branch.

Required behavior:

- API-first capture where the host exposes a usable conversation/thread endpoint;
- Perplexity parser should support paginated `entries` / `steps`, including `query_str` and `final_response` where present;
- DOM is a fallback / completeness cross-check, not automatically the primary source;
- Markdown and JSON formats;
- visible platform-exposed thinking/reasoning toggle only — never hidden chain-of-thought;
- optional raw platform data in JSON;
- novice-facing descriptions under options;
- replace jargon such as `DOM partial` with plain language such as `Page backup — older or collapsed messages may be missing.`;
- truthfully report source and completeness confidence;
- no Export action changes Play state.

### P1 — RESTORE PRODUCT FEATURES REMOVED BY OVER-SIMPLIFICATION

The v9 controller simplification was correct for **Play transport**, but it removed unrelated product surfaces that should be restored without reintroducing controller reasoning.

Restore as UI / prompt / preference / export features:

- skins / colors / theme customization;
- sound and completion notifications;
- Quick Start / novice help;
- personas including Researcher and custom personas;
- Deep Research, R&D Lab, Shipyard, Debate, Pre-Mortem and other prompt-driven workflows;
- Locked / Adaptive / Audit postures as prompt clauses;
- custom persona/workflow import;
- numbered roadmap / stage display driven by strict AI-emitted control markers, not semantic controller parsing;
- Auto / Flow style staged execution where the AI owns the plan and Ghost only displays strict markers;
- export controls including Markdown/JSON and visible-thinking option.

Hard restoration rule:

**Everything may influence the prompt. Only Play may influence Send.**

Do not restore the old semantic roadmap parser or Alpha/Beta/Gamma/Delta Send engines.

### P1 — NEW `↑ TOP` NAVIGATION BUTTON

Owner request: add a clearly visible **`↑ Top`** button beside **`↻ Page`** in the Play/top action row.

Current row is effectively:

`▶ Play | ■ Stop | ↻ Page`

Desired row:

`▶ Play | ■ Stop | ↻ Page | ↑ Top`

User job:

On very long conversations, the user wants one button that gets back to the beginning / first prompt without manually swiping through many turns.

Functional requirements:

1. Button is navigation-only. It must never inject a prompt, click Send, change terminal state, or create a second transport path.
2. First target ChatGPT + Perplexity; generic safe fallback allowed.
3. It must handle long/lazy-loaded/virtualized history better than one naive `window.scrollTo(0,0)`.
4. Preferred behavior:
   - identify the host’s actual conversation scroll container when possible;
   - scroll that container to its current top;
   - wait briefly for older history to load;
   - repeat bounded upward scrolling while earlier content is appearing;
   - stop when no further upward progress/history growth occurs or a strict timeout/iteration limit is reached;
   - fall back to `document.scrollingElement` / window only when no better host container is found.
5. Do not steal keyboard focus from the composer after navigation.
6. Do not move the Ghost panel itself.
7. Mobile control must remain compact and touch-friendly.
8. Provide small status feedback such as `At top`, `Loading older chat…`, or `Could not reach earlier history`.
9. Decide explicitly what happens while Play is RUNNING. Preferred safety default: do not disturb an active loop; either disable `↑ Top` while RUNNING or prove that host virtualization cannot break current-answer observation.
10. Add a long-chat browser regression covering the deliberate scroll without accidental Send, URL/hash mutation, or Ghost-panel jump.

A dedicated branch was created for this work:

`feature/v9-top-navigation`

No product change was committed there as of this handoff. Inspect current state before editing.

### P1 — RELEASE / PACKAGE IDENTITY

Current root userscript is `9.0.0-alpha.2`, while `package.json` and `extension/manifest.json` still identify `8.8.5`.

Do not call the v9 product release-ready until package / extension / generated runtime identity is intentionally reconciled.

Decide whether the current development lane is:

- userscript-only alpha while extension/package remain historical, or
- a full v9 candidate requiring generated extension parity.

Then make the identity truthful and testable.

### P2 — DYNAMIC EXTERNAL ACTIVATORS

Current v9 userscript still pins PLEX / Model Relay to the historical Agents-of-AI branch:

`feature/plex-universal-model-relay`

Before changing it, inspect current Agents-of-AI main and determine whether those components are now canonical there. Prefer current canonical sources over stale branch pinning, but do not break activators merely for cosmetic consistency.

### P2 — LEGACY REPO CLEANUP

Open legacy items still exist, including PR #39 and 8.8.x issues/recovery branches.

Do not delete useful evidence before v9 is field-proven.

After v9 acceptance:

- label/close superseded 8.8 issues and PRs accurately;
- preserve field-failure history that still explains safety boundaries;
- identify old branches safe to archive/delete;
- avoid allowing stale 8.8 instructions to become current authority again.

## `↑ TOP` IMPLEMENTATION NOTES

Do not hardcode a single browser’s page scrollbar without first checking the host container.

Candidate mechanical helper shape:

```js
async function goToConversationTop() {
  // navigation only — zero Play/Send authority
  // 1. find host conversation scroll container
  // 2. set scrollTop = 0 / scrollTo({top:0})
  // 3. wait for lazy history load
  // 4. repeat while earlier content / scrollHeight changes
  // 5. bounded timeout / max iterations
  // 6. report result
}
```

A robust scroll-container detector can walk ancestors of an actual conversation turn and prefer a connected element where:

- `scrollHeight > clientHeight` materially;
- computed `overflowY` is `auto` or `scroll`;
- it is not Ghost-owned UI.

Fallback:

```js
const scroller = document.scrollingElement || document.documentElement;
scroller.scrollTop = 0;
```

This is a navigation helper, not a host-control actuator. It should not be added to the Send authority system.

## FAILURE ARCHAEOLOGY — KEEP THE LESSONS, NOT THE OLD ARCHITECTURE

Useful older evidence:

- authenticated host behavior can differ from signed-out fixtures;
- composer insertion can succeed while Send still fails;
- React/Lexical/ProseMirror may replace editor nodes after injection;
- selectors can drift by account, experiment, browser, and auth state;
- hidden/duplicate/menu controls must not gain Send authority;
- uncertainty after one Send attempt must stop automatic recovery;
- stale tests can encode obsolete architecture;
- mobile Firefox is a real release lane, not implied by desktop tests;
- a fix that deletes unrelated working features is an overcorrection, not simplification.

Do not revive:

- Alpha/Beta/Gamma/Delta production Send routing;
- requestSubmit/Enter escalation chains;
- semantic roadmap inference;
- controller-owned committees/personas;
- automatic model switching based on Ghost-side ranking;
- auto-resend after uncertainty.

## ALT-SSEMBLY REQUIRED — REQUIRED METHOD

Use the current installed / live **Alt-ssembly Required** agent, not a frozen copy from this handoff.

At minimum produce one compact Assembly Card before substantive edits:

```text
USER JOB:
CURRENT TRUTH:
DELTA:
PRESERVE:
RUNTIME PATH:
NOVICE PATH:
PROOF REQUIRED:
KILL: none unless human-approved
NEXT ACTION:
```

Then maintain:

- Product Packet;
- Runtime Envelope;
- Novice Contract;
- Evidence Contract;
- Preservation Ledger.

Auto-fire Cleanerz if:

- a fix starts fixing a previous fix;
- a third patch attacks the same path without isolated cause;
- a working feature disappears during simplification;
- test volume grows while the required real path remains untested;
- a second architecture appears beside the canonical one.

Use Quorum / named real practitioners only for material decisions; named people are method sources, not simulated participants.

## PERSONAL FORGE / ECOSYSTEM BOOT

When available, prefer the installed Personal Forge skill/tool and current repo authority.

Personal Forge current entrypoint is `START_HERE.md`; follow its current path map and project state rather than guessing directory names from this handoff.

Refresh current:

- Agents-of-AI methods;
- CTRL-AI governance;
- R-Duck operating/routing rules;
- Personal Forge tool/connector registry;
- browser/Oracle testing surfaces actually available in the new chat.

Do not claim a tool or browser path exists until the new chat confirms it.

## TEST / PROOF EXPECTATIONS

For source changes:

- `node --check ghost-in-the-loop.user.js` minimum;
- focused unit/source-contract tests for changed behavior;
- focused browser regression for UI/navigation/Play changes;
- adjacent-breakage check;
- package/generated parity only if the candidate owns those artifacts;
- no GitHub-hosted Actions unless explicitly justified/approved under current R-Duck/CTRL-AI conservation rules;
- field canary remains required for real Firefox Android support claims.

For the new `↑ Top` control, specifically prove:

- button exists next to Reload/Page;
- clicking it causes zero Send clicks;
- it causes zero prompt injection;
- it does not mutate loop state;
- it intentionally changes only the conversation scroll position;
- long-history lazy loading is bounded;
- mobile viewport remains usable;
- Ghost panel position does not jump.

## DEFINITION OF DONE FOR THE NEXT ANALYSIS CHAT

Do not immediately code everything.

The first new-chat deliverable should be a concise, evidence-backed takeover report that:

1. confirms live current repo / branch / PR / issue state;
2. confirms Alt-ssembly + current ecosystem boot;
3. produces the Assembly Card and Preservation Ledger;
4. separates `NOW / NEXT / LATER / REJECT` work;
5. identifies which old 8.8 artifacts are source material versus obsolete architecture;
6. gives the smallest safe implementation order;
7. includes the `↑ Top` button in the product map;
8. states exactly what can be tested autonomously and what still requires the owner’s phone/session;
9. does not claim Ghost is fixed until the required real path is proven.

## RECOMMENDED IMPLEMENTATION ORDER AFTER ANALYSIS

1. Verify current main and all newer state.
2. Patch/test terminal suffix normalization if still broken.
3. Build/test `↑ Top` navigation as an isolated UI/navigation change.
4. Rebuild API-first Export + novice export UI from the recorded specification.
5. Restore rich UI/prompt-driven product surfaces without touching Play transport.
6. Reconcile package/extension identity.
7. Run focused autonomous tests.
8. Run bounded real Firefox Android ChatGPT + Perplexity canary.
9. Only then decide release/promotion and legacy cleanup.

## NEW-CHAT STARTER PROMPT

Paste this into a fresh chat:

> Take over **Ghost in the Loop v9**. Do not reconstruct the project from chat history.
>
> First activate **Alt-ssembly Required** and let it dynamically refresh current **Personal Forge, Agents-of-AI, CTRL-AI, and R-Duck**. Use current repo/tool state, not frozen copies.
>
> **GitHub is implementation authority.** Read current `MShneur/ghost-in-the-loop` state first, including current `main`, open PRs/issues, recent commits/branches, and this handoff:
>
> `docs/handoffs/CONTINUITY_HANDOFF_2026-09-16_GITL_V9_NEXT.md`
>
> Handoff branch: `handoff/v9-next-2026-09-16`
>
> Current observed main when the handoff was written: `d2dd2d82400262d7555612f809c170c23a9adff7`, userscript `9.0.0-alpha.2`. Newer GitHub state outranks that SHA.
>
> Your first job is **analysis and product reconciliation, not immediate bulk coding**. Build the Alt-ssembly Assembly Card + Preservation Ledger, then classify the work `NOW / NEXT / LATER / REJECT`.
>
> Pay special attention to:
> - real Firefox Android field proof for Play;
> - the terminal-marker flattened-suffix parser bug;
> - API-first Export + Markdown/JSON + visible-thinking + novice language;
> - restoring skins, sound/notifications, help, personas, workflows, postures, roadmap/stage display, custom imports, and other prompt/UI features removed by v9 simplification **without restoring controller-side reasoning or alternate Send engines**;
> - package/extension identity still showing 8.8.5 while the root userscript is v9 alpha;
> - stale external activator branch pinning;
> - legacy 8.8 PR/issues as archaeology rather than current architecture;
> - the new owner requirement: add a compact **`↑ Top`** button beside **`↻ Page`** that can reach the first prompt in very long/lazy-loaded chats without any Send authority or loop-state side effects. A placeholder branch `feature/v9-top-navigation` exists; inspect it before use.
>
> Preserve the hard invariant: **everything may influence the prompt; only Play may influence Send.** Preserve one-click/one-confirmation and fail closed after uncertainty.
>
> Use current Agents-of-AI specialists selectively (Origin, Cleanerz, Root Cause, Stresstest, Buildhouse, Quorum, etc.) rather than duplicating them. Use named real practitioners only as sourced method lenses for material decisions.
>
> At the end of the first pass, give me only: **Ready / Not ready / Blocked**, the top 5 issues in implementation order, what you can test autonomously now, and the one next action. Put detailed evidence in GitHub/Forge rather than dumping it into chat.

## HANDOFF STATUS

This handoff records the next product pass. It does **not** certify v9, does **not** merge the `↑ Top` feature, and does **not** authorize release.
