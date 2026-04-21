import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    pending:  { label: 'Under review', dot: '#25282D', bg: 'rgba(201,168,76,0.10)', color: '#9a7520' },
    approved: { label: 'Approved',     dot: '#22c55e', bg: 'rgba(34,197,94,0.09)',  color: '#15803d' },
    rejected: { label: 'Declined',     dot: '#ef4444', bg: 'rgba(239,68,68,0.09)',  color: '#b91c1c' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, color: s.color }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ variation, onClose }) {
    useEffect(() => {
        window.document.body.style.overflow = 'hidden';
        return () => { window.document.body.style.overflow = ''; };
    }, []);
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    const s = STATUS[variation.status] ?? STATUS.pending;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(14,32,25,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}>

            <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '88vh', border: '0.5px solid #D1CDC7' }}
                onClick={e => e.stopPropagation()}>

                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#d0c8bc' }} />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div className="min-w-0 flex-1 pr-4">
                        <p className="text-base font-semibold text-forest leading-snug">{variation.title}</p>
                        <p className="text-xs mt-1" style={{ color: '#888480' }}>
                            Submitted {variation.submitted_at}
                            {variation.project_name && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ background: 'rgba(26,60,46,0.07)', color: '#25282D' }}>
                                    {variation.project_name}
                                </span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#888480' }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Status row */}
                    <div className="flex items-center gap-2.5 p-3 rounded-xl"
                        style={{ background: s.bg }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                        <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
                    </div>

                    {/* Description */}
                    {variation.description && (
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#888480' }}>
                                Request Details
                            </p>
                            <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>
                                {variation.description}
                            </p>
                        </div>
                    )}

                    {/* Estimated cost */}
                    {variation.estimated_cost && (
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                            <span className="text-xs font-semibold" style={{ color: '#888480' }}>Estimated cost</span>
                            <span className="text-sm font-bold text-forest">
                                ${Number(variation.estimated_cost).toLocaleString()}
                            </span>
                        </div>
                    )}

                    {/* Admin notes */}
                    {variation.admin_notes && (
                        <div className="px-4 py-3 rounded-xl" style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: '#888480' }}>Notes from BGR</p>
                            <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>
                                {variation.admin_notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '0.5px solid #f0ebe3' }}>
                    <button onClick={onClose}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Submit modal ──────────────────────────────────────────────────────────────

