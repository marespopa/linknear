import { useAtomValue } from 'jotai';
import { privacyAtom, chainAtom } from '../store/atoms';
import { type Block } from '../logic/crypto';
import Button from './forms/Button';

export default function TransactionHistory() {
  const chain = useAtomValue(chainAtom);
  const isPrivateMode = useAtomValue(privacyAtom);
  const logs = [...chain].reverse();

  const copyFilteredCsvToClipboard = async () => {
    if (logs.length === 0) return;
    const fields = ['timestamp', 'amount', 'note'] as const;
    const header = fields.join(',');

    const rows = logs.map((obj) => {
      return fields
        .map((field) => {
          // FIX: Cast field to keyof Block so TS allows indexing
          const value = obj[field as keyof Block];
          return `"${String(value ?? '').replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvString = [header, ...rows].join('\n');

    try {
      await navigator.clipboard.writeText(csvString);
    } catch (err) {
      console.error('Clipboard error:', err);
    }
  };

  const formatTimestamp = (timestamp: number | string) => {
    if (!timestamp) return 'UNKNOWN_TIME';
    const date = new Date(Number(timestamp)); 
    return date.toLocaleString();
  };

  return (
    <div className="border border-indigo-900 bg-black/40 rounded-sm overflow-hidden font-mono">
      <div className="bg-indigo-950/50 px-3 py-1.5 border-b border-indigo-900 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest text-indigo-300">
          Ledger_Logs
        </span>
        <Button variant="primary" onClick={copyFilteredCsvToClipboard}>
          Copy to CSV
        </Button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-indigo-500 text-xs italic tracking-tighter">
              [!] NO_TRANSACTION_DATA_FOUND
            </p>
          </div>
        ) : (
          logs.map((block: Block) => {
            const blockAmount = isPrivateMode ? 
                '*.**' : 
                `${block.amount >= 0 ? '+': ''} ${block.amount.toFixed(2)}`;

            return (
              <div
                key={block.hash} 
                className="relative pl-6 border-l border-indigo-900/50 group"
              >
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 bg-indigo-900 border border-black rounded-full group-hover:bg-indigo-400 transition-colors shadow-[0_0_8px_rgba(99,102,241,0.4)]" />

                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-1 py-0.5 rounded border border-indigo-800/50">
                        TRANSACTION_#{String(block.index)}
                      </span>
                      <span className="text-[10px] text-indigo-500">
                        {formatTimestamp(block.timestamp)}  
                      </span>
                    </div>

                    <p className="text-sm text-white truncate uppercase tracking-tight">
                      {block.note || 'UNNAMED_TRANSACTION'}
                    </p>

                    <p className="text-[9px] font-bold truncate mt-1 text-indigo-400">
                      HASH: {block.hash}
                    </p>
                  </div>

                  <div className={`text-sm font-bold whitespace-nowrap ${block.amount >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {blockAmount}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
