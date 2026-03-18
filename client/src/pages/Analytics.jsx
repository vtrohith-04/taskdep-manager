import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  Clock3,
  History,
  GitFork,
  Layers3,
  PencilLine,
  RotateCcw,
  TimerReset,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

const STATUS_COLORS = {
  Todo: '#94a3b8',
  'In Progress': '#0ea5e9',
  Completed: '#10b981',
  Blocked: '#f43f5e',
};

const PRIORITY_TONES = {
  High: 'from-rose-500 to-orange-500',
  Medium: 'from-amber-400 to-yellow-500',
  Low: 'from-sky-500 to-cyan-500',
};

const ACTIVITY_FILTERS = ['All', 'Created', 'Updated', 'Deleted', 'Restored'];

function formatDelta(value) {
  if (value === 0) return 'No change';
  return `${value > 0 ? '+' : ''}${value}`;
}

function formatShortDate(value) {
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function getActivityMeta(description = '') {
  const normalized = description.toLowerCase();

  if (normalized.startsWith('created')) {
    return {
      label: 'Created',
      icon: CheckCircle2,
      chipClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      dotClass: 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/70',
    };
  }

  if (normalized.startsWith('deleted')) {
    return {
      label: 'Deleted',
      icon: Trash2,
      chipClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
      dotClass: 'bg-rose-500 ring-rose-100 dark:ring-rose-950/70',
    };
  }

  if (normalized.startsWith('restored')) {
    return {
      label: 'Restored',
      icon: RotateCcw,
      chipClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      dotClass: 'bg-amber-500 ring-amber-100 dark:ring-amber-950/70',
    };
  }

  if (normalized.startsWith('changed')) {
    return {
      label: 'Updated',
      icon: PencilLine,
      chipClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      dotClass: 'bg-sky-500 ring-sky-100 dark:ring-sky-950/70',
    };
  }

  return {
    label: 'Activity',
    icon: History,
    chipClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    dotClass: 'bg-slate-500 ring-slate-100 dark:ring-slate-900/70',
  };
}

function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  collapsible = false,
  defaultOpen = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-[28px] border border-slate-200/70 bg-white/90 p-4 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.5)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80 md:p-6 ${className}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-950 dark:text-white">{title}</p>
          {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              type="button"
              onClick={() => setIsOpen((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
              aria-expanded={isOpen}
            >
              <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Icon size={20} />
          </div>
        </div>
      </div>
      <div className={`${collapsible && !isOpen ? 'hidden md:block' : 'block'}`}>
        {children}
      </div>
    </div>
  );
}

function MetricCard({ label, value, note, accent, icon: Icon }) {
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/85 md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
          {note && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{note}</p>}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br p-3 text-white shadow-lg ${accent}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState('All');
  const [activityReady, setActivityReady] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get('/tasks/analytics');
        setData(response.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const statusData = useMemo(() => {
    if (!data) return [];
    return [
      { name: 'Todo', value: data.stats.todo },
      { name: 'In Progress', value: data.stats.inProgress },
      { name: 'Completed', value: data.stats.done },
      { name: 'Blocked', value: data.stats.blocked },
    ].filter((item) => item.value > 0);
  }, [data]);

  const matrixData = useMemo(() => {
    if (!data) return [];
    return data.priorityStatusMatrix.map((row) => ({
      priority: row.priority,
      Todo: row.todo,
      'In Progress': row.inProgress,
      Blocked: row.blocked,
      Completed: row.done,
    }));
  }, [data]);

  const completionRate = useMemo(() => {
    if (!data || data.stats.total === 0) return 0;
    return Math.round((data.stats.done / data.stats.total) * 100);
  }, [data]);

  const filteredRecentActivity = useMemo(() => {
    if (!data) return [];
    if (activityFilter === 'All') return data.recentActivity;

    return data.recentActivity.filter((activity) => getActivityMeta(activity.description).label === activityFilter);
  }, [activityFilter, data]);

  useEffect(() => {
    setActivityReady(false);
    const timer = setTimeout(() => setActivityReady(true), 20);
    return () => clearTimeout(timer);
  }, [activityFilter, data?.recentActivity?.length]);

  if (loading) {
    return (
      <div className="p-6 pt-20 flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto animate-pulse text-sky-500" size={44} />
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Building your analytics view...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 pt-20 flex min-h-[420px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto text-rose-500" size={42} />
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">Analytics data is unavailable right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 px-4 pb-6 pt-16 md:space-y-6 md:px-8 md:pb-8 md:pt-6">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 px-5 py-5 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80 md:px-8 md:py-8">
        <div className="absolute inset-0 opacity-80">
          <div className="absolute -top-16 right-0 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/15" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl dark:bg-emerald-500/10" />
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Workspace Intelligence</p>
            <h1 className="mt-3 flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              <BarChart3 className="text-sky-500" size={32} />
              Analytics
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              A cleaner view of delivery pace, task health, cycle time, and the work that is putting pressure on your board.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Completion"
              value={`${completionRate}%`}
              note="Done across active tasks"
              icon={CheckCircle2}
              accent="from-emerald-500 to-teal-500"
            />
            <MetricCard
              label="Blocked"
              value={data.stats.blocked}
              note="Dependency constrained"
              icon={GitFork}
              accent="from-rose-500 to-orange-500"
            />
            <MetricCard
              label="Overdue"
              value={data.stats.overdue}
              note="Need immediate attention"
              icon={AlertCircle}
              accent="from-amber-500 to-orange-500"
            />
            <MetricCard
              label="On-Time"
              value={`${data.execution.onTimeCompletionRate}%`}
              note="Completed by due date"
              icon={Clock3}
              accent="from-sky-500 to-indigo-500"
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <SectionCard
          title="Momentum"
          subtitle="A sharper read on how work is moving this week versus the previous one."
          icon={TrendingUp}
          className="xl:col-span-8"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Completed 7d</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.trends.completedLast7}</p>
              <p className={`mt-2 text-xs font-semibold ${data.trends.completedDelta >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                {formatDelta(data.trends.completedDelta)} vs previous 7 days
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Created 7d</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.trends.createdLast7}</p>
              <p className={`mt-2 text-xs font-semibold ${data.trends.createdDelta <= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}>
                {formatDelta(data.trends.createdDelta)} vs previous 7 days
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Active Load</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.stats.total - data.stats.done}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Tasks still in motion</p>
            </div>
          </div>

          <div className="mt-5 h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.velocity}>
                <defs>
                  <linearGradient id="analyticsVelocity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  fontSize={11}
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [`${value} completed`, 'Tasks']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#analyticsVelocity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Execution"
          subtitle="Cycle time and task aging to show whether work is flowing or sitting."
          icon={TimerReset}
          className="xl:col-span-4"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Avg Cycle Time</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.execution.averageCycleDays}d</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Created to completed</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Avg Open Age</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.execution.averageOpenAgeDays}d</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">For unfinished tasks</p>
            </div>
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Avg Overdue Drift</p>
              <p className="mt-2 text-3xl font-bold text-slate-950 dark:text-white">{data.execution.averageOverdueDays}d</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Late tasks beyond due date</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <SectionCard
          title="Priority Health"
          subtitle="See where pressure is building across high, medium, and low priority work."
          icon={Layers3}
          className="xl:col-span-7"
          collapsible
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={matrixData} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Todo" stackId="status" fill={STATUS_COLORS.Todo} radius={[6, 6, 0, 0]} />
                <Bar dataKey="In Progress" stackId="status" fill={STATUS_COLORS['In Progress']} />
                <Bar dataKey="Blocked" stackId="status" fill={STATUS_COLORS.Blocked} />
                <Bar dataKey="Completed" stackId="status" fill={STATUS_COLORS.Completed} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Status Mix"
          subtitle="A quick distribution snapshot of your current board."
          icon={CheckCircle2}
          className="xl:col-span-5"
          collapsible
        >
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={76}
                  outerRadius={104}
                  paddingAngle={4}
                  stroke="none"
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} tasks`, 'Count']}
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', color: '#fff' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <SectionCard
          title="Critical Focus"
          subtitle="The items most likely to slow the team down."
          icon={AlertCircle}
          className="xl:col-span-4"
          collapsible
        >
          <div className="space-y-3">
            {data.overdueTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-10 text-center dark:border-emerald-800/50 dark:bg-emerald-900/10">
                <CheckCircle2 className="mx-auto text-emerald-500" size={24} />
                <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">No overdue work right now</p>
              </div>
            ) : (
              data.overdueTasks.slice(0, 5).map((task) => (
                <div key={task._id} className="min-h-[108px] rounded-2xl border border-rose-100 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
                  <p
                    className="text-sm font-semibold leading-6 text-slate-900 dark:text-white"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </p>
                  <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-300">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Bottlenecks"
          subtitle="Tasks holding up the largest amount of downstream work."
          icon={GitFork}
          className="xl:col-span-4"
          collapsible
        >
          <div className="space-y-3">
            {data.bottlenecks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No major bottlenecks detected</p>
              </div>
            ) : (
              data.bottlenecks.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex min-h-[92px] items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="min-w-0">
                    <p
                      className="text-sm font-semibold leading-6 text-slate-900 dark:text-white"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Blocks {item.count} task{item.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    {index + 1}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Activity"
          subtitle="The latest changes made across your tasks."
          icon={Activity}
          className="xl:col-span-4"
          collapsible
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {ACTIVITY_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActivityFilter(filter)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activityFilter === filter
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="max-h-[560px] space-y-4 overflow-y-auto pr-1.5 [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-100/80 dark:[&::-webkit-scrollbar-track]:bg-slate-900/70">
            {filteredRecentActivity.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {activityFilter === 'All' ? 'No recent activity yet' : `No ${activityFilter.toLowerCase()} activity yet`}
                </p>
              </div>
            ) : (
              filteredRecentActivity.map((activity, index) => {
                const meta = getActivityMeta(activity.description);
                const ActivityIcon = meta.icon;

                return (
                <div
                  key={activity._id || index}
                  className={`group relative pl-5 transition-all duration-300 ${activityReady ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
                  style={{ transitionDelay: `${Math.min(index * 45, 180)}ms` }}
                >
                  {index !== filteredRecentActivity.length - 1 && (
                    <div className="absolute left-[6px] top-5 bottom-[-18px] w-px bg-slate-200 dark:bg-slate-800" />
                  )}
                  <div className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full ring-4 ${meta.dotClass}`} />
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-slate-300 group-hover:bg-white group-hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:group-hover:border-slate-700 dark:group-hover:bg-slate-900/80">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{activity.description}</p>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.chipClass}`}>
                        <ActivityIcon size={12} />
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )})
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {matrixData.map((row) => (
          <div key={row.priority} className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
            <div className={`inline-flex rounded-full bg-gradient-to-r px-3 py-1 text-xs font-semibold text-white ${PRIORITY_TONES[row.priority]}`}>
              {row.priority} Priority
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Todo</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{row.Todo}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">In Progress</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{row['In Progress']}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Blocked</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{row.Blocked}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900/70">
                <p className="text-slate-500 dark:text-slate-400">Done</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{row.Completed}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
