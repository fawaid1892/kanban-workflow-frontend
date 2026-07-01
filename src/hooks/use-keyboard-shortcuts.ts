'use client';

import { useEffect } from 'react';

interface Shortcuts {
  onSave?: () => void;
  onRun?: () => void;
}

export function useKeyboardShortcuts({ onSave, onRun }: Shortcuts) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        onRun?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave, onRun]);
}
