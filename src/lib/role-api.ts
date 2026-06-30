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
