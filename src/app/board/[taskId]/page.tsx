'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { fetchTaskDetail } from '@/lib/board-api';
import type { TaskDetail } from '@/types/board';

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDuration(start: number, end: number | null): string {
  const duration = (end ?? Date.now() / 1000) - start;
  if (duration < 60) return `${Math.floor(duration)}s`;
  if (duration < 3600) return `${Math.floor(duration / 60)}m`;
  return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'default',
  triage: 'warning',
  running: 'info',
  blocked: 'error',
  done: 'default',
  failed: 'error',
} as const;

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const {
    data: task,
    isLoading,
    isError,
    error,
  } = useQuery<TaskDetail>({
    queryKey: ['task-detail', taskId],
    queryFn: () => fetchTaskDetail(taskId),
    enabled: !!taskId,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6 h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-100" />
          <div className="h-60 w-full animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">
            Failed to load task
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error
              ? error.message
              : 'Task not found or an error occurred'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/board')}
          >
            Back to board
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/board')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to board
      </button>

      {/* Task header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_COLORS[task.status] as any ?? 'default'}>
                  {task.status}
                </Badge>
                <span className="font-mono text-xs text-gray-400">
                  {task.id}
                </span>
              </div>
              <h1 className="mt-2 text-xl font-bold text-gray-900">
                {task.title}
              </h1>
              {task.body && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                  {task.body}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-gray-500">Assignee:</span>{' '}
              <Badge variant="default">{task.assignee}</Badge>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="text-gray-700">
                {formatTimestamp(task.createdAt)}
              </span>
            </div>
            {task.startedAt && (
              <div>
                <span className="text-gray-500">Duration:</span>{' '}
                <span className="text-gray-700">
                  {formatDuration(task.startedAt, task.completedAt)}
                </span>
              </div>
            )}
            {task.workspaceKind && (
              <div>
                <span className="text-gray-500">Workspace:</span>{' '}
                <span className="text-gray-700">{task.workspaceKind}</span>
              </div>
            )}
            {task.branchName && (
              <div>
                <span className="text-gray-500">Branch:</span>{' '}
                <span className="font-mono text-gray-700">
                  {task.branchName}
                </span>
              </div>
            )}
          </div>

          {task.skills && task.skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {task.skills.map((skill) => (
                <Badge key={skill} variant="info">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {/* Parent/Child links */}
          {(task.parentIds.length > 0 || task.childIds.length > 0) && (
            <div className="mt-4 border-t pt-3">
              {task.parentIds.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Depends on:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {task.parentIds.map((pid) => (
                      <Link key={pid} href={`/board/${pid}`}>
                        <Badge variant="info" className="cursor-pointer hover:bg-blue-100">
                          {pid}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {task.childIds.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500">
                    Blocks:
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {task.childIds.map((cid) => (
                      <Link key={cid} href={`/board/${cid}`}>
                        <Badge variant="warning" className="cursor-pointer hover:bg-yellow-100">
                          {cid}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {task.result && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">Result</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {task.result}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events timeline */}
      {task.events && task.events.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Events ({task.events.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 border-l-2 border-gray-200 pl-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{event.kind}</Badge>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(event.createdAt)}
                      </span>
                    </div>
                    {event.payload && (
                      <pre className="mt-1 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                        {event.payload}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {task.comments && task.comments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Comments ({task.comments.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.comments.map((comment) => (
                <div key={comment.id} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {comment.author}
                    </span>
                    <span>{formatTimestamp(comment.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
