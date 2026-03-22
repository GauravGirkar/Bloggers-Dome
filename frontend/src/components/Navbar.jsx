import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

export default function Navbar() {
    const { token, userId, logout } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [userInfo, setUserInfo] = useState(null)
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    const isActive = (path) => location.pathname === path

    // Close mobile menu on route change
    useEffect(() => { setMenuOpen(false) }, [location.pathname])

    // Scroll detection
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    // Fetch user info for avatar
    useEffect(() => {
        if (token && userId) {
            fetch(`/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.ok ? r.json() : null)
                .then(d => { if (d?.getUser) setUserInfo(d.getUser) })
                .catch(() => {})
        } else {
            setUserInfo(null)
        }
    }, [token, userId])

    // Prevent body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    function handleLogout() {
        logout()
        navigate('/')
        setMenuOpen(false)
    }

    const defaultAvatar = 'https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg'
    const avatarSrc = userInfo?.profile_pic && userInfo.profile_pic !== defaultAvatar ? userInfo.profile_pic : null

    const AvatarChip = () => (
        <span style={{ width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1.5px solid rgba(123,95,245,0.5)', flexShrink: 0 }}>
            {avatarSrc
                ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,var(--purple),var(--green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#fff', fontWeight: 600 }}>
                    {userInfo?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
            }
        </span>
    )

    return (
        <>
            <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
                <div className="container navbar-container">
                    <Link to="/" className="navbar-brand">
                        <div className="logo-icon" />
                        Bloggers<span>Dome</span>
                    </Link>

                    {/* Desktop links */}
                    <div className="nav-links">
                        {token ? (
                            <>
                                <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>
                                <Link to="/create-post" className={`nav-link${isActive('/create-post') ? ' active' : ''}`}>Write</Link>
                                <Link to="/profile" className={`nav-link${isActive('/profile') ? ' active' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <AvatarChip />
                                    Profile
                                </Link>
                                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.38rem 0.95rem', fontSize: '0.77rem', marginLeft: '0.4rem' }}>
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`}>Home</Link>
                                <Link to="/login" className={`nav-link${isActive('/login') ? ' active' : ''}`}>Login</Link>
                                <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1.1rem', marginLeft: '0.4rem' }}>
                                    Register
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className={`nav-hamburger${menuOpen ? ' open' : ''}`}
                        onClick={() => setMenuOpen(v => !v)}
                        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={menuOpen}
                    >
                        <span /><span /><span />
                    </button>
                </div>
            </nav>

            {/* Mobile panel */}
            <div className={`nav-mobile-panel${menuOpen ? ' open' : ''}`} role="navigation">
                {token ? (
                    <>
                        <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
                        <Link to="/create-post" className={`nav-link${isActive('/create-post') ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>✦ Write a Post</Link>
                        <Link to="/profile" className={`nav-link${isActive('/profile') ? ' active' : ''}`} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <AvatarChip /> Profile
                        </Link>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                        <button onClick={handleLogout} className="btn btn-outline w-100" style={{ justifyContent: 'center', color: 'var(--red)', borderColor: 'rgba(245,101,101,0.3)' }}>
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/" className={`nav-link${isActive('/') ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
                        <Link to="/login" className={`nav-link${isActive('/login') ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Login</Link>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                        <Link to="/register" className="btn btn-primary w-100" style={{ justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>
                            Create Account
                        </Link>
                    </>
                )}
            </div>
        </>
    )
}