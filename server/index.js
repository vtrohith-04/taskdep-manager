const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

// Security headers
app.use(helmet());

// Request logging
app.use(morgan('dev'));

// CORS — restrict to frontend origin in production
const corsOptions = {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

// Rate limiting on auth routes (prevent brute-force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per window
    message: { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/upload', require('./routes/upload'));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).json({ message: 'Internal server error' });
});

// MongoDB Connection
if (process.env.NODE_ENV !== 'test') {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log('✅ MongoDB connected');
            app.listen(process.env.PORT, () => {
                console.log(`🚀 Server running on port ${process.env.PORT}`);
            });
        })
        .catch((err) => {
            console.error('❌ MongoDB connection error:', err.message);
            process.exit(1);
        });
}

module.exports = app;
