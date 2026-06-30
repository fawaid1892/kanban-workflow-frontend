'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/lib/socket-provider';
import type { BuildProgress } from '@/types/events';

export function useBuildProgress(roleSlug: string) {
  const socket = useSocket();
  const [log, setLog] = useState<string>('');
  const [status, setStatus] = useState<string>('idle');

  const appendLog = useCallback((chunk: string) => {
    setLog(prev => prev + chunk);
  }, []);

  useEffect(() => {
    if (!socket || !roleSlug) return;

    socket.emit('subscribe:role', roleSlug);

    const handler = (data: BuildProgress) => {
      if (data.roleSlug === roleSlug) {
        if (data.output) appendLog(data.output);
        if (data.status) setStatus(data.status);
      }
    };

    socket.on('sandbox:buildProgress', handler);

    return () => {
      socket.off('sandbox:buildProgress', handler);
    };
  }, [socket, roleSlug, appendLog]);

  return { log, status, clearLog: () => setLog('') };
}
