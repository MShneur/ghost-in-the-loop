# Final Release Automation

Ghost in the Loop uses a fail-closed GitHub Actions workflow for final public releases:

- workflow: `.github/workflows/publish-final-release.yml`
- final tag format: `vX.Y.Z`
- final release title: `Ghost in the Loop X.Y.Z`
- the requested target is normally the exact current `main` commit
- an older target is allowed only when it is an ancestor of current `main` and every release-identity path is byte-for-byte unchanged on current `main`
- release-identity paths are `package.json`, `package-lock.json`, the userscript, generated extension manifest/content, and both shipped icons
- package, lockfile, userscript, and extension manifest versions must all equal `X.Y.Z`
- repository certification, lint, unit tests, BUILD-IDENTITY, package/checksum verification, Chromium, and Firefox E2E safety tests must all pass on the exact requested target before publication
- the certified package assets are uploaded to the workflow artifact store immediately after package verification, before Playwright can clean its disposable `test-results` workspace
- verification and dependency/test execution run with read-only repository contents permission
- an early artifact upload does not authorize publication: the write-capable publication job runs only if the entire verify job, including E2E, finishes successfully
- the write-capable token exists only in that separate post-verification publication job
- the publication job repeats the target/ancestor/payload-identity checks immediately before any tag or Release write
- the workflow will not move an existing mismatched tag
- an existing exact matching tag may be reused only when recovering from a later GitHub Release API failure
- publication uses a bot-marked draft Release, uploads the verified assets, and only then publishes the final Release
- a bot-marked draft may be resumed after a failed upload/API attempt; unrelated drafts and prereleases fail closed
- release assets include the certified userscript, `SHA256SUMS`, and `package-manifest.json`

The ancestor rule exists for a narrow but important case: release-process documentation or automation may land on `main` after a product commit has already been certified. The older product commit may still be tagged exactly, but only while every shipped/version identity path remains identical. Any release-payload drift closes that path automatically.

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

`target_sha` is the full 40-character lowercase SHA that should receive the immutable version tag. The workflow verifies that it is either current `main`, or an ancestor whose complete release identity is still byte-identical to current `main`. Opening the issue is the publication trigger; there is no separate label step.

On success, the workflow creates the immutable tag, publishes the normal final GitHub Release, comments on the issue, and closes it. On failure, it comments with the Actions run and leaves the issue open for investigation.

## Manual fallback

The same workflow supports `workflow_dispatch`. Run it only from `main` and provide:

- `version`: semantic version without the `v` prefix
- `target_sha`: exact release commit SHA
- `confirm`: `RELEASE`

Selecting any workflow ref other than `main` fails closed.

## MCP integration contract

A future custom ChatGPT MCP app does not need direct Git-tag or Release mutation if it can invoke this repository-controlled release path. The smallest useful MCP surface is:

1. read current `main` SHA and the intended exact release SHA;
2. read package/userscript version;
3. create the owner release-request issue above, or dispatch `Publish Final Release` on `main`;
4. read the resulting Actions run;
5. read the final tag and GitHub Release.

Keeping the safety policy in the repository is preferable to duplicating release logic inside each external client. The MCP client should request a release; the repository workflow remains the authority that validates and publishes it.

## Scope boundary

This workflow publishes the Git tag, GitHub Release, and listed release assets only. It does not publish browser-store packages, change extension-store channels, or certify physical devices. Those remain separate actions when applicable.
