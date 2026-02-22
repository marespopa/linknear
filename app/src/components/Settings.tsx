import Button from './forms/Button';
import Input from './forms/Input';
import { useAtom } from 'jotai';
import { chainAtom, currencyAtom, historyAtom, privacyAtom } from '../store/atoms';
import { generateHash, generateMonthSeal } from '../logic/crypto';

// 1. Define the Interface (or import it)
interface Block {
  index: number;
  amount: number;
  note: string;
  timestamp: number;
  parentHash: string;
  hash: string;
}

const Settings: React.FC = () => {
  const [chain, setChain] = useAtom(chainAtom);
  const [currency, setCurrency] = useAtom(currencyAtom);
  const [, setHistory] = useAtom(historyAtom); // Skip 'history' if unused to avoid TS warnings
  const [isPrivateMode, setIsPrivateMode] = useAtom(privacyAtom);

  const handleMonthEnd = async () => {
    if (chain.length === 0) return;

    const lastBlock = chain[chain.length - 1];
    const finalBalance = chain.reduce((acc, b) => acc + b.amount, 0);

    const seal = await generateMonthSeal(lastBlock.hash, finalBalance);
    const monthLabel = new Date().toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });

    setHistory((prev) => ({
      ...prev,
      [monthLabel]: {
        blocks: [...chain],
        seal: seal,
        closingBalance: finalBalance,
      },
    }));

    // 2. Fixed the backtick and provided the correct arguments for generateHash
    const timestamp = Date.now();
    const newGenesis: Block = {
      index: 0,
      amount: finalBalance,
      note: `INITIAL_BALANCE_${monthLabel.replace(' ', '_')}`,
      timestamp: timestamp,
      parentHash: seal,
      // Pass the data object first, THEN the seal as the second argument
      hash: await generateHash(
        { index: 0, amount: finalBalance, note: 'GENESIS', timestamp },
        seal
      ),
    };

    setChain([newGenesis]);
    alert('MONTH_CLOSED: New genesis block created with final balance carried over.');
  };

  return (
    <div className="bg-black/40 p-4 rounded-lg text-sm text-indigo-300">
      {/* 3. Fixed Grid syntax: md:grid-cols-[200px_1fr] */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-indigo-900 rounded-lg">
        <Button
          variant="primary"
          onClick={() => {
            if (window.confirm('Are you sure you want to clear all data?')) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          Clear Data
        </Button>
        <p className="text-xs text-indigo-400">
          Warning: Clearing data will reset your transaction history.
        </p>
      </div>

      {/* New Section: Period Closure */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-indigo-900 rounded-lg mt-4">
        <Button 
            variant="primary" 
            onClick={ () => {
                if (window.confirm('Are you sure you want to close the current month log?'))  {
                    handleMonthEnd();
                }
            }}>
          Close Month
        </Button>
        <p className="text-xs text-indigo-400">
          Archive this month and carry balance to a new genesis block.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-indigo-900 rounded-lg mt-4">
        <Button
          variant="primary"
          onClick={() => setIsPrivateMode(!isPrivateMode)}
        >
          Private Mode: {isPrivateMode ? 'ON' : 'OFF'}
        </Button>
        <p className="text-xs text-indigo-400">
          Hides your balance and details for enhanced privacy.
        </p>
      </div>

  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-indigo-900 rounded-lg mt-4">
  <Input 
    type="text"
    placeholder="Enter a symbol..."
    value={currency}
    label="Currency Symbol"
    onChange={(e) => setCurrency(e.target.value)}
    className="bg-transparent border border-indigo-900 rounded px-2 py-1 text-sm text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
  <p className="text-xs text-indigo-400">
    Set your preferred currency symbol (e.g., $, €, ¥).
  </p>      
    </div>
    </div>
  );
};

export default Settings;
