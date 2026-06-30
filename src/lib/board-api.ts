import api from './api';
import type { BoardTask, TaskDetail, BoardStats } from '@/types/board';

export interface BoardFilters {
  status?: string;
  assignee?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function fetchBoardTasks(
  filters?: BoardFilters,
): Promise<BoardTask[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignee) params.set('assignee', filters.assignee);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));

  const qs = params.toString();
  const response = await api.get<BoardTask[]>(`/board/tasks${qs ? `?${qs}` : ''}`);
  return response.data;
}

export async function fetchTaskDetail(taskId: string): Promise<TaskDetail> {
  const response = await api.get<TaskDetail>(`/board/tasks/${taskId}`);
  return response.data;
}

export async function fetchBoardStats(): Promise<BoardStats> {
  const response = await api.get<BoardStats>('/board/stats');
  return response.data;
}
