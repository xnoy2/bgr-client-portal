import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useCallback, useEffect, useState } from 'react';

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photos, startIndex, onClose }) {
    const [idx, setIdx] = useState(startIndex);
    const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

    useEffect(() => {
        function onKey(e) {
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape')     onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [prev, next, onClose]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-[70] flex flex-col"
            style={{ background: 'rgba(5,12,8,0.95)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {idx + 1} / {photos.length}
                </span>
                <button onClick={onClose}
                    className="flex items-center justify-center w-9 h-9 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                    </svg>
                </button>
            </div>

            <div className="flex-1 flex items-center justify-center relative min-h-0 px-14">
                {photos.length > 1 && (
                    <button onClick={prev}
                        className="absolute left-2 flex items-center justify-center w-10 h-10 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="10,3 5,8 10,13"/>
                        </svg>
                    </button>
                )}
                <img key={idx} src={photos[idx]} alt={`Photo ${idx + 1}`}
                    className="max-w-full max-h-full rounded-xl object-contain"
                    style={{ maxHeight: 'calc(100vh - 160px)', userSelect: 'none' }} />
                {photos.length > 1 && (
                    <button onClick={next}
                        className="absolute right-2 flex items-center justify-center w-10 h-10 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6,3 11,8 6,13"/>
                        </svg>
                    </button>
                )}
            </div>

            {photos.length > 1 && (
                <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto">
                    {photos.map((src, i) => (
                        <button key={i} onClick={() => setIdx(i)}
                            className="flex-shrink-0 rounded-lg overflow-hidden"
                            style={{
                                width: 48, height: 48,
                                opacity: i === idx ? 1 : 0.4,
                                border: i === idx ? '2px solid #1A1A1A' : '2px solid transparent',
                            }}>
                            <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Single thumbnail with photo-count overlay ─────────────────────────────────

function SingleThumbnail({ photos, onClick }) {
    if (!photos?.length) return null;
    const extra = photos.length - 1;
    return (
        <div className="relative overflow-hidden cursor-pointer"
            style={{ aspectRatio: '16/9', maxHeight: 200 }}
            onClick={onClick}>
            <img src={photos[0]} alt=""
                className="w-full h-full object-cover"
                style={{ transition: 'transform 0.25s' }}
                onMouseEnter={e => !extra && (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => !extra && (e.currentTarget.style.transform = 'scale(1)')}
            />
            {extra > 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 pointer-events-none"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <rect x="1" y="3" width="9" height="7" rx="1.2"/><rect x="6" y="6" width="9" height="7" rx="1.2"/>
                    </svg>
                    <span className="text-white font-bold leading-none" style={{ fontSize: 22 }}>+{extra}</span>
                    <span className="text-white font-medium" style={{ fontSize: 11, opacity: 0.85 }}>View more</span>
                </div>
            )}
        </div>
    );
}

// ── Update detail modal ───────────────────────────────────────────────────────

function UpdateDetailModal({ update, onClose }) {
    const [lightboxIdx, setLightboxIdx] = useState(null);
    const photos = update.photos ?? [];

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <>
            {lightboxIdx !== null && (
                <Lightbox photos={photos} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
            )}
            <div className="fixed inset-0 z-[52] flex items-center justify-center p-4"
                style={{ background: 'rgba(14,32,25,0.75)', backdropFilter: 'blur(4px)' }}
                onClick={e => e.target === e.currentTarget && onClose()}>

                <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
                    style={{ maxHeight: '88vh' }}>

                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                        style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #1A1A1A, #2d5a42)', color: '#1A1A1A' }}>
                                {(update.author_name ?? 'T')[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-forest">{update.author_name ?? 'Project Team'}</p>
                                <p className="text-xs" style={{ color: '#888480' }}>{update.date}</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        </button>
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto flex-1">
                        <div className="px-5 pt-4 pb-3">
                            <p className="text-base font-bold text-forest mb-1.5">{update.title}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                                {update.project_name && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: 'rgba(26,26,26,0.05)', color: '#1A1A1A' }}>
                                        {update.project_name}
                                    </span>
                                )}
                                {update.stage_name && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: 'rgba(26,26,26,0.06)', color: '#1A1A1A' }}>
                                        {update.stage_name}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="px-5 pb-4">
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4a3f30' }}>
                                {update.body}
                            </p>
                        </div>

                        <div className="px-5 pb-5">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5" style={{ color: '#888480' }}>
                                Photos{photos.length > 0 ? ` · ${photos.length}` : ''}
                            </p>
                            {photos.length > 0 ? (
                                <div className="grid grid-cols-3 gap-1.5">
                                    {photos.map((url, i) => (
                                        <div key={i} className="relative rounded-xl overflow-hidden cursor-pointer"
                                            style={{ aspectRatio: '1' }}
                                            onClick={() => setLightboxIdx(i)}>
                                            <img src={url} alt="" className="w-full h-full object-cover"
                                                style={{ transition: 'transform 0.2s' }}
                                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl"
                                    style={{ aspectRatio: '2/1', background: '#F1F1EF', border: '1.5px dashed #D1CDC7' }}>
                                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#c9c0b3" strokeWidth="1.4" strokeLinecap="round">
                                        <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                                        <circle cx="8" cy="8" r="2.2"/>
                                        <path d="M5 3l1-2h4l1 2"/>
                                    </svg>
                                    <span className="text-xs font-medium" style={{ color: '#c9c0b3' }}>No images uploaded</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UpdatesIndex({ updates }) {
    const [detailUpdate, setDetailUpdate] = useState(null);

    return (
        <AuthenticatedLayout title="Updates" breadcrumb="All progress updates across projects">

            {detailUpdate && (
                <UpdateDetailModal update={detailUpdate} onClose={() => setDetailUpdate(null)} />
            )}

            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Progress Updates</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                        {updates.length} update{updates.length !== 1 ? 's' : ''} across all projects
                    </p>
                </div>

                {updates.length === 0 ? (
                    <div className="glass-card rounded-2xl p-12 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-bold text-forest mb-1">No updates yet</p>
                        <p className="text-xs" style={{ color: '#888480' }}>Updates posted by workers will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
                        {updates.map(u => {
                            const photos = u.photos ?? [];
                            return (
                                <div key={u.id}
                                    className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                                    style={{}}
                                    onClick={() => setDetailUpdate(u)}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,26,26,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                                    {/* Card header */}
                                    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #1A1A1A, #2d5a42)', color: '#1A1A1A' }}>
                                                {(u.author_name ?? 'T')[0]?.toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold leading-tight text-forest">
                                                    {u.author_name ?? 'Project Team'}
                                                </p>
                                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                    <p className="text-xs" style={{ color: '#888480' }}>{u.date}</p>
                                                    {u.stage_name && (
                                                        <>
                                                            <span style={{ color: '#D1CDC7', fontSize: 10 }}>·</span>
                                                            <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                                style={{ background: 'rgba(26,26,26,0.06)', color: '#1A1A1A' }}>
                                                                {u.stage_name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Project name pill */}
                                    {u.project_name && (
                                        <div className="px-4 pb-2">
                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                style={{ background: 'rgba(26,60,46,0.07)', color: '#1A1A1A' }}>
                                                {u.project_name}
                                            </span>
                                        </div>
                                    )}

                                    {/* Title + 2-line clamped body */}
                                    <div className="px-4 pb-3 flex-1">
                                        <p className="text-base font-semibold text-forest mb-1">{u.title}</p>
                                        <p className="text-sm leading-relaxed"
                                            style={{
                                                color: '#4a3f30',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                            }}>
                                            {u.body}
                                        </p>
                                    </div>

                                    {/* Single thumbnail with count overlay, or no-image placeholder */}
                                    {photos.length > 0 ? (
                                        <SingleThumbnail
                                            photos={photos}
                                            onClick={e => { e.stopPropagation(); setDetailUpdate(u); }}
                                        />
                                    ) : (
                                        <div className="mx-4 mb-3 flex flex-col items-center justify-center gap-1.5 rounded-xl"
                                            style={{ aspectRatio: '2/1', background: '#F1F1EF', border: '1.5px dashed #D1CDC7' }}>
                                            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#c9c0b3" strokeWidth="1.4" strokeLinecap="round">
                                                <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                                                <circle cx="8" cy="8" r="2.2"/>
                                                <path d="M5 3l1-2h4l1 2"/>
                                            </svg>
                                            <span className="text-xs font-medium" style={{ color: '#c9c0b3' }}>No images uploaded</span>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="px-4 py-3 flex items-center gap-1.5"
                                        style={{ borderTop: '0.5px solid #F1F1EF' }}>
                                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#888480" strokeWidth="1.5" strokeLinecap="round">
                                            <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                                        </svg>
                                        <span className="text-xs" style={{ color: '#888480' }}>Project update from BGR Building</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
