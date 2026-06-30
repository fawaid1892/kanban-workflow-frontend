'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Workflow } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import StageNode, { type StageNodeData } from '@/components/workflow/StageNode';
import { NodeEditor } from '@/components/workflow/NodeEditor';
import { RolePicker, type RoleTemplate } from '@/components/workflow/RolePicker';
import {
  fetchWorkflowGraph,
  createStage,
  setStageDeps,
  createWorkflow,
} from '@/lib/workflow-api';
import type { WorkflowGraph } from '@/types/workflow';

const nodeTypes: NodeTypes = {
  stage: StageNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

let nextNodeId = -1;

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isNew = params.id === 'new';
  const workflowId = params.id as string;

  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  // Load existing workflow
  const { isLoading } = useQuery<WorkflowGraph>({
    queryKey: ['workflow-graph', workflowId],
    queryFn: async () => {
      const graph = await fetchWorkflowGraph(workflowId);
      setWorkflowName(graph.workflow.name);
      setWorkflowDescription(graph.workflow.description ?? '');

      const flowNodes: Node[] = graph.stages.map((stage, i) => ({
        id: String(stage.id),
        type: 'stage',
        position: { x: 100 + (i % 3) * 320, y: 50 + Math.floor(i / 3) * 220 },
        data: {
          titleTemplate: stage.titleTemplate,
          assigneeSlug: stage.assigneeSlug ?? '',
          initialStatus: stage.initialStatus,
          maxRuntime: stage.maxRuntime,
          maxRetries: stage.maxRetries,
          skills: stage.skills ?? [],
          goalMode: stage.goalMode,
          sortOrder: stage.sortOrder,
        },
      }));

      const flowEdges: Edge[] = [];
      for (const stage of graph.stages) {
        for (const parentId of stage.parents ?? []) {
          flowEdges.push({
            id: `e-${parentId}-${stage.id}`,
            source: String(parentId),
            target: String(stage.id),
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: '#818cf8', strokeWidth: 2 },
          });
        }
      }

      setNodes(flowNodes);
      setEdges(flowEdges);
      return graph;
    },
    enabled: !isNew,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isNew) {
        const wf = await createWorkflow({
          name: workflowName,
          description: workflowDescription,
        });

        const stageIdMap = new Map<string, string>();
        for (const node of nodes) {
          const d = node.data as unknown as StageNodeData;
          const stage = await createStage(wf.id, {
            titleTemplate: d.titleTemplate,
            assigneeSlug: d.assigneeSlug || undefined,
            initialStatus: d.initialStatus,
            maxRuntime: d.maxRuntime ?? undefined,
            maxRetries: d.maxRetries,
            skills: d.skills,
            goalMode: d.goalMode,
            sortOrder: d.sortOrder,
          });
          stageIdMap.set(node.id, String(stage.id));
        }

        for (const edge of edges) {
          const sourceId = stageIdMap.get(edge.source);
          const targetId = stageIdMap.get(edge.target);
          if (sourceId && targetId) {
            const existingParents = edges
              .filter((e) => e.target === edge.target)
              .map((e) => stageIdMap.get(e.source))
              .filter(Boolean) as string[];
            await setStageDeps(wf.id, targetId, existingParents);
          }
        }

        return wf;
      }
      return null;
    },
    onSuccess: (wf) => {
      if (wf) {
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
        setToast({ message: 'Workflow saved!', type: 'success' });
        setTimeout(() => router.push(`/workflows/${wf.id}`), 500);
      }
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  // Add node with role template
  const addNodeWithRole = useCallback((role: RoleTemplate) => {
    const id = String(nextNodeId--);
    const newNode: Node = {
      id,
      type: 'stage',
      position: { x: 200 + (nodes.length % 3) * 100, y: nodes.length * 180 + 50 },
      data: {
        titleTemplate: `{feature_name} — ${role.label}`,
        assigneeSlug: role.slug,
        initialStatus: 'todo',
        maxRuntime: null,
        maxRetries: 2,
        skills: role.skills,
        goalMode: false,
        sortOrder: nodes.length,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setRolePickerOpen(false);
  }, [nodes.length, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: '#818cf8', strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const updateNodeData = useCallback(
    (changes: Partial<StageNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId
            ? { ...n, data: { ...n.data, ...changes } }
            : n,
        ),
      );
    },
    [selectedNodeId, setNodes],
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  if (!isNew && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading workflow...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen flex-col bg-gray-50">
      {/* Top toolbar — Gumloop style */}
      <div className="flex items-center border-b bg-white px-5 py-3">
        <button
          type="button"
          onClick={() => router.push(isNew ? '/workflows' : `/workflows/${workflowId}`)}
          className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Workflow className="h-4 w-4 text-indigo-500" />
          </div>
          {isNew ? (
            <input
              type="text"
              className="border-b border-transparent text-base font-bold text-gray-900 focus:border-indigo-400 focus:outline-none"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder="Workflow Name"
            />
          ) : (
            <h1 className="text-base font-bold text-gray-900">{workflowName}</h1>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRolePickerOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:shadow"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Stage
          </button>
          {isNew && (
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </button>
          )}
        </div>
      </div>

      {/* Canvas area */}
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[16, 16]}
          defaultEdgeOptions={{
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
            style: { stroke: '#818cf8', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
          className="!bg-gray-50"
        >
          <Controls className="!rounded-xl !border !border-gray-200 !shadow-sm" />
          <MiniMap
            nodeColor={(node) => {
              const d = node.data as unknown as StageNodeData;
              const colors: Record<string, string> = {
                backend: '#3b82f6',
                frontend: '#8b5cf6',
                qa: '#10b981',
                cybersecurity: '#ef4444',
                devops: '#f59e0b',
              };
              return colors[d.assigneeSlug] ?? '#9ca3af';
            }}
            className="!rounded-xl !border !border-gray-200 !shadow-sm"
            maskColor="rgba(249, 250, 251, 0.7)"
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="#e5e7eb"
          />
        </ReactFlow>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/80 px-8 py-10 text-center shadow-sm backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
                <Plus className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  No stages yet
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Click &ldquo;Add Stage&rdquo; to start building your workflow
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Node editor side panel */}
        {selectedNode && (
          <NodeEditor
            data={selectedNode.data as unknown as StageNodeData}
            onChange={updateNodeData}
            onDelete={deleteSelectedNode}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>

      {/* Role picker modal */}
      {rolePickerOpen && (
        <RolePicker
          onSelect={addNodeWithRole}
          onClose={() => setRolePickerOpen(false)}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
