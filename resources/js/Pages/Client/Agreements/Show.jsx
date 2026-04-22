import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

// ── Document renderer ─────────────────────────────────────────────────────────

function DocumentView({ agreement }) {
    const items = agreement.items ?? [];
    const total = agreement.total_amount
        ? Number(agreement.total_amount)
        : items.reduce((s, r) => s + (parseFloat(r.price) || 0), 0);

    const typeLabel = 'Client Variation Agreement';

    return (
        <div className="bg-white rounded-2xl p-8 sm:p-10" style={{ border: '0.5px solid #D1CDC7', maxWidth: 680 }}>
            {/* Logo / header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                    style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a3f30" strokeWidth="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#888480' }}>
                    Bespoke Garden Rooms Ballycastle
                </p>
                <h1 className="text-2xl font-bold text-forest">{typeLabel}</h1>
                <p className="text-sm mt-1" style={{ color: '#888480' }}>
                    This document confirms changes or additions to the originally agreed scope of works.
                    All variations must be approved in writing before works proceed.
                </p>
            </div>

            {/* Project details */}
            <div className="mb-6">
                <h2 className="text-sm font-bold text-forest uppercase tracking-wide mb-3"
                    style={{ borderBottom: '1.5px solid #f0ebe3', paddingBottom: 6 }}>
                    Project Details
                </h2>
                <div className="space-y-1.5 text-sm">
                    <div className="flex gap-3">
                        <span className="w-40 flex-shrink-0 font-semibold" style={{ color: '#888480' }}>Client Name:</span>
                        <span className="text-forest">{agreement.client_name}</span>
                    </div>
                    {agreement.project_address && (
                        <div className="flex gap-3">
                            <span className="w-40 flex-shrink-0 font-semibold" style={{ color: '#888480' }}>Project Address:</span>
                            <span className="text-forest">{agreement.project_address}</span>
                        </div>
                    )}
                    {agreement.contract_reference && (
                        <div className="flex gap-3">
                            <span className="w-40 flex-shrink-0 font-semibold" style={{ color: '#888480' }}>Contract / Reference:</span>
                            <span className="text-forest">{agreement.contract_reference}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Items */}
            {items.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-forest uppercase tracking-wide mb-3"
                        style={{ borderBottom: '1.5px solid #f0ebe3', paddingBottom: 6 }}>
                        Variation Details
                    </h2>
                    <p className="text-xs mb-3" style={{ color: '#888480' }}>
                        Prices stated are exclusive of VAT unless otherwise noted.
                    </p>
                    <table className="w-full text-sm rounded-xl overflow-hidden" style={{ border: '1px solid #D1CDC7' }}>
                        <thead>
                            <tr style={{ background: '#F1F1EF', borderBottom: '1px solid #D1CDC7' }}>
                                <th className="text-left px-3 py-2.5 font-semibold w-12" style={{ color: '#888480' }}>No.</th>
                                <th className="text-left px-3 py-2.5 font-semibold" style={{ color: '#888480' }}>Description</th>
                                <th className="text-right px-3 py-2.5 font-semibold w-28" style={{ color: '#888480' }}>Price (£)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} style={{ borderTop: '1px solid #F1F1EF' }}>
                                    <td className="px-3 py-2.5" style={{ color: '#888480' }}>{i + 1}</td>
                                    <td className="px-3 py-2.5 text-forest">{item.description}</td>
                                    <td className="px-3 py-2.5 text-right font-semibold text-forest">
                                        {Number(item.price) > 0 ? `£${Number(item.price).toFixed(2)}` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {total > 0 && (
                            <tfoot>
                                <tr style={{ borderTop: '1.5px solid #D1CDC7', background: '#F1F1EF' }}>
                                    <td className="px-3 py-2.5 font-bold text-forest" colSpan={2}>
                                        Total Variation Cost (£)
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-bold text-forest">£{total.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {/* Agreement text */}
            <div className="mb-6 rounded-xl p-4" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid #e8d9a0' }}>
                <h2 className="text-sm font-bold text-forest mb-2">Agreement</h2>
                <p className="text-xs mb-2" style={{ color: '#6b6040' }}>By signing below, the client confirms that:</p>
                <ul className="space-y-1">
                    {[
                        'The above variations are requested by the client',
                        'Any impact on cost and/or project timeline has been explained',
                        `The total cost will be added to the original contract value`,
                        'Works related to this agreement will proceed only after this agreement is signed',
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs" style={{ color: '#6b6040' }}>
                            <span className="mt-0.5 flex-shrink-0">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Notes */}
            {agreement.notes && (
                <div className="mb-6 rounded-xl px-4 py-3" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Additional Notes</p>
                    <p className="text-sm text-forest">{agreement.notes}</p>
                </div>
            )}
        </div>
    );
}

// ── Signature section (only when status=sent) ─────────────────────────────────

function SignatureSection({ agreement }) {
    const sigRef               = useRef(null);
    const [name, setName]      = useState('');
    const [agreed, setAgreed]  = useState(false);
    const [empty, setEmpty]    = useState(true);
    const [busy, setBusy]      = useState(false);
    const [error, setError]    = useState('');

    function handleClear() {
        sigRef.current?.clear();
        setEmpty(true);
    }

    function handleSign(e) {
        e.preventDefault();
        setError('');

        if (!name.trim()) { setError('Please enter your full name.'); return; }
        if (empty || sigRef.current?.isEmpty()) { setError('Please draw your signature.'); return; }
        if (!agreed) { setError('Please confirm you have read and agree to the agreement.'); return; }

        const signatureData = sigRef.current.toDataURL('image/png');

        setBusy(true);
        router.post(route('client.agreements.sign', agreement.id), {
            signed_by_name: name,
            signature_data: signatureData,
        }, {
            onError: (errors) => {
                setError(Object.values(errors)[0] ?? 'Something went wrong.');
                setBusy(false);
            },
            onFinish: () => setBusy(false),
        });
    }

    return (
        <div className="bg-white rounded-2xl p-8 sm:p-10 mt-4" style={{ border: '0.5px solid #D1CDC7', maxWidth: 680 }}>
            <h2 className="text-base font-bold text-forest mb-1">Client Acceptance</h2>
            <p className="text-xs mb-5" style={{ color: '#888480' }}>
                Sign below to confirm your acceptance of this agreement.
            </p>

            <form onSubmit={handleSign} className="space-y-5">
                {/* Full name */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Type your full name…"
                        className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                        style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}
                    />
                </div>

                {/* Signature canvas */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4A4A4A' }}>
                            Signature
                        </label>
                        <button type="button" onClick={handleClear}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Clear
                        </button>
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid #D1CDC7', background: '#FAFAF8' }}>
                        <SignatureCanvas
                            ref={sigRef}
                            penColor="#1a2a1a"
                            canvasProps={{
                                width: 600,
                                height: 160,
                                className: 'w-full',
                                style: { touchAction: 'none' },
                            }}
                            onEnd={() => setEmpty(false)}
                        />
                    </div>
                    <p className="text-xs mt-1" style={{ color: '#888480' }}>Draw your signature using your mouse or touch.</p>
                </div>

                {/* Date */}
                <div className="flex items-center gap-3 text-sm">
                    <span className="font-semibold" style={{ color: '#888480' }}>Date:</span>
                    <span className="text-forest">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                {/* Consent checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded accent-forest flex-shrink-0" />
                    <span className="text-sm" style={{ color: '#4a3f30' }}>
                        I confirm that I have read and understood this agreement and agree to its terms.
                    </span>
                </label>

                {error && (
                    <p className="text-xs px-1" style={{ color: '#b03030' }}>{error}</p>
                )}

                <button type="submit" disabled={busy}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                    style={{ background: '#25282D', color: '#FFFFFF', opacity: busy ? 0.6 : 1 }}>
                    {busy ? 'Signing…' : 'Sign Agreement'}
                </button>
            </form>
        </div>
    );
}

// ── Signed banner ─────────────────────────────────────────────────────────────

function SignedBanner({ agreement }) {
    return (
        <div className="rounded-2xl p-5 mt-4" style={{ maxWidth: 680, background: 'rgba(26,96,46,0.06)', border: '1px solid #4a9a6a' }}>
            <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(26,96,46,0.12)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6030" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: '#1a6030' }}>Agreement Signed</p>
                    <p className="text-xs mt-0.5" style={{ color: '#2d7a40' }}>
                        Signed by {agreement.signed_by_name} on {agreement.signed_at}
                    </p>
                    {agreement.signature_data && (
                        <img src={agreement.signature_data} alt="Your signature" className="mt-3 max-h-14" />
                    )}
                </div>
            </div>
            <a href={route('client.agreements.download', agreement.id)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#25282D', color: '#FFFFFF' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download Signed Agreement (PDF)
            </a>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgreementShow({ agreement }) {
    return (
        <AuthenticatedLayout title="Agreement" breadcrumb={agreement.title}>
            <Head title={agreement.title} />

            <div className="w-full flex flex-col items-start gap-0">
                <DocumentView agreement={agreement} />

                {agreement.status === 'sent'   && <SignatureSection agreement={agreement} />}
                {agreement.status === 'signed' && <SignedBanner agreement={agreement} />}
            </div>
        </AuthenticatedLayout>
    );
}
