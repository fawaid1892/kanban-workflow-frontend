'use client';

import React from 'react';
import { X, Trash2, Clock, RotateCcw, Zap, Tag } from 'lucide-react';
import type { StageNodeData } from './StageNode';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'triage', label: 'Triage' },
];

interface Props {
  data: StageNodeData | null;
  onChange: (data: Partial<StageNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function NodeEditor({ data, onChange, onDelete, onClose }: Props) {
  if (!data) return null;

  return (
    <div className="absolute right-0 top-0 z-20 flex h-full w-[340px] flex-col border-l bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
            {data.roleLabel || data.assigneeSlug || 'Stage'}
          </span>
          <h3 className="text-sm font-bold text-gray-900">Properties</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {/* Title Template */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Title Template
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            placeholder="Implement {feature_name}"
            value={data.titleTemplate}
            onChange={(e) => onChange({ titleTemplate: e.target.value })}
          />
          <p className="mt-1.5 text-[11px] text-gray-400">
            Use {'{param_name}'} for dynamic parameters
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Initial Status
          </label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ initialStatus: opt.value })}
                className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                  data.initialStatus === opt.value
                    ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Runtime & Retries row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <Clock className="h-3 w-3" />
              Max Runtime (s)
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              placeholder="3600"
              value={data.maxRuntime ?? ''}
              onChange={(e) =>
                onChange({ maxRuntime: e.target.value ? parseInt(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <RotateCcw className="h-3 w-3" />
              Max Retries
            </label>
            <input
              type="number"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
              value={data.maxRetries}
              onChange={(e) => onChange({ maxRetries: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Tag className="h-3 w-3" />
            Skills
          </label>
          <input
            type="text"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            placeholder="react, typescript, testing"
            value={data.skills.join(', ')}
            onChange={(e) =>
              onChange({
                skills: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
          />
        </div>

        {/* Goal Mode */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-gray-700">Goal Mode</span>
          </div>
          <button
            type="button"
            onClick={() => onChange({ goalMode: !data.goalMode })}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              data.goalMode ? 'bg-indigo-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                data.goalMode ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-5 py-4">
        <button
          type="button"
          onClick={onDelete}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete Stage
        </button>
      </div>
    </div>
  );
}