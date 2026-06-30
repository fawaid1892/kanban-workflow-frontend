'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Clock, RotateCcw, Zap } from 'lucide-react';

export interface StageNodeData {
  roleLabel: string;
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

function StageNode({ data, selected }: NodeProps) {
  const d = data as unknown as StageNodeData;

  return (
    <div className="group relative">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !-top-1.5 !border-2 !border-white !bg-gray-300 !shadow-md transition-colors hover:!bg-indigo-500"
      />

      <div
        className={`
          w-[260px] rounded-2xl border bg-white shadow-sm transition-all
          ${selected
            ? 'border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-400/20'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }
        `}
      >
        {/* Role header */}
        <div className="flex items-center gap-2 rounded-t-2xl bg-gray-50 px-4 py-2.5">
          <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-600">
            {d.roleLabel || d.assigneeSlug || 'Stage'}
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
              {d.skills.slice(0, 3).map((skill: string) => (
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

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !-bottom-1.5 !border-2 !border-white !bg-gray-300 !shadow-md transition-colors hover:!bg-indigo-500"
      />
    </div>
  );
}

export default memo(StageNode);