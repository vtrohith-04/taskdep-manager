import { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  BarChart3, TrendingUp, AlertCircle, CheckCircle2, 
  Clock, GitFork, Info, ChevronRight, Activity 
} from 'lucide-react';
import api from '../api/axios';
import { toast } from 'sonner';

const STATUS_COLORS = {
  Todo: '#94a3b8',        // Subtle Grey
  'In Progress': '#6366f1', // Indigo Blue
  Completed: '#10b981',    // Emerald Green
  Blocked: '#ef4444'      // Red
};

const PRIORITY_COLORS = {
  High: '#ef4444',
  Medium: '#f59e0b',
  Low: '#0ea5e9'
};

const AnalyticsCard = ({ title, icon: Icon, children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm ${className}`}>
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
        <Icon size={20} />
      </div>
      <h3 className="font-bold text-slate-800 dark:text-white capitalize">{title}</h3>
    </div>
    {children}
  </div>
);

const KPICard = ({ label, value, subValue, icon: Icon, trend, colorClass }) => (
  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h4>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  </div>
);

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/tasks/analytics');
        setData(data);
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
    ].filter(d => d.value > 0);
  }, [data]);

  const priorityData = useMemo(() => {
    if (!data) return [];
    return Object.entries(data.stats.priority).map(([name, value]) => ({ name, value }));
  }, [data]);

  const completionRate = useMemo(() => {
    if (!data || data.stats.total === 0) return 0;
    return Math.round((data.stats.done / data.stats.total) * 100);
  }, [data]);

  if (loading) {
    return (
      <div className="p-6 pt-20 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Activity className="animate-pulse text-indigo-500" size={48} />
          <p className="text-slate-500 animate-pulse font-medium">Analyzing project data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-16 md:pt-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
          <BarChart3 className="text-indigo-500" size={32} />
          Project Analytics
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Gaining deep insights into your task management performance.
        </p>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          label="Completion Rate" 
          value={`${completionRate}%`}
          subValue="Total project progress"
          icon={CheckCircle2}
          colorClass="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
        />
        <KPICard 
          label="Overdue Tasks" 
          value={data.stats.overdue}
          subValue="Requiring immediate attention"
          icon={AlertCircle}
          colorClass="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
        />
        <KPICard 
          label="Blocked Tasks" 
          value={data.stats.blocked}
          subValue="Waiting on dependencies"
          icon={GitFork}
          colorClass="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
        />
        <KPICard 
          label="Total Active" 
          value={data.stats.total - data.stats.done}
          subValue="Across all workspace layers"
          icon={Clock}
          colorClass="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Completion Velocity */}
        <AnalyticsCard title="Velocity Trend" icon={TrendingUp} className="lg:col-span-2">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.velocity}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    fontSize={10}
                    tick={{ fill: '#94a3b8' }}
                />
                <YAxis fontSize={10} tick={{ fill: '#94a3b8' }} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                   itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#6366f1" fillOpacity={1} fill="url(#colorCompleted)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5 justify-center">
            <Info size={12} />
            Shows tasks completed daily over the last 14 days
          </p>
        </AnalyticsCard>

        {/* Status Distribution */}
        <AnalyticsCard title="Status Distribution" icon={CheckCircle2}>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle" 
                  formatter={(value) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overdue Tasks Column */}
        <AnalyticsCard title="Urgent: Overdue" icon={AlertCircle}>
          <div className="space-y-3 mt-1">
            {data.overdueTasks.length === 0 ? (
              <div className="text-center py-10 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-dashed border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={24} />
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">All caught up!</p>
              </div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {data.overdueTasks.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 group">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{t.title}</h4>
                      <p className="text-[9px] text-red-500 font-bold uppercase mt-0.5">
                        DUE {new Date(t.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnalyticsCard>

        {/* Bottlenecks Column */}
        <AnalyticsCard title="Bottlenecks" icon={GitFork}>
           <div className="space-y-3 mt-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {data.bottlenecks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-10 text-center">No major bottlenecks.</p>
            ) : (
              data.bottlenecks.map((b, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                      {i + 1}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-indigo-500 transition-colors">{b.title}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">BLOCKS {b.count} {b.count === 1 ? 'TASK' : 'TASKS'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </AnalyticsCard>

        {/* Activity Feed Column */}
        <AnalyticsCard title="Live Activity" icon={Activity}>
          <div className="space-y-3 mt-1 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {data.recentActivity.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-10 text-center">No recent activity.</p>
            ) : (
              data.recentActivity.map((a, i) => (
                <div key={i} className="relative pl-5 pb-4 last:pb-0">
                  {i !== data.recentActivity.length - 1 && (
                    <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                  )}
                  <div className="absolute left-0 top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-500 shadow-sm" />
                  
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-lg p-2 border border-slate-100/50 dark:border-slate-800/50">
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium">
                      {a.description}
                    </p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}
