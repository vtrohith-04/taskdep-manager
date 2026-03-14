const express = require('express');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const protect = require('../middleware/protect');
const { hasCircularDependency } = require('../utils/graph');
const { z } = require('zod');
const { sendTaskEmail } = require('../utils/mailer');

const router = express.Router();

// Validation schemas
const createTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
    description: z.string().max(1000, 'Description too long').optional(),
    status: z.enum(['Todo', 'In Progress', 'Done'], { required_error: 'Invalid status' }),
    priority: z.enum(['High', 'Medium', 'Low'], { required_error: 'Invalid priority' }),
    dependsOn: z.array(z.string()).optional().default([]),
    attachments: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
        originalName: z.string().optional()
    })).optional().default([]),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    subtasks: z.array(z.object({
        title: z.string().min(1),
        completed: z.boolean().default(false)
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
        originalName: z.string().optional()
    })).optional(),
    dueDate: z.string().optional(),
    tags: z.array(z.string()).optional(),
    subtasks: z.array(z.object({
        _id: z.string().optional(),
        title: z.string().min(1),
        completed: z.boolean()
    })).optional(),
});

// All routes are protected
router.use(protect);

// @route GET /api/tasks — Get all active tasks for the user
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12; // Use dashboard default
        const skip = (page - 1) * limit;

        const query = { owner: req.user._id, deleted: false };

        const totalTasks = await Task.countDocuments(query);
        const tasks = await Task.find(query)
            .populate('dependsOn', 'title _id status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get global stats for the user with computed logic
        const allUserTasks = await Task.find({ owner: req.user._id, deleted: false }).select('status dependsOn dueDate').lean();
        
        const stats = {
            total: totalTasks,
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0
        };

        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        allUserTasks.forEach(t => {
            // Check if blocked
            const isBlocked = t.dependsOn && t.dependsOn.length > 0 && t.dependsOn.some(depId => {
                const dep = allUserTasks.find(d => String(d._id) === String(depId));
                return dep && dep.status !== 'Done';
            });

            if (isBlocked) {
                stats.blocked++;
            } else if (t.status === 'Done') {
                stats.done++;
            } else {
                // Check if auto-In Progress based on due date
                const isAutoInProgress = t.dueDate && new Date(t.dueDate) <= threeDaysFromNow;
                if (t.status === 'In Progress' || isAutoInProgress) {
                    stats.inProgress++;
                } else {
                    stats.todo++;
                }
            }
        });

        res.json({
            tasks,
            stats,
            pagination: {
                totalTasks,
                totalPages: Math.ceil(totalTasks / limit),
                currentPage: page,
                limit
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/tasks/history — Get completed or soft-deleted tasks
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

// @route GET /api/tasks/analytics — Get project metrics and trends
router.get('/analytics', async (req, res) => {
    try {
        const query = { owner: req.user._id, deleted: false };
        const allTasks = await Task.find(query).select('status priority dueDate dependsOn completedAt title').lean();

        const stats = {
            total: allTasks.length,
            todo: 0,
            inProgress: 0,
            done: 0,
            blocked: 0,
            overdue: 0,
            priority: { High: 0, Medium: 0, Low: 0 },
            bottlenecks: [] // Tasks sorted by number of dependents
        };

        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const dependentCountMap = {};

        allTasks.forEach(t => {
            // Priority count
            stats.priority[t.priority]++;

            // Overdue count
            if (t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now) {
                stats.overdue++;
            }

            // Calc effective status and bottlenecks
            const isBlocked = t.dependsOn && t.dependsOn.length > 0 && t.dependsOn.some(depId => {
                const dep = allTasks.find(d => String(d._id) === String(depId));
                // Track dependencies for bottleneck analysis
                dependentCountMap[String(depId)] = (dependentCountMap[String(depId)] || 0) + 1;
                return dep && dep.status !== 'Done';
            });

            if (isBlocked) {
                stats.blocked++;
            } else if (t.status === 'Done') {
                stats.done++;
            } else {
                const isAutoInProgress = t.dueDate && new Date(t.dueDate) <= threeDaysFromNow;
                if (t.status === 'In Progress' || isAutoInProgress) {
                    stats.inProgress++;
                } else {
                    stats.todo++;
                }
            }
        });

        // Completion Velocity (Last 14 days)
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const velocity = {};
        // Initialize last 14 days with 0
        for (let i = 0; i < 14; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            velocity[key] = 0;
        }

        allTasks.forEach(t => {
            if (t.status === 'Done' && t.completedAt && new Date(t.completedAt) >= fourteenDaysAgo) {
                const key = new Date(t.completedAt).toISOString().split('T')[0];
                if (velocity[key] !== undefined) velocity[key]++;
            }
        });

        // Format velocity for charts
        const velocityData = Object.entries(velocity)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, count]) => ({ date, completed: count }));

        // Identify bottlenecks (Top 5 tasks blocking others)
        const bottlenecks = Object.entries(dependentCountMap)
            .map(([id, count]) => {
                const task = allTasks.find(t => String(t._id) === id);
                return { 
                    title: task?.title || 'Unknown Task', 
                    count,
                    status: task ? task.status : 'N/A'
                };
            })
            .filter(b => b.status !== 'Done') // Only count active tasks as bottlenecks
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        res.json({
            stats,
            velocity: velocityData,
            bottlenecks,
            overdueTasks: allTasks.filter(t => t.status !== 'Done' && t.dueDate && new Date(t.dueDate) < now),
            recentActivity: await Activity.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(10).populate('task', 'title').lean()
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route POST /api/tasks — Create a new task
router.post('/', async (req, res) => {
    try {
        const validatedData = createTaskSchema.parse(req.body);
        const { title, description, status, priority, dependsOn = [], attachments = [], dueDate } = validatedData;

        // Validate dependency IDs exist and belong to user
        if (dependsOn.length > 0) {
            const validDeps = await Task.find({
                _id: { $in: dependsOn },
                owner: req.user._id,
                deleted: false,
            }).select('_id');
            if (validDeps.length !== dependsOn.length) {
                return res.status(400).json({ message: 'One or more dependency tasks not found' });
            }
        }

        const task = await Task.create({
            title,
            description,
            status,
            priority,
            dependsOn,
            attachments,
            subtasks,
            owner: req.user._id,
            dueDate: dueDate || null,
            completedAt: status === 'Done' ? new Date() : null,
        });

        // Log activity
        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'created',
            description: `Created task "${title}"`
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

// @route PUT /api/tasks/:id — Update a task
router.put('/:id', async (req, res) => {
    try {
        const validatedData = updateTaskSchema.parse(req.body);
        const { title, description, status, priority, dependsOn = [], attachments, dueDate, subtasks, tags } = validatedData;

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        const oldStatus = task.status;

        // Circular dependency check when deps change
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

        // Log activity
        if (status !== undefined && status !== oldStatus) {
            await Activity.create({
                user: req.user._id,
                task: task._id,
                action: 'updated_status',
                description: `Changed status of "${task.title}" to ${status}`
            });
        }

        // Send email notification on completion (Minimal implementation)
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

// @route DELETE /api/tasks/:id — Soft delete a task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.deleted = true;
        await task.save();

        // Log activity
        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'deleted',
            description: `Deleted task "${task.title}"`
        });

        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route PUT /api/tasks/:id/restore — Restore a deleted task
router.put('/:id/restore', async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        task.deleted = false;
        task.status = 'Todo';
        task.completedAt = null;
        await task.save();

        // Log activity
        await Activity.create({
            user: req.user._id,
            task: task._id,
            action: 'restored',
            description: `Restored task "${task.title}"`
        });

        const populated = await task.populate('dependsOn', 'title _id status');
        res.json(populated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route GET /api/tasks/export — Export tasks to CSV
router.get('/export', async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id, deleted: false })
            .populate('dependsOn', 'title')
            .sort({ createdAt: -1 })
            .lean();

        // Helper: escape CSV field (double quotes → doubled)
        const esc = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

        // Create CSV header
        let csv = 'Title,Description,Status,Priority,Due Date,Dependencies,Created At\n';

        // Add rows
        tasks.forEach(task => {
            const deps = task.dependsOn.map(dep => dep.title).join('; ');
            const row = [
                esc(task.title),
                esc(task.description),
                esc(task.status),
                esc(task.priority),
                task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                esc(deps),
                new Date(task.createdAt).toISOString().split('T')[0]
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
