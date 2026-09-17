# Ghost in the Loop v9 — Master Architect Assembly Pass

Date: 2026-09-16 ET
Role: chief architect / integration authority
Implementation authority: `MShneur/ghost-in-the-loop` current GitHub state
Baseline inspected: `main` @ `d2dd2d82400262d7555612f809c170c23a9adff7`
Primary continuity issue: #47
Continuity handoff: `docs/handoffs/CONTINUITY_HANDOFF_2026-09-16_GITL_V9_NEXT.md`

## Live ecosystem refresh

- Alt-ssembly Required: installed ChatGPT skill loaded; current Agents-of-AI `main` does not expose the expected `agents/alt-ssembly-required.md` or `workflows/alt-ssembly.md` paths, so do not pretend a canonical AoA copy was refreshed from those missing paths.
- Personal Forge: `START_HERE.md`, `control/forge-paths.yaml`, and `control/PROJECT_STATE.yaml` read. Current root project state is focused elsewhere and is not authoritative for GITL implementation; GITL repo remains implementation authority.
- Agents-of-AI: current `main/AGENTS.md` read. Cross-project bounded-worker continuity and no-routine-GitHub-Actions rules apply.
- CTRL-AI: generated `llms-full.txt` identifies current generated protocol as v9.2.1 (newer than the stale v9.0.0 label still present in `llms.txt`/root header). Use v9.2.1 generated protocol for governance.
- R-Duck: `AGENTS.md` + `llms.txt` read; current index version v1.6.0. Use progressive loading and bounded handoffs.

## Assembly Card

**OUTCOME**
A Firefox-Android-first Ghost v9 candidate where Play is mechanically safe and field-proven on ChatGPT + Perplexity, navigation/export/product-shell features are restored without regressing transport authority, and package identity is truthful.

**CURRENT TRUTH**
- BUILT: v9 root userscript architecture; one Play Send actuator; ChatGPT/Perplexity/generic profiles; API-first export skeleton; fail-closed confirmation discipline.
- BROKEN: terminal parser rejects a semantically valid final marker when host/mock newline flattening converts the marker into a final whitespace suffix.
- MISSING: `↑ Top`; restored rich product shell; complete API-first export UX/parsing; v9 package/extension identity parity.
- UNKNOWN / NOT FIELD CERTIFIED: real Firefox Android Play behavior on authenticated ChatGPT + Perplexity for this exact v9 artifact.
- OBSOLETE AS ARCHITECTURE: 8.8 Alpha/Beta/Gamma/Delta production Send-routing designs, Enter/requestSubmit escalation, semantic controller roadmap reasoning.

**PRESERVE**
- `setComposerText -> reacquire one valid Send -> click once -> confirm once`
- at-most-once Send
- fail closed after ambiguity
- no Enter/requestSubmit fallback after actuation
- no automatic resend after uncertain acceptance
- no controller-side semantic reasoning over conversation content
- no second Send authority
- Export must remain independent of Play state
- legacy 8.8 field failures retained as archaeology/evidence until v9 is accepted

**AUTHORIZED DELTA**
- repair terminal suffix normalization mechanically
- extend UI with navigation-only `↑ Top`
- rebuild Export around truthful API-first capture + fallback labeling
- restore non-transport UI/preferences/prompt-driven features
- reconcile release/package identity
- update external activator pins only when canonical replacements actually exist

**KILL**
None authorized beyond already-rejected obsolete 8.8 transport architectures.

**RUNTIME**
Primary release lane: Firefox Android + Tampermonkey, authenticated ChatGPT and Perplexity.
Secondary autonomous proof: source/unit/integration/browser-fixture checks in available environments.
E4 field evidence is required before claiming real mobile host support.

**NOVICE PATH**
Install one candidate -> open supported chat -> Play -> plain-language status/recovery. Export should offer Markdown/JSON with understandable completeness language. `↑ Top` must be a one-tap navigation helper and should be disabled while Play is RUNNING unless later field evidence proves safe coexistence.

**PROOF**
Claim ceiling before phone field run: E3 browser/fixture only. Release claim requires E4 on exact artifact: >=5 consecutive PROCEED cycles per ChatGPT and Perplexity, no duplicates, HUMAN/HALT immediate, uncertainty fails closed, export/source labeling truthful, Reload real, Top safe.

