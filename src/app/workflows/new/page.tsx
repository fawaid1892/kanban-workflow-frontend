'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, Workflow, FileText } from 'lucide-react';
import { Toast } from '@/components/ui/toast';
import StageNode, { type StageNodeData } from '@/components/workflow/StageNode';
import { NodeEditor } from '@/components/workflow/NodeEditor';
import { RolePicker } from '@/components/workflow/RolePicker';
import { createWorkflow, createStage, setStageDeps, fetchTemplates, type WorkflowTemplate } from '@/lib/workflow-api';

const nodeTypes: NodeTypes = { stage: StageNode };
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];
let nextNodeId = -1;

export default function NewWorkflowPage() {
  const router = useRouter();
  const [workflowName, setWorkflowName] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [rolePickerOpen, setRolePickerOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const { data: templates } = useQuery<WorkflowTemplate[]>({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  const applyTemplate = (template: WorkflowTemplate) => {
    setWorkflowName(template.name);
    const newNodes: Node[] = template.stages.map((stage, i) => ({
      id: String(nextNodeId--),
      type: 'stage',
      position: { x: 100 + (i % 3) * 320, y: 50 + Math.floor(i / 3) * 220 },
      data: {
        roleLabel: stage.roleLabel,
        titleTemplate: stage.titleTemplate,
        assigneeSlug: stage.roleSlug,
        initialStatus: stage.initialStatus,
        maxRuntime: null,
        maxRetries: 2,
        skills: [],
        goalMode: false,
        sortOrder: stage.sortOrder,
      },
    }));
    const newEdges: Edge[] = template.dependencies.map((dep) => ({
      id: `e-${dep.parentIndex}-${dep.childIndex}`,
      source: newNodes[dep.parentIndex]?.id ?? '',
      target: newNodes[dep.childIndex]?.id ?? '',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { stroke: '#818cf8', strokeWidth: 2 },
    })).filter((e) => e.source && e.target);
    setNodes(newNodes);
    setEdges(newEdges);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!workflowName.trim()) throw new Error('Workflow name is required');
      const wf = await createWorkflow({ name: workflowName, description: "" });

      const stageIdMap = new Map<string, string>();
      for (const node of nodes) {
        const d = node.data as unknown as StageNodeData;
        const stage = await createStage(wf.id, {
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
    },
    onSuccess: (wf) => {
      if (wf) router.push(`/workflows/${wf.id}`);
    },
    onError: (err: Error) => {
      setToast({ message: err.message, type: 'error' });
    },
  });

  const addNodeWithRole = useCallback((role: { label: string; slug: string; skills: string[] }) => {
    const id = String(nextNodeId--);
    const newNode: Node = {
      id, type: 'stage',
      position: { x: 200 + (nodes.length % 3) * 100, y: nodes.length * 180 + 50 },
      data: {
        roleLabel: role.label, titleTemplate: `{feature_name} — ${role.label}`,
        assigneeSlug: role.slug, initialStatus: 'todo', maxRuntime: null,
        maxRetries: 2, skills: role.skills, goalMode: false, sortOrder: nodes.length,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
    setRolePickerOpen(false);
  }, [nodes.length, setNodes]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({
      ...params, animated: true,
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { stroke: '#818cf8', strokeWidth: 2 },
    }, eds));
  }, [setEdges]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) ?? null;
  const updateNodeData = useCallback((changes: Partial<StageNodeData>) => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.map((n) => n.id === selectedNodeId ? { ...n, data: { ...n.data, ...changes } } : n));
  }, [selectedNodeId, setNodes]);
  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  return (
    <div className="relative flex h-screen flex-col bg-gray-50">
      <div className="flex items-center border-b bg-white px-5 py-3">
        <Link href="/workflows" className="mr-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <Workflow className="h-4 w-4 text-indigo-500" />
          </div>
          <input type="text" className="border-b border-transparent text-base font-bold text-gray-900 focus:border-indigo-400 focus:outline-none" placeholder="Workflow Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => setRolePickerOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:shadow">
            <Plus className="h-3.5 w-3.5" /> Add Stage
          </button>
          <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !workflowName.trim()} className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50">
            {saveMutation.isPending ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      {/* Template selector */}
      {templates && templates.length > 0 && nodes.length === 0 && (
        <div className="border-b bg-indigo-50/50 px-5 py-3 dark:bg-indigo-900/10">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <FileText className="h-3.5 w-3.5" />
            <span className="font-medium">Quick start:</span>
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-gray-800 dark:text-indigo-400"
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative flex-1">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(e, n) => setSelectedNodeId(n.id)} onPaneClick={() => setSelectedNodeId(null)} nodeTypes={nodeTypes} fitView snapToGrid snapGrid={[16, 16]} proOptions={{ hideAttribution: true }} className="!bg-gray-50">
          <Controls className="!rounded-xl !border !border-gray-200 !shadow-sm" />
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e5e7eb" />
        </ReactFlow>
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/80 px-8 py-10 text-center shadow-sm backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50"><Workflow className="h-6 w-6 text-indigo-400" /></div>
              <div>
                <p className="text-sm font-semibold text-gray-700">No stages yet</p>
                <p className="mt-1 text-xs text-gray-500">Click &ldquo;Add Stage&rdquo; to start building</p>
              </div>
            </div>
          </div>
        )}
        {selectedNode && <NodeEditor data={selectedNode.data as unknown as StageNodeData} onChange={updateNodeData} onDelete={deleteSelectedNode} onClose={() => setSelectedNodeId(null)} />}
        {rolePickerOpen && <RolePicker onSelect={addNodeWithRole} onClose={() => setRolePickerOpen(false)} />}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
}
