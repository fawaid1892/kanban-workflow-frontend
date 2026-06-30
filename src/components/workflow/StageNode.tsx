'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { User, Clock, RotateCcw, Zap } from 'lucide-react';

export interface StageNodeData {
  titleTemplate: string;
  assigneeSlug: string;
  initialStatus: string;
  maxRuntime: number | null;
  maxRetries: number;
  skills: string[];
  goalMode: boolean;
  sortOrder: number;
  [key: string]: unknown;
}

const ASSIGNEE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  backend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  frontend: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  qa: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  cybersecurity: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  devops: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

const DEFAULT_COLORS = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

function StageNode({ data, selected }: NodeProps) {
  const d = data as unknown as StageNodeData;
  const colors = ASSIGNEE_COLORS[d.assigneeSlug] ?? DEFAULT_COLORS;

  return (
    <div className="group relative">
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !-top-1.5 !border-2 !border-white !bg-gray-300 !shadow-md transition-colors hover:!bg-indigo-500"
      />

      {/* Node card */}
      <div
        className={`
          w-[260px] rounded-2xl border bg-white shadow-sm transition-all
          ${selected
            ? 'border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-400/20'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        {/* Header bar with assignee color */}
        <div className={`flex items-center gap-2 rounded-t-2xl px-4 py-2.5 ${colors.bg} ${colors.border} border-b`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${colors.bg} ${colors.text}`}>
            <User className="h-3.5 w-3.5" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
            {d.assigneeSlug || 'Unassigned'}
          </span>
          {d.goalMode && (
            <Zap className="ml-auto h-3.5 w-3.5 text-amber-500" />
          )}
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <p className="text-sm font-semibold leading-snug text-gray-900">
            {d.titleTemplate || (
              <span className="italic text-gray-400">Untitled Stage</span>
            )}
          </p>

          {/* Meta row */}
          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-500">
            {d.maxRuntime && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {d.maxRuntime}s
              </span>
            )}
            {d.maxRetries > 0 && (
              <span className="inline-flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                {d.maxRetries}x
              </span>
            )}
            <span
              className={`ml-auto inline-block h-2 w-2 rounded-full ${
                d.initialStatus === 'triage' ? 'bg-amber-400' : 'bg-gray-300'
              }`}
              title={d.initialStatus}
            />
          </div>

          {/* Skills */}
          {d.skills && d.skills.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {d.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                >
                  {skill}
                </span>
              ))}
              {d.skills.length > 3 && (
                <span className="text-[10px] text-gray-400">
                  +{d.skills.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !-bottom-1.5 !border-2 !border-white !bg-gray-300 !shadow-md transition-colors hover:!bg-indigo-500"
      />
    </div>
  );
}

export default memo(StageNode);
