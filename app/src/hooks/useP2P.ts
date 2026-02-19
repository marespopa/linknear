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
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10));
  };

  const setupConnectionListeners = (conn: DataConnection) => {
    conn.on('open', () => {
      addLog(`CONN_OPEN: ${conn.peer}`);
      if (!connectionsRef.current.find((c) => c.peer === conn.peer)) {
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnections([...connectionsRef.current]);
        // Push our current state immediately upon connection
        conn.send(chain);
      }
    });

    conn.on('data', (incomingData: any) => {
      if (Array.isArray(incomingData)) {
        const remoteChain = incomingData as Block[];
        
        setChain((prevChain) => {
          // UNION MERGE: Combine both histories
          const combined = [...prevChain, ...remoteChain];
          
          // Remove duplicates by checking the unique hash of each block
          const uniqueChain = combined.filter((block, index, self) =>
            index === self.findIndex((b) => b.hash === block.hash)
          );

          // Sort by timestamp to keep the ledger chronological
          const sortedChain = uniqueChain.sort((a, b) => a.timestamp - b.timestamp);

          if (sortedChain.length > prevChain.length) {
            addLog(`SYNC: Merged ledger. Total blocks: ${sortedChain.length}`);
            // Broadcast the newly merged chain to everyone else
            // broadcast(sortedChain); 
          }
          return sortedChain;
        });
      }
    });

    conn.on('close', () => {
      addLog(`CONN_CLOSE: ${conn.peer}`);
      connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
      setConnections([...connectionsRef.current]);
    });
  };

  useEffect(() => {
    if (peerRef.current) return;

    // customAlphabet creates the function, then we call it with ()
    const nanoid = customAlphabet('1234567890abcdef', 6);
    const friendlyId = `node-${nanoid()}`;
    
    const peer = new Peer(friendlyId); 
    peerRef.current = peer;

    peer.on('open', (id) => {
      addLog(`ID_READY: ${id}`);
      setMyId(id);
    });

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        addLog("ID_TAKEN: Attempting recovery...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addLog(`PEER_ERR: ${err.type}`);
      }
    });

    peer.on('connection', setupConnectionListeners);

    return () => {
      peer.off('connection', setupConnectionListeners);
    };
  }, []);

  const connectToPeer = (remoteId: string) => {
    if (!remoteId || remoteId === myId || !peerRef.current) return;
    if (connectionsRef.current.find((c) => c.peer === remoteId)) return;

    const conn = peerRef.current.connect(remoteId);
    setupConnectionListeners(conn);
  };

  const broadcast = (newChain: Block[]) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) conn.send(newChain);
    });
  };

  return { 
    myId, 
    connections, 
    connectToPeer, 
    broadcast, 
    logs, 
    status: connections.length > 0 ? 'Connected' : 'Waiting' 
  };
}

