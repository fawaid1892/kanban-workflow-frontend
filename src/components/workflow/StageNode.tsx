'use client';

import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GripVertical, User, Clock, RotateCcw } from 'lucide-react';

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

const STATUS_COLORS: Record<string, string> = {
  todo: 'border-gray-400 bg-white',
  triage: 'border-yellow-400 bg-yellow-50',
  running: 'border-blue-400 bg-blue-50',
  done: 'border-green-400 bg-green-50',
};

const ASSIGNEE_COLORS: Record<string, string> = {
  backend: '#3b82f6',
  frontend: '#8b5cf6',
  qa: '#10b981',
  cybersecurity: '#ef4444',
  devops: '#f59e0b',
};

function StageNode({ data, selected }: NodeProps) {
  const d = data as unknown as StageNodeData;
  const borderColor = STATUS_COLORS[d.initialStatus] ?? STATUS_COLORS.todo;
  const assigneeColor = ASSIGNEE_COLORS[d.assigneeSlug] ?? '#6b7280';

  return (
    <div
      className={`group min-w-[220px] max-w-[280px] rounded-xl border-2 px-4 py-3 shadow-sm transition-all ${borderColor} ${selected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:shadow-md'}`}
    >
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white hover:!border-indigo-500 hover:!bg-indigo-100"
      />

      {/* Header */}
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 cursor-grab text-gray-300" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {d.titleTemplate || 'Untitled Stage'}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {d.assigneeSlug && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white"
            style={{ backgroundColor: assigneeColor }}
          >
            <User className="h-3 w-3" />
            {d.assigneeSlug}
          </span>
        )}
        {d.maxRuntime && (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Clock className="h-3 w-3" />
            {d.maxRuntime}s
          </span>
        )}
        {d.maxRetries > 0 && (
          <span className="inline-flex items-center gap-1 text-gray-500">
            <RotateCcw className="h-3 w-3" />
            ×{d.maxRetries}
          </span>
        )}
      </div>

      {/* Skills */}
      {d.skills && d.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {d.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
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

      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-gray-400 !bg-white hover:!border-indigo-500 hover:!bg-indigo-100"
      />
    </div>
  );
}

export default memo(StageNode);