**NEXT MOVE**
Batch 1: repair terminal suffix parser with positive/negative tests. No UI restoration mixed into this batch.

## Preservation Ledger

| Surface | Status | Authority | Notes |
|---|---|---|---|
| Play Send actuator | BUILT | preserve | Sole Send authority. Never add peer engines. |
| Composer staging/reacquire | BUILT, field-uncertified | preserve/repair only with isolated cause | Do not revive Alpha/Beta/Gamma/Delta routing. |
| Send confirmation/fail-closed | BUILT, field-uncertified | preserve | One click, one confirmation; uncertainty pauses. |
| Terminal marker parser | BROKEN | repair | Final exact line preferred; allow only valid final whitespace suffix; no interior scan. |
| `↑ Top` | MISSING | extend | Navigation only; disabled while RUNNING by default; bounded lazy-load loop. |
| Page Reload | BUILT | preserve | Must remain real reload. |
| Export capture | PARTIAL | repair/extend | API-first; DOM fallback labeled partial; no Play-state effects. |
| Markdown/JSON export UI | MISSING/PARTIAL | extend | Novice wording, visible platform-exposed reasoning only, optional raw JSON. |
| Skins/colors | MISSING from v9 shell | restore | UI/preference only. |
| Sound/completion notifications | MISSING from v9 shell | restore | Must not steal composer focus or influence Send. |
| Quick Start/help | MISSING | restore | Novice-first. |
| Personas/workflows/postures | MISSING from v9 shell | restore | Prompt clauses/templates only; AI owns reasoning. |
| Stage/roadmap display | MISSING | restore with constraint | Strict AI-emitted control markers only; no semantic controller inference. |
| Custom imports | MISSING | restore | Prompt/UI data only. |
| Package version | 8.8.5 | repair before release | Root userscript is v9 alpha; identity currently divergent. |
| Extension manifest version | 8.8.5 | repair before release | Decide userscript-only alpha vs full v9 package candidate. |
| AoA PLEX/Model Relay pin | historical branch | observe-only now | `Agents-of-AI/main` currently does not contain `modes/plex.md`; do not repoint to 404 paths. |
| Legacy 8.8 PR/issues/branches | obsolete as current architecture | observe-only until v9 field pass | Failure archaeology; cleanup later. |

## Work classification

### NOW
1. Terminal suffix normalization + focused tests.
2. `↑ Top` on `feature/v9-top-navigation`, isolated from Play transport; disabled while RUNNING for first candidate.
3. API-first Export completion + novice language + Perplexity entries/steps parsing.
4. Restore rich UI/prompt-driven surfaces without touching Send authority.
5. Reconcile package/extension identity before release candidate.
6. Autonomous regression pass on exact candidate.
7. Owner E4 Firefox Android canary on ChatGPT + Perplexity.

### NEXT
- evaluate external activator source migration only after current AoA canonical files exist; current `main` lacks the required PLEX path.
- fold accepted restored UI into generated extension parity if full v9 package lane is chosen.
- release/canary decision after E4 field proof.

### LATER
- close/label/archive superseded 8.8 issues, PRs, and branches after v9 acceptance.
- broaden field matrix beyond ChatGPT + Perplexity.
- longitudinal E5 reliability checks.

### REJECT
- Alpha/Beta/Gamma/Delta as production Send engines.
- Enter/requestSubmit escalation.
- auto-resend after uncertain click.
- controller-side semantic roadmap/persona/model ranking logic.
- any `↑ Top` behavior that changes prompt, Send, loop state, URL/hash, or Ghost panel position.
- repointing activators to canonical paths that do not actually exist.

## Implementation order / batch architecture

### Batch 1 — Terminal parser repair
Owner method: Root Cause + Buildhouse + Stresstest.
Allowed surface: terminal parsing helper(s) + focused tests only.
Forbidden: Play transport choreography, Export, UI restoration, package versions.
Acceptance: exact-line behavior preserved; flattened final suffix accepted; interior marker and marker-followed-by-text rejected; normalization recorded.
Return: commit SHA, changed files, tests, residual risk.

