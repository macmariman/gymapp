# AGENTS.md

## Prisma workflow

- Use `prisma migrate dev` only against the local/development database, never against production.
- Use `prisma migrate deploy` only for production/staging deploys to apply already committed migrations.
- On Vercel deployments, `vercel-build` already runs `prisma migrate deploy`; do not ask the user to run it manually unless they are migrating outside the normal deploy flow.
- Never create Prisma migration files manually; always generate them with the appropriate Prisma command.
- Never edit or rewrite an existing migration that has already been committed or applied in another environment; create a new migration instead.
- Never run database migrations yourself. When a migration is needed, provide the exact command and let the user run it.
