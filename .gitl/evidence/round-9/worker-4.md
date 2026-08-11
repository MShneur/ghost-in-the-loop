# Ghost Worker Evidence

## Identity
- Round: 9
- Worker evidence slot: 4
- Intended role: independent test engineer / Red Team
- Executed by: `scheduled-successor-r9-a2-package-redteam-04`
- Nominal wake role: Devil's Advocate / release auditor
- Assignment ID: `R9-A2-PACKAGE-REDTEAM-CI`
- Started at: `2026-08-08T12:52:46Z`
- Finished at: `2026-08-08T12:59:44Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting head: `67a66c3e92dbd826d78be5aed24772fa97e71a85`
- Lease claim commit: `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e`
- Lease holder: `scheduled-successor-r9-a2-package-redteam-04`
- Dependencies: `R9-A1-PACKAGE-CHECKSUM-BUILD:submitted`

The canonical Personal-Forge maker v1.1 was read before Ghost repository work. Canonical state, Round-9 plan, orchestration/task/evidence/succession rules, deferred questions, the explicit release-pressure directive, Round-9 supervisor and A1 evidence, Round-7 candidate identity/final identity audit, and Round-8 docs audit were then read.

The explicit user directive remains controlling authority: bounded Round-4 and Round-5 certifications are accepted only with their recorded limits; Round-6 read-only authenticated inspection is authorized when a functioning carrier exists while exact current live ChatGPT/Claude insertion remains uncertified; missing live capture is not a blanket blocker on deterministic package certification; publication remains forbidden.

Maker v1.1 Delivery-Pressure was applied. Research fallback was rejected because this independent package/artifact falsification assignment was dependency-ready. Research-only wake count remains zero.

## Step Performed

Independently falsified the A1 release-candidate package rather than relying on A1's narrative or its package-oracle implementation alone.

### Exact A1 artifact inspection

Downloaded ordinary-CI artifact `release-candidate-package`, artifact ID `9021943306`, from run `31257960286` / exact A1 implementation head `2c01b492ab59c2ab48c90cac0d7cdc9acc516105`.

GitHub artifact metadata reports ZIP digest:

`sha256:10b5f30b568935fa3af4a329f14f032a37c7208e80add250d778c1a1b710cef5`

Independent `sha256sum` of the downloaded ZIP matched that digest exactly.

The extracted artifact contains exactly seven files and no extras:

- `SHA256SUMS`
- `extension/content.js`
- `extension/icon-48.png`
- `extension/icon-96.png`
- `extension/manifest.json`
- `ghost-in-the-loop.user.js`
- `package-manifest.json`

The five payload hashes in the extracted package match `.gitl/evidence/round-7/candidate-identity.json` exactly:

- `ghost-in-the-loop.user.js` — `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df`
- `extension/manifest.json` — `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489`
- `extension/content.js` — `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990`
- `extension/icon-48.png` — `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057`
- `extension/icon-96.png` — `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815`

The extracted `SHA256SUMS` is byte-for-byte path-sorted and has SHA-256:

`2c17e9eac4cc465cae1b4e74820b91e4f47b6d94f0d0c30290cb76717f31e6a4`

The extracted deterministic `package-manifest.json` has SHA-256:

`d7a4a4c707f0c944b89af2d93f9f22596900d79ec20256eb388231e1ed00a89d`

Its fields independently match the candidate identity contract: release `8.8.0`, provenance `30c49f690afb14683014e0a7c40c5c2093aaba2a`, candidate `agent/8.8-repair-resume`, stable `main`, stable version `8.7.1`, `publicationState=candidate-not-published`, and `publishReady=false`.

### Independent exact A2 claim-head package inspection

The lease-claim head `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e` triggered ordinary run `31258314731`. Its package artifact is `9022040766`, GitHub ZIP digest:

`sha256:bcf2a78cea3a84a323ed0dd0c8a7e0ab7323a056607a36c9dcc0b0b400cea22c`

Independent `sha256sum` of the downloaded ZIP matched that digest exactly. After extraction, `diff -rq` between the A1 artifact directory and this exact A2 claim-head artifact directory produced no differences. The inner deterministic metadata digests remain exactly:

- `SHA256SUMS`: `2c17e9eac4cc465cae1b4e74820b91e4f47b6d94f0d0c30290cb76717f31e6a4`
- `package-manifest.json`: `d7a4a4c707f0c944b89af2d93f9f22596900d79ec20256eb388231e1ed00a89d`

The transport ZIP digest differs between executions while the extracted package is byte-identical. This confirms the supervisor contract: GitHub artifact digest is execution/evidence binding, not the canonical payload identity.

### Independent mutant falsification

A separate local Red-Team verifier was run against the downloaded exact A2 claim-head artifact. It did not invoke A1's `verifyPackage()` function; it independently enforced the candidate-identity path, byte/hash, manifest, channel and publication contract.

Commands used included:

- `sha256sum release-candidate-package-a2.zip`
- `unzip ...`
- `diff -rq <A1-extracted> <A2-extracted>`
- `python3 /mnt/data/a2_redteam_claim.py`

Result:

- baseline exact artifact — **PASS**
- missing-file mutant — **KILLED** by exact path-set check
- extra-file mutant — **KILLED** by exact path-set check
- staged-byte/hash mutant — **KILLED** by byte/hash check
- release-version mutant — **KILLED**
- candidate/stable-channel confusion mutant — **KILLED**
- `publishReady=true` mutant — **KILLED**
- checksum-metadata mutant — **KILLED**
- package-manifest payload-hash mutant — **KILLED**

Final independent mutant result: **PASS; no required mutant survived.**

## Research Sources
- No external research. Exact repository identity, downloaded CI artifacts, ordinary CI, and independent falsification were more probative than another research wake.
- Canonical authority: Personal-Forge maker v1.1 and `.gitl/user-directives/2026-08-07-release-pressure.md`.
- Repository evidence: `.gitl/evidence/round-9/worker-1.md`, `.gitl/evidence/round-9/worker-3.md`, `.gitl/evidence/round-7/candidate-identity.json`, `.gitl/evidence/round-7/worker-6-final-audit.md`, `.gitl/evidence/round-8/worker-6.md`.

## Changes
- `.gitl/autopilot-state.json` — shared A2 lease claim only.
- `.gitl/evidence/round-9/worker-4.md` — this Red-Team record.
- Product/runtime/package implementation changed by A2: none.
- Temporary local downloaded/extracted CI artifacts and independent verifier were used only for inspection and were not committed.

Independent compare from A1 implementation head `2c01b492ab59c2ab48c90cac0d7cdc9acc516105` through A2 lease claim `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e` changes only `.gitl/autopilot-state.json`, `.gitl/evidence/round-9/worker-3.md`, and `.gitl/orchestration/round-plan.json`. No immutable payload file, dependency, version, stable channel, package implementation, test assertion, or publication file changed after the A1 implementation head.

## Tests

### A1 exact implementation run
Ordinary run `31257960286` on exact head `2c01b492ab59c2ab48c90cac0d7cdc9acc516105` is now fully complete:

- Unit/base/identity/package job `93104175525`: **SUCCESS**.
- E2E job `93104175498`: **SUCCESS**.
- E2E artifact `9021986223`, SHA-256 `c956d0fc49aef8bb496b6e369d514056dfea64316cb92fd797fc8288716a6ade`.
- Independent artifact inspection of `e2e-results.json`: 221 expected/passed, 10 skipped, 0 unexpected, 0 flaky.
- Package artifact `9021943306`, SHA-256 `10b5f30b568935fa3af4a329f14f032a37c7208e80add250d778c1a1b710cef5`.
- Base artifact `9021943496`, SHA-256 `6aa7fd4ab435b94f5245f6115aac8d7139ab0709645f258c9db76a2e02fd04b2`.

### A2 exact claim-head run
Ordinary run `31258314731` on exact head `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e` completed with:

- Unit/base/identity/package job `93105068916`: **SUCCESS**, including base certification, syntax, unit tests, BUILD-IDENTITY oracle, package build/check and artifact upload.
- Package artifact `9022040766`, SHA-256 `bcf2a78cea3a84a323ed0dd0c8a7e0ab7323a056607a36c9dcc0b0b400cea22c`; independently downloaded and verified above.
- Base artifact `9022040956`, SHA-256 `894e2d9f471c6d8383d36fb5f986cd91f0bd5fc29c7f189c1f02cb77314f595e`.
- E2E job `93105068888`: **FAILURE**.
- E2E artifact `9022080144`, SHA-256 `867850dde9c62ec50b12dfa2929f8f34ceaab775e95c7c27508f76072edf4cd6`.
- Independent artifact inspection: 220 expected/passed, 10 skipped, 1 unexpected, 0 flaky.

The sole A2 claim-head E2E failure is the already-preserved Round-5 A2 grouped-selector hosted wall-clock timing oracle in `long-chat-perf-a2.spec.js`:

- first execution: small-case p95 `0.8999999999941792 ms` against unchanged `<= 0.875 ms`;
- retry: large-case p95 `2.3000000000029104 ms` against unchanged `< 2.3 ms`.

No non-timing Send, CHOICE, route, lease, uncertainty, structural, package, identity, or product assertion is identified as failing. This exact red result is therefore classified as another hosted timing-reproducibility observation in the established ledger. It is retained rather than hidden, and no timing threshold was changed or weakened.

## Acceptance Criteria
- Kill missing-file mutant: **PASS**.
- Kill extra-file mutant: **PASS**.
- Kill staged-byte/hash mutant: **PASS**.
- Kill version mutant: **PASS**.
- Kill candidate/stable-channel mutant: **PASS**.
- Kill `publishReady` mutant: **PASS**.
- Independently inspect exact CI package artifact: **PASS**.
- Verify exact staged payload hashes and `SHA256SUMS` back to candidate identity: **PASS**.
- Bind exact run/jobs/artifact IDs and SHA-256 digests: **PASS**.
- Ordinary unit/base/identity/package gates pass on exact A2 tested head: **PASS** (`31258314731` / `93105068916`).
- Full E2E result retained exactly: **PASS** — one timing-only red on exact A2 claim head, plus all-green exact A1 implementation run retained.
- Any non-timing safety/product contradiction: **NONE OBSERVED**.
- No immutable payload, dependency, version, stable-channel or publication mutation: **PASS**.
- Round-5 timing threshold weakened: **NO**.

## Safety Checks
- Send authority unchanged: **PASS**.
- CHOICE behavior unchanged: **PASS**.
- Route/shared-lease safety unchanged: **PASS**.
- Uncertainty and structural demotion unchanged: **PASS**.
- Stable `main` userscript update/download authority unchanged: **PASS**.
- Candidate version remains 8.8.0 while stable `main` remains 8.7.1: **PASS**.
- `publishReady` remains false: **PASS**.
- No `main`, merge, auto-merge, tag, GitHub Release, store, or publish action: **PASS**.

## Risks and Limits
1. Hosted Long-Chat wall-clock timing remains contradictory on unchanged package/payload semantics: A1 exact implementation CI is fully green while the A2 coordination-only claim head is timing-only red. Final audit must retain both observations and must not turn them into a universal calibrated-hardware claim or weaken the accepted threshold.
2. GitHub Actions artifact ZIP digests differ between A1 and A2 executions even though extracted package directories are byte-identical. This is expected under the package contract; the immutable identity is the staged payload/checksum/manifest content, while the ZIP digest binds a specific CI execution.
3. `brace-expansion@1.1.15` and `js-yaml@3.14.2` remain real high-severity indirect Jest-development findings. No concrete shipped-payload path is established and shipped exploitability remains `UNKNOWN / NOT CLAIMED`.
4. Exact current live ChatGPT/Claude structural insertion and physical/mobile/accessibility/calibrated-low-end claims remain uncertified. Their absence does not invalidate this deterministic package evidence.
5. Publication remains a separate explicit human authority boundary.

## Recommended Next Action

Submit `R9-A2-PACKAGE-REDTEAM-CI` and expose `R9-A3-FINAL-CERT-PACKAGE-AUDIT`. The final Devil's-Advocate auditor should independently bind the exact five payload bytes, deterministic metadata, A1/A2 artifact digests, exact CI provenance, R4-R8 claim limits, development-tooling disposition, and complete hosted timing red/green ledger. It must preserve `publishReady=false` and perform no merge/tag/Release/store/publish action.

## Assignment Status
- submitted
