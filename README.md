# Next.js Boilerplate

A focused starter built with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma, and Jest. This repository is intended as a clean base for new product work, not as a batteries-included framework.

## Tech Stack

- Next.js 15
- React 19
- TypeScript with strict mode
- Tailwind CSS 4
- shadcn/ui primitives
- Prisma with SQLite
- Jest and React Testing Library
- ESLint and Prettier

## Included

- App Router structure under `app/`
- Shared UI and layout components under `src/components/`
- Prisma client helper and example schema
- Theme provider and theme toggle
- Error boundary and centralized logging helpers
- Jest configuration for unit and component tests

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
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
npm run format
npm run check
```

## Notes

- `src/components/ui/` contains generated shadcn/ui primitives. Prefer composing them instead of rewriting them.
- Prisma is configured for SQLite by default through `DATABASE_URL` in `.env`.
- Prettier configuration lives in `prettier.config.mjs`.
- This template does not currently include Docker, Playwright, or React Hook Form.

## Documentation

- [`docs/ui/shadcn-ui-documentation.md`](docs/ui/shadcn-ui-documentation.md)
