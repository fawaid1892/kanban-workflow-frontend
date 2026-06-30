'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Play, Trash2, Workflow } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { fetchWorkflows, deleteWorkflow } from '@/lib/workflow-api';
import type { Workflow as WorkflowType } from '@/types/workflow';

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function WorkflowsPage() {
  const queryClient = useQueryClient();

  const {
    data: workflows,
    isLoading,
    isError,
    error,
  } = useQuery<WorkflowType[]>({
    queryKey: ['workflows'],
    queryFn: fetchWorkflows,
  });

  const [deleteTarget, setDeleteTarget] = useState<WorkflowType | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      setDeleteTarget(null);
      setToast({ message: 'Workflow deleted successfully', type: 'success' });
    },
    onError: (err: Error) => {
      setToast({
        message: err.message || 'Failed to delete workflow',
        type: 'error',
      });
    },
  });

  const showToast = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-44 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-44 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full animate-pulse rounded-lg bg-gray-100"
            />
          ))}
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
            Failed to load workflows
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
              queryClient.invalidateQueries({ queryKey: ['workflows'] })
            }
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflows</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage workflow templates and stage dependencies
          </p>
        </div>
        <Link href="/workflows/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-white sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Stages</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows && workflows.length > 0 ? (
              workflows.map((wf) => (
                <TableRow key={wf.id}>
                  <TableCell>
                    <span className="font-medium text-gray-900">
                      {wf.name}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-gray-600">
                    {wf.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {wf.stageCount ?? 0} stage
                      {(wf.stageCount ?? 0) !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500">
                    {formatDate(wf.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/workflows/${wf.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Edit workflow"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Run workflow"
                      >
                        <Play className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete workflow"
                        onClick={() => setDeleteTarget(wf)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty
                colSpan={5}
                message="No workflows yet, create your first workflow"
              />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 sm:hidden">
        {workflows && workflows.length > 0 ? (
          workflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{wf.name}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatDate(wf.createdAt)}
                  </p>
                </div>
                <Badge variant="info">
                  {wf.stageCount ?? 0} stage
                  {(wf.stageCount ?? 0) !== 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {wf.description}
              </p>
              <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                <Link href={`/workflows/${wf.id}`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(wf)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center rounded-xl border bg-white px-6 py-12 text-center">
            <Workflow className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">
              No workflows yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first workflow template to get started
            </p>
            <Link href="/workflows/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Create Workflow
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Workflow"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete workflow{' '}
          <span className="font-semibold text-gray-900">
            &lsquo;{deleteTarget?.name}&rsquo;
          </span>
          ? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {showToast}
    </div>
  );
}