function SubmitModal({ projects, onClose }) {
    const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
    const [title,     setTitle]     = useState('');
    const [desc,      setDesc]      = useState('');
    const [cost,      setCost]      = useState('');
    const [busy,      setBusy]      = useState(false);

    useEffect(() => {
        window.document.body.style.overflow = 'hidden';
        return () => { window.document.body.style.overflow = ''; };
    }, []);
    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    function submit(e) {
        e.preventDefault();
        if (!title.trim() || !desc.trim()) return;
        setBusy(true);
        router.post(route('client.variations.store'), {
            project_id:     projectId,
            title,
            description:    desc,
            estimated_cost: cost || null,
        }, {
            onSuccess: () => onClose(),
            onFinish:  () => setBusy(false),
        });
    }

    const canSubmit = title.trim() && desc.trim() && !busy;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(14,32,25,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full sm:max-w-lg bg-white flex flex-col sm:rounded-2xl rounded-t-2xl overflow-hidden"
                style={{ maxHeight: '92vh', border: '0.5px solid #D1CDC7' }}>

                {/* Drag handle */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#d0c8bc' }} />
                </div>

                {/* Header */}
                <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <p className="text-base font-semibold text-forest">New Variation Request</p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>Request a change to your project scope</p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#888480' }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {projects.length > 1 && (
                        <div>
                            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a4f42' }}>Project</label>
                            <select value={projectId} onChange={e => setProjectId(e.target.value)}
                                className="w-full px-3.5 py-2.5 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#F1F1EF', border: '1.5px solid #e8e0d5' }}
                                onFocus={e => e.target.style.borderColor = '#25282D'}
                                onBlur={e  => e.target.style.borderColor = '#e8e0d5'}>
                                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a4f42' }}>
                            Title <span style={{ color: '#25282D' }}>*</span>
                        </label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Upgrade to triple-glazed windows"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #e8e0d5' }}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e  => e.target.style.borderColor = '#e8e0d5'}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a4f42' }}>
                            Description <span style={{ color: '#25282D' }}>*</span>
                        </label>
                        <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)}
                            placeholder="Describe the change you'd like to make and why…"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #e8e0d5' }}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e  => e.target.style.borderColor = '#e8e0d5'}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a4f42' }}>
                            Estimated cost{' '}
                            <span style={{ color: '#888480', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold select-none"
                                style={{ color: '#888480' }}>$</span>
                            <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#F1F1EF', border: '1.5px solid #e8e0d5' }}
                                onFocus={e => e.target.style.borderColor = '#25282D'}
                                onBlur={e  => e.target.style.borderColor = '#e8e0d5'}
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2.5 pt-1 pb-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={!canSubmit}
                            className="rounded-xl text-sm font-semibold transition-all"
                            style={{
                                flex: 2,
                                padding: '10px',
                                background: canSubmit ? '#25282D' : '#D1CDC7',
                                color:      canSubmit ? '#25282D' : '#888480',
                                cursor:     canSubmit ? 'pointer' : 'not-allowed',
                            }}>
                            {busy
                                ? <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                                    </svg>
                                    Submitting…
                                  </span>
                                : 'Submit Request'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Variation row ─────────────────────────────────────────────────────────────

function VariationRow({ variation, onView, isLast }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors"
            style={{ borderBottom: isLast ? 'none' : '0.5px solid #F1F1EF' }}
            onClick={() => onView(variation)}
            onMouseEnter={e => e.currentTarget.style.background = '#fdfcfa'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

            {/* Status dot indicator */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: STATUS[variation.status]?.bg ?? 'rgba(201,168,76,0.10)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke={STATUS[variation.status]?.dot ?? '#25282D'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                </svg>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-forest truncate leading-snug">{variation.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#888480' }}>
                    Submitted {variation.submitted_at}
                    {variation.project_name && <span className="ml-1">· {variation.project_name}</span>}
                </p>
            </div>

            {/* Status + chevron */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={variation.status} />
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#c4b8a8" strokeWidth="2" strokeLinecap="round">
                    <polyline points="6,3 11,8 6,13"/>
                </svg>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VariationsIndex({ variations, projects }) {
    const [viewing,  setViewing]  = useState(null);
    const [showForm, setShowForm] = useState(false);

    const pending  = variations.filter(v => v.status === 'pending').length;

    return (
        <AuthenticatedLayout title="Variations" breadcrumb="Change requests for your project">
            <Head title="Variations" />

            {viewing  && <DetailModal variation={viewing}  onClose={() => setViewing(null)}  />}
            {showForm && <SubmitModal projects={projects}  onClose={() => setShowForm(false)} />}

            {/* Pending notice */}
            {pending > 0 && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(26,26,26,0.04), rgba(201,168,76,0.04))',
                        border: '0.5px solid rgba(201,168,76,0.35)',
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(26,26,26,0.05)' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2" strokeLinecap="round">
                            <circle cx="8" cy="8" r="6.5"/>
                            <line x1="8" y1="5" x2="8" y2="8"/>
                            <circle cx="8" cy="11" r="0.5" fill="#25282D"/>
                        </svg>
                    </div>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                        <span className="font-semibold" style={{ color: '#25282D' }}>
                            {pending} request{pending !== 1 ? 's' : ''} under review.
                        </span>
                        {' '}BGR will respond shortly.
                    </p>
                </div>
            )}

            {/* Card */}
            <div className="glass-card rounded-2xl overflow-hidden">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '0.5px solid #D1CDC7', background: '#fdfcfa' }}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>
                            Variation Requests
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                            {variations.length === 0
                                ? 'No requests submitted yet'
                                : `${variations.length} request${variations.length !== 1 ? 's' : ''} submitted`}
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: '#25282D', color: '#fff' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                            </svg>
                            New Request
                        </button>
                    )}
                </div>

                {/* Empty state */}
                {variations.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-forest mb-1">No requests yet</p>
                        <p className="text-xs mb-5" style={{ color: '#888480' }}>
                            Submit a variation to request a change to your project scope.
                        </p>
                        {projects.length > 0 && (
                            <button onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: '#25282D', color: '#fff' }}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                                </svg>
                                Submit your first request
                            </button>
                        )}
                    </div>
                ) : (
                    variations.map((v, i) => (
                        <VariationRow
                            key={v.id}
                            variation={v}
                            onView={setViewing}
                            isLast={i === variations.length - 1}
                        />
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
