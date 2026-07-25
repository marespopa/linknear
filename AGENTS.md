# Agent instructions

This repo contains **DebtSlayer**, a gamified debt-payoff PWA. The actual app lives in [`app/`](app/) — a Vite + React 19 + TypeScript SPA, not a monorepo with multiple packages. All commands below run from `app/`.

Read [`app/README.md`](app/README.md) first for the full concept, tech stack, and data model. Each `app/src/*` subdirectory also has its own `README.md` — read the relevant one before making non-trivial changes there:

- [`app/src/components/README.md`](app/src/components/README.md)
- [`app/src/hooks/README.md`](app/src/hooks/README.md)
- [`app/src/logic/README.md`](app/src/logic/README.md)
- [`app/src/pages/README.md`](app/src/pages/README.md)
- [`app/src/store/README.md`](app/src/store/README.md)

## Commands

```bash
cd app
npm install
npm run dev       # dev server
npm run build     # tsc -b && vite build
npm run lint       # eslint, zero warnings allowed
npm run lint:fix
```

No test framework is configured yet. If you add one, Vitest is the natural fit (Vite is already the build tool) — flag this decision explicitly rather than silently adding a different runner.

## Architecture rules

- **`src/logic/`** is pure functions only — no React or Jotai imports. Keep it that way so it stays unit-testable in isolation.
- **`src/store/atoms.ts`** is the only place persisted state is defined, via Jotai's `atomWithStorage`. Don't reach for a new storage mechanism (a new localStorage key written ad hoc, sessionStorage, etc.) without updating that file/README.
- **`src/hooks/`** is the only layer that wires `src/store` atoms together with `src/logic` functions for components to consume. Components shouldn't call `src/logic` functions directly while also reading atoms inline — go through a hook.
- No router library is used. `currentViewAtom` plus a manual switch in `App.tsx` drives navigation. Don't introduce `react-router`/`wouter` for the current fixed small screen set.

## Invariants — don't break these

- **Hash chains**: every `Block` (in `src/logic/crypto.ts`) must stay valid per `isValidChain`. Never mutate a chain in place; always append and re-derive.
- **Streaks are XP-only**: `src/logic/streak.ts` and the streak multiplier must never alter `currentBalance`, `minimumPayment`, or any other money figure on a `Debt` — only `playerAtom.multiplier`. This was an explicit product decision, not an oversight.
- **Atom key naming**: new persisted atoms use a `'debtslayer-*'` storage key prefix. Legacy keys (`'git-fi-*'`) are from before this was DebtSlayer and are being phased out, not extended. Never silently rename an existing atom's storage key — `atomWithStorage` will just start fresh with no warning and existing users lose their data; write a migration if you need to change one.
- **PDF import (`src/logic/pdfImport.ts`)**: only the Biroul de Credit report's summary table is parsed. Creditor name, monthly payment, and interest rate are *not* reliably extractable as plain text from that report at all (see that file's README section for why) and are always left blank for manual entry — don't try to "fix" this without first reading the full breakdown there, it's already been tried and reverted twice.

## Explicitly rejected dependencies

Don't reintroduce these without a real discussion — they were considered and turned down for this app specifically:

- **Next.js / Prisma / SQLite** — app deploys as a static site (Netlify); server-side SQLite doesn't survive serverless function invocations.
- **Zustand** — Jotai is already the state layer.
- **Recharts** — too heavy for the couple of simple charts (payoff timeline, streak calendar) this app needs; hand-roll with SVG + Tailwind instead.
- **Framer Motion** — CSS transitions (`transition-all`, `duration-*`) are sufficient for HP-bar fills and level-up flashes; only revisit if that proves inadequate.

## Style

- Tailwind utility classes inline, no separate CSS files beyond `index.css`.
- TypeScript strict mode is on — don't loosen `tsconfig` to work around a type error.
