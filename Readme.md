# DebtSlayer

Turn every debt into a boss. Every payment is an attack. Pay it down, watch the HP bar drop, level up, become the Debt Legend.

DebtSlayer is a local-first, no-backend PWA that gamifies debt payoff: each debt becomes a "boss" with an HP bar (its remaining balance), each payment you log becomes an "attack" that damages it, and you earn XP, levels, and streaks along the way. It's a from-scratch remake of this repo's original app — a personal transaction ledger — repurposing the same hash-chained ledger and P2P sync machinery under a new game-shaped concept.

| Debt terms | Game terms |
|---|---|
| Debt | Boss (HP = current balance, max HP = original total) |
| Payment | Attack |
| Payment history | Attack log (hash-chained, tamper-evident) |
| — | Player: XP, level, title, streak |
| Avalanche / Snowball strategy | Which boss is "Active" vs. queued |

## Where the code lives

The actual application is in [`app/`](app/) — a Vite + React + TypeScript SPA. See [`app/README.md`](app/README.md) for the full concept writeup, tech stack, data model, and project status.

## Getting started

```bash
cd app
npm install
npm run dev      # local dev server
npm run build    # production build
npm run lint      # eslint
```

## For AI agents

See [`AGENTS.md`](AGENTS.md) for conventions and constraints to follow when working in this codebase.
