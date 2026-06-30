export interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  id: string;
  workflowId: string;
  sortOrder: number;
  titleTemplate: string;
  roleSlug: string;
  roleLabel: string;
  initialStatus: string;
  maxRuntime: number;
  maxRetries: number;
  skills: string[];
  goalMode: boolean;
  parents: number[];
  children: number[];
  createdAt: string;
}

export interface WorkflowGraph {
  workflow: Workflow;
  stages: WorkflowStage[];
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  params: Record<string, string>;
  taskIds: string[];
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface WorkflowSettings {
  id: string;
  workflowId: string;
  baseUrl: string;
  apiKeyMasked: string;
  chatSchema: string;
}

export interface CreateWorkflowPayload {
  name: string;
  description: string;
}

export interface UpdateWorkflowPayload {
  name?: string;
  description?: string;
}

export interface CreateStagePayload {
  sortOrder?: number;
  titleTemplate?: string;
  roleSlug?: string;
  roleLabel?: string;
  initialStatus?: string;
  maxRuntime?: number;
  maxRetries?: number;
  skills?: string[];
  goalMode?: boolean;
}

export interface UpdateStagePayload {
  sortOrder?: number;
  titleTemplate?: string;
  roleSlug?: string;
  roleLabel?: string;
  initialStatus?: string;
  maxRuntime?: number;
  maxRetries?: number;
  skills?: string[];
  goalMode?: boolean;
}

export interface RunWorkflowPayload {
  params: Record<string, string>;
  skipStages?: string[];
}

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
}
