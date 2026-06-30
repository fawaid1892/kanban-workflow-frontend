'use client';
import { useEffect } from 'react';
import { useSocket } from '@/lib/socket-provider';
import type { KanbanEvent, TaskUpdate } from '@/types/events';

export function useKanbanEvents(onEvent?: (event: KanbanEvent) => void, onTaskUpdate?: (update: TaskUpdate) => void) {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:board');

    if (onEvent) {
      socket.on('kanban:event', onEvent);
    }
    if (onTaskUpdate) {
      socket.on('kanban:taskUpdate', onTaskUpdate);
    }

    return () => {
      socket.off('kanban:event');
      socket.off('kanban:taskUpdate');
      socket.emit('unsubscribe:all');
    };
  }, [socket, onEvent, onTaskUpdate]);
}
