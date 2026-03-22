import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ── Camera icon ──────────────────────────────────────── */
function CameraIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
        </svg>
    )
}

export default function Profile() {
    const { token, userId, logout } = useAuth()
    const navigate = useNavigate()
    const fileInputRef = useRef(null)

    const [user, setUser] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('posts') // 'posts' | 'edit'

    // Edit form state (text fields)
    const [editForm, setEditForm] = useState({ name: '', username: '', bio: '', country: '', gender: '' })
    // Separate state for the image file
    const [picFile, setPicFile] = useState(null)
    const [picPreview, setPicPreview] = useState(null) // local object URL for preview

    const [editSaving, setEditSaving] = useState(false)
    const [editSuccess, setEditSuccess] = useState('')
    const [editError, setEditError] = useState('')

    useEffect(() => {
        if (!token) { navigate('/login'); return }
        fetchProfile()
    }, [token, userId])

    // Revoke blob URL on unmount/change to avoid memory leaks
    useEffect(() => {
        return () => { if (picPreview) URL.revokeObjectURL(picPreview) }
    }, [picPreview])

    async function fetchProfile() {
        try {
            const [userRes, postsRes] = await Promise.all([
                fetch(`/api/user/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/posts/', { headers: { Authorization: `Bearer ${token}` } })
            ])
            if (!userRes.ok) throw new Error('Failed to fetch profile')
            const userData = await userRes.json()
            const u = userData.getUser
            setUser(u)
            setEditForm({
                name: u.name || '',
                username: u.username || '',
                bio: u.bio || '',
                country: u.country || '',
                gender: u.gender || '',
            })
            if (postsRes.ok) {
                const postsData = await postsRes.json()
                const allPosts = postsData.postFetched || []
                setPosts(allPosts.filter(p => p.author?._id === userId))
            }
        } catch {
            setError('Could not load profile data.')
        } finally {
            setLoading(false)
        }
    }

    function handleFileChange(e) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate type
        if (!file.type.startsWith('image/')) {
            setEditError('Please select a valid image file (JPG, PNG, GIF, WEBP).')
            return
        }
        // Validate size (5 MB)
        if (file.size > 5 * 1024 * 1024) {
            setEditError('Image must be smaller than 5 MB.')
            return
        }

        setEditError('')
        setPicFile(file)
        // Create a local preview URL
        if (picPreview) URL.revokeObjectURL(picPreview)
        setPicPreview(URL.createObjectURL(file))
    }

    async function handleEditSubmit(e) {
        e.preventDefault()
        setEditSaving(true)
        setEditError('')
        setEditSuccess('')

        try {
            // Use FormData so we can send the file + text fields together
            const formData = new FormData()
            formData.append('name', editForm.name)
            formData.append('username', editForm.username)
            formData.append('bio', editForm.bio)
            formData.append('country', editForm.country)
            formData.append('gender', editForm.gender)
            if (picFile) {
                formData.append('profile_pic', picFile)
            }

            const res = await fetch(`/api/user/${userId}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                // Do NOT set Content-Type — the browser sets it automatically with the boundary
                body: formData
            })

            const data = await res.json()
            if (res.ok) {
                setUser(data.updatedUser)
                setEditSuccess('Profile updated successfully!')
                setPicFile(null)
                if (picPreview) { URL.revokeObjectURL(picPreview); setPicPreview(null) }
                setTimeout(() => setEditSuccess(''), 3500)
            } else {
                setEditError(data.message || 'Failed to update profile.')
            }
        } catch {
            setEditError('Network error. Please try again.')
        } finally {
            setEditSaving(false)
        }
    }

    function handleLogout() {
        logout()
        navigate('/')
    }

    /* ── Loading skeleton ── */
    if (loading) return (
        <main className="container main-content">
            <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
                <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', margin: '0 auto 1.5rem' }} />
                <div className="skeleton mb-2" style={{ height: '24px', width: '40%', margin: '0 auto 0.5rem' }} />
                <div className="skeleton" style={{ height: '14px', width: '30%', margin: '0 auto' }} />
            </div>
        </main>
    )

    /* ── Error ── */
    if (error) return (
        <main className="container main-content text-center">
            <div className="glass-card" style={{ maxWidth: 480, margin: '0 auto', borderColor: 'rgba(245,101,101,0.25)' }}>
                <h2>Profile Error</h2>
                <p style={{ color: 'var(--red)' }}>{error}</p>
                <button onClick={handleLogout} className="btn btn-outline mt-4">Sign out</button>
            </div>
        </main>
    )

    const defaultAvatar = 'https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg'
    const avatarSrc = user?.profile_pic && user.profile_pic !== defaultAvatar ? user.profile_pic : null

    return (
        <main className="container main-content">
            <div style={{ maxWidth: 760, margin: '0 auto' }}>

                {/* ── Profile Hero Card ── */}
                <div className="glass-card mb-5 text-center" style={{ padding: '2.5rem 2rem' }}>
                    {/* Avatar — clicking it opens the file picker if in edit mode */}
                    <div
                        className="profile-avatar"
                        style={{ cursor: activeTab === 'edit' ? 'pointer' : 'default', position: 'relative' }}
                        onClick={() => activeTab === 'edit' && fileInputRef.current?.click()}
                        title={activeTab === 'edit' ? 'Click to change photo' : ''}
                    >
                        {picPreview ? (
                            <img src={picPreview} alt="New avatar preview" />
                        ) : avatarSrc ? (
                            <img src={avatarSrc} alt={user.username} />
                        ) : (
                            user?.username?.charAt(0).toUpperCase() || 'U'
                        )}
                        {/* Camera overlay badge when in edit mode */}
                        {activeTab === 'edit' && (
                            <div style={{
                                position: 'absolute', bottom: 4, right: 4,
                                width: 26, height: 26,
                                background: 'var(--purple)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid var(--bg)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                            }}>
                                <CameraIcon />
                            </div>
                        )}
                    </div>

                    <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.25rem' }}>
                        {user?.name || user?.username}
                    </h1>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--green)', marginBottom: '0.5rem' }}>
                        @{user?.username}
                    </p>
                    {user?.bio && (
                        <p style={{ maxWidth: 480, margin: '0 auto 0.75rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                            {user.bio}
                        </p>
                    )}
                    {(user?.country || user?.gender) && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
                            {[user.country, user.gender].filter(Boolean).join(' · ')}
                        </p>
                    )}

                    <div className="profile-stat-bar mb-5">
                        <div className="profile-stat">
                            <span className="profile-stat-value">{posts.length}</span>
                            <span className="profile-stat-label">Posts</span>
                        </div>
                        <div className="profile-stat">
                            <span className="profile-stat-value">
                                {posts.reduce((acc, p) => acc + (p.likes?.length ?? 0), 0)}
                            </span>
                            <span className="profile-stat-label">Likes Received</span>
                        </div>
                    </div>

                    <div className="flex justify-center gap-3">
                        <Link to="/create-post" className="btn btn-primary">✦ New Post</Link>
                        <button
                            onClick={() => setActiveTab(activeTab === 'edit' ? 'posts' : 'edit')}
                            className="btn btn-outline"
                        >
                            {activeTab === 'edit' ? '← My Posts' : '⚙ Edit Profile'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn btn-outline"
                            style={{ color: 'var(--red)', borderColor: 'rgba(245,101,101,0.3)' }}
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* ── Tab Content ── */}
                {activeTab === 'edit' ? (
                    /* ── Edit Profile Form ── */
                    <div className="glass-card">
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', marginBottom: '1.75rem' }}>
                            Edit Profile
                        </h2>

                        {editSuccess && <div className="toast toast-success mb-4">{editSuccess}</div>}
                        {editError && <div className="toast toast-error mb-4">{editError}</div>}

                        <form onSubmit={handleEditSubmit}>

                            {/* ── Profile Photo Upload ── */}
                            <div className="form-group">
                                <label className="form-label">Profile Photo</label>

                                {/* Hidden file input */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />

                                {/* Custom upload button + preview row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'default' }}>
                                    {/* Current / preview avatar */}
                                    <div style={{
                                        width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                                        overflow: 'hidden', border: '2px solid rgba(124,90,245,0.4)',
                                        background: 'linear-gradient(135deg, var(--purple), var(--green))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: '#fff'
                                    }}>
                                        {picPreview ? (
                                            <img src={picPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : avatarSrc ? (
                                            <img src={avatarSrc} alt="Current" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            user?.username?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>

                                    {/* Info + button */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        {picFile ? (
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--green)', marginBottom: '0.4rem' }}>
                                                ✓ {picFile.name} ({(picFile.size / 1024).toFixed(0)} KB)
                                            </p>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                                                JPG, PNG, GIF or WEBP · Max 5 MB
                                            </p>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem', gap: '0.4rem' }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <CameraIcon />
                                            {picFile ? 'Change Photo' : 'Choose Photo'}
                                        </button>
                                        {picFile && (
                                            <button
                                                type="button"
                                                onClick={() => { setPicFile(null); URL.revokeObjectURL(picPreview); setPicPreview(null) }}
                                                style={{ marginLeft: '0.5rem', background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ── Text fields ── */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Full Name</label>
                                    <input
                                        className="form-control"
                                        value={editForm.name}
                                        onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Username</label>
                                    <input
                                        className="form-control"
                                        value={editForm.username}
                                        onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                                        placeholder="handle"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Bio</label>
                                <textarea
                                    className="form-control"
                                    rows={3}
                                    value={editForm.bio}
                                    onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))}
                                    placeholder="Tell the world about yourself…"
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Country</label>
                                    <input
                                        className="form-control"
                                        value={editForm.country}
                                        onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))}
                                        placeholder="e.g. India"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select
                                        className="form-control"
                                        value={editForm.gender}
                                        onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                                    >
                                        <option value="">Prefer not to say</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Non-binary">Non-binary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-4">
                                <button type="button" className="btn btn-outline" onClick={() => setActiveTab('posts')}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                                    {editSaving ? 'Saving…' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    /* ── Posts Tab ── */
                    <section>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                            Your Posts
                        </h3>
                        {posts.length === 0 ? (
                            <div className="glass-card text-center" style={{ padding: '3rem 1.5rem' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✍️</div>
                                <p className="mb-5">You haven't written anything yet.</p>
                                <Link to="/create-post" className="btn btn-primary">Create your first post</Link>
                            </div>
                        ) : (
                            <div className="grid">
                                {posts.map(post => (
                                    <Link to={`/post/${post._id}`} key={post._id} style={{ textDecoration: 'none' }}>
                                        <article className="glass-card post-card">
                                            {post.image && (
                                                <div className="post-card-img">
                                                    <img src={post.image} alt={post.title} />
                                                </div>
                                            )}
                                            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>
                                                {post.title}
                                            </h4>
                                            <p className="post-card-excerpt" style={{ fontSize: '0.87rem' }}>
                                                {post.content?.substring(0, 110)}…
                                            </p>
                                            <div className="post-card-footer mt-auto pt-3">
                                                <span style={{ color: 'var(--purple-light)' }}>
                                                    ❤ {post.likes?.length ?? 0} likes
                                                </span>
                                                <span style={{ color: 'var(--text-faint)' }}>
                                                    {new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </div>
        </main>
    )
}