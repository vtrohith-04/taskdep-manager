import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, History, Sun, Moon, LogOut, ShieldCheck, User, BarChart3, GitBranch, LayoutGrid, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Sidebar({ collapsed, setCollapsed }) {
    const { user, logout } = useAuth();
    const { dark, toggleTheme } = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileOpen]);

    const linkClass = ({ isActive }) =>
        `flex items-center ${collapsed ? 'justify-center px-0 gap-0' : 'gap-3 px-4'} py-3 rounded-lg text-sm font-semibold transition-all duration-200 relative ${isActive
            ? 'bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-700 dark:from-indigo-500/30 dark:to-purple-500/20 dark:text-indigo-300 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 hover:text-slate-800 dark:hover:text-slate-300'
        }`;

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className={`flex items-center ${collapsed ? 'justify-center px-2 flex-col gap-2' : 'gap-3 px-5'} py-6 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50`}>
                <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/40">
                    TD
                </div>
                {!collapsed && <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight shrink-0">TaskDep</span>}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className={`hidden md:flex p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors ${!collapsed ? 'ml-auto' : ''}`}
                    title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    <Menu size={18} />
                </button>
                {/* Close button - mobile only */}
                <button
                    onClick={() => setMobileOpen(false)}
                    className="ml-auto p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 md:hidden transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
                <NavLink to="/dashboard" className={linkClass} title="Dashboard">
                    <LayoutDashboard size={18} className="shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                </NavLink>
                <NavLink to="/kanban" className={linkClass} title="Kanban Board">
                    <LayoutGrid size={18} className="shrink-0" />
                    {!collapsed && <span>Kanban Board</span>}
                </NavLink>
                <NavLink to="/gantt" className={linkClass} title="Gantt Chart">
                    <BarChart3 size={18} className="shrink-0" />
                    {!collapsed && <span>Gantt Chart</span>}
                </NavLink>
                <NavLink to="/graph" className={linkClass} title="Dependency Graph">
                    <GitBranch size={18} className="shrink-0" />
                    {!collapsed && <span>Dependency Graph</span>}
                </NavLink>
                <NavLink to="/history" className={linkClass} title="Task History">
                    <History size={18} className="shrink-0" />
                    {!collapsed && <span>Task History</span>}
                </NavLink>
            </nav>

            {/* Bottom section */}
            <div className="px-3 pb-4 space-y-2">
                {/* Dark mode toggle */}
                <button
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all`}
                >
                    <div className={`relative shrink-0 w-10 h-5 rounded-full transition-colors overflow-hidden ${dark ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dark ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    {!collapsed && <>
                        <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
                        {dark ? <Moon size={14} className="ml-auto" /> : <Sun size={14} className="ml-auto" />}
                    </>}
                </button>

                {/* User profile */}
                <div className={`border-t border-slate-200/50 dark:border-slate-800/50 pt-4 px-1 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'} mb-2`} title={user?.email}>
                        <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <User size={14} className="text-indigo-500" />
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        )}
                    </div>
                    {/* JWT Secured badge */}
                    {!collapsed ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-md mb-2">
                            <ShieldCheck size={12} className="text-emerald-500" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">JWT Secured</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center mb-2" title="JWT Secured">
                            <ShieldCheck size={14} className="text-emerald-500" />
                        </div>
                    )}
                    <button
                        onClick={logout}
                        title="Sign Out"
                        className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2 px-2'} py-1.5 text-xs text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors rounded-md hover:bg-red-50 dark:hover:bg-red-900/20`}
                    >
                        <LogOut size={13} className="shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile hamburger button */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed top-4 left-4 z-30 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors md:hidden"
                aria-label="Open navigation"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fadeIn"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar - desktop: always visible, mobile: slide-in */}
            <aside className={`
                fixed top-0 left-0 h-screen ${collapsed ? 'w-20' : 'w-56'} flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 shadow-lg dark:shadow-slate-950/50 z-50
                transition-all duration-300 ease-in-out
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0 md:z-10
            `}>
                {sidebarContent}
            </aside>
        </>
    );
}
