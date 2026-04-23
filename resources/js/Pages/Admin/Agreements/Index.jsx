import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalShell from '@/Components/ModalShell';
import { Head, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

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

// ── File type icon ────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 32 }) {
    const ext = (mimeType ?? '').toLowerCase();
    let color = '#888480', label = 'FILE';
    if (ext.includes('pdf'))                                                  { color = '#e53e3e'; label = 'PDF'; }
    else if (ext.includes('word') || ext.includes('doc'))                     { color = '#2b6cb0'; label = 'DOC'; }
    else if (ext.includes('sheet') || ext.includes('excel') || ext.includes('xls')) { color = '#276749'; label = 'XLS'; }
    else if (ext.includes('image') || ext.includes('png') || ext.includes('jpg'))   { color = '#6b46c1'; label = 'IMG'; }
    return (
        <div className="flex flex-col items-center justify-center rounded-lg relative flex-shrink-0"
            style={{ width: size, height: size, background: `${color}14`, border: `1.5px solid ${color}28` }}>
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="absolute bottom-0.5 text-center font-bold leading-none"
                style={{ fontSize: size * 0.18, color, letterSpacing: '-0.02em' }}>
                {label}
            </span>
        </div>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

const TABS = ['Variation Agreements', 'Terms & Conditions', 'Others'];

function TabBar({ active, onChange }) {
    return (
        <div className="flex p-1 rounded-2xl mb-6" style={{ background: '#ebe5dc' }}>
            {TABS.map(t => (
                <button key={t} onClick={() => onChange(t)}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200"
                    style={active === t
                        ? { background: '#fff', color: '#25282D', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }
                        : { color: '#9a8d7e' }
                    }>
                    {t}
                </button>
            ))}
        </div>
    );
}

// ── Items table helpers ───────────────────────────────────────────────────────

function ItemsTable({ items, onChange }) {
    function updateItem(i, field, value) {
        onChange(items.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
    }
    function addRow() { onChange([...items, { description: '', price: '' }]); }
    function removeRow(i) { onChange(items.filter((_, idx) => idx !== i)); }

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
                                    <input type="text" value={row.description}
                                        onChange={e => updateItem(i, 'description', e.target.value)}
                                        placeholder="Item description…"
                                        className="w-full text-sm text-forest outline-none bg-transparent" />
                                </td>
                                <td className="px-3 py-1.5">
                                    <input type="number" min="0" step="0.01" value={row.price}
                                        onChange={e => updateItem(i, 'price', e.target.value)}
                                        placeholder="0.00"
                                        className="w-full text-sm text-right text-forest outline-none bg-transparent" />
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

// ── Create Agreement Modal ─────────────────────────────────────────────────────

function CreateModal({ show, projects, variations, onClose }) {
    const [projectId, setProjectId]           = useState('');
    const [variationId, setVariationId]       = useState('');
    const [title, setTitle]                   = useState('');
    const [clientName, setClientName]         = useState('');
    const [projectAddress, setProjectAddress] = useState('');
    const [contractRef, setContractRef]       = useState('');
    const [items, setItems]                   = useState([{ description: '', price: '' }]);
    const [notes, setNotes]                   = useState('');
    const [sendNow, setSendNow]               = useState(false);
    const [busy, setBusy]                     = useState(false);

    const total = items.reduce((sum, r) => sum + (parseFloat(r.price) || 0), 0);

    function handleProjectChange(id) {
        setProjectId(id);
        const p = projects.find(p => String(p.id) === String(id));
        if (p) { setClientName(p.client_name); setProjectAddress(p.address || ''); }
    }

    function handleVariationChange(id) {
        setVariationId(id);
        const v = variations.find(v => String(v.id) === String(id));
        if (v) {
            setTitle(v.title || title);
            if (v.description) setItems([{ description: v.description, price: v.estimated_cost || '' }]);
        }
    }

    const projectVariations = variations.filter(v => String(v.project_id) === String(projectId));

    function submit(e) {
        e.preventDefault();
        setBusy(true);
        router.post(route('admin.agreements.store'), {
            project_id: projectId, variation_request_id: variationId || null,
            title, client_name: clientName, project_address: projectAddress,
            contract_reference: contractRef, items: items.filter(r => r.description),
            total_amount: total, notes, send_now: sendNow,
        }, { onSuccess: onClose, onFinish: () => setBusy(false) });
    }

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <h2 className="text-base font-bold text-forest">Create Variation Agreement</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>
                <form onSubmit={submit} className="overflow-y-auto px-5 py-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Project</label>
                        <select value={projectId} onChange={e => handleProjectChange(e.target.value)} required
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}>
                            <option value="">Select project…</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Variation Request <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(optional — auto-fills items)</span>
                        </label>
                        <select value={variationId} onChange={e => handleVariationChange(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}>
                            <option value="">None — fill manually</option>
                            {projectVariations.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                            placeholder="e.g. Scope of Works — Stage 1"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>
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
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Contract / Proposal Reference <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(opt.)</span>
                        </label>
                        <input type="text" value={contractRef} onChange={e => setContractRef(e.target.value)}
                            placeholder="e.g. BGR-2026-001"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>Items</label>
                        <ItemsTable items={items} onChange={setItems} />
                        {total > 0 && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-sm font-bold text-forest">Total: £{total.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Notes <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(opt.)</span>
                        </label>
                        <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                            placeholder="Internal notes or additional terms…"
                            className="w-full px-3 py-2.5 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }} />
                    </div>
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

// ── View Agreement Modal ──────────────────────────────────────────────────────

function ViewModal({ show, agreement, onClose }) {
    const [busy, setBusy] = useState(false);

    function handleSend() {
        setBusy(true);
        router.post(route('admin.agreements.send', agreement.id), {}, {
            onSuccess: onClose, onFinish: () => setBusy(false),
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
                <div className="flex items-center justify-between px-5 pt-5 pb-4"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">{agreement.title}</h2>
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
                    <div className="flex items-center gap-2">
                        <StatusBadge status={agreement.status} />
                        {agreement.signed_at && (
                            <span className="text-xs" style={{ color: '#888480' }}>Signed {agreement.signed_at} by {agreement.signed_by_name}</span>
                        )}
                        {agreement.sent_at && agreement.status === 'sent' && (
                            <span className="text-xs" style={{ color: '#888480' }}>Sent {agreement.sent_at}</span>
                        )}
                    </div>
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
                    {agreement.signature_data && (
                        <div className="rounded-xl p-3" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: '#888480' }}>Client Signature</p>
                            <img src={agreement.signature_data} alt="Signature" className="max-h-16 max-w-full" />
                        </div>
                    )}
                    {agreement.notes && (
                        <div className="rounded-xl px-3 py-2.5" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{agreement.notes}</p>
                        </div>
                    )}
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

// ── Document upload tab (Terms & Conditions / Others) ─────────────────────────

// ── Project selector dropdown ─────────────────────────────────────────────────

function ProjectSelect({ projects, value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected = projects.find(p => String(p.id) === String(value));

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-colors"
                style={{
                    background: '#F1F1EF',
                    border: `1.5px solid ${open ? '#25282D' : '#D1CDC7'}`,
                    borderBottomLeftRadius:  open ? 0 : undefined,
                    borderBottomRightRadius: open ? 0 : undefined,
                }}>
                {selected ? (
                    <span className="font-medium text-forest truncate">{selected.name}</span>
                ) : (
                    <span style={{ color: '#888480' }}>— Choose a project —</span>
                )}
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#888480" strokeWidth="2"
                    strokeLinecap="round" className="flex-shrink-0 ml-2"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="3,5 8,11 13,5"/>
                </svg>
            </button>

            {open && (
                <div className="absolute left-0 right-0 z-20 rounded-b-xl overflow-hidden"
                    style={{ border: '1.5px solid #25282D', borderTop: 'none', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                    {projects.length === 0 ? (
                        <p className="px-4 py-3 text-xs" style={{ color: '#888480' }}>No projects available.</p>
                    ) : projects.map((p, i) => (
                        <button key={p.id} type="button"
                            onClick={() => { onChange(String(p.id)); setOpen(false); }}
                            className="w-full px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                            style={{
                                borderTop: i > 0 ? '0.5px solid #f0ebe3' : 'none',
                                background: String(p.id) === String(value) ? 'rgba(26,60,46,0.04)' : undefined,
                            }}>
                            <span className="text-sm font-medium text-forest">{p.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Document upload tab (Terms & Conditions / Others) ─────────────────────────

function DocumentUploadTab({ category, allDocs, projects }) {
    const fileRef                         = useRef(null);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [uploading, setUploading]       = useState(false);
    const [deleting, setDeleting]         = useState(null);

    const selectedProject = projects.find(p => String(p.id) === String(selectedProjectId));
    const visibleDocs     = allDocs.filter(
        d => d.category === category && String(d.project_id) === String(selectedProjectId)
    );

    function upload(file) {
        if (!file || !selectedProjectId) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', file);
        fd.append('project_id', selectedProjectId);
        router.post(route('admin.agreements.documents.store', category), fd, {
            forceFormData: true,
            onFinish: () => { setUploading(false); if (fileRef.current) fileRef.current.value = ''; },
        });
    }

    function deleteDoc(id) {
        setDeleting(id);
        router.delete(route('admin.agreements.documents.destroy', id), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <div className="space-y-4">
            {/* Project selector — plain card (no backdrop-filter) to avoid CSS stacking context trapping the dropdown */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '0.5px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A4A4A' }}>
                    Select Project
                </label>
                <ProjectSelect projects={projects} value={selectedProjectId} onChange={setSelectedProjectId} />
            </div>

            {!selectedProjectId ? (
                <div className="glass-card rounded-xl px-5 py-10 text-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1CDC7" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <p className="text-sm font-medium text-forest mb-1">Select a project above</p>
                    <p className="text-xs" style={{ color: '#888480' }}>Choose a project to view and upload its documents.</p>
                </div>
            ) : (
                <>
                    {/* Upload zone */}
                    <div
                        className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                        style={{ border: '1.5px dashed #D1CDC7', minHeight: 120 }}
                        onClick={() => !uploading && fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#25282D'; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = '#D1CDC7'; }}
                        onDrop={e => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = '#D1CDC7';
                            upload(e.dataTransfer.files[0]);
                        }}>
                        {uploading ? (
                            <div className="flex items-center gap-2" style={{ color: '#25282D' }}>
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                                <span className="text-sm font-medium">Uploading…</span>
                            </div>
                        ) : (
                            <>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25282D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                <p className="text-sm font-semibold text-forest">Click or drag to upload</p>
                                <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                    For <span className="font-medium">{selectedProject?.name}</span> · PDF, Word, Excel — up to 20 MB
                                </p>
                            </>
                        )}
                        <input ref={fileRef} type="file" className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
                            onChange={e => upload(e.target.files[0])} />
                    </div>

                    {/* File table */}
                    {visibleDocs.length > 0 ? (
                        <div className="glass-card rounded-xl overflow-hidden">
                            <div className="px-4 pt-4 pb-2">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#888480', fontSize: 10 }}>
                                    {visibleDocs.length} document{visibleDocs.length !== 1 ? 's' : ''} for {selectedProject?.name}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: '0.5px solid #D1CDC7', background: '#F1F1EF' }}>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>File</th>
                                            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Size</th>
                                            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Uploaded</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleDocs.map((doc, i) => (
                                            <tr key={doc.id}
                                                style={{ borderBottom: i < visibleDocs.length - 1 ? '0.5px solid #F1F1EF' : 'none' }}
                                                className="hover:bg-stone-50 transition-colors">
                                                <td className="px-4 py-3 min-w-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileIcon mimeType={doc.mime_type} size={32} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-forest truncate" title={doc.original_name}>
                                                                {doc.original_name}
                                                            </p>
                                                            <p className="sm:hidden text-xs mt-0.5" style={{ color: '#888480' }}>
                                                                {doc.file_size ? formatBytes(doc.file_size) : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 py-3 text-xs" style={{ color: '#888480' }}>
                                                    {doc.file_size ? formatBytes(doc.file_size) : '—'}
                                                </td>
                                                <td className="hidden sm:table-cell px-4 py-3 text-xs" style={{ color: '#888480' }}>
                                                    {doc.uploaded_at}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <a href={route('admin.agreements.documents.download', doc.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
                                                            style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                                                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                <path d="M8 2v8M4 7l4 4 4-4"/><path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/>
                                                            </svg>
                                                            <span className="hidden sm:inline">Download</span>
                                                        </a>
                                                        <button
                                                            onClick={() => deleteDoc(doc.id)}
                                                            disabled={deleting === doc.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-75"
                                                            style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' }}>
                                                            {deleting === doc.id
                                                                ? <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                                                                : <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></svg>
                                                            }
                                                            <span className="hidden sm:inline">Delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        !uploading && (
                            <div className="glass-card rounded-xl px-5 py-8 text-center">
                                <p className="text-sm font-medium text-forest mb-1">No documents yet</p>
                                <p className="text-xs" style={{ color: '#888480' }}>Upload PDF or Word documents for {selectedProject?.name} above.</p>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}

// ── Variation Agreements tab ──────────────────────────────────────────────────

function VariationAgreementsTab({ agreements, projects, variations }) {
    const [showCreate, setShowCreate] = useState(false);
    const [viewing, setViewing]       = useState(null);

    const draft  = agreements.filter(a => a.status === 'draft').length;
    const sent   = agreements.filter(a => a.status === 'sent').length;
    const signed = agreements.filter(a => a.status === 'signed').length;

    return (
        <>
            <CreateModal show={showCreate} projects={projects} variations={variations} onClose={() => setShowCreate(false)} />
            {viewing && <ViewModal show agreement={viewing} onClose={() => setViewing(null)} />}

            <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm" style={{ color: '#888480' }}>
                    {agreements.length} total · {draft} draft · {sent} pending signature · {signed} signed
                </p>
                <button onClick={() => setShowCreate(true)}
                    className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold"
                    style={{ background: '#25282D', color: '#FFFFFF' }}>
                    + Create Agreement
                </button>
            </div>

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
                                All Variation Agreements
                            </span>
                        </div>
                        <div className="divide-y" style={{ borderColor: '#F1F1EF' }}>
                            {agreements.map(a => (
                                <div key={a.id} className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-forest">{a.title}</p>
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
        </>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AgreementsIndex({ agreements, projects, variations, portalDocs }) {
    const [tab, setTab] = useState('Variation Agreements');

    const allDocs = portalDocs ?? [];

    return (
        <AuthenticatedLayout title="Agreements" breadcrumb="Client agreements & documents">
            <Head title="Agreements" />

            <div className="w-full">
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Agreements</h1>
                </div>

                <TabBar active={tab} onChange={setTab} />

                {tab === 'Variation Agreements' && (
                    <VariationAgreementsTab
                        agreements={agreements}
                        projects={projects}
                        variations={variations}
                    />
                )}
                {tab === 'Terms & Conditions' && (
                    <DocumentUploadTab category="terms_conditions" allDocs={allDocs} projects={projects} />
                )}
                {tab === 'Others' && (
                    <DocumentUploadTab category="others" allDocs={allDocs} projects={projects} />
                )}
            </div>
        </AuthenticatedLayout>
    );
}
