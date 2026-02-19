import { useAtom } from 'jotai';
import { chainAtom } from '../store/atoms';
import { generateHash } from '../logic/crypto';

export function useLedger() {
  const [chain, setChain] = useAtom(chainAtom);

  const addTransaction = async (amount: number, note: string) => {
    try {
      // 1. Prepare the base data
      const timestamp = Date.now();

      // 2. We use a functional update to get the LATEST state
      // but since hashing is async, we have to be careful.
      // We grab a snapshot of the current chain tip.
      const currentTip = chain.length > 0 ? chain[chain.length - 1] : null;
      const parentHash = currentTip ? currentTip.hash : '0';
      const index = chain.length;

      const transactionData = {
        amount,
        note,
        timestamp,
        index,
      };

      // 3. Generate the hash
      const finalizedHash = await generateHash(transactionData, parentHash);

      // 4. Update the chain
      setChain((prevChain) => {
        // Double-check: Ensure another transaction didn't sneak in
        // If it did, you might need to re-hash (concurrency control)
        return [
          ...prevChain,
          {
            ...transactionData,
            parentHash,
            hash: finalizedHash,
          },
        ];
      });
    } catch (error) {
      console.error('Ledger Update Failed:', error);
      // Handle error (e.g., notify user)
    }
  };

  return {
    addTransaction,
    chain, // Return the chain so the UI can display the history!
  };
}
