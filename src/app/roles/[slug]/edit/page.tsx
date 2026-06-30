'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { fetchRole, updateRole } from '@/lib/role-api';
import type { RoleFormData } from '@/types/role';

interface FormErrors {
  slug?: string;
  name?: string;
  description?: string;
}

const SANDBOX_NETWORKS = ['none', 'bridge'] as const;

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

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

  // ── Fetch role data ──
  const {
    data: role,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['role', slug],
    queryFn: () => fetchRole(slug),
    enabled: !!slug,
  });

  // Pre-populate form when data arrives
  useEffect(() => {
    if (role) {
      setForm({
        slug: role.slug,
        name: role.name,
        description: role.description,
        color: role.color,
        sandboxImage: role.sandboxImage,
        sandboxNetwork: role.sandboxNetwork,
        sandboxMemory: role.sandboxMemory,
        sandboxCpu: role.sandboxCpu,
        modelMode: role.modelMode,
      });
    }
  }, [role]);

  // ── Update mutation ──
  const updateMutation = useMutation({
    mutationFn: () => updateRole(slug, form),
    onSuccess: () => {
      setToast({ message: 'Role updated successfully', type: 'success' });
      setTimeout(() => router.push('/roles'), 500);
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to update role', type: 'error' });
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
      updateMutation.mutate();
    }
  };

  const updateField = <K extends keyof RoleFormData>(
    key: K,
    value: RoleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
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
            <div className="h-20 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  // ── 404 / Error handling ──
  if (isError) {
    const is404 =
      error instanceof Error &&
      (error.message.toLowerCase().includes('not found') ||
        error.message.toLowerCase().includes('404'));

    return (
      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <button
          type="button"
          onClick={() => router.push('/roles')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roles
        </button>
        <Card>
          <CardContent className="py-12 text-center">
            {is404 ? (
              <>
                <p className="text-lg font-medium text-gray-900">
                  Role not found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  The role &lsquo;{slug}&rsquo; does not exist or has been
                  deleted.
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-red-600">
                  Failed to load role
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {error instanceof Error
                    ? error.message
                    : 'An unexpected error occurred'}
                </p>
              </>
            )}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/roles')}
            >
              Go to roles list
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
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
              Edit Role
            </h1>
            <p className="text-sm text-gray-500">
              Update the configuration for role &lsquo;{slug}&rsquo;
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
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={updateMutation.isPending}>
              Save Changes
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
