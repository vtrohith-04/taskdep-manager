const express = require('express');
const Task = require('../models/Task');
const protect = require('../middleware/protect');
const { hasCircularDependency } = require('../utils/graph');
const { z } = require('zod');

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
});

const updateTaskSchema = z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title too long').optional(),
    description: z.string().max(1000, 'Description too long').optional(),
    status: z.enum(['Todo', 'In Progress', 'Done'], { required_error: 'Invalid status' }).optional(),
    priority: z.enum(['High', 'Medium', 'Low'], { required_error: 'Invalid priority' }).optional(),
    dependsOn: z.array(z.string()).optional(),
    attachments: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
        originalName: z.string().optional()
    })).optional(),
    dueDate: z.string().optional(),
});

// All routes are protected
router.use(protect);

// @route GET /api/tasks — Get all active tasks for the user
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find({ owner: req.user._id, deleted: false })
            .populate('dependsOn', 'title _id status')
            .sort({ createdAt: -1 });
        res.json(tasks);
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
            .sort({ updatedAt: -1 });
        res.json(tasks);
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
            owner: req.user._id,
            dueDate: dueDate || null,
            completedAt: status === 'Done' ? new Date() : null,
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
        const { title, description, status, priority, dependsOn = [], attachments, dueDate } = validatedData;

        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Circular dependency check when deps change
        if (dependsOn !== undefined && dependsOn.length > 0) {
            const allTasks = await Task.find({ owner: req.user._id, deleted: false });
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
        if (status === 'Done') {
            task.completedAt = new Date();
        } else if (status !== undefined && status !== 'Done') {
            task.completedAt = null;
        }

        await task.save();
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
            .sort({ createdAt: -1 });

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
