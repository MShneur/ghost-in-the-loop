# Parked GitHub Actions workflows

GitHub-hosted Actions are last-resort execution only. Workflows in this directory are intentionally inactive and preserved for rollback/reference.

Do not move a workflow back into `.github/workflows/`, add an automatic trigger, or dispatch a hosted replacement unless the repository owner explicitly approves the exact purpose and bounded Actions spend.

`publish-final-release.yml` was parked intact so release logic is not lost. Prefer a non-Actions release/verification lane. If hosted GitHub execution is genuinely required, review the workflow first, restore it deliberately, and keep invocation manual-only.
