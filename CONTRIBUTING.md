# Contributing

Use Bun 1.4.4, run `bun install --frozen-lockfile`, and create a small topic branch.
Keep this initial change a scaffold. Agree on the protocol before adding game state.
Annotate non-obvious source decisions for the class assignment; explain invariants,
trust boundaries, and timing choices rather than repeating each line of code.

Before opening a PR:

```sh
bun run format
bun run check
```

Commit `bun.lock` whenever dependencies change. Use `bun add --exact` (or
`bun add --dev --exact`) and check peer compatibility; Elysia must stay on stable
1.4.31 until a deliberate migration. Never commit `node_modules`, `dist`, generated
route trees, `.env` files, credentials, or runtime game state. Add a meaningful Bun
test when implementing a behavior boundary; do not fabricate tests for placeholders.

Use type-only server imports from the client. Keep answer keys in `quizzes` and
server modules. Add public protocol changes to `src/shared/protocol.ts`, then update
handlers, clients, tests, and `docs/architecture.md` together. The caller that opens
a socket must close it on cleanup and handle connection failures.

CI runs on PRs, `main` pushes, and manual dispatch. Its stable workflow/job names
are **CI / Quality** (the check appears as **Quality** in GitHub). The single job
installs with the frozen lockfile, checks formatting, type-aware lint with zero
warnings, all project types, Bun tests, and the production build. No CI secrets are
needed. Render's After CI Checks Pass reads the checks on the `main` commit.

The repository's existing **Protect main** ruleset requires a pull request and one
approval, and prevents branch deletion and force pushes. The scaffold setup adds
the **Quality** check as a merge requirement. Keep its name stable when editing CI.
Dependabot uses the supported
`bun` ecosystem for text `bun.lock`, plus `github-actions`, on a weekly schedule.
Review and run checks on its PRs; Bun version updates do not imply complete
transitive security-alert coverage. [GitHub ecosystem support](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).
