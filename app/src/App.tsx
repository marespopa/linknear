// src/App.tsx
import { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Moon, Sun, Swords } from 'lucide-react';
import { currentViewAtom, debtsAtom, hasOnboardedAtom, themeAtom, type View } from './store/atoms';
import { useRegisterSW } from 'virtual:pwa-register/react';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Suggestions from './pages/Suggestions';
import Setup from './pages/Setup';
import Settings from './components/Settings';
import SectionHeader from './components/ui/SectionHeader';
import Onboarding from './components/Onboarding';
import ToastStack from './components/ui/ToastStack';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { useAchievements } from './hooks/useAchievements';

const NAV_ITEMS: { id: View; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'history', label: 'History' },
  { id: 'suggestions', label: 'Advice' },
  { id: 'setup', label: 'Setup' },
  { id: 'settings', label: 'Settings' },
];

export default function App() {
  const view = useAtomValue(currentViewAtom);
  const setView = useSetAtom(currentViewAtom);
  const debts = useAtomValue(debtsAtom);
  const hasOnboarded = useAtomValue(hasOnboardedAtom);
  const [theme, setTheme] = useAtom(themeAtom);

  // Mounted at the app root (not just on the Dashboard) so an unlock toast
  // fires the moment it happens, not the next time the user visits Stats.
  useAchievements();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    root.classList.toggle('dark', theme === 'dark');
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => root.classList.remove('theme-transitioning'))
    );
    return () => cancelAnimationFrame(id);
  }, [theme]);

  useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration failed:', error);
    },
  });

  if (!hasOnboarded && debts.length === 0) {
    return (
      <>
        <ConfirmDialog />
        <Onboarding />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-arcane-black text-slate-300 font-sans p-4 md:p-8">
      <ToastStack />
      <ConfirmDialog />
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Section */}
        <header className="border-b border-arcane-navy pb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-xl uppercase tracking-[0.3em] text-arcane-gold-light">
              LinkNear
            </h1>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="min-h-11 min-w-11 flex items-center justify-center border border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`font-display min-h-11 px-3 py-2 text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${
                  view === item.id
                    ? 'border-arcane-gold text-arcane-gold'
                    : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </header>

        {/* Active View */}
        <main>
          {view === 'dashboard' && <Dashboard />}
          {view === 'history' && <History />}
          {view === 'suggestions' && <Suggestions />}
          {view === 'setup' && <Setup />}
          {view === 'settings' && (
            <section>
              <SectionHeader title="Data Settings" />
              <Settings />
            </section>
          )}
        </main>

        <footer className="mt-8 pt-6 border-t border-arcane-navy text-center space-y-3">
          <p className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-500">
            <Swords size={12} className="text-arcane-gold" />
            May your debts fall before your blade
            <Swords size={12} className="text-arcane-gold scale-x-[-1]" />
          </p>
          <a
            href="https://www.marespopa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block font-display text-[10px] uppercase tracking-widest text-arcane-gold hover:text-arcane-gold-light transition-colors"
          >
            Forged by Mares Popa
          </a>
        </footer>
      </div>
    </div>
  );
}
