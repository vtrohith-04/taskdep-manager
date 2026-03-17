const express = require('express');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const protect = require('../middleware/protect');
const { hasCircularDependency } = require('../utils/graph');
const { z } = require('zod');
const { sendTaskEmail } = require('../utils/mailer');

const router = express.Router();

const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    status: z.enum(['Todo', 'In Progress', 'Done'], { required_error: 'Invalid status' }),
    priority: z.enum(['High', 'Medium', 'Low'], { required_error: 'Invalid priority' }),
    dependsOn: z.array(z.string()).optional().default([]),
    attachments: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
        originalName: z.string().optional(),
    })).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    subtasks: z.array(z.object({
        title: z.string().min(1),
        completed: z.boolean().default(false),
    })).optional().default([]),
});

const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    status: z.enum(['Todo', 'In Progress', 'Done', 'Blocked'], { required_error: 'Invalid status' }).optional(),
    priority: z.enum(['High', 'Medium', 'Low'], { required_error: 'Invalid priority' }).optional(),
    dependsOn: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
        originalName: z.string().optional(),
    })).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    subtasks: z.array(z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        completed: z.boolean(),
    })).optional(),
});

router.use(protect);

function computeStats(tasks) {
    const stats = {
        total: tasks.length,
        todo: 0,
        inProgress: 0,
        done: 0,
        blocked: 0,
    };

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    tasks.forEach((task) => {
        const isBlocked = task.dependsOn && task.dependsOn.length > 0 && task.dependsOn.some((depId) => {
            const dep = tasks.find((candidate) => String(candidate._id) === String(depId));
            return dep && dep.status !== 'Done';
        });

        if (isBlocked) {
            stats.blocked++;
        } else if (task.status === 'Done') {
            stats.done++;
        } else {
            const isAutoInProgress = task.dueDate && new Date(task.dueDate) <= threeDaysFromNow;
            if (task.status === 'In Progress' || isAutoInProgress) {
                stats.inProgress++;
            } else {
                stats.todo++;
            }
        }
    });

    return stats;
}

async function validateDependencyIds(ownerId, dependsOn = []) {
    if (!dependsOn || dependsOn.length === 0) return true;

    const validDeps = await Task.find({
        _id: { $in: dependsOn },
        owner: ownerId,
        deleted: false,
    }).select('_id');

    return validDeps.length === dependsOn.length;
}

