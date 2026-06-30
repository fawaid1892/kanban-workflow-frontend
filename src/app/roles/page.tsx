'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Palette } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Toast } from '@/components/ui/toast';
import { fetchRoles, deleteRole } from '@/lib/role-api';
import type { Role } from '@/types/role';

export default function RolesPage() {
  const queryClient = useQueryClient();

  // ── Fetch roles ──
  const {
    data: roles,
    isLoading,
    isError,
    error,
  } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: fetchRoles,
  });

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (slug: string) => deleteRole(slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
      setToast({ message: 'Role deleted successfully', type: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Failed to delete role', type: 'error' });
    },
  });

  // ── Helpers ──
  const showToast = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null;

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
          <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="text-lg font-medium text-red-600">Failed to load roles</p>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['roles'] })}
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage agent roles and their sandbox configurations
          </p>
        </div>
        <Link href="/roles/new">
          <Button>
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </Link>
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border bg-white sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Model</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles && roles.length > 0 ? (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {role.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {role.slug}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-gray-600">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-5 w-5 rounded-full border"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="text-xs text-gray-500">{role.color}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        role.modelMode === 'dedicated' ? 'info' : 'default'
                      }
                    >
                      {role.modelMode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/roles/${role.slug}/edit`}>
                        <Button variant="ghost" size="sm" aria-label="Edit role">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Delete role"
                        onClick={() => setDeleteTarget(role)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableEmpty
                colSpan={5}
                message="No roles yet, create your first role"
              />
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 sm:hidden">
        {roles && roles.length > 0 ? (
          roles.map((role) => (
            <div
              key={role.id}
              className="rounded-xl border bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-4 w-4 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{role.name}</p>
                    <p className="text-xs text-gray-400">{role.slug}</p>
                  </div>
                </div>
                <Badge
                  variant={role.modelMode === 'dedicated' ? 'info' : 'default'}
                >
                  {role.modelMode}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                {role.description}
              </p>
              <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                <Link href={`/roles/${role.slug}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(role)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center rounded-xl border bg-white px-6 py-12 text-center">
            <Palette className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">
              No roles yet
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Create your first role to get started
            </p>
            <Link href="/roles/new" className="mt-4">
              <Button>
                <Plus className="h-4 w-4" />
                Create Role
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* ── Delete confirmation modal ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Role"
        size="sm"
      >
        <p className="text-sm text-gray-600">
          Are you sure you want to delete role{' '}
          <span className="font-semibold text-gray-900">
            &lsquo;{deleteTarget?.name}&rsquo;
          </span>
          ? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setDeleteTarget(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={deleteMutation.isPending}
            onClick={() => {
              if (deleteTarget) deleteMutation.mutate(deleteTarget.slug);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* ── Toast notifications ── */}
      {showToast}
    </div>
  );
}
