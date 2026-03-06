import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { user, login, register, loading } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showPw, setShowPw] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });

    if (user) return <Navigate to="/dashboard" replace />;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLogin) {
            await login(form.email, form.password);
        } else {
            await register(form.name, form.email, form.password);
        }
    };

    const toggle = () => {
        setIsLogin((v) => !v);
        setForm({ name: '', email: '', password: '' });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-bold">TD</div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-white">TaskDep</p>
                            <p className="text-xs text-slate-400">Task Dependency Manager</p>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">
                        {isLogin ? 'Welcome back' : 'Create account'}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        {isLogin ? 'Sign in to manage your tasks.' : 'Get started with TaskDep.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="John Doe"
                                    className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="you@example.com"
                                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    required
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2.5 pr-10 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
                                />
                                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                        {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                        <button onClick={toggle} className="text-indigo-500 hover:text-indigo-600 font-medium">
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>

                    {/* Demo hint */}
                    {isLogin && (
                        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                Or <span className="font-medium text-slate-700 dark:text-slate-300">register a new account</span> above to get started
                            </p>
                        </div>
                    )}

                    <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        JWT Secured Session
                    </div>
                </div>
            </div>
        </div>
    );
}
