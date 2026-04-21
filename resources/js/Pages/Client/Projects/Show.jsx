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
            style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
            {TABS.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className="flex-1 py-2 px-2 rounded-lg text-xs font-medium transition-all relative"
                    style={active === tab.id
                        ? { background: '#fff', color: '#25282D', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '0.5px solid #D1CDC7' }
                        : { background: 'transparent', color: '#888480', border: '0.5px solid transparent' }}>
                    {tab.label}
                    {tab.id === 'updates' && updatesCount > 0 && (
                        <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-xs font-bold"
                            style={{ background: '#25282D', fontSize: 9 }}>
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
    pending:     { fill: '#F1F1EF', stroke: '#D1CDC7', text: '#888480', labelColor: '#888480' },
    in_progress: { fill: '#25282D', stroke: '#25282D', text: '#fff',    labelColor: '#25282D' },
    completed:   { fill: '#25282D', stroke: '#25282D', text: '#fff',    labelColor: '#25282D' },
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
                                        style={{ background: stage.status === 'completed' ? '#25282D' : '#D1CDC7', minHeight: 16 }} />
                                )}
                            </div>
                            <div className={`flex-1 min-w-0 ${isLast ? '' : 'pb-3'}`} style={{ paddingTop: 6 }}>
                                <p className="text-sm font-medium leading-tight" style={{ color: s.labelColor }}>{stage.name}</p>
                                <p className="text-xs mt-0.5"
                                    style={{ color: stage.status === 'in_progress' ? '#25282D' : '#888480' }}>
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
                                    style={{ color: stage.status === 'in_progress' ? '#25282D' : '#888480' }}>
                                    {STATUS_LABEL[stage.status]}
                                </p>
                            </div>
                            {!isLast && (
                                <div className="flex-shrink-0 h-0.5 mt-4"
                                    style={{ width: 20, background: stage.status === 'completed' ? '#25282D' : '#D1CDC7' }} />
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
        <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: 'rgba(0,0,0,0.95)' }} onClick={onClose}>
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
                            style={{ border: i === idx ? '2px solid #25282D' : '2px solid transparent', opacity: i === idx ? 1 : 0.45 }}>
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
            <div className="glass-card rounded-2xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>Key Dates</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs mb-1" style={{ color: '#888480' }}>Start Date</p>
                        <p className="text-sm font-medium text-forest">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                        <p className="text-xs mb-1" style={{ color: '#888480' }}>Est. Completion</p>
                        <p className="text-sm font-medium text-forest">{formatDate(project.estimated_completion)}</p>
                    </div>
                </div>
            </div>

            {project.address && (
                <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#888480' }}>Site Address</h3>
                    <div className="flex items-start gap-2.5">
                        <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2" strokeLinecap="round">
                            <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                        </svg>
                        <p className="text-sm font-medium text-forest">{project.address}</p>
                    </div>
                </div>
            )}

            {ghl?.contact && (
                <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>Your Details On File</h3>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                            style={{ background: 'rgba(26,60,46,0.06)', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                            {initials(ghl.contact.name ?? '')}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-forest">{ghl.contact.name}</p>
                            {ghl.contact.email && <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{ghl.contact.email}</p>}
                            {ghl.contact.phone && <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{ghl.contact.phone}</p>}
                        </div>
                    </div>
                    {ghl.source && (
                        <div className="mt-3 pt-3" style={{ borderTop: '0.5px solid #F1F1EF' }}>
                            <p className="text-xs mb-1" style={{ color: '#888480' }}>Enquiry Source</p>
                            <p className="text-sm text-forest">{ghl.source}</p>
                        </div>
                    )}
                </div>
            )}

            {hasSpecs && (
                <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>Project Specifications</h3>
                    <div className="space-y-2.5">
                        {ghl.custom_fields.map((cf, i) => {
                            const val = cf.fieldValueArray?.join(', ') ?? cf.fieldValueString ?? cf.value ?? null;
                            if (!val) return null;
                            return (
                                <div key={i} className="flex items-center gap-2.5 py-2 px-3 rounded-xl" style={{ background: '#F1F1EF' }}>
                                    <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2.5" strokeLinecap="round">
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
            <div className="glass-card rounded-2xl p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#888480' }}>Construction Stages</h3>
                <StageTimeline stages={project.stages ?? []} />
            </div>

            {project.workers?.length > 0 && (
                <div className="glass-card rounded-2xl p-5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>Your Project Team</h3>
                    <div className="space-y-3">
                        {project.workers.map(w => (
                            <div key={w.id} className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                    style={{ background: 'rgba(26,26,26,0.06)', color: '#25282D' }}>
                                    {initials(w.name)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-forest">{w.name}</p>
                                    <p className="text-xs" style={{ color: '#888480' }}>Site Worker</p>
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

// ── Single thumbnail with photo-count overlay (matches Admin card style) ─────

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
                                style={{ background: '#25282D', color: '#fff' }}>
                                {(update.author ?? 'T')[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-forest">{update.author ?? 'Project Team'}</p>
                                <p className="text-xs" style={{ color: '#888480' }}>{update.created_at}</p>
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
                            {update.stage_name && (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: 'rgba(26,26,26,0.06)', color: '#25282D' }}>
                                    {update.stage_name}
                                </span>
                            )}
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

// ── Updates tab ───────────────────────────────────────────────────────────────

function UpdatesTab({ updates }) {
    const [detailUpdate, setDetailUpdate] = useState(null);

    if (!updates?.length) {
        return (
            <div className="glass-card rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: '#F1F1EF' }}>
                    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#888480" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                    </svg>
                </div>
                <p className="text-sm font-semibold text-forest mb-1">No updates yet</p>
                <p className="text-xs" style={{ color: '#888480' }}>Your project manager will post updates here as work progresses.</p>
            </div>
        );
    }

    return (
        <>
            {detailUpdate && (
                <UpdateDetailModal update={detailUpdate} onClose={() => setDetailUpdate(null)} />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {updates.map(u => {
                    const photos = u.photos ?? [];
                    return (
                        <div key={u.id}
                            className="glass-card rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                            style={{ border: '1px solid #f0ebe3' }}
                            onClick={() => setDetailUpdate(u)}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,26,26,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                            {/* Card header */}
                            <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: '#25282D', color: '#fff' }}>
                                    {(u.author ?? 'T')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight text-forest">
                                        {u.author ?? 'Project Team'}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                        <p className="text-xs" style={{ color: '#888480' }}>{u.created_at}</p>
                                        {u.stage_name && (
                                            <>
                                                <span style={{ color: '#D1CDC7', fontSize: 10 }}>·</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{ background: 'rgba(26,26,26,0.06)', color: '#25282D' }}>
                                                    {u.stage_name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                            {/* Thumbnail or no-image placeholder */}
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
                    style={{ background: 'linear-gradient(135deg, rgba(26,26,26,0.04), rgba(26,26,26,0.02))', border: '0.5px solid rgba(26,26,26,0.12)' }}>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#B2945B' }} />
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#25282D', fontSize: 9 }}>Currently In Progress</p>
                    </div>
                    <p className="text-base font-semibold text-forest">{currentStage.name}</p>
                    <p className="text-sm mt-1.5" style={{ color: '#4A4A4A' }}>
                        Our team is actively working on this stage of your project. We'll notify you when it's complete.
                    </p>
                </div>
            )}

            {nextStage && !allDone && (
                <div className="glass-card rounded-2xl p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#888480' }}>Up Next</p>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#888480" strokeWidth="2" strokeLinecap="round">
                                <polyline points="6,3 11,8 6,13"/>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-forest">{nextStage.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: '#888480' }}>Scheduled to begin after current stage</p>
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
                    <p className="text-sm" style={{ color: '#888480' }}>All stages have been completed. Thank you for choosing BGR.</p>
                </div>
            )}

            {project.estimated_completion && !allDone && (
                <div className="glass-card rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#888480' }}>Estimated Completion</p>
                            <p className="text-base font-semibold text-forest">{formatDate(project.estimated_completion)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#888480" strokeWidth="1.5" strokeLinecap="round">
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
                    <Link href={route('client.dashboard')} className="hover:underline" style={{ color: '#888480' }}>
                        My Projects
                    </Link>
                    <span style={{ color: '#d0c8bc' }}> / </span>
                    <span style={{ color: '#25282D' }}>{project.name}</span>
                </span>
            }>
            <Head title={project.name} />

            <Flash flash={flash} />

            {/* Hero banner */}
            <div className="rounded-2xl p-5 mb-5"
                style={{ background: 'linear-gradient(135deg, #25282D 0%, #25282D 100%)', border: '0.5px solid rgba(26,26,26,0.05)' }}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9 }}>
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
                                    stroke="#25282D" strokeWidth="5"
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
                        style={{ width: `${project.progress_pct}%`, background: '#25282D', transition: 'width 1s ease' }} />
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
                style={{ border: '0.5px solid #D1CDC7', color: '#888480', background: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#25282D'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#D1CDC7'}>
                ← Back to My Projects
            </button>
        </AuthenticatedLayout>
    );
}
