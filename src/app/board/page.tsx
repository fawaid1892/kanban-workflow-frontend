'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { fetchBoardTasks, fetchBoardStats } from '@/lib/board-api';
import type { BoardTask, BoardStats } from '@/types/board';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
  { key: 'triage', label: 'Triage', color: 'bg-yellow-50' },
  { key: 'running', label: 'Running', color: 'bg-blue-50' },
  { key: 'blocked', label: 'Blocked', color: 'bg-red-50' },
  { key: 'done', label: 'Done', color: 'bg-green-50' },
  { key: 'failed', label: 'Failed', color: 'bg-red-100' },
] as const;

function formatAge(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function BoardPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const {
    data: tasks,
    isLoading,
    refetch,
  } = useQuery<BoardTask[]>({
    queryKey: ['board-tasks', statusFilter, assigneeFilter, search],
    queryFn: () =>
      fetchBoardTasks({
        status: statusFilter || undefined,
        assignee: assigneeFilter || undefined,
        search: search || undefined,
        limit: 200,
      }),
    refetchInterval: 5000, // auto-refresh every 5s
  });

  const { data: stats } = useQuery<BoardStats>({
    queryKey: ['board-stats'],
    queryFn: fetchBoardStats,
    refetchInterval: 5000,
  });

  // Group tasks by status
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

  // Unique assignees for filter
  const assignees = React.useMemo(() => {
    if (!tasks) return [];
    return Array.from(new Set(tasks.map((t) => t.assignee))).sort();
  }, [tasks]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Board</h1>
        {stats && (
          <Badge variant="info">{stats.total} tasks</Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="rounded-lg border py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {COLUMNS.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
              {stats?.byStatus[col.key]
                ? ` (${stats.byStatus[col.key]})`
                : ''}
            </option>
          ))}
        </select>

        <select
          className="rounded-lg border px-3 py-2 text-sm"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
        >
          <option value="">All assignees</option>
          {assignees.map((a) => (
            <option key={a} value={a}>
              {a}
              {stats?.byAssignee[a] ? ` (${stats.byAssignee[a]})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Board columns */}
      {isLoading ? (
        <div className="flex flex-1 gap-4 overflow-x-auto">
          {COLUMNS.map((col) => (
            <div key={col.key} className="min-w-[250px] flex-1">
              <div className="mb-2 h-6 w-20 animate-pulse rounded bg-gray-200" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 gap-4 overflow-x-auto">
          {COLUMNS.map((col) => {
            const columnTasks = tasksByStatus[col.key] ?? [];
            return (
              <div key={col.key} className="min-w-[250px] flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-700">
                    {col.label}
                  </h2>
                  <Badge variant="default">{columnTasks.length}</Badge>
                </div>
                <div className={`min-h-[200px] rounded-lg p-2 ${col.color}`}>
                  {columnTasks.length === 0 ? (
                    <p className="py-8 text-center text-xs text-gray-400">
                      No tasks
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {columnTasks.map((task) => (
                        <Link
                          key={task.id}
                          href={`/board/${task.id}`}
                        >
                          <Card className="cursor-pointer transition-shadow hover:shadow-md">
                            <CardContent className="p-3">
                              <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                {task.title}
                              </p>
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <Badge variant="default">
                                  {task.assignee}
                                </Badge>
                                <span>{formatAge(task.createdAt)}</span>
                              </div>
                              {task.skills && task.skills.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {task.skills.slice(0, 3).map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="info"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
