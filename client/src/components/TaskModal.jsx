import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, GitFork, ChevronDown, ChevronUp, Paperclip, Loader2, Trash2, FileText, Clock } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import api from '../api/axios';
import { toast } from 'sonner';
import TaskTemplates from './TaskTemplates';

const defaultForm = {
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    dependsOn: [],
    attachments: [],
    dueDate: '',
};

export default function TaskModal({ isOpen, onClose, editTask, isViewOnly }) {
    const { tasks, addTask, updateTask } = useTasks();
    const [form, setForm] = useState(defaultForm);
    const [saving, setSaving] = useState(false);
    const [depsOpen, setDepsOpen] = useState(false);
    const [templatesOpen, setTemplatesOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

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
                attachments: editTask.attachments || [],
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
    const selectedDeps = tasks.filter(t => form.dependsOn.includes(t._id));

    const toggleDep = (id) => {
        if (isViewOnly) return;
        setForm((f) => ({
            ...f,
            dependsOn: f.dependsOn.includes(id)
                ? f.dependsOn.filter((d) => d !== id)
                : [...f.dependsOn, id],
        }));
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation (e.g. max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('attachment', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(prev => ({
                ...prev,
                attachments: [...prev.attachments, res.data]
            }));
            toast.success('File attached');
        } catch (error) {
            toast.error('File upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeAttachment = async (publicId, index) => {
        if (isViewOnly) return;
        // Optimistic UI update
        const newAttachments = [...form.attachments];
        newAttachments.splice(index, 1);
        setForm(prev => ({ ...prev, attachments: newAttachments }));

        try {
            await api.delete(`/upload/${publicId}`);
        } catch (error) {
            toast.error('Failed to delete file from server');
            // Revert on failure could be implemented here
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isViewOnly) return;
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

    const inputCls = 'w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition disabled:opacity-70';
    const labelCls = 'block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col animate-modalIn">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                    <h2 className="font-semibold text-slate-800 dark:text-white text-base">
                        {isViewOnly ? 'Task Details' : editTask ? 'Edit Task' : 'New Task'}
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                        <X size={16} />
                    </button>
                </div>

                {/* Form — scrollable */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {/* Templates - only for new tasks */}
                    {!editTask && !isViewOnly && (
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
                        <label className={labelCls}>Title {!isViewOnly && '*'}</label>
                        {isViewOnly ? (
                            <div className="text-base font-bold text-slate-900 dark:text-white px-1 leading-snug">
                                {form.title}
                            </div>
                        ) : (
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="Task title..."
                                className={inputCls}
                            />
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelCls}>Description</label>
                        {isViewOnly ? (
                            <div className="text-sm text-slate-600 dark:text-slate-300 px-1 whitespace-pre-wrap leading-relaxed">
                                {form.description || <span className="text-slate-400 italic">No description provided.</span>}
                            </div>
                        ) : (
                            <textarea
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Describe this task..."
                                rows={3}
                                className={`${inputCls} resize-none`}
                            />
                        )}
                    </div>

                    {/* Meta Fields Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Status */}
                        <div>
                            <label className={labelCls}>Status</label>
                            {isViewOnly ? (
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    form.status === 'Done' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' :
                                    form.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50' :
                                    form.status === 'Blocked' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50' :
                                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                }`}>
                                    {form.status}
                                </span>
                            ) : (
                                <select
                                    value={form.status}
                                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="Todo">Todo</option>
                                    <option value="In Progress">In Progress (can also be auto-set)</option>
                                    <option value="Done">Done</option>
                                </select>
                            )}
                        </div>

                        {/* Priority */}
                        <div>
                            <label className={labelCls}>Priority</label>
                            {isViewOnly ? (
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                                    form.priority === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/50' :
                                    form.priority === 'Medium' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50' :
                                    'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800/50'
                                }`}>
                                    {form.priority}
                                </span>
                            ) : (
                                <select
                                    value={form.priority}
                                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                                    className={inputCls}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            )}
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className={labelCls}>Due Date {!isViewOnly && <span className="text-slate-400 font-normal">(optional)</span>}</label>
                        {isViewOnly ? (
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 px-1 font-medium">
                                <Clock size={14} className="text-slate-400" />
                                {form.dueDate ? new Date(form.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No due date'}
                            </div>
                        ) : (
                            <input
                                type="date"
                                value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                className={inputCls}
                            />
                        )}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className={labelCls}>Attachments</label>
                        <div className="flex flex-col gap-3">
                            {form.attachments.length > 0 && (
                                <ul className="space-y-2">
                                    {form.attachments.map((att, i) => {
                                         const isImage = att.url?.match(/\.(jpg|jpeg|png|webp|gif)$|cloudinary/);
                                         return (
                                            <li key={att.publicId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors group/att">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {isImage ? (
                                                         <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-800">
                                                            <img 
                                                                src={att.url.replace('/upload/', '/upload/w_200,c_fill,g_auto,q_auto/')} 
                                                                alt="" 
                                                                className="w-full h-full object-cover group-hover/att:scale-110 transition-transform"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/30">
                                                            <FileText size={18} className="text-indigo-500" />
                                                        </div>
                                                    )}
                                                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline truncate">
                                                        {att.originalName || 'Attachment'}
                                                    </a>
                                                </div>
                                                {!isViewOnly && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(att.publicId, i)}
                                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors shrink-0"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </li>
                                         );
                                    })}
                                </ul>
                            )}
                            
                            {!isViewOnly && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800' : 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-indigo-400 dark:hover:border-indigo-600'}`}
                                    >
                                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                                        {uploading ? 'Uploading...' : 'Attach File'}
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Depends On — collapsible scrollable list */}
                    {(!isViewOnly || form.dependsOn.length > 0) && (
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
                                        <span className="text-indigo-500 dark:text-indigo-400">({form.dependsOn.length} {isViewOnly ? '' : 'selected'})</span>
                                    )}
                                </span>
                                {depsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                            {depsOpen && (
                                <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 px-3 py-2">
                                    {!isViewOnly && <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Auto-blocks this task until all are Done</p>}
                                    {isViewOnly ? (
                                        <ul className="space-y-1.5 py-1">
                                            {selectedDeps.map(t => (
                                                 <li key={t._id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                     <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate font-medium">{t.title}</span>
                                                     <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                                                         t.effectiveStatus === 'Done' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                     }`}>{t.effectiveStatus}</span>
                                                 </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        availableTasks.length === 0 ? (
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
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`px-4 py-2 text-sm transition-colors rounded-lg ${isViewOnly ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold w-full sm:w-auto' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {isViewOnly ? 'Close View' : 'Cancel'}
                        </button>
                        {!isViewOnly && (
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                            >
                                {saving ? 'Saving...' : editTask ? 'Save Changes' : 'Create Task'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
