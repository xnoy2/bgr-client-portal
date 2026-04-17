import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    pending:  { label: 'Under review', bg: 'rgba(201,168,76,0.10)', border: '#c9a84c',  text: '#a07a20' },
    approved: { label: 'Approved',     bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a',  text: '#1a6030' },
    rejected: { label: 'Declined',     bg: 'rgba(200,40,40,0.07)',  border: '#e07070',  text: '#b03030' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ variation, onClose }) {
    const s = STATUS[variation.status] ?? STATUS.pending;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(14,32,25,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '88vh' }}>

                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">{variation.title}</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#a09487' }}>Submitted {variation.submitted_at}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    <div className="flex items-center gap-2">
                        <StatusBadge status={variation.status} />
                        {variation.project_name && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ background: 'rgba(26,60,46,0.07)', color: '#1a3c2e' }}>
                                {variation.project_name}
                            </span>
                        )}
                    </div>

                    <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>{variation.description}</p>

                    {variation.estimated_cost && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: '#f8f5f0', border: '1px solid #ede8df' }}>
                            <span className="text-xs font-semibold" style={{ color: '#8a7e6e' }}>Estimated cost</span>
                            <span className="text-sm font-bold text-forest ml-auto">${Number(variation.estimated_cost).toLocaleString()}</span>
                        </div>
                    )}

                    {variation.admin_notes && (
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: '#f8f5f0', border: '1px solid #ede8df' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#8a7e6e' }}>Notes from BGR</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{variation.admin_notes}</p>
                        </div>
                    )}
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

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'rgba(14,32,25,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full sm:max-w-lg bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
                style={{ maxHeight: '92vh' }}>

                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#ddd5c8' }} />
                </div>

                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Submit Variation</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>Request a change to your project scope</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full"
                        style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    {/* Project picker */}
                    {projects.length > 1 && (
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                                Project
                            </label>
                            <select value={projectId} onChange={e => setProjectId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                onBlur={e => e.target.style.borderColor = '#ede8df'}>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Title <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Upgrade to triple-glazed windows"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Description <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <textarea rows={4} value={desc} onChange={e => setDesc(e.target.value)}
                            placeholder="Describe the change you'd like to make and why…"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Estimated cost <span style={{ color: '#a09487', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#a09487' }}>$</span>
                            <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-3 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                onBlur={e => e.target.style.borderColor = '#ede8df'}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-1 pb-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={busy || !title.trim() || !desc.trim()}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{
                                flex: 2,
                                background: busy || !title.trim() || !desc.trim() ? '#a0b8a8' : '#1a3c2e',
                                color: '#c9a84c',
                                cursor: busy || !title.trim() || !desc.trim() ? 'not-allowed' : 'pointer',
                            }}>
                            {busy ? 'Submitting…' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VariationsIndex({ variations, projects }) {
    const [viewing,   setViewing]   = useState(null);
    const [showForm,  setShowForm]  = useState(false);

    return (
        <AuthenticatedLayout title="Variations" breadcrumb="Change requests for your project">

            {viewing  && <DetailModal variation={viewing} onClose={() => setViewing(null)} />}
            {showForm && <SubmitModal projects={projects} onClose={() => setShowForm(false)} />}

            <div className="max-w-3xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-semibold text-forest">Variations</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#8a7e6e' }}>
                            {variations.length} request{variations.length !== 1 ? 's' : ''} submitted
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ background: '#1a3c2e', color: '#c9a84c' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                            </svg>
                            New Request
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e4ddd2' }}>
                    {variations.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                style={{ background: '#f5f0e8' }}>
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-forest mb-1">No requests yet</p>
                            <p className="text-xs" style={{ color: '#a09487' }}>Submit a variation to request a change to your project.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8a7e6e', fontSize: 10 }}>
                                    Previous Requests
                                </span>
                            </div>
                            <ul>
                                {variations.map((v, i) => (
                                    <li key={v.id}
                                        className="flex items-center gap-4 px-6 py-4"
                                        style={{ borderTop: i === 0 ? 'none' : '0.5px solid #f0ebe3' }}>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-forest truncate">{v.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#a09487' }}>
                                                Submitted {v.submitted_at}
                                                {v.project_name && ` · ${v.project_name}`}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            <StatusBadge status={v.status} />
                                            <button
                                                onClick={() => setViewing(v)}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: '#f5f0e8', color: '#6b5e4a', border: '1px solid #e4ddd2' }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#ede8df'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#f5f0e8'}>
                                                View
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
