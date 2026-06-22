export interface CardColorOption {
  id: string;
  label: string;
  bg: string;
  icon: string;
}

// Picked manually per bank/creditor — independent of the boss tier so a
// small balance at "your bank" can still get its brand color. The picker
// swatch always reuses `bg` directly so what you tap is what you get on
// the card — no separate preview shade to drift out of sync.
export const CARD_COLOR_OPTIONS: CardColorOption[] = [
  { id: 'red', label: 'Red', bg: 'bg-red-800', icon: 'text-red-200' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-800', icon: 'text-orange-200' },
  { id: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', icon: 'text-yellow-950' },
  { id: 'lime', label: 'Lime', bg: 'bg-lime-700', icon: 'text-lime-100' },
  { id: 'green', label: 'Green', bg: 'bg-emerald-700', icon: 'text-emerald-100' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-700', icon: 'text-teal-100' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-700', icon: 'text-cyan-100' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-800', icon: 'text-blue-200' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-800', icon: 'text-indigo-200' },
  { id: 'purple', label: 'Purple', bg: 'bg-violet-800', icon: 'text-violet-200' },
  { id: 'pink', label: 'Pink', bg: 'bg-pink-700', icon: 'text-pink-100' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-800', icon: 'text-rose-200' },
  { id: 'brown', label: 'Brown', bg: 'bg-amber-900', icon: 'text-amber-200' },
  { id: 'black', label: 'Black', bg: 'bg-slate-900', icon: 'text-slate-300' },
];

export function getCardColorOption(id?: string): CardColorOption | undefined {
  return CARD_COLOR_OPTIONS.find((c) => c.id === id);
}
