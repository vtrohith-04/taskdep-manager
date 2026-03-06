const TASK_TEMPLATES = {
    'Bug Fix': {
        title: 'Fix bug: [Brief description]',
        description: 'Steps to reproduce:\n1. \n2. \n3. \n\nExpected behavior:\n\nActual behavior:',
        status: 'Todo',
        priority: 'High'
    },
    'Feature Development': {
        title: 'Implement feature: [Feature name]',
        description: 'Requirements:\n- \n- \n- \n\nAcceptance criteria:\n- \n- \n- ',
        status: 'Todo',
        priority: 'Medium'
    },
    'Code Review': {
        title: 'Review PR: [PR title]',
        description: 'PR Link: \n\nReview checklist:\n- Code quality\n- Tests\n- Documentation\n- Performance',
        status: 'Todo',
        priority: 'Medium'
    },
    'Meeting': {
        title: 'Meeting: [Meeting topic]',
        description: 'Attendees:\n- \n- \n\nAgenda:\n1. \n2. \n3. \n\nDuration: [X] minutes',
        status: 'Todo',
        priority: 'Low'
    },
    'Documentation': {
        title: 'Update documentation: [Topic]',
        description: 'What needs to be documented:\n\nCurrent documentation location:\n\nUpdates needed:',
        status: 'Todo',
        priority: 'Low'
    }
};

export default function TaskTemplates({ onSelectTemplate }) {
    return (
        <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                Quick Templates
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {Object.entries(TASK_TEMPLATES).map(([name, template]) => (
                    <button
                        key={name}
                        onClick={() => onSelectTemplate(template)}
                        className="text-left p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                        <div className="font-medium text-sm text-slate-800 dark:text-white">
                            {name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {template.title}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}