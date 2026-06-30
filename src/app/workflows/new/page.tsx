'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { createWorkflow } from '@/lib/workflow-api';
import { fetchRoles } from '@/lib/role-api';

/* ─── Stage form data (local-only) ─── */

interface StageForm {
  id: string;
  titleTemplate: string;
  assigneeId: string;
  initialStatus: string;
  maxRuntime: number;
  maxRetries: number;
  skills: string[];
  goalMode: boolean;
  parentIds: string[];
}

let stageIdCounter = 0;
function nextStageId(): string {
  stageIdCounter += 1;
  return `stage-${stageIdCounter}`;
}

function newStageForm(): StageForm {
  return {
    id: nextStageId(),
    titleTemplate: '',
    assigneeId: '',
    initialStatus: 'todo',
    maxRuntime: 300,
    maxRetries: 3,
    skills: [],
    goalMode: false,
    parentIds: [],
  };
}

/* ─── ASCII dependency preview ─── */

function buildDepPreview(stages: StageForm[]): string[] {
  if (stages.length === 0) return ['(No stages defined)'];
  const lines: string[] = [];
  stages.forEach((stage, i) => {
    const indent = stage.parentIds.length > 0 ? '  ' : '';
    const prefix = stage.parentIds.length > 0 ? '└─ ' : '';
    const deps =
      stage.parentIds.length > 0
        ? ` [depends on: ${stage.parentIds
            .map((pid) => {
              const found = stages.find((s) => s.id === pid);
              return found ? `"${found.titleTemplate || 'untitled'}"` : '?';
            })
            .join(', ')}]`
        : '';
    lines.push(
      `${indent}${prefix}Stage ${i + 1}: "${stage.titleTemplate || 'untitled'}"${deps}`,
    );
  });
  return lines;
}

/* ─── Skills input sub-component ─── */

function SkillsInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [input, setInput] = useState('');

  const addSkill = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput('');
  };

  const removeSkill = (skill: string) => {
    onChange(value.filter((s) => s !== skill));
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Skills
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Add a skill..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addSkill();
            }
          }}
        />
        <Button type="button" variant="outline" size="sm" onClick={addSkill}>
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-indigo-400 hover:text-indigo-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Parent Picker (S5-08) ─── */

