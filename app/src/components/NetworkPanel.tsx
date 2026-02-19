import { useState } from 'react';
import { useP2P } from '../hooks/useP2P.ts';

export default function NetworkPanel() {
  // If the hook fails or is slow, destructuring might fail. 
  // We provide defaults here just in case.
  const { myId, connectToPeer, connections = [] } = useP2P() || {};
  const [targetId, setTargetId] = useState('');

  // 1. Guard against the hook being totally broken
  if (!connectToPeer) return <div className="text-red-500">P2P_HOOK_ERROR</div>;

  return (
    <div className="border border-indigo-900 bg-black/40 p-4 font-mono">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[10px] text-indigo-500 uppercase">Network_Protocol</h2>
        <div className="flex items-center gap-2">
          {/* 2. Guard against connections being undefined */}
          <span className={`h-2 w-2 rounded-full ${(connections?.length ?? 0) > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></span>
          <span className="text-[9px] text-indigo-300">{(connections?.length ?? 0)} Nodes_Active</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[8px] text-indigo-700 uppercase mb-1">Local_Node_ID:</div>
        <div className="bg-black border border-indigo-900 p-2 text-indigo-400 text-[10px] truncate">
          {myId || "CONNECTING..."}
        </div>
      </div>

      <div className="flex gap-2">
        <input 
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="REMOTE_ID"
          className="bg-black border border-indigo-900 text-indigo-300 p-2 flex-1 text-xs outline-none"
        />
        <button 
          onClick={() => connectToPeer(targetId)}
          className="bg-indigo-900 px-3 text-[10px] hover:bg-indigo-700"
        >
          SYNC
        </button>
      </div>
    </div>
  );
}

