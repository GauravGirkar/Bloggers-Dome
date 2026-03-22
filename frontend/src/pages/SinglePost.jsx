import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/* ─── Reading time helper ──── */
function readingTime(text = '') {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
}

/* ─── SVG Icons ──────────────────────────────────────── */
function HeartIcon({ filled }) {
    return (
        <svg className="like-icon" width="15" height="15" viewBox="0 0 24 24"
            fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
    )
}
function TrashIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
        </svg>
    )
}
function SendIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
    )
}
function EditIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    )
}
function ClockIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
    )
}
function ArrowLeftIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
        </svg>
    )
}

export default function SinglePost() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { token, userId } = useAuth()
    const articleRef = useRef(null)

    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Reading progress
    const [readProgress, setReadProgress] = useState(0)

    // Likes
    const [likes, setLikes] = useState(0)
    const [liked, setLiked] = useState(false)
    const [likeLoading, setLikeLoading] = useState(false)

    // Comments
    const [comments, setComments] = useState([])
    const [commentsLoading, setCommentsLoading] = useState(true)
    const [commentText, setCommentText] = useState('')
    const [commentSubmitting, setCommentSubmitting] = useState(false)
    const [commentError, setCommentError] = useState('')

    // Author info
    const [authorInfo, setAuthorInfo] = useState(null)

    // Delete post
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState('')

    /* ── Reading progress bar ── */
    useEffect(() => {
        function onScroll() {
            const el = articleRef.current
            if (!el) return
            const { top, height } = el.getBoundingClientRect()
            const viewH = window.innerHeight
            const scrolled = Math.max(0, viewH - top)
            const pct = Math.min(100, (scrolled / (height + viewH)) * 100)
            setReadProgress(pct)
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [post])

    /* ── Fetch post ── */
    useEffect(() => {
        async function fetchPost() {
            try {
                const res = await fetch(`/api/posts/${id}`)
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (!data.postFetched) throw new Error()
                setPost(data.postFetched)
                setLikes(data.postFetched.likes?.length ?? 0)
                if (userId && data.postFetched.likes?.includes(userId)) setLiked(true)

                // Fetch author details
                const authorId = data.postFetched.author?._id
                if (authorId) {
                    fetch(`/api/user/${authorId}`)
                        .then(r => r.ok ? r.json() : null)
                        .then(d => { if (d?.getUser) setAuthorInfo(d.getUser) })
                        .catch(() => {})
                }
            } catch {
                setError('Failed to load this post.')
            } finally {
                setLoading(false)
            }
        }
        fetchPost()
    }, [id, userId])

    /* ── Fetch comments ── */
    const fetchComments = useCallback(async () => {
        setCommentsLoading(true)
        try {
            const res = await fetch(`/api/posts/${id}/comments`)
            if (res.ok) {
                const data = await res.json()
                setComments(data.commentOnPost || [])
            }
        } catch {}
        finally { setCommentsLoading(false) }
    }, [id])

    useEffect(() => { fetchComments() }, [fetchComments])

    /* ── Like toggle ── */
    async function handleLike() {
        if (!token) { navigate('/login'); return }
        setLikeLoading(true)
        try {
            const res = await fetch(`/api/posts/${id}/like`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                setLikes(data.likes)
                setLiked(prev => !prev)
            }
        } catch {}
        finally { setLikeLoading(false) }
    }

    /* ── Submit comment ── */
    async function handleCommentSubmit(e) {
        e.preventDefault()
        if (!token) { navigate('/login'); return }
        if (!commentText.trim()) return
        setCommentSubmitting(true)
        setCommentError('')
        try {
            const res = await fetch(`/api/posts/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ comment: commentText.trim() })
            })
            if (res.ok) {
                setCommentText('')
                await fetchComments()
            } else {
                const d = await res.json()
                setCommentError(d.message || 'Failed to post comment.')
            }
        } catch {
            setCommentError('Network error. Please try again.')
        } finally {
            setCommentSubmitting(false)
        }
    }

    /* ── Delete comment ── */
    async function handleDeleteComment(commentId) {
        if (!token) return
        try {
            const res = await fetch(`/api/posts/${id}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) await fetchComments()
        } catch {}
    }

    /* ── Delete post ── */
    async function handleDeletePost() {
        if (!window.confirm('Delete this post permanently?')) return
        setDeleteLoading(true)
        try {
            const res = await fetch(`/api/posts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) { navigate('/'); return }
            const d = await res.json()
            setDeleteError(d.message || 'Could not delete post.')
        } catch {
            setDeleteError('Network error.')
        } finally {
            setDeleteLoading(false)
        }
    }

    const isAuthor = userId && post?.author?._id === userId
    const defaultAvatar = 'https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg'

    /* ── Loading skeleton ── */
    if (loading) return (
        <main className="container main-content">
            <div className="single-post-container page-enter">
                <div className="skeleton mb-4" style={{ height: '12px', width: '25%' }} />
                <div className="skeleton mb-3" style={{ height: '44px', width: '85%' }} />
                <div className="skeleton mb-6" style={{ height: '12px', width: '45%' }} />
                <div className="skeleton mb-2" style={{ height: '240px', width: '100%', borderRadius: 'var(--radius-md)' }} />
                <div className="skeleton mt-6 mb-2" style={{ height: '14px', width: '100%' }} />
                <div className="skeleton mb-2" style={{ height: '14px', width: '90%' }} />
                <div className="skeleton" style={{ height: '14px', width: '75%' }} />
            </div>
        </main>
    )

    /* ── Error ── */
    if (error || !post) return (
        <main className="container main-content text-center">
            <div className="glass-card" style={{ maxWidth: 480, margin: '0 auto', borderColor: 'rgba(245,101,101,0.25)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💔</div>
                <h2 style={{ color: 'var(--red)' }}>Post not found</h2>
                <p>{error || 'This post could not be located.'}</p>
                <button onClick={() => navigate('/')} className="btn btn-outline mt-4">
                    <ArrowLeftIcon /> Go back home
                </button>
            </div>
        </main>
    )

    return (
        <>
            {/* Reading progress bar */}
            <div className="reading-progress" style={{ width: `${readProgress}%` }} aria-hidden="true" />

            <main className="container main-content">
                <article className="single-post-container page-enter" ref={articleRef}>

                    {/* Back */}
                    <button onClick={() => navigate(-1)} className="btn btn-outline mb-5"
                        style={{ padding: '0.38rem 0.85rem', fontSize: '0.77rem', gap: '0.4rem', opacity: 0.7 }}>
                        <ArrowLeftIcon /> Back
                    </button>

                    {/* ── Header ── */}
                    <header className="single-post-header">
                        <div className="single-post-eyebrow">
                            <span className="post-card-tag">Article</span>
                            <span className="meta-sep">·</span>
                            <span className="read-time"><ClockIcon />{readingTime(post.content)} min read</span>
                        </div>

                        <h1 className="single-post-title">{post.title}</h1>

                        <div className="single-post-meta">
                            <span className="author-chip">
                                <span className="author-chip-avatar">
                                    {authorInfo?.profile_pic && authorInfo.profile_pic !== defaultAvatar
                                        ? <img src={authorInfo.profile_pic} alt={post.author?.username} />
                                        : (post.author?.username?.charAt(0).toUpperCase() || '?')
                                    }
                                </span>
                                <span style={{ color: 'var(--green)' }}>@{post.author?.username || 'unknown'}</span>
                            </span>
                            <span className="meta-sep">·</span>
                            <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            <span className="meta-sep">·</span>
                            <span style={{ color: 'var(--text-faint)' }}>{likes} {likes === 1 ? 'like' : 'likes'}</span>
                        </div>
                    </header>

                    {/* Cover image */}
                    {post.image && (
                        <figure style={{ marginBottom: '2rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '440px' }}>
                            <img src={post.image} alt={post.title} style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: '440px' }} loading="lazy" />
                        </figure>
                    )}

                    {/* Article body */}
                    <div className="glass-card card-static article-body mb-4"
                        style={{ padding: '2.25rem', background: 'rgba(255,255,255,0.018)', border: 'none' }}>
                        {post.content.split('\n').map((paragraph, index) => (
                            paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                        ))}
                    </div>

                    {/* ── Actions bar ── */}
                    <div className="post-actions-bar">
                        <button
                            onClick={handleLike}
                            disabled={likeLoading}
                            className={`btn-like${liked ? ' liked' : ''}`}
                            title={token ? (liked ? 'Unlike this post' : 'Like this post') : 'Sign in to like'}
                            aria-label={liked ? 'Unlike' : 'Like'}
                        >
                            <HeartIcon filled={liked} />
                            <strong>{likes}</strong>
                            <span style={{ color: 'var(--text-faint)', marginLeft: '0.1rem' }}>{likes === 1 ? 'like' : 'likes'}</span>
                        </button>

                        {isAuthor && (
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.55rem' }}>
                                <Link to={`/edit-post/${id}`} className="btn btn-outline"
                                    style={{ padding: '0.42rem 0.85rem', fontSize: '0.78rem', gap: '0.4rem' }}>
                                    <EditIcon /> Edit
                                </Link>
                                <button onClick={handleDeletePost} disabled={deleteLoading}
                                    className="btn btn-danger"
                                    style={{ padding: '0.42rem 0.85rem', fontSize: '0.78rem', gap: '0.4rem' }}>
                                    <TrashIcon /> {deleteLoading ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        )}
                    </div>

                    {deleteError && <div className="toast toast-error">{deleteError}</div>}

                    {/* ── Author footer card ── */}
                    {authorInfo && (
                        <div className="author-footer-card">
                            <div className="author-footer-avatar">
                                {authorInfo.profile_pic && authorInfo.profile_pic !== defaultAvatar
                                    ? <img src={authorInfo.profile_pic} alt={authorInfo.username} />
                                    : (authorInfo.username?.charAt(0).toUpperCase() || '?')
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="author-footer-name">{authorInfo.name || authorInfo.username}</p>
                                <p className="author-footer-handle">@{authorInfo.username}</p>
                                {authorInfo.bio && (
                                    <p className="author-footer-bio">{authorInfo.bio}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── Comments Section ── */}
                    <section className="comments-section" aria-label="Comments">
                        <h3>
                            Comments
                            <span className="comment-count-badge">{comments.length}</span>
                        </h3>

                        {token ? (
                            <form onSubmit={handleCommentSubmit} className="comment-input-row">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Share your thoughts…"
                                    value={commentText}
                                    onChange={e => { setCommentText(e.target.value); setCommentError('') }}
                                    maxLength={500}
                                    disabled={commentSubmitting}
                                    aria-label="Write a comment"
                                />
                                <button type="submit" className="btn btn-primary"
                                    disabled={commentSubmitting || !commentText.trim()}
                                    style={{ flexShrink: 0, gap: '0.4rem' }}>
                                    {commentSubmitting ? '…' : <><SendIcon />Post</>}
                                </button>
                            </form>
                        ) : (
                            <div className="glass-card card-static mb-5 text-center"
                                style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.018)' }}>
                                <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                                    <Link to="/login" style={{ color: 'var(--purple-light)' }}>Sign in</Link> to join the conversation.
                                </p>
                            </div>
                        )}

                        {commentError && <div className="toast toast-error mb-4">{commentError}</div>}

                        {/* Comment list */}
                        {commentsLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {[1, 2, 3].map(i => (
                                    <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div className="skeleton mb-2" style={{ height: '11px', width: '22%' }} />
                                            <div className="skeleton" style={{ height: '13px', width: '68%' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center" style={{ padding: '2.5rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                                No comments yet. Be the first!
                            </div>
                        ) : (
                            <div className="comment-list">
                                {comments.map(c => (
                                    <div key={c._id} className="comment-item">
                                        <div className="comment-avatar">
                                            {c.user?.profile_pic && c.user.profile_pic !== defaultAvatar
                                                ? <img src={c.user.profile_pic} alt={c.user?.username} />
                                                : (c.user?.username?.charAt(0).toUpperCase() || '?')
                                            }
                                        </div>
                                        <div className="comment-body">
                                            <div className="comment-header">
                                                <span className="comment-username">@{c.user?.username || 'user'}</span>
                                                <span className="comment-date">
                                                    {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <p className="comment-text">{c.comment}</p>
                                        </div>
                                        {userId && c.user?._id === userId && (
                                            <button className="comment-delete-btn" onClick={() => handleDeleteComment(c._id)}
                                                title="Delete comment" aria-label="Delete comment">
                                                <TrashIcon />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </article>
            </main>
        </>
    )
}