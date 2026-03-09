import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Bar } from 'react-chartjs-2';
import Sidebar from '../components/Sidebar';
import { useTasks } from '../context/TaskContext';
import { Calendar, AlertCircle, CheckCircle2, Zap } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

/**
 * Build Gantt data from tasks: start = createdAt, end = dueDate or start + 7 days.
 */
function buildGanttData(tasks) {
  const labels = [];
  const bars = [];
  const colors = [];
  const borderColors = [];
  const taskMeta = [];
  let minTime = Infinity;
  let maxTime = -Infinity;

  tasks.forEach((t) => {
    const start = new Date(t.createdAt).getTime();
    let end;
    if (t.dueDate) {
      end = new Date(t.dueDate).getTime();
      if (end <= start) end = start + 24 * 60 * 60 * 1000;
    } else {
      end = start + 7 * 24 * 60 * 60 * 1000;
    }
    minTime = Math.min(minTime, start);
    maxTime = Math.max(maxTime, end);
    labels.push((t.title || 'Untitled').slice(0, 35));
    bars.push([start, end]);
    
    // Enhanced color coding based on status
    const effectiveStatus = t.effectiveStatus || t.status;
    let bgColor, brColor;
    
    if (effectiveStatus === 'Done') {
      bgColor = 'rgba(34, 197, 94, 0.8)';
      brColor = 'rgb(22, 163, 74)';
    } else if (effectiveStatus === 'Blocked') {
      bgColor = 'rgba(239, 68, 68, 0.8)';
      brColor = 'rgb(220, 38, 38)';
    } else if (effectiveStatus === 'In Progress') {
      bgColor = 'rgba(99, 102, 241, 0.8)';
      brColor = 'rgb(79, 70, 229)';
    } else {
      bgColor = 'rgba(148, 163, 184, 0.6)';
      brColor = 'rgb(100, 116, 139)';
    }
    
    colors.push(bgColor);
    borderColors.push(brColor);
    
    taskMeta.push({
      title: t.title,
      status: effectiveStatus,
      priority: t.effectivePriority || t.priority,
      daysRemaining: Math.ceil((end - start) / (24 * 60 * 60 * 1000)),
    });
  });

  const padding = (maxTime - minTime) * 0.05 || 24 * 60 * 60 * 1000;
  return {
    labels,
    bars,
    colors,
    borderColors,
    taskMeta,
    minTime: minTime - padding,
    maxTime: maxTime + padding,
  };
}

export default function GanttView() {
  const { tasks, loading } = useTasks();

  const { chartData, options } = useMemo(() => {
    const { labels, bars, colors, borderColors, taskMeta, minTime, maxTime } = buildGanttData(tasks);

    const data = {
      labels,
      datasets: [
        {
          label: 'Task Timeline',
          data: bars,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 6,
          barThickness: 28,
        },
      ],
    };

    const opts = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true,
          labels: {
            padding: 20,
            font: { size: 12, weight: '600' },
            boxWidth: 14,
            boxHeight: 10,
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          padding: 16,
          cornerRadius: 8,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          borderColor: 'rgba(148, 163, 184, 0.3)',
          borderWidth: 1,
          callbacks: {
            title: (ctx) => {
              const idx = ctx[0].dataIndex;
              return taskMeta[idx]?.title || 'Task';
            },
            label: (ctx) => {
              const [start, end] = ctx.raw;
              const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return `Duration: ${s} → ${e}`;
            },
            afterLabel: (ctx) => {
              const idx = ctx.dataIndex;
              const meta = taskMeta[idx];
              return [
                `Status: ${meta.status}`,
                `Priority: ${meta.priority}`,
                `Days: ${meta.daysRemaining}`,
              ];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: { day: 'MMM d', week: 'MMM d', month: 'MMM yyyy' },
          },
          min: minTime,
          max: maxTime,
          grid: { 
            color: 'rgba(148, 163, 184, 0.1)',
            drawBorder: true,
            drawTicks: true,
          },
          ticks: { 
            maxTicksLimit: 12,
            font: { size: 11, weight: '500' },
            color: 'rgba(100, 116, 139, 0.8)',
          },
        },
        y: {
          grid: { display: false },
          ticks: { 
            font: { size: 11, weight: '600' }, 
            maxRotation: 0,
            color: 'rgba(15, 23, 42, 0.7)',
            padding: 12,
          },
        },
      },
    };

    return { chartData: data, options: opts };
  }, [tasks]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="ml-56 flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gantt Chart</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">Project timeline visualization with task progress and status</p>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-4 h-4 rounded-md bg-emerald-500"></div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Completed</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Done</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-4 h-4 rounded-md bg-indigo-500"></div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">In Progress</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-4 h-4 rounded-md bg-red-500"></div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blocked</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Waiting</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-4 h-4 rounded-md bg-slate-400"></div>
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Todo</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        {loading ? (
          <div className="flex items-center justify-center h-96 text-slate-400">
            <div className="text-center">
              <p className="text-lg font-semibold">Loading timeline...</p>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-slate-400 gap-4">
            <Calendar size={48} className="opacity-40" />
            <p className="text-sm font-medium">No tasks to display</p>
            <p className="text-xs text-slate-500">Create tasks with due dates to see them in the Gantt chart</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden h-[600px] hover:shadow-xl transition-shadow">
            <Bar data={chartData} options={options} />
          </div>
        )}

        {/* Stats Box */}
        {!loading && tasks.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Total Tasks</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.length}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={16} className="text-indigo-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">In Progress</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.filter(t => (t.effectiveStatus || t.status) === 'In Progress').length}</p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Blocked</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tasks.filter(t => (t.effectiveStatus || t.status) === 'Blocked').length}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
