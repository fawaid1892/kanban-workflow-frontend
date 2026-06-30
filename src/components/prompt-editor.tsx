'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

export interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function PromptEditor({
  value,
  onChange,
  placeholder = '',
}: PromptEditorProps) {
  const charCount = value.length;

  const handleReset = () => {
    onChange('');
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          System Prompt
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={!value}
        >
          Reset to default
        </Button>
      </div>
      <textarea
        className="block w-full min-h-[120px] resize-y rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
        rows={6}
        placeholder={placeholder || '(empty — will use default)'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 text-xs text-gray-400 text-right">
        {charCount} character{charCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
