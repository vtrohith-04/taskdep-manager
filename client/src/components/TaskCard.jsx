import { useState } from 'react';
import { Calendar, GitFork, Pencil, Trash2, RotateCcw, AlertTriangle, Clock, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const priorityColors = {
    High: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    Medium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    Low: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
};

const statusColors = {
    Done: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    Todo: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    'In Progress': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
    Blocked: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

function isDueOverdue(dueDate) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
}

export default function TaskCard({ task, onEdit, onDelete, onRevert, onComplete }) {
    const [depsOpen, setDepsOpen] = useState(false);
    // Use effectiveStatus (auto-computed) for display; fall back to stored status
    const displayStatus = task.effectiveStatus || task.status;
    const isBlocked = displayStatus === 'Blocked';
    const createdDate = formatDate(task.createdAt);
    const dueDate = task.dueDate ? formatDate(task.dueDate) : null;
    const overdue = isDueOverdue(task.dueDate) && displayStatus !== 'Done';

    return (
        <div className={`bg-white dark:bg-slate-900 border rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group ${isBlocked
            ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10'
            : 'border-slate-200 dark:border-slate-800'
            }`}>
            {/* Blocked banner */}
            {isBlocked && task.blockingDeps?.length > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400 leading-snug">
                        <span className="font-medium">Blocked by: </span>
                        {task.blockingDeps.join(', ')}
                    </p>
                </div>
            )}

            {/* Title */}
            <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-snug line-clamp-2">
                {task.title}
            </h3>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {task.description}
                </p>
            )}

            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[displayStatus] || statusColors.Todo}`}>
                    {displayStatus}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[task.effectivePriority || task.priority] || priorityColors.Medium}`}>
                    {task.effectivePriority || task.priority}
                </span>
            </div>

            {/* Dependencies — collapsible scrollable list */}
            {task.dependsOn?.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setDepsOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                        <span className="flex items-center gap-1.5">
                            <GitFork size={12} className="shrink-0 text-indigo-400" />
                            Depends on ({task.dependsOn.length})
                        </span>
                        {depsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {depsOpen && (
                        <ul className="max-h-24 overflow-y-auto border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 px-2.5 py-1.5 space-y-1">
                            {task.dependsOn.map((d) => (
                                <li key={typeof d === 'object' ? d._id : d} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                    • {typeof d === 'object' ? (d.title || d._id) : d}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Due Date */}
            {dueDate && (
                <div className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Clock size={11} />
                    <span>{overdue ? 'Overdue · ' : 'Due · '}{dueDate}</span>
                </div>
            )}

            {/* Action Button */}
            <div className="pt-1 pb-1">
                {displayStatus === 'Done' ? (
                    <button
                        onClick={() => onRevert && onRevert(task)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                        <RotateCcw size={16} />
                        Revert to Todo
                    </button>
                ) : (
                    <button
                        onClick={() => onComplete && onComplete(task)}
                        disabled={isBlocked}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-colors border ${isBlocked
                                ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                                : 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                            }`}
                    >
                        <CheckCircle2 size={16} />
                        Mark as Complete
                    </button>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar size={11} />
                    <span>{createdDate}</span>
                </div>

                <div className="flex items-center gap-1">
                    {onEdit && (
                        <button
                            onClick={() => onEdit(task)}
                            className="p-1.5 rounded text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Edit task"
                        >
                            <Pencil size={13} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={() => onDelete(task._id)}
                            className="p-1.5 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete task"
                        >
                            <Trash2 size={13} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
