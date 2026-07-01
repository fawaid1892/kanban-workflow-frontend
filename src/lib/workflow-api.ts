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
