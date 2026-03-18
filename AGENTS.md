# AGENTS.md

## UI verification workflow

- The project includes a custom subagent named `browser_verifier`.
- After finishing a significant UI change, a flow change, or a large visual refactor, remind the user to validate the result with `browser_verifier` with a possible prompt.
- Use `browser_verifier` to verify local uncommitted changes against the running app. It should validate the primary flow, compare expected versus observed behavior, and report `pass`, `fail`, or `inconclusive` with exact reproduction steps.
- Do not use `browser_verifier` as a replacement for automated tests. It is a pragmatic browser validation step for real UI behavior.
- Example prompt:

```text
Spawn browser_verifier and validate the workout save flow against my local uncommitted changes. Do not edit code. Report pass/fail, exact steps, and evidence if something breaks.
```

## Prisma workflow

- Use `prisma migrate dev` only against the local/development database, never against production.
- Use `prisma migrate deploy` only for production/staging deploys to apply already committed migrations.
- On Vercel deployments, `vercel-build` already runs `prisma migrate deploy`; do not ask the user to run it manually unless they are migrating outside the normal deploy flow.
- Never create Prisma migration files manually; always generate them with the appropriate Prisma command.
- Never edit or rewrite an existing migration that has already been committed or applied in another environment; create a new migration instead.
- Never run database migrations yourself. When a migration is needed, provide the exact command and let the user run it.
