import currency from 'currency.js';

// Accepts numbers typed with either decimal style — "120.24" or "120,23" —
// since users on different locales/keyboards reach for whichever comma/dot
// their system trained them to use.
export function normalizeDecimalInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === '') return '';

  const hasComma = trimmed.includes(',');
  const hasDot = trimmed.includes('.');

  if (hasComma && hasDot) {
    // Whichever separator appears last is the decimal point; the other was
    // a thousands grouping and gets dropped (e.g. "1.234,56" -> "1234.56").
    const lastComma = trimmed.lastIndexOf(',');
    const lastDot = trimmed.lastIndexOf('.');
    return lastComma > lastDot
      ? trimmed.replace(/\./g, '').replace(',', '.')
      : trimmed.replace(/,/g, '');
  }

  if (hasComma) {
    return trimmed.replace(',', '.');
  }

  return trimmed;
}

export function parseDecimal(raw: string): number {
  const normalized = normalizeDecimalInput(raw);
  if (normalized === '') return NaN;

  const value = currency(normalized, { precision: 2 }).value;
  return Number.isFinite(value) ? value : NaN;
}

export function formatAmount(value: number): string {
  return currency(value, { symbol: '', precision: 2 }).format();
}
