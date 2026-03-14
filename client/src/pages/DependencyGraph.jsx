import { useMemo, useState, useCallback, useEffect } from 'react';
import { GitBranch, Info, Maximize2, MousePointer2 } from 'lucide-react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState,
  Panel,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { getFlowElements, getPredecessors, getCriticalPath } from '../utils/graphUtils';
import MapNode from '../components/MapNode';
import TaskModal from '../components/TaskModal';
import GraphSkeleton from '../components/GraphSkeleton';

const nodeTypes = {
  taskNode: MapNode,
};

function GraphContent() {
  const { tasks, loading } = useTasks();
  const { dark } = useTheme();
  const { fitView } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Initialize nodes and edges
  useEffect(() => {
    if (tasks.length > 0) {
      const { nodes: initialNodes, edges: initialEdges } = getFlowElements(tasks);
      setNodes(initialNodes);
      setEdges(initialEdges);
      // Wait a frame for the layout to apply then fit
      setTimeout(() => fitView({ duration: 800 }), 50);
    }
  }, [tasks, setNodes, setEdges, fitView]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedTask(node.data.task);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedTask(null);
  }, []);

  const { pathIds } = useMemo(() => {
    if (tasks.length === 0) return { pathIds: new Set() };
    const { pred } = getPredecessors(tasks);
    const { pathIds: ids } = getCriticalPath(tasks, pred);
    return { pathIds: ids };
  }, [tasks]);

  return (
    <div className="p-4 pt-16 md:pt-6 md:p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 flex items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
              <GitBranch size={20} />
            </div>
            Dependency Network Map
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <MousePointer2 size={14} className="text-indigo-500" />
            Interactive workspace • Click nodes for details
          </p>
        </div>

        <div className="flex items-center gap-3">
            {pathIds.size > 0 && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-red-700 dark:text-red-400 uppercase tracking-tighter">
                        Critical Path: {pathIds.size} {pathIds.size === 1 ? 'Step' : 'Steps'}
                    </span>
                </div>
            )}
            <button 
                onClick={() => fitView({ duration: 800 })}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 shadow-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-bold text-[11px] uppercase tracking-tighter cursor-pointer"
            >
                <Maximize2 size={12} />
                Full View
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 overflow-hidden relative shadow-inner">
        {loading ? (
          <GraphSkeleton />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center opacity-40">
                <GitBranch size={32} />
            </div>
            <p className="text-sm font-medium">No connections to map yet.</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            colorMode={dark ? 'dark' : 'light'}
            className="bg-dot-pattern"
          >
            <Background variant="dots" gap={20} size={1} color={dark ? '#334155' : '#cbd5e1'} />
            <Controls className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !shadow-xl" />
            <MiniMap 
                className="!bg-white dark:!bg-slate-900 !border-slate-200 dark:!border-slate-800 !shadow-xl !rounded-lg"
                maskColor={dark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
                nodeColor={(node) => {
                    if (node.data.critical) return '#ef4444';
                    return dark ? '#1e293b' : '#e2e8f0';
                }}
            />
            <Panel position="bottom-right" className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 m-4 flex items-center gap-3 shadow-lg pointer-events-none">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Critical</span>
                 </div>
                 <div className="w-px h-3 bg-slate-200 dark:bg-slate-800" />
                 <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dependency</span>
                 </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      <TaskModal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        editTask={selectedTask} 
        isViewOnly={true} 
      />
    </div>
  );
}

export default function DependencyGraph() {
  return (
    <ReactFlowProvider>
        <GraphContent />
    </ReactFlowProvider>
  );
}
