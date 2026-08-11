# Round 9 Worker 3 Evidence — R9-A1-PACKAGE-CHECKSUM-BUILD

## Assignment and role

- Assignment: `R9-A1-PACKAGE-CHECKSUM-BUILD`
- Intended role: builder / release engineer
- Executed role: builder-release-engineer successor
- Lease holder: `scheduled-successor-r9-a1-package-build-04`
- Branch: `agent/8.8-repair-resume`
- Inspected/start head: `c4a62aa4c5ca46120e59a8304d338b9208e146a2`
- Lease claim commit: `065c39e5a4814a65b5bc4d74de469145a3f3751b`
- Final implementation head: `2c01b492ab59c2ab48c90cac0d7cdc9acc516105`
- Publication state: candidate only; `publishReady=false`

## Mandatory reads and authority

The worker read the canonical Personal-Forge maker v1.1 first, then canonical Ghost state, Round-9 plan, task prompts, evidence contract, succession rule, deferred queue, the explicit `2026-08-07-release-pressure.md` directive, Round-9 supervisor evidence, Round-7 candidate identity, BUILD-IDENTITY tooling, base-certification tooling, package scripts and ordinary CI workflow.

The release-pressure directive remains controlling authority. Bounded R4 and R5 certifications are accepted only at their recorded scopes. R6 read-only live inspection remains authorized when a functioning carrier exists, but exact current live ChatGPT/Claude structural insertion is still not certified. Missing live capture is not a blanket blocker on this deterministic package artifact.

Maker v1.1 Delivery-Pressure was applied: research fallback was rejected because a safe reversible falsifiable package/checksum artifact was dependency-ready. Research-only wake count remains zero.

## Implementation

The implementation adds a repository-native package oracle without changing any immutable candidate payload byte:

1. `scripts/package-candidate.js`
   - validates the existing Round-7 candidate identity record;
   - requires the exact five certified payload paths;
   - requires `candidate-not-published`, `publishReady=false`, and candidate/stable separation;
   - stages exact source bytes under `test-results/release-candidate/`;
   - writes deterministic path-sorted `SHA256SUMS`;
   - writes deterministic `package-manifest.json` containing release target, identity-record reference/provenance, candidate/stable classification, publication state, stable version observed, and payload bytes/hashes;
   - verifies exact staged path set, source/staged hash and byte equality, checksum text, and manifest content.
2. `tests/package-candidate.test.js`
   - proves repeated deterministic output;
   - kills missing-file, extra-file, staged-byte/hash, generated-content, version, candidate/stable-channel, publishReady, checksum-metadata, and package-manifest mutants.
3. `package.json`
   - adds `package:candidate`, `package:check`, `package:oracle`, and `test:package` commands;
   - extends syntax lint to the new script;
   - version and dependency declarations remain unchanged.
4. `.github/workflows/test.yml`
   - ordinary unit/base CI runs `npm run package:oracle` after BUILD-IDENTITY;
   - uploads `test-results/release-candidate/` as named evidence artifact `release-candidate-package` with failure on missing files;
   - this is evidence-only packaging, not a public installer/store/release path.

## Productive dissent and repair

The first ordinary CI attempt, run `31257890385` on implementation head `3ab933330af21cd187cf3e0d38c331eb25becef3`, exposed a real determinism weakness: JavaScript `localeCompare()` sorted the metadata/payload path set differently on the hosted runner than the test fixture assumed. The failure was in the new package-oracle test, not an existing product-safety test.

The implementation was corrected rather than weakening the test: `scripts/package-candidate.js` now uses an explicit locale-independent lexical comparator (`<` / `>`) for every package-path ordering operation. The repaired implementation head is `2c01b492ab59c2ab48c90cac0d7cdc9acc516105`.

## Exact fixed-head CI evidence

Ordinary run: `31257960286`

Exact head: `2c01b492ab59c2ab48c90cac0d7cdc9acc516105`

Unit/base/identity/package job: `93104175525` — **SUCCESS**.

Verified results in the authoritative job log:

- `cert:base` — PASS.
- syntax checks — PASS.
- full Jest — **45/45 suites passed; 493 passed, 3 todo, 496 total**.
- `tests/package-candidate.test.js` — PASS, including all package mutants.
- focused BUILD-IDENTITY tests — **15/15 PASS**.
- BUILD-IDENTITY oracle — `PASS (head-moved-payload-identical)`.
- package write/check — PASS.

