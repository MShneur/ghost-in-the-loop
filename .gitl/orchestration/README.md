# Ghost Autonomous Round Orchestrator

This directory is the durable control plane for the staggered ChatGPT workers that continue Ghost in the Loop 8.8. It is separate from product code but authoritative for autonomous planning, assignments, evidence, leases, and stopping behavior together with `.gitl/autopilot-state.json`, the current round plan, the canonical Personal-Forge maker, and explicit user directives.

## Current operating model

The canonical operating mode is **`continuous-local-human-gates`**.

Six scheduled wakes normally provide these perspectives:

1. Supervisor / integrator
2. Researcher / architect
3. Builder
4. Test engineer / Red Team
5. Mobile, browser, accessibility, and performance specialist
6. Devil's Advocate / release auditor

The timer slot is **wake cadence, not assignment ownership**. The earliest dependency-ready assignment controls scope. Any eligible successor may execute a missed, delayed, failed, or abandoned assignment when the succession and lease rules permit it, while preserving that assignment's intended role, method, acceptance criteria, evidence path, and safety limits.

The **supervisor function** remains the roadmap authority: supervisor assignments create, reorder, accept, reject, reopen, or retire official roadmap work. That authority belongs to the supervisor assignment, not permanently to one timer identity. An eligible successor executing a missed supervisor assignment acts in the supervisor role for that bounded step.

## Canonical files

- `../autopilot-state.json` — authoritative round, branch, lease, stop state, dispatch, and current evidence limits.
- `round-plan.json` — required programs, assignments, dependencies, acceptance criteria, and evidence status.
- `task-prompts.md` — universal worker execution contract.
- `evidence-contract.md` — durable evidence format.
- `agent-succession-rule.md` — active-work exclusion, stale/incomplete-handoff recovery, and successor behavior.
- `../deferred-questions.md` — local human questions and their resolutions.
- `../user-directives/` — explicit user authority that can refine the operating policy without weakening platform safety.
- `../briefs/` — user requirements and exploratory product briefs.
- `../evidence/round-N/` — durable worker evidence for supervisor, auditor, and human review.

Chat summaries are convenience only. GitHub state, commits, CI, and durable evidence are authoritative.

## Assignment selection and succession

At every wake:

1. Read the latest canonical maker first, then state, plan, succession rule, task prompt, evidence contract, deferred questions, applicable user directives, and assignment-linked evidence/briefs.
2. Check the shared lease, branch movement, and GitHub Actions for genuine active conflicting work.
3. Find the **earliest dependency-ready** assignment whose status is `ready`, `retry-ready`, or equivalent.
4. Execute that assignment even if its intended worker number differs from the current timer slot.
5. Preserve assignment scope. A role mismatch, missed timer, previous failed test with a ready recovery, or already-answered/local human question is not a reason to stall.
6. A failed or blocked step must become durable evidence and expose the smallest dependency-safe continuation rather than being narrated as success.

A valid active lease plus evidence of continuing conflicting work requires `HOLD`. An expired or stale lease is not reclaimed merely because time passed: inspect branch/workflow activity first. An incomplete handoff may be repaired before nominal expiry only when durable evidence proves the holder finished and no continuing work exists, as defined by `agent-succession-rule.md`.

## Shared lease

There is one shared lease for repository and coordination writes.

Before writing, a worker must:

1. Re-read the latest state and branch head.
2. Check branch-changing workflow activity and recent branch movement.
3. Claim the 45-minute shared lease against the latest state-file blob/commit.
4. Record holder, assignment, intended/executed role, nominal worker, acquisition/expiry, and inspected head.
5. Re-read state to confirm ownership before other writes.

A worker must stop if unexpected conflicting branch movement appears after acquisition. It must release the lease during the durable handoff, or record an explicit incomplete-handoff object if that transaction cannot be completed.

## Local human gates

Human questions are **local gates by default**, not global freezes.

A question blocks only the branch or decision that actually depends on it. Independent reversible work continues when dependencies allow. The deferred queue records the question, affected decision, fallback behavior, and eventual answer. Only a genuine project-wide irreversible/publication/security decision should globally stop independent work.

