const request = require('supertest');
const app = require('../index');
const User = require('../models/User');

// Requires the DB setup
require('../tests/setup');

describe('Auth API Routes', () => {

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user).toHaveProperty('name', testUser.name);
            expect(res.body.user).toHaveProperty('email', testUser.email);
        });

        it('should return error if email is already taken', async () => {
            await User.create(testUser); // Presave user

            const res = await request(app)
                .post('/api/auth/register')
                .send(testUser);

            expect(res.statusCode).toBe(400);
            expect(res.body.message).toBe('User already exists');
        });

        it('should return 400 on validation failure', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    name: '',
                    email: 'invalidemail',
                    password: '123'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login user and return a token', async () => {
            await User.create(testUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should reject invalid credentials', async () => {
            await User.create(testUser);

            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.message).toBe('Invalid credentials');
        });
    });

});
