import { Link } from 'react-router-dom'

export default function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="site-footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <div className="logo-icon" style={{ width: 22, height: 22, borderRadius: 6, boxShadow: 'none' }} />
                    Bloggers<span>Dome</span>
                </div>

                <div className="footer-links">
                    <Link to="/">Home</Link>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                    <Link to="/create-post">Write</Link>
                </div>

                <p className="footer-copy">
                    © {year} BloggersDome. Built with ❤ and React.
                </p>
            </div>
        </footer>
    )
}
