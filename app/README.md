# DebtSlayer

Turn every debt into a boss. Every payment is an attack. Pay it down, watch the HP bar drop, level up, become the Debt Legend.

DebtSlayer is a local-first, no-backend remake of this repo's previous app (a personal transaction ledger called `linknear`). The transaction-ledger machinery — hash-chained entries, P2P sync, offline PWA — is being kept and repurposed, not rewritten.

## Concept

| Old (ledger app) | New (DebtSlayer) |
|---|---|
| Transaction | Attack |
| (none — single balance) | Debt → Boss (HP = `currentBalance`, maxHP = `totalAmount`) |
| Running balance | Boss HP bar |
| (none) | Player: XP, level, title, streak |
| (none) | Strategy engine: Avalanche vs Snowball |
| Close Month (archive + new genesis block) | Archive streak/season, defeated-boss trophies |

Paying a debt logs an Attack against that debt's Boss: it deals damage equal to the payment amount, earns XP (more if it's a "critical hit" — a payment above the minimum), and can kill the Boss if it brings HP to 0.

## Status

**MVP (v1) — implemented:**
- Manual debt setup, plus bulk import from a Biroul de Credit PDF report (`Setup` screen, both tabs)
- Log payment → damage + XP preview → confirm
- Boss HP bar, tier, name
- Player XP + level + title, streak status
- Active Boss vs queued Bosses (driven by chosen strategy)
- Basic stats (totals, payoff progress, bosses defeated, XP)

**Explicitly out of scope for v1:** complex battle animations, AI-generated boss art, push notifications, multiplayer/accountability partners. These remain stretch goals.

PDF import was originally a stretch goal but was pulled into v1, and the parser (`src/logic/pdfImport.ts`) has now been validated against a real (anonymized) report — the first version's assumptions about field labels and number formatting were both wrong and were rewritten based on the actual layout. It only reads the report's account summary table (not the much longer per-account detail pages, which aren't reliably parseable as plain text). Creditor name, monthly payment, and interest rate are never extractable from this report at all and always require manual entry before saving — see that module's README section for the full breakdown.

## Tech Stack

- **Build tool:** Vite 7
- **UI:** React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS 4
- **State:** Jotai (`atomWithStorage` for persistence)
- **Persistence:** localStorage (via Jotai) — `idb-keyval` is a dependency for larger data if localStorage quota becomes a problem
- **Sync:** PeerJS (WebRTC P2P, no server)
- **Offline:** vite-plugin-pwa
- **IDs:** nanoid
- **Integrity:** Web Crypto SHA-256 hash chains (`src/logic/crypto.ts`)
- **PDF parsing:** pdfjs-dist (loaded on demand via dynamic `import()` — not in the main bundle)

**Deliberately not used:** Next.js, Prisma, SQLite, Zustand, Recharts, Framer Motion. The original product spec for this app assumed that stack, but it was rejected: the app deploys to Netlify as a static site, and the current Vite SPA is already local-first; Next.js + server-side SQLite doesn't actually work on serverless hosting (no persistent filesystem across function invocations). Charts and animation needs are small enough to handle with hand-rolled SVG/Tailwind and CSS transitions — see `src/components/README.md`.

## Project Structure

```
src/
├── App.tsx              # Root layout/composition
├── main.tsx             # Entry point
├── components/          # see src/components/README.md
│   ├── forms/           # Button, Input — shared primitives
│   ├── ui/               # SectionHeader — shared primitives
│   └── debtslayer/      # (new) Boss/Player/Payment UI
├── hooks/               # see src/hooks/README.md
├── logic/               # see src/logic/README.md — pure functions, no React/Jotai imports
├── pages/               # see src/pages/README.md
└── store/               # see src/store/README.md — Jotai atoms
```

## Data Model At a Glance

- **`Block`** (`src/logic/crypto.ts`) — a hash-linked ledger entry: `{ index, amount, note, timestamp, parentHash, hash }`. Unchanged. Each Debt/Boss gets its own chain of Blocks (its payment history), instead of one global chain.
- **`Debt` / Boss** (new, `src/store/atoms.ts`) — `{ id, name, bossName, tier, totalAmount, currentBalance, interestRate, minimumPayment, chain: Block[] }`.
- **`Player`** (new) — `{ xp, level, title, streakCount, lastCheckIn, multiplier }`.

## Getting Started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build
npm run lint      # eslint
```

## Key Game Mechanics

- **Boss tiers** by debt size: Goblin → Orc Warlord → Dragon → Ancient Dragon → Raid Boss (see `src/logic/README.md` for thresholds).
- **XP per attack** = `amount / 10`, ×1.5 if the payment exceeds the minimum (critical hit). Killing a Boss awards a bonus of `maxHP / 5` XP.
- **Levels:** 5 thresholds (500/1,500/3,000/6,000/10,000 XP) mapped to titles Debt Apprentice → Hunter → Warrior → Slayer → Legend.
- **Streaks** affect XP multiplier only — never financial amounts or penalties.
- **Strategy:** Avalanche (highest interest rate first) or Snowball (lowest balance first) determines which Boss is "Active" and the order of the "Next Bosses" queue.

## Contributing / Conventions

- Tailwind utility classes inline — no separate CSS files beyond `index.css`.
- Pure game-math logic lives in `src/logic/` with no React/Jotai imports (testable in isolation).
- All persisted state goes through Jotai `atomWithStorage` in `src/store/atoms.ts` — don't reach for new storage mechanisms without updating that README.
- Every `Block` must stay hash-chain-valid (`isValidChain` in `src/logic/crypto.ts`) — don't mutate chains in place.
