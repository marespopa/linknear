// src/hooks/useLedger.ts
import { useAtom } from 'jotai';
import { chainAtom } from '../store/atoms';
import { generateHash } from '../logic/crypto';

export function useLedger() {
  const [chain, setChain] = useAtom(chainAtom);

const addTransaction = async (amount: number, note: string) => {
  // 1. Get current state values BEFORE the setter
  const parentHash = chain.length > 0 ? chain[chain.length - 1].hash : "0";

  const transactionData = {
    amount,
    note,
    timestamp: Date.now(),
    index: chain.length,
  };

  // 2. DO THE ASYNC WORK HERE
  // This waits for the string result so you don't pass a Promise to Jotai
  const finalizedHash = await generateHash(transactionData, parentHash);

  // 3. UPDATE JOTAI SYNCHRONOUSLY
  setChain((prevChain) => [
    ...prevChain,
    {
      ...transactionData,
      parentHash,
      hash: finalizedHash // Now this is a string!
    }
  ]);
};

  return { addTransaction };
}

