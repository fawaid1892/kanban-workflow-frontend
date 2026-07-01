'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, ChevronDown, ChevronUp, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { fetchWorkflowRuns } from '@/lib/workflow-api';
import type { WorkflowRun } from '@/types/workflow';

function formatTime(ts: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { color: string; icon: React.ReactNode }> = {
    running: { color: 'bg-blue-100 text-blue-700', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    completed: { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    failed: { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
  };
  const v = variants[status] ?? { color: 'bg-gray-100 text-gray-700', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${v.color}`}>
      {v.icon}
      {status}
    </span>
  );
}

export default function WorkflowHistoryTab({ workflowId }: { workflowId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: runs, isLoading } = useQuery<WorkflowRun[]>({
    queryKey: ['workflow-runs', workflowId],
    queryFn: () => fetchWorkflowRuns(workflowId),
    enabled: !!workflowId,
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasRunning = Array.isArray(data) && data.some((r) => r.status === 'running');
      return hasRunning ? 10000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!runs || runs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
          <History className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900">No runs yet</h3>
        <p className="mt-1 text-xs text-gray-500">Run this workflow to see execution history</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Run History ({runs.length})</h3>
      </div>

      <div className="space-y-2">
        {[...runs].reverse().map((run) => {
          const isExpanded = expandedId === run.id;
          return (
            <div key={run.id} className="rounded-xl border border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : run.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600">
                  #{run.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={run.status} />
                    <span className="text-xs text-gray-500">
                      {(run.taskIds?.length ?? 0)} tasks
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatTime(run.createdAt)}
                    {run.completedAt && <> → {formatTime(run.completedAt)}</>}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-100 px-4 py-3">
                  <h4 className="mb-2 text-xs font-semibold text-gray-500">Params</h4>
                  <pre className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
                    {JSON.stringify(run.params, null, 2) ?? '{}'}
                  </pre>
                  {run.taskIds && run.taskIds.length > 0 && (
                    <>
                      <h4 className="mb-2 mt-3 text-xs font-semibold text-gray-500">Task IDs</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {run.taskIds.map((tid) => (
                          <span key={tid} className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-mono text-indigo-600">
                            {tid}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
