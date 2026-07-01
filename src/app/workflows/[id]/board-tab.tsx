'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RefreshCw, Search, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchBoardTasks, fetchBoardStats } from '@/lib/board-api';
import { updateTaskStatus } from '@/lib/workflow-api';
import { getSocket, joinWorkflowRoom, leaveWorkflowRoom } from '@/lib/socket';
import type { BoardTask, BoardStats } from '@/types/board';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'triage', label: 'Triage', color: 'bg-yellow-50' },
  { key: 'running', label: 'Running', color: 'bg-blue-50' },
  { key: 'blocked', label: 'Blocked', color: 'bg-red-50' },
  { key: 'done', label: 'Done', color: 'bg-green-50' },
  { key: 'failed', label: 'Failed', color: 'bg-red-100' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  blocked: 'bg-orange-100 text-orange-700',
  triage: 'bg-yellow-100 text-yellow-700',
  todo: 'bg-gray-100 text-gray-600',
};

function formatAge(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function WorkflowBoardTab({ workflowId }: { workflowId: string }) {
  const [statusFilter, setStatusFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: tasks, refetch } = useQuery<BoardTask[]>({
    queryKey: ['board-tasks', workflowId, statusFilter, assigneeFilter, search],
    queryFn: () => fetchBoardTasks(workflowId, {
      status: statusFilter || undefined,
      assignee: assigneeFilter || undefined,
      search: search || undefined,
      limit: 200,
    }),
    refetchInterval: 5000,
  });

  const { data: stats } = useQuery<BoardStats>({
    queryKey: ['board-stats', workflowId],
    queryFn: () => fetchBoardStats(workflowId),
    refetchInterval: 10000,
  });

  // WebSocket for real-time updates
  const queryClient = useQueryClient();
  useEffect(() => {
    const socket = getSocket();
    joinWorkflowRoom(workflowId);

    const handleBoardUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['board-tasks', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['board-stats', workflowId] });
    };

    socket.on('board:update', handleBoardUpdate);
    return () => {
      socket.off('board:update', handleBoardUpdate);
      leaveWorkflowRoom(workflowId);
    };
  }, [workflowId, queryClient]);

  const tasksByStatus = React.useMemo(() => {
    if (!tasks) return {};
    const grouped: Record<string, BoardTask[]> = {};
    for (const task of tasks) {
      const key = task.status || 'unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    }
    return grouped;
  }, [tasks]);

  const assignees = React.useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.assignee))).sort();
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeTask, setActiveTask] = useState<BoardTask | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = String(over.id);
    if (taskId && newStatus && COLUMNS.some((c) => c.key === newStatus)) {
      await updateTaskStatus(workflowId, taskId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['board-tasks', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['board-stats', workflowId] });
    }
  };

  if (tasks && tasks.length === 0 && !statusFilter && !assigneeFilter && !search) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <span className="text-2xl">📋</span>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900">No tasks yet</h3>
        <p className="mt-1 text-xs text-gray-500">Run this workflow to generate tasks on this board</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Stats header */}
      {stats && stats.total > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5">
          <span className="text-xs font-semibold text-gray-500">Total:</span>
          <span className="text-sm font-bold text-gray-900">{stats.total}</span>
          <span className="mx-1 h-4 w-px bg-gray-200" />
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <span
              key={status}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}
            >
              {status}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="rounded-lg border px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>{col.label}</option>
          ))}
        </select>
        <select className="rounded-lg border px-3 py-2 text-sm" value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)}>
          <option value="">All assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="button" onClick={() => refetch()} className="rounded-lg border p-2 text-gray-400 hover:text-gray-600">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Board columns */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={(e) => { const t = tasks?.find((tk) => tk.id === String(e.active.id)); setActiveTask(t ?? null); }}>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {COLUMNS.map((col) => {
            const columnTasks = tasksByStatus[col.key] ?? [];
            return (
              <div key={col.key} className="min-w-[250px] flex-1 sm:min-w-[280px]">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{col.label}</h2>
                  <Badge variant="default">{columnTasks.length}</Badge>
                </div>
                <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div id={col.key} className={`min-h-[200px] rounded-lg p-2 ${col.color} dark:bg-gray-800/50`}>
                    {columnTasks.length === 0 ? (
                      <p className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">No tasks</p>
                    ) : (
                      <div className="space-y-2">
                        {columnTasks.map((task) => (
                          <SortableTaskCard key={task.id} task={task} workflowId={workflowId} />
                        ))}
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && (
            <div className="rounded-xl border border-indigo-300 bg-white p-3 shadow-lg dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function SortableTaskCard({ task, workflowId }: { task: BoardTask; workflowId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={`/workflows/${workflowId}/tasks/${task.id}`}>
        <div className="cursor-pointer rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
          <div className="flex items-start gap-2">
            <button type="button" {...listeners} className="mt-0.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
              <GripVertical className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 line-clamp-2 dark:text-gray-100">{task.title}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Badge variant="default">{task.assignee}</Badge>
                <span>{formatAge(task.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
