'use client';

import React, { useState } from 'react';
import { Plus, Code2, Palette, ShieldCheck, TestTube, Rocket, User } from 'lucide-react';

export interface RoleTemplate {
  slug: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  skills: string[];
}

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    slug: 'backend',
    label: 'Backend',
    description: 'Server-side logic, APIs, database',
    icon: Code2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    skills: ['go', 'node', 'postgres'],
  },
  {
    slug: 'frontend',
    label: 'Frontend',
    description: 'UI, components, interactions',
    icon: Palette,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    skills: ['react', 'typescript', 'tailwind'],
  },
  {
    slug: 'qa',
    label: 'QA',
    description: 'Testing, bug hunting, quality',
    icon: TestTube,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    skills: ['playwright', 'cypress', 'testing'],
  },
  {
    slug: 'cybersecurity',
    label: 'Security',
    description: 'Audit, hardening, review',
    icon: ShieldCheck,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    skills: ['security', 'audit', 'pentest'],
  },
  {
    slug: 'devops',
    label: 'DevOps',
    description: 'Deploy, CI/CD, infrastructure',
    icon: Rocket,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    skills: ['docker', 'cicd', 'infra'],
  },
];

interface Props {
  onSelect: (role: { label: string; slug: string; skills: string[] }) => void;
  onClose: () => void;
}

export function RolePicker({ onSelect, onClose }: Props) {
  const [mode, setMode] = useState<'pick' | 'custom'>('pick');
  const [customName, setCustomName] = useState('');

  const handleCustomSubmit = () => {
    const name = customName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!name) return;
    onSelect({ label: customName.trim(), slug: name, skills: [] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Add Stage</h3>
            <p className="mt-1 text-sm text-gray-500">
              Pick a role or create a custom one
            </p>
          </div>
        </div>

        {mode === 'pick' ? (
          <>
            <div className="space-y-2">
              {ROLE_TEMPLATES.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.slug}
                    type="button"
                    onClick={() => onSelect({ label: role.label, slug: role.slug, skills: role.skills })}
                    className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.bgColor} ${role.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{role.label}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
                    <Plus className="h-4 w-4 flex-shrink-0 text-gray-300" />
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMode('custom')}
              className="mt-3 flex w-full items-center gap-4 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-left text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-dashed border-gray-300">
                <User className="h-5 w-5" />
              </div>
              <span className="font-medium">Custom role...</span>
            </button>
          </>
        ) : (
          <div>
            <div className="mb-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Role Name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                placeholder="e.g. product, designer, data-science"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCustomSubmit();
                }}
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setMode('pick')}
              className="mb-3 text-xs text-indigo-500 hover:text-indigo-600"
            >
              ← Back to templates
            </button>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customName.trim()}
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {mode === 'pick' && (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
