import { useState } from 'react';
import { Calendar, Clock, GitFork, Pencil, Trash2, RotateCcw, AlertTriangle, CheckCircle2, X, FileText, Paperclip } from 'lucide-react';

const priorityColors = {
    High: 'bg-gradient-to-r from-red-50 to-orange-50 text-red-700 dark:from-red-900/40 dark:to-orange-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50 font-semibold',
    Medium: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 dark:from-amber-900/40 dark:to-yellow-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 font-semibold',
    Low: 'bg-gradient-to-r from-sky-50 to-cyan-50 text-sky-700 dark:from-sky-900/40 dark:to-cyan-900/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 font-semibold',
};

const statusColors = {
    Done: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 dark:from-emerald-900/40 dark:to-green-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50',
    Todo: 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
    'In Progress': 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 dark:from-indigo-900/40 dark:to-purple-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50',
    Blocked: 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 dark:from-red-900/40 dark:to-rose-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50',
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

export default function TaskCard({ task, onView, onEdit, onDelete, onRevert, onComplete, bulkMode, isSelected, onToggleSelect }) {
    const [showDetails, setShowDetails] = useState(false);
    // Use effectiveStatus (auto-computed) for display; fall back to stored status
    const displayStatus = task.effectiveStatus || task.status;
    const isBlocked = displayStatus === 'Blocked';
    const createdDate = formatDate(task.createdAt);
    const dueDate = task.dueDate ? formatDate(task.dueDate) : null;
    const overdue = isDueOverdue(task.dueDate) && displayStatus !== 'Done';

    return (
        <>
            <div 
                className={`bg-white dark:bg-slate-900 border rounded-xl p-6 flex flex-col gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative cursor-pointer ${isBlocked
                    ? 'border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 shadow-sm shadow-red-100 dark:shadow-red-950/50'
                    : 'border-slate-200/70 dark:border-slate-700 shadow-sm hover:shadow-lg'
                    } ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-lg' : ''}`}
                onClick={() => !bulkMode && onView && onView(task)}
            >
                {/* Bulk selection checkbox */}
                {bulkMode && (
                    <div className="absolute top-3 right-3 z-10">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect(task._id)}
                            className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
                        />
                    </div>
                )}

                {/* Title */}
                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {task.title}
                </h3>

                {/* Description */}
                {task.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[displayStatus] || statusColors.Todo}`}>
                        {displayStatus}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${priorityColors[task.effectivePriority || task.priority] || priorityColors.Medium}`}>
                        {task.effectivePriority || task.priority}
                    </span>
                    
                    {/* Subtle Attachment Indicator */}
                    {task.attachments?.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Paperclip size={10} className="text-indigo-500" />
                            <span>{task.attachments.length} file{task.attachments.length !== 1 ? 's' : ''}</span>
                        </div>
                    )}
                </div>

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
                            onClick={(e) => { e.stopPropagation(); onRevert && onRevert(task); }}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 hover:shadow-md active:scale-95"
                        >
                            <RotateCcw size={18} />
                            Revert to Todo
                        </button>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onComplete && onComplete(task); }}
                            disabled={isBlocked}
                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-sm transition-all duration-200 border ${isBlocked
                                    ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                                    : 'border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-600 dark:to-teal-600 text-white hover:from-emerald-600 hover:to-teal-600 dark:hover:from-emerald-500 dark:hover:to-teal-500 hover:shadow-lg hover:shadow-emerald-500/20 dark:hover:shadow-emerald-600/20 active:scale-95'
                                }`}
                        >
                            <CheckCircle2 size={18} />
                            Mark as Complete
                        </button>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={11} />
                        <span>{createdDate}</span>
                        <span className="ml-1 font-mono text-slate-400 dark:text-slate-500">#{String(task._id).slice(-8)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {onEdit && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                                className="p-1.5 rounded text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                title="Edit task"
                            >
                                <Pencil size={13} />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                                className="p-1.5 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                title="Delete task"
                            >
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
