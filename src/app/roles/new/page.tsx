'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
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
import { createRole } from '@/lib/role-api';
import type { RoleFormData } from '@/types/role';

interface FormErrors {
  slug?: string;
  name?: string;
  description?: string;
}

const SANDBOX_NETWORKS = ['none', 'bridge'] as const;

export default function NewRolePage() {
  const router = useRouter();

  const [form, setForm] = useState<RoleFormData>({
    slug: '',
    name: '',
    description: '',
    color: '#6366f1',
    sandboxImage: '',
    sandboxNetwork: 'none',
    sandboxMemory: '',
    sandboxCpu: '',
    modelMode: 'shared',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createRole(form),
    onSuccess: () => {
      setToast({ message: 'Role created successfully', type: 'success' });
      setTimeout(() => router.push('/roles'), 500);
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to create role', type: 'error' });
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
    if (validate()) {
      createMutation.mutate();
    }
  };

  const updateField = <K extends keyof RoleFormData>(
    key: K,
    value: RoleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      {/* Back link */}
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
              Create Role
            </h1>
            <p className="text-sm text-gray-500">
              Define a new agent role with sandbox configuration
            </p>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* ── Basic info ── */}
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

            {/* ── Description ── */}
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

            {/* ── Color picker ── */}
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

            {/* ── Sandbox config ── */}
            <fieldset className="rounded-lg border border-gray-200 p-4">
              <legend className="px-2 text-sm font-semibold text-gray-700">
                Sandbox Configuration
              </legend>
              <div className="space-y-4">
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
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Memory"
                    placeholder="e.g. 512m"
                    value={form.sandboxMemory}
                    onChange={(e) =>
                      updateField('sandboxMemory', e.target.value)
                    }
                  />
                  <Input
                    label="CPU"
                    placeholder="e.g. 1.0"
                    value={form.sandboxCpu}
                    onChange={(e) => updateField('sandboxCpu', e.target.value)}
                  />
                </div>
              </div>
            </fieldset>
          </CardContent>

          <CardFooter className="justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/roles')}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Role
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
