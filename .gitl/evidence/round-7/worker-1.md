# Round 7 Worker 1 — BUILD-IDENTITY supervisor plan

## Assignment identity

- Assignment: `R7-SUPERVISOR-BUILD-IDENTITY-PLAN`
- Program: `BUILD-IDENTITY`
- Executed role: successor-supervisor-integrator
- Isolated branch: `agent/8.8-repair-resume`
- Recovered predecessor lease after its `2026-08-08T08:09:40Z` expiry only after re-reading branch/activity: the branch was still at `b3c8d8aaaef1f999df2f5fef9ebc92665e455898`, and the latest matching Actions run `31246325049` had completed at `2026-08-08T07:34:52Z` with no later branch-changing activity.
- Recovery lease claim commit: `6c3c702f69cec315dac88bbad5557dacae99089f`.

## State and authority read

The canonical Personal-Forge maker v1.1 was read before Ghost work. The canonical Ghost state, round plan, orchestration/task prompt, succession rule, evidence contract, deferred-question queue, explicit `2026-08-07-release-pressure.md` directive, and Round-6 final audit retry were re-read.

The controlling limits remain unchanged:

- R4 lifecycle and R5 long-chat certifications are accepted only at their recorded bounded scopes.
- Round-6 read-only live inspection is authorized when a functioning carrier exists, but current live ChatGPT/Claude structural binding remains `UNKNOWN / NOT CERTIFIED` until qualifying capture exists.
- `MOBILE-SHELL-STRUCTURAL` is complete only at bounded deterministic/hosted cross-adapter scope.
- Research is ineligible while release-critical BUILD-IDENTITY work is executable.
- `publishReady` remains false. Main/merge/auto-merge/tag/release/publish remain prohibited.
- Send, CHOICE, route, lease, uncertainty, structural demotion, and all other fail-closed safeguards remain unchanged.

## Current identity baseline

### Version/source identity

The isolated 8.8 candidate is internally version-aligned:

- `package.json`: `8.8.0`.
- `package-lock.json` root and root package: `8.8.0`.
- `ghost-in-the-loop.user.js`: `@version 8.8.0` and runtime `const VER = '8.8.0'`.
- `extension/manifest.json`: `8.8.0`.
- `CHANGELOG.md`: current `8.8.0` entry.
- `tests/version.test.js` already requires userscript header, runtime `VER`, manifest, package, package-lock, changelog, and major-version singleton guard consistency.

`ghost-in-the-loop.user.js` is the canonical runtime source. `scripts/build-extension.js` strips the userscript metadata header and deterministically wraps the runtime into `extension/content.js`; the generated file explicitly says not to hand-edit it.

Current relevant Git blobs at the recovered claim head are:

- `package.json`: `f285115c56f32d63be260b39479536da720b34a8`
- `package-lock.json`: `6902a19eae9843fa8549352df6395446324e9eb1`
- canonical userscript: `e5a9b79c929b3c5fbf3a664fab96e7aaa49bea28`
- extension manifest: `9303c78369e75a8e757001f83fd49e11ad849023`
- generated extension content: `b9826c107f06339e52a98677d8b345529852ac0f`
- extension build script: `debfb10c2d2e3a45a80d1d698a2b60dbd7474dea`
- certification script: `08ab24f25ee73c20914ea23bd5fe5fa699d0a9f8`

`npm run cert:base` already composes Node preflight, extension generation, generated-parity checking, manifest audit, and an artifact index with per-file SHA-256 values. The artifact index is evidence-oriented and includes a generation timestamp; its contained payload hashes, not the JSON file's own byte identity, are the stable identity signal.

### Tested-payload relation

A direct compare from the exact clean-head Round-6 tested head `1a10c592c7023ee01b71b133762ebcb628f550bc` through recovery claim `6c3c702f69cec315dac88bbad5557dacae99089f` shows only `.gitl/**` coordination/evidence changes. No product, build, test, manifest, package, or lockfile path changed. The current 8.8 product payload therefore remains the same payload covered by the accepted exact clean-head Round-6 CI evidence; this does not waive the new BUILD-IDENTITY-specific gates below.

### Channel identity

There are distinct stable and candidate identities and they must not be collapsed:

- The userscript `@updateURL` and `@downloadURL` both point to `raw.githubusercontent.com/MShneur/ghost-in-the-loop/main/ghost-in-the-loop.user.js`.
- README install links likewise point to `main`.
- Current `main` reports package/userscript version `8.7.1`, while the isolated candidate branch reports `8.8.0`.
- GitHub currently has no Release objects. The most recent repository tags returned by GitHub top out at `v7.0.0`, so tags/releases are not the authority for current 8.x candidate identity.
- The README's Firefox path is a temporary local add-on load from `extension/manifest.json`; no current published Firefox package/channel was established by this audit.

Therefore the isolated branch is a **candidate/source channel only**. `8.8.0` in repository metadata is not evidence that 8.8.0 is already public/stable. Main remains the public userscript update/install stream until a separately authorized publication operation changes it. No such operation is authorized here.

## Competing identity interpretations

