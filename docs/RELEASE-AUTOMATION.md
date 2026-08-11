# Final Release Automation

Ghost in the Loop uses a fail-closed GitHub Actions workflow for final public releases:

- workflow: `.github/workflows/publish-final-release.yml`
- final tag format: `vX.Y.Z`
- final release title: `Ghost in the Loop X.Y.Z`
- target must be the exact current `main` commit
- package, lockfile, userscript, and extension manifest versions must all equal `X.Y.Z`
- repository certification, lint, unit tests, BUILD-IDENTITY, package/checksum verification, Chromium, and Firefox E2E safety tests must all pass before publication
- verification and dependency/test execution run with read-only repository contents permission
- the write-capable token exists only in a separate post-verification publication job
- the publication job re-checks that `main` still points to the exact verified SHA before any tag or Release write
- the workflow will not move an existing mismatched tag
- an existing exact matching tag may be reused only when recovering from a later GitHub Release API failure
- publication uses a bot-marked draft Release, uploads the verified assets, and only then publishes the final Release
- a bot-marked draft may be resumed after a failed upload/API attempt; unrelated drafts and prereleases fail closed
- release assets include the certified userscript, `SHA256SUMS`, and `package-manifest.json`

## ChatGPT / GitHub connector path

The workflow deliberately supports an owner-authored GitHub issue as a release request. This allows a connected ChatGPT GitHub client that can create issues, but cannot directly create Git tags or GitHub Releases, to complete the release end-to-end through repository automation.

Create an issue whose title begins exactly with:

```text
[release-final]
```

The issue must be authored by the repository owner and its body must contain exactly one line for each field:

```text
version: 8.8.0
target_sha: 0123456789abcdef0123456789abcdef01234567
confirm: RELEASE
```

The `target_sha` must be the full 40-character lowercase SHA of the current `main` head. Opening the issue is the publication trigger; there is no separate label step.

On success, the workflow creates the immutable tag, publishes the normal final GitHub Release, comments on the issue, and closes it. On failure, it comments with the Actions run and leaves the issue open for investigation.

## Manual fallback

The same workflow supports `workflow_dispatch`. Run it only from `main` and provide:

- `version`: semantic version without the `v` prefix
- `target_sha`: exact current `main` SHA
- `confirm`: `RELEASE`

Selecting any ref other than `main` fails closed.

## MCP integration contract

A future custom ChatGPT MCP app does not need direct Git-tag or Release mutation if it can invoke this repository-controlled release path. The smallest useful MCP surface is:

1. read current `main` SHA;
2. read package/userscript version;
3. create the owner release-request issue above, or dispatch `Publish Final Release` on `main`;
4. read the resulting Actions run;
5. read the final tag and GitHub Release.

Keeping the safety policy in the repository is preferable to duplicating release logic inside each external client. The MCP client should request a release; the repository workflow remains the authority that validates and publishes it.

## Scope boundary

This workflow publishes the Git tag, GitHub Release, and listed release assets only. It does not publish browser-store packages, change extension-store channels, or certify physical devices. Those remain separate actions when applicable.