The accepted Round-4 and Round-5 review decisions remain bounded to their recorded evidence. Round-6 read-only live inspection is authorized when a functioning carrier exists; absence of qualifying live capture limits live-host certification but does not prohibit deterministic fixture/release-path work.

## Delivery-Pressure Checkpoint

The canonical Personal-Forge maker v1.1 Delivery-Pressure Checkpoint applies.

Research fallback is temporarily ineligible whenever a safe, reversible implementation, repair, test, certification, documentation, packaging, dependency-audit, or release-evidence artifact is dependency-ready. A delivery review is forced after the maker's pressure threshold (including six research-only wakes or twelve hours without delivery review), and the smallest falsifiable artifact takes priority over another research loop.

Research fallback is still available when no executable assignment exists, but it must never compete with active implementation/test/release work or invent a global blocker from missing local/live evidence.

## No-stall durable handoff

Before ending a write-bearing wake, the worker must complete as much of this transaction as the connector permits:

1. Commit the implementation/artifact and required evidence.
2. Update the current assignment status.
3. Activate the earliest dependency-safe successor.
4. Update state `currentStep` and `nextAction`.
5. Release the lease.
6. Re-read canonical state to verify the handoff.

If an operation fails, write an explicit incomplete-handoff record so the next worker can recover it immediately. Work must not exist only in chat.

## Evidence and test discipline

Use Repo Nanny when available, sweep before patching, reproduce before repair, inspect adjacent damage, and distinguish repository evidence, external evidence, and inference.

Do not claim a test passed without an exact command result, CI run/job, or recorded artifact. Stale-head, queued, cancelled, unrelated, or synthetic-only evidence cannot be promoted beyond what it proves. For product changes, use applicable syntax, generated parity, unit, base certification, browser, mobile, version, packaging, and checksum gates.

When local execution is unavailable, a temporary guarded GitHub Actions carrier may be used only within the active assignment's permissions. It must guard the expected head, preserve logs/artifacts, remove temporary machinery, and obtain ordinary clean-head CI before certification when required.

## Required release programs

Do not silently remove or defer release-critical programs listed by the current plan, including:

- Repair & Resume browser fault injection.
- Frozen/discarded lifecycle recovery.
- Long-chat and constrained-device performance.
- Host-affixed structural mobile-shell work.
- Build/candidate/channel identity.
- Documentation reconciliation.
- Final certification, packaging, and checksums.

### Host-affixed mobile shell

Teal is a real child in the host header action row. Blue is a real final cell in the host composer action row. Red is a real sibling row beneath the composer that expands the host footer upward. Blue and red must participate in normal host layout and must not become viewport overlays.

Accepted structural authority remains fail-closed: a certified site-specific runner requires reviewed site identity plus adapter-owned structural capability/signature; otherwise it demotes to the standard adapter-aware protocol, then to the existing rail fallback when structural verification is absent or uncertain. Structural-mount authority never grants Send authority, and original Send-node identity remains protected.

## Safety boundaries

Workers must never:

- modify `main`;
- merge or enable auto-merge;
- tag, publish, create a GitHub Release, or change the stable public userscript channel;
- replace or clone host Send controls for structural UI;
- weaken Send, CHOICE, route, shared-lease, uncertainty, exact-identity, structural-demotion, or other fail-closed safeguards to obtain a pass;
- silently lower an accepted test threshold to hide hosted variance;
- expand certification beyond exact evidence;
- claim sources, tests, hardware, live-site behavior, or publication state they did not verify.

## Round completion and audit

Rounds may proceed continuously without a global review stop. A round closes only after its audit assignment evaluates the bounded objective and its evidence. If a genuine local human decision remains, queue it and block only dependent work. If execution evidence fails or is missing, activate a recovery before closure unless an actual human/irreversible gate prevents that recovery.

`[[GITL::PROCEED]]`, `[[GITL::CHOICE]]`, `[[GITL::HOLD]]`, and `[[GITL::HALT]]` retain the meanings defined by `task-prompts.md`; the marker is an execution-state summary, not a substitute for the durable repository handoff.
