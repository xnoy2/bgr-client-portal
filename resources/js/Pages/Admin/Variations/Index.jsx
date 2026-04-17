import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    pending:  { label: 'Under review', bg: 'rgba(201,168,76,0.10)', border: '#c9a84c',  text: '#a07a20' },
    approved: { label: 'Approved',     bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a',  text: '#1a6030' },
    rejected: { label: 'Declined',     bg: 'rgba(200,40,40,0.07)',  border: '#e07070',  text: '#b03030' },
};

// ── Review modal ──────────────────────────────────────────────────────────────

function ReviewModal({ variation, onClose }) {
    const [status, setStatus]   = useState(variation.status === 'pending' ? '' : variation.status);
    const [notes,  setNotes]    = useState(variation.admin_notes ?? '');
    const [busy,   setBusy]     = useState(false);

    const isPending = variation.status === 'pending';

    function submit(e) {
        e.preventDefault();
        if (!status) return;
        setBusy(true);
        router.put(route('admin.variations.review', variation.id), { status, admin_notes: notes }, {
            onSuccess: () => onClose(),
            onFinish:  () => setBusy(false),
        });
    }

    const s = STATUS[variation.status] ?? STATUS.pending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(14,32,25,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '90vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Variation Request</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>
                            {variation.project_name} · {variation.submitted_by}
                        </p>
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
                    {/* Details */}
                    <div>
                        <p className="text-base font-bold text-forest mb-1">{variation.title}</p>
                        <p className="text-xs mb-3" style={{ color: '#a09487' }}>Submitted {variation.submitted_at}</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>{variation.description}</p>
                    </div>

                    {variation.estimated_cost && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: '#f8f5f0', border: '1px solid #ede8df' }}>
                            <span className="text-xs font-semibold" style={{ color: '#8a7e6e' }}>Estimated cost</span>
                            <span className="text-sm font-bold text-forest ml-auto">${Number(variation.estimated_cost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Current status (if already reviewed) */}
                    {!isPending && variation.admin_notes && (
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: '#f8f5f0', border: '1px solid #ede8df' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#8a7e6e' }}>Admin notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{variation.admin_notes}</p>
                        </div>
                    )}

                    {/* Decision form */}
                    <form onSubmit={submit} className="space-y-3 pt-1">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#6b5e4a' }}>
                                Decision
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['approved', 'rejected'].map(val => (
                                    <button key={val} type="button"
                                        onClick={() => setStatus(val)}
                                        className="py-3 rounded-xl text-sm font-semibold transition-all"
                                        style={status === val
                                            ? val === 'approved'
                                                ? { background: '#1a3c2e', color: '#c9a84c', border: '1.5px solid #1a3c2e' }
                                                : { background: '#7f1d1d', color: '#fca5a5', border: '1.5px solid #7f1d1d' }
                                            : { background: '#f8f5f0', color: '#6b5e4a', border: '1.5px solid #ede8df' }
                                        }>
                                        {val === 'approved' ? 'Approve' : 'Decline'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#6b5e4a' }}>
                                Notes to client <span style={{ color: '#a09487', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                            </label>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Reason for decision, next steps…"
                                className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                                style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                                onFocus={e => e.target.style.borderColor = '#c9a84c'}
                                onBlur={e => e.target.style.borderColor = '#ede8df'}
                            />
                        </div>

                        <div className="flex gap-2.5 pt-1 pb-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                                style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={busy || !status}
                                className="py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                                style={{
                                    flex: 2,
                                    background: !status || busy ? '#a0b8a8' : '#1a3c2e',
                                    color: '#c9a84c',
                                    cursor: !status || busy ? 'not-allowed' : 'pointer',
                                }}>
                                {busy ? 'Saving…' : 'Save Decision'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VariationsIndex({ variations }) {
    const [reviewing, setReviewing] = useState(null);

    const pending  = variations.filter(v => v.status === 'pending').length;
    const approved = variations.filter(v => v.status === 'approved').length;
    const rejected = variations.filter(v => v.status === 'rejected').length;

    return (
        <AuthenticatedLayout title="Variations" breadcrumb="All variation requests">

            {reviewing && (
                <ReviewModal variation={reviewing} onClose={() => setReviewing(null)} />
            )}

            <div className="max-w-4xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Variation Requests</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8a7e6e' }}>
                        {variations.length} total · {pending} pending · {approved} approved · {rejected} declined
                    </p>
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
                            <p className="text-sm font-bold text-forest mb-1">No variation requests</p>
                            <p className="text-xs" style={{ color: '#a09487' }}>Requests submitted by clients will appear here.</p>
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

                                        {/* Text */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-forest truncate">{v.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#a09487' }}>
                                                {v.project_name} · {v.submitted_by} · Submitted {v.submitted_at}
                                            </p>
                                        </div>

                                        {/* Status + action */}
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            <StatusBadge status={v.status} />
                                            <button
                                                onClick={() => setReviewing(v)}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                                                style={{
                                                    background: v.status === 'pending' ? '#1a3c2e' : '#f5f0e8',
                                                    color:      v.status === 'pending' ? '#c9a84c'  : '#6b5e4a',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                {v.status === 'pending' ? 'Review' : 'View'}
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
