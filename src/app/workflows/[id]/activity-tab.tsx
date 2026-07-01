'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Plus, Pencil, Trash2, Play, Upload, Download } from 'lucide-react';
import { fetchActivityLog, type ActivityEntry } from '@/lib/workflow-api';

function formatRelativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const ACTION_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  created: { icon: <Plus className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', label: 'Created' },
  updated: { icon: <Pencil className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Updated' },
  deleted: { icon: <Trash2 className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Deleted' },
  ran: { icon: <Play className="h-3.5 w-3.5" />, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Ran' },
  exported: { icon: <Download className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Exported' },
  imported: { icon: <Upload className="h-3.5 w-3.5" />, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', label: 'Imported' },
};

export default function WorkflowActivityTab({ workflowId }: { workflowId: string }) {
  const { data: logs, isLoading } = useQuery<ActivityEntry[]>({
    queryKey: ['activity-log', workflowId],
    queryFn: () => fetchActivityLog(workflowId),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
          <Activity className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">No activity yet</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Changes to this workflow will appear here</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Activity Log ({logs.length})</h2>
      <div className="relative space-y-0">
        <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        {[...logs].reverse().map((entry) => {
          const config = ACTION_CONFIG[entry.action] ?? { icon: <Activity className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-600', label: entry.action };
          return (
            <div key={entry.id} className="relative flex items-start gap-3 py-3">
              <div className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">{config.label}</span>
                  {' '}{entry.entityType}
                  {entry.entityId && <span className="text-gray-400 dark:text-gray-500"> #{entry.entityId}</span>}
                </p>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{formatRelativeTime(entry.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
