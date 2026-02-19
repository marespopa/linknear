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

    // 2. The Merge Logic
    conn.on('data', (incomingData: any) => {
      if (Array.isArray(incomingData)) {
        const remoteChain = incomingData as Block[];
        if (remoteChain.length === 0) return;

        setChain((prevChain) => {
          // If our chain is empty, just take theirs
          if (prevChain.length === 0) {
            addLog(`INITIAL_SYNC: Adopted ${remoteChain.length} blocks.`);
            return remoteChain;
          }

          // Union Merge: Combine and filter duplicates by hash
          const combined = [...prevChain, ...remoteChain];
          const uniqueChain = combined.filter((block, index, self) =>
            index === self.findIndex((b) => b.hash === block.hash)
          );

          const sortedChain = uniqueChain.sort((a, b) => a.timestamp - b.timestamp);

          if (sortedChain.length > prevChain.length) {
            addLog(`MERGE: Ledger updated (+${sortedChain.length - prevChain.length} blocks)`);
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
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    }); 

    peerRef.current = peer;

    peer.on('open', (id) => {
      addLog(`ID_READY: ${id}`);
      setMyId(id);
    });

    peer.on('connection', setupConnectionListeners);

    peer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        addLog("ID_TAKEN: Retrying...");
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

  const broadcast = (newChain: Block[]) => {
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(newChain);
      }
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

