'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Workflow, Play, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fetchWorkflows, deleteWorkflow } from '@/lib/workflow-api';
import type { Workflow as WorkflowType } from '@/types/workflow';

export default function WorkflowsPage() {
  const queryClient = useQueryClient();

  const { data: workflows, isLoading } = useQuery<WorkflowType[]>({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 sm:p-8">
      {/* Header */}
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-1 text-sm text-gray-500">
              Build and manage your automation pipelines
            </p>
          </div>
          <Link
            href="/workflows/new"
            className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow"
          >
            <Plus className="h-4 w-4" />
            New Workflow
          </Link>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-white border border-gray-200" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && workflows && workflows.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
              <Workflow className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                No workflows yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Create your first workflow to automate task pipelines
              </p>
            </div>
            <Link
              href="/workflows/new"
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600"
            >
              <Plus className="h-4 w-4" />
              Create Workflow
            </Link>
          </div>
        )}

        {/* Workflow cards */}
        {workflows && workflows.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                      <Workflow className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">
                        {wf.name}
                      </h3>
                      {wf.description && (
                        <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                          {wf.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>
                    {new Date(wf.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {wf.stageCount !== undefined && (
                    <>
                      <span className="text-gray-300">·</span>
                      <Badge variant="info">{wf.stageCount} stages</Badge>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
                  <Link
                    href={`/workflows/${wf.id}/edit`}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/workflows/${wf.id}`}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                  >
                    <Play className="h-3 w-3 text-green-500" />
                    Run
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this workflow?')) {
                        deleteMutation.mutate(String(wf.id));
                      }
                    }}
                    className="ml-auto flex items-center gap-1 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