function ParentPicker({
  currentStageId,
  allStages,
  selectedParentIds,
  onChange,
}: {
  currentStageId: string;
  allStages: StageForm[];
  selectedParentIds: string[];
  onChange: (ids: string[]) => void;
}) {
  // Show only stages above this one (by order in the array)
  const currentIndex = allStages.findIndex((s) => s.id === currentStageId);
  const candidates = allStages.slice(0, currentIndex);

  const toggle = (id: string) => {
    if (selectedParentIds.includes(id)) {
      onChange(selectedParentIds.filter((pid) => pid !== id));
    } else {
      onChange([...selectedParentIds, id]);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-sm text-gray-400 italic">
        No preceding stages to depend on
      </div>
    );
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        Parent Stages
      </label>
      <div className="space-y-1.5">
        {candidates.map((candidate) => (
          <label
            key={candidate.id}
            className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
          >
            <input
              type="checkbox"
              checked={selectedParentIds.includes(candidate.id)}
              onChange={() => toggle(candidate.id)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            {candidate.titleTemplate || '(untitled)'}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ─── Main page ─── */

export default function NewWorkflowPage() {
  const router = useRouter();

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stages, setStages] = useState<StageForm[]>([newStageForm()]);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Fetch roles for assignee dropdown
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  const createMutation = useMutation({
    mutationFn: () => createWorkflow({ name, description }),
    onSuccess: (workflow) => {
      setToast({
        message: 'Workflow created successfully',
        type: 'success',
      });
      setTimeout(() => router.push(`/workflows/${workflow.id}`), 500);
    },
    onError: (err: Error) => {
      setToast({
        message: err.message || 'Failed to create workflow',
        type: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    createMutation.mutate();
  };

  // Stage management
  const addStage = useCallback(() => {
    setStages((prev) => [...prev, newStageForm()]);
  }, []);

  const removeStage = useCallback((id: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      // Clean up parent references to removed stage
      return filtered.map((s) => ({
        ...s,
        parentIds: s.parentIds.filter((pid) => pid !== id),
      }));
    });
  }, []);

  const updateStage = useCallback(
    (id: string, patch: Partial<StageForm>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [],
  );

  // Template preview (S5-09)
  const previewLines = useMemo(() => buildDepPreview(stages), [stages]);

  const canSubmit = name.trim() && description.trim() && !createMutation.isPending;

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.push('/workflows')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to workflows
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left side: form + stages */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Workflow details ── */}
          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <h1 className="text-xl font-semibold text-gray-900">
                  Create Workflow
                </h1>
                <p className="text-sm text-gray-500">
                  Define a new workflow template with stages and dependencies
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Workflow Name"
                  placeholder="e.g. Feature Implementation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Describe what this workflow does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/workflows')}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={createMutation.isPending}
                  disabled={!canSubmit}
                >
                  Create Workflow
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* ── Stage Builder Panel (S5-07) ── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Stages
                  </h2>
                  <p className="text-sm text-gray-500">
                    Define the steps in this workflow
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {stages.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                  No stages defined yet. Click &ldquo;Add Stage&rdquo; below.
                </p>
              )}

              {stages.map((stage, index) => (
                <Card key={stage.id} className="border-2 border-dashed border-gray-200">
                  <CardContent className="space-y-4 pt-4">
                    {/* Stage header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">
                          Stage {index + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete stage ${index + 1}`}
                        onClick={() => removeStage(stage.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    {/* Title Template */}
                    <Input
                      label="Title Template"
                      placeholder="Implement backend {featureName}"
                      value={stage.titleTemplate}
                      onChange={(e) =>
                        updateStage(stage.id, {
                          titleTemplate: e.target.value,
                        })
                      }
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Assignee */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Assignee
                        </label>
                        <select
                          value={stage.assigneeId}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              assigneeId: e.target.value,
                            })
                          }
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Auto-assign</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Initial Status */}
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Initial Status
                        </label>
                        <select
                          value={stage.initialStatus}
                          onChange={(e) =>
                            updateStage(stage.id, {
                              initialStatus: e.target.value,
                            })
                          }
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="todo">Todo</option>
                          <option value="triage">Triage</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Max Runtime */}
                      <Input
                        label="Max Runtime (seconds)"
                        type="number"
                        min={0}
                        placeholder="300"
                        value={String(stage.maxRuntime)}
                        onChange={(e) =>
                          updateStage(stage.id, {
                            maxRuntime: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />

                      {/* Max Retries */}
                      <Input
                        label="Max Retries"
                        type="number"
                        min={0}
                        placeholder="3"
                        value={String(stage.maxRetries)}
                        onChange={(e) =>
                          updateStage(stage.id, {
                            maxRetries: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>

                    {/* Skills */}
                    <SkillsInput
                      value={stage.skills}
                      onChange={(skills) =>
                        updateStage(stage.id, { skills })
                      }
                    />

                    {/* Goal Mode Toggle */}
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700">
                        Goal Mode
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateStage(stage.id, {
                            goalMode: !stage.goalMode,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                          stage.goalMode
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {stage.goalMode ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {stage.goalMode ? 'On' : 'Off'}
                      </button>
                    </div>

                    {/* Parent Picker (S5-08) */}
                    <ParentPicker
                      currentStageId={stage.id}
                      allStages={stages}
                      selectedParentIds={stage.parentIds}
                      onChange={(parentIds) =>
                        updateStage(stage.id, { parentIds })
                      }
                    />
                  </CardContent>
                </Card>
              ))}

              {/* Add Stage button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={addStage}
              >
                <Plus className="h-4 w-4" />
                Add Stage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Template Preview Panel (S5-09) ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900">
                  Template Preview
                </h2>
                <p className="text-sm text-gray-500">
                  Stage dependency tree
                </p>
              </CardHeader>
              <CardContent>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 font-mono text-xs leading-relaxed text-gray-700">
                  {previewLines.join('\n')}
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
