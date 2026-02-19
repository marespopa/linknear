import { useState } from 'react';
import { useAtom } from 'jotai';
import { chainAtom } from '../store/atoms';
import { generateHash } from '../logic/crypto';
import Input from './forms/Input';
import Button from './forms/Button';
import { type Block } from '../logic/crypto';

export default function TransactionForm() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  // --- New State for Feedback ---
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [chain, setChain] = useAtom(chainAtom);

  const handleSubmit = async () => {
    // Reset error at start of new attempt
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Invalid_Amount: Must be greater than 0');
      return;
    }

    if (note.trim() === '') {
      setError('Invalid_Note: Cannot be empty');
      return;
    }

    setIsProcessing(true);

    try {
      const parentHash = chain.length > 0 ? chain[chain.length - 1].hash : '0';

      const transactionData = {
        amount: numericAmount,
        note: note,
        timestamp: Date.now(),
        index: chain.length,
      };

      // If generateHash fails or throws, it jumps to 'catch'
      const hash = await generateHash(transactionData, parentHash);

      const newBlock: Block = {
        ...transactionData,
        parentHash,
        hash,
      };

      setChain([...chain, newBlock]);

      // Success: Clear inputs
      setNote('');
      setAmount('');
    } catch (err) {
      // Handle the error visually
      setError('Crypto_Failure: Could not generate block hash');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 border border-indigo-900 p-4 bg-black/20">
      {/* --- Error Display Area --- */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 p-2 text-xs font-mono animate-pulse">
          [!] ERROR: {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-[10px] text-indigo-300 uppercase tracking-widest">
          Entry_Amount {isProcessing && ' - [Processing...]'}
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Input
            type="number"
            label="Amount"
            value={amount}
            placeholder="0.00"
            disabled={isProcessing}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-black border border-indigo-900 text-indigo-300 p-2 w-24 outline-none focus:border-indigo-400 font-mono disabled:opacity-50"
          />
          <Input
            type="text"
            value={note}
            label="Note"
            placeholder="What is this for?"
            disabled={isProcessing}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 bg-black border border-indigo-900 text-indigo-300 p-2 outline-none focus:border-indigo-400 font-mono text-sm disabled:opacity-50"
          />
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing ? 'Hashing...' : 'Add_Block'}
          </Button>
        </div>
      </div>
    </div>
  );
}
