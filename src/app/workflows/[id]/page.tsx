'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Pencil, Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardContent,
} from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import {
  fetchWorkflowGraph,
  deleteWorkflow,
  runWorkflow,
  fetchWorkflowRuns,
  fetchWorkflowRun,
} from '@/lib/workflow-api';
import type { WorkflowGraph, WorkflowRun } from '@/types/workflow';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const {
    data: graph,
    isLoading,
    isError,
    error,
  } = useQuery<WorkflowGraph>({
    queryKey: ['workflow-graph', id],
    queryFn: () => fetchWorkflowGraph(id),
    enabled: !!id,
  });

  const [deleteTarget, setDeleteTarget] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setToast({ message: 'Workflow deleted successfully', type: 'success' });
      setTimeout(() => router.push('/workflows'), 500);
    },
    onError: (err: Error) => {
      setToast({
        message: err.message || 'Failed to delete workflow',
        type: 'error',
      });
    },
  });

  // ── Run workflow state ──
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runParams, setRunParams] = useState<Record<string, string>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);

  // Extract {param} placeholders from stage templates
  const paramPlaceholders = React.useMemo(() => {
    if (!graph) return [];
    const params = new Set<string>();
    for (const stage of graph.stages) {
      const matches = stage.titleTemplate.match(/\{(\w+)\}/g);
      if (matches) {
        for (const m of matches) {
          const key = m.slice(1, -1);
          // Skip auto-filled params
          if (!['date', 'timestamp', 'datetime'].includes(key)) {
            params.add(key);
          }
        }
      }
    }
    return Array.from(params).sort();
  }, [graph]);

  // Run history query
  const { data: runs } = useQuery<WorkflowRun[]>({
    queryKey: ['workflow-runs', id],
    queryFn: () => fetchWorkflowRuns(id),
    enabled: !!id,
  });

  // Poll active run status
  const { data: activeRun } = useQuery<WorkflowRun>({
    queryKey: ['workflow-run', id, activeRunId],
    queryFn: () => fetchWorkflowRun(id, activeRunId!),
    enabled: !!activeRunId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' ? 2000 : false;
    },
  });

  // When active run completes, show toast and refresh
  React.useEffect(() => {
    if (activeRun && activeRun.status !== 'running' && activeRunId) {
      setActiveRunId(null);
      queryClient.invalidateQueries({ queryKey: ['workflow-runs', id] });
      if (activeRun.status === 'completed') {
        setRunModalOpen(false);
        setToast({
          message: `${activeRun.taskIds.length} tasks created successfully!`,
          type: 'success',
        });
      } else {
        setToast({
          message: 'Workflow run failed',
          type: 'error',
        });
      }
    }
  }, [activeRun, activeRunId, id, queryClient]);

  const runMutation = useMutation({
    mutationFn: () =>
      runWorkflow(id, { params: runParams }),
    onSuccess: (data) => {
      setActiveRunId(data.runId);
    },
    onError: (err: Error) => {
      setToast({
        message: err.message || 'Failed to run workflow',
        type: 'error',
      });
    },
  });

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="mb-6 h-6 w-24 animate-pulse rounded bg-gray-200" />
        <div className="space-y-4">
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-100" />
          <div className="h-40 w-full animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">
            Failed to load workflow
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error
              ? error.message
              : 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ['workflow-graph', id] })
            }
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (!graph) return null;

  const { workflow, stages } = graph;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/workflows')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workflows
      </button>

      {/* ── Workflow header ── */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {workflow.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {workflow.description}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                <Badge variant="info">
                  {stages.length} stage{stages.length !== 1 ? 's' : ''}
                </Badge>
                <span>Created {formatDate(workflow.createdAt)}</span>
                {workflow.updatedAt && (
                  <span>Updated {formatDate(workflow.updatedAt)}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/workflows/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRunModalOpen(true)}
                disabled={!!activeRunId}
              >
                <Play className="h-4 w-4 text-green-600" />
                {activeRunId ? 'Running...' : 'Run'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* ── Stages visual ── */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Stages</h2>

        {stages.length === 0 ? (
          <Card>
            <CardContent>
              <p className="py-8 text-center text-sm text-gray-400">
                No stages defined in this workflow yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          stages
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((stage, index) => {
              // Find parent stages from the parents[] array
              const parentStages = (stage.parents || [])
                .map((parentId) => stages.find((s) => String(s.id) === String(parentId)))
                .filter(Boolean);

              return (
                <Card key={stage.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                            {index + 1}
                          </span>
                          <h3 className="font-medium text-gray-900">
                            {stage.titleTemplate || (
                              <span className="italic text-gray-400">
                                No title template
                              </span>
                            )}
                          </h3>
                          <Badge variant={stage.initialStatus === 'triage' ? 'warning' : 'default'}>
                            {stage.initialStatus}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                          {stage.assigneeName && (
                            <span>
                              Assignee:{' '}
                              <span className="font-medium text-gray-700">
                                {stage.assigneeName}
                              </span>
                            </span>
                          )}
                          <span>
                            Runtime:{' '}
                            <span className="font-medium text-gray-700">
                              {stage.maxRuntime}s
                            </span>
                          </span>
                          <span>
                            Retries:{' '}
                            <span className="font-medium text-gray-700">
                              {stage.maxRetries}
                            </span>
                          </span>
                          <span>
                            Goal Mode:{' '}
                            <span className="font-medium text-gray-700">
                              {stage.goalMode ? 'On' : 'Off'}
                            </span>
                          </span>
                        </div>

                        {stage.skills && stage.skills.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {stage.skills.map((skill) => (
                              <Badge key={skill} variant="default">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {parentStages.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="font-medium">Depends on:</span>
                            {parentStages.map((ps) => (
                              <Badge key={ps!.id} variant="info">
                                Stage{' '}
                                {stages.findIndex(
                                  (s) => s.id === ps!.id,
                                ) + 1}
                                : {ps!.titleTemplate || 'untitled'}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>

      {/* ── Dependency graph (ASCII-style) ── */}
      {stages.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Dependency Graph
            </h2>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700">
              {stages
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((stage, i) => {
                  const depParents = (stage.parents || []);
                  const depNames = depParents
                    .map((parentId) => {
                      const ps = stages.find(
                        (s) => String(s.id) === String(parentId),
                      );
                      return ps
                        ? `Stage ${stages.indexOf(ps) + 1}`
                        : 'unknown';
                    })
                    .join(', ');
                  const indent = depParents.length > 0 ? '  ' : '';
                  const prefix = depParents.length > 0 ? '└─ ' : '';
                  const depInfo =
                    depNames.length > 0
                      ? ` [waits for: ${depNames}]`
                      : '';
                  return `${indent}${prefix}Stage ${i + 1}: "${stage.titleTemplate || 'untitled'}"${depInfo}`;
                })
                .join('\n')}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Run History ── */}
      {runs && runs.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Run History</h2>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 pr-4">Run ID</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2 pr-4">Tasks</th>
                    <th className="pb-2 pr-4">Params</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs
                    .slice()
                    .reverse()
                    .map((run) => (
                      <tr key={run.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">
                          #{run.id}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant={
                              run.status === 'completed'
                                ? 'default'
                                : run.status === 'failed'
                                  ? 'error'
                                  : 'warning'
                            }
                          >
                            {run.status}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          {run.taskIds?.length ?? 0}
                        </td>
                        <td className="py-2 pr-4 text-xs text-gray-500">
                          {Object.entries(run.params ?? {})
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ') || '—'}
                        </td>
                        <td className="py-2 text-xs text-gray-400">
                          {formatDate(run.createdAt)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Run Workflow Modal ── */}
      <Modal
        open={runModalOpen}
        onClose={() => {
          if (!activeRunId) setRunModalOpen(false);
        }}
        title="Run Workflow"
        size="md"
      >
        {activeRunId ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-900">
              Generating tasks...
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Run #{activeRunId} —{' '}
              {activeRun?.status === 'running'
                ? 'in progress'
                : activeRun?.status ?? 'starting'}
            </p>
          </div>
        ) : (
          <>
            {paramPlaceholders.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  Fill in the template parameters:
                </p>
                {paramPlaceholders.map((param) => (
                  <div key={param}>
                    <label className="mb-1 block text-xs font-medium text-gray-700">
                      {'{'}
                      {param}
                      {'}'}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={`Enter ${param}`}
                      value={runParams[param] ?? ''}
                      onChange={(e) =>
                        setRunParams((prev) => ({
                          ...prev,
                          [param]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No template parameters needed. Click Run to generate tasks.
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setRunModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => runMutation.mutate()}
                loading={runMutation.isPending}
              >
                <Play className="h-4 w-4" />
                Run
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={deleteTarget}
        onClose={() => setDeleteTarget(false)}
        title="Delete Workflow"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete workflow{' '}
          <span className="font-semibold text-gray-900">
            &lsquo;{workflow.name}&rsquo;
          </span>
          ? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
