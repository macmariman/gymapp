# Gym App

Workout tracking app built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Jest.

## Tech Stack

- Next.js 15
- React 19
- TypeScript with strict mode
- Tailwind CSS 4
- shadcn/ui primitives
- Prisma with PostgreSQL
- Jest and React Testing Library
- ESLint and Prettier

## Features

- Fixed workout routine loaded from seed data
- Monthly attendance derived from saved sessions
- Weight logging by set for weighted exercises
- Read-only history of saved sessions

## Project Structure

```text
.
├── app/
│   ├── error/
│   ├── global-error.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── docs/
│   └── ui/
├── prisma/
│   └── schema.prisma
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   └── lib/
│       ├── api/
│       ├── logger.ts
│       ├── prisma.ts
│       └── utils.ts
├── eslint.config.js
├── jest.config.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── prettier.config.mjs
└── tsconfig.json
```

## Getting Started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Setup

Use Neon PostgreSQL in Vercel. Configure these environment variables:

```bash
POSTGRES_PRISMA_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=require"
```

For local development, run:

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed
```

For production deployments on Vercel:

- `vercel-build` already runs `prisma generate && prisma migrate deploy && next build`
- do not run `npx prisma migrate deploy` manually as part of the normal Vercel deploy flow

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
npm run test
npm run test:watch
npm run test:coverage
npm run test:ci
npm run db:seed
npm run format
npm run check
```

## Notes

- `src/components/ui/` contains generated shadcn/ui primitives. Prefer composing them instead of rewriting them.
- `WorkoutSession` is the source of truth for monthly attendance.
- The first version is single-user and does not include authentication.

## Documentation

- [`docs/ui/shadcn-ui-documentation.md`](docs/ui/shadcn-ui-documentation.md)
