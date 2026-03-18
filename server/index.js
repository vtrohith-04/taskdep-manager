const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(morgan('dev'));

const allowedOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/upload', require('./routes/upload'));
app.get('/', (req, res) =>
    res.status(200).json({
        message: 'TaskDep API is running',
        health: '/api/health',
    })
);
app.get('/api/health', (req, res) => res.status(200).json({ ok: true }));

app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: err.message });
    }
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log('MongoDB connected');
            app.listen(port, () => {
                console.log(`Server running on port ${port}`);
            });
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err.message);
            process.exit(1);
        });
}

module.exports = app;
