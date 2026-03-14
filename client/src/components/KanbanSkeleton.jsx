export default function KanbanSkeleton() {
    return (
        <div className="flex gap-5 overflow-x-auto pb-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-72 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 shadow-lg h-[540px] animate-pulse">
                    <div className="bg-slate-100 dark:bg-slate-800/50 px-3.5 py-2.5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-5 w-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                    <div className="flex-1 p-3 space-y-3">
                        {[1, 2, 3].map((j) => (
                            <div key={j} className="h-28 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-700 p-3">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                                <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800 rounded mb-4"></div>
                                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
