'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StageNodeData } from './StageNode';

const ASSIGNEE_OPTIONS = [
  { value: 'backend', label: 'Backend Developer' },
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'qa', label: 'QA Engineer' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'devops', label: 'DevOps' },
];

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
    <div className="absolute right-0 top-0 z-10 h-full w-80 border-l bg-white shadow-lg">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Edit Stage</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto p-4" style={{ maxHeight: 'calc(100vh - 120px)' }}>
        {/* Title Template */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Title Template
          </label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Implement {feature_name}"
            value={data.titleTemplate}
            onChange={(e) => onChange({ titleTemplate: e.target.value })}
          />
          <p className="mt-1 text-[10px] text-gray-400">
            Use {'{param_name}'} for dynamic parameters
          </p>
        </div>

        {/* Assignee */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Assignee
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={data.assigneeSlug}
            onChange={(e) => onChange({ assigneeSlug: e.target.value })}
          >
            <option value="">None</option>
            {ASSIGNEE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Initial Status */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Initial Status
          </label>
          <select
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={data.initialStatus}
            onChange={(e) => onChange({ initialStatus: e.target.value })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Max Runtime */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Max Runtime (seconds)
          </label>
          <input
            type="number"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="3600"
            value={data.maxRuntime ?? ''}
            onChange={(e) =>
              onChange({
                maxRuntime: e.target.value ? parseInt(e.target.value) : null,
              })
            }
          />
        </div>

        {/* Max Retries */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Max Retries
          </label>
          <input
            type="number"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            value={data.maxRetries}
            onChange={(e) =>
              onChange({ maxRetries: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        {/* Skills */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Skills (comma-separated)
          </label>
          <input
            type="text"
            className="w-full rounded-lg border px-3 py-2 text-sm"
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
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="goalMode"
            className="rounded border-gray-300"
            checked={data.goalMode}
            onChange={(e) => onChange({ goalMode: e.target.checked })}
          />
          <label htmlFor="goalMode" className="text-xs font-medium text-gray-700">
            Goal Mode (agent works autonomously)
          </label>
        </div>
      </div>

      {/* Delete button */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-white p-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete Stage
        </Button>
      </div>
    </div>
  );
}
