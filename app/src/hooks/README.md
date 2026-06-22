# `src/hooks/` — Bridging atoms + logic into components

Thin hooks that wire Jotai atoms and `src/logic/` pure functions together for components to consume.

## Existing: `useLedger.ts`

```ts
const { addTransaction, chain } = useLedger()
addTransaction(amount: number, note: string): Promise<void>
```

Appends a hash-chained `Block` to `chainAtom`. Needs to become debt-aware: either parametrize by `debtId` and write into that Debt's embedded `chain`, or be wrapped/replaced entirely by a new `useAttack(debtId)` hook that also computes XP and detects boss kills. Recommendation: replace rather than parametrize, since an Attack has side effects (XP, level-up, boss-kill) that a generic ledger append doesn't have.

## Existing: `useP2P.ts`

```ts
const { myId, connections, connectToPeer, broadcast, logs, status } = useP2P()
```

Currently broadcasts/merges a single `chainAtom: Block[]` — dedup by hash via `Map`, sorted by timestamp, re-broadcast reactively whenever `chainAtom` changes (see the `useEffect` watching `chain` and the `conn.on('data', ...)` merge logic). This hash-map-merge-by-hash strategy generalizes cleanly: once chains are per-debt, sync each `Debt.chain` independently using the same merge approach, plus sync `playerAtom` (last-write-wins is probably fine for XP/level, since it's derived from attacks which are already conflict-free via hash dedup).

## New hooks to add

```ts
useAttack(debtId: string): { logPayment: (amount: number) => Promise<void>; isProcessing: boolean; error: string | null }
  // appends a Block to that debt's chain, calls logic/xp.ts to compute XP + critical hit,
  // updates playerAtom (xp, level, title), checks for boss kill (currentBalance <= 0) and awards the kill bonus

usePlayer(): { xp, level, title, progress } 
  // reads playerAtom, derives progress-to-next-level via logic/xp.ts's getXpProgress

useStrategy(): { activeBoss, queue, strategy, setStrategy }
  // reads strategyAtom + debtsAtom, derives via logic/strategy.ts

useStreak(): { streakCount, status, checkIn }
  // wraps logic/streak.ts against playerAtom
```
