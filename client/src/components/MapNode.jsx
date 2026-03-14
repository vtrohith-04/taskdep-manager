import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Circle, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

const statusColors = {
    Todo: 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400',
    'In Progress': 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400',
    Done: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
    Blocked: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
};

const priorityColors = {
    High: 'bg-red-500',
    Medium: 'bg-amber-500',
    Low: 'bg-sky-500',
};

const StatusIcon = ({ status, size = 12 }) => {
    if (status === 'Done') return <CheckCircle2 size={size} />;
    if (status === 'Blocked') return <AlertTriangle size={size} />;
    if (status === 'In Progress') return <Clock size={size} className="animate-pulse" />;
    return <Circle size={size} />;
};

export default memo(({ data }) => {
    const { task, critical } = data;
    const status = task.effectiveStatus || task.status;
    const priority = task.effectivePriority || task.priority;

    return (
        <div className={`p-0.5 rounded-xl transition-all duration-300 ${critical ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/20 scale-105' : 'bg-slate-200 dark:bg-slate-700'} group hover:scale-110 active:scale-95`}>
            <div className={`px-4 py-3 rounded-[10px] min-w-[180px] border shadow-sm transition-all duration-300 ${statusColors[status] || statusColors.Todo} ${critical ? 'border-transparent bg-white/95 dark:bg-slate-900/95' : 'bg-white dark:bg-slate-900'}`}>
                
                {/* Priority Horizontal Bar */}
                <div className={`absolute top-0 left-4 right-4 h-1 rounded-b-full ${priorityColors[priority] || priorityColors.Medium}`} />

                <div className="flex flex-col gap-1.5 mt-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                            {priority}
                        </span>
                        <div className={critical ? 'text-red-500' : 'opacity-40'}>
                            <StatusIcon status={status} />
                        </div>
                    </div>
                    
                    <h3 className="text-xs font-bold leading-tight pr-2">
                        {task.title}
                    </h3>
                </div>

                {/* React Flow Handles */}
                <Handle
                    type="target"
                    position={Position.Left}
                    className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900"
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-2 !h-2 !bg-indigo-500 !border-2 !border-white dark:!border-slate-900"
                />
            </div>
        </div>
    );
});
