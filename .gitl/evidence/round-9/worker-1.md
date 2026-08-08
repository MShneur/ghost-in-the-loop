# Ghost Worker Evidence

## Identity
- Round: 9
- Worker evidence slot: 1
- Intended role: supervisor-integrator
- Executed by: `scheduled-successor-r9-supervisor-final-cert-11`
- Assignment ID: `R9-SUPERVISOR-FINAL-CERT-PACKAGE-PLAN`
- Started at: `2026-08-08T12:17:33Z`
- Finished at: `2026-08-08T12:22:00Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `89cc94df8908c3c544c4bb7b6e4647692d7c74aa`
- Shared lease claim commit: `ba0f3f13329cbcd6a6a30ec5869a4f97953147d2`
- Lease holder: `scheduled-successor-r9-supervisor-final-cert-11`
- Lease expiry: `2026-08-08T13:02:33Z`
- Dependencies: `R8-A2-DOCS-REDTEAM-AUDIT:accepted`; BUILD-IDENTITY and dependency disposition accepted at their bounded non-published scopes; R4/R5 bounded reviews accepted by explicit delegated user authority; R6 read-only live inspection authorized while actual current live capture remains not obtained.

The canonical Personal-Forge maker v1.1 was read before Ghost repository work. Current state, Round-9 plan, orchestration/task rules, succession rule, evidence contract, deferred-question queue, explicit release-pressure directive, Round-8 docs audit, Round-7 final identity audit, Round-7 dependency audit, machine-readable candidate identity, and the 8.8 release-candidate evidence boundary were then re-read.

## Step Performed

Opened the smallest final-certification/package/checksum chain that can be falsified without changing product semantics or crossing publication boundaries.

### Existing release evidence already present

The candidate already has two strong lower-level primitives:

1. `npm run cert:base` performs preflight, deterministic extension generation, generated-content parity, manifest audit, and a SHA-256 index of the five immutable candidate payload files.
2. `npm run identity:oracle` verifies version/channel/publication invariants and rejects drift in the same five payload paths against `.gitl/evidence/round-7/candidate-identity.json`.

The immutable payload set remains:

- `ghost-in-the-loop.user.js` — `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df`
- `extension/manifest.json` — `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489`
- `extension/content.js` — `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990`
- `extension/icon-48.png` — `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057`
- `extension/icon-96.png` — `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815`

### Exact gap

The repository does **not** yet have a release-candidate staging/package oracle. Ordinary CI uploads only the extension base artifact index and E2E results. There is no repository-native command that stages exactly the five immutable payload files into a release-candidate package directory, emits a deterministic `SHA256SUMS` plus package manifest, verifies those staged bytes back against BUILD-IDENTITY, rejects extra/missing paths, and uploads the staged candidate as a CI artifact.

That is the smallest remaining falsifiable release artifact. Broad research, a dependency refresh, live-host structural work, or a new store/archive format would all add scope rather than close this gap.

### Packaging decision

The Round-9 package is deliberately a **staged exact-byte candidate directory plus deterministic checksum/manifest**, uploaded as a GitHub Actions artifact for evidence binding. It is not a new public distribution format.

Proposed staged layout:

```text
test-results/release-candidate/
  ghost-in-the-loop.user.js
  extension/manifest.json
  extension/content.js
  extension/icon-48.png
  extension/icon-96.png
  SHA256SUMS
  package-manifest.json
