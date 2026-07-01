'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitBranch, ChevronDown, ChevronUp, ArrowRight, Plus, Minus, Pencil } from 'lucide-react';
import { fetchVersions, compareVersions, type WorkflowVersion, type VersionComparison } from '@/lib/workflow-api';

export default function WorkflowVersionsTab({ workflowId }: { workflowId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [v1, setV1] = useState<number>(0);
  const [v2, setV2] = useState<number>(0);
  const [comparison, setComparison] = useState<VersionComparison | null>(null);

  const { data: versions, isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: ['workflow-versions', workflowId],
    queryFn: () => fetchVersions(workflowId),
    enabled: !!workflowId,
  });

  const handleCompare = async () => {
    if (v1 && v2 && v1 !== v2) {
      const result = await compareVersions(workflowId, v1, v2);
      setComparison(result);
    }
  };

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
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Version History ({versions.length})</h2>
        <button
          type="button"
          onClick={() => { setCompareMode(!compareMode); setComparison(null); }}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${compareMode ? 'bg-indigo-500 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400'}`}
        >
          {compareMode ? 'Cancel Compare' : 'Compare Versions'}
        </button>
      </div>

      {/* Compare selector */}
      {compareMode && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-800 dark:bg-indigo-900/10">
          <select value={v1} onChange={(e) => setV1(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800">
            <option value={0}>Version 1</option>
            {versions.map((v) => <option key={v.id} value={v.version}>v{v.version}</option>)}
          </select>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <select value={v2} onChange={(e) => setV2(Number(e.target.value))} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-800">
            <option value={0}>Version 2</option>
            {versions.map((v) => <option key={v.id} value={v.version}>v{v.version}</option>)}
          </select>
          <button
            type="button"
            onClick={handleCompare}
            disabled={!v1 || !v2 || v1 === v2}
            className="rounded-lg bg-indigo-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
          >
            Compare
          </button>
        </div>
      )}

      {/* Comparison results */}
      {comparison && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            v{comparison.version1.version} → v{comparison.version2.version}
          </h3>
          {comparison.added.length > 0 && (
            <div>
              <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold text-green-600"><Plus className="h-3 w-3" /> Added ({comparison.added.length})</h4>
              {(comparison.added as Array<Record<string, unknown>>).map((s, i) => <div key={i} className="rounded-lg bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">{String(s.roleLabel)} — {String(s.titleTemplate)}</div>)}
            </div>
          )}
          {comparison.removed.length > 0 && (
            <div>
              <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold text-red-600"><Minus className="h-3 w-3" /> Removed ({comparison.removed.length})</h4>
              {(comparison.removed as Array<Record<string, unknown>>).map((s, i) => <div key={i} className="rounded-lg bg-red-50 p-2 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">{String(s.roleLabel)} — {String(s.titleTemplate)}</div>)}
            </div>
          )}
          {comparison.changed.length > 0 && (
            <div>
              <h4 className="mb-1 flex items-center gap-1 text-xs font-semibold text-yellow-600"><Pencil className="h-3 w-3" /> Changed ({comparison.changed.length})</h4>
              {comparison.changed.map((c, i) => (
                <div key={i} className="rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <span className="font-medium">{String((c.before as Record<string, unknown>).roleLabel)}</span>: {c.diff.join(', ')}
                </div>
              ))}
            </div>
          )}
          {comparison.unchanged.length > 0 && (
            <p className="text-xs text-gray-400">{comparison.unchanged.length} unchanged stages</p>
          )}
        </div>
      )}

      {/* Version list */}
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
