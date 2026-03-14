import { useState, useEffect } from 'react';
import { RotateCcw, History as HistoryIcon, X } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { useTasks } from '../context/TaskContext';

export default function History() {
    const { history, fetchHistory, restoreTask, loading } = useTasks();
    const [modalOpen, setModalOpen] = useState(false);
    const [viewTask, setViewTask] = useState(null);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const openView = (task) => {
        setViewTask(task);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setViewTask(null);
    };

    return (
        <div className="p-4 pt-16 md:pt-6 md:p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <HistoryIcon size={18} className="text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Task History</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Completed and archived tasks</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading history...</div>
                ) : history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                        <HistoryIcon size={32} className="opacity-30" />
                        <p className="text-sm">No completed or archived tasks yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {history.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                onView={openView}
                                onRevert={!task.deleted ? () => restoreTask(task._id) : undefined}
                            />
                        ))}
                    </div>
                )}
            <TaskModal isOpen={modalOpen} onClose={closeModal} editTask={viewTask} isViewOnly={true} />
        </div>
    );
}
