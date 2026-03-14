import { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { ListTodo, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatsBar() {
    const { stats } = useTasks();

    const statsData = useMemo(() => {
        return [
            { label: 'Total', value: stats.total, icon: ListTodo, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
            { label: 'In Progress', value: stats.inProgress, icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Completed', value: stats.done, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Blocked', value: stats.blocked, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ];
    }, [stats]);

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-8">
            {statsData.map((s) => (
                <div
                    key={s.label}
                    className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                >
                    <div className={`w-12 h-12 rounded-lg ${s.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <s.icon size={24} className={s.color} />
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{s.value}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
