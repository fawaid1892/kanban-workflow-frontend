'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || (typeof window !== 'undefined' ? window.location.origin : '');

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(WS_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

export function joinWorkflowRoom(workflowId: string) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('join', { workflowId });
}

export function leaveWorkflowRoom(workflowId: string) {
  const s = getSocket();
  s.emit('leave', { workflowId });
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
