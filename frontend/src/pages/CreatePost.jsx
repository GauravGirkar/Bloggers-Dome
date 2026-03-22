import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CreatePost() {
    const { token } = useAuth()
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [image, setImage] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!token) {
        return (
            <main className="container main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="glass-card text-center" style={{ maxWidth: 440, padding: '3rem 2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                    <h2 className="mb-2">Access Required</h2>
                    <p className="mb-5">You need to be signed in to write posts.</p>
                    <button className="btn btn-primary w-100" onClick={() => navigate('/login')}>
                        Sign in to continue
                    </button>
                </div>
            </main>
        )
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            setError('Please fill in both title and content.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/posts/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    image: image.trim() || undefined
                })
            })

            const data = await response.json()
            if (response.ok) {
                navigate('/')
            } else {
                setError(data.message || 'Failed to create post.')
            }
        } catch {
            setError('Network error: Could not connect to the server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="container main-content">
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2.5rem' }}>
                    <p className="mono mb-2 text-green" style={{ textTransform: 'uppercase', letterSpacing: '2.5px' }}>
                        New post
                    </p>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontFamily: 'var(--font-heading)' }}>
                        Draft your next post
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        Share your ideas, code snippets, and stories with the community.
                    </p>
                </header>

                {error && <div className="toast toast-error mb-5">{error}</div>}

                <form onSubmit={handleSubmit} className="glass-card">
                    <div className="form-group">
                        <label className="form-label" htmlFor="post-title">Post Title *</label>
                        <input
                            type="text"
                            id="post-title"
                            className="form-control"
                            placeholder="An interesting perspective on things…"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="post-image">
                            Cover Image URL{' '}
                            <span style={{ color: 'var(--text-faint)', textTransform: 'none', letterSpacing: 0, fontStyle: 'italic' }}>(optional)</span>
                        </label>
                        <input
                            type="url"
                            id="post-image"
                            className="form-control"
                            placeholder="https://images.unsplash.com/…"
                            value={image}
                            onChange={e => setImage(e.target.value)}
                        />
                        {image && (
                            <div style={{ marginTop: '0.75rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '200px' }}>
                                <img
                                    src={image}
                                    alt="Cover preview"
                                    style={{ width: '100%', objectFit: 'cover', maxHeight: '200px' }}
                                    onError={e => { e.target.style.display = 'none' }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="form-group mb-5">
                        <label className="form-label" htmlFor="post-content">Your Content *</label>
                        <textarea
                            id="post-content"
                            className="form-control"
                            placeholder="Once upon a time in a codebase far, far away…"
                            rows={16}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            required
                        />
                        <div style={{ marginTop: '0.4rem', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                            {content.length} characters
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Publishing…' : '✦ Publish Post'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}