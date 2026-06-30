export interface KanbanEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export interface TaskUpdate {
  taskId: string;
  status: string;
  assignee?: string;
  timestamp: string;
}

export interface BuildProgress {
  roleSlug: string;
  buildId: string;
  output: string;
  status: string;
  timestamp: string;
}
