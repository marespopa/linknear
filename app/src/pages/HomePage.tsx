import React from 'react';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';

const HomePage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto pt-10 px-4">
      <h1 className="text-2xl font-bold mb-6 text-cyan-400 uppercase tracking-widest">Git-Fi Ledger</h1>
      <TransactionForm />
      <TransactionList />
    </div>
  );
};

export default HomePage;

