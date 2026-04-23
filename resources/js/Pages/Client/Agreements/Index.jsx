import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS = {
    sent:   { label: 'Pending Signature', bg: 'rgba(201,168,76,0.10)', border: '#c9a84c', text: '#a07a20' },
    signed: { label: 'Signed',            bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a', text: '#1a6030' },
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

export default function AgreementsIndex({ agreements }) {
    const pending = agreements.filter(a => a.status === 'sent').length;
    const signed  = agreements.filter(a => a.status === 'signed').length;

    return (
        <AuthenticatedLayout title="Agreements" breadcrumb="Your agreements & proposals">
            <Head title="Agreements" />

            <div className="w-full">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Agreements</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                        {agreements.length} total · {pending} pending signature · {signed} signed
                    </p>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #D1CDC7' }}>
                    {agreements.length === 0 ? (
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
                            <p className="text-sm font-bold text-forest mb-1">No agreements yet</p>
                            <p className="text-xs" style={{ color: '#888480' }}>Agreements sent to you will appear here.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 sm:px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888480', fontSize: 10 }}>
                                    Your Agreements
                                </span>
                            </div>
                            <div className="divide-y" style={{ borderColor: '#F1F1EF' }}>
                                {agreements.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-forest">{a.title}</p>
                                            <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                                Client Variation Agreement
                                                {a.total_amount ? ` · £${Number(a.total_amount).toLocaleString()}` : ''}
                                                {a.sent_at ? ` · Sent ${a.sent_at}` : ''}
                                                {a.signed_at ? ` · Signed ${a.signed_at}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            <StatusBadge status={a.status} />
                                            <Link href={route('client.agreements.show', a.id)}
                                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-block"
                                                style={{
                                                    background: a.status === 'sent' ? '#25282D' : '#F1F1EF',
                                                    color: a.status === 'sent' ? '#FFFFFF' : '#4A4A4A',
                                                }}>
                                                {a.status === 'sent' ? 'Review & Sign' : 'View'}
                                            </Link>
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
