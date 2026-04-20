import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(val) {
    if (!val) return null;
    return new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── File type icon ────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 44 }) {
    const ext = (mimeType ?? '').toLowerCase();
    let color = '#888480', label = 'FILE';

    if (ext.includes('pdf'))                                           { color = '#e53e3e'; label = 'PDF'; }
    else if (ext.includes('word') || ext.includes('doc'))              { color = '#2b6cb0'; label = 'DOC'; }
    else if (ext.includes('sheet') || ext.includes('excel') || ext.includes('xls')) { color = '#276749'; label = 'XLS'; }
    else if (ext.includes('presentation') || ext.includes('powerpoint') || ext.includes('ppt')) { color = '#c05621'; label = 'PPT'; }
    else if (ext.includes('image') || ext.includes('png') || ext.includes('jpg')) { color = '#6b46c1'; label = 'IMG'; }
    else if (ext.includes('zip') || ext.includes('rar'))               { color = '#b7791f'; label = 'ZIP'; }
    else if (ext.includes('text') || ext.includes('plain'))            { color = '#4a5568'; label = 'TXT'; }

    return (
        <div className="flex flex-col items-center justify-center rounded-xl relative flex-shrink-0"
            style={{ width: size, height: size, background: `${color}12`, border: `1.5px solid ${color}22` }}>
            <svg width={size * 0.48} height={size * 0.48} viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="absolute bottom-1 text-center font-bold leading-none"
                style={{ fontSize: size * 0.16, color, letterSpacing: '-0.02em' }}>
                {label}
            </span>
        </div>
    );
}

// ── Status badge ──────────────────────────────────────────────────────────────

const SIGN_STATUS = {
    draft:   { label: 'Draft',   bg: '#F9F8F6', color: '#888480',  border: '#D1CDC7' },
    pending: { label: 'Pending', bg: '#fffbeb', color: '#b45309',  border: '#fde68a' },
    signed:  { label: 'Signed',  bg: '#f0fdf4', color: '#15803d',  border: '#bbf7d0' },
};

function StatusBadge({ status }) {
    const s = SIGN_STATUS[status] ?? SIGN_STATUS.draft;
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
            {status === 'signed' && (
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="2,8 6,12 14,4"/>
                </svg>
            )}
            {s.label}
        </span>
    );
}

// ── Sign Modal ────────────────────────────────────────────────────────────────

