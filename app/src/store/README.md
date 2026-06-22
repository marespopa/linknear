# `src/store/` — State

Single file today: `atoms.ts`. All persisted app state is a Jotai atom; `atomWithStorage` persists to localStorage under a key. Derived atoms compute from other atoms reactively.

## Existing atoms (kept, repurposed)

```ts
currencyAtom  = atomWithStorage('git-fi-currency', 'USD')
chainAtom     = atomWithStorage<Block[]>('git-fi-chain', [])
privacyAtom   = atomWithStorage('git-fi-private-mode', false)
historyAtom   = atomWithStorage<Record<string, { blocks: Block[]; seal: string; closingBalance: number }>>('git-fi-history', {})
balanceAtom   = atom(get => get(chainAtom).reduce((sum, b) => sum + b.amount, 0))
```

- **`currencyAtom`** — unchanged. Used for displaying debt amounts, payments, and HP-bar labels.
- **`privacyAtom`** — unchanged. Hides `$` amounts and HP numbers when on.
- **`chainAtom`** — **must change shape.** Today it's one flat `Block[]` for the whole app. DebtSlayer needs one independent hash-chain per debt (each Boss has its own payment history). Either:
  - embed a `chain: Block[]` field inside each `Debt` object in the new `debtsAtom` (recommended — keeps a Debt and its payment history as one unit), or
  - restructure into `Record<debtId, Block[]>` as a standalone atom.

  This is a breaking schema change for anyone with existing localStorage data — flag a one-time migration if backward compatibility with the ledger app's data matters.
- **`historyAtom`** — repurposed conceptually for archiving. Its `{ blocks, seal, closingBalance }` shape (see `Settings.tsx`'s "Close Month" flow) is the existing precedent for "snapshot + cryptographic seal + reset." Reuse this pattern for streak/season archives or defeated-Boss trophies, e.g. `{ payments: Block[], seal: string, closingDebtBalance: number }`.
- **`balanceAtom`** — becomes the basis for a "total remaining debt across all Bosses" derived atom (sum each Debt's `currentBalance` instead of summing one chain).

## New atoms to add

```ts
debtsAtom    = atomWithStorage<Debt[]>('debtslayer-debts', [])
playerAtom   = atomWithStorage<Player>('debtslayer-player', { xp: 0, level: 1, title: 'Debt Apprentice', streakCount: 0, lastCheckIn: null, multiplier: 1 })
strategyAtom = atomWithStorage<'avalanche' | 'snowball'>('debtslayer-strategy', 'avalanche')

// derived
activeBossAtom         = atom(get => getActiveBoss(get(debtsAtom), get(strategyAtom)))
bossQueueAtom           = atom(get => getBossQueue(get(debtsAtom), get(strategyAtom)))
totalDebtRemainingAtom  = atom(get => get(debtsAtom).reduce((sum, d) => sum + d.currentBalance, 0))
totalXpAtom             = atom(get => get(playerAtom).xp)
```

`getActiveBoss` / `getBossQueue` come from `src/logic/strategy.ts` — see `src/logic/README.md`.

## Naming

Existing storage keys use a `'git-fi-*'` prefix — a legacy name from before this app was DebtSlayer. New atoms should use a `'debtslayer-*'` prefix (as above). Decide explicitly whether to:
- leave `git-fi-*` keys as-is and let old ledger data coexist unused, or
- write a one-time migration that reads `git-fi-chain` and folds it into a new `Debt`/`debtsAtom` entry.

Don't silently rename keys — `atomWithStorage` will just start fresh under a new key name with no warning if you change it without migrating.
