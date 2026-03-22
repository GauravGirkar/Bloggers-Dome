import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'

/* ─── Helpers ──────────────────────────────────────────── */
function readingTime(text = '') {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
}

/* ─── Icons ────────────────────────────────────────────── */
function HeartIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
    )
}
function ChatIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
    )
}
function ClockIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
    )
}
function SearchIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
    )
}

const SORT_OPTIONS = [
    { id: 'newest',   label: 'Newest' },
    { id: 'oldest',   label: 'Oldest' },
    { id: 'mostLiked',label: 'Most Liked' },
]

export default function Home() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [sort, setSort] = useState('newest')

    useEffect(() => {
        async function fetchPosts() {
            try {
                const res = await fetch('/api/posts/')
                if (!res.ok) throw new Error('Failed to fetch')
                const data = await res.json()
                setPosts(data.postFetched || [])
            } catch {
                setError('Failed to load posts or the server is unavailable.')
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    const filteredPosts = useMemo(() => {
        let list = [...posts]
        if (query.trim()) {
            const q = query.toLowerCase()
            list = list.filter(p =>
                p.title?.toLowerCase().includes(q) ||
                p.content?.toLowerCase().includes(q) ||
                p.author?.username?.toLowerCase().includes(q)
            )
        }
        if (sort === 'newest')    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        if (sort === 'oldest')    list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        if (sort === 'mostLiked') list.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0))
        return list
    }, [posts, query, sort])

    return (
        <main className="main-content container page-enter">

            {/* ── Hero ── */}
            <header className="page-header">
                <span className="page-eyebrow">Community Feed</span>
                <h1 className="page-title">Explore Ideas</h1>
                <p className="page-subtitle">
                    A curated space for developers, thinkers, and creators to share knowledge and stories.
                </p>
            </header>

            {/* ── Search ── */}
            {!loading && !error && (
                <>
                    <div className="search-bar-wrapper">
                        <span className="search-icon"><SearchIcon /></span>
                        <input
                            type="search"
                            className="search-input"
                            placeholder="Search posts, topics, or authors…"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            aria-label="Search posts"
                        />
                    </div>

                    {/* Sort pills */}
                    <div className="filter-pills">
                        {SORT_OPTIONS.map(opt => (
                            <button
                                key={opt.id}
                                className={`filter-pill${sort === opt.id ? ' active' : ''}`}
                                onClick={() => setSort(opt.id)}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* ── States ── */}
            {loading ? (
                <div className="grid">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="glass-card" style={{ padding: '2rem' }}>
                            <div className="skeleton mb-3" style={{ height: '185px', width: '100%', borderRadius: 'var(--radius-sm)' }} />
                            <div className="skeleton mb-3" style={{ height: '12px', width: '38%' }} />
                            <div className="skeleton mb-2" style={{ height: '22px', width: '85%' }} />
                            <div className="skeleton mb-2" style={{ height: '13px', width: '100%' }} />
                            <div className="skeleton" style={{ height: '13px', width: '65%' }} />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="empty-state" style={{ borderColor: 'rgba(245,101,101,0.25)' }}>
                    <span className="empty-state-icon">⚠️</span>
                    <h3>Connection error</h3>
                    <p>{error}</p>
                    <button className="btn btn-outline" onClick={() => window.location.reload()}>Retry</button>
                </div>
            ) : posts.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">✍️</span>
                    <h3>It's quiet here</h3>
                    <p>Be the first to share your thoughts with the community.</p>
                    <Link to="/create-post" className="btn btn-primary">Start Writing</Link>
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">🔍</span>
                    <h3>No results for "{query}"</h3>
                    <p>Try a different keyword or clear the search.</p>
                    <button className="btn btn-outline" onClick={() => setQuery('')}>Clear Search</button>
                </div>
            ) : (
                <>
                    {/* Result count when searching */}
                    {query && (
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '1.25rem', textAlign: 'center' }}>
                            {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''} for "{query}"
                        </p>
                    )}
                    <div className="grid">
                        {filteredPosts.map((post) => (
                            <Link to={`/post/${post._id}`} key={post._id} style={{ textDecoration: 'none' }}>
                                <article className="glass-card post-card">
                                    {post.image && (
                                        <div className="post-card-img">
                                            <img src={post.image} alt={post.title} loading="lazy" />
                                        </div>
                                    )}
                                    <div className="post-card-meta">
                                        <span className="post-card-author">@{post.author?.username || 'unknown'}</span>
                                        <span className="post-card-tag">Article</span>
                                    </div>
                                    <h2 className="post-card-title">{post.title}</h2>
                                    <p className="post-card-excerpt">
                                        {post.content
                                            ? (post.content.length > 130 ? post.content.substring(0, 130) + '…' : post.content)
                                            : 'No preview available.'}
                                    </p>
                                    <div className="post-card-footer">
                                        <div className="post-card-stats">
                                            <span className="post-stat"><HeartIcon />{post.likes?.length ?? 0}</span>
                                            <span className="post-stat"><ChatIcon />comments</span>
                                            <span className="post-stat read-time"><ClockIcon />{readingTime(post.content)} min</span>
                                        </div>
                                        <span>{new Date(post.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </main>
    )
}