Deterministic package metadata digests:

- `SHA256SUMS` SHA-256: `2c17e9eac4cc465cae1b4e74820b91e4f47b6d94f0d0c30290cb76717f31e6a4`
- `package-manifest.json` SHA-256: `d7a4a4c707f0c944b89af2d93f9f22596900d79ec20256eb388231e1ed00a89d`

The staged package contains exactly seven files: the five certified payload files plus `SHA256SUMS` and `package-manifest.json`.

CI evidence artifacts produced on the exact fixed head:

- `release-candidate-package`: artifact ID `9021943306`, size `225219` bytes, GitHub artifact ZIP digest `sha256:10b5f30b568935fa3af4a329f14f032a37c7208e80add250d778c1a1b710cef5`.
- `extension-base-certification`: artifact ID `9021943496`, digest `sha256:6aa7fd4ab435b94f5245f6115aac8d7139ab0709645f258c9db76a2e02fd04b2`.

At evidence-write time, exact-head E2E job `93104175498` from run `31257960286` remained in progress. A1 does not hide or pre-classify that result. The next independent Red-Team assignment must retain the exact final E2E outcome; timing-only Long-Chat variance may be classified under the existing hosted-timing ledger without threshold weakening, while any non-timing safety/product failure blocks progression.

## Claim-to-implementation compare

Authoritative compare from lease claim `065c39e5a4814a65b5bc4d74de469145a3f3751b` to fixed implementation `2c01b492ab59c2ab48c90cac0d7cdc9acc516105` changes only:

- `.github/workflows/test.yml`
- `package.json`
- new `scripts/package-candidate.js`
- new `tests/package-candidate.test.js`

No immutable candidate payload file, `package-lock.json`, dependency declaration/version, release version, stable-main URL/channel authority, Send/CHOICE/route/lease/uncertainty/structural safety behavior, or Round-5 timing threshold changed.

## Acceptance criteria

- Exact five BUILD-IDENTITY payload paths staged with no extras/omissions — **PASS**.
- Deterministic path ordering independent of runner locale — **PASS after falsifiable repair**.
- Deterministic `SHA256SUMS` — **PASS**.
- Deterministic `package-manifest.json` with required identity/channel/publication fields — **PASS**.
- Version drift mutant killed — **PASS**.
- Generated-content/source-hash drift mutant killed — **PASS**.
- Staged byte/hash mutant killed — **PASS**.
- Missing/extra path mutants killed — **PASS**.
- Candidate/stable channel confusion mutant killed — **PASS**.
- Publication-state / `publishReady` mutant killed — **PASS**.
- `cert:base` and BUILD-IDENTITY oracle remain PASS — **PASS**.
- Ordinary CI uploads named exact package evidence artifact and records run/job/artifact/digest — **PASS**.
- Claim→implementation compare contains no immutable payload/dependency/version/stable-channel mutation — **PASS**.

## Safety and limits

No `main` mutation, merge, auto-merge, tag, GitHub Release, store action, publication, or stable distribution change was performed. `publishReady` remains false. Send authority, CHOICE, route, lease, uncertainty, structural demotion, identity safeguards, and accepted Round-5 timing thresholds remain unchanged.

The existing limits remain explicit: exact live ChatGPT/Claude structural insertion and physical/mobile/accessibility/calibrated-low-end claims are uncertified; `brace-expansion@1.1.15` and `js-yaml@3.14.2` remain real high-severity indirect Jest-development findings with no established shipped-payload path and shipped exploitability UNKNOWN / NOT CLAIMED; hosted Long-Chat timing retains contradictory same-payload red/green observations; GitHub Actions v4 currently run on the forced Node-24 action runtime while project commands use Node 20.20.2.

## Verdict and handoff

**SUBMITTED — deterministic five-file release-candidate staging/checksum build at bounded non-published evidence scope.**

Next dependency-safe assignment: `R9-A2-PACKAGE-REDTEAM-CI`. The independent test engineer must download or otherwise independently inspect the exact package artifact, bind staged hashes/SHA256SUMS back to candidate identity, re-kill package mutants, retain the exact E2E result, and block on any non-timing safety/product contradiction. Publication remains forbidden.
