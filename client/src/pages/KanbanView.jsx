import { useState, useMemo } from 'react';
import { Plus, Calendar, AlertTriangle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TaskModal from '../components/TaskModal';
import { useTasks } from '../context/TaskContext';

const statusConfig = {
    Todo: {
        color: 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-slate-700',
        badgeColor: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
        borderColor: 'border-slate-200 dark:border-slate-700',
        headerBg: 'bg-slate-100 dark:bg-slate-800',
        headerText: 'text-slate-700 dark:text-slate-200',
        dotColor: 'bg-slate-400',
    },
    'In Progress': {
        color: 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20',
        badgeColor: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        headerBg: 'bg-indigo-100 dark:bg-indigo-900/40',
        headerText: 'text-indigo-700 dark:text-indigo-300',
        dotColor: 'bg-indigo-500',
    },
    Done: {
        color: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
        badgeColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        headerBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        headerText: 'text-emerald-700 dark:text-emerald-300',
        dotColor: 'bg-emerald-500',
    },
    Blocked: {
        color: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20',
        badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
        borderColor: 'border-red-200 dark:border-red-800',
        headerBg: 'bg-red-100 dark:bg-red-900/40',
        headerText: 'text-red-700 dark:text-red-300',
        dotColor: 'bg-red-500',
    },
};

const priorityColors = {
    High: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    Medium: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    Low: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
};

function TaskCardKanban({ task, onEdit, onDelete }) {
    const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.effectiveStatus !== 'Done';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
            {/* Title */}
            <h4 className="font-semibold text-xs text-slate-800 dark:text-white line-clamp-2 mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {task.title}
            </h4>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 mb-1.5">
                    {task.description}
                </p>
            )}

            {/* Priority badge */}
            <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${priorityColors[task.effectivePriority || task.priority]}`}>
                    {task.effectivePriority || task.priority}
                </span>
            </div>

            {/* Due date and actions */}
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800">
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    <Calendar size={10} />
                    <span>{dueDate || 'No date'}</span>
                    <span className="ml-0.5 font-mono text-slate-400 dark:text-slate-500">#{String(task._id).slice(-6)}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onEdit(task)}
                        className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors text-xs"
                        title="Edit"
                    >
                        ✎
                    </button>
                    <button
                        onClick={() => onDelete(task._id)}
                        className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs"
                        title="Delete"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ status, tasks, onEdit, onDelete, config }) {
    return (
        <div className={`w-72 border rounded-xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-lg h-[540px] ${config.borderColor}`}>
            {/* Header */}
            <div className={`${config.headerBg} px-3.5 py-2.5 flex items-center gap-2 border-b ${config.borderColor} shrink-0`}>
                <div className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`}></div>
                <h3 className={`font-bold text-sm ${config.headerText}`}>{status}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.badgeColor}`}>
                    {tasks.length}
                </span>
            </div>

            {/* Content - Scrollable */}
            <div className={`flex-1 overflow-y-auto p-3 space-y-2.5 ${config.color}`}>
                {tasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                        No tasks
                    </div>
                ) : (
                    tasks.map((task) => (
                        <TaskCardKanban
                            key={task._id}
                            task={task}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default function KanbanView() {
    const { tasks, loading, deleteTask, updateTask } = useTasks();
    const [modalOpen, setModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);

    const groupedTasks = useMemo(() => {
        const grouped = {
            Todo: [],
            'In Progress': [],
            Done: [],
            Blocked: [],
        };

        tasks.forEach((task) => {
            const status = task.effectiveStatus || task.status;
            if (grouped[status]) {
                grouped[status].push(task);
            }
        });

        return grouped;
    }, [tasks]);

    const openAdd = () => {
        setEditTask(null);
        setModalOpen(true);
    };

    const openEdit = (task) => {
        setEditTask(task);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditTask(null);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) {
            await deleteTask(id);
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <main className="ml-56 flex-1 p-7">
                {/* Header */}
                <div className="flex items-center justify-between mb-7">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Kanban Board</h1>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            Organize tasks by status and track progress.
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                </div>

                {/* Kanban Board */}
                {loading ? (
                    <div className="flex items-center justify-center h-96 text-slate-400">
                        <div className="animate-spin mr-3">⚙️</div>
                        Loading tasks...
                    </div>
                ) : (
                    <div className="flex gap-5 overflow-x-auto pb-3">
                        {Object.entries(statusConfig).map(([status, config]) => (
                            <KanbanColumn
                                key={status}
                                status={status}
                                tasks={groupedTasks[status] || []}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                config={config}
                            />
                        ))}
                    </div>
                )}

                {/* Stats Footer */}
                {!loading && (
                    <div className="mt-6 grid grid-cols-4 gap-3">
                        {Object.entries(statusConfig).map(([status, config]) => (
                            <div key={status} className={`p-3 rounded-lg border ${config.borderColor} ${config.color}`}>
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>
                                    <p className={`text-xs font-semibold ${config.headerText}`}>{status}</p>
                                </div>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                    {groupedTasks[status]?.length || 0}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <TaskModal isOpen={modalOpen} onClose={closeModal} editTask={editTask} />
        </div>
    );
}
