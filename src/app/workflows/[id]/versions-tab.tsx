'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchVersions, type WorkflowVersion } from '@/lib/workflow-api';

export default function WorkflowVersionsTab({ workflowId }: { workflowId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: versions, isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: ['workflow-versions', workflowId],
    queryFn: () => fetchVersions(workflowId),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
      </div>
    );
  }

  if (!versions || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
          <GitBranch className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">No versions yet</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Versions are created when you modify stages</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h2 className="mb-4 text-base font-bold text-gray-900 dark:text-gray-100">Version History ({versions.length})</h2>
      <div className="space-y-2">
        {[...versions].reverse().map((v) => {
          const isExpanded = expandedId === v.id;
          const stages = v.stagesSnapshot as Array<{ roleLabel: string; titleTemplate: string }> | undefined;
          return (
            <div key={v.id} className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : v.id)}
                className="flex w-full items-center gap-3 p-4 text-left"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  v{v.version}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {v.changeSummary ?? `Version ${v.version}`}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">
                    {stages?.length ?? 0} stages · {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {isExpanded && stages && (
                <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                  <h4 className="mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400">Stages Snapshot</h4>
                  <div className="space-y-1.5">
                    {stages.map((stage, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold dark:bg-gray-700">{i + 1}</span>
                        <span className="font-medium">{stage.roleLabel}</span>
                        <span className="text-xs text-gray-400">— {stage.titleTemplate}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
