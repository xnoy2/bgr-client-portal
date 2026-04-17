import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

// ── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = [
    { id: 'details',  label: 'Details'  },
    { id: 'progress', label: 'Progress' },
    { id: 'updates',  label: 'Updates'  },
    { id: 'next',     label: "What's Next" },
];

function TabBar({ active, onChange, updatesCount }) {
    return (
        <div className="flex gap-1 p-1 rounded-xl mb-5"
            style={{ background: '#f5f0e8', border: '0.5px solid #e4ddd2' }}>
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className="flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all relative"
                    style={active === tab.id
                        ? { background: '#fff', color: '#1a3c2e', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '0.5px solid #e4ddd2' }
                        : { background: 'transparent', color: '#8a7e6e', border: '0.5px solid transparent' }}>
                    {tab.label}
                    {tab.id === 'updates' && updatesCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold"
                            style={{ background: '#c9a84c', fontSize: 9 }}>
                            {updatesCount > 9 ? '9+' : updatesCount}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}

// ── Stage timeline ────────────────────────────────────────────────────────────

const STAGE_STYLE = {
    pending:     { fill: '#f5f0e8', stroke: '#e4ddd2', text: '#b0a090', labelColor: '#b0a090' },
    in_progress: { fill: '#c9a84c', stroke: '#b8943c', text: '#fff',    labelColor: '#b8943c' },
    completed:   { fill: '#1a3c2e', stroke: '#142e23', text: '#fff',    labelColor: '#1a3c2e' },
};

const STATUS_LABEL = { pending: 'Upcoming', in_progress: 'In Progress', completed: 'Complete' };

function StageIcon({ status, order }) {
    if (status === 'completed') return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="2,8 6,12 14,4"/>
        </svg>
    );
    if (status === 'in_progress') return (
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="8" cy="8" r="3" fill="currentColor"/><circle cx="8" cy="8" r="6.5"/>
        </svg>
    );
    return <span style={{ color: '#d0c8bc', fontSize: 11, fontWeight: 700 }}>{order}</span>;
}

function StageTimeline({ stages }) {
    return (
        <>
            {/* Mobile: vertical list */}
            <div className="flex flex-col gap-0 sm:hidden">
                {stages.map((stage, i) => {
                    const isLast = i === stages.length - 1;
                    const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                    return (
                        <div key={stage.id} className="flex items-stretch gap-3">
                            <div className="flex flex-col items-center" style={{ width: 36 }}>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: s.fill, border: `2px solid ${s.stroke}`, color: s.text }}>
                                    <StageIcon status={stage.status} order={stage.order} />
                                </div>
                                {!isLast && (
                                    <div className="flex-1 w-0.5 my-1"
                                        style={{ background: stage.status === 'completed' ? '#1a3c2e' : '#e4ddd2', minHeight: 16 }} />
                                )}
                            </div>
                            <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`} style={{ paddingTop: 6 }}>
                                <p className="text-sm font-medium leading-tight" style={{ color: s.labelColor }}>{stage.name}</p>
                                <p className="text-xs mt-0.5"
                                    style={{ color: stage.status === 'in_progress' ? '#b8943c' : '#b0a090' }}>
                                    {STATUS_LABEL[stage.status]}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop: horizontal timeline */}
            <div className="hidden sm:flex items-start">
                {stages.map((stage, i) => {
                    const isLast = i === stages.length - 1;
                    const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                    return (
                        <div key={stage.id} className="flex items-start flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ background: s.fill, border: `2px solid ${s.stroke}`, color: s.text }}>
                                    <StageIcon status={stage.status} order={stage.order} />
                                </div>
                                <p className="text-xs text-center font-medium mt-2 leading-tight w-full px-0.5"
                                    style={{ color: s.labelColor }}>{stage.name}</p>
                                <p className="text-xs text-center mt-0.5"
                                    style={{ color: stage.status === 'in_progress' ? '#b8943c' : '#b0a090' }}>
                                    {STATUS_LABEL[stage.status]}
                                </p>
                            </div>
                            {!isLast && (
                                <div className="flex-shrink-0 h-0.5 mt-4"
                                    style={{ width: 20, background: stage.status === 'completed' ? '#1a3c2e' : '#e4ddd2' }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

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

    useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={onClose}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                <span className="text-white text-sm font-medium opacity-60">{idx + 1} / {photos.length}</span>
                <div className="flex items-center gap-3">
                    <a href={photos[idx]} download target="_blank" rel="noreferrer"
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                        title="Download">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <path d="M8 2v8M5 7l3 3 3-3"/><path d="M2 12h12"/>
                        </svg>
                    </a>
                    <button onClick={onClose} className="p-2 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main image */}
            <div className="flex-1 flex items-center justify-center relative px-12 min-h-0" onClick={e => e.stopPropagation()}>
                {photos.length > 1 && (
                    <button onClick={prev}
                        className="absolute left-2 p-2.5 rounded-full z-10"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="10,3 5,8 10,13"/>
                        </svg>
                    </button>
                )}
                <img src={photos[idx]} alt={`Photo ${idx + 1}`}
                    className="max-h-full max-w-full rounded-xl object-contain"
                    style={{ maxHeight: 'calc(100vh - 180px)' }} />
                {photos.length > 1 && (
                    <button onClick={next}
                        className="absolute right-2 p-2.5 rounded-full z-10"
                        style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="6,3 11,8 6,13"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
                <div className="flex-shrink-0 px-4 py-3 flex gap-2 justify-center overflow-x-auto" onClick={e => e.stopPropagation()}>
                    {photos.map((p, i) => (
                        <button key={i} onClick={() => setIdx(i)}
                            className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all"
                            style={{ border: i === idx ? '2px solid #c9a84c' : '2px solid transparent', opacity: i === idx ? 1 : 0.45 }}>
                            <img src={p} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Flash ────────────────────────────────────────────────────────────────────

function Flash({ flash }) {
    if (!flash?.success && !flash?.error) return null;
    const ok = !!flash.success;
    return (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={ok
                ? { background: 'rgba(34,197,94,0.08)', color: '#15803d', border: '0.5px solid rgba(34,197,94,0.2)' }
                : { background: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.2)' }}>
            {flash.success ?? flash.error}
        </div>
    );
}

// ── Tab panels ────────────────────────────────────────────────────────────────

function DetailsTab({ project, ghl }) {
    const hasSpecs = (ghl?.custom_fields ?? []).some(cf =>
        cf.fieldValueArray?.length || cf.fieldValueString || cf.value
    );

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>Key Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Start Date</p>
                        <p className="text-sm font-medium text-forest">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                        <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Est. Completion</p>
                        <p className="text-sm font-medium text-forest">{formatDate(project.estimated_completion)}</p>
                    </div>
                </div>
            </div>

            {project.address && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8a7e6e' }}>Site Address</h3>
                    <div className="flex items-start gap-2.5">
                        <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round">
                            <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                        </svg>
                        <p className="text-sm font-medium text-forest">{project.address}</p>
                    </div>
                </div>
            )}

            {ghl?.contact && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>Your Details On File</h3>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                            style={{ background: 'rgba(26,60,46,0.06)', color: '#1a3c2e', border: '0.5px solid #e4ddd2' }}>
                            {initials(ghl.contact.name ?? '')}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-forest">{ghl.contact.name}</p>
                            {ghl.contact.email && <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>{ghl.contact.email}</p>}
                            {ghl.contact.phone && <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>{ghl.contact.phone}</p>}
                        </div>
                    </div>
                    {ghl.source && (
                        <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid #f5f0e8' }}>
                            <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Enquiry Source</p>
                            <p className="text-sm text-forest">{ghl.source}</p>
                        </div>
                    )}
                </div>
            )}

            {hasSpecs && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>Project Specifications</h3>
                    <div className="space-y-2.5">
                        {ghl.custom_fields.map((cf, i) => {
                            const val = cf.fieldValueArray?.join(', ') ?? cf.fieldValueString ?? cf.value ?? null;
                            if (!val) return null;
                            return (
                                <div key={i} className="flex items-center gap-2.5 py-2 px-3 rounded-xl" style={{ background: '#f5f0e8' }}>
                                    <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="2,8 6,12 14,4"/>
                                    </svg>
                                    <span className="text-sm font-medium text-forest">{val}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function ProgressTab({ project }) {
    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#8a7e6e' }}>Construction Stages</h3>
                <StageTimeline stages={project.stages ?? []} />
            </div>

            {project.workers?.length > 0 && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>Your Project Team</h3>
                    <div className="space-y-3">
                        {project.workers.map(w => (
                            <div key={w.id} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                    style={{ background: 'rgba(201,168,76,0.12)', color: '#b8943c' }}>
                                    {initials(w.name)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-forest">{w.name}</p>
                                    <p className="text-xs" style={{ color: '#b0a090' }}>Site Worker</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Facebook-style photo grid ─────────────────────────────────────────────────

// ── Expandable body text ──────────────────────────────────────────────────────

const BODY_LIMIT = 150;

function ExpandableText({ text }) {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;
    if (text.length <= BODY_LIMIT) {
        return <p className="text-sm leading-relaxed" style={{ color: '#4a3f32' }}>{text}</p>;
    }
    return (
        <p className="text-sm leading-relaxed" style={{ color: '#4a3f32' }}>
            {expanded ? text : text.slice(0, BODY_LIMIT).trimEnd()}
            {!expanded && (
                <>
                    {'… '}
                    <button onClick={() => setExpanded(true)}
                        className="font-semibold hover:underline"
                        style={{ color: '#b8943c', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        See more
                    </button>
                </>
            )}
            {expanded && (
                <>
                    {' '}
                    <button onClick={() => setExpanded(false)}
                        className="font-semibold hover:underline"
                        style={{ color: '#b8943c', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                        See less
                    </button>
                </>
            )}
        </p>
    );
}

function PhotoGrid({ photos, onOpen }) {
    const count = photos.length;
    if (count === 0) return null;

    // Always show max 4 slots; 4th slot gets "+N more" overlay if count > 4


    const wrap = {
        borderRadius: 12,
        overflow: 'hidden',
        border: '1.5px solid #e4ddd2',
        background: '#e4ddd2',
        // Use aspect-ratio so the grid scales naturally on any screen width
    };

    function Cell({ src, idx, moreCount }) {
        return (
            <div className="relative overflow-hidden"
                style={{ cursor: 'pointer', height: '100%' }}
                onClick={() => onOpen(idx)}
                onMouseEnter={e => e.currentTarget.querySelector('img').style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.querySelector('img').style.transform = 'scale(1)'}>
                <img src={src} alt=""
                    className="w-full h-full object-cover block"
                    style={{ transition: 'transform 0.2s' }} />
                {moreCount > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                        style={{ background: 'rgba(0,0,0,0.55)' }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="1" y="3" width="9" height="7" rx="1.2"/><rect x="6" y="6" width="9" height="7" rx="1.2"/>
                        </svg>
                        <span className="text-white font-bold leading-none" style={{ fontSize: 22 }}>+{moreCount}</span>
                        <span className="text-white font-medium" style={{ fontSize: 11, opacity: 0.85 }}>View more</span>
                    </div>
                )}
            </div>
        );
    }

    // ── 1 photo: same 2/1 ratio as multi-photo grid ──────────────────────────
    if (count === 1) return (
        <div style={{ ...wrap, aspectRatio: '2/1', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => onOpen(0)}>
            <img src={photos[0]} alt=""
                className="w-full h-full object-cover block"
                style={{ transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
        </div>
    );

    // ── 2+ photos: always 2 side by side; second cell shows +N if more ─────────
    return (
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, aspectRatio: '2/1' }}>
            <Cell src={photos[0]} idx={0} />
            <Cell src={photos[1]} idx={1} moreCount={count > 2 ? count - 2 : 0} />
        </div>
    );
}

// ── Updates tab ───────────────────────────────────────────────────────────────

function UpdatesTab({ updates }) {
    const [lightbox, setLightbox] = useState(null);

    if (!updates?.length) {
        return (
            <div className="bg-white rounded-2xl p-8 text-center" style={{ border: '0.5px solid #e4ddd2' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#f5f0e8' }}>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                    </svg>
                </div>
                <p className="text-sm font-semibold text-forest mb-1">No updates yet</p>
                <p className="text-xs" style={{ color: '#b0a090' }}>Your project manager will post updates here as work progresses.</p>
            </div>
        );
    }

    return (
        <>
            {lightbox && (
                <Lightbox photos={lightbox.photos} startIndex={lightbox.idx} onClose={() => setLightbox(null)} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
                {updates.map(update => {
                    const photos = update.photos ?? [];
                    return (
                        <div key={update.id} className="bg-white rounded-2xl overflow-hidden"
                            style={{ border: '0.5px solid #e4ddd2' }}>

                            {/* Post header */}
                            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a42)', color: '#c9a84c' }}>
                                        {initials(update.author ?? 'T')}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold leading-tight" style={{ color: '#1a3c2e' }}>
                                            {update.author ?? 'Project Team'}
                                        </p>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-xs" style={{ color: '#b0a090' }}>{update.created_at}</p>
                                            {update.stage_name && (
                                                <>
                                                    <span style={{ color: '#d0c8bc', fontSize: 10 }}>·</span>
                                                    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                        style={{ background: 'rgba(201,168,76,0.12)', color: '#b8943c' }}>
                                                        {update.stage_name}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center"
                                    style={{ background: '#f5f0e8' }}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#8a7e6e" strokeWidth="2" strokeLinecap="round">
                                        <path d="M3 8h.01M8 8h.01M13 8h.01"/>
                                    </svg>
                                </div>
                            </div>

                            {/* Post title */}
                            <div className="px-4 pb-2">
                                <p className="text-base font-semibold" style={{ color: '#1a3c2e' }}>{update.title}</p>
                            </div>

                            {/* Post body */}
                            <div className="px-4 pb-3">
                                <ExpandableText text={update.body} />
                            </div>

                            {/* Photo grid — full bleed, or no-image placeholder */}
                            {photos.length > 0 ? (
                                <div className="px-0">
                                    <PhotoGrid photos={photos} onOpen={idx => setLightbox({ photos, idx })} />
                                </div>
                            ) : (
                                <div className="mx-4 mb-3 flex flex-col items-center justify-center gap-1.5 rounded-xl"
                                    style={{ aspectRatio: '2/1', background: '#f5f0e8', border: '1.5px dashed #e4ddd2' }}>
                                    <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#c9c0b3" strokeWidth="1.4" strokeLinecap="round">
                                        <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                                        <circle cx="8" cy="8" r="2.2"/>
                                        <path d="M5 3l1-2h4l1 2"/>
                                    </svg>
                                    <span className="text-xs font-medium" style={{ color: '#c9c0b3' }}>No images uploaded</span>
                                </div>
                            )}

                            {/* Footer divider */}
                            <div className="px-4 py-3 flex items-center gap-1.5"
                                style={{ borderTop: '0.5px solid #f5f0e8' }}>
                                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                                </svg>
                                <span className="text-xs" style={{ color: '#b0a090' }}>Project update from BGR Building</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

function WhatsNextTab({ project, ghl }) {
    const currentStage = project.stages?.find(s => s.status === 'in_progress');
    const nextStage    = project.stages?.find(s => s.status === 'pending');
    const allDone      = project.stages?.every(s => s.status === 'completed');

    return (
        <div className="space-y-4">
            {currentStage && (
                <div className="rounded-2xl p-5"
                    style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.04))', border: '0.5px solid rgba(201,168,76,0.3)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#b8943c', fontSize: 9 }}>Currently In Progress</p>
                    </div>
                    <p className="text-base font-semibold text-forest">{currentStage.name}</p>
                    <p className="text-sm mt-1.5" style={{ color: '#6b5e4a' }}>
                        Our team is actively working on this stage of your project. We'll notify you when it's complete.
                    </p>
                </div>
            )}

            {nextStage && !allDone && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8a7e6e' }}>Up Next</p>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#f5f0e8', border: '0.5px solid #e4ddd2' }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round">
                                <polyline points="6,3 11,8 6,13"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest">{nextStage.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#b0a090' }}>Scheduled to begin after current stage</p>
                        </div>
                    </div>
                </div>
            )}

            {allDone && (
                <div className="rounded-2xl p-6 text-center"
                    style={{ background: 'rgba(26,60,46,0.05)', border: '0.5px solid rgba(26,60,46,0.12)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                        style={{ background: 'rgba(34,197,94,0.1)' }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="2,8 6,12 14,4"/>
                        </svg>
                    </div>
                    <p className="text-base font-semibold text-forest mb-1">Project Complete!</p>
                    <p className="text-sm" style={{ color: '#8a7e6e' }}>All stages have been completed. Thank you for choosing BGR.</p>
                </div>
            )}

            {project.estimated_completion && !allDone && (
                <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#8a7e6e' }}>Estimated Completion</p>
                            <p className="text-base font-semibold text-forest">{formatDate(project.estimated_completion)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#f5f0e8' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#8a7e6e" strokeWidth="1.5" strokeLinecap="round">
                                <rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientProjectShow({ project, ghl, updates, flash }) {
    const [activeTab, setActiveTab] = useState('details');

    const completedCount = project.stages?.filter(s => s.status === 'completed').length ?? 0;
    const totalCount     = project.stages?.length ?? 0;

    return (
        <AuthenticatedLayout
            title={project.name}
            breadcrumb={
                <span>
                    <Link href={route('client.dashboard')} className="hover:underline" style={{ color: '#8a7e6e' }}>
                        My Projects
                    </Link>
                    <span style={{ color: '#d0c8bc' }}> / </span>
                    <span style={{ color: '#1a3c2e' }}>{project.name}</span>
                </span>
            }>
            <Head title={project.name} />

            <Flash flash={flash} />

            {/* Hero banner */}
            <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #142e23 100%)', border: '0.5px solid rgba(201,168,76,0.15)' }}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(201,168,76,0.7)', fontSize: 9 }}>
                            {ghl?.stage_name ?? 'Your Project'}
                        </p>
                        <h1 className="text-xl text-white font-serif font-normal leading-snug truncate">{project.name}</h1>
                        {project.address && (
                            <p className="text-xs mt-1 flex items-center gap-1.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                                </svg>
                                {project.address}
                            </p>
                        )}
                    </div>

                    {/* Circular progress */}
                    <div className="flex-shrink-0 text-center">
                        <div className="relative w-14 h-14">
                            <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
                                <circle cx="28" cy="28" r="22" fill="none"
                                    stroke="#c9a84c" strokeWidth="5"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - project.progress_pct / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease' }}/>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                                {project.progress_pct}%
                            </span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {completedCount}/{totalCount}
                        </p>
                    </div>
                </div>

                <div className="mt-4 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full"
                        style={{ width: `${project.progress_pct}%`, background: 'linear-gradient(90deg, rgba(201,168,76,0.5), #c9a84c)', transition: 'width 1s ease' }} />
                </div>
            </div>

            {/* Tabs */}
            <TabBar active={activeTab} onChange={setActiveTab} updatesCount={updates?.length ?? 0} />

            {/* Tab content */}
            {activeTab === 'details'  && <DetailsTab  project={project} ghl={ghl} />}
            {activeTab === 'progress' && <ProgressTab project={project} />}
            {activeTab === 'updates'  && <UpdatesTab  updates={updates ?? []} />}
            {activeTab === 'next'     && <WhatsNextTab project={project} ghl={ghl} />}

            {/* Back */}
            <button onClick={() => router.visit(route('client.dashboard'))}
                className="mt-5 w-full text-center py-2.5 rounded-xl text-xs font-medium"
                style={{ border: '0.5px solid #e4ddd2', color: '#8a7e6e', background: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#e4ddd2'}>
                ← Back to My Projects
            </button>
        </AuthenticatedLayout>
    );
}
