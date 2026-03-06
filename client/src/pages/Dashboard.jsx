import { useState, useMemo, useEffect } from 'react';
import { Plus, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatsBar from '../components/StatsBar';
import SearchFilters from '../components/SearchFilters';
import TaskCard from '../components/TaskCard';
import TaskCardSkeleton from '../components/TaskCardSkeleton';
import TaskModal from '../components/TaskModal';
import { useTasks } from '../context/TaskContext';
import api from '../api/axios';
import { toast } from 'sonner';

export default function Dashboard() {
    const { tasks, loading, deleteTask, updateTask } = useTasks();
    const [modalOpen, setModalOpen] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [priorityFilter, setPriorityFilter] = useState('All Priority');
    const [selectedTasks, setSelectedTasks] = useState(new Set());
    const [bulkMode, setBulkMode] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + N for new task
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                openAdd();
            }
            // Ctrl/Cmd + / for search focus
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                document.querySelector('input[placeholder*="Search"]')?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            const matchSearch =
                !search ||
                t.title.toLowerCase().includes(search.toLowerCase()) ||
                t.description?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'All Status' || t.effectiveStatus === statusFilter;
            const matchPriority = priorityFilter === 'All Priority' || t.priority === priorityFilter;
            return matchSearch && matchStatus && matchPriority;
        });
    }, [tasks, search, statusFilter, priorityFilter]);

    const openAdd = () => { setEditTask(null); setModalOpen(true); };
    const openEdit = (task) => { setEditTask(task); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditTask(null); };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) await deleteTask(id);
    };

    const handleRevert = async (task) => {
        await updateTask(task._id, { ...task, status: 'Todo', dependsOn: task.dependsOn?.map(d => d._id || d) });
    };

    const handleComplete = async (task) => {
        await updateTask(task._id, { ...task, status: 'Done', dependsOn: task.dependsOn?.map(d => d._id || d) });
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/tasks/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'tasks.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Tasks exported successfully');
        } catch (err) {
            toast.error('Failed to export tasks');
        }
    };

    // Bulk operations
    const toggleTaskSelection = (taskId) => {
        const newSelected = new Set(selectedTasks);
        if (newSelected.has(taskId)) {
            newSelected.delete(taskId);
        } else {
            newSelected.add(taskId);
        }
        setSelectedTasks(newSelected);
    };

    const selectAllFiltered = () => {
        setSelectedTasks(new Set(filtered.map(t => t._id)));
    };

    const clearSelection = () => {
        setSelectedTasks(new Set());
    };

    const handleBulkDelete = async () => {
        if (selectedTasks.size === 0) return;
        if (!window.confirm(`Delete ${selectedTasks.size} selected tasks?`)) return;

        try {
            await Promise.all(Array.from(selectedTasks).map(id => deleteTask(id)));
            setSelectedTasks(new Set());
            toast.success(`Deleted ${selectedTasks.size} tasks`);
        } catch (err) {
            toast.error('Failed to delete some tasks');
        }
    };

    const handleBulkComplete = async () => {
        if (selectedTasks.size === 0) return;

        try {
            await Promise.all(Array.from(selectedTasks).map(async (id) => {
                const task = tasks.find(t => t._id === id);
                if (task) {
                    await updateTask(id, { ...task, status: 'Done', dependsOn: task.dependsOn?.map(d => d._id || d) });
                }
            }));
            setSelectedTasks(new Set());
            toast.success(`Completed ${selectedTasks.size} tasks`);
        } catch (err) {
            toast.error('Failed to complete some tasks');
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <main className="ml-56 flex-1 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Task Dependencies</h1>
                        <p className="text-sm text-indigo-500 mt-0.5">Manage tasks and their dependency relationships</p>
                        <p className="text-xs text-slate-400 mt-1">💡 Keyboard shortcuts: Ctrl+N (New task), Ctrl+/ (Search)</p>
                    </div>
                    <div className="flex gap-3">
                        {bulkMode && selectedTasks.size > 0 && (
                            <>
                                <button
                                    onClick={handleBulkComplete}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Complete ({selectedTasks.size})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Delete ({selectedTasks.size})
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-4 py-2.5 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                                >
                                    Clear
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setBulkMode(!bulkMode)}
                            className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
                                bulkMode
                                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300'
                            }`}
                        >
                            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            Export CSV
                        </button>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Plus size={16} />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <StatsBar />

                {/* Filters */}
                <SearchFilters
                    search={search} setSearch={setSearch}
                    statusFilter={statusFilter} setStatusFilter={setStatusFilter}
                    priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                />

                {/* Task Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <TaskCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                        <p className="text-sm">{tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((task) => (
                            <TaskCard
                                key={task._id}
                                task={task}
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onRevert={handleRevert}
                                onComplete={handleComplete}
                                bulkMode={bulkMode}
                                isSelected={selectedTasks.has(task._id)}
                                onToggleSelect={toggleTaskSelection}
                            />
                        ))}
                    </div>
                )}
            </main>

            <TaskModal isOpen={modalOpen} onClose={closeModal} editTask={editTask} />
        </div>
    );
}
