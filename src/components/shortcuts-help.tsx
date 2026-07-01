'use client';

import React, { useState, useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'S'], description: 'Save (Edit tab)' },
  { keys: ['Ctrl', 'R'], description: 'Run workflow (Run tab)' },
  { keys: ['Ctrl', 'K'], description: 'Focus search' },
  { keys: ['?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close modal / overlay' },
];

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          {SHORTCUTS.map((s) => (
            <div key={s.description} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">{s.description}</span>
              <div className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-[11px] font-mono font-semibold text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-gray-400 dark:text-gray-500">Press <kbd className="rounded border bg-gray-100 px-1 text-[10px] dark:bg-gray-700">?</kbd> to toggle</p>
      </div>
    </div>
  );
}
