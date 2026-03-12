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
            expect(res.body.length).toBe(1); // Only non-deleted
            expect(res.body[0].title).toBe('T1');
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
    });

    describe('DELETE /api/tasks/:id', () => {
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
    });
});