function SignModal({ doc, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ signer_name: '' });
    const [agreed, setAgreed] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => inputRef.current?.focus(), 80);
        return () => clearTimeout(timer);
    }, []);

    // Lock body scroll while open
    useEffect(() => {
        window.document.body.style.overflow = 'hidden';
        return () => { window.document.body.style.overflow = ''; };
    }, []);

    // Close on Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    function submit(e) {
        e.preventDefault();
        post(route('client.documents.sign', doc.id), {
            onSuccess: () => { reset(); onClose(); },
        });
    }

    const canSign = data.signer_name.trim().length >= 2 && agreed && !processing;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(14,32,25,0.55)', backdropFilter: 'blur(3px)' }}
            onClick={onClose}>

            <div className="w-full sm:max-w-md bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl"
                style={{ border: '0.5px solid #D1CDC7' }}
                onClick={e => e.stopPropagation()}>

                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#d0c8bc' }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(26,60,46,0.07)' }}>
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                                stroke="#121417" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-forest leading-tight">Sign Document</p>
                            <p className="text-xs truncate mt-0.5" style={{ color: '#888480' }}>{doc.title}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                        style={{ background: '#f0ebe3', color: '#888480' }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                {/* Document chip */}
                <div className="mx-5 mt-4 flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: '#f8f4ef', border: '0.5px solid #e8e0d5' }}>
                    <FileIcon mimeType={doc.mime_type} size={36} />
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-forest truncate leading-snug">{doc.title}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: '#888480' }}>{doc.filename}</p>
                    </div>
                    <a href={route('client.documents.download', doc.id)}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: '#fff', border: '0.5px solid #D1CDC7', color: '#888480' }}
                        title="View document" onClick={e => e.stopPropagation()}>
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M7 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V9"/>
                            <polyline points="10 2 14 2 14 6"/><line x1="8" y1="8" x2="14" y2="2"/>
                        </svg>
                    </a>
                </div>

                {/* Form */}
                <form onSubmit={submit} className="px-5 pt-4 pb-5 space-y-4">

                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5a4f42' }}>
                            Your full legal name
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={data.signer_name}
                            onChange={e => setData('signer_name', e.target.value)}
                            placeholder="e.g. John Smith"
                            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                                border: `1.5px solid ${errors.signer_name ? '#fca5a5' : '#D1CDC7'}`,
                                background: '#fdfcfa',
                                color: '#121417',
                                fontFamily: 'Georgia, serif',
                                letterSpacing: '0.03em',
                            }}
                            onFocus={e => e.target.style.borderColor = '#121417'}
                            onBlur={e  => e.target.style.borderColor = errors.signer_name ? '#fca5a5' : '#D1CDC7'}
                        />
                        {errors.signer_name
                            ? <p className="mt-1 text-xs" style={{ color: '#b91c1c' }}>{errors.signer_name}</p>
                            : <p className="mt-1 text-xs" style={{ color: '#b8a898' }}>
                                Typing your name acts as your electronic signature and will be stamped on the document.
                              </p>
                        }
                    </div>

                    {/* Consent checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <div className="flex-shrink-0 mt-0.5">
                            <input type="checkbox" className="sr-only" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                            <div className="flex items-center justify-center transition-all"
                                style={{
                                    width: 18, height: 18,
                                    background: agreed ? '#121417' : '#fff',
                                    border: `1.5px solid ${agreed ? '#121417' : '#d0c8bc'}`,
                                    borderRadius: 5,
                                }}>
                                {agreed && (
                                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="#121417" strokeWidth="2.8" strokeLinecap="round">
                                        <polyline points="2,8 6,12 14,4"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: '#4A4A4A' }}>
                            I agree this electronic signature is valid and legally binding on this document.
                        </p>
                    </label>

                    <div style={{ borderTop: '0.5px solid #f0ebe3' }} />

                    <div className="flex gap-2.5">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                            style={{ background: '#F9F8F6', color: '#4A4A4A', border: '0.5px solid #D1CDC7' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={!canSign}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: canSign ? '#121417' : '#D1CDC7',
                                color:      canSign ? '#121417' : '#c4b8a8',
                                cursor:     canSign ? 'pointer' : 'not-allowed',
                                border: 'none',
                            }}>
                            {processing
                                ? <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
                                    </svg>
                                    Signing…
                                  </span>
                                : 'Sign Document'
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Document row ──────────────────────────────────────────────────────────────

function DocumentRow({ doc, onSign }) {
    const isSigned  = doc.sign_status === 'signed';
    const isPending = doc.sign_status === 'pending';

    let subtitle;
    if (isSigned) {
        subtitle = [
            doc.sent_at   && `Sent ${formatDate(doc.sent_at)}`,
            doc.signed_at && `Signed ${formatDate(doc.signed_at)}`,
        ].filter(Boolean).join(' · ');
    } else if (isPending) {
        subtitle = [
            doc.sent_at && `Sent ${formatDate(doc.sent_at)}`,
            'Awaiting signature',
        ].filter(Boolean).join(' · ');
    } else {
        subtitle = 'Draft · not yet sent';
    }

    return (
        <div className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: '0.5px solid #F9F8F6' }}>

            {/* Icon */}
            <a href={route('client.documents.download', doc.id)} target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0" title="View document">
                <FileIcon mimeType={doc.mime_type} size={44} />
            </a>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <a href={route('client.documents.download', doc.id)} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-semibold text-forest hover:underline leading-snug block truncate">
                    {doc.title}
                    {doc.project_name && (
                        <span className="font-normal" style={{ color: '#888480' }}> — {doc.project_name}</span>
                    )}
                </a>
                <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{subtitle}</p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={doc.sign_status} />
                {isPending && (
                    <button onClick={() => onSign(doc)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                            background: '#121417',
                            color: '#121417',
                            border: '0.5px solid rgba(18,20,23,0.12)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0e1012'}
                        onMouseLeave={e => e.currentTarget.style.background = '#121417'}>
                        Sign now
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDocumentsIndex({ documents }) {
    const [signingDoc, setSigningDoc] = useState(null);

    const pending = documents.filter(d => d.sign_status === 'pending');
    const signed  = documents.filter(d => d.sign_status === 'signed');
    const draft   = documents.filter(d => d.sign_status === 'draft');

    const pendingCount = pending.length;

    return (
        <AuthenticatedLayout
            title="Documents"
            breadcrumb="Your project documents & contracts">
            <Head title="Documents" />

            {/* Sign modal */}
            {signingDoc && (
                <SignModal
                    doc={signingDoc}
                    onClose={() => setSigningDoc(null)}
                    onSigned={() => setSigningDoc(null)}
                />
            )}

            {/* Pending banner */}
            {pendingCount > 0 && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(18,20,23,0.04), rgba(201,168,76,0.04))',
                        border: '0.5px solid rgba(201,168,76,0.35)',
                    }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(18,20,23,0.05)' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#121417" strokeWidth="2" strokeLinecap="round">
                            <circle cx="8" cy="8" r="6.5"/><line x1="8" y1="5" x2="8" y2="8"/><circle cx="8" cy="11" r="0.5" fill="#121417"/>
                        </svg>
                    </div>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                        <span className="font-semibold" style={{ color: '#121417' }}>
                            {pendingCount} document{pendingCount !== 1 ? 's' : ''} awaiting your signature.
                        </span>
                        {' '}Please review and sign below.
                    </p>
                </div>
            )}

            {documents.length === 0 ? (
                /* Empty state */
                <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #D1CDC7' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: '#F9F8F6' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#121417" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                    </div>
                    <p className="text-base font-medium text-forest mb-1">No documents yet</p>
                    <p className="text-sm" style={{ color: '#888480' }}>
                        Documents and contracts shared by your project manager will appear here.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #D1CDC7' }}>
                    {/* Section header */}
                    <div className="px-5 py-4 flex items-center justify-between"
                        style={{ borderBottom: '0.5px solid #D1CDC7', background: '#fdfcfa' }}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>
                            Documents &amp; Contracts
                        </h2>
                        <span className="text-xs" style={{ color: '#888480' }}>
                            {documents.length} document{documents.length !== 1 ? 's' : ''}
                            {signed.length > 0 && ` · ${signed.length} signed`}
                        </span>
                    </div>

                    {/* Pending docs first, then signed, then draft */}
                    {[...pending, ...signed, ...draft].map((doc) => (
                        <DocumentRow key={doc.id} doc={doc} onSign={setSigningDoc} />
                    ))}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
