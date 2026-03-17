const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;
jest.setTimeout(60000);

beforeAll(async () => {
    try {
        process.env.JWT_SECRET = 'test-secret';
        process.env.NODE_ENV = 'test';

        const mongoOptions = {};
        if (process.env.MONGOMS_VERSION) {
            mongoOptions.binary = {
                version: process.env.MONGOMS_VERSION,
            };
        }

        mongoServer = await MongoMemoryServer.create(mongoOptions);

        await mongoose.connect(mongoServer.getUri());
    } catch (error) {
        console.error('Test database startup failed:', error);
        throw error;
    }
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});

afterEach(async () => {
    if (mongoose.connection.readyState !== 1) return;

    // Clear all collections after each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});
