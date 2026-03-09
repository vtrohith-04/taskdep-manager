import { Search } from 'lucide-react';

const statuses = ['All Status', 'Todo', 'In Progress', 'Done', 'Blocked'];
const priorities = ['All Priority', 'High', 'Medium', 'Low'];

export default function SearchFilters({ search, setSearch, statusFilter, setStatusFilter, priorityFilter, setPriorityFilter }) {
    return (
        <div className="flex items-center gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                    type="text"
                    placeholder="Search tasks by title or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-5 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm focus:shadow-lg focus:shadow-indigo-500/10"
                />
            </div>

            {/* Status filter */}
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-3 px-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
                {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>

            {/* Priority filter */}
            <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="py-3 px-4 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
            >
                {priorities.map((p) => <option key={p}>{p}</option>)}
            </select>
        </div>
    );
}
