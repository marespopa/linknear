// src/App.tsx
import { useAtom, useAtomValue } from 'jotai';
import { balanceAtom, privacyAtom } from './store/atoms';
import { useRegisterSW } from 'virtual:pwa-register/react';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import Settings from './components/Settings';
import SectionHeader from './components/ui/SectionHeader';

export default function App() {
  const balance = useAtomValue(balanceAtom);
  const [isPrivateMode, setIsPrivateMode] = useAtom(privacyAtom);

  useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error);
    },
  });

  const balanceDisplay = isPrivateMode
    ? '****.**'
    : balance.toLocaleString(undefined, { minimumFractionDigits: 2 });
  
  return (
    <div className="min-h-screen bg-indigo-950 text-indigo-300 font-mono p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="border-b border-indigo-900 pb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-xl uppercase tracking-[0.3em] text-indigo-100 mb-2">
              LINK_NEAR_WALLET
            </h1>
            <div
              className="text-5xl font-bold text-white tracking-tighter"
              onClick={() => setIsPrivateMode(!isPrivateMode)}
            >
              {balanceDisplay}
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
           <SectionHeader title="Data_Settings" />
           <Settings />
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
