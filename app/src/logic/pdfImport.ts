export interface ExtractedDebt {
  creditor: string;
  accountType: string;
  status: string;
  currentBalance: number;
  totalAmount: number;
  overdueAmount: number;
  lastUpdated: string | null;
  isActive: boolean;
}

// pdfjs-dist is only needed when a user actually imports a PDF, so it's
// loaded on demand instead of bundled into the main app chunk.
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  return pdfjsLib;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(text);
  }

  return pageTexts.join('\n');
}

// Loan product categories as classified in Biroul de Credit reports. The
// summary table's text layout is "date TYPE STATUS amount amount amount
// Cont N CURRENCY" with no delimiter between TYPE and STATUS, so TYPE has to
// be matched against this known vocabulary to know where STATUS starts.
// Longest-first so e.g. "Revolving (card de credit)" isn't shadowed by a
// shorter alternative.
const ACCOUNT_TYPES = [
  'Revolving \\(card de credit\\)',
  'Card de credit',
  'Credit ipotecar',
  'Credit de consum',
  'Credit auto',
  'Linie de credit',
  'Leasing',
  'Overdraft',
  'Microcredit',
];

const ROW_PATTERN = new RegExp(
  `(\\d{2}-\\d{2}-\\d{4})\\s+(${ACCOUNT_TYPES.join('|')})\\s+(.+?)\\s+([\\d.,]+)\\s+([\\d.,]+)\\s+([\\d.,]+)\\s+Cont\\s+(\\d+)\\s+(RON|EUR|USD)`,
  'g'
);

// Amounts seen in these reports use comma as a thousands separator (e.g.
// "494,710" = 494710), not the dot-thousands/comma-decimal format used
// elsewhere in Romanian documents. Rather than assume one locale, decide
// whether the last punctuation mark is a decimal point by how many digits
// follow it (1-2 digits = decimal, otherwise it's another thousands group).
function parseAmount(raw: string): number {
  const cleaned = raw.trim();
  if (!cleaned) return 0;

  const lastSep = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  if (lastSep === -1) {
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : 0;
  }

  const intPart = cleaned.slice(0, lastSep).replace(/[.,]/g, '');
  const fracPart = cleaned.slice(lastSep + 1).replace(/[.,]/g, '');
  const normalized =
    fracPart.length > 0 && fracPart.length <= 2 ? `${intPart}.${fracPart}` : intPart + fracPart;

  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

// The detail section later in the report ("Detalii conturi") repeats one
// block per account, in the same order as the summary table, with the
// creditor's actual name as text: "Participant: <name>  <participant code>
// Tip participant: ...". The participant code is some bank-specific id
// (IBAN-like, or with underscores/hex) with no spaces, so it's matched
// generically rather than assuming a format. The negative lookbehind avoids
// matching the unrelated "Tip Participant: <category>" line in the summary
// header, which contains "Participant:" as a substring.
const PARTICIPANT_PATTERN = /(?<!Tip )Participant:\s+(.+?)\s+[A-Za-z0-9_-]{6,}\s+Tip participant:/g;

function extractCreditorNames(text: string): string[] {
  return Array.from(text.matchAll(PARTICIPANT_PATTERN), (m) => m[1].trim());
}

// Product types that behave as reusable credit lines (balance can be drawn
// back down after being paid off), as opposed to a fixed installment loan.
const REVOLVING_ACCOUNT_TYPES = new Set([
  'Revolving (card de credit)',
  'Card de credit',
  'Linie de credit',
  'Overdraft',
]);

export function isRevolvingAccountType(accountType: string): boolean {
  return REVOLVING_ACCOUNT_TYPES.has(accountType);
}

/**
 * Parses the per-account summary table near the start of a Romanian "Biroul
 * de Credit" report — one row per credit account. The much longer detail
 * section later in the report (one block per account) dumps most of its
 * field labels and values separately rather than adjacent to each other, so
 * text extraction can't reliably zip those other fields back together —
 * except the creditor name, which is pulled from that detail section's
 * "Participant:" line (see PARTICIPANT_PATTERN) and zipped back in by
 * position, since both sections list accounts in the same order.
 *
 * The summary table can appear more than once in the document (e.g. as a
 * recap on a later page); rows are de-duplicated by their "Cont N" label, and
 * only the first (accepted) occurrence of each advances the creditor-name
 * position, keeping it aligned with the detail section.
 */
export function parseCreditBureauReport(text: string): ExtractedDebt[] {
  const creditorNames = extractCreditorNames(text);
  const seen = new Map<string, ExtractedDebt>();
  let acceptedIndex = 0;

  for (const match of text.matchAll(ROW_PATTERN)) {
    const [, lastUpdated, accountType, status, totalRaw, balanceRaw, overdueRaw, contNumber] =
      match;

    if (seen.has(contNumber)) continue;

    const currentBalance = parseAmount(balanceRaw);
    const totalAmount = parseAmount(totalRaw);
    const overdueAmount = parseAmount(overdueRaw);

    seen.set(contNumber, {
      creditor: creditorNames[acceptedIndex] ?? `Account ${contNumber}`,
      accountType,
      status: status.trim(),
      currentBalance,
      totalAmount: totalAmount || currentBalance,
      overdueAmount,
      lastUpdated,
      isActive: currentBalance > 0,
    });
    acceptedIndex += 1;
  }

  return Array.from(seen.values());
}
