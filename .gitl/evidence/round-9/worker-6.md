# Ghost Worker Evidence

## Identity
- Round: 9
- Worker evidence slot: 6
- Intended role: Devil's Advocate / release auditor
- Executed by: `scheduled-successor-r9-a3-final-audit-11`
- Assignment ID: `R9-A3-FINAL-CERT-PACKAGE-AUDIT`
- Started at: `2026-08-08T13:13:55Z`
- Finished at: `2026-08-08T13:16:15Z`

## State Read
- Branch: `agent/8.8-repair-resume`
- Starting / inspected head: `fb27c0e3ad752094681c9bf580103895d269ad32`
- Shared lease claim commit: `12527acdfe4044378eba635528ee25ce17102626`
- Lease holder: `scheduled-successor-r9-a3-final-audit-11`
- Lease expiry: `2026-08-08T13:58:55Z`
- Dependencies: `R9-A1-PACKAGE-CHECKSUM-BUILD:submitted`; `R9-A2-PACKAGE-REDTEAM-CI:submitted`.

The latest canonical Personal-Forge maker v1.1 was read before Ghost repository work. I then re-read canonical state, the Round-9 plan, orchestration/task/succession/evidence rules, deferred questions, the explicit `2026-08-07-release-pressure.md` directive, Round-9 supervisor/A1/A2 evidence, the Round-7 identity and dependency audits, the Round-8 documentation audit, the machine-readable candidate identity, and `docs/RELEASE-CANDIDATE-8.8.md`.

Controlling authority remains unchanged: Round 4 and Round 5 are accepted only at their recorded bounded scopes; Round-6 read-only authenticated inspection is authorized when a functioning carrier exists, while exact current live ChatGPT/Claude structural insertion remains UNKNOWN / NOT CERTIFIED; missing live capture is not a blanket blocker on deterministic final-package certification; publication remains forbidden and `publishReady=false`.

Maker v1.1 Delivery-Pressure was applied. Research was ineligible because the final package audit was dependency-ready and was the smallest remaining release-path artifact.

## Step Performed

Independently audited the final non-published 8.8 candidate package rather than accepting A1/A2 narrative alone. The audit checked package contents and metadata, candidate identity/provenance, exact CI bindings, package artifact digests, post-A1 repository movement, stable/candidate channel separation, dependency disposition, documentation boundaries, and the contradictory hosted timing ledger.

### Independent package artifact verification

I downloaded and independently inspected three ordinary-CI `release-candidate-package` artifacts:

1. A1 implementation artifact `9021943306` from run `31257960286`, exact head `2c01b492ab59c2ab48c90cac0d7cdc9acc516105`.
   - ZIP SHA-256 independently computed as `10b5f30b568935fa3af4a329f14f032a37c7208e80add250d778c1a1b710cef5`.
2. A2 claim-head artifact `9022040766` from run `31258314731`, exact head `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e`.
   - ZIP SHA-256 independently computed as `bcf2a78cea3a84a323ed0dd0c8a7e0ab7323a056607a36c9dcc0b0b400cea22c`.
3. Latest pre-A3 handoff artifact `9022132642` from fully green run `31258662956`, exact head `fb27c0e3ad752094681c9bf580103895d269ad32`.
   - ZIP SHA-256 independently computed as `24ba12ff3ee1d529ed377eb1ea5e5e63aa48210a7f225433c8dee39216e95d9e`.

All three extracted package directories are byte-identical. Each contains exactly seven files and no extras:

- `SHA256SUMS`
- `extension/content.js`
- `extension/icon-48.png`
- `extension/icon-96.png`
- `extension/manifest.json`
- `ghost-in-the-loop.user.js`
- `package-manifest.json`

The deterministic metadata is identical across the inspected package executions:

- `SHA256SUMS` SHA-256: `2c17e9eac4cc465cae1b4e74820b91e4f47b6d94f0d0c30290cb76717f31e6a4`
- `package-manifest.json` SHA-256: `d7a4a4c707f0c944b89af2d93f9f22596900d79ec20256eb388231e1ed00a89d`

