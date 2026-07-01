'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Send, Eye, EyeOff } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { fetchWebhook, updateWebhook } from '@/lib/workflow-api';

const EVENTS = [
  { key: 'run.completed', label: 'Run Completed' },
  { key: 'run.failed', label: 'Run Failed' },
];

export default function WorkflowWebhookTab({ workflowId }: { workflowId: string }) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [events, setEvents] = useState<string[]>(['run.completed', 'run.failed']);
  const [isActive, setIsActive] = useState(true);

  const { data: config } = useQuery({
    queryKey: ['webhook', workflowId],
    queryFn: () => fetchWebhook(workflowId),
    enabled: !!workflowId,
  });

  useEffect(() => {
    if (config) {
      setUrl(config.url);
      setEvents(config.events);
      setIsActive(config.isActive);
    }
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: () => updateWebhook(workflowId, { url, secret: secret || undefined, events, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook', workflowId] });
      setToast({ message: 'Webhook saved!', type: 'success' });
      setSecret('');
    },
    onError: (err: Error) => setToast({ message: err.message, type: 'error' }),
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/workflows/${workflowId}/webhook/test`, { method: 'POST' });
      return res.json();
    },
    onSuccess: () => setToast({ message: 'Test webhook sent!', type: 'success' }),
    onError: () => setToast({ message: 'Test webhook failed', type: 'error' }),
  });

  return (
    <div className="mx-auto max-w-xl p-6">
      <h2 className="mb-1 text-base font-bold text-gray-900 dark:text-gray-100">Webhook Configuration</h2>
      <p className="mb-6 text-xs text-gray-500 dark:text-gray-400">Get notified when runs complete or fail</p>

      {/* Active toggle */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Active</label>
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative h-6 w-11 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isActive ? 'left-5.5 translate-x-0' : 'left-0.5'}`} />
        </button>
      </div>

      {/* URL */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Webhook URL</label>
        <input
          type="url"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          placeholder="https://hooks.slack.com/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* Secret */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Secret (optional)</label>
        <div className="relative">
          <input
            type={showSecret ? 'text' : 'password'}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            placeholder="whsec_..."
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
          />
          <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Events */}
      <div className="mb-6">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Events</label>
        <div className="flex gap-3">
          {EVENTS.map((e) => (
            <label key={e.key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={events.includes(e.key)}
                onChange={(ev) => setEvents(ev.target.checked ? [...events, e.key] : events.filter((x) => x !== e.key))}
                className="rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
              />
              {e.label}
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !url.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending || !config}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
        >
          <Send className="h-4 w-4" />
          {testMutation.isPending ? 'Sending...' : 'Test'}
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
