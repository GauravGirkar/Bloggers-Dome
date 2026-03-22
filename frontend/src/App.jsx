import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CreatePost from './pages/CreatePost'
import SinglePost from './pages/SinglePost'
import Profile from './pages/Profile'
import EditPost from './pages/EditPost'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/post/:id" element={<SinglePost />} />
                <Route path="/create-post" element={<CreatePost />} />
                <Route path="/edit-post/:id" element={<EditPost />} />
            </Routes>
            <Footer />
        </Router>
    )
}

export default App