The five staged payload files independently hash and size exactly to the Round-7 candidate identity:

- `ghost-in-the-loop.user.js` — 375302 bytes — `3493ccc31c97db9749768ab32fafc6dc89c2ebc23f043ebaf998aaf115ebf1df`
- `extension/manifest.json` — 1589 bytes — `1bd616e74988e820885ab210ade3afb031eb905bd522053768dae58650292489`
- `extension/content.js` — 374443 bytes — `2570d6f6e735ad9ecd0eb49a608c7fd36c79c1b0ed70c5fbf367fac8dadd6990`
- `extension/icon-48.png` — 197 bytes — `d698ec8171597e6954d37016082bd5d4740ab91678769bf90e4a826be2037057`
- `extension/icon-96.png` — 352 bytes — `05425051e2a49b1a896477c3c43d09f1458c99749149f331f4a89dc9a1a28815`

The independently inspected package manifest records release `8.8.0`, identity record `.gitl/evidence/round-7/candidate-identity.json`, provenance head `30c49f690afb14683014e0a7c40c5c2093aaba2a`, candidate branch `agent/8.8-repair-resume`, stable branch `main`, observed stable version `8.7.1`, `publicationState=candidate-not-published`, `publishReady=false`, and the exact five payload hashes/sizes above.

Different GitHub artifact ZIP digests across executions therefore do not represent payload drift: the extracted deterministic package is byte-identical. The transport digest binds an execution; the inner payload/checksum/manifest content defines the candidate package identity.

### Repository movement after the package implementation

An independent GitHub compare from exact A1 implementation head `2c01b492ab59c2ab48c90cac0d7cdc9acc516105` through pre-A3 handoff head `fb27c0e3ad752094681c9bf580103895d269ad32` shows only:

- `.gitl/autopilot-state.json`
- `.gitl/evidence/round-9/worker-3.md`
- `.gitl/evidence/round-9/worker-4.md`
- `.gitl/orchestration/round-plan.json`

No immutable payload, package implementation, package test, dependency/lockfile, version, stable-channel URL, product source, generated runtime, workflow, or safety assertion changed after the exact A1 implementation head.

### Exact CI and timing reconciliation

A1 exact implementation run `31257960286` on `2c01b492ab59c2ab48c90cac0d7cdc9acc516105` is fully green:

- unit/base/identity/package job `93104175525`: SUCCESS;
- E2E job `93104175498`: SUCCESS;
- package artifact `9021943306`: exact digest above;
- E2E artifact `9021986223`: SHA-256 `c956d0fc49aef8bb496b6e369d514056dfea64316cb92fd797fc8288716a6ade`.

A2 exact claim-head run `31258314731` on `ae4f34e8b0e2da0a9e29566d0321eccb8897a07e` records the required dissent rather than hiding it:

- unit/base/identity/package job `93105068916`: SUCCESS;
- package artifact `9022040766`: exact digest above;
- base artifact `9022040956`: SHA-256 `894e2d9f471c6d8383d36fb5f986cd91f0bd5fc29c7f189c1f02cb77314f595e`;
- E2E job `93105068888`: FAILURE;
- E2E artifact `9022080144`: SHA-256 `867850dde9c62ec50b12dfa2929f8f34ceaab775e95c7c27508f76072edf4cd6`.

I independently inspected that A2 E2E artifact. It contains 220 expected/passed, 10 skipped, 1 unexpected, and 0 flaky. The sole unexpected case is the already-preserved Chromium Round-5 A2 grouped-selector wall-clock timing oracle in `long-chat-perf-a2.spec.js`:

- first execution: small-case p95 `0.8999999999941792 ms` against unchanged `<= 0.875 ms`;
- retry: large-case p95 `2.3000000000029104 ms` against unchanged `< 2.3 ms`.

