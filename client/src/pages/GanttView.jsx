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
    labels.push((t.title || 'Untitled').slice(0, 30));
    bars.push([start, end]);
    const isDone = t.status === 'Done';
    const isBlocked = (t.effectiveStatus || t.status) === 'Blocked';
    colors.push(isDone ? '#22c55e' : isBlocked ? '#ef4444' : '#6366f1');
  });

  const padding = (maxTime - minTime) * 0.05 || 24 * 60 * 60 * 1000;
  return {
    labels,
    bars,
    colors,
    minTime: minTime - padding,
    maxTime: maxTime + padding,
  };
}

export default function GanttView() {
  const { tasks, loading } = useTasks();

  const { chartData, options } = useMemo(() => {
    const { labels, bars, colors, minTime, maxTime } = buildGanttData(tasks);

    const data = {
      labels,
      datasets: [
        {
          label: 'Task duration',
          data: bars,
          backgroundColor: colors,
          borderColor: colors.map((c) => c),
          borderWidth: 1,
          barThickness: 22,
        },
      ],
    };

    const opts = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const [start, end] = ctx.raw;
              const s = new Date(start).toLocaleDateString();
              const e = new Date(end).toLocaleDateString();
              return `${s} → ${e}`;
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
          grid: { color: 'rgba(0,0,0,0.06)' },
          ticks: { maxTicksLimit: 12 },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 }, maxRotation: 0 },
        },
      },
    };

    return { chartData: data, options: opts };
  }, [tasks]);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="ml-56 flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Gantt Chart</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Timeline view (start = created, end = due date). Green = done, red = blocked, indigo = in progress / todo.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-2">
            <p className="text-sm">No tasks to display. Create tasks with due dates for a better timeline.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden h-[480px]">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </main>
    </div>
  );
}
