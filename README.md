# 📖 Bloggers Dome

A modern, full-stack blogging platform where users can create, read, comment, and engage with blog posts in real-time. Built with the MERN stack for a seamless user experience.

![Status](https://img.shields.io/badge/status-active-success)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.2-blue)
![MongoDB](https://img.shields.io/badge/mongodb-latest-green)

---

## ✨ Features

- **🔐 User Authentication**: Secure JWT-based authentication with bcrypt password hashing
- **✍️ Create & Edit Posts**: Write and publish blog posts with rich content
- **❤️ Like Posts**: Engage with content by liking posts
- **💬 Comments**: Leave and read comments on blog posts
- **👤 User Profiles**: Personalized user profiles with profile pictures
- **📸 Image Uploads**: Upload profile pictures with file type validation (5MB limit)
- **🔒 Protected Routes**: Authorization middleware for secure endpoints
- **📱 Responsive Design**: Mobile-friendly UI with Bootstrap
- **⚡ Real-time Updates**: Instant updates without page refresh using Axios

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - UI library with functional components and hooks
- **Vite 7.3** - Fast build tool and dev server
- **React Router 7.13** - Client-side routing
- **Axios 1.13** - HTTP client for API calls
- **Bootstrap 5.3** - CSS framework for responsive design
- **ESLint** - Code quality and consistency

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js 5.2** - Web framework and routing
- **MongoDB 9.3** - NoSQL database with Mongoose ODM
- **JWT** - Secure token-based authentication
- **bcryptjs** - Password hashing and comparison
- **Multer 2.1** - File upload middleware
- **CORS** - Cross-origin request handling
- **dotenv** - Environment variable management

---

## 📂 Project Structure

```
bloggers-dome-website/
├── backend/
│   ├── db.js              # MongoDB connection
│   ├── server.js          # Express server setup
│   ├── package.json
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── upload.js           # Multer file upload configuration
│   ├── models/
│   │   ├── User.js        # User schema
│   │   ├── Post.js        # Blog post schema
│   │   └── Comment.js     # Comment schema
│   ├── routes/
│   │   ├── auth.js        # Auth endpoints (login, register)
│   │   ├── posts.js       # Post CRUD endpoints
│   │   ├── comment.js     # Comment endpoints
│   │   └── user.js        # User profile endpoints
│   └── uploads/           # Stored profile images
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx       # React entry point
│   │   ├── App.jsx        # Main App component
│   │   ├── index.css      # Global styles
│   │   ├── api/
│   │   │   └── axios.js   # Axios instance with base URL
│   │   ├── components/
│   │   │   ├── Navbar.jsx # Navigation component
│   │   │   └── Footer.jsx # Footer component
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global auth state
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Blog feed
│   │   │   ├── SinglePost.jsx   # Single post view
│   │   │   ├── CreatePost.jsx   # Create post form
│   │   │   ├── EditPost.jsx     # Edit post form
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Register.jsx     # Registration page
│   │   │   └── Profile.jsx      # User profile page
│   │   └── assets/        # Images and static files
│   ├── public/            # Static files
│   ├── vite.config.js
│   ├── vercel.json        # Vercel deployment config
│   ├── package.json
│   └── index.html
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **MongoDB** (local or Atlas cloud)
- **Git**

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/GauravGirkar/bloggers-dome-website.git
cd bloggers-dome-website
```

#### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/bloggers-dome
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
EOF

# Start the backend server
npm start
# or for development with auto-reload:
npx nodemon server.js
```

#### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (Vite default).

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user and get JWT token |

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Posts

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/posts` | Get all posts | ❌ |
| GET | `/api/posts/:id` | Get single post | ❌ |
| POST | `/api/posts` | Create new post | ✅ |
| PUT | `/api/posts/:id` | Update post | ✅ |
| DELETE | `/api/posts/:id` | Delete post | ✅ |
| PUT | `/api/posts/:id/like` | Like/unlike post | ✅ |

### Comments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/posts/:id/comments` | Get post comments | ❌ |
| POST | `/api/posts/:id/comments` | Add comment | ✅ |
| DELETE | `/api/posts/:postId/comments/:commentId` | Delete comment | ✅ |

### User Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/user/:id` | Get user profile | ❌ |
| PUT | `/api/user/:id` | Update user profile | ✅ |
| POST | `/api/user/upload-picture` | Upload profile picture | ✅ |

---

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bloggers-dome

# Authentication
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars

# CORS
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
```

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000
```

---

## 📦 Deployment

### Backend Deployment (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong secret key
   - `FRONTEND_URL`: Your deployed frontend URL (e.g., https://yourdomain.vercel.app)
   - `NODE_ENV`: production

4. Deploy with `npm start`

**Live Backend**: [https://bloggers-dome-website.onrender.com](https://bloggers-dome-website.onrender.com)

### Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   - `VITE_API_URL`: https://bloggers-dome-website.onrender.com/api

3. Build command: `npm run build`
4. Install command: `npm install`

**Live Frontend**: [https://bloggers-dome-website-h6dy.vercel.app](https://bloggers-dome-website-h6dy.vercel.app)

---

## 🧪 Testing API Locally

### Using cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Get all posts
curl http://localhost:5000/api/posts

# Create post (with token)
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"My Post","content":"Content here"}'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set `Authorization` header type to `Bearer Token`
3. Paste your JWT token from login response

---

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salting
- **JWT Authentication**: Secure token-based auth with 24-hour expiry
- **CORS Protection**: Configured for specific frontend origins
- **File Validation**: Image file type and size restrictions
- **Protected Routes**: Middleware checks auth before accessing sensitive endpoints
- **HTTP Headers**: CORS headers prevent unauthorized cross-origin requests

---

## 📝 Available Scripts

### Backend

```bash
npm start       # Start production server
npm run dev     # Start with nodemon (auto-reload)
npm test        # Run tests (if configured)
```

### Frontend

```bash
npm run dev     # Start dev server (Vite)
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

---

## 🐛 Troubleshooting

### **Frontend shows 404 when fetching data**
- Ensure `FRONTEND_URL` env var is set in Render backend
- Verify `VITE_API_URL` matches your deployed backend URL
- Check CORS settings in `backend/server.js`

### **Database connection fails**
- Verify MongoDB connection string in `.env`
- Ensure IP whitelist includes your deployment platform IP
- Check MongoDB Atlas credentials

### **Upload fails with 413 error**
- Increase size limit in `backend/middleware/upload.js`
- Default is 5MB; adjust `limits: { fileSize: ... }`

### **JWT token expired**
- Re-login to get a new token
- Token lifespan can be configured in auth routes

---

## 👥 Team & Contributing

This is an open project. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License - see the package.json for details.

---

## 📞 Support

For issues, questions, or suggestions:
- **GitHub Issues**: [Open an issue](https://github.com/GauravGirkar/bloggers-dome-website/issues)
- **Email**: gauravgirkar194@gmail.com

---

## 🎉 Acknowledgments

- MERN Stack Community
- Bootstrap for UI components
- Vite for blazing-fast builds
- Mongoose for elegant MongoDB modeling

---

**Made with ❤️ by Gaurav Girkar**