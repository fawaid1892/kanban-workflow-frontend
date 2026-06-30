'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Settings, Cpu, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SandboxLogs } from '@/components/sandbox-logs';
import { ModelPicker } from '@/components/model-picker';
import { PromptEditor } from '@/components/prompt-editor';
import {
  fetchRole,
  updateRole,
  triggerSandboxBuild,
  fetchModelConfig,
  updateModelConfig,
} from '@/lib/role-api';
import type { RoleFormData } from '@/types/role';
import type { ModelConfigPayload } from '@/lib/role-api';

type TabId = 'general' | 'sandbox' | 'model';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'general', label: 'General', icon: <Settings className="h-4 w-4" /> },
  { id: 'sandbox', label: 'Sandbox', icon: <Box className="h-4 w-4" /> },
  { id: 'model', label: 'Model', icon: <Cpu className="h-4 w-4" /> },
];

interface FormErrors {
  slug?: string;
  name?: string;
  description?: string;
}

const SANDBOX_NETWORKS = ['none', 'bridge'] as const;

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [form, setForm] = useState<RoleFormData>({
    slug: '',
    name: '',
    description: '',
    color: '#6366f1',
    sandboxImage: '',
    sandboxNetwork: 'none',
    sandboxMemory: '',
    sandboxCpu: '',
    sandboxTimeout: undefined,
    preCacheDeps: false,
    modelMode: 'shared',
    modelProvider: '',
    modelName: '',
    modelTemperature: undefined,
    modelMaxTokens: undefined,
    modelSystemPrompt: '',
    modelMaxTurns: undefined,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Track build state
  const [buildStatus, setBuildStatus] = useState<
    'idle' | 'building' | 'success' | 'failed'
  >('idle');

  // ── Fetch role data ──
  const {
    data: role,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['role', slug],
    queryFn: () => fetchRole(slug),
    enabled: !!slug,
  });

  // ── Fetch model config (separate endpoint) ──
  const { data: modelConfig } = useQuery({
    queryKey: ['role-model-config', slug],
    queryFn: () => fetchModelConfig(slug),
    enabled: !!slug && activeTab === 'model',
  });

  // Pre-populate form when data arrives
  useEffect(() => {
    if (role) {
      setForm((prev) => ({
        ...prev,
        slug: role.slug,
        name: role.name,
        description: role.description,
        color: role.color ?? '#6366f1',
        sandboxImage: role.sandboxImage ?? '',
        sandboxNetwork: role.sandboxNetwork ?? 'none',
        sandboxMemory: role.sandboxMemory ?? '',
        sandboxCpu: role.sandboxCpu ?? '',
        sandboxTimeout: role.sandboxTimeout,
        preCacheDeps: role.preCacheDeps ?? false,
        modelMode: role.modelMode ?? 'shared',
        modelProvider: role.modelProvider ?? '',
        modelName: role.modelName ?? '',
        modelTemperature: role.modelTemperature,
        modelMaxTokens: role.modelMaxTokens,
        modelSystemPrompt: role.modelSystemPrompt ?? '',
        modelMaxTurns: role.modelMaxTurns,
      }));
    }
  }, [role]);

  // Pre-populate model fields from dedicated endpoint
  useEffect(() => {
    if (modelConfig) {
      setForm((prev) => ({
        ...prev,
        modelMode: modelConfig.mode,
        modelProvider: modelConfig.provider,
        modelName: modelConfig.name,
        modelTemperature: modelConfig.temperature,
        modelMaxTokens: modelConfig.maxTokens,
        modelSystemPrompt: modelConfig.systemPrompt ?? '',
        modelMaxTurns: modelConfig.maxTurns,
      }));
    }
  }, [modelConfig]);

  // ── Update mutation (general / sandbox) ──
  const updateMutation = useMutation({
    mutationFn: () => updateRole(slug, form),
    onSuccess: () => {
      setToast({ message: 'Role updated successfully', type: 'success' });
      setTimeout(() => router.push('/roles'), 500);
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to update role', type: 'error' });
    },
  });

  // ── Model config mutation ──
  const modelMutation = useMutation({
    mutationFn: (payload: ModelConfigPayload) => updateModelConfig(slug, payload),
    onSuccess: () => {
      setToast({ message: 'Model config saved successfully', type: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to save model config', type: 'error' });
    },
  });

  // ── Build mutation ──
  const buildMutation = useMutation({
    mutationFn: () => triggerSandboxBuild(slug),
    onSuccess: () => {
      setBuildStatus('building');
      setToast({ message: 'Build started', type: 'success' });
    },
    onError: (err: Error) => {
      setBuildStatus('failed');
      setToast({ message: err.message || 'Build failed to start', type: 'error' });
    },
  });

  // ── Validation ──
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug.trim())) {
      newErrors.slug = 'Slug must be alphanumeric with dashes only (e.g. my-role)';
    }

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'model') {
      const payload: ModelConfigPayload = {
        mode: form.modelMode,
        provider: form.modelProvider ?? '',
        name: form.modelName ?? '',
        temperature: form.modelTemperature,
        maxTokens: form.modelMaxTokens,
        systemPrompt: form.modelSystemPrompt,
        maxTurns: form.modelMaxTurns,
      };
      modelMutation.mutate(payload);
    } else if (validate()) {
      updateMutation.mutate();
    }
  };

  const updateField = <K extends keyof RoleFormData>(
    key: K,
    value: RoleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleBuild = () => {
    buildMutation.mutate();
  };

  const isPending =
    updateMutation.isPending || modelMutation.isPending || buildMutation.isPending;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <div className="mb-4 h-5 w-24 animate-pulse rounded bg-gray-200" />
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-6 h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
            <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── 404 / Error handling ──
  if (isError) {
    const is404 =
      error instanceof Error &&
      (error.message.toLowerCase().includes('not found') ||
        error.message.toLowerCase().includes('404'));

    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => router.push('/roles')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </button>
        <Card>
          <CardContent className="py-12 text-center">
            {is404 ? (
              <>
                <p className="text-lg font-medium text-gray-900">
                  Role not found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  The role &lsquo;{slug}&rsquo; does not exist or has been
                  deleted.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-red-600">
                  Failed to load role
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'}
                </p>
              </>
            )}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/roles')}
            >
              Go to roles list
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <button
        type="button"
        onClick={() => router.push('/roles')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to roles
      </button>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <h1 className="text-xl font-semibold text-gray-900">
              Edit Role
            </h1>
            <p className="text-sm text-gray-500">
              Update the configuration for role &lsquo;{slug}&rsquo;
            </p>
          </CardHeader>

          {/* ── Tab Navigation ── */}
          <div className="border-b border-gray-200 px-6">
            <nav className="-mb-px flex gap-6" aria-label="Tabs">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 border-b-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ─── Tab Content ─── */}
          <CardContent className="space-y-5">
            {/* ========== GENERAL TAB ========== */}
            {activeTab === 'general' && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Slug"
                    placeholder="my-agent-role"
                    value={form.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    error={errors.slug}
                  />
                  <Input
                    label="Name"
                    placeholder="My Agent Role"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    error={errors.name}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    placeholder="Describe what this role does..."
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    aria-invalid={!!errors.description}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => updateField('color', e.target.value)}
                      className="h-10 w-10 cursor-pointer rounded-md border border-gray-300 bg-transparent p-0.5"
                    />
                    <span
                      className="inline-block h-6 w-6 rounded-full border"
                      style={{ backgroundColor: form.color }}
                    />
                    <span className="text-sm text-gray-500">{form.color}</span>
                  </div>
                </div>
              </>
            )}

            {/* ========== SANDBOX TAB ========== */}
            {activeTab === 'sandbox' && (
              <>
                <Input
                  label="Image"
                  placeholder="e.g. python:3.11-slim"
                  value={form.sandboxImage}
                  onChange={(e) => updateField('sandboxImage', e.target.value)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Network
                    </label>
                    <select
                      value={form.sandboxNetwork}
                      onChange={(e) =>
                        updateField('sandboxNetwork', e.target.value)
                      }
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {SANDBOX_NETWORKS.map((n) => (
                        <option key={n} value={n}>
                          {n.charAt(0).toUpperCase() + n.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    label="Memory"
                    placeholder="512m"
                    value={form.sandboxMemory}
                    onChange={(e) =>
                      updateField('sandboxMemory', e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="CPU"
                    placeholder="0.5"
                    value={form.sandboxCpu}
                    onChange={(e) => updateField('sandboxCpu', e.target.value)}
                  />
                  <Input
                    label="Timeout (seconds)"
                    type="number"
                    placeholder="60"
                    value={form.sandboxTimeout ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField(
                        'sandboxTimeout',
                        val === '' ? undefined : Number(val),
                      );
                    }}
                  />
                </div>

                {/* Pre-cache deps toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={!!form.preCacheDeps}
                    onClick={() =>
                      updateField('preCacheDeps', !form.preCacheDeps)
                    }
                    className={cn(
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                      form.preCacheDeps
                        ? 'bg-indigo-600'
                        : 'bg-gray-200',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-4 w-4 translate-y-0 transform rounded-full bg-white shadow ring-0 transition-transform',
                        form.preCacheDeps ? 'translate-x-4' : 'translate-x-0',
                      )}
                    />
                  </button>
                  <label
                    className="text-sm font-medium text-gray-700"
                    onClick={() =>
                      updateField('preCacheDeps', !form.preCacheDeps)
                    }
                  >
                    Pre-cache dependencies
                  </label>
                </div>

                {/* Build section */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Image Build
                    </h3>
                    <div className="flex items-center gap-2">
                      {buildStatus === 'building' && (
                        <Badge variant="warning">
                          <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
                          Building
                        </Badge>
                      )}
                      {buildStatus === 'success' && (
                        <Badge variant="success">Success</Badge>
                      )}
                      {buildStatus === 'failed' && (
                        <Badge variant="error">Failed</Badge>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleBuild}
                        loading={buildMutation.isPending}
                        disabled={buildMutation.isPending}
                      >
                        {buildMutation.isPending ? 'Starting...' : 'Build Image'}
                      </Button>
                    </div>
                  </div>

                  <SandboxLogs
                    slug={slug}
                    key={slug}
                  />
                </div>
              </>
            )}

            {/* ========== MODEL TAB ========== */}
            {activeTab === 'model' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Model Mode
                  </label>
                  <select
                    value={form.modelMode}
                    onChange={(e) =>
                      updateField(
                        'modelMode',
                        e.target.value as 'shared' | 'dedicated',
                      )
                    }
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="shared">Shared</option>
                    <option value="dedicated">Dedicated</option>
                  </select>
                </div>

                <ModelPicker
                  provider={form.modelProvider ?? ''}
                  modelName={form.modelName ?? ''}
                  onProviderChange={(p: string) => updateField('modelProvider', p)}
                  onModelChange={(m: string) => updateField('modelName', m)}
                />

                {/* Temperature slider */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Temperature: {form.modelTemperature ?? 0.7}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={form.modelTemperature ?? 0.7}
                    onChange={(e) =>
                      updateField(
                        'modelTemperature',
                        Number(e.target.value),
                      )
                    }
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>0</span>
                    <span>2</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Max Tokens"
                    type="number"
                    placeholder="4096"
                    value={form.modelMaxTokens ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField(
                        'modelMaxTokens',
                        val === '' ? undefined : Number(val),
                      );
                    }}
                  />
                  <Input
                    label="Max Turns"
                    type="number"
                    placeholder="10"
                    value={form.modelMaxTurns ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateField(
                        'modelMaxTurns',
                        val === '' ? undefined : Number(val),
                      );
                    }}
                  />
                </div>

                <PromptEditor
                  value={form.modelSystemPrompt ?? ''}
                  onChange={(v: string) => updateField('modelSystemPrompt', v)}
                  placeholder="Leave empty to use default system prompt"
                />
              </>
            )}
          </CardContent>

          <CardFooter className="justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/roles')}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {activeTab === 'model' ? 'Save Model Config' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>

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
