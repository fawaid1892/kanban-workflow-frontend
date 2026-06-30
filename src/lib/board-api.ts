import api from './api';
import type { BoardTask, TaskDetail, BoardStats } from '@/types/board';

export interface BoardFilters {
  status?: string;
  assignee?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function fetchBoardTasks(workflowId: string, filters?: BoardFilters): Promise<BoardTask[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignee) params.set('assignee', filters.assignee);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  const qs = params.toString();
  const response = await api.get<BoardTask[]>(`/workflows/${workflowId}/board/tasks${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function fetchTaskDetail(workflowId: string, taskId: string): Promise<TaskDetail> {
  const response = await api.get<TaskDetail>(`/workflows/${workflowId}/board/tasks/${taskId}`);
  return response.data;
}

export async function fetchBoardStats(workflowId: string): Promise<BoardStats> {
  const response = await api.get<BoardStats>(`/workflows/${workflowId}/board/stats`);
  return response.data;
}
