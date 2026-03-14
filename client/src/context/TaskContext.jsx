import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

// Compute effective status: auto-computes Blocked and In Progress
export function computeEffectiveStatus(task) {
    // First, check if blocked by dependencies
    if (task.dependsOn && task.dependsOn.length > 0) {
        const isBlocked = task.dependsOn.some(
            (dep) => typeof dep === 'object' && dep.status !== 'Done'
        );
        if (isBlocked) return 'Blocked';
    }
    
    // If explicitly done, return done
    if (task.status === 'Done') return 'Done';
    
    // If user explicitly set to In Progress, preserve it
    if (task.status === 'In Progress') return 'In Progress';
    
    // Auto-compute In Progress based on due date urgency
    // Tasks due within 3 days (including overdue) automatically become urgent/In Progress
    if (task.dueDate) {
        const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
        if (daysUntilDue <= 3 && daysUntilDue > -Infinity) {
            return 'In Progress';
        }
    }
    
    // Otherwise, return the user-selected status (typically Todo)
    return task.status;
}

// Auto-compute priority from due date proximity
export function computeEffectivePriority(task) {
    if (!task.dueDate) return 'Medium';
    const daysUntilDue = Math.ceil((new Date(task.dueDate) - new Date()) / 86400000);
    if (daysUntilDue <= 1) return 'High';   // overdue or due today/tomorrow
    if (daysUntilDue <= 5) return 'Medium'; // due within 5 days
    return 'Low';                            // due later
}

// Returns list of dependency titles that are blocking this task
export function getBlockingDeps(task) {
    if (!task.dependsOn || task.dependsOn.length === 0) return [];
    return task.dependsOn
        .filter((dep) => typeof dep === 'object' && dep.status !== 'Done')
        .map((dep) => dep.title);
}

function taskReducer(state, action) {
    switch (action.type) {
        case 'SET_TASKS':
            return { 
                ...state, 
                tasks: action.payload.tasks, 
                pagination: action.payload.pagination,
                stats: action.payload.stats || state.stats,
                loading: false 
            };
        case 'ADD_TASK':
            return { ...state, tasks: [action.payload, ...state.tasks] };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map((t) => (t._id === action.payload._id ? action.payload : t)),
            };
        case 'DELETE_TASK':
            return { ...state, tasks: state.tasks.filter((t) => t._id !== action.payload) };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'SET_HISTORY':
            return { ...state, history: action.payload };
        default:
            return state;
    }
}

export function TaskProvider({ children }) {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(taskReducer, {
        tasks: [],
        history: [],
        pagination: {
            totalTasks: 0,
            totalPages: 0,
            currentPage: 1,
            limit: 12
        },
        stats: {
            total: 0,
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0
        },
        loading: true,
        error: null,
    });

    const fetchTasks = useCallback(async (page = 1, limit = 12) => {
        if (!user) return;
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { data } = await api.get(`/tasks?page=${page}&limit=${limit}`);
            dispatch({ type: 'SET_TASKS', payload: data });
        } catch (err) {
            dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Failed to fetch tasks' });
        }
    }, [user]);

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get('/tasks/history');
            dispatch({ type: 'SET_HISTORY', payload: data });
        } catch (err) {
            console.error('History fetch error:', err);
        }
    }, [user]);

    useEffect(() => {
        if (user) fetchTasks();
    }, [user, fetchTasks]);

    const addTask = async (taskData) => {
        const { data } = await api.post('/tasks', taskData);
        // After add, go to page 1 to see the new task
        await fetchTasks(1, state.pagination.limit);
        return data;
    };

    const updateTask = async (id, taskData) => {
        const { data } = await api.put(`/tasks/${id}`, taskData);
        // Re-fetch current page so all dependent tasks' effectiveStatus refreshes
        await fetchTasks(state.pagination.currentPage, state.pagination.limit);
        return data;
    };

    const deleteTask = async (id) => {
        await api.delete(`/tasks/${id}`);
        // Re-fetch current page to pull in next task and update counts
        await fetchTasks(state.pagination.currentPage, state.pagination.limit);
    };

    const restoreTask = async (id) => {
        const { data } = await api.put(`/tasks/${id}/restore`);
        dispatch({ type: 'SET_HISTORY', payload: state.history.filter((t) => t._id !== id) });
        // After restore, refresh current page
        await fetchTasks(state.pagination.currentPage, state.pagination.limit);
        return data;
    };

    // Enrich each task with computed effectiveStatus, priority inheritance, and blockingDeps
    const enrichedTasks = useMemo(() => {
        // Build reverse dependency map for priority inheritance
        const taskMap = { byId: {}, dependents: {} };
        state.tasks.forEach(t => {
            taskMap.byId[t._id] = t;
            taskMap.dependents[t._id] = [];
        });
        state.tasks.forEach(t => {
            if (t.dependsOn) {
                t.dependsOn.forEach(dep => {
                    const depId = typeof dep === 'object' ? dep._id : dep;
                    if (taskMap.dependents[depId]) {
                        taskMap.dependents[depId].push(t._id);
                    }
                });
            }
        });

        const memo = {};
        const pVal = { Low: 1, Medium: 2, High: 3 };
        const valP = { 1: 'Low', 2: 'Medium', 3: 'High' };

        function getEffPri(taskId, visiting = new Set()) {
            if (memo[taskId]) return memo[taskId];
            const t = taskMap.byId[taskId];
            if (!t) return pVal['Medium'];

            const basePriority = computeEffectivePriority(t);

            if (visiting.has(taskId)) return pVal[basePriority];
            visiting.add(taskId);

            let maxV = pVal[basePriority];

            // Completed tasks do not bubble up priority demand
            if (t.status !== 'Done') {
                for (const dId of taskMap.dependents[taskId]) {
                    const dTask = taskMap.byId[dId];
                    if (dTask && dTask.status !== 'Done') {
                        const dV = getEffPri(dId, visiting);
                        if (dV > maxV) maxV = dV;
                    }
                }
            }

            visiting.delete(taskId);
            memo[taskId] = maxV;
            return maxV;
        }

        return state.tasks.map((task) => {
            const effPriVal = getEffPri(task._id);
            return {
                ...task,
                effectiveStatus: computeEffectiveStatus(task),
                effectivePriority: valP[effPriVal] || computeEffectivePriority(task),
                blockingDeps: getBlockingDeps(task),
            };
        });
    }, [state.tasks]);

    return (
        <TaskContext.Provider value={{
            ...state,
            tasks: enrichedTasks,
            addTask, updateTask, deleteTask, restoreTask, fetchTasks, fetchHistory,
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export const useTasks = () => useContext(TaskContext);
