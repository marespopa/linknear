# `src/logic/` — Pure game/business logic

No React, no Jotai imports here — every module is plain functions operating on plain data, so they're trivially unit-testable.

## Existing: `crypto.ts`

```ts
interface TransactionData { index, amount, note, timestamp }
interface Block extends TransactionData { hash, parentHash }

generateHash(data: TransactionData, parentHash: string): Promise<string>   // SHA-256, base64 fallback if insecure context
validateBlock(block: Block, parentHash: string): Promise<boolean>
isValidChain(chain: Block[]): boolean
generateMonthSeal(lastBlockHash: string, totalBalance: number): Promise<string>
```

Stays exactly as-is. Becomes the integrity layer underneath each Boss's payment chain — one `Block[]` per Debt instead of one global chain (see `src/store/README.md`). `generateMonthSeal` is reused for streak/season archival sealing, not just literal months.

## `boss.ts`

```ts
type BossTier = 'Goblin' | 'OrcWarlord' | 'Dragon' | 'AncientDragon' | 'RaidBoss'

getBossTier(totalAmount: number): BossTier
generateBossName(tier: BossTier, debtName?: string): string
getBossHpPercent(currentBalance: number, totalAmount: number): number
```

Tier thresholds as implemented:

| Total debt | Tier |
|---|---|
| < 5,000 | Goblin |
| 5,000–20,000 | Orc Warlord |
| 20,000–50,000 | Dragon |
| 50,000–150,000 | Ancient Dragon |
| > 150,000 | Raid Boss |

## `xp.ts`

```ts
calculateAttackXp(amount: number, minimumPayment: number): { xp: number; isCritical: boolean }
  // xp = amount / 10, isCritical = amount > minimumPayment, xp *= 1.5 if isCritical

calculateBossKillBonus(maxHP: number): number
  // maxHP / 5

LEVEL_THRESHOLDS = [500, 1500, 3000, 6000, 10000]
getLevelForXp(xp: number): number
getTitleForLevel(level: number): string
  // 1: Debt Apprentice, 2: Debt Hunter, 3: Debt Warrior, 4: Debt Slayer, 5+: Debt Legend
getXpProgress(xp: number, level: number): { current: number; needed: number; percent: number }
```

## `strategy.ts`

```ts
sortByAvalanche(debts: Debt[]): Debt[]   // highest interestRate first
sortBySnowball(debts: Debt[]): Debt[]    // lowest currentBalance first
getActiveBoss(debts: Debt[], strategy: 'avalanche' | 'snowball'): Debt | null
getBossQueue(debts: Debt[], strategy: 'avalanche' | 'snowball'): Debt[]  // everything except the active boss, in strategy order
```

Defeated debts (`currentBalance <= 0`) are excluded from both the active slot and the queue.

## `streak.ts`

```ts
getStreakStatus(lastCheckIn: number | null, now: number): 'active' | 'grace' | 'broken'
getStreakMultiplier(streakCount: number): number   // affects XP only — never financial amounts/penalties
recordCheckIn(player: Player): Player
```

The "not financial penalties" rule from the product spec is load-bearing: a broken streak must never alter `currentBalance`, `minimumPayment`, or any money figure — only `playerAtom.multiplier`.

## `pdfImport.ts`

```ts
interface ExtractedDebt {
  creditor: string;       // always a placeholder, see below
  accountType: string;
  status: string;         // free-text "Starea" column, informational only
  currentBalance: number;
  totalAmount: number;
  overdueAmount: number;
  lastUpdated: string | null;
  isActive: boolean;      // currentBalance > 0
}

extractTextFromPdf(file: File): Promise<string>
parseCreditBureauReport(text: string): ExtractedDebt[]
```

Parses Romanian "Biroul de Credit" report PDFs so a user can bulk-import their debts instead of typing each one in manually. Two stages:

- `extractTextFromPdf` — pulls raw text out of every page using `pdfjs-dist`, loaded via a dynamic `import()` inside the function (not a top-level import) so it isn't bundled into the main app chunk.
- `parseCreditBureauReport` — reads the **summary table** that appears near the start of the report (it does not attempt to read the much longer per-account detail pages later in the document — see below for why). Each row in that table has the shape `date accountType status amount amount amount "Cont N" currency`, e.g.:

  ```
  17-06-2026 Credit ipotecar Cont fara restante 494,710 457,498 0 Cont 3 RON
  ```

  `accountType` is matched against a known vocabulary (`Credit ipotecar`, `Credit de consum`, `Linie de credit`, `Revolving (card de credit)`, etc.) because there's no delimiter between it and the free-text `status` that follows — the type has to be recognized to know where the status text starts and ends. Rows are de-duplicated by their `"Cont N"` label, because the summary table has been observed to repeat verbatim later in the document (e.g. as a page recap).

This was validated against a real (anonymized) report and revised twice from the original guess:

1. There is no `Participant:` label anywhere in the report — the original assumption about field labels was wrong for this layout, full stop.
2. Amounts use **comma as a thousands separator with no decimals** (`494,710` = 494710), not the dot-thousands/comma-decimal format assumed initially. `parseAmount` now infers the decimal separator from how many digits follow the last punctuation mark (1–2 digits ⇒ decimal, otherwise another thousands group) instead of assuming one locale.
3. The bank/creditor name is **not present as text** in the report — it renders as a logo image in that column. `creditor` is always the placeholder `"Account N"`; `ImportWizard.tsx` requires the user to type in the real name before confirming.

What's extractable vs. not, per the real report:

| Field | Extractable | Notes |
|---|---|---|
| Account type | Yes | from the summary table, matched against a known vocabulary |
| Current balance | Yes | summary table |
| Original amount | Yes | summary table |
| Overdue amount | Yes | summary table |
| Last updated | Yes | summary table |
| Status (Starea) | Yes, as free text | shown to the user for context; not used to classify active/closed — `isActive` is decided purely by `currentBalance > 0`, since the status wording is too varied to pattern-match reliably (e.g. "Cont platit sau închis/sold zero", "Cont platit complet în avans, renuntare voluntara la subiectul contractului", "Renuntare voluntara a clientului la subiectul contractului" are all different ways of saying "closed") |
| Creditor / bank name | No | renders as an image, not text — always a placeholder, always manual |
| Monthly payment | No | the only place it appears is the per-account detail section, where column headers and their values get extracted as two separate, non-adjacent runs of text (header1: header2: header3: ... value1 value2 value3 ...) — there's no positional information left to zip them back together from a plain text stream. Always blank, always manual. |
| Interest rate | No | not present in the report at all — always manual |

The per-account detail pages are not parsed at all for the reason above — recovering values from them would need position-aware extraction (e.g. reading `getTextContent()` item coordinates and reconstructing the table by (x, y), not just concatenating `str` values), which is a meaningfully bigger feature than label-matching and isn't implemented.

## Testing

No test framework is configured yet. Since these are pure functions and Vite is already the build tool, Vitest is the natural fit — flagged here as an open decision for whoever adds test coverage. `parseCreditBureauReport` in particular should get a regression test pinned to the real sample summary table that motivated this rewrite, since that's the only thing that caught the original number-format bug.
