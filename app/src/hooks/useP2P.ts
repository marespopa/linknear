import { useEffect, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import Peer from 'peerjs';
import type { DataConnection }  from 'peerjs';
import { chainAtom } from '../store/atoms';
import type { Block } from '../logic/crypto';

// This prevents multiple Peer instances if the hook is called twice
let globalPeer: Peer | null = null;

export function useP2P() {
  const [chain, setChain] = useAtom(chainAtom);
  const [myId, setMyId] = useState<string>('');
  const [connections, setConnections] = useState<any[]>([]);
  
  // Refs for logic that doesn't need to trigger re-renders
  const connectionsRef = useRef<DataConnection[]>([]);

  useEffect(() => {
    // 1. Initialize Peer (Signaling)
    if (!globalPeer) {
      globalPeer = new Peer();
    }
    const peer = globalPeer;

    peer.on('open', (id) => {
      console.log('Peer_Node_Ready:', id);
      setMyId(id);
    });

    // 2. Handle Incoming Connections
    const handleConnection = (conn: DataConnection) => {
      conn.on('open', () => {
        // Only add if not already in list
        if (!connectionsRef.current.find(c => c.peer === conn.peer)) {
          connectionsRef.current = [...connectionsRef.current, conn];
          setConnections(connectionsRef.current);
          
          // Immediate Sync: Send current chain to new peer
          conn.send(chain);
        }
      });

      conn.on('data', (data: any) => {
        if (Array.isArray(data)) {
          // CONFLICT RESOLUTION: Longest Chain Rule
          if (data.length > chain.length) {
            console.log("Syncing: Received longer chain.");
            setChain(data);
          } else if (data.length < chain.length) {
            // We are ahead, catch them up
            conn.send(chain);
          }
        }
      });

      conn.on('close', () => {
        connectionsRef.current = connectionsRef.current.filter(c => c.peer !== conn.peer);
        setConnections(connectionsRef.current);
      });

      conn.on('error', (err) => {
        console.error("Connection_Error:", err);
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
    if (connectionsRef.current.find(c => c.peer === remoteId)) return;

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
    connectionsRef.current.forEach(conn => {
      if (conn.open) {
        conn.send(newChain);
      }
    });
  };

  return { 
    myId, 
    connections, 
    connectToPeer, 
    broadcast 
  };
}

