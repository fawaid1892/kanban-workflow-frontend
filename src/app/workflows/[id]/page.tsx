'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Trash2, LayoutGrid, Settings, Play, History, Copy, Download, BarChart3, Activity, GitBranch, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWorkflow, deleteWorkflow, duplicateWorkflow, exportWorkflow } from '@/lib/workflow-api';
import type { Workflow } from '@/types/workflow';

const WorkflowBoardTab = dynamic(() => import('./board-tab'), { loading: () => <TabSkeleton /> });
const WorkflowEditTab = dynamic(() => import('./edit-tab'), { loading: () => <TabSkeleton /> });
const WorkflowSettingsTab = dynamic(() => import('./settings-tab'), { loading: () => <TabSkeleton /> });
const WorkflowRunTab = dynamic(() => import('./run-tab'), { loading: () => <TabSkeleton /> });
const WorkflowHistoryTab = dynamic(() => import('./history-tab'), { loading: () => <TabSkeleton /> });
const WorkflowAnalyticsTab = dynamic(() => import('./analytics-tab'), { loading: () => <TabSkeleton /> });
const WorkflowActivityTab = dynamic(() => import('./activity-tab'), { loading: () => <TabSkeleton /> });
const WorkflowVersionsTab = dynamic(() => import('./versions-tab'), { loading: () => <TabSkeleton /> });
const WorkflowWebhookTab = dynamic(() => import('./webhook-tab'), { loading: () => <TabSkeleton /> });

function TabSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<'board' | 'edit' | 'settings' | 'run' | 'history' | 'analytics' | 'activity' | 'versions' | 'webhook'>('board');
  const [deleteTarget, setDeleteTarget] = useState(false);

  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['workflow', id],
    queryFn: () => fetchWorkflow(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWorkflow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      router.push('/workflows');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateWorkflow(id),
    onSuccess: (newWf) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      router.push(`/workflows/${newWf.id}`);
    },
  });

  const handleExport = async () => {
    const data = await exportWorkflow(id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow?.name ?? 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900">Workflow not found</p>
          <Link href="/workflows" className="mt-3 inline-block text-sm text-indigo-500 hover:text-indigo-600">
            Back to workflows
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'board' as const, label: 'Board', icon: LayoutGrid },
    { key: 'edit' as const, label: 'Edit', icon: Pencil },
    { key: 'run' as const, label: 'Run', icon: Play },
    { key: 'history' as const, label: 'History', icon: History },
    { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
    { key: 'activity' as const, label: 'Activity', icon: Activity },
    { key: 'versions' as const, label: 'Versions', icon: GitBranch },
    { key: 'webhook' as const, label: 'Webhook', icon: Webhook },
    { key: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/workflows" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{workflow.name}</h1>
            {workflow.description && (
              <p className="text-xs text-gray-500">{workflow.description}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
            </Button>
            {activeTab === 'edit' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'board' && <WorkflowBoardTab workflowId={id} />}
        {activeTab === 'edit' && <WorkflowEditTab workflowId={id} />}
        {activeTab === 'run' && <WorkflowRunTab workflowId={id} />}
        {activeTab === 'history' && <WorkflowHistoryTab workflowId={id} />}
        {activeTab === 'analytics' && <WorkflowAnalyticsTab workflowId={id} />}
        {activeTab === 'activity' && <WorkflowActivityTab workflowId={id} />}
        {activeTab === 'versions' && <WorkflowVersionsTab workflowId={id} />}
        {activeTab === 'webhook' && <WorkflowWebhookTab workflowId={id} />}
        {activeTab === 'settings' && <WorkflowSettingsTab workflowId={id} />}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">Delete Workflow?</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will delete all stages, dependencies, and the board for <strong>{workflow.name}</strong>.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
