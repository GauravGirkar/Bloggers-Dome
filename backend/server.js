require('dotenv').config();
require('./db.js');
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth.js');
const postRoutes = require('./routes/posts.js');
const commentRoutes = require('./routes/comment.js');
const userProfileRoutes = require('./routes/user.js');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded profile pictures as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
