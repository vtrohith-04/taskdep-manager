import { Search } from 'lucide-react';

const statuses = ['All Status', 'Todo', 'In Progress', 'Done', 'Blocked'];
const priorities = ['All Priority', 'High', 'Medium', 'Low'];

export default function SearchFilters({ search, setSearch, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                />
            </div>

            {/* Status filter */}
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2.5 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            >
                {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>

            {/* Priority filter */}
            <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-2.5 px-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            >
                {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
        </div>
    );
}
