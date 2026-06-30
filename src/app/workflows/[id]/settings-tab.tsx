'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Eye, EyeOff } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { fetchWorkflowSettings, updateWorkflowSettings } from '@/lib/workflow-api';

const SCHEMAS = [
  { value: 'chat-completions', label: 'Chat Completions (OpenAI)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'custom', label: 'Custom' },
];

export default function WorkflowSettingsTab({ workflowId }: { workflowId: string }) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['workflow-settings', workflowId],
    queryFn: () => fetchWorkflowSettings(workflowId),
    enabled: !!workflowId,
  });

  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [chatSchema, setChatSchema] = useState('chat-completions');

  useEffect(() => {
    if (settings) {
      setBaseUrl(settings.baseUrl);
      setChatSchema(settings.chatSchema);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => updateWorkflowSettings(workflowId, { baseUrl, apiKey, chatSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-settings', workflowId] });
      setToast({ message: 'Settings saved!', type: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-1 text-base font-bold text-gray-900">Workflow Settings</h2>
      <p className="mb-6 text-xs text-gray-500">Configure the LLM provider for this workflow</p>

      {/* Base URL */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Base URL</label>
        <input
          type="text"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
          placeholder="https://api.openai.com/v1"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
        />
      </div>

      {/* API Key */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">API Key</label>
        <div className="relative">
          <input
            type={showApiKey ? 'text' : 'password'}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {settings?.apiKeyMasked && (
          <p className="mt-1 text-[11px] text-gray-400">Current: {settings.apiKeyMasked}</p>
        )}
      </div>

      {/* Chat Schema */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Chat Schema</label>
        <div className="flex gap-2">
          {SCHEMAS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setChatSchema(s.value)}
              className={`flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                chatSchema === s.value
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50"
      >
        <Save className="h-4 w-4" />
        {saveMutation.isPending ? 'Saving...' : 'Save Settings'}
      </button>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
