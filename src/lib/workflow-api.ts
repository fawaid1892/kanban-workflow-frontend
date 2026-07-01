import api from './api';
import type {
  Workflow,
  WorkflowGraph,
  WorkflowRun,
  WorkflowSettings,
  CreateWorkflowPayload,
  UpdateWorkflowPayload,
  CreateStagePayload,
  UpdateStagePayload,
  RunWorkflowPayload,
} from '@/types/workflow';

// ── Workflows ──

export async function fetchWorkflows(): Promise<Workflow[]> {
  const response = await api.get<Workflow[]>('/workflows');
  return response.data;
}

export async function fetchWorkflow(id: string): Promise<Workflow> {
  const response = await api.get<Workflow>(`/workflows/${id}`);
  return response.data;
}

export async function createWorkflow(payload: CreateWorkflowPayload): Promise<Workflow> {
  const response = await api.post<Workflow>('/workflows', payload);
  return response.data;
}

export async function updateWorkflow(id: string, payload: UpdateWorkflowPayload): Promise<Workflow> {
  const response = await api.put<Workflow>(`/workflows/${id}`, payload);
  return response.data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await api.delete(`/workflows/${id}`);
}

// ── Stages ──

export async function createStage(workflowId: string, payload: CreateStagePayload) {
  const response = await api.post(`/workflows/${workflowId}/stages`, payload);
  return response.data;
}

export async function updateStage(workflowId: string, stageId: string, payload: UpdateStagePayload) {
  const response = await api.put(`/workflows/${workflowId}/stages/${stageId}`, payload);
  return response.data;
}

export async function deleteStage(workflowId: string, stageId: string): Promise<void> {
  await api.delete(`/workflows/${workflowId}/stages/${stageId}`);
}

// ── Dependencies ──

export async function setStageDeps(workflowId: string, stageId: string, parentIds: string[]): Promise<void> {
  await api.put(`/workflows/${workflowId}/stages/${stageId}/deps`, { parentIds });
}

// ── Graph ──

export async function fetchWorkflowGraph(workflowId: string): Promise<WorkflowGraph> {
  const response = await api.get<WorkflowGraph>(`/workflows/${workflowId}/graph`);
  return response.data;
}

// ── Run ──

export async function runWorkflow(workflowId: string, payload: RunWorkflowPayload): Promise<{ runId: string; status: string }> {
  const response = await api.post(`/workflows/${workflowId}/run`, payload);
  return response.data;
}

export async function fetchWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
  const response = await api.get<WorkflowRun[]>(`/workflows/${workflowId}/runs`);
  return response.data;
}

export async function fetchWorkflowRun(workflowId: string, runId: string): Promise<WorkflowRun> {
  const response = await api.get<WorkflowRun>(`/workflows/${workflowId}/runs/${runId}`);
  return response.data;
}

// ── Settings ──

export async function fetchWorkflowSettings(workflowId: string): Promise<WorkflowSettings | null> {
  const response = await api.get<WorkflowSettings | null>(`/workflows/${workflowId}/settings`);
  return response.data;
}

export async function updateWorkflowSettings(workflowId: string, payload: {
  baseUrl: string;
  apiKey: string;
  chatSchema: string;
}): Promise<WorkflowSettings> {
  const response = await api.put<WorkflowSettings>(`/workflows/${workflowId}/settings`, payload);
  return response.data;
}

// ── Duplicate ──

export async function duplicateWorkflow(id: string): Promise<Workflow> {
  const response = await api.post<Workflow>(`/workflows/${id}/duplicate`);
  return response.data;
}

// ── Export / Import ──

export interface WorkflowExport {
  name: string;
  description?: string;
  stages: { titleTemplate: string; roleSlug: string; roleLabel: string; initialStatus: string; maxRuntime?: number; maxRetries?: number; skills?: string[]; goalMode?: boolean; sortOrder?: number }[];
  dependencies?: { parentIndex: number; childIndex: number }[];
  settings?: { baseUrl: string; chatSchema: string };
}

export async function exportWorkflow(id: string): Promise<WorkflowExport> {
  const response = await api.get<WorkflowExport>(`/workflows/${id}/export`);
  return response.data;
}

export async function importWorkflow(data: WorkflowExport): Promise<Workflow> {
  const response = await api.post<Workflow>('/workflows/import', data);
  return response.data;
}

// ── Templates ──

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  stages: { titleTemplate: string; roleLabel: string; roleSlug: string; initialStatus: string; sortOrder: number }[];
  dependencies: { parentIndex: number; childIndex: number }[];
}

export async function fetchTemplates(): Promise<WorkflowTemplate[]> {
  const response = await api.get<WorkflowTemplate[]>('/workflows/templates');
  return response.data;
}

// ── Board: Task Status + Comments ──

export async function updateTaskStatus(workflowId: string, taskId: string, status: string): Promise<{ ok: boolean }> {
  const response = await api.put<{ ok: boolean }>(`/workflows/${workflowId}/board/tasks/${taskId}/status`, { status });
  return response.data;
}

export async function addTaskComment(workflowId: string, taskId: string, body: string, author?: string): Promise<{ ok: boolean }> {
  const response = await api.post<{ ok: boolean }>(`/workflows/${workflowId}/board/tasks/${taskId}/comments`, { body, author: author ?? 'user' });
  return response.data;
}

