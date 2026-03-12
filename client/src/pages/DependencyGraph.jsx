import { useMemo } from 'react';
import { GitBranch, Info } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { getPredecessors, getLayers, getCriticalPath } from '../utils/graphUtils';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 44;
const LAYER_GAP = 80;
const NODE_GAP = 16;

function GraphSvg({ tasks, dark }) {
  const { pred } = useMemo(() => getPredecessors(tasks), [tasks]);
  const layersMap = useMemo(() => getLayers(tasks, pred), [tasks, pred]);
  const { pathIds, pathEdges } = useMemo(() => getCriticalPath(tasks, pred), [tasks, pred]);

  const layers = useMemo(() => {
    const L = new Map();
    tasks.forEach((t) => {
      const id = String(t._id);
      const layer = layersMap.get(id) ?? 0;
      if (!L.has(layer)) L.set(layer, []);
      L.get(layer).push(t);
    });
    const maxLayer = Math.max(...layersMap.values(), 0);
    return Array.from({ length: maxLayer + 1 }, (_, i) => L.get(i) || []);
  }, [tasks, layersMap]);

  const positions = useMemo(() => {
    const pos = new Map();
    layers.forEach((layerTasks, layerIndex) => {
      layerTasks.forEach((t, index) => {
        const x = 40 + layerIndex * (NODE_WIDTH + LAYER_GAP);
        const y = 40 + index * (NODE_HEIGHT + NODE_GAP);
        pos.set(String(t._id), { x, y, w: NODE_WIDTH, h: NODE_HEIGHT });
      });
    });
    return pos;
  }, [layers]);

  const edges = useMemo(() => {
    const out = [];
    tasks.forEach((t) => {
      const toId = String(t._id);
      const toPos = positions.get(toId);
      if (!toPos) return;
      (pred.get(toId) || []).forEach((fromId) => {
        const fromPos = positions.get(fromId);
        if (!fromPos) return;
        out.push({
          from: fromId,
          to: toId,
          x1: fromPos.x + fromPos.w,
          y1: fromPos.y + fromPos.h / 2,
          x2: toPos.x,
          y2: toPos.y + toPos.h / 2,
          critical: pathEdges.has(`${fromId}->${toId}`),
        });
      });
    });
    return out;
  }, [tasks, pred, positions, pathEdges]);

  if (tasks.length === 0) return null;

  const totalW = layers.length * (NODE_WIDTH + LAYER_GAP) + 80;
  const totalH = Math.max(...layers.map((L) => L.length), 1) * (NODE_HEIGHT + NODE_GAP) + 80;

  return (
    <svg
      width={totalW}
      height={totalH}
      viewBox={`0 0 ${totalW} ${totalH}`}
      className="overflow-visible"
      style={{ minWidth: totalW, minHeight: totalH }}
    >
      <defs>
        <marker
          id="arrow-graph"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill={dark ? '#94a3b8' : '#64748b'} />
        </marker>
        <marker
          id="arrow-critical-graph"
          markerWidth="8"
          markerHeight="8"
          refX="7"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#dc2626" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const midX = (e.x1 + e.x2) / 2;
        return (
          <path
            key={`${e.from}-${e.to}-${i}`}
            d={`M ${e.x1} ${e.y1} C ${midX} ${e.y1}, ${midX} ${e.y2}, ${e.x2} ${e.y2}`}
            fill="none"
            stroke={e.critical ? '#dc2626' : (dark ? '#64748b' : '#64748b')}
            strokeWidth={e.critical ? 2.5 : 1.5}
            markerEnd={`url(#${e.critical ? 'arrow-critical-graph' : 'arrow-graph'})`}
            opacity={e.critical ? 1 : 0.8}
          />
        );
      })}
      {tasks.map((t) => {
        const id = String(t._id);
        const pos = positions.get(id);
        if (!pos) return null;
        const critical = pathIds.has(id);
        const status = t.effectiveStatus || t.status;
        const isDone = status === 'Done';
        return (
          <g key={id}>
            <rect
              x={pos.x}
              y={pos.y}
              width={pos.w}
              height={pos.h}
              rx={8}
              fill={critical ? (dark ? '#7f1d1d' : '#fef2f2') : (dark ? '#334155' : '#e2e8f0')}
              stroke={critical ? '#dc2626' : (dark ? '#64748b' : '#94a3b8')}
              strokeWidth={critical ? 2 : 1}
            />
            <text
              x={pos.x + pos.w / 2}
              y={pos.y + pos.h / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dark ? '#e2e8f0' : '#1e293b'}
              style={{ fontSize: 11, fontFamily: 'inherit', fontWeight: 500 }}
            >
              {(t.title || 'Untitled').slice(0, 20)}
              {(t.title || '').length > 20 ? '…' : ''}
            </text>
            {isDone && (
              <circle cx={pos.x + pos.w - 10} cy={pos.y + 10} r={4} fill="#22c55e" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function DependencyGraph() {
  const { tasks, loading } = useTasks();
  const { dark } = useTheme();

  const { pathIds } = useMemo(() => {
    if (tasks.length === 0) return { pathIds: new Set() };
    const { pred } = getPredecessors(tasks);
    const { pathIds: ids } = getCriticalPath(tasks, pred);
    return { pathIds: ids };
  }, [tasks]);

  return (
    <div className="p-4 pt-16 md:pt-6 md:p-6 flex flex-col min-w-0">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <GitBranch size={24} />
              Dependency Graph
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Task dependencies with critical path (longest chain) highlighted in red
            </p>
          </div>
          {pathIds.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Critical path: {pathIds.size} task{pathIds.size !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-auto min-h-[420px] h-[500px]">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[420px] text-slate-400">Loading...</div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[420px] text-slate-400 gap-2">
              <GitBranch size={40} className="opacity-40" />
              <p className="text-sm">No tasks to display. Add tasks and dependencies to see the graph.</p>
            </div>
          ) : (
            <div className="p-4" style={{ minWidth: 'min-content', minHeight: 420 }}>
              <GraphSvg tasks={tasks} dark={dark} />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info size={14} />
          <span>Red border and edges = critical path (longest dependency chain). Green dot = task done.</span>
        </div>
    </div>
  );
}