```

The five shippable files must be byte-for-byte copies of BUILD-IDENTITY. `SHA256SUMS` must be path-sorted and deterministic. `package-manifest.json` must be deterministic and contain the release target, exact staged path set, bytes, SHA-256 values, identity-record reference, candidate/stable channel classification, and `publicationState=candidate-not-published` / `publishReady=false`; it must not inject a volatile timestamp into package identity.

The GitHub Actions artifact ZIP digest is treated as **execution/evidence binding**, not as the canonical immutable payload identity, because the upload container may contain transport metadata. No new npm dependency or archive utility is needed merely to call the staged directory a package artifact.

This choice also avoids inventing a browser-store archive requirement that the current product does not claim: stable userscript installation is the raw `main` userscript, while Firefox documentation currently describes loading the repository `extension/manifest.json` as a temporary add-on. Publication/store packaging remains a later separately authorized boundary.

## Opened Round-9 Chain

### R9-A1-PACKAGE-CHECKSUM-BUILD
Role: builder / release engineer.

Create the repository-native staging/checksum oracle and wire it into ordinary CI without changing any immutable candidate payload byte. Expected tooling surface may include `scripts/package-candidate.js`, focused package-oracle tests, package.json scripts, and a CI upload step for `test-results/release-candidate/`.

Required behavior:
- run BUILD-IDENTITY/check-generated/base-certification prerequisites first;
- stage exactly the five immutable candidate payload paths, with no extras or omissions;
- generate deterministic path-sorted SHA-256 sums and deterministic package manifest;
- fail visibly on version drift, source/staged hash drift, generated-content drift, missing/extra payload path, candidate/stable-channel confusion, or `publishReady != false`;
- leave product/runtime bytes, dependency graph, stable-main URLs, version, Send/CHOICE/route/lease/uncertainty/structural behavior, and Round-5 timing thresholds unchanged;
- upload the staged package through ordinary CI as release evidence only, not publication.

### R9-A2-PACKAGE-REDTEAM-CI
Role: independent test engineer / Red Team.

Independently attack the A1 package oracle and obtain exact-head package/CI evidence. Kill deliberate missing-file, extra-file, staged-byte/hash, version/channel, and publication-state mutants. Verify downloaded package artifact contents and `SHA256SUMS` back to the immutable identity record. Run ordinary unit/base/identity/E2E CI without weakening any assertion.

Hosted wall-clock timing remains a recorded bounded dissent: a timing-only red is evidence to classify and retain, not automatic permission to change thresholds or reopen the already accepted Round-5 program. Any non-timing Send/CHOICE/route/lease/uncertainty/structural/product failure must remain a real blocker.

### R9-A3-FINAL-CERT-PACKAGE-AUDIT
Role: Devil's Advocate / release auditor.

Independently audit A1/A2, the downloaded staged package, checksum manifest, BUILD-IDENTITY provenance, exact CI bindings, Round-7 dependency disposition, Round-8 documentation, and the full hosted timing red/green ledger. Accept `FINAL-CERT-PACKAGE` only if the package contains exactly the certified payload bytes and all claim/publication boundaries remain intact.

On acceptance, the project may be marked complete at a **bounded non-published release-candidate package scope**, with publication still separately unauthorized and `publishReady=false` preserved. The audit must not merge, tag, create a GitHub Release, upload to a store, change stable-main authority, or infer current live/physical certification.

## Delivery-Pressure Checkpoint

Research is ineligible. A safe reversible package/checksum implementation is now explicitly defined. The missing live ChatGPT capture limits live-host certification only; it does not block this package artifact. No new release-critical requirement was added.

Lenses applied:
- Supervisor/release: close only the missing package/checksum/evidence-binding gap.
- Builder: use the existing five-file immutable identity; no framework rewrite or dependency addition.
- Independent test: require source-to-staged checksum verification and exact-head CI.
- Red Team/devil's advocate: kill path/hash/channel/publication mutants and reject broader claims.
- User/usability: keep stable `main` installation authority unchanged and avoid presenting an internal candidate artifact as a public installer.

## Current CI Dissent Carried Forward

The pre-claim handoff head `89cc94df8908c3c544c4bb7b6e4647692d7c74aa` ordinary run `31256501263` completed with:

- Unit/base/BUILD-IDENTITY job `93100515471`: **SUCCESS**.
- E2E job `93100515446`: **FAILURE**, exactly one preserved Round-5 A2 hosted timing test.
- E2E summary: 220 passed, 10 skipped, 1 failed.
- First failing large-case p95: about `2.4 ms` against unchanged `<2.3 ms`.
- Retry failing small-case p95: about `0.9 ms` against unchanged `<=0.875 ms`.
- E2E artifact `9021569520`, SHA-256 `58be0b2a2057b2b87fd6433a4ba69ebe4b955c8940b9dbd94dcb5d2e8e1eb7b4`.
- Base artifact `9021526673`, SHA-256 `ed5cd35d09872bd309111464d1edffd6355e3f75dbf31ba316433aef5bf16f97`.

All observed non-timing E2E safety/structural/lifecycle/routing assertions passed or were expected skips. This extends the same-payload hosted timing-variance ledger; it is not evidence of a changed immutable payload and does not authorize threshold weakening.

## Research Sources
- No external research was needed. Repository implementation/evidence and exact GitHub Actions results were more probative than another research wake.
- Canonical authority: Personal-Forge maker v1.1 and `.gitl/user-directives/2026-08-07-release-pressure.md`.
- Package primitives: `scripts/certify-extension.js`, `scripts/build-identity.js`, `package.json`, `.github/workflows/test.yml`.
- Identity and prior audits: `.gitl/evidence/round-7/candidate-identity.json`, `.gitl/evidence/round-7/worker-6-final-audit.md`, `.gitl/evidence/round-7/worker-6-dependency-audit.md`, `.gitl/evidence/round-8/worker-6.md`, `docs/RELEASE-CANDIDATE-8.8.md`.

## Changes
- `.gitl/autopilot-state.json`: compacted the active Round-9 state while preserving current program statuses, evidence bindings, certification limits, dependency/timing dissent, safety/publication boundaries, and an immutable history pointer; claimed the shared supervisor lease.
- `.gitl/evidence/round-9/worker-1.md`: this supervisor evidence.
- Product/runtime/package/dependency/test files changed by this supervisor: none.
- Plan/state handoff follows this evidence commit.

## Tests
- No product test was re-run manually by this supervisor assignment.
- Exact pre-claim ordinary CI was independently inspected and classified as above.
- Existing `cert:base`, identity oracle, package scripts, and CI configuration were inspected to identify the narrow package/checksum gap.

## Acceptance Criteria
- Inventory exact final-cert/package/checksum gates and dependency order: **PASS**.
- Bind final package planning to immutable 8.8 candidate payload identity and explicit Git/test provenance: **PASS**.
- Carry R4-R8 claim limits and timing red/green dissent through the prior required ledger, plus newer run `31256501263`: **PASS**.
- Keep exact live ChatGPT/Claude and physical-platform certification pending: **PASS**.
- Keep development-tooling advisory shipped exploitability `UNKNOWN / NOT CLAIMED`: **PASS**.
- Open smallest implementation/test/package plus independent final-audit assignments: **PASS**.
- Keep `publishReady=false`: **PASS**.
- Main/merge/auto-merge/tag/Release/store/publish action: **NONE**.

## Safety Checks
- Send authority unchanged.
- CHOICE behavior unchanged.
- Route/shared-lease safety unchanged.
- Uncertainty pause/fail-closed behavior unchanged.
- Specialized -> standard -> rail structural demotion unchanged.
- Accepted Round-5 timing thresholds unchanged.
- Stable userscript install/update authority remains `main`.
- No dependency or version change.
- No public distribution or publication action.

## Risks and Limits
1. Hosted Long-Chat timing remains variably red/green on unchanged payload semantics; final audit must retain the contradiction instead of requiring cosmetic all-green evidence or weakening the numerical oracle.
2. `brace-expansion@1.1.15` and `js-yaml@3.14.2` remain real high-severity development-tooling findings. The bounded release disposition rests on omit-dev zero vulnerabilities and no concrete shipped path; shipped exploitability remains UNKNOWN / NOT CLAIMED.
3. Exact current live ChatGPT/Claude insertion and physical Android/WebView/GeckoView/real IME/assistive-technology/calibrated-device behavior remain uncertified.
4. A staged candidate directory is an evidence/package artifact, not a public installer or store format. Publication/store packaging is still a separate explicit authority boundary.
5. GitHub Actions v4 runtime hygiene warnings remain tooling risk; no causal product failure is established.

## Recommended Next Action
Claim `R9-A1-PACKAGE-CHECKSUM-BUILD` under a fresh shared lease and implement the exact staged-package/checksum oracle. Research remains lower priority.

## Assignment Status
- submitted
