// Define the structure of a single block in our ledger
export interface TransactionData {
  index: number;
  amount: number;
  note: string;
  timestamp: number;
}

export interface Block extends TransactionData {
  hash: string;
  parentHash: string;
}

export function isValidChain(incomingChain: Block[]): boolean {
  for (let i = 1; i < incomingChain.length; i++) {
    const currentBlock = incomingChain[i];
    const previousBlock = incomingChain[i - 1];

    if (currentBlock.parentHash !== previousBlock.hash) {
      return false;
    }

    //  return validateBlock(currentBlock, currentBlock.parentHash);
  }

  return true;
}

/**
 * Generates a SHA-256 hash for a block.
 * Fallback provided for non-secure contexts (HTTP vs HTTPS).
 */
export async function generateHash(
  data: TransactionData,
  parentHash: string
): Promise<string> {
  const msgString = JSON.stringify({ ...data, parentHash });

  // Safety check: Web Crypto requires a "Secure Context" (localhost or HTTPS)
  if (!window.crypto || !window.crypto.subtle) {
    console.warn('Insecure context: Using fallback hashing');
    return `fallback-${btoa(msgString).substring(0, 16)}`;
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(msgString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

  // Convert buffer to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Validates if a block's hash correctly represents its data and parent connection
 */
export async function validateBlock(
  block: Block,
  parentHash: string
): Promise<boolean> {
  const { hash, ...data } = block;
  const recalculatedHash = await generateHash(data, parentHash);
  return hash === recalculatedHash;
}
