import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, Sun, Moon, LogOut, ShieldCheck, User, BarChart3, GitBranch } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const { dark, toggleTheme } = useTheme();

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
            ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'
            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
        }`;

    return (
        <aside className="fixed top-0 left-0 h-screen w-56 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10">
            {/* Logo */}
            <div className="flex items-center gap-2.5 px-5 py-5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    TD
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-base">TaskDep</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                <NavLink to="/dashboard" className={linkClass}>
                    <LayoutDashboard size={18} />
                    Dashboard
                </NavLink>
                <NavLink to="/gantt" className={linkClass}>
                    <BarChart3 size={18} />
                    Gantt Chart
                </NavLink>
                <NavLink to="/graph" className={linkClass}>
                    <GitBranch size={18} />
                    Dependency Graph
                </NavLink>
                <NavLink to="/history" className={linkClass}>
                    <History size={18} />
                    Task History
                </NavLink>
            </nav>

            {/* Bottom section */}
            <div className="px-3 pb-4 space-y-2">
                {/* Dark mode toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                    <div className={`relative w-10 h-5 rounded-full transition-colors overflow-hidden ${dark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
                    {dark ? <Moon size={14} className="ml-auto" /> : <Sun size={14} className="ml-auto" />}
                </button>

                {/* User profile */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 px-1">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <User size={14} className="text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    {/* JWT Secured badge */}
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md mb-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">JWT Secured</span>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <LogOut size={13} />
                        Sign Out
                    </button>
                </div>
            </div>
        </aside>
    );
}