No non-timing Send, CHOICE, route, shared-lease, uncertainty, structural, package, identity, or product failure is present in the artifact.

The latest pre-A3 coordination-only handoff head `fb27c0e3ad752094681c9bf580103895d269ad32` then completed ordinary run `31258662956` with both jobs SUCCESS:

- unit/base/identity/package job `93105932829`: SUCCESS;
- E2E job `93105932848`: SUCCESS;
- package artifact `9022132642`: SHA-256 `24ba12ff3ee1d529ed377eb1ea5e5e63aa48210a7f225433c8dee39216e95d9e`;
- E2E artifact `9022168334`: SHA-256 `cd9181901b29866b929b2bd3f8aa03b1ac9a293ecdda120edd616588f37373fd`.

Independent inspection of the latest E2E artifact shows 221 expected/passed, 10 skipped, 0 unexpected, and 0 flaky. Because the compare from A1 implementation to this handoff head contains only `.gitl` coordination/evidence files, the A2 red followed by the latest green is additional evidence of the already-recorded hosted timing reproducibility variance, not a payload repair between those runs.

The A3 lease-claim head `12527acdfe4044378eba635528ee25ce17102626` triggered ordinary run `31259085531`, which was still in progress when this evidence was finalized. It is not promoted to PASS or FAIL here. The final verdict does not depend on that coordination-only claim-head run: exact A1 implementation CI is fully green, A2's sole red is independently classified and retained, and the immediately preceding coordination-only handoff head is fully green with byte-identical package content.

### Stable/candidate and publication separation

Fresh repository reads confirm candidate `package.json` is `8.8.0`, while stable `main` `package.json` remains `8.7.1`. The candidate userscript remains version `8.8.0`, but its `@updateURL` and `@downloadURL` still point to the raw userscript on `main`.

Thus the isolated branch is an evidence-backed release candidate, not stable/publication authority. `publishReady=false` remains a deliberate hard boundary.

### Dependency and claim-limit audit

The Round-7 lockfile-bound dependency audit remains applicable: `brace-expansion@1.1.15` and `js-yaml@3.14.2` are real high-severity indirect nodes in the Jest development graph; `npm audit --omit=dev --json` reported zero vulnerabilities; no concrete dependency path into the immutable shipped payload was established. This supports only the bounded non-shipped disposition. Shipped exploitability remains `UNKNOWN / NOT CLAIMED`; the advisories are not rewritten as universally harmless and no blind upgrade is authorized.

The Round-8 documentation audit remains consistent with the package evidence. The release-candidate documentation explicitly preserves bounded R4/R5/R6/R7 claims, same-payload timing dissent, stable `main` authority, non-publication, live/physical uncertified limits, and the bounded dependency disposition.

## Research Sources
- No external research. Exact repository contents, Git comparisons, downloaded CI artifacts, job/run metadata, and prior canonical audits were more probative than another research wake.
- Canonical orchestration authority: Personal-Forge maker v1.1 and `.gitl/user-directives/2026-08-07-release-pressure.md`.
- Mandatory repository evidence reviewed:
  - `.gitl/evidence/round-9/worker-1.md`
  - `.gitl/evidence/round-9/worker-3.md`
  - `.gitl/evidence/round-9/worker-4.md`
  - `.gitl/evidence/round-7/candidate-identity.json`
  - `.gitl/evidence/round-7/worker-6-final-audit.md`
  - `.gitl/evidence/round-7/worker-6-dependency-audit.md`
  - `.gitl/evidence/round-8/worker-6.md`
  - `docs/RELEASE-CANDIDATE-8.8.md`

## Changes
- `.gitl/autopilot-state.json`: A3 lease claim / coordination only.
- `.gitl/evidence/round-9/worker-6.md`: this final audit evidence.
- Product/runtime/package implementation/test/dependency/version/stable-channel files changed by A3: none.
- Downloaded CI ZIPs and extracted inspection directories were temporary local audit material and were not committed.

