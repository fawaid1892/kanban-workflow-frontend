export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  sortOrder: number;
  sandboxImage: string;
  sandboxNetwork: string;
  sandboxMemory: string;
  sandboxCpu: string;
  sandboxTimeout: number;
  preCacheDeps: boolean;
  modelMode: 'shared' | 'dedicated';
  modelProvider?: string;
  modelName?: string;
  modelTemperature?: number;
  modelMaxTokens?: number;
  modelSystemPrompt?: string;
  modelMaxTurns?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  slug: string;
  name: string;
  description: string;
  color?: string;
  sortOrder?: number;
  sandboxImage?: string;
  sandboxNetwork?: string;
  sandboxMemory?: string;
  sandboxCpu?: string;
  sandboxTimeout?: number;
  preCacheDeps?: boolean;
  modelMode?: 'shared' | 'dedicated';
  modelProvider?: string;
  modelName?: string;
  modelTemperature?: number;
  modelMaxTokens?: number;
  modelSystemPrompt?: string;
  modelMaxTurns?: number;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export interface RoleFormData {
  slug: string;
  name: string;
  description: string;
  color: string;
  sortOrder?: number;
  sandboxImage: string;
  sandboxNetwork: string;
  sandboxMemory: string;
  sandboxCpu: string;
  sandboxTimeout?: number;
  preCacheDeps?: boolean;
  modelMode: 'shared' | 'dedicated';
  modelProvider?: string;
  modelName?: string;
  modelTemperature?: number;
  modelMaxTokens?: number;
  modelSystemPrompt?: string;
  modelMaxTurns?: number;
}
