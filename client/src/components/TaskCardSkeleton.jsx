export default function TaskCardSkeleton() {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
                </div>
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
        </div>
    );
}