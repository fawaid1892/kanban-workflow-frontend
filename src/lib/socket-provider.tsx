'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children, url }: { children: React.ReactNode; url?: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(url || process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/events');
    setSocket(s);
    return () => { s.disconnect(); };
  }, [url]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
