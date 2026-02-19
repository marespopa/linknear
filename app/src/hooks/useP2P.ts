import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';
import { chainAtom } from '../store/atoms';
import type { Block } from '../logic/crypto';

// This prevents multiple Peer instances if the hook is called twice
let globalPeer: Peer | null = null;

export function useP2P() {
  const [chain, setChain] = useAtom(chainAtom);
  const [myId, setMyId] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const peerRef = useRef<Peer | null>(null);

  // Refs for logic that doesn't need to trigger re-renders
  const connectionsRef = useRef<DataConnection[]>([]);
  // Helper to add logs with timestamp and auto-trim to last 10 entries
  const addLog = (message: string) => {
    setLogs((prev) => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${message}`,
    ].slice(-10));
  };

  useEffect(() => {
    // 1. Initialize Peer (Signaling)
    if (peerRef.current) return; // Already initialized

    const newPeer = new Peer();
    peerRef.current = newPeer;
    const peer = peerRef.current;

    peer.on('open', (id) => {
      addLog(`ID_READY: ${id}`);
      setMyId(id);
    });

    // 2. Handle Incoming Connections
    const handleConnection = (conn: DataConnection) => {
      addLog(`INCOMING_CONN: ${conn.peer.slice(0, 6)}`); 
      conn.on('open', () => {
          addLog(`CONN_OPEN: ${conn.peer.slice(0, 6)}`);

        // Only add if not already in list
        if (!connectionsRef.current.find((c) => c.peer === conn.peer)) {
          connectionsRef.current = [...connectionsRef.current, conn];
          setConnections(connectionsRef.current);

          // Immediate Sync: Send current chain to new peer
          conn.send(chain);

      conn.on('data', (incomingData: any) => {
        if (Array.isArray(incomingData)) {
        // Use the functional updater (prev) to get the true current state
            setChain((prevChain) => {
     if (incomingData.length > prevChain.length) {
        addLog(`DATA_IN: Received longer chain from ${conn.peer.slice(0, 6)}. Updating our chain.`);
        console.log('Syncing: Received longer chain.');
        return incomingData; 
      } else if (incomingData.length < prevChain.length) {
        // We are ahead, catch them up
        addLog('DATA_IN: Received shorter chain from ' + conn.peer.slice(0, 6) + '. Sending our chain.');
        console.log('Peer is behind. Sending our chain.');
        conn.send(prevChain);
        return prevChain;
      }
      return prevChain; // Chains are equal, do nothing
    });
  }
});

        }
      });


      conn.on('close', () => {
        addLog(`CONN_CLOSE: ${conn.peer.slice(0, 6)}`);
        connectionsRef.current = connectionsRef.current.filter(
          (c) => c.peer !== conn.peer
        );
        setConnections(connectionsRef.current);
      });

      conn.on('error', (err) => {
          addLog(`CONN_ERROR: ${conn.peer.slice(0, 6)} - ${err.message}`);
        console.error('Connection_Error:', err);
      });
    };

    peer.on('connection', handleConnection);

    return () => {
      // We don't destroy() here so the connection stays alive
      // even if the UI component unmounts and rem:ounts.
      peer.off('connection', handleConnection);
    };
  }, [chain, setChain]);

  // 3. Action: Connect to a Peer
  const connectToPeer = (remoteId: string) => {
    if (!remoteId || remoteId === myId || !globalPeer) return;

    // Check if already connected
    if (connectionsRef.current.find((c) => c.peer === remoteId)) return;

    const conn = globalPeer.connect(remoteId);

    // Set up the same listeners for the outgoing connection
    conn.on('open', () => {
      connectionsRef.current = [...connectionsRef.current, conn];
      setConnections(connectionsRef.current);
      conn.send(chain);
    });

    conn.on('data', (data: any) => {
      if (Array.isArray(data) && data.length > chain.length) {
        setChain(data);
      }
    });
  };

  // 4. Action: Broadcast to all connected peers
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
