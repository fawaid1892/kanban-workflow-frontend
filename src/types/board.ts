export interface BoardTask {
  id: string;
  title: string;
  body: string | null;
  assignee: string;
  status: string;
  priority: number;
  createdBy: string;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  workspaceKind: string | null;
  branchName: string | null;
  projectId: string | null;
  result: string | null;
  skills: string[];
  maxRetries: number | null;
  goalMode: boolean;
  sessionId: string | null;
  workflowTemplateId: string | null;
  currentStepKey: string | null;
}

export interface TaskEvent {
  id: number;
  taskId: string;
  runId: string | null;
  kind: string;
  payload: string | null;
  createdAt: number;
}

export interface TaskComment {
  id: number;
  taskId: string;
  author: string;
  body: string;
  createdAt: number;
}

export interface TaskDetail extends BoardTask {
  events: TaskEvent[];
  comments: TaskComment[];
  parentIds: string[];
  childIds: string[];
}

export interface BoardStats {
  total: number;
  byStatus: Record<string, number>;
  byAssignee: Record<string, number>;
}
