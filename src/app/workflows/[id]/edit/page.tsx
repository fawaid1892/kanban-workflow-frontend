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
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toast } from '@/components/ui/toast';
import StageNode, { type StageNodeData } from '@/components/workflow/StageNode';
import { NodeEditor } from '@/components/workflow/NodeEditor';
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

  // Workflow metadata
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load existing workflow
  const { isLoading } = useQuery<WorkflowGraph>({
    queryKey: ['workflow-graph', workflowId],
    queryFn: async () => {
      const graph = await fetchWorkflowGraph(workflowId);
      setWorkflowName(graph.workflow.name);
      setWorkflowDescription(graph.workflow.description ?? '');

      // Convert stages to nodes
      const flowNodes: Node[] = graph.stages.map((stage, i) => ({
        id: String(stage.id),
        type: 'stage',
        position: { x: 100 + (i % 3) * 300, y: 50 + Math.floor(i / 3) * 200 },
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

      // Convert dependencies to edges
      const flowEdges: Edge[] = [];
      for (const stage of graph.stages) {
        for (const parentId of stage.parents ?? []) {
          flowEdges.push({
            id: `e-${parentId}-${stage.id}`,
            source: String(parentId),
            target: String(stage.id),
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366f1', strokeWidth: 2 },
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
        // Create workflow first
        const wf = await createWorkflow({
          name: workflowName,
          description: workflowDescription,
        });

        // Create all stages and set deps
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

        // Set dependencies
        for (const edge of edges) {
          const sourceId = stageIdMap.get(edge.source);
          const targetId = stageIdMap.get(edge.target);
          if (sourceId && targetId) {
            // Target depends on source (source is parent of target)
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

  // Add new node
  const addNode = useCallback(() => {
    const id = String(nextNodeId--);
    const newNode: Node = {
      id,
      type: 'stage',
      position: { x: 250, y: nodes.length * 180 + 50 },
      data: {
        titleTemplate: '',
        assigneeSlug: '',
        initialStatus: 'todo',
        maxRuntime: null,
        maxRetries: 2,
        skills: [],
        goalMode: false,
        sortOrder: nodes.length,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  }, [nodes.length, setNodes]);

  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366f1', strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [],
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Selected node data
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // Update node data
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

  // Delete selected node
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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b bg-white px-4 py-2">
        <button
          type="button"
          onClick={() => router.push(isNew ? '/workflows' : `/workflows/${workflowId}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {isNew ? (
          <input
            type="text"
            className="border-b border-transparent text-lg font-bold text-gray-900 focus:border-indigo-500 focus:outline-none"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder="Workflow Name"
          />
        ) : (
          <h1 className="text-lg font-bold text-gray-900">{workflowName}</h1>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addNode}>
            <Plus className="h-4 w-4" />
            Add Stage
          </Button>
          {isNew && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              loading={saveMutation.isPending}
            >
              <Save className="h-4 w-4" />
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Flow canvas */}
      <div className="flex-1">
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
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls />
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
          />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>

      {/* Node editor side panel */}
      {selectedNode && (
        <NodeEditor
          data={selectedNode.data as unknown as StageNodeData}
          onChange={updateNodeData}
          onDelete={deleteSelectedNode}
          onClose={() => setSelectedNodeId(null)}
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
