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
  const [connections, setConnections] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);
  const connectionsRef = useRef<DataConnection[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`].slice(-10));
  };

  // 1. Move logic to a stable function
  const setupConnectionListeners = (conn: DataConnection) => {
    conn.on('open', () => {
      addLog(`CONN_OPEN: ${conn.peer.slice(0, 6)}`);
      if (!connectionsRef.current.find((c) => c.peer === conn.peer)) {
        connectionsRef.current = [...connectionsRef.current, conn];
        setConnections([...connectionsRef.current]);
        conn.send(chain);
      }
    });

    conn.on('data', (incomingData: any) => {
      if (Array.isArray(incomingData)) {
        setChain((prevChain) => {
          if (incomingData.length > prevChain.length) {
            addLog(`SYNC: Accepted longer chain (${incomingData.length})`);
            return incomingData;
          }
          if (incomingData.length < prevChain.length) {
            conn.send(prevChain); // Catch them up
          }
          return prevChain;
        });
      }
    });

    conn.on('close', () => {
      addLog(`CONN_CLOSE: ${conn.peer.slice(0, 6)}`);
      connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
      setConnections([...connectionsRef.current]);
    });
  };

  useEffect(() => {
    if (peerRef.current) return;

    // Use a human-friendly ID or let PeerJS generate one
    const friendlyId = `node-${customAlphabet('1234567890abcdef', 6)()}`;
    const newPeer = new Peer(friendlyId); 
    peerRef.current = newPeer;

    newPeer.on('open', (id) => {
      addLog(`ID_READY: ${id}`);
      setMyId(id);
    });

    // Correct place for Peer-level errors
    newPeer.on('error', (err) => {
      if (err.type === 'unavailable-id') {
        addLog("ID_TAKEN: Attempting recovery...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        addLog(`PEER_ERR: ${err.type}`);
      }
    });

    newPeer.on('connection', setupConnectionListeners);

    return () => {
      // Clean up listeners but keep peer alive for dev persistence
      newPeer.off('connection', setupConnectionListeners);
    };
  }, []); // Chain removed from deps to prevent re-init loops

  const connectToPeer = (remoteId: string) => {
    // FIX: use peerRef.current
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

  return { myId, connections, connectToPeer, broadcast, logs, 
           status: connections.length > 0 ? 'Connected' : 'Waiting' };
}

