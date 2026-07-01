'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, CheckCircle, Loader2 } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { fetchWorkflowGraph, runWorkflow } from '@/lib/workflow-api';
import type { WorkflowGraph } from '@/types/workflow';

function extractPlaceholders(stages: WorkflowGraph['stages']): string[] {
  const placeholders = new Set<string>();
  const regex = /\{(\w+)\}/g;
  for (const stage of stages) {
    let match;
    while ((match = regex.exec(stage.titleTemplate)) !== null) {
      placeholders.add(match[1]);
    }
  }
  return Array.from(placeholders).sort();
}

export default function WorkflowRunTab({ workflowId }: { workflowId: string }) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [lastRunResult, setLastRunResult] = useState<{ runId: string; status: string } | null>(null);

  const { data: graph, isLoading: graphLoading } = useQuery<WorkflowGraph>({
    queryKey: ['workflow-graph', workflowId],
    queryFn: () => fetchWorkflowGraph(workflowId),
    enabled: !!workflowId,
  });

  const placeholders = useMemo(() => {
    if (!graph?.stages) return [];
    return extractPlaceholders(graph.stages);
  }, [graph]);

  const runMutation = useMutation({
    mutationFn: () => runWorkflow(workflowId, { params }),
    onSuccess: (result) => {
      setLastRunResult(result);
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['board-tasks', workflowId] });
      setToast({ message: `Workflow started! Run #${result.runId}`, type: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  useKeyboardShortcuts({
    onRun: () => { if (!runMutation.isPending) runMutation.mutate(); },
  });

  if (graphLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const stages = graph?.stages ?? [];

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-1 text-base font-bold text-gray-900">Run Workflow</h2>
      <p className="mb-6 text-xs text-gray-500">Configure parameters and execute this workflow</p>

      {/* Stage preview */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Stages ({stages.length})
        </h3>
        <div className="space-y-1.5">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                {i + 1}
              </span>
              <span className="font-medium">{stage.roleLabel}</span>
              <span className="text-xs text-gray-400">— {stage.titleTemplate}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Params form */}
      {placeholders.length > 0 ? (
        <div className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Parameters
          </h3>
          <div className="space-y-3">
            {placeholders.map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-gray-600">
                  {`{${key}}`}
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                  placeholder={`Enter value for ${key}`}
                  value={params[key] ?? ''}
                  onChange={(e) => setParams((p) => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-dashed border-gray-300 bg-white/50 px-6 py-4 text-center text-xs text-gray-400">
          No template parameters found — all stages will use their default titles
        </div>
      )}

      {/* Run button */}
      <button
        type="button"
        onClick={() => runMutation.mutate()}
        disabled={runMutation.isPending}
        className="flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50"
      >
        {runMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {runMutation.isPending ? 'Running...' : 'Run Workflow'}
      </button>

      {/* Result */}
      {lastRunResult && (
        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-800">Workflow Started!</p>
              <p className="text-xs text-green-600">
                Run #{lastRunResult.runId} — {lastRunResult.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
