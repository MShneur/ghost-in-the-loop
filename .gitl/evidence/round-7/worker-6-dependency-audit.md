# Round 7 — R7-A2-DEPENDENCY-AUDIT

## Worker identity

- Assignment: `R7-A2-DEPENDENCY-AUDIT`
- Executed role: release-dependency-auditor successor
- Lease holder: `scheduled-worker-2-r7-a2-dependency-audit-11`
- Isolated branch: `agent/8.8-repair-resume`
- Inspected pre-claim head: `a5eb7e18e9191beb26577d849a4aa1a9f4eb8465`
- Lease-claim commit: `fc36fc747149a00e14119f517b1b036406d65451`

## State and authority read

Read the canonical Personal-Forge maker v1.1 first, then current `.gitl/autopilot-state.json`, Round-7 plan, task/orchestration rules, succession rule, evidence contract, deferred-question queue, explicit release-pressure directive, and A1 build-identity evidence. The Delivery-Pressure Checkpoint made this executable dependency audit higher priority than research. R4/R5 remain accepted only at their recorded bounded scopes. R6 read-only inspection remains authorized while exact current live ChatGPT/Claude structural insertion remains not certified. `publishReady` remains false.

## Bounded step

Capture exact lockfile-bound npm advisory evidence without modifying dependencies, then distinguish development/build/test exposure from shipped-payload reachability. No `npm audit fix`, package upgrade, product change, version change, channel change, merge, tag, release, or publication action was authorized or performed.

## Exact execution evidence

A temporary lease-guarded audit carrier was added at commit `8783de3310ad90e9cc7725dd432931b12f9133a8` and executed on GitHub Actions:

- Run: `31250069277`
- Job: `93084916423` (`audit`)
- Runtime: Node `v20.20.2`, npm `10.8.2`
- `npm ci`: PASS
- full `npm audit --json`: exit `1`, exactly **2 high** findings, 0 critical/moderate/low/info findings
- `npm audit --omit=dev --json`: exit `0`, exactly **0 vulnerabilities**
- Raw machine-readable evidence: `.gitl/evidence/round-7/dependency-audit.json`
- Raw evidence commit: `f39efa7dd006dc641551898de00a156a95160eb2`

The root `package.json` has no production `dependencies`; its only declared packages are dev dependencies (`@playwright/test`, `jest`, `jest-environment-jsdom`). The raw evidence includes `npm explain --json` dependency paths for every vulnerable package.

## Findings

### 1. `brace-expansion`

- Installed: `brace-expansion@1.1.15`
- Node path: `node_modules/brace-expansion`
- npm severity: high; indirect; `fixAvailable: true`
- `npm explain` classifies the installed node as `dev: true` and traces it through the Jest/tooling graph, including `minimatch@3.1.5` -> `glob@7.2.3` -> Jest packages -> root dev dependency `jest@29.7.0`.
- Advisory inputs recorded by npm:
  - `GHSA-3jxr-9vmj-r5cp` / source `1123897` — DoS via exponential-time brace expansion; affected `<1.1.16`.
  - `GHSA-mh99-v99m-4gvg` / source `1130588` — unbounded expansion/OOM DoS; affected `<1.1.17`.
  - `GHSA-rgw5-rvv9-x895` / source `1130737` — unbounded intermediate-array DoS; affected `<1.1.18`.

### 2. `js-yaml`

- Installed: `js-yaml@3.14.2`
- Node path: `node_modules/js-yaml`
- npm severity: high; indirect; `fixAvailable: true`
- `npm explain` classifies the installed node as `dev: true` and traces it through `@istanbuljs/load-nyc-config@1.1.0` -> `babel-plugin-istanbul@6.1.1` -> Jest transform/config/runtime packages -> root dev dependency `jest@29.7.0`.
- Advisory inputs recorded by npm:
  - `GHSA-h67p-54hq-rp68` / source `1121859` — quadratic-complexity DoS in merge-key handling; affected `<3.15.0`.
  - `GHSA-52cp-r559-cp3m` / source `1123912` — YAML merge-key quadratic CPU DoS; affected `>=3.0.0 <3.15.0`.
  - `GHSA-5p4m-2wfm-xmqj` / source `1138114` — `!!omap` quadratic CPU DoS; affected `>=3.0.0 <3.15.1`.

## Reachability disposition

**Development/build/test exposure: VERIFIED.** Both vulnerable installed nodes are transitive members of the root Jest development graph according to the exact `npm explain` output.

**Production dependency exposure: NOT OBSERVED.** The root project declares no production dependencies and exact `npm audit --omit=dev --json` returned zero vulnerabilities.

**Shipped-payload reachability: NO CONCRETE PATH ESTABLISHED.** A1's candidate identity contract defines the shipped payload as the canonical userscript plus deterministic generated extension payload/manifest/icons; this audit found no npm production dependency path into those shipped bytes.

**Shipped exploitability: UNKNOWN / NOT CLAIMED.** Absence of a concrete shipped dependency path is sufficient for a bounded non-shipped disposition; it is not evidence that the upstream advisories are harmless in development tooling or that no conceivable tooling attack exists.

## Competing interpretations / dissent

1. Treating npm's top-level `high` count as an automatic shipped-release blocker is rejected because exact production-omit-dev audit is clean and both installed vulnerable nodes resolve to the Jest development graph.
2. Treating the clean production audit as proof the advisories are universally non-exploitable is also rejected. The vulnerable dev tooling is real; its exploitability depends on whether attacker-controlled brace/YAML input reaches those tooling paths, which this bounded assignment did not establish.
3. A blanket dependency upgrade is not justified by this evidence because it would enlarge scope and could perturb the already-certified test/build environment without a demonstrated shipped-payload security benefit.

## Acceptance criteria

- Exact lockfile-bound audit JSON captured: PASS.
- Exact packages, installed versions, node paths, advisory IDs/sources/ranges recorded: PASS.
- Dev/build/test vs shipped-payload classification: PASS.
- Concrete shipped dependency path established: NO.
- Shipped exploitability claimed without path: NO; remains `UNKNOWN / NOT CLAIMED`.
- Blind dependency upgrade performed: NO.
- Product/runtime/Send/CHOICE/route/lease/uncertainty safeguards changed: NO.
- Protected publication action performed: NO.

## Risks and limits

The two upstream advisory families remain present in the current development lockfile. This disposition is release-payload bounded, not a statement that development tooling cannot be attacked. A future toolchain-hygiene update may remove them, but such an update should be independently tested rather than folded into this release-critical step.

The GitHub Actions v4 action-runtime deprecation observation from A1 also remains tooling hygiene, not product-failure evidence. Current live ChatGPT/Claude structural insertion and physical/mobile-platform claims remain outside this assignment and retain their previous uncertified limits.

## Handoff

A2 is suitable for `submitted` with verdict `non-shipped-dev-tooling-disposition`: exact audit evidence establishes two high findings in the Jest development graph and zero production-omit-dev vulnerabilities, with no concrete path into the immutable shipped payload. No dependency-repair assignment is required before the BUILD-IDENTITY Red Team solely on this evidence.

Next dependency-ready assignment: `R7-A3-BUILD-IDENTITY-REDTEAM-CI`. It should independently attack the identity oracle and obtain exact candidate clean-head ordinary CI/identity evidence without changing publication state. The temporary A2 carrier must be removed before handoff.
