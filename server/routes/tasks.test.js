const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Task = require('../models/Task');

require('../tests/setup');

describe('Tasks API Routes', () => {

    let token;
    let user;

    beforeEach(async () => {
        // Create user and get token
        user = await User.create({
            name: 'Test Task User',
            email: 'taskuser@example.com',
            password: 'password123'
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'taskuser@example.com', password: 'password123' });

        token = res.body.token;
    });

    describe('GET /api/tasks', () => {
        it('should get all active tasks for user', async () => {
            await Task.create({ title: 'T1', owner: user._id });
            await Task.create({ title: 'T2', owner: user._id, deleted: true });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.length).toBe(1); // Only non-deleted
            expect(res.body.tasks[0].title).toBe('T1');
            expect(res.body.pagination).toBeDefined();
            expect(res.body.pagination.totalTasks).toBe(1);
        });

        it('should support pagination query parameters', async () => {
            // Create 3 tasks
            await Task.create({ title: 'T1', owner: user._id });
            await Task.create({ title: 'T2', owner: user._id });
            await Task.create({ title: 'T3', owner: user._id });

            const res = await request(app)
                .get('/api/tasks?page=1&limit=2')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks.length).toBe(2);
            expect(res.body.pagination.totalPages).toBe(2);
            expect(res.body.pagination.currentPage).toBe(1);
        });

        it('should return every active task when all=true is provided', async () => {
            await Task.create({ title: 'T1', owner: user._id });
            await Task.create({ title: 'T2', owner: user._id });
            await Task.create({ title: 'T3', owner: user._id });

            const res = await request(app)
                .get('/api/tasks?all=true')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.tasks).toHaveLength(3);
            expect(res.body.pagination.totalTasks).toBe(3);
            expect(res.body.pagination.currentPage).toBe(1);
        });
    });

    describe('POST /api/tasks', () => {
        it('should create a task successfully', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'New Task',
                    status: 'Todo',
                    priority: 'High'
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.title).toBe('New Task');
            expect(res.body.status).toBe('Todo');
            expect(res.body.priority).toBe('High');
        });

        it('should persist tags and subtasks when creating a task', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    title: 'Structured Task',
                    status: 'Todo',
                    priority: 'Medium',
                    tags: ['Engineering', 'Backend'],
                    subtasks: [{ title: 'Add route', completed: false }]
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.tags).toEqual(['Engineering', 'Backend']);
            expect(res.body.subtasks).toHaveLength(1);
            expect(res.body.subtasks[0].title).toBe('Add route');
        });

        it('should fail validation on missing title', async () => {
            const res = await request(app)
                .post('/api/tasks')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    status: 'Todo'
                });

            expect(res.statusCode).toBe(400); // Zod validation
        });
    });

    describe('PUT /api/tasks/:id', () => {
        it('should update a task', async () => {
            const task = await Task.create({ title: 'Old Title', owner: user._id });

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ title: 'New Title' });

            expect(res.statusCode).toBe(200);
            expect(res.body.title).toBe('New Title');
        });

        it('should detect circular dependencies on update', async () => {
            const t1 = await Task.create({ title: 'T1', owner: user._id });
            const t2 = await Task.create({ title: 'T2', owner: user._id, dependsOn: [t1._id] });

            // Make T1 depend on T2, which depends on T1 -> Cycle!
            const res = await request(app)
                .put(`/api/tasks/${t1._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ dependsOn: [t2._id.toString()] });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('Circular Dependency Detected');
        });

        it('should reject dependency ids that do not belong to the user', async () => {
            const otherUser = await User.create({
                name: 'Other User',
                email: 'other@example.com',
                password: 'password123'
            });
            const foreignTask = await Task.create({ title: 'Foreign', owner: otherUser._id });
            const ownTask = await Task.create({ title: 'Owned', owner: user._id });

            const res = await request(app)
                .put(`/api/tasks/${ownTask._id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ dependsOn: [foreignTask._id.toString()] });

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('One or more dependency tasks not found');
        });

        it('should handle deep dependency chains', async () => {
            const t1 = await Task.create({ title: 'T1', owner: user._id });
            const t2 = await Task.create({ title: 'T2', owner: user._id, dependsOn: [t1._id] });
            const t3 = await Task.create({ title: 'T3', owner: user._id, dependsOn: [t2._id] });

            const res = await request(app)
                .get('/api/tasks')
                .set('Authorization', `Bearer ${token}`);

            const tasks = res.body.tasks;
            const t3_resp = tasks.find(t => t.title === 'T3');
            expect(t3_resp.dependsOn[0]._id.toString()).toBe(t2._id.toString());
        });
    });

    describe('DELETE /api/tasks/:id and Dependencies', () => {
        it('should soft delete a task', async () => {
            const task = await Task.create({ title: 'To Delete', owner: user._id });

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);

            // Verify in DB
            const dbTask = await Task.findById(task._id);
            expect(dbTask.deleted).toBe(true);
        });

        it('should not show deleted tasks in dependencies for new tasks', async () => {
             const t1 = await Task.create({ title: 'Deleted', owner: user._id, deleted: true });
             
             const res = await request(app)
                 .post('/api/tasks')
                 .set('Authorization', `Bearer ${token}`)
                 .send({
                     title: 'Should fail',
                     dependsOn: [t1._id.toString()],
                     status: 'Todo',
                     priority: 'Low'
                 });

             expect(res.statusCode).toBe(400);
             expect(res.body.message).toBe('One or more dependency tasks not found');
        });
    });

    describe('GET /api/tasks/export', () => {
        beforeEach(async () => {
            const dep = await Task.create({ title: 'Dependency Task', owner: user._id, status: 'Done' });
            await Task.create({
                title: 'Export Me',
                description: 'Export description',
                owner: user._id,
                status: 'Todo',
                priority: 'Medium',
                dependsOn: [dep._id],
                tags: ['Docs'],
                subtasks: [{ title: 'Write notes', completed: false }],
            });
        });

        it('should export tasks as json', async () => {
            const res = await request(app)
                .get('/api/tasks/export?format=json')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('application/json');
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body[0].title).toBeDefined();
        });

        it('should export tasks as txt', async () => {
            const res = await request(app)
                .get('/api/tasks/export?format=txt')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.headers['content-type']).toContain('text/plain');
            expect(res.text).toContain('Task 1:');
            expect(res.text).toContain('Export Me');
        });
    });

    describe('GET /api/tasks/analytics', () => {
        it('should return the enhanced analytics payload', async () => {
            const now = new Date();
            const threeDaysAgo = new Date(now);
            threeDaysAgo.setDate(now.getDate() - 3);
            const tenDaysAgo = new Date(now);
            tenDaysAgo.setDate(now.getDate() - 10);
            const overdueDate = new Date(now);
            overdueDate.setDate(now.getDate() - 2);

            const blocker = await Task.create({
                title: 'Blocker',
                owner: user._id,
                status: 'Todo',
                priority: 'High',
                createdAt: tenDaysAgo,
                dueDate: overdueDate,
            });

            await Task.create({
                title: 'Blocked Task',
                owner: user._id,
                status: 'Todo',
                priority: 'Medium',
                dependsOn: [blocker._id],
                createdAt: threeDaysAgo,
            });

            await Task.create({
                title: 'Completed Task',
                owner: user._id,
                status: 'Done',
                priority: 'Low',
                createdAt: tenDaysAgo,
                completedAt: now,
                dueDate: now,
            });

            const res = await request(app)
                .get('/api/tasks/analytics')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.trends).toBeDefined();
            expect(res.body.execution).toBeDefined();
            expect(Array.isArray(res.body.priorityStatusMatrix)).toBe(true);
            expect(res.body.execution.averageCycleDays).toBeGreaterThanOrEqual(1);
            expect(res.body.execution.onTimeCompletionRate).toBeGreaterThanOrEqual(0);
        });
    });
});