router.get('/', async (req, res) => {
    try {
        const fetchAll = req.query.all === 'true';
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const skip = (page - 1) * limit;
        const query = { owner: req.user._id, deleted: false };

        const totalTasks = await Task.countDocuments(query);
        const allUserTasks = await Task.find(query).select('status dependsOn dueDate').lean();
        let taskQuery = Task.find(query)
            .populate('dependsOn', 'title _id status')
            .sort({ createdAt: -1 });

        if (!fetchAll) {
            taskQuery = taskQuery.skip(skip).limit(limit);
        }

        const tasks = await taskQuery.lean();

        res.json({
            tasks,
            stats: computeStats(allUserTasks),
            pagination: {
                totalTasks,
                totalPages: fetchAll ? 1 : Math.ceil(totalTasks / limit),
                currentPage: fetchAll ? 1 : page,
                limit: fetchAll ? totalTasks : limit,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/history', async (req, res) => {
    try {
        const tasks = await Task.find({
            owner: req.user._id,
            $or: [{ deleted: true }, { status: 'Done' }],
        })
            .populate('dependsOn', 'title _id status')
            .sort({ updatedAt: -1 })
            .lean();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/analytics', async (req, res) => {
    try {
        const query = { owner: req.user._id, deleted: false };
        const allTasks = await Task.find(query).select('status priority dueDate dependsOn completedAt title createdAt').lean();

        const stats = {
            total: allTasks.length,
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
            overdue: 0,
            priority: { High: 0, Medium: 0, Low: 0 },
        };

        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const dependentCountMap = {};
        const taskById = new Map(allTasks.map((task) => [String(task._id), task]));
        const priorityStatusMatrix = {
            High: { todo: 0, inProgress: 0, blocked: 0, done: 0 },
            Medium: { todo: 0, inProgress: 0, blocked: 0, done: 0 },
            Low: { todo: 0, inProgress: 0, blocked: 0, done: 0 },
        };
        let onTimeCompleted = 0;
        let cycleTimeTotal = 0;
        let cycleTimeCount = 0;
        let openAgeTotal = 0;
        let openAgeCount = 0;
        let overdueAgeTotal = 0;
        let overdueAgeCount = 0;

        allTasks.forEach((task) => {
            stats.priority[task.priority]++;

            if (task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < now) {
                stats.overdue++;
                overdueAgeTotal += Math.ceil((now - new Date(task.dueDate)) / 86400000);
                overdueAgeCount++;
            }

            const isBlocked = task.dependsOn && task.dependsOn.length > 0 && task.dependsOn.some((depId) => {
                const dep = taskById.get(String(depId));
                dependentCountMap[String(depId)] = (dependentCountMap[String(depId)] || 0) + 1;
                return dep && dep.status !== 'Done';
            });

            if (task.status === 'Done' && task.completedAt && task.createdAt) {
                cycleTimeTotal += Math.max(1, Math.ceil((new Date(task.completedAt) - new Date(task.createdAt)) / 86400000));
                cycleTimeCount++;
                if (!task.dueDate || new Date(task.completedAt) <= new Date(task.dueDate)) {
                    onTimeCompleted++;
                }
            }

            if (isBlocked) {
                stats.blocked++;
                priorityStatusMatrix[task.priority].blocked++;
            } else if (task.status === 'Done') {
                stats.done++;
                priorityStatusMatrix[task.priority].done++;
            } else {
                const isAutoInProgress = task.dueDate && new Date(task.dueDate) <= threeDaysFromNow;
                if (task.status === 'In Progress' || isAutoInProgress) {
                    stats.inProgress++;
                    priorityStatusMatrix[task.priority].inProgress++;
                } else {
                    stats.todo++;
                    priorityStatusMatrix[task.priority].todo++;
                }

                if (task.createdAt) {
                    openAgeTotal += Math.max(1, Math.ceil((now - new Date(task.createdAt)) / 86400000));
                    openAgeCount++;
                }
            }
        });

        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const velocity = {};
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            velocity[date.toISOString().split('T')[0]] = 0;
        }

        allTasks.forEach((task) => {
            if (task.status === 'Done' && task.completedAt && new Date(task.completedAt) >= fourteenDaysAgo) {
                const key = new Date(task.completedAt).toISOString().split('T')[0];
                if (velocity[key] !== undefined) velocity[key]++;
            }
        });

        const velocityData = Object.entries(velocity)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, completed: count }));

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const sevenDaysAgo = new Date(todayStart);
        sevenDaysAgo.setDate(todayStart.getDate() - 6);
        const previousWindowStart = new Date(todayStart);
        previousWindowStart.setDate(todayStart.getDate() - 13);
        const previousWindowEnd = new Date(todayStart);
        previousWindowEnd.setDate(todayStart.getDate() - 7);

        const completedLast7 = allTasks.filter((task) => task.completedAt && new Date(task.completedAt) >= sevenDaysAgo).length;
        const completedPrevious7 = allTasks.filter((task) => {
            if (!task.completedAt) return false;
            const completedAt = new Date(task.completedAt);
            return completedAt >= previousWindowStart && completedAt <= previousWindowEnd;
        }).length;

        const createdLast7 = allTasks.filter((task) => task.createdAt && new Date(task.createdAt) >= sevenDaysAgo).length;
        const createdPrevious7 = allTasks.filter((task) => {
            if (!task.createdAt) return false;
            const createdAt = new Date(task.createdAt);
            return createdAt >= previousWindowStart && createdAt <= previousWindowEnd;
        }).length;

        const bottlenecks = Object.entries(dependentCountMap)
            .map(([id, count]) => {
                const task = taskById.get(id);
                return {
                    title: task?.title || 'Unknown Task',
                    count,
                    status: task ? task.status : 'N/A',
                };
            })
            .filter((task) => task.status !== 'Done')
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            stats,
            velocity: velocityData,
            bottlenecks,
            trends: {
                completedLast7,
                completedPrevious7,
                createdLast7,
                createdPrevious7,
                completedDelta: completedLast7 - completedPrevious7,
                createdDelta: createdLast7 - createdPrevious7,
            },
            execution: {
                averageCycleDays: cycleTimeCount > 0 ? Number((cycleTimeTotal / cycleTimeCount).toFixed(1)) : 0,
                averageOpenAgeDays: openAgeCount > 0 ? Number((openAgeTotal / openAgeCount).toFixed(1)) : 0,
                averageOverdueDays: overdueAgeCount > 0 ? Number((overdueAgeTotal / overdueAgeCount).toFixed(1)) : 0,
                onTimeCompletionRate: stats.done > 0 ? Math.round((onTimeCompleted / stats.done) * 100) : 0,
            },
            priorityStatusMatrix: Object.entries(priorityStatusMatrix).map(([priority, counts]) => ({
                priority,
                ...counts,
            })),
            overdueTasks: allTasks.filter((task) => task.status !== 'Done' && task.dueDate && new Date(task.dueDate) < now),
            recentActivity: await Activity.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('task', 'title')
                .lean(),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const validatedData = createTaskSchema.parse(req.body);
        const {
            title,
            description,
            status,
            priority,
            dependsOn = [],
            attachments = [],
            dueDate,
            subtasks = [],
            tags = [],
        } = validatedData;

        const valid = await validateDependencyIds(req.user._id, dependsOn);
        if (!valid) {
            return res.status(400).json({ message: 'One or more dependency tasks not found' });
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dependsOn,
            attachments,
            subtasks,
            tags,
            owner: req.user._id,
            dueDate: dueDate || null,
            completedAt: status === 'Done' ? new Date() : null,
        });

        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'created',
            description: `Created task "${title}"`,
        });

        const populated = await task.populate('dependsOn', 'title _id status');
        res.status(201).json(populated);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const validatedData = updateTaskSchema.parse(req.body);
        const { title, description, status, priority, dependsOn, attachments, dueDate, subtasks, tags } = validatedData;

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const oldStatus = task.status;

        if (dependsOn !== undefined) {
            const valid = await validateDependencyIds(req.user._id, dependsOn);
            if (!valid) {
                return res.status(400).json({ message: 'One or more dependency tasks not found' });
            }
        }

        if (dependsOn !== undefined && dependsOn.length > 0) {
            const allTasks = await Task.find({ owner: req.user._id, deleted: false }).lean();
            if (hasCircularDependency(allTasks, req.params.id, dependsOn)) {
                return res.status(400).json({ message: 'Circular Dependency Detected' });
            }
        }

        if (title !== undefined) task.title = title;
        if (description !== undefined) task.description = description;
        if (status !== undefined) task.status = status;
        if (priority !== undefined) task.priority = priority;
        if (dependsOn !== undefined) task.dependsOn = dependsOn;
        if (attachments !== undefined) task.attachments = attachments;
        if (dueDate !== undefined) task.dueDate = dueDate || null;
        if (subtasks !== undefined) task.subtasks = subtasks;
        if (tags !== undefined) task.tags = tags;

        if (status === 'Done' && oldStatus !== 'Done') {
            task.completedAt = new Date();
        } else if (status !== undefined && status !== 'Done') {
            task.completedAt = null;
        }

        await task.save();

        if (status !== undefined && status !== oldStatus) {
            await Activity.create({
                user: req.user._id,
                task: task._id,
                action: 'updated_status',
                description: `Changed status of "${task.title}" to ${status}`,
            });
        }

        if (status === 'Done' && oldStatus !== 'Done') {
            await sendTaskEmail(req.user, task, 'completed');
        }

        const populated = await task.populate('dependsOn', 'title _id status');
        res.json(populated);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.deleted = true;
        await task.save();

        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'deleted',
            description: `Deleted task "${task.title}"`,
        });

        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/:id/restore', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.deleted = false;
        task.status = 'Todo';
        task.completedAt = null;
        await task.save();

        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'restored',
            description: `Restored task "${task.title}"`,
        });

        const populated = await task.populate('dependsOn', 'title _id status');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/export', async (req, res) => {
    try {
        const format = String(req.query.format || 'csv').toLowerCase();
        const tasks = await Task.find({ owner: req.user._id, deleted: false })
            .populate('dependsOn', 'title')
            .sort({ createdAt: -1 })
            .lean();

        const esc = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
        const normalizedTasks = tasks.map((task) => ({
            title: task.title,
            description: task.description || '',
            status: task.status,
            priority: task.priority,
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
            dependencies: task.dependsOn.map((dep) => dep.title),
            createdAt: new Date(task.createdAt).toISOString().split('T')[0],
            tags: task.tags || [],
            subtasks: task.subtasks || [],
        }));

        if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename="tasks.json"');
            return res.send(JSON.stringify(normalizedTasks, null, 2));
        }

        if (format === 'txt') {
            const text = normalizedTasks.map((task, index) => {
                const dependencies = task.dependencies.length > 0 ? task.dependencies.join(', ') : 'None';
                const tags = task.tags.length > 0 ? task.tags.join(', ') : 'None';
                const subtasks = task.subtasks.length > 0
                    ? task.subtasks.map((subtask) => `- [${subtask.completed ? 'x' : ' '}] ${subtask.title}`).join('\n')
                    : 'None';

                return [
                    `Task ${index + 1}: ${task.title}`,
                    `Description: ${task.description || 'None'}`,
                    `Status: ${task.status}`,
                    `Priority: ${task.priority}`,
                    `Due Date: ${task.dueDate || 'None'}`,
                    `Dependencies: ${dependencies}`,
                    `Tags: ${tags}`,
                    `Subtasks:\n${subtasks}`,
                    `Created At: ${task.createdAt}`,
                ].join('\n');
            }).join('\n\n');

            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Content-Disposition', 'attachment; filename="tasks.txt"');
            return res.send(text);
        }

        if (format !== 'csv') {
            return res.status(400).json({ message: 'Unsupported export format' });
        }

        let csv = 'Title,Description,Status,Priority,Due Date,Dependencies,Created At,Tags\n';

        normalizedTasks.forEach((task) => {
            const row = [
                esc(task.title),
                esc(task.description),
                esc(task.status),
                esc(task.priority),
                task.dueDate,
                esc(task.dependencies.join('; ')),
                task.createdAt,
                esc(task.tags.join('; ')),
            ].join(',');
            csv += row + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
