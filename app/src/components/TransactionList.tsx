import React from 'react';
import { useAtomValue } from 'jotai';
import { chainAtom } from '../store/atoms';

const TransactionList: React.FC = () => {
  const chain = useAtomValue(chainAtom);

  return (
    <div className="mt-8 space-y-4">
      {[...chain].reverse().map((block) => (
        <div
          key={block.hash}
          className="p-4 bg-slate-900 border-l-4 border-cyan-500 rounded-r-xl"
        >
          <div className="flex justify-between font-mono">
            <span className="text-slate-400">
              {new Date(block.timestamp).toLocaleDateString()}
            </span>
            <span
              className={block.amount >= 0 ? 'text-green-400' : 'text-red-400'}
            >
              ${block.amount.toFixed(2)}
            </span>
          </div>
          <p className="text-white mt-1">{block.note}</p>
          <div className="mt-2 text-[10px] font-mono text-slate-500 break-all">
            HASH: {block.hash}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;
