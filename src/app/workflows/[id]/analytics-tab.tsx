'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CheckCircle, Loader2, Clock } from 'lucide-react';
import { fetchWorkflowAnalytics, type WorkflowAnalytics } from '@/lib/workflow-api';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export default function WorkflowAnalyticsTab({ workflowId }: { workflowId: string }) {
  const { data: analytics, isLoading } = useQuery<WorkflowAnalytics>({
    queryKey: ['workflow-analytics', workflowId],
    queryFn: () => fetchWorkflowAnalytics(workflowId),
    enabled: !!workflowId,
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />)}
        </div>
      </div>
    );
  }

  if (!analytics || analytics.totalRuns === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30">
          <BarChart3 className="h-6 w-6 text-indigo-400" />
        </div>
        <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">No analytics yet</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Run this workflow to see analytics</p>
      </div>
    );
  }

  const maxRunsPerDay = Math.max(...analytics.runsPerDay.map((d) => d.count), 1);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Workflow Analytics</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<BarChart3 className="h-5 w-5 text-indigo-500" />} label="Total Runs" value={analytics.totalRuns} />
        <StatCard icon={<CheckCircle className="h-5 w-5 text-green-500" />} label="Success Rate" value={`${analytics.successRate}%`} />
        <StatCard icon={<Clock className="h-5 w-5 text-blue-500" />} label="Avg Duration" value={formatDuration(analytics.avgDurationSeconds)} />
        <StatCard icon={<Loader2 className="h-5 w-5 text-yellow-500" />} label="Running Now" value={analytics.runningRuns} />
      </div>

      {/* Status breakdown */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status Breakdown</h3>
        <div className="space-y-2">
          <StatusBar label="Completed" count={analytics.completedRuns} total={analytics.totalRuns} color="bg-green-500" />
          <StatusBar label="Failed" count={analytics.failedRuns} total={analytics.totalRuns} color="bg-red-500" />
          <StatusBar label="Running" count={analytics.runningRuns} total={analytics.totalRuns} color="bg-blue-500" />
        </div>
      </div>

      {/* Runs per day chart */}
      {analytics.runsPerDay.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Runs per Day (Last 30 Days)</h3>
          <div className="flex items-end gap-1 h-32">
            {analytics.runsPerDay.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-indigo-400 dark:bg-indigo-500 min-h-[2px]"
                  style={{ height: `${(day.count / maxRunsPerDay) * 100}%` }}
                  title={`${day.date}: ${day.count} runs`}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
            <span>{analytics.runsPerDay[0]?.date}</span>
            <span>{analytics.runsPerDay[analytics.runsPerDay.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  );
}

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-gray-600 dark:text-gray-400">{label}</span>
      <div className="flex-1 h-3 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-xs font-medium text-gray-700 dark:text-gray-300">{count} ({pct}%)</span>
    </div>
  );
}
