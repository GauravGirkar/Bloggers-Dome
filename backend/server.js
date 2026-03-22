require('dotenv').config();
require('./db.js');
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes = require('./routes/comment.js');
const userProfileRoutes = require('./routes/user.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
    return rateLimit({
        windowMs: windowMs, // Time window in milliseconds
        max: max, // Limit each IP to 'max' requests per windowMs
        message: {
            error: 'Too many requests',
            message: message,
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        // Skip rate limiting for successful requests in development
        skip: (req, res) => process.env.NODE_ENV === 'development' && res.statusCode < 400
    });
};

// General API rate limiter (for all endpoints)
const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again after 15 minutes.'
);

// Strict limiter for authentication endpoints
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth requests per windowMs
    'Too many authentication attempts, please try again after 15 minutes.'
);

// Medium limiter for write operations (create, update, delete)
const writeLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // limit each IP to 20 write operations per windowMs
    'Too many write operations, please try again after 15 minutes.'
);

// Light limiter for read operations
const readLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutes
    200, // limit each IP to 200 read operations per windowMs
    'Too many read requests, please try again after 15 minutes.'
);

// File upload limiter (stricter for uploads)
const uploadLimiter = createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // limit each IP to 10 uploads per hour
    'Too many file uploads, please try again after 1 hour.'
);

app.use(cors());
app.use(express.json());

// Apply general rate limiting to all routes
app.use('/api/', generalLimiter);

// Serve uploaded profile pictures as static files (no rate limit for static files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Apply specific rate limits to different route groups
app.use('/api/auth', authLimiter);
app.use('/api/posts', (req, res, next) => {
    // Apply different limits based on HTTP method
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return writeLimiter(req, res, next);
    } else {
        return readLimiter(req, res, next);
    }
});
app.use('/api/user', (req, res, next) => {
    // Special handling for uploads
    if (req.path.includes('upload-picture')) {
        return uploadLimiter(req, res, next);
    }
    // Apply write limiter for other user operations
    return writeLimiter(req, res, next);
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/api/user', userProfileRoutes);

app.use('/', (req, res) => {
    res.status(200).json({ message: 'API running' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
