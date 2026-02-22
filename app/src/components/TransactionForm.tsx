import { useState } from 'react';
import { useAtom } from 'jotai';
import { chainAtom } from '../store/atoms';
import { generateHash } from '../logic/crypto';
import Input from './forms/Input';
import Button from './forms/Button';

export default function TransactionForm() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chain, setChain] = useAtom(chainAtom);

  const isInitial = chain.length === 0;

  /**
   * Converts strings like "walmart store" to "WalmartStore"
   * Handles spaces, underscores, and hyphens.
   */
  const formatNote = (str: string, isInitial: boolean): string => {
    if (isInitial) return 'Initial Balance';
    if (!str) return '';

    return str
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  /**
   * Handles form submission for both initial balance and regular transactions.
   * Validates input, generates a new block, and updates the chain state.
   */
  const handleSubmit = async () => {
    setError(null);
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Invalid_Amount: Please enter a positive value');
      return;
    }

    if (!isInitial && note.trim() === '') {
      setError('Invalid_Note: Merchant is required');
      return;
    }

    setIsProcessing(true);

    try {
      const parentHash = !isInitial ? chain[chain.length - 1].hash : '0';

      const finalAmount =
        isInitial || type === 'income' ? numericAmount : numericAmount * -1;

      const formattedNote = formatNote(note, isInitial);
      const transactionData = {
        amount: finalAmount,
        note: formattedNote,
        timestamp: Date.now(),
        index: chain.length,
      };

      const hash = await generateHash(transactionData, parentHash);

      setChain([...chain, { ...transactionData, parentHash, hash }]);

      // Reset State
      setNote('');
      setAmount('');
      setType('expense');
    } catch (err: any) {
      if (err?.name === "QuotaExceededError") {
        setError('Storage_Error: Local storage quota exceeded. Please clear some space and try again.');
        console.error('Storage quota exceeded:', err);
        return;
      }

      setError('Crypto_Error: Block link failed');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border border-indigo-900 bg-black/40 backdrop-blur-md rounded-lg">
      {/* Header Info */}
      <div className="mb-6">
        <h2 className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">
          {isInitial ? 'Wallet Initialization' : 'Add Transaction'}
        </h2>
      </div>

      {error && (
        <div className="mb-4 p-2 border border-red-500/50 bg-red-500/10 text-red-400 text-[10px] font-mono animate-pulse">
          [!] {error}
        </div>
      )}

      {/* Transaction Type Toggle */}
      {!isInitial && (
        <div className="flex mb-6 gap-2 w-full">
          <Button
            onClick={() => setType('expense')}
            className={`w-full ${type === 'expense' ? '' : 'opacity-40 grayscale'}`}
          >
            EXPENSE
          </Button>
          <Button
            onClick={() => setType('income')}
            className={`w-full ${type === 'income' ? '' : 'opacity-40 grayscale'}`}
          
            >
            INCOME
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label={isInitial ? 'Starting Capital' : 'Amount'}
          type="number"
          value={amount}
          placeholder="0.00"
          disabled={isProcessing}
          onChange={(e) => setAmount(e.target.value)}
        />

        {!isInitial && (
          <Input
            label="Merchant / Note"
            type="text"
            value={note}
            placeholder="e.g. Grocery Store"
            disabled={isProcessing}
            onChange={(e) => setNote(e.target.value)}
          />
        )}

        <Button
          onClick={handleSubmit}
          disabled={isProcessing}
          className="w-full mt-4"
        >
          {isProcessing
            ? 'GENERATING_HASH...'
            : isInitial
              ? 'INITIALIZE WALLET'
              : 'ADD TRANSACTION'}
        </Button>
      </div>
    </div>
  );
}
