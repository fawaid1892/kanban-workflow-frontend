'use client';
import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/socket-provider';

export function ConnectionStatus() {
  const socket = useSocket();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', () => setConnected(false));

    // Set initial state
    setConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error');
    };
  }, [socket]);

  if (!socket) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-lg ring-1 ring-gray-200">
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
      <span className="text-xs font-medium text-gray-600">
        {connected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}
