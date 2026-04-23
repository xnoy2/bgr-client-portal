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

// ── Design primitives ─────────────────────────────────────────────────────────

function Label({ children, optional }) {
    return (
        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b6560', letterSpacing: '0.02em' }}>
            {children}
            {optional && <span className="ml-1 font-normal" style={{ color: '#aaa49e' }}>(optional)</span>}
        </label>
    );
}

function TextInput({ ...props }) {
    return (
        <input
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#fff', border: '1px solid #e8e3db', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e  => e.target.style.borderColor = '#e8e3db'}
            {...props}
        />
    );
}

function TextArea({ ...props }) {
    return (
        <textarea
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
            style={{ background: '#fff', border: '1px solid #e8e3db', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e  => e.target.style.borderColor = '#e8e3db'}
            {...props}
        />
    );
}

function SelectInput({ children, ...props }) {
    return (
        <select
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{ background: '#fff', border: '1px solid #e8e3db', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e  => e.target.style.borderColor = '#e8e3db'}
            {...props}>
            {children}
        </select>
    );
}

function SectionDivider({ label }) {
    return (
        <div className="flex items-center gap-3 pt-1">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#aaa49e', fontSize: 10 }}>{label}</span>
            <div className="flex-1 h-px" style={{ background: '#f0ebe3' }} />
        </div>
    );
}

function Toggle({ checked, onChange }) {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
            className="relative flex-shrink-0 rounded-full transition-colors duration-200"
            style={{ width: 36, height: 20, background: checked ? '#25282D' : '#D1CDC7' }}>
            <span className="absolute top-0.5 rounded-full bg-white shadow transition-transform duration-200"
                style={{ width: 16, height: 16, left: 2, transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
        </button>
    );
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    draft:  { label: 'Draft',   bg: 'rgba(136,132,128,0.10)', border: '#c8c4c0', text: '#6b6560', dot: '#b0aca8' },
    sent:   { label: 'Pending', bg: 'rgba(201,168,76,0.10)',  border: '#d4b060', text: '#9a7020', dot: '#c9a84c' },
    signed: { label: 'Signed',  bg: 'rgba(26,96,46,0.08)',    border: '#4a9a6a', text: '#1a6030', dot: '#3a8a5a' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.draft;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ── File type icon ────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 32 }) {
    const ext = (mimeType ?? '').toLowerCase();
    let color = '#888480', label = 'FILE';
    if (ext.includes('pdf'))                                                        { color = '#e53e3e'; label = 'PDF'; }
    else if (ext.includes('word') || ext.includes('doc'))                           { color = '#2b6cb0'; label = 'DOC'; }
    else if (ext.includes('sheet') || ext.includes('excel') || ext.includes('xls')){ color = '#276749'; label = 'XLS'; }
    else if (ext.includes('image') || ext.includes('png') || ext.includes('jpg'))  { color = '#6b46c1'; label = 'IMG'; }
    return (
        <div className="flex flex-col items-center justify-center rounded-lg relative flex-shrink-0"
            style={{ width: size, height: size, background: `${color}14`, border: `1.5px solid ${color}28` }}>
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="absolute bottom-0.5 text-center font-bold leading-none"
                style={{ fontSize: size * 0.18, color, letterSpacing: '-0.02em' }}>{label}</span>
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
                        : { color: '#9a8d7e' }}>
                    {t}
                </button>
            ))}
        </div>
    );
}

// ── Items table ───────────────────────────────────────────────────────────────