// ── Board: Bulk Status + Priority ──

export async function bulkUpdateStatus(workflowId: string, taskIds: string[], status: string): Promise<{ updated: number }> {
  const response = await api.put<{ updated: number }>(`/workflows/${workflowId}/board/tasks/bulk-status`, { taskIds, status });
  return response.data;
}

export async function updateTaskPriority(workflowId: string, taskId: string, priority: number): Promise<{ ok: boolean }> {
  const response = await api.put<{ ok: boolean }>(`/workflows/${workflowId}/board/tasks/${taskId}/priority`, { priority });
  return response.data;
}

// ── Analytics ──

export interface WorkflowAnalytics {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  runningRuns: number;
  successRate: number;
  avgDurationSeconds: number;
  runsPerDay: { date: string; count: number }[];
}

export async function fetchWorkflowAnalytics(id: string): Promise<WorkflowAnalytics> {
  const response = await api.get<WorkflowAnalytics>(`/workflows/${id}/analytics`);
  return response.data;
}

// ── Activity Log ──

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: string;
}

export async function fetchActivityLog(id: string): Promise<ActivityEntry[]> {
  const response = await api.get<ActivityEntry[]>(`/workflows/${id}/activity`);
  return response.data;
}

// ── Versions ──

export interface WorkflowVersion {
  id: string;
  version: number;
  stagesSnapshot: unknown;
  depsSnapshot: unknown;
  changeSummary: string | null;
  createdAt: string;
}

export async function fetchVersions(id: string): Promise<WorkflowVersion[]> {
  const response = await api.get<WorkflowVersion[]>(`/workflows/${id}/versions`);
  return response.data;
}

export async function createVersion(id: string, changeSummary?: string): Promise<{ version: number }> {
  const response = await api.post<{ version: number }>(`/workflows/${id}/versions`, { changeSummary });
  return response.data;
}

// ── Webhook ──

export interface WebhookConfig {
  id: string;
  url: string;
  secret: string | null;
  events: string[];
  isActive: boolean;
}

export async function fetchWebhook(id: string): Promise<WebhookConfig | null> {
  const response = await api.get<WebhookConfig | null>(`/workflows/${id}/webhook`);
  return response.data;
}

export async function updateWebhook(id: string, config: Partial<WebhookConfig>): Promise<WebhookConfig> {
  const response = await api.put<WebhookConfig>(`/workflows/${id}/webhook`, config);
  return response.data;
}

// ── Board Columns ──

export interface BoardColumn {
  id: string;
  key: string;
  label: string;
  color: string;
  sortOrder: number;
  isDefault: boolean;
}

export async function fetchColumns(workflowId: string): Promise<BoardColumn[]> {
  const response = await api.get<BoardColumn[]>(`/workflows/${workflowId}/columns`);
  return response.data;
}

export async function createColumn(workflowId: string, data: { key: string; label: string; color?: string }): Promise<BoardColumn> {
  const response = await api.post<BoardColumn>(`/workflows/${workflowId}/columns`, data);
  return response.data;
}

export async function deleteColumn(workflowId: string, columnId: string): Promise<void> {
  await api.delete(`/workflows/${workflowId}/columns/${columnId}`);
}

// ── Search ──

export async function searchWorkflows(query: string): Promise<Workflow[]> {
  const response = await api.get<Workflow[]>(`/workflows/search?q=${encodeURIComponent(query)}`);
  return response.data;
}

// ── Tags ──

export async function fetchTags(workflowId: string): Promise<{ id: string; tag: string }[]> {
  const response = await api.get<{ id: string; tag: string }[]>(`/workflows/${workflowId}/tags`);
  return response.data;
}

export async function addTag(workflowId: string, tag: string): Promise<{ tag: string }> {
  const response = await api.post<{ tag: string }>(`/workflows/${workflowId}/tags`, { tag });
  return response.data;
}

export async function removeTag(workflowId: string, tag: string): Promise<void> {
  await api.delete(`/workflows/${workflowId}/tags/${encodeURIComponent(tag)}`);
}

export async function fetchAllTags(): Promise<string[]> {
  const response = await api.get<string[]>('/workflows/tags');
  return response.data;
}

// ── Favorites + Archive ──

export async function toggleFavorite(workflowId: string): Promise<{ isFavorite: boolean }> {
  const response = await api.put<{ isFavorite: boolean }>(`/workflows/${workflowId}/favorite`);
  return response.data;
}

export async function toggleArchive(workflowId: string): Promise<{ isArchived: boolean }> {
  const response = await api.put<{ isArchived: boolean }>(`/workflows/${workflowId}/archive`);
  return response.data;
}

// ── Gantt ──

export interface GanttData {
  stages: { id: number; label: string; titleTemplate: string; startDay: number; endDay: number; assignee: string }[];
  dependencies: { from: number; to: number }[];
  totalDays: number;
}

export async function fetchGantt(workflowId: string): Promise<GanttData> {
  const response = await api.get<GanttData>(`/workflows/${workflowId}/gantt`);
  return response.data;
}

// ── Time Tracking ──

export interface TimeLog {
  id: string;
  taskId: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
}

export async function fetchTimeLogs(workflowId: string): Promise<TimeLog[]> {
  const response = await api.get<TimeLog[]>(`/workflows/${workflowId}/time-logs`);
  return response.data;
}
