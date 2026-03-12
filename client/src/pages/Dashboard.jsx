import { useState, useMemo, useEffect } from 'react';
import { Plus, Download, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 12;

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

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, priorityFilter]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedTasks = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const openAdd = () => { setEditTask(null); setModalOpen(true); };
    const openEdit = (task) => { setEditTask(task); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditTask(null); };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this task?')) await deleteTask(id);
    };

    const handleRevert = async (task) => {
        await updateTask(task._id, { 
            status: 'Todo',
            dependsOn: task.dependsOn?.map(d => d._id || d) || []
        });
    };

    const handleComplete = async (task) => {
        await updateTask(task._id, { 
            status: 'Done',
            dependsOn: task.dependsOn?.map(d => d._id || d) || []
        });
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
                    await updateTask(id, { 
                        status: 'Done',
                        dependsOn: task.dependsOn?.map(d => d._id || d) || []
                    });
                }
            }));
            setSelectedTasks(new Set());
            toast.success(`Completed ${selectedTasks.size} tasks`);
        } catch (err) {
            toast.error('Failed to complete some tasks');
        }
    };

    return (
        <div className="p-4 pt-16 md:pt-8 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Task Dependencies</h1>
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1 font-medium">Manage tasks and their dependency relationships</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">💡 Keyboard shortcuts: Ctrl+N (New task), Ctrl+/ (Search)</p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {bulkMode && selectedTasks.size > 0 && (
                            <>
                                <button
                                    onClick={handleBulkComplete}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                                >
                                    Complete ({selectedTasks.size})
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                                >
                                    Delete ({selectedTasks.size})
                                </button>
                                <button
                                    onClick={clearSelection}
                                    className="px-5 py-3 bg-slate-400 hover:bg-slate-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={selectAllFiltered}
                                    className="px-5 py-3 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                                >
                                    Select All
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setBulkMode(!bulkMode)}
                            className={`px-5 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 ${
                                bulkMode
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white'
                                    : 'bg-slate-300 hover:bg-slate-400 text-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-100'
                            }`}
                        >
                            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Select'}
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                        >
                            <Download size={18} />
                            Export CSV
                        </button>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
                        >
                            <Plus size={18} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(6)].map((_, i) => (
                            <TaskCardSkeleton key={i} />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                        <p className="text-sm">{tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedTasks.map((task, index) => (
                            <div key={task._id} className="animate-slideUp" style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}>
                                <TaskCard
                                    task={task}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onRevert={handleRevert}
                                    onComplete={handleComplete}
                                    bulkMode={bulkMode}
                                    isSelected={selectedTasks.has(task._id)}
                                    onToggleSelect={toggleTaskSelection}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    page === currentPage
                                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <span className="ml-3 text-xs text-slate-500 dark:text-slate-400">
                            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            <TaskModal isOpen={modalOpen} onClose={closeModal} editTask={editTask} />
        </div>
    );
}
