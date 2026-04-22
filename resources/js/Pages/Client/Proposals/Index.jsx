import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    sent:     { label: 'Awaiting Review', dot: '#c9a84c', bg: 'rgba(201,168,76,0.10)', color: '#9a7520' },
    viewed:   { label: 'Viewed',          dot: '#818cf8', bg: 'rgba(99,102,241,0.10)', color: '#4f46e5' },
    accepted: { label: 'Accepted',        dot: '#22c55e', bg: 'rgba(34,197,94,0.09)',  color: '#15803d' },
    declined: { label: 'Declined',        dot: '#ef4444', bg: 'rgba(239,68,68,0.09)',  color: '#b91c1c' },
    paid:     { label: 'Paid',            dot: '#10b981', bg: 'rgba(16,185,129,0.10)', color: '#065f46' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.sent;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, color: s.color }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ proposal, onClose }) {
    useEffect(() => {
        window.document.body.style.overflow = 'hidden';
        return () => { window.document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Proposal</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{proposal.project_name}</p>
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
                            <span className="text-xs font-semibold" style={{ color: '#888480' }}>Estimated amount</span>
                            <span className="text-sm font-bold text-forest ml-auto">${Number(proposal.amount).toLocaleString()}</span>
                        </div>
                    )}

                    {proposal.notes && (
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Notes from BGR</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{proposal.notes}</p>
                        </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                        <a href={proposal.ghl_link} target="_blank" rel="noopener noreferrer"
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-center"
                            style={{ background: '#25282D', color: '#FFFFFF' }}>
                            View & Accept Proposal ↗
                        </a>
                        <button onClick={onClose}
                            className="px-4 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProposalsIndex({ proposals }) {
    const [viewing, setViewing] = useState(null);

    const pending  = proposals.filter(p => ['sent', 'viewed'].includes(p.status)).length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;

    return (
        <AuthenticatedLayout title="Proposals" breadcrumb="Your proposals & estimates">
            <Head title="Proposals" />

            {viewing && <DetailModal proposal={viewing} onClose={() => setViewing(null)} />}

            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Proposals & Estimates</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                        {proposals.length} total · {pending} awaiting · {accepted} accepted
                    </p>
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
                            <p className="text-xs" style={{ color: '#888480' }}>BGR will send you proposals here for review and acceptance.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 sm:px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888480', fontSize: 10 }}>
                                    Your Proposals
                                </span>
                            </div>
                            <div className="divide-y" style={{ borderColor: '#F1F1EF' }}>
                                {proposals.map(p => (
                                    <div key={p.id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-forest">{p.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                                {p.project_name} · Sent {p.created_at}
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
                                                style={{
                                                    background: ['sent','viewed'].includes(p.status) ? '#25282D' : '#F1F1EF',
                                                    color:      ['sent','viewed'].includes(p.status) ? '#FFFFFF'  : '#4A4A4A',
                                                }}>
                                                {['sent','viewed'].includes(p.status) ? 'Review' : 'View'}
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
