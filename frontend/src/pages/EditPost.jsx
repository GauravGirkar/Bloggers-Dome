import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function EditPost() {
    const { id } = useParams()
    const { token, userId } = useAuth()
    const navigate = useNavigate()

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [image, setImage] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) { navigate('/login'); return }

        async function fetchPost() {
            try {
                const res = await fetch(`/api/posts/${id}`)
                if (!res.ok) throw new Error('Post not found')
                const data = await res.json()
                const post = data.postFetched
                if (!post) throw new Error('Post not found')
                // Verify ownership
                if (post.author?._id !== userId) {
                    navigate(`/post/${id}`)
                    return
                }
                setTitle(post.title)
                setContent(post.content)
                setImage(post.image || '')
            } catch {
                setError('Could not load post for editing.')
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [id, token, userId, navigate])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required.')
            return
        }
        setSaving(true)
        setError('')
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title: title.trim(), content: content.trim(), image: image.trim() || undefined })
            })
            const data = await res.json()
            if (res.ok) {
                navigate(`/post/${id}`)
            } else {
                setError(data.message || 'Failed to update post.')
            }
        } catch {
            setError('Network error. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <main className="container main-content">
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <div className="skeleton mb-4" style={{ height: '36px', width: '50%' }} />
                <div className="skeleton mb-3" style={{ height: '48px', width: '100%' }} />
                <div className="skeleton" style={{ height: '240px', width: '100%' }} />
            </div>
        </main>
    )

    return (
        <main className="container main-content">
            <div style={{ maxWidth: '700px', margin: '0 auto' }}>
                <header style={{ marginBottom: '2rem' }}>
                    <p className="mono mb-2 text-purple" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
                        Editing post
                    </p>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontFamily: 'var(--font-heading)' }}>
                        Refine your words
                    </h1>
                </header>

                {error && <div className="toast toast-error mb-5">{error}</div>}

                <form onSubmit={handleSubmit} className="glass-card">
                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-title">Post Title</label>
                        <input
                            type="text"
                            id="edit-title"
                            className="form-control"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="A compelling title…"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="edit-image">Cover Image URL <span style={{ color: 'var(--text-faint)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                        <input
                            type="url"
                            id="edit-image"
                            className="form-control"
                            value={image}
                            onChange={e => setImage(e.target.value)}
                            placeholder="https://images.unsplash.com/…"
                        />
                        {image && (
                            <div style={{ marginTop: '0.75rem', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxHeight: '180px' }}>
                                <img src={image} alt="Preview" style={{ width: '100%', objectFit: 'cover', maxHeight: '180px' }} onError={e => { e.target.style.display = 'none' }} />
                            </div>
                        )}
                    </div>

                    <div className="form-group mb-5">
                        <label className="form-label" htmlFor="edit-content">Content</label>
                        <textarea
                            id="edit-content"
                            className="form-control"
                            rows={16}
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Your story…"
                            required
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <button type="button" className="btn btn-outline" onClick={() => navigate(`/post/${id}`)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
