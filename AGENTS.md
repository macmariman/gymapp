# AGENTS.md

## Prisma workflow

- Use `prisma migrate dev` only against the local/development database, never against production.
- Use `prisma migrate deploy` only for production/staging deploys to apply already committed migrations.
- Never create Prisma migration files manually; always generate them with the appropriate Prisma command.
- Never edit or rewrite an existing migration that has already been committed or applied in another environment; create a new migration instead.
- Never run database migrations yourself. When a migration is needed, provide the exact command and let the user run it.

