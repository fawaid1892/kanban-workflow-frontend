export interface Workflow {
  id: string;
  name: string;
  description: string;
  stageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStage {
  id: string;
  workflowId: string;
  sortOrder: number;
  titleTemplate: string;
  assigneeSlug?: string;
  assigneeName?: string;
  initialStatus: string;
  workspaceKind?: string;
  maxRuntime: number;
  maxRetries: number;
  skills: string[];
  goalMode: boolean;
  parents: number[];
  children: number[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowGraph {
  workflow: Workflow;
  stages: WorkflowStage[];
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
  sortOrder: number;
  titleTemplate?: string;
  assigneeId?: string;
  initialStatus?: string;
  maxRuntime?: number;
  maxRetries?: number;
  skills?: string[];
  goalMode?: boolean;
  parentIds?: string[];
}

export interface UpdateStagePayload {
  sortOrder?: number;
  titleTemplate?: string;
  assigneeId?: string;
  initialStatus?: string;
  maxRuntime?: number;
  maxRetries?: number;
  skills?: string[];
  goalMode?: boolean;
  parentIds?: string[];
}

export interface RoleOption {
  id: string;
  name: string;
  slug: string;
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

export interface RunWorkflowPayload {
  params: Record<string, string>;
  skipStages?: string[];
  assigneeOverrides?: Record<string, string>;
}
