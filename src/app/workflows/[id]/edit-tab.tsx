'use client';

import React, { useState, useCallback, useMemo } from 'react';
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
import { Save, Plus, Workflow } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import StageNode, { type StageNodeData } from '@/components/workflow/StageNode';
import { NodeEditor } from '@/components/workflow/NodeEditor';
import { RolePicker } from '@/components/workflow/RolePicker';
import {
  fetchWorkflowGraph,
  createStage,
  setStageDeps,
} from '@/lib/workflow-api';
import type { WorkflowGraph } from '@/types/workflow';

const nodeTypes: NodeTypes = { stage: StageNode };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
let nextNodeId = -1;

export default function WorkflowEditTab({ workflowId }: { workflowId: string }) {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { isLoading } = useQuery<WorkflowGraph>({
    queryKey: ['workflow-graph', workflowId],
    queryFn: async () => {
      const graph = await fetchWorkflowGraph(workflowId);
      if (!graph || !graph.stages) return { workflow: {}, stages: [], dependencies: [] } as unknown as WorkflowGraph;
      const flowNodes: Node[] = graph.stages.map((stage, i) => ({
        id: String(stage.id),
        type: 'stage',
        position: { x: 100 + (i % 3) * 320, y: 50 + Math.floor(i / 3) * 220 },
        data: {
          roleLabel: stage.roleLabel ?? 'Unknown',
          titleTemplate: stage.titleTemplate ?? '',
          assigneeSlug: stage.roleSlug ?? 'unknown',
          initialStatus: stage.initialStatus ?? 'todo',
          maxRuntime: stage.maxRuntime ?? null,
          maxRetries: stage.maxRetries ?? 2,
          skills: stage.skills ?? [],
          goalMode: stage.goalMode ?? false,
          sortOrder: stage.sortOrder ?? i,
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
    enabled: !!workflowId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const stageIdMap = new Map<string, number>();
      for (const node of nodes) {
        const d = node.data as unknown as StageNodeData;
        const stage = await createStage(workflowId, {
          titleTemplate: d.titleTemplate,
          roleSlug: d.assigneeSlug,
          roleLabel: d.roleLabel,
          initialStatus: d.initialStatus,
          maxRuntime: d.maxRuntime ?? undefined,
          maxRetries: d.maxRetries,
          skills: d.skills,
          goalMode: d.goalMode,
          sortOrder: d.sortOrder,
        });
        stageIdMap.set(node.id, stage.id);
      }
      for (const edge of edges) {
        const sourceId = stageIdMap.get(edge.source);
        const targetId = stageIdMap.get(edge.target);
        if (sourceId && targetId) {
          const existingParents = edges
            .filter((e) => e.target === edge.target)
            .map((e) => stageIdMap.get(e.source))
            .filter(Boolean) as number[];
          await setStageDeps(workflowId, String(targetId), existingParents);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-graph', workflowId] });
      setToast({ message: 'Stages saved!', type: 'success' });
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  useKeyboardShortcuts({
    onSave: () => { if (!saveMutation.isPending) saveMutation.mutate(); },
  });

  const addNodeWithRole = useCallback((role: { label: string; slug: string; skills: string[] }) => {
    const id = String(nextNodeId--);
    const newNode: Node = {
      id,
      type: 'stage',
      position: { x: 200 + (nodes.length % 3) * 100, y: nodes.length * 180 + 50 },
      data: {
        roleLabel: role.label,
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

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { stroke: '#818cf8', strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const updateNodeData = useCallback((changes: Partial<StageNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) =>
      n.id === selectedNodeId ? { ...n, data: { ...n.data, ...changes } } : n,
    ));
  }, [selectedNodeId, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-12rem)]">
      {/* Toolbar */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <button type="button" onClick={() => setRolePickerOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:shadow">
          <Plus className="h-3.5 w-3.5" /> Add Stage
        </button>
        <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50">
          <Save className="h-3.5 w-3.5" /> Save
        </button>
      </div>

      {/* Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[16, 16]}
        proOptions={{ hideAttribution: true }}
        className="!bg-gray-50"
      >
        <Controls className="!rounded-xl !border !border-gray-200 !shadow-sm" />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = { backend: '#3b82f6', frontend: '#8b5cf6', qa: '#10b981', cybersecurity: '#ef4444', devops: '#f59e0b' };
            return colors[(node.data as unknown as StageNodeData).assigneeSlug] ?? '#9ca3af';
          }}
          className="!rounded-xl !border !border-gray-200 !shadow-sm"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/80 px-8 py-10 text-center shadow-sm backdrop-blur-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
              <Workflow className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700">No stages yet</p>
              <p className="mt-1 text-xs text-gray-500">Click &ldquo;Add Stage&rdquo; to start building</p>
            </div>
          </div>
        </div>
      )}

      {selectedNode && (
        <NodeEditor data={selectedNode.data as unknown as StageNodeData} onChange={updateNodeData} onDelete={deleteSelectedNode} onClose={() => setSelectedNodeId(null)} />
      )}

      {rolePickerOpen && <RolePicker onSelect={addNodeWithRole} onClose={() => setRolePickerOpen(false)} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
