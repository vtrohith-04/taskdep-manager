import { useMemo } from 'react';
import { useTasks } from '../context/TaskContext';
import { ListTodo, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatsBar() {
    const { tasks } = useTasks();

    const stats = useMemo(() => {
        const total = tasks.length;
        const inProgress = tasks.filter((t) => t.effectiveStatus === 'In Progress').length;
        const completed = tasks.filter((t) => t.effectiveStatus === 'Done').length;
        const blocked = tasks.filter((t) => t.effectiveStatus === 'Blocked').length;
        return [
            { label: 'Total', value: total, icon: ListTodo, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
            { label: 'In Progress', value: inProgress, icon: Loader2, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
            { label: 'Blocked', value: blocked, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
        ];
    }, [tasks]);

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
                <div
                    key={s.label}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4"
                >
                    <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                        <s.icon size={20} className={s.color} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{s.value}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
