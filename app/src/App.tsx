// src/App.tsx
import { useAtomValue } from 'jotai';
import { balanceAtom } from './store/atoms';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import NetworkPanel from "./components/NetworkPanel";

export default function App() {
  const balance = useAtomValue(balanceAtom);

  return (
    <div className="min-h-screen bg-indigo-950 text-indigo-300 font-mono p-4 md:p-8">
    <div className="max-w-2xl mx-auto space-y-8">

    {/* Header Section */}
    <header className="border-b border-indigo-900 pb-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
    <h1 className="text-xs uppercase tracking-[0.3em] text-indigo-500 mb-2">
    TRANSACTIONS_LEDGER_V1
    </h1>
    <div className="text-5xl font-bold text-white tracking-tighter">
    ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </div>
</div>
    </header>


    {/* Dashboard Grid */}
    <div className="grid grid-cols-1 gap-6">

    <section>
    <h2 className="text-[10px] uppercase mb-3 ml-1">// Input_Buffer</h2>
    <TransactionForm />
    </section>

    <section>
    <h2 className="text-[10px] uppercase mb-3 ml-1">// Ledger_State</h2>
    <TransactionHistory />
    </section>

    <section>
    <h2 className="text-[10px] uppercase mb-3 ml-1">// Network_Status</h2>
    <NetworkPanel />
    </section>  
    </div>

    {/* System Footer */}
    <footer className="pt-4 border-t border-indigo-950 text-center">
    <p className="text-[9px] text-indigo-300 uppercase">Secure Hash Algorithm: SHA-256 Enabled</p>
    </footer>
    </div>
    </div>
  );
}

