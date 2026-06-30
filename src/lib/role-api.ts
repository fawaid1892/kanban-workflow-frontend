import api from './api';
import type { Role, CreateRolePayload, UpdateRolePayload } from '@/types/role';

export async function fetchRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>('/roles');
  return response.data;
}

export async function fetchRole(slug: string): Promise<Role> {
  const response = await api.get<Role>(`/roles/${slug}`);
  return response.data;
}

export async function createRole(payload: CreateRolePayload): Promise<Role> {
  const response = await api.post<Role>('/roles', payload);
  return response.data;
}

export async function updateRole(
  slug: string,
  payload: UpdateRolePayload,
): Promise<Role> {
  const response = await api.put<Role>(`/roles/${slug}`, payload);
  return response.data;
}

export async function deleteRole(slug: string): Promise<void> {
  await api.delete(`/roles/${slug}`);
}

// ── Sandbox build ──

export interface SandboxBuildLog {
  id: string;
  status: 'building' | 'success' | 'failed';
  output: string;
  startedAt: string;
  finishedAt?: string;
}

export async function triggerSandboxBuild(slug: string): Promise<{ message: string }> {
  const response = await api.post(`/roles/${slug}/sandbox/build`);
  return response.data;
}

export async function fetchSandboxBuildLogs(slug: string): Promise<SandboxBuildLog> {
  const response = await api.get<SandboxBuildLog>(`/roles/${slug}/sandbox/logs`);
  return response.data;
}
