// src/App.tsx
import { useAtomValue } from 'jotai';
import { balanceAtom } from './store/atoms';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import NetworkPanel from './components/NetworkPanel';
import SectionHeader from './components/ui/SectionHeader';
import Button from './components/forms/Button';

export default function App() {
  const balance = useAtomValue(balanceAtom);

  return (
    <div className="min-h-screen bg-indigo-950 text-indigo-300 font-mono p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="border-b border-indigo-900 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <h1 className="text-xs uppercase tracking-[0.3em] text-indigo-100 mb-2">
              TRANSACTIONS_LEDGER
            </h1>
            <div className="text-5xl font-bold text-white tracking-tighter">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6">
          <section>
            <SectionHeader title="Input_Buffer" />
            <TransactionForm />
          </section>

          <section>
            <SectionHeader title="Transaction_History" />
            <TransactionHistory />
          </section>

          <section>
            <SectionHeader title="Network_Status" />
            <NetworkPanel />
          </section>

          <section>
            <SectionHeader title="Data_Settings" />
            <div className="bg-black/40 p-4 rounded-lg text-sm text-indigo-300">
              <Button
                variant="primary"
                className="w-full mb-2"
                onClick={() => {
                  if (
                    window.confirm(
                      'Are you sure you want to clear all data? This action cannot be undone.'
                    )
                  ) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
              >
                Clear Data
              </Button>
              <p className="text-xs text-indigo-400">
                Warning: Clearing data will reset your transaction history and
                balance. This action cannot be undone.
              </p>
            </div>
          </section>
        </div>
        {/* System Footer */}
        <footer className="pt-4 border-t border-indigo-950 text-center">
          <p className="text-[9px] text-indigo-300 uppercase">
            Secure Hash Algorithm: SHA-256 Enabled
          </p>
        </footer>
      </div>
    </div>
  );
}
