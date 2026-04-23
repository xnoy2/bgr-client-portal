import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalShell from '@/Components/ModalShell';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    draft:  { label: 'Draft',   bg: 'rgba(136,132,128,0.10)', border: '#b0aca8', text: '#6b6560' },
    sent:   { label: 'Sent',    bg: 'rgba(201,168,76,0.10)',  border: '#c9a84c', text: '#a07a20' },
    signed: { label: 'Signed',  bg: 'rgba(26,96,46,0.08)',    border: '#4a9a6a', text: '#1a6030' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.draft;
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

// ── Items table helpers ───────────────────────────────────────────────────────

function ItemsTable({ items, onChange }) {
    function updateItem(i, field, value) {
        const next = items.map((row, idx) => idx === i ? { ...row, [field]: value } : row);
        onChange(next);
    }
    function addRow() {
        onChange([...items, { description: '', price: '' }]);
    }
    function removeRow(i) {
        onChange(items.filter((_, idx) => idx !== i));
    }

    return (
        <div>
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D1CDC7' }}>
                <table className="w-full text-sm">
                    <thead>
                        <tr style={{ background: '#F1F1EF', borderBottom: '1px solid #D1CDC7' }}>
                            <th className="text-left px-3 py-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#888480' }}>Description</th>
                            <th className="text-right px-3 py-2 text-xs font-semibold uppercase tracking-wide w-28" style={{ color: '#888480' }}>Price (£)</th>
                            <th className="w-8" />
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((row, i) => (
                            <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #F1F1EF' : 'none' }}>
                                <td className="px-3 py-1.5">
                                    <input
                                        type="text"
                                        value={row.description}
                                        onChange={e => updateItem(i, 'description', e.target.value)}
                                        placeholder="Item description…"
                                        className="w-full text-sm text-forest outline-none bg-transparent"
                                    />
                                </td>
                                <td className="px-3 py-1.5">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={row.price}
                                        onChange={e => updateItem(i, 'price', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full text-sm text-right text-forest outline-none bg-transparent"
                                    />
                                </td>
                                <td className="px-2 py-1.5 text-center">
                                    <button type="button" onClick={() => removeRow(i)}
                                        className="text-xs" style={{ color: '#b03030' }}>✕</button>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-3 py-3 text-xs text-center" style={{ color: '#888480' }}>
                                    No items yet — add a row below.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <button type="button" onClick={addRow}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                + Add Row
            </button>
        </div>
    );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateModal({ show, projects, variations, onClose }) {

    const [projectId, setProjectId]         = useState('');
    const [variationId, setVariationId]     = useState('');
    const [title, setTitle]                 = useState('');
    const [clientName, setClientName]       = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [contractRef, setContractRef]     = useState('');
    const [items, setItems]                 = useState([{ description: '', price: '' }]);
    const [notes, setNotes]                 = useState('');
    const [sendNow, setSendNow]             = useState(false);
    const [busy, setBusy]                   = useState(false);

    const total = items.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);

    // Auto-fill client name and address when project is selected
    function handleProjectChange(id) {
        setProjectId(id);
        const p = projects.find(p => String(p.id) === String(id));
        if (p) {
            setClientName(p.client_name);
            setProjectAddress(p.address || '');
        }
    }

    // Auto-fill from variation when selected
    function handleVariationChange(id) {
        setVariationId(id);
        const v = variations.find(v => String(v.id) === String(id));
        if (v) {
            setTitle(v.title || title);
            if (v.description) {
                setItems([{ description: v.description, price: v.estimated_cost || '' }]);
            }
        }
    }

    // Filter variations by selected project
    const projectVariations = variations.filter(v => String(v.project_id) === String(projectId));

    function submit(e) {
        e.preventDefault();
        setBusy(true);
        router.post(route('admin.agreements.store'), {
            project_id:           projectId,
            variation_request_id: variationId || null,
            title,
            client_name:     clientName,
            project_address: projectAddress,
            contract_reference: contractRef,
            items:           items.filter(r => r.description),
            total_amount:    total,
            notes,
            send_now:        sendNow,
        }, { onSuccess: onClose, onFinish: () => setBusy(false) });
    }

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <h2 className="text-base font-bold text-forest">Create Agreement</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="overflow-y-auto px-5 py-4 space-y-4">
                    {/* Project */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Project</label>
                        <select value={projectId} onChange={e => handleProjectChange(e.target.value)} required
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}>
                            <option value="">Select project…</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Variation Request */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Variation Request <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(optional — auto-fills items)</span>
                        </label>
                        <select value={variationId} onChange={e => handleVariationChange(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}>
                            <option value="">None — fill manually</option>
                            {projectVariations.map(v => (
                                <option key={v.id} value={v.id}>{v.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                            placeholder="e.g. Scope of Works — Stage 1"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>

                    {/* Client Name / Project Address */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Client Name</label>
                            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} required
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                                Project Address <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(opt.)</span>
                            </label>
                            <input type="text" value={projectAddress} onChange={e => setProjectAddress(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                                style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                        </div>
                    </div>

                    {/* Contract Reference */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Contract / Proposal Reference <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(opt.)</span>
                        </label>
                        <input type="text" value={contractRef} onChange={e => setContractRef(e.target.value)}
                            placeholder="e.g. BGR-2026-001"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>

                    {/* Items */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Items</label>
                        <ItemsTable items={items} onChange={setItems} />
                        {total > 0 && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-sm font-bold text-forest">Total: £{total.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Notes <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(opt.)</span>
                        </label>
                        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Internal notes or additional terms…"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>

                    {/* Send now toggle */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input type="checkbox" checked={sendNow} onChange={e => setSendNow(e.target.checked)}
                            className="w-4 h-4 rounded accent-forest" />
                        <span className="text-sm text-forest">Send to client immediately</span>
                    </label>

                    <div className="flex gap-2.5 pt-1 pb-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={busy}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ flex: 2, background: '#25282D', color: '#FFFFFF', opacity: busy ? 0.6 : 1 }}>
                            {busy ? 'Saving…' : sendNow ? 'Save & Send' : 'Save as Draft'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalShell>
    );
}

// ── View Modal ────────────────────────────────────────────────────────────────

function ViewModal({ show, agreement, onClose }) {

    const [busy, setBusy] = useState(false);

    function handleSend() {
        setBusy(true);
        router.post(route('admin.agreements.send', agreement.id), {}, {
            onSuccess: onClose,
            onFinish: () => setBusy(false),
        });
    }

    function handleDelete() {
        if (!confirm('Delete this agreement?')) return;
        router.delete(route('admin.agreements.destroy', agreement.id), { onSuccess: onClose });
    }

    const items = agreement.items ?? [];

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-base font-bold text-forest">{agreement.title}</h2>
                        </div>
                        <p className="text-xs" style={{ color: '#888480' }}>{agreement.project_name} · {agreement.client_name}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto px-5 py-4 space-y-3">
                    {/* Status row */}
                    <div className="flex items-center gap-2">
                        <StatusBadge status={agreement.status} />
                        {agreement.signed_at && (
                            <span className="text-xs" style={{ color: '#888480' }}>Signed {agreement.signed_at} by {agreement.signed_by_name}</span>
                        )}
                        {agreement.sent_at && agreement.status === 'sent' && (
                            <span className="text-xs" style={{ color: '#888480' }}>Sent {agreement.sent_at}</span>
                        )}
                    </div>

                    {/* Details */}
                    <div className="rounded-xl px-3 py-2.5 space-y-1.5" style={{ background: '#F1F1EF' }}>
                        {agreement.project_address && (
                            <div className="flex gap-2 text-sm">
                                <span className="font-semibold w-32 flex-shrink-0" style={{ color: '#888480' }}>Address</span>
                                <span className="text-forest">{agreement.project_address}</span>
                            </div>
                        )}
                        {agreement.contract_reference && (
                            <div className="flex gap-2 text-sm">
                                <span className="font-semibold w-32 flex-shrink-0" style={{ color: '#888480' }}>Reference</span>
                                <span className="text-forest">{agreement.contract_reference}</span>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #D1CDC7' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: '#F1F1EF', borderBottom: '1px solid #D1CDC7' }}>
                                        <th className="text-left px-3 py-2 text-xs font-semibold" style={{ color: '#888480' }}>Description</th>
                                        <th className="text-right px-3 py-2 text-xs font-semibold w-24" style={{ color: '#888480' }}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #F1F1EF' }}>
                                            <td className="px-3 py-2 text-forest">{item.description}</td>
                                            <td className="px-3 py-2 text-right font-semibold text-forest">£{Number(item.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {agreement.total_amount && (
                                        <tr style={{ borderTop: '1.5px solid #D1CDC7', background: '#F1F1EF' }}>
                                            <td className="px-3 py-2 font-bold text-forest">Total</td>
                                            <td className="px-3 py-2 text-right font-bold text-forest">£{Number(agreement.total_amount).toFixed(2)}</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Signature */}
                    {agreement.signature_data && (
                        <div className="rounded-xl p-3" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: '#888480' }}>Client Signature</p>
                            <img src={agreement.signature_data} alt="Signature" className="max-h-16 max-w-full" />
                        </div>
                    )}

                    {/* Notes */}
                    {agreement.notes && (
                        <div className="rounded-xl px-3 py-2.5" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{agreement.notes}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1">
                        {agreement.status === 'draft' && (
                            <button onClick={handleSend} disabled={busy}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity"
                                style={{ background: '#25282D', color: '#FFFFFF', opacity: busy ? 0.6 : 1 }}>
                                {busy ? 'Sending…' : 'Send to Client'}
                            </button>
                        )}
                        {agreement.status === 'signed' && (
                            <a href={route('admin.agreements.download', agreement.id)}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
                                style={{ background: '#25282D', color: '#FFFFFF' }}>
                                Download PDF ↓
                            </a>
                        )}
                        {agreement.status !== 'signed' && (
                            <button onClick={handleDelete}
                                className="px-4 py-3 rounded-xl text-sm font-semibold"
                                style={{ background: 'rgba(200,40,40,0.07)', color: '#b03030', border: '1px solid #e07070' }}>
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </ModalShell>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgreementsIndex({ agreements, projects, variations }) {
    const [showCreate, setShowCreate] = useState(false);
    const [viewing, setViewing]       = useState(null);

    const draft  = agreements.filter(a => a.status === 'draft').length;
    const sent   = agreements.filter(a => a.status === 'sent').length;
    const signed = agreements.filter(a => a.status === 'signed').length;

    return (
        <AuthenticatedLayout title="Agreements" breadcrumb="Client agreements & proposals">
            <Head title="Agreements" />

            <CreateModal show={showCreate} projects={projects} variations={variations} onClose={() => setShowCreate(false)} />
            {viewing && <ViewModal show agreement={viewing} onClose={() => setViewing(null)} />}

            <div className="w-full">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-forest">Agreements</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                            {agreements.length} total · {draft} draft · {sent} pending signature · {signed} signed
                        </p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
                        style={{ background: '#25282D', color: '#FFFFFF' }}>
                        + Create Agreement
                    </button>
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
                            <p className="text-xs" style={{ color: '#888480' }}>Create an agreement to get started.</p>
                        </div>
                    ) : (
                        <>
                            <div className="px-4 sm:px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888480', fontSize: 10 }}>
                                    All Agreements
                                </span>
                            </div>
                            <div className="divide-y" style={{ borderColor: '#F1F1EF' }}>
                                {agreements.map(a => (
                                    <div key={a.id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-forest">{a.title}</p>
                                            </div>
                                            <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                                {a.project_name} · {a.client_name} · Created {a.created_at}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2.5 flex-shrink-0">
                                            {a.total_amount && (
                                                <span className="text-xs font-semibold text-forest hidden sm:inline">
                                                    £{Number(a.total_amount).toLocaleString()}
                                                </span>
                                            )}
                                            <StatusBadge status={a.status} />
                                            <button onClick={() => setViewing(a)}
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
