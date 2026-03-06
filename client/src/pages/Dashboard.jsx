import { useState, useMemo } from 'react';
import { Plus, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import StatsBar from '../components/StatsBar';
import SearchFilters from '../components/SearchFilters';
import TaskCard from '../components/TaskCard';
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

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <main className="ml-56 flex-1 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Task Dependencies</h1>
                        <p className="text-sm text-indigo-500 mt-0.5">Manage tasks and their dependency relationships</p>
                    </div>
                    <div className="flex gap-3">
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
                    <div className="flex items-center justify-center h-48 text-slate-400">Loading tasks...</div>
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
                            />
                        ))}
                    </div>
                )}
            </main>

            <TaskModal isOpen={modalOpen} onClose={closeModal} editTask={editTask} />
        </div>
    );
}