## Acceptance Criteria
- Staged package contains exactly the five immutable certified payload bytes plus deterministic checksum/manifest metadata: **PASS** — independently verified across A1, A2, and latest pre-A3 package artifacts.
- Exact package artifact digest, source identity, Git/test provenance, and CI evidence are internally consistent: **PASS** — transport digests bind executions; extracted package content is byte-identical and matches candidate identity.
- R4-R8 bounded claim limits and full hosted timing red/green ledger remain explicit: **PASS** — including runs `31256501263` and `31258314731`, plus latest green `31258662956`.
- Development-tooling advisories retain bounded non-shipped disposition with shipped exploitability UNKNOWN/not claimed: **PASS**.
- Stable `main` remains separate and candidate remains non-published: **PASS** — main `8.7.1`, candidate `8.8.0`, userscript update/download URLs still point to main, `publishReady=false`.
- All fail-closed safety invariants remain unchanged: **PASS** — no product/safety semantic movement after A1 implementation; no assertion weakening by A2/A3.
- Accepted Round-5 numerical timing thresholds weakened: **NO**.
- Exact current live ChatGPT/Claude or physical-platform claims promoted: **NO**.
- Main/merge/auto-merge/tag/GitHub Release/store/publish action: **NONE**.

## Safety Checks
- Send authority and exact Send identity protections unchanged.
- CHOICE behavior unchanged.
- Route and shared-lease safety unchanged.
- Uncertainty pause/fail-closed behavior unchanged.
- Specialized -> standard adapter-aware -> rail structural demotion unchanged.
- Package and BUILD-IDENTITY fail-closed assertions unchanged.
- Stable public update/download authority remains `main`.
- No dependency upgrade or version change.
- No publication action.

## Risks and Limits
1. **Hosted Long-Chat timing reproducibility remains explicitly contradictory.** The same immutable payload has both green and timing-only red observations. This candidate is not certified for universal timing reproducibility or a calibrated hardware budget, and the accepted numerical thresholds remain unchanged.
2. **Development-tooling advisories remain real.** The bounded release disposition does not establish universal harmlessness or non-exploitability. Shipped exploitability remains `UNKNOWN / NOT CLAIMED` absent a concrete shipped path.
3. **Live structural certification remains limited.** Exact current live ChatGPT and Claude insertion remain `UNKNOWN / NOT CERTIFIED`. Physical Android, Android WebView, Firefox-Android/GeckoView, real IME/browser-toolbar combinations, real assistive-technology mappings, and calibrated low-end-device performance remain uncertified.
4. **The staged package is an evidence artifact, not a public installer/store release.** Publication remains a separate explicit user gate.
5. **GitHub Actions runtime hygiene remains tooling risk.** Existing action-runtime deprecation warnings are not established product causality and were not allowed to broaden this final audit.

## Verdict

**ACCEPTED — FINAL-CERT-PACKAGE is complete at bounded deterministic/non-published release-candidate package scope.**

The isolated 8.8.0 candidate now has an exact immutable payload identity, deterministic generated/runtime parity, deterministic staged package plus checksum/manifest metadata, independent Red-Team mutation sensitivity, exact package/artifact/CI bindings, reconciled documentation, and a final Devil's-Advocate audit. The contradictory hosted timing evidence, development-tooling advisory disposition, live/physical certification limits, and publication boundary remain explicit rather than being converted into stronger claims.

This verdict does **not** authorize merge, auto-merge, tag, GitHub Release, store upload, stable-channel mutation, or publication. `publishReady` must remain false until separate explicit publication authority is supplied.

## Recommended Next Action

Mark `FINAL-CERT-PACKAGE` `completed-certified-bounded-nonpublished` and project state `complete-awaiting-publication-authority`, release the shared lease, and halt autonomous release mutation. Preserve the isolated candidate and evidence unchanged. Any later merge/tag/Release/store/publish step requires separate explicit user authority.

## Assignment Status
- accepted
