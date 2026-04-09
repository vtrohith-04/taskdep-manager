import { BellRing, CheckCircle2 } from 'lucide-react';
import { formatDateDMY } from '../utils/dateFormat';

export default function NotificationPanel({ notifications, loading = false, compact = false }) {
    const safeNotifications = notifications || {
        summary: {
            upcoming: 0,
            overdue: 0,
            highPriority: 0,
            blockedUrgent: 0,
        },
        items: [],
    };
    const totalAlerts = safeNotifications.items.length;

    const wrapperClass = compact
        ? 'max-h-[min(84vh,46rem)] overflow-hidden rounded-[28px] border border-slate-200/80 dark:border-slate-700/80 bg-white/95 dark:bg-slate-900/95 shadow-[0_30px_80px_-28px_rgba(15,23,42,0.7)] backdrop-blur-xl'
        : '';

    return (
        <div className={wrapperClass}>
            <div className={compact ? 'flex max-h-[inherit] flex-col' : ''}>
                <div className={`${compact ? 'shrink-0 border-b border-slate-200/70 bg-white/90 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/90 sm:px-5' : 'mb-5'}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className={`font-semibold text-slate-950 dark:text-white ${compact ? 'text-xl tracking-tight' : 'text-lg'}`}>
                                {compact ? 'Notification Center' : 'Notifications'}
                            </p>
                            <p className={`mt-1 text-slate-500 dark:text-slate-400 ${compact ? 'text-[13px] leading-5' : 'text-sm'}`}>
                                Actionable alerts for upcoming deadlines, urgent work, and blocked tasks.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {totalAlerts} active
                            </span>
                            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                <BellRing size={18} />
                            </div>
                        </div>
                    </div>

                    <div className={`mt-4 grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-4'}`}>
                        <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Upcoming</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{safeNotifications.summary.upcoming}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Due within 3 days</p>
                        </div>
                        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/70 p-4 dark:border-rose-900/40 dark:bg-rose-900/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">Overdue</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{safeNotifications.summary.overdue}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Past the deadline</p>
                        </div>
                        <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-4 dark:border-sky-800/50 dark:bg-sky-900/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">High Priority</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{safeNotifications.summary.highPriority}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Needs attention soon</p>
                        </div>
                        <div className="rounded-2xl border border-fuchsia-200/70 bg-fuchsia-50/70 p-4 dark:border-fuchsia-800/50 dark:bg-fuchsia-900/10">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-700 dark:text-fuchsia-300">Blocked Soon</p>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{safeNotifications.summary.blockedUrgent}</p>
                            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Blocked with pressure</p>
                        </div>
                    </div>
                </div>

                <div className={`${compact ? 'notification-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-5' : 'mt-5'}`}>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center dark:border-slate-800 dark:bg-slate-900/60">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading notifications...</p>
                            </div>
                        ) : safeNotifications.items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-10 text-center dark:border-emerald-800/50 dark:bg-emerald-900/10">
                                <CheckCircle2 className="mx-auto text-emerald-500" size={24} />
                                <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">No urgent notifications right now</p>
                            </div>
                        ) : (
                            safeNotifications.items.map((item, index) => (
                                <div key={`${item.taskId}-${item.type}-${index}`} className="rounded-[22px] border border-slate-200/70 bg-slate-50/85 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-slate-700 dark:hover:bg-slate-900/90">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    item.type === 'overdue'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                        : item.type === 'blocked'
                                                            ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300'
                                                            : item.type === 'highPriority'
                                                                ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                    {item.label}
                                                </span>
                                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                    {item.status}
                                                </span>
                                                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    item.priority === 'High'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                                                        : item.priority === 'Low'
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                    {item.priority}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{item.title}</p>
                                            <p className="mt-1.5 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{item.message}</p>
                                        </div>
                                        <div className="shrink-0 rounded-2xl bg-white/90 px-4 py-3 text-right shadow-sm dark:bg-slate-950/90">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Due</p>
                                            <p className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                                                {item.dueDate ? formatDateDMY(item.dueDate) : 'No due date'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
