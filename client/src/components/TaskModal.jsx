import { useState, useEffect } from 'react';
import { X, AlertCircle, GitFork, ChevronDown, ChevronUp } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { toast } from 'sonner';
import TaskTemplates from './TaskTemplates';

const defaultForm = {
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dependsOn: [],
    dueDate: '',
};

export default function TaskModal({ isOpen, onClose, editTask }) {
    const { tasks, addTask, updateTask } = useTasks();
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [depsOpen, setDepsOpen] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);

    const handleSelectTemplate = (template) => {
        setForm(prev => ({
            ...prev,
            title: template.title,
            description: template.description,
            status: template.status,
            priority: template.priority
        }));
        setTemplatesOpen(false);
        toast.success('Template applied!');
    };

    useEffect(() => {
        if (editTask) {
            setForm({
                title: editTask.title || '',
                description: editTask.description || '',
                // Never pre-fill Blocked — store real user intent status
                status: editTask.status === 'Blocked' ? 'Todo' : (editTask.status || 'Todo'),
                priority: editTask.priority || 'Medium',
                dependsOn: editTask.dependsOn?.map((d) => d._id || d) || [],
                dueDate: editTask.dueDate ? editTask.dueDate.split('T')[0] : '',
            });
            setDepsOpen((editTask.dependsOn?.length || 0) > 0);
        } else {
            setForm(defaultForm);
            setDepsOpen(false);
            setTemplatesOpen(false);
        }
    }, [editTask, isOpen]);

    if (!isOpen) return null;

    // Exclude self from dependency options; only show non-deleted tasks
    const availableTasks = tasks.filter((t) => !editTask || t._id !== editTask._id);

    const toggleDep = (id) => {
        setForm((f) => ({
            ...f,
            dependsOn: f.dependsOn.includes(id)
                ? f.dependsOn.filter((d) => d !== id)
                : [...f.dependsOn, id],
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { 
            toast.error('Title is required'); 
            return; 
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                dueDate: form.dueDate || null,
            };
            if (editTask) {
                await updateTask(editTask._id, payload);
                toast.success('Task updated successfully');
            } else {
                await addTask(payload);
                toast.success('Task created successfully');
            }
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Something went wrong';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    const inputCls = 'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition';
    const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h2 className="font-semibold text-slate-800 dark:text-white text-base">
                        {editTask ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                        <X size={16} />
                    </button>
                </div>

                {/* Form — scrollable */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Templates - only for new tasks */}
                    {!editTask && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setTemplatesOpen(!templatesOpen)}
                                className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                            >
                                {templatesOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                Use Template
                            </button>
                            {templatesOpen && (
                                <div className="mt-2">
                                    <TaskTemplates onSelectTemplate={handleSelectTemplate} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className={labelCls}>Title *</label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Task title..."
                            className={inputCls}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelCls}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe this task..."
                            rows={3}
                            className={`${inputCls} resize-none`}
                        />
                    </div>



                    {/* Due Date */}
                    <div>
                        <label className={labelCls}>Due Date <span className="text-slate-400 font-normal">(optional)</span></label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                            className={inputCls}
                        />
                    </div>

                    {/* Depends On — collapsible scrollable list */}
                    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setDepsOpen((o) => !o)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <span className="flex items-center gap-1.5">
                                <GitFork size={14} className="text-indigo-400" />
                                Dependencies
                                {form.dependsOn.length > 0 && (
                                    <span className="text-indigo-500 dark:text-indigo-400">({form.dependsOn.length} selected)</span>
                                )}
                            </span>
                            {depsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        {depsOpen && (
                            <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 px-3 py-2">
                                <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Auto-blocks this task until all are Done</p>
                                {availableTasks.length === 0 ? (
                                    <p className="text-xs text-slate-400 px-2 py-2 italic">No other tasks to depend on yet.</p>
                                ) : (
                                    <ul className="max-h-36 overflow-y-auto space-y-1.5">
                                        {availableTasks.map((t) => {
                                            const checked = form.dependsOn.includes(t._id);
                                            return (
                                                <label key={t._id} className={`flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-md transition-colors ${checked ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleDep(t._id)}
                                                        className="accent-indigo-500 w-3.5 h-3.5 shrink-0"
                                                    />
                                                    <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 line-clamp-1">{t.title}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${t.effectiveStatus === 'Done'
                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                        : t.effectiveStatus === 'Blocked'
                                                            ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                                            : t.effectiveStatus === 'In Progress'
                                                                ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>{t.effectiveStatus}</span>
                                                </label>
                                            );
                                        })}
                                    </ul>
                                )}
                                {form.dependsOn.length > 0 && (
                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-2 flex items-center gap-1">
                                        <GitFork size={11} />
                                        {form.dependsOn.length} dependenc{form.dependsOn.length === 1 ? 'y' : 'ies'} selected
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-5 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                        >
                            {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
