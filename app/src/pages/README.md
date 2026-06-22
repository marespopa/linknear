# `src/pages/` — Screens

Top-level screen components composed from `src/components/debtslayer/*`. The legacy `HomePage.tsx` was unused and has been deleted.

| Screen | Contents |
|---|---|
| `Dashboard.tsx` | Player card, active boss HP bar, Quick Pay button → navigates to `pay`, greyed-out queue of next bosses. |
| `AllBosses.tsx` | `BossGrid` of all debts — active, queued, and defeated (with skull icon + defeat date). |
| `LogPayment.tsx` | `PaymentForm`: select debt (defaults to active boss), amount, damage/XP preview, confirm. |
| `Stats.tsx` | `StatsPanel`: total paid vs. remaining, overall payoff progress bar, bosses defeated, total XP. |
| `Setup.tsx` | Two tabs: **Manual Entry** (`SetupWizard`, add debts one at a time) and **Import PDF** (`ImportWizard`, bulk-import from a Biroul de Credit report — see `src/logic/README.md#pdfimportts`). Both write into the same `debtsAtom` and let the user pick the avalanche/snowball strategy before confirming. |

## Routing

No router library — `currentViewAtom` (`src/store/atoms.ts`) holds the active `View`, and `App.tsx` switches between screens based on it, with a nav bar built from the same view list. This avoids pulling in `react-router`/`wouter` for what's a small, fixed set of screens with no need for deep-linking.
