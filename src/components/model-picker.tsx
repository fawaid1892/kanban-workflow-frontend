'use client';

import React from 'react';

const MODELS: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-haiku-3-5',
  ],
  deepseek: ['deepseek-v3', 'deepseek-v2', 'deepseek-coder'],
  openrouter: [
    'openai/gpt-4o',
    'anthropic/claude-sonnet-4',
    'google/gemini-pro',
  ],
  custom: [],
};

const PROVIDERS = ['openai', 'anthropic', 'deepseek', 'openrouter', 'custom'];

export interface ModelPickerProps {
  provider: string;
  modelName: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (modelName: string) => void;
}

export function ModelPicker({
  provider,
  modelName,
  onProviderChange,
  onModelChange,
}: ModelPickerProps) {
  const normalizedProvider = PROVIDERS.includes(provider) ? provider : 'custom';
  const models = MODELS[normalizedProvider] ?? MODELS.custom;
  const isCustom = normalizedProvider === 'custom';

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value;
    onProviderChange(newProvider);
    // Auto-select first model for the new provider
    const newModels = MODELS[newProvider] ?? [];
    if (newModels.length > 0) {
      onModelChange(newModels[0]);
    } else {
      onModelChange('');
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Provider
        </label>
        <select
          value={normalizedProvider}
          onChange={handleProviderChange}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Model Name
        </label>
        {isCustom || models.length === 0 ? (
          <input
            type="text"
            value={modelName}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="e.g. gpt-4"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <select
            value={modelName}
            onChange={(e) => onModelChange(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

// Also export MODELS so other components can reference the list
export { MODELS, PROVIDERS };