### Batch 2 — `↑ Top` navigation
Branch: `feature/v9-top-navigation` (currently exactly at baseline main SHA; no product delta yet).
Owner method: Origin for authority boundary -> Buildhouse -> Stresstest.
Allowed: top action row, scroll-container detection helper, navigation status, focused long-chat regression.
Forbidden: composer mutation, Send selection/click/confirmation, terminal state, URL/hash, panel movement.
RUNNING behavior: disabled while Play is RUNNING for first candidate. Reconsider only with direct proof.
Acceptance: ChatGPT/Perplexity-oriented container detection; bounded repeated upward scroll for lazy loading; safe generic fallback; touch-friendly; no focus theft; no accidental host action.

### Batch 3 — Export restoration
Owner method: Origin + Buildhouse + Stresstest.
Allowed: export capture/parsing/UI only.
Forbidden: Play state or Send authority.
Acceptance: ChatGPT API-first path; Perplexity entries/steps support; Markdown/JSON; visible platform-exposed reasoning toggle only; raw JSON optional; truthful source/completeness; DOM fallback plainly labeled.

### Batch 4 — Product-shell restoration
Owner method: Origin + Cleanerz + Buildhouse + Human Gate on scope conflicts.
Restore: skins/colors, sounds/notifications, Quick Start/help, personas, workflows, postures, strict-marker stage display, custom imports, advanced export controls.
Hard boundary: prompt/UI/preference features may influence prompts but never create Send authority or controller semantic reasoning.
Split into sub-batches with disjoint file/surface ownership if the implementation touches shared monolithic userscript sections.

### Batch 5 — Identity / generated parity
Owner method: Repo Nanny + Buildhouse.
Decision gate: userscript-only v9 alpha OR full v9 package/extension candidate.
Acceptance: all distributed artifacts truthfully identify the chosen lane; generated content matches source; no stale 8.8.5 identity in a claimed v9 package.

### Batch 6 — Autonomous integration / adversarial proof
Owner method: Stresstest + Repo Nanny.
No GitHub-hosted Actions unless explicitly human-approved.
Run source syntax, focused unit/integration, browser fixture, long-chat navigation, adjacent regression, generated parity as applicable.
Claim ceiling: E3 until phone field run.

### Batch 7 — Owner field canary
Human Gate + exact-artifact E4.
Firefox Android/Tampermonkey authenticated ChatGPT + Perplexity.
Minimum per host: 5 consecutive PROCEED cycles; no duplicates; HUMAN immediate; HALT immediate; still-streaming missing-terminal case safe; report truthful; reload real; export truthful; Top safe.
Any ambiguous post-click result = stop and inspect, never automatic retry.

## Worker dispatch contract

Every worker chat receives:
- exact batch number and objective;
- baseline SHA/branch;
- named methods to load (only those needed);
- owned files/surfaces;
- forbidden surfaces;
- architecture invariant: **Everything may influence the prompt. Only Play may influence Send.**
- required tests/evidence;
- explicit stop condition;
- one return path: update this master handoff with commit SHA, evidence, deviations, and unresolved risks.

Workers must not create a competing master plan. If implementation reality conflicts with this card, they STOP and return the conflict to the architect lane.

## Current repo reconciliation notes

- `main` is still `d2dd2d82400262d7555612f809c170c23a9adff7` at this pass.
- Open PR #39 remains an 8.8.3 artifact and is not current architecture.
- Issue #47 is the v9 next-pass control issue.
- `feature/v9-top-navigation` exists and currently points to the same `d2dd2d...` baseline; no Top implementation has landed there yet.
- `package.json` version remains `8.8.5`.
- `extension/manifest.json` version remains `8.8.5`.
- current terminal parser still takes only the last newline-delimited line and therefore still contains the flattened-suffix bug.
- current userscript still pins PLEX/Model Relay to `feature/plex-universal-model-relay`; `Agents-of-AI/main/modes/plex.md` is currently absent, so migration is NOT approved yet.

## Master architect rule

This file is the first-pass architecture control record for worker batches. GitHub implementation evidence always outranks it. After each returned worker handoff, reconcile actual branch/commit/test state here before dispatching the next batch. Do not merge multiple feature batches merely because they are individually green; preserve isolation until integration review.