function ItemsTable({ items, onChange }) {
    function updateItem(i, field, value) {
        onChange(items.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
    }
    function addRow()    { onChange([...items, { description: '', price: '' }]); }
    function removeRow(i){ onChange(items.filter((_, idx) => idx !== i)); }

    return (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e3db' }}>
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e8e3db' }}>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold" style={{ color: '#888480' }}>Description</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold w-28" style={{ color: '#888480' }}>Price (£)</th>
                        <th className="w-8" />
                    </tr>
                </thead>
                <tbody>
                    {items.map((row, i) => (
                        <tr key={i} style={{ borderBottom: i < items.length - 1 ? '1px solid #f5f0ea' : 'none' }}>
                            <td className="px-3 py-2">
                                <input type="text" value={row.description}
                                    onChange={e => updateItem(i, 'description', e.target.value)}
                                    placeholder="Item description…"
                                    className="w-full text-sm text-forest outline-none bg-transparent placeholder:text-stone-300" />
                            </td>
                            <td className="px-3 py-2">
                                <input type="number" min="0" step="0.01" value={row.price}
                                    onChange={e => updateItem(i, 'price', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full text-sm text-right text-forest outline-none bg-transparent placeholder:text-stone-300" />
                            </td>
                            <td className="px-2 py-2 text-center">
                                <button type="button" onClick={() => removeRow(i)}
                                    className="w-5 h-5 rounded-full flex items-center justify-center transition-colors hover:bg-red-50"
                                    style={{ color: '#c0a0a0' }}>
                                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                        <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={3} className="px-3 py-4 text-xs text-center" style={{ color: '#aaa49e' }}>
                                No items yet — add a row below.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            <div className="px-3 py-2.5" style={{ borderTop: '1px solid #f5f0ea', background: '#faf8f5' }}>
                <button type="button" onClick={addRow}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ color: '#25282D' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
                    </svg>
                    Add Row
                </button>
            </div>
        </div>
    );
}

// ── Project selector ──────────────────────────────────────────────────────────

function ProjectSelect({ projects, value, onChange, placeholder = '— Choose a project —' }) {
    const [open, setOpen]       = useState(false);
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const wrapRef    = useRef(null);

    useEffect(() => {
        function handler(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function handleOpen() {
        if (open) { setOpen(false); return; }
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
        setOpen(true);
    }

    const selected = projects.find(p => String(p.id) === String(value));

    return (
        <div ref={wrapRef} className="relative">
            <button ref={triggerRef} type="button" onClick={handleOpen}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                style={{ background: '#fff', border: `1px solid ${open ? '#25282D' : '#e8e3db'}` }}>
                {selected
                    ? <span className="font-medium text-forest truncate">{selected.name}</span>
                    : <span style={{ color: '#aaa49e' }}>{placeholder}</span>
                }
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#aaa49e" strokeWidth="2"
                    strokeLinecap="round" className="flex-shrink-0 ml-2"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="3,5 8,11 13,5"/>
                </svg>
            </button>
            {open && (
                <div className="fixed z-50 rounded-xl overflow-hidden"
                    style={{
                        top: dropPos.top + 4, left: dropPos.left, width: dropPos.width,
                        border: '1px solid #e8e3db', background: '#fff',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.12)', maxHeight: 240, overflowY: 'auto',
                    }}>
                    {projects.length === 0
                        ? <p className="px-4 py-3 text-xs" style={{ color: '#aaa49e' }}>No projects available.</p>
                        : projects.map((p, i) => (
                            <button key={p.id} type="button"
                                onClick={() => { onChange(String(p.id)); setOpen(false); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-stone-50"
                                style={{ borderTop: i > 0 ? '0.5px solid #f5f0ea' : 'none',
                                    background: String(p.id) === String(value) ? '#faf8f5' : undefined }}>
                                {String(p.id) === String(value) && (
                                    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2.5" strokeLinecap="round">
                                        <polyline points="2,8 6,12 14,4"/>
                                    </svg>
                                )}
                                <span className="text-sm font-medium text-forest" style={{ marginLeft: String(p.id) === String(value) ? 0 : 18 }}>{p.name}</span>
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
}

// ── Create Modal ──────────────────────────────────────────────────────────────

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
            <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]"
                style={{ border: '1px solid #ede8e0' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4"
                    style={{ borderBottom: '1px solid #f5f0ea' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: '#25282D' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-forest">Create Variation Agreement</h2>
                            <p className="text-xs" style={{ color: '#aaa49e' }}>Fill in the details below</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-stone-100"
                        style={{ color: '#888480' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="overflow-y-auto flex-1">
                    <div className="px-6 py-5 space-y-4">

                        <SectionDivider label="Project Details" />

                        <div>
                            <Label>Project</Label>
                            <ProjectSelect projects={projects} value={projectId} onChange={handleProjectChange} placeholder="Select a project…" />
                        </div>

                        <div>
                            <Label optional>Variation Request <span style={{ color: '#aaa49e', fontSize: 11 }}>— auto-fills items</span></Label>
                            <SelectInput value={variationId} onChange={e => handleVariationChange(e.target.value)}>
                                <option value="">None — fill manually</option>
                                {projectVariations.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                            </SelectInput>
                        </div>

                        <div>
                            <Label>Agreement Title</Label>
                            <TextInput value={title} onChange={e => setTitle(e.target.value)} required
                                placeholder="e.g. Scope of Works — Stage 1" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Client Name</Label>
                                <TextInput value={clientName} onChange={e => setClientName(e.target.value)} required />
                            </div>
                            <div>
                                <Label optional>Project Address</Label>
                                <TextInput value={projectAddress} onChange={e => setProjectAddress(e.target.value)} />
                            </div>
                        </div>

                        <div>
                            <Label optional>Contract / Reference No.</Label>
                            <TextInput value={contractRef} onChange={e => setContractRef(e.target.value)} placeholder="e.g. BGR-2026-001" />
                        </div>

                        <SectionDivider label="Financial Items" />

                        <div>
                            <ItemsTable items={items} onChange={setItems} />
                            {total > 0 && (
                                <div className="mt-2.5 flex justify-end">
                                    <span className="text-sm font-bold text-forest">Total: £{total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label optional>Notes</Label>
                            <TextArea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Internal notes or additional terms…" />
                        </div>
                    </div>

                    {/* Sticky footer */}
                    <div className="px-6 py-4 space-y-3" style={{ borderTop: '1px solid #f5f0ea', background: '#faf8f5' }}>
                        <label className="flex items-center justify-between cursor-pointer select-none">
                            <div>
                                <p className="text-sm font-medium text-forest">Send to client immediately</p>
                                <p className="text-xs mt-0.5" style={{ color: '#aaa49e' }}>Client will be notified and can sign right away</p>
                            </div>
                            <Toggle checked={sendNow} onChange={setSendNow} />
                        </label>
                        <div className="flex gap-2.5">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
                                style={{ background: '#ede8e0', color: '#4A4A4A' }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={busy}
                                className="py-3 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                                style={{ flex: 2, background: '#25282D', color: '#fff' }}>
                                {busy ? 'Saving…' : sendNow ? 'Save & Send to Client' : 'Save as Draft'}
                            </button>
                        </div>
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
            onSuccess: onClose, onFinish: () => setBusy(false),
        });
    }

    function handleDelete() {
        if (!confirm('Delete this agreement?')) return;
        router.delete(route('admin.agreements.destroy', agreement.id), { onSuccess: onClose });
    }

    const items = agreement.items ?? [];
    const s = STATUS[agreement.status] ?? STATUS.draft;

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
                style={{ border: '1px solid #ede8e0' }}>

                {/* Header */}
                <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid #f5f0ea' }}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <StatusBadge status={agreement.status} />
                                {agreement.signed_at && (
                                    <span className="text-xs" style={{ color: '#aaa49e' }}>Signed {agreement.signed_at} by {agreement.signed_by_name}</span>
                                )}
                                {agreement.sent_at && agreement.status === 'sent' && (
                                    <span className="text-xs" style={{ color: '#aaa49e' }}>Sent {agreement.sent_at}</span>
                                )}
                            </div>
                            <h2 className="text-base font-bold text-forest leading-snug">{agreement.title}</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#aaa49e' }}>{agreement.project_name} · {agreement.client_name}</p>
                        </div>
                        <button onClick={onClose}
                            className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-colors hover:bg-stone-100"
                            style={{ color: '#888480' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                    {/* Meta details */}
                    {(agreement.project_address || agreement.contract_reference) && (
                        <div className="rounded-xl p-3 space-y-2" style={{ background: '#faf8f5', border: '1px solid #f0ebe3' }}>
                            {agreement.project_address && (
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="text-xs font-semibold w-24 flex-shrink-0 pt-0.5" style={{ color: '#aaa49e' }}>Address</span>
                                    <span className="text-forest">{agreement.project_address}</span>
                                </div>
                            )}
                            {agreement.contract_reference && (
                                <div className="flex items-start gap-3 text-sm">
                                    <span className="text-xs font-semibold w-24 flex-shrink-0 pt-0.5" style={{ color: '#aaa49e' }}>Reference</span>
                                    <span className="text-forest font-mono text-xs">{agreement.contract_reference}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Items */}
                    {items.length > 0 && (
                        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e8e3db' }}>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: '#faf8f5', borderBottom: '1px solid #e8e3db' }}>
                                        <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#888480' }}>Description</th>
                                        <th className="text-right px-4 py-2.5 text-xs font-semibold w-28" style={{ color: '#888480' }}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} style={{ borderTop: '1px solid #f5f0ea' }}>
                                            <td className="px-4 py-2.5 text-forest">{item.description}</td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-forest">£{Number(item.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {agreement.total_amount && (
                                <div className="flex items-center justify-between px-4 py-2.5"
                                    style={{ borderTop: '1.5px solid #e8e3db', background: '#faf8f5' }}>
                                    <span className="text-sm font-bold text-forest">Total</span>
                                    <span className="text-sm font-bold text-forest">£{Number(agreement.total_amount).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {agreement.notes && (
                        <div className="rounded-xl px-4 py-3" style={{ background: '#faf8f5', border: '1px solid #f0ebe3' }}>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: '#aaa49e' }}>Notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{agreement.notes}</p>
                        </div>
                    )}

                    {/* Signature */}
                    {agreement.signature_data && (
                        <div className="rounded-xl p-4" style={{ background: '#faf8f5', border: '1px solid #f0ebe3' }}>
                            <p className="text-xs font-semibold mb-2.5" style={{ color: '#aaa49e' }}>Client Signature</p>
                            <img src={agreement.signature_data} alt="Signature" className="max-h-16 max-w-full" />
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 flex gap-2.5" style={{ borderTop: '1px solid #f5f0ea', background: '#faf8f5' }}>
                    {agreement.status === 'draft' && (
                        <button onClick={handleSend} disabled={busy}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
                            style={{ background: '#25282D', color: '#fff' }}>
                            {busy ? 'Sending…' : 'Send to Client'}
                        </button>
                    )}
                    {agreement.status === 'signed' && (
                        <a href={route('admin.agreements.download', agreement.id)}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-center inline-flex items-center justify-center gap-2"
                            style={{ background: '#25282D', color: '#fff' }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 2v8M4 7l4 4 4-4"/><path d="M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1"/>
                            </svg>
                            Download PDF
                        </a>
                    )}
                    {agreement.status !== 'signed' && (
                        <button onClick={handleDelete}
                            className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
                            style={{ background: 'rgba(220,50,50,0.06)', color: '#b03030', border: '1px solid rgba(220,50,50,0.15)' }}>
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </ModalShell>
    );
}

// ── Document upload tab ───────────────────────────────────────────────────────

function DocumentUploadTab({ category, allDocs, projects }) {
    const fileRef = useRef(null);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [uploading, setUploading] = useState(false);
    const [deleting,  setDeleting]  = useState(null);

    const selectedProject = projects.find(p => String(p.id) === String(selectedProjectId));
    const visibleDocs = allDocs.filter(
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
            preserveScroll: true, onFinish: () => setDeleting(null),
        });
    }

    return (
        <div className="space-y-4">
            {/* Project selector */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.85)', border: '0.5px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <Label>Select Project</Label>
                <ProjectSelect projects={projects} value={selectedProjectId} onChange={setSelectedProjectId} />
            </div>

            {!selectedProjectId ? (
                <div className="glass-card rounded-xl px-5 py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: '#F1F1EF' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1CDC7" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-forest mb-1">Select a project</p>
                    <p className="text-xs" style={{ color: '#aaa49e' }}>Choose a project above to view and upload its documents.</p>
                </div>
            ) : (
                <>
                    {/* Upload zone */}
                    <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                        style={{ border: '1.5px dashed #D1CDC7', minHeight: 120 }}
                        onClick={() => !uploading && fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#25282D'; }}
                        onDragLeave={e => { e.currentTarget.style.borderColor = '#D1CDC7'; }}
                        onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#D1CDC7'; upload(e.dataTransfer.files[0]); }}>
                        {uploading ? (
                            <div className="flex items-center gap-2 text-forest">
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                </svg>
                                <span className="text-sm font-medium">Uploading…</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                    style={{ background: '#F1F1EF' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#25282D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                </div>
                                <p className="text-sm font-semibold text-forest">Click or drag to upload</p>
                                <p className="text-xs mt-1" style={{ color: '#aaa49e' }}>
                                    For <span className="font-semibold" style={{ color: '#25282D' }}>{selectedProject?.name}</span> · PDF, Word, Excel — up to 20 MB
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
                            <div className="px-4 pt-3.5 pb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold" style={{ color: '#aaa49e', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    {visibleDocs.length} file{visibleDocs.length !== 1 ? 's' : ''} · {selectedProject?.name}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ borderBottom: '0.5px solid #f0ebe3', background: '#faf8f5' }}>
                                            <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#aaa49e' }}>File</th>
                                            <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#aaa49e' }}>Size</th>
                                            <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#aaa49e' }}>Uploaded</th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#aaa49e' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleDocs.map((doc, i) => (
                                            <tr key={doc.id}
                                                style={{ borderBottom: i < visibleDocs.length - 1 ? '0.5px solid #faf8f5' : 'none' }}
                                                className="hover:bg-stone-50 transition-colors">
                                                <td className="px-4 py-3 min-w-0">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <FileIcon mimeType={doc.mime_type} size={32} />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-forest truncate" title={doc.original_name}>{doc.original_name}</p>
                                                            <p className="sm:hidden text-xs mt-0.5" style={{ color: '#aaa49e' }}>{doc.file_size ? formatBytes(doc.file_size) : ''}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 py-3 text-xs" style={{ color: '#aaa49e' }}>{doc.file_size ? formatBytes(doc.file_size) : '—'}</td>
                                                <td className="hidden sm:table-cell px-4 py-3 text-xs" style={{ color: '#aaa49e' }}>{doc.uploaded_at}</td>
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
                                                        <button onClick={() => deleteDoc(doc.id)} disabled={deleting === doc.id}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50 hover:opacity-75"
                                                            style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.2)' }}>
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
                                <p className="text-sm font-medium text-forest mb-1">No files yet</p>
                                <p className="text-xs" style={{ color: '#aaa49e' }}>Upload documents for {selectedProject?.name} using the area above.</p>
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}

// ── Variation Agreements tab ──────────────────────────────────────────────────

function StatCard({ label, value, color }) {
    return (
        <div className="flex-1 rounded-xl px-4 py-3 flex flex-col gap-1" style={{ background: '#fff', border: '0.5px solid #e8e3db' }}>
            <span className="text-2xl font-bold" style={{ color: color ?? '#25282D' }}>{value}</span>
            <span className="text-xs font-medium" style={{ color: '#aaa49e' }}>{label}</span>
        </div>
    );
}

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

            {/* Stats + action row */}
            <div className="flex items-center gap-3 mb-5">
                <StatCard label="Draft" value={draft} />
                <StatCard label="Pending Signature" value={sent} color="#9a7020" />
                <StatCard label="Signed" value={signed} color="#1a6030" />
                <button onClick={() => setShowCreate(true)}
                    className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                    style={{ background: '#25282D', color: '#fff' }}>
                    + New Agreement
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #e8e3db' }}>
                {agreements.length === 0 ? (
                    <div className="px-6 py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D1CDC7" strokeWidth="1.5">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-forest mb-1">No agreements yet</p>
                        <p className="text-xs" style={{ color: '#aaa49e' }}>Click "New Agreement" to create your first one.</p>
                    </div>
                ) : (
                    <div className="divide-y" style={{ borderColor: '#faf8f5' }}>
                        {agreements.map(a => (
                            <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors group">
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: '#F1F1EF' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#888480" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14,2 14,8 20,8"/>
                                    </svg>
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-forest truncate">{a.title}</p>
                                    <p className="text-xs mt-0.5 truncate" style={{ color: '#aaa49e' }}>
                                        {a.project_name} · {a.client_name} · {a.created_at}
                                    </p>
                                </div>
                                {/* Right side */}
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    {a.total_amount && (
                                        <span className="text-sm font-semibold text-forest hidden md:inline">
                                            £{Number(a.total_amount).toLocaleString()}
                                        </span>
                                    )}
                                    <StatusBadge status={a.status} />
                                    <button onClick={() => setViewing(a)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                        style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                                        Open
                                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                            <polyline points="5,3 11,8 5,13"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
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
                    <p className="text-sm mt-0.5" style={{ color: '#aaa49e' }}>Manage variation agreements and project documents</p>
                </div>
                <TabBar active={tab} onChange={setTab} />
                {tab === 'Variation Agreements' && (
                    <VariationAgreementsTab agreements={agreements} projects={projects} variations={variations} />
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