1. **Semver-only identity** — reject. `8.8.0` is necessary but cannot distinguish successive candidate payloads or prove publication; public main is still `8.7.1`.
2. **Repository-head-only identity** — insufficient alone. `.gitl` coordination commits can move the branch head without changing the shippable payload, so a new head is not necessarily a new build payload.
3. **Immutable payload identity plus provenance** — selected. Bind version metadata to canonical-source/generated-artifact hashes, an exact Git provenance head, exact certification/test evidence, and an explicit channel classification. This distinguishes payload changes from coordination-only head movement and stable publication from candidate preparation.

## Selected canonical BUILD-IDENTITY contract

A candidate is identified by all of the following, not by any one field alone:

1. **Release target/version:** `8.8.0`, internally consistent across package, lockfile, userscript metadata/runtime constant, manifest, and changelog.
2. **Canonical source:** `ghost-in-the-loop.user.js`; generated extension runtime must be reproducible through `scripts/build-extension.js` and pass generated-parity checking.
3. **Payload identity:** exact cryptographic hashes for the userscript, manifest, generated extension content, icons, and any later candidate package; a coordination-only commit must not silently change this payload identity.
4. **Provenance:** exact isolated-branch Git head used to produce the identity record plus exact test/certification run bindings.
5. **Channel:** `main` raw userscript is the currently encoded stable update/install stream; `agent/8.8-repair-resume` is candidate-only. No tag, Release, store, or extension-distribution channel is inferred without evidence.
6. **Publication state:** candidate completeness and `publishReady` are separate. This program may prove a candidate identity while `publishReady=false`; it may not publish.
7. **Dependency disposition:** the two previously observed high-severity npm-audit findings remain `UNKNOWN` as to exact package identity, shipped exploitability, and correct remediation until the dedicated audit assignment. They may not be erased with a blind upgrade.

## Official bounded BUILD-IDENTITY chain

### R7-A1-BUILD-IDENTITY-ORACLE

Create the smallest repository-native, falsifiable identity oracle and machine-readable candidate identity record without changing product semantics. It must verify the existing version-consistency contract, generated extension parity, canonical source relationship, expected stable-channel metadata, and payload hashes. It must record exact Git provenance and distinguish candidate branch from public stable channel. Deliberate version/generated/channel/payload drift fixtures or mutants must fail. The artifact must be executable locally/CI and must not publish anything.

### R7-A2-DEPENDENCY-AUDIT

On the exact identity-oracle candidate, obtain `npm audit --json` (or equally exact package-manager advisory evidence) against the committed lockfile and identify the two high-severity findings. Classify whether each affected package is dev/build/test-only or present in the shipped userscript/extension payload and whether a real shipped exploit path is evidenced. Do not infer exploitability from severity alone and do not perform a blanket upgrade. A concrete release-relevant vulnerability exposes the smallest dependency repair/test assignment before later BUILD-IDENTITY gates.

### R7-A3-BUILD-IDENTITY-REDTEAM-CI

Independently falsify the identity oracle with stale generated content, version divergence, payload-hash drift, and channel-confusion mutants while preserving all product safety assertions. Then obtain ordinary clean-head CI plus the identity oracle on the exact candidate. A failed mutant means the oracle is too weak; a genuine product/test regression creates the smallest bounded recovery rather than weakened assertions.

### R7-A4-BUILD-IDENTITY-FINAL-AUDIT

Independently re-read the candidate identity record, exact hashes/provenance, dependency-audit disposition, Red-Team sensitivity, and clean-head CI. Close BUILD-IDENTITY only if the identity is unambiguous, reproducible, non-published, and all release-relevant dependency findings are either remediated with evidence or explicitly shown not to enter the shipped payload. Preserve all earlier bounded certification limits. On acceptance, expose `DOCS-RECONCILIATION`; do not skip to publication or final release.

## Dependency and sequencing decision

Only `R7-A1-BUILD-IDENTITY-ORACLE` is dependency-ready now. A2 depends on A1; A3 depends on A1 and the A2 disposition (or any required dependency repair); A4 depends on A2/A3. `DOCS-RECONCILIATION` and `FINAL-CERT-PACKAGE` remain required later programs and are not activated early.

This ordering satisfies the maker v1.1 Delivery-Pressure Checkpoint: the next wake has a small falsifiable implementation/test artifact rather than a research fallback.

## Tests / CI in this planning step

No product test was newly executed as a claimed PASS for this supervisor-only planning step. Existing exact Round-6 clean-head evidence remains a prerequisite baseline, not a substitute for A1/A3 BUILD-IDENTITY execution. The source comparison described above was read-only and confirms no shippable path changed after that tested head.

## Risks and limits

- Current live ChatGPT/Claude structural insertion and physical/mobile platform claims remain outside this program's accepted scope.
- Main/publication is deliberately untouched; current stable main is `8.7.1` while the isolated candidate is `8.8.0`.
- No GitHub Release exists and current tags do not represent the 8.x release line; neither is promoted to authority by this plan.
- Firefox extension distribution identity is not established beyond the repository/local-load path and must not be invented.
- Dependency advisories are carried forward as an unresolved release-audit input, not silently accepted and not auto-fixed.

## Next action

Submit this supervisor assignment, release its lease, and make only `R7-A1-BUILD-IDENTITY-ORACLE` ready. Research remains temporarily ineligible while that executable artifact exists.
