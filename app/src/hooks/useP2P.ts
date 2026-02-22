import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { customAlphabet } from 'nanoid';
import { chainAtom } from '../store/atoms';
import type { Block } from '../logic/crypto';

export function useP2P() {
  const [chain, setChain] = useAtom(chainAtom);
  const [myId, setMyId] = useState<string>('');
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) =>
      [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10)
    );
  };

  // 1. Reactive Broadcast: Watch for local changes and push to peers
  useEffect(() => {
    if (chain.length > 0 && connectionsRef.current.length > 0) {
      // We only broadcast if there are active, open connections
      const openConnections = connectionsRef.current.filter((c) => c.open);

      if (openConnections.length > 0) {
        broadcast(chain);
        // Optional: addLog(`Pushed update: ${chain.length} blocks`);
      }
    }
  }, [chain]); // Fires every time the Jotai 'chain' state changes

  // 2. Refined Broadcast with open-check
  const broadcast = (newChain: Block[]) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        // We use a small optimization here: PeerJS handles the serialization
        conn.send(newChain);
      }
    });
  };

  const setupConnectionListeners = (conn: DataConnection) => {
    // 1. Handshake Logic
    conn.on('open', () => {
      addLog(`CONN_OPEN: ${conn.peer}`);

      if (!connectionsRef.current.find((c) => c.peer === conn.peer)) {
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnections([...connectionsRef.current]);

        // Critical: Send current state immediately so the other peer knows who we are
        conn.send(chain);
      }
    });

    conn.on('data', (incomingData: any) => {
      if (Array.isArray(incomingData) && incomingData.length > 0) {
        const remoteChain = incomingData as Block[];

        setChain((prevChain) => {
          // 1. If local chain is empty, adopt the remote one immediately
          if (prevChain.length === 0) {
            addLog(`INITIAL_SYNC: Adopted ${remoteChain.length} blocks.`);
            return remoteChain;
          }

          // 2. Use a Map to enforce uniqueness by hash (O(n) complexity)
          // Maps automatically overwrite existing keys, preventing duplicates.
          const chainMap = new Map<string, Block>();

          // Load existing blocks
          prevChain.forEach((block) => chainMap.set(block.hash, block));

          // Merge remote blocks (overwriting only if hash matches)
          remoteChain.forEach((block) => chainMap.set(block.hash, block));

          // 3. Convert back to array and sort by chronological order
          const mergedArray = Array.from(chainMap.values());
          const sortedChain = mergedArray.sort(
            (a, b) => a.timestamp - b.timestamp
          );

          // 4. Only update state if the chain actually grew
          const newBlocksCount = sortedChain.length - prevChain.length;

          if (newBlocksCount > 0) {
            addLog(`MERGE: Ledger updated (+${newBlocksCount} blocks)`);
            return sortedChain;
          }

          // If no new unique hashes were found, return the old reference to skip re-render
          return prevChain;
        });
      }
    });

    conn.on('close', () => {
      addLog(`CONN_CLOSE: ${conn.peer}`);
      connectionsRef.current = connectionsRef.current.filter(
        (c) => c.peer !== conn.peer
      );
      setConnections([...connectionsRef.current]);
    });

    conn.on('error', (err) => {
      addLog(`CONN_ERR: ${err.message}`);
    });
  };

  useEffect(() => {
    if (peerRef.current) return;

    // Use short ID for easy mobile typing
    const nanoid = customAlphabet('1234567890abcdef', 6);
    const friendlyId = `node-${nanoid()}`;

    // Added Google STUN servers to help Phone <-> Tablet connection
    const peer = new Peer(friendlyId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    peerRef.current = peer;

    peer.on('open', (id) => {
      addLog(`ID_READY: ${id}`);
      setMyId(id);
    });

    peer.on('connection', setupConnectionListeners);

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        addLog('ID_TAKEN: Retrying...');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        addLog(`PEER_ERR: ${err.type}`);
      }
    });

    return () => {
      peer.off('connection', setupConnectionListeners);
    };
  }, []);

  const connectToPeer = (remoteId: string) => {
    if (!remoteId || remoteId === myId || !peerRef.current) return;
    if (connectionsRef.current.find((c) => c.peer === remoteId)) return;

    addLog(`ATTEMPTING_CONN: ${remoteId}`);
    const conn = peerRef.current.connect(remoteId);
    setupConnectionListeners(conn);
  };

  return {
    myId,
    connections,
    connectToPeer,
    broadcast,
    logs,
    status: connections.length > 0 ? 'Connected' : 'Waiting',
  };
}
