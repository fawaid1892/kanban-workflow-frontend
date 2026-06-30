'use client';

import React from 'react';
import { Plus, Code2, Palette, ShieldCheck, TestTube, Rocket } from 'lucide-react';

export interface RoleTemplate {
  slug: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  ringColor: string;
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
    ringColor: 'ring-blue-400',
    skills: ['go', 'node', 'postgres'],
  },
  {
    slug: 'frontend',
    label: 'Frontend',
    description: 'UI, components, interactions',
    icon: Palette,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    ringColor: 'ring-violet-400',
    skills: ['react', 'typescript', 'tailwind'],
  },
  {
    slug: 'qa',
    label: 'QA',
    description: 'Testing, bug hunting, quality',
    icon: TestTube,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    ringColor: 'ring-emerald-400',
    skills: ['playwright', 'cypress', 'testing'],
  },
  {
    slug: 'cybersecurity',
    label: 'Security',
    description: 'Audit, hardening, review',
    icon: ShieldCheck,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    ringColor: 'ring-rose-400',
    skills: ['security', 'audit', 'pentest'],
  },
  {
    slug: 'devops',
    label: 'DevOps',
    description: 'Deploy, CI/CD, infrastructure',
    icon: Rocket,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    ringColor: 'ring-amber-400',
    skills: ['docker', 'cicd', 'infra'],
  },
];

interface Props {
  onSelect: (role: RoleTemplate) => void;
  onClose: () => void;
}

export function RolePicker({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900">Add Stage</h3>
          <p className="mt-1 text-sm text-gray-500">
            Pick a role for this stage — each role has default skills &amp; configuration
          </p>
        </div>

        <div className="space-y-2">
          {ROLE_TEMPLATES.map((role) => {
            const Icon = role.icon;
            return (
              <button
                key={role.slug}
                type="button"
                onClick={() => onSelect(role)}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 text-left transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.bgColor} ${role.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{role.label}</p>
                  <p className="text-xs text-gray-500">{role.description}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <Plus className="h-4 w-4 flex-shrink-0 text-gray-300" />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}