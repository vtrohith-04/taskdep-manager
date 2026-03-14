export default function GraphSkeleton() {
    return (
        <div className="w-full h-full min-h-[420px] flex flex-col p-8 bg-white dark:bg-slate-900 rounded-xl animate-pulse">
            <div className="flex gap-20">
                {[1, 2, 3].map(col => (
                    <div key={col} className="flex flex-col gap-8">
                        {[1, 2, 3].slice(0, 4 - col).map(node => (
                            <div key={node} className="relative">
                                <div className="w-40 h-11 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"></div>
                                {/* Simple connecting lines look */}
                                {col < 3 && (
                                    <div className="absolute top-1/2 -right-20 w-20 h-[1px] bg-slate-100 dark:bg-slate-800"></div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <div className="mt-auto pt-4 flex gap-4">
                <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-48 bg-slate-100 dark:bg-slate-800 rounded"></div>
            </div>
        </div>
    );
}
