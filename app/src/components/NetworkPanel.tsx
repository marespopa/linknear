import { useState } from 'react';
import { useP2P } from '../hooks/useP2P.ts';
import Input from './forms/Input.tsx';
import Button from './forms/Button.tsx';

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
        <h2 className="text-[10px] text-indigo-500 uppercase">
          Network_Protocol
        </h2>
        <div className="flex items-center gap-2">
          {/* 2. Guard against connections being undefined */}
          <span
            className={`h-2 w-2 rounded-full ${(connections?.length ?? 0) > 0 ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}
          ></span>
          <span className="text-[9px] text-indigo-300">
            {connections?.length ?? 0} Nodes_Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Input
          value={myId || 'CONNECTING...'}
          label="Local_Node_ID"
          readOnly
          canCopy
        />

        <Input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          label="REMOTE_ID"
          placeholder="Enter peer ID to connect"
        />

        <Button onClick={() => connectToPeer(targetId)}>SYNC</Button>
      </div>
    </div>
  );
}
