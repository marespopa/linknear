# `src/components/` — UI

Flat component directory with sub-namespaces: `forms/` and `ui/` for shared primitives, `debtslayer/` (new) for feature components.

## Legacy components (ledger app)

| Component | Disposition |
|---|---|
| `TransactionForm.tsx` | Superseded by `debtslayer/PaymentForm.tsx`. Current income/expense toggle and merchant-name formatting (`formatNote`) go away — an Attack is always a debt-reducing payment, never income. |
| `TransactionHistory.tsx` | Superseded/repurposed as a per-Boss attack log. |
| `TransactionList.tsx` | Already unused/legacy. Delete. |
| `NetworkPanel.tsx` | Keep as-is. The P2P logic is debt-agnostic — it just needs to sync `debtsAtom`/`playerAtom` instead of (or in addition to) `chainAtom`. See `src/hooks/README.md`. |
| `Settings.tsx` | Keep and extend. "Close Month" archival pattern maps to an "Archive Season/Streak" feature; data-clear, privacy toggle, and currency symbol controls remain unchanged. |
| `ErrorBoundary.tsx` | Keep as-is, no changes needed. |
| `forms/Button.tsx`, `forms/Input.tsx`, `ui/SectionHeader.tsx` | Keep as the shared design-system primitives. No new design system needed — DebtSlayer components build on these. |

## `debtslayer/`

| Component | Purpose |
|---|---|
| `PlayerCard.tsx` | Level, title, XP bar, streak badge. |
| `BossCard.tsx` | Boss name, tier badge, HP bar (`currentBalance`/`totalAmount`), visually distinct "Active" vs queued state. |
| `BossGrid.tsx` | All Debts/Bosses screen — grid of `BossCard`, including defeated bosses with a skull icon + defeat date. |
| `PaymentForm.tsx` | Log Payment flow: select debt (defaults to active boss), amount input, live preview of damage dealt + XP earned + critical-hit indicator before confirming. |
| `SetupWizard.tsx` | Manual onboarding: add debts one at a time, choose strategy (avalanche/snowball). |
| `ImportWizard.tsx` | Bulk onboarding via PDF: upload a Biroul de Credit report, parse it (`logic/pdfImport.ts`), then edit/confirm each extracted debt before saving to `debtsAtom`. Only account type and the three amounts come from the report — creditor name, monthly payment, and interest rate all start blank/placeholder and are required fields before "Confirm" is enabled, since none of them are reliably present as text in the report. Lives alongside `SetupWizard.tsx` as a tab on the Setup screen — see `src/pages/README.md`. |
| `StatsPanel.tsx` | Debt payoff timeline, XP history, streak calendar, projected payoff date. |

`XPBar.tsx`/`HPBar.tsx` ended up in `ui/` rather than `debtslayer/` — they're generic progress bars with no boss/player-specific logic, so they sit with the other shared primitives.

## Charting decision

Recharts is explicitly **rejected** — it's a heavy dependency for a PWA that only needs a couple of simple charts (a payoff timeline and a contribution-grid-style streak calendar). For MVP, hand-roll these with SVG + Tailwind. Revisit only if chart complexity grows well beyond the spec's stats screen.

## Animation decision

No animation library is currently installed. For MVP, use CSS transitions (Tailwind's `transition-all`, `duration-*`) for HP-bar fills and level-up flashes. Framer Motion is a stretch/v2 addition only if CSS transitions prove insufficient for the "boss battle" feel — don't add it preemptively.

## PDF import decision

`pdfjs-dist` was added (the only non-spec dependency introduced so far) to extract text client-side from a Biroul de Credit PDF — no backend, consistent with the rest of the app. It's loaded via dynamic `import()` inside `logic/pdfImport.ts` rather than imported at the top level, so it ships as its own chunk and doesn't add to the bundle for users who never import a PDF. The parser was validated against a real (anonymized) report and only reads the report's summary table — see `src/logic/README.md` for exactly what is/isn't extractable and why the per-account detail pages aren't parsed at all.

## Visual tone

The current aesthetic (`indigo-950` palette, monospace "terminal" feel — see `App.tsx`, `TransactionForm.tsx`) was built for a ledger app. DebtSlayer's "boss battle" framing likely wants a different palette/typography — still Tailwind utility classes, just a different theme. This is a design decision, not an architecture one; doesn't block building the components above with whatever interim styling is convenient.
