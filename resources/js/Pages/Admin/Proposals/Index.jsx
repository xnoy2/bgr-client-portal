import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalShell from '@/Components/ModalShell';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    sent:     { label: 'Sent',     bg: 'rgba(201,168,76,0.10)', border: '#c9a84c', text: '#a07a20' },
    viewed:   { label: 'Viewed',   bg: 'rgba(99,102,241,0.10)', border: '#818cf8', text: '#4f46e5' },
    accepted: { label: 'Accepted', bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a', text: '#1a6030' },
    declined: { label: 'Declined', bg: 'rgba(200,40,40,0.07)',  border: '#e07070', text: '#b03030' },
    paid:     { label: 'Paid',     bg: 'rgba(16,185,129,0.10)', border: '#34d399', text: '#065f46' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.sent;
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

// ── Add Proposal Modal ────────────────────────────────────────────────────────

function AddModal({ show, projects, onClose }) {

    const { data, setData, post, processing, errors } = useForm({
        project_id:      '',
        title:           '',
        ghl_link:        '',
        amount: '',
        notes:  '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('admin.proposals.store'), { onSuccess: onClose });
    }

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <h2 className="text-base font-bold text-forest">Send Proposal</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="overflow-y-auto px-5 py-4 space-y-3.5">
                    {/* Project */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Project
                        </label>
                        <select value={data.project_id} onChange={e => setData('project_id', e.target.value)}
                            required
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}>
                            <option value="">Select a project…</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
                            ))}
                        </select>
                        {errors.project_id && <p className="text-xs mt-1" style={{ color: '#b03030' }}>{errors.project_id}</p>}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Title
                        </label>
                        <input type="text" value={data.title} onChange={e => setData('title', e.target.value)}
                            required placeholder="e.g. Scope of Works — Stage 1"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                        {errors.title && <p className="text-xs mt-1" style={{ color: '#b03030' }}>{errors.title}</p>}
                    </div>

                    {/* Info banner */}
                    <div className="px-3 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid #c9a84c', color: '#9a7520' }}>
                        The Client Variation Agreement template will be sent automatically to the client's email via GHL.
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Amount <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                        </label>
                        <input type="number" min="0" step="0.01" value={data.amount} onChange={e => setData('amount', e.target.value)}
                            placeholder="0.00"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Notes <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                        </label>
                        <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                            placeholder="Internal notes…"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>

                    {errors.ghl && (
                        <p className="text-xs px-1" style={{ color: '#b03030' }}>{errors.ghl}</p>
                    )}

                    <div className="flex gap-2.5 pt-1 pb-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ flex: 2, background: '#25282D', color: '#FFFFFF', opacity: processing ? 0.6 : 1 }}>
                            {processing ? 'Sending via GHL…' : 'Send Proposal'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalShell>
    );
}

// ── View / Edit Modal ─────────────────────────────────────────────────────────

function ViewModal({ show, proposal, onClose }) {

    function handleDelete() {
        if (!confirm('Delete this proposal?')) return;
        router.delete(route('admin.proposals.destroy', proposal.id), { onSuccess: onClose });
    }

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Proposal</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                            {proposal.project_name} · {proposal.client_name}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <div className="px-5 py-4 space-y-3">
                    <div>
                        <p className="text-base font-bold text-forest">{proposal.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>Sent {proposal.created_at}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <StatusBadge status={proposal.status} />
                        {proposal.responded_at && (
                            <span className="text-xs" style={{ color: '#888480' }}>on {proposal.responded_at}</span>
                        )}
                    </div>

                    {proposal.amount && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <span className="text-xs font-semibold" style={{ color: '#888480' }}>Amount</span>
                            <span className="text-sm font-bold text-forest ml-auto">${Number(proposal.amount).toLocaleString()}</span>
                        </div>
                    )}

                    {proposal.notes && (
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{proposal.notes}</p>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                        <a href={proposal.ghl_link} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-3 rounded-xl text-sm font-semibold text-center transition-opacity"
                            style={{ background: '#25282D', color: '#FFFFFF' }}>
                            Open Proposal ↗
                        </a>
                        <button onClick={handleDelete}
                            className="px-4 py-3 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ background: 'rgba(200,40,40,0.07)', color: '#b03030', border: '1px solid #e07070' }}>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProposalsIndex({ proposals, projects }) {
    const [showAdd, setShowAdd]   = useState(false);
    const [viewing, setViewing]   = useState(null);

    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const pending  = proposals.filter(p => ['sent', 'viewed'].includes(p.status)).length;

    return (
        <AuthenticatedLayout title="Proposals" breadcrumb="All proposals & estimates">
            <Head title="Proposals" />

            <AddModal show={showAdd} projects={projects} onClose={() => setShowAdd(false)} />
            {viewing && <ViewModal show proposal={viewing} onClose={() => setViewing(null)} />}

            <div className="w-full">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-forest">Proposals & Estimates</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                            {proposals.length} total · {pending} pending · {accepted} accepted
                        </p>
                    </div>
                    <button onClick={() => setShowAdd(true)}
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: '#25282D', color: '#FFFFFF' }}>
                        + Send Proposal
                    </button>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #D1CDC7' }}>
                    {proposals.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                style={{ background: '#F1F1EF' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888480" strokeWidth="1.5">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14,2 14,8 20,8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-forest mb-1">No proposals yet</p>
                            <p className="text-xs" style={{ color: '#888480' }}>Send a proposal to a client to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 sm:px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888480', fontSize: 10 }}>
                                    All Proposals
                                </span>
                            </div>
                            <div className="divide-y" style={{ borderColor: '#F1F1EF' }}>
                                {proposals.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-forest">{p.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                                {p.project_name} · {p.client_name} · Sent {p.created_at}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            {p.amount && (
                                                <span className="text-xs font-semibold text-forest hidden sm:inline">
                                                    ${Number(p.amount).toLocaleString()}
                                                </span>
                                            )}
                                            <StatusBadge status={p.status} />
                                            <button onClick={() => setViewing(p)}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                                                style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
