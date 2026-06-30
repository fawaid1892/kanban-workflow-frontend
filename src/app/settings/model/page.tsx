'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Toast } from '@/components/ui/toast';
import { ModelPicker } from '@/components/model-picker';
import api from '@/lib/api';

interface SettingsModelConfig {
  provider: string;
  name: string;
  apiKey: string;
  temperature: number;
  maxTokens: number;
}

export default function SettingsModelPage() {
  const router = useRouter();
  const [form, setForm] = useState<SettingsModelConfig>({
    provider: 'openai',
    name: 'gpt-4o',
    apiKey: '',
    temperature: 0.7,
    maxTokens: 4096,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // ── Fetch current settings ──
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings-model'],
    queryFn: async () => {
      const response = await api.get<SettingsModelConfig>('/settings/model');
      return response.data;
    },
  });

  // Sync fetched data into form
  useEffect(() => {
    if (settingsData) {
      setForm(settingsData);
    }
  }, [settingsData]);

  // ── Save mutation ──
  const saveMutation = useMutation({
    mutationFn: async (payload: SettingsModelConfig) => {
      const response = await api.put('/settings/model', payload);
      return response.data;
    },
    onSuccess: () => {
      setToast({
        message: 'Model settings saved successfully',
        type: 'success',
      });
    },
    onError: (err: Error) => {
      setToast({
        message: err.message || 'Failed to save settings',
        type: 'error',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  const updateField = <K extends keyof SettingsModelConfig>(
    key: K,
    value: SettingsModelConfig[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
            <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <button
        type="button"
        onClick={() => router.push('/')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <h1 className="text-xl font-semibold text-gray-900">
              Model Settings
            </h1>
            <p className="text-sm text-gray-500">
              Configure the default LLM model used across your workspace
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            <ModelPicker
              provider={form.provider}
              modelName={form.name}
              onProviderChange={(p) => updateField('provider', p)}
              onModelChange={(m) => updateField('name', m)}
            />

            <Input
              label="API Key"
              type="password"
              placeholder="sk-..."
              value={form.apiKey}
              onChange={(e) => updateField('apiKey', e.target.value)}
            />

            {/* Temperature slider */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Temperature: {form.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) =>
                  updateField('temperature', Number(e.target.value))
                }
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0</span>
                <span>2</span>
              </div>
            </div>

            <Input
              label="Max Tokens"
              type="number"
              placeholder="4096"
              value={form.maxTokens}
              onChange={(e) =>
                updateField('maxTokens', Number(e.target.value))
              }
            />
          </CardContent>

          <CardFooter className="justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save Settings
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
