import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalShell from '@/Components/ModalShell';
import { router, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

// ── Status configs ─────────────────────────────────────────────────────────────

const AGREEMENT_STATUS = {
    pending_signature: { label: 'Awaiting Signature', bg: 'rgba(201,168,76,0.10)', border: '#c9a84c', text: '#a07a20' },
    signed:            { label: 'Signed',             bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a', text: '#1a6030' },
    declined:          { label: 'Sig. Declined',      bg: 'rgba(200,40,40,0.07)',  border: '#e07070', text: '#b03030' },
};

const STATUS = {
    pending:  { label: 'Under review', bg: 'rgba(201,168,76,0.10)', border: '#25282D', text: '#a07a20' },
    approved: { label: 'Approved',     bg: 'rgba(26,96,46,0.08)',   border: '#4a9a6a', text: '#1a6030' },
    rejected: { label: 'Declined',     bg: 'rgba(200,40,40,0.07)',  border: '#e07070', text: '#b03030' },
};

function AgreementBadge({ status }) {
    const s = AGREEMENT_STATUS[status];
    if (!s) return null;
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
            {s.label}
        </span>
    );
}

function SourceBadge({ source }) {
    const isAdmin = source === 'admin';
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
            style={isAdmin
                ? { background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: '#6d28d9' }
                : { background: 'rgba(34,197,94,0.07)',  border: '1px solid rgba(34,197,94,0.25)',  color: '#15803d' }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: isAdmin ? '#8b5cf6' : '#22c55e' }} />
            {isAdmin ? 'Admin' : 'Client'}
        </span>
    );
}

// ── ProjectSelect (fixed-position dropdown, same as Agreements page) ───────────

function ProjectSelect({ projects, value, onChange, placeholder = '— Select project —' }) {
    const [open, setOpen]       = useState(false);
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef(null);
    const wrapRef    = useRef(null);

    function recalc() {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        setDropPos({ top: rect.bottom, left: rect.left, width: rect.width });
    }

    useEffect(() => {
        function handler(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!open) return;
        window.addEventListener('scroll', recalc, true);
        window.addEventListener('resize', recalc);
        return () => {
            window.removeEventListener('scroll', recalc, true);
            window.removeEventListener('resize', recalc);
        };
    }, [open]);

    function handleOpen() {
        if (open) { setOpen(false); return; }
        recalc();
        setOpen(true);
    }

    const selected = projects.find(p => String(p.id) === String(value));

    return (
        <div ref={wrapRef} style={{ position: 'relative' }}>
            <button ref={triggerRef} type="button" onClick={handleOpen}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-left transition-all"
                style={{ background: '#F1F1EF', border: `1.5px solid ${open ? '#25282D' : '#D1CDC7'}` }}>
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
                <div className="fixed z-[9999] rounded-xl overflow-hidden"
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
                                <span className="text-sm font-medium text-forest"
                                    style={{ marginLeft: String(p.id) === String(value) ? 0 : 18 }}>
                                    {p.name}
                                </span>
                            </button>
                        ))
                    }
                </div>
            )}
        </div>
    );
}

// ── Create Modal ───────────────────────────────────────────────────────────────

function CreateModal({ show, projects, onClose }) {
    const form = useForm({
        project_id:    '',
        staff_member:  '',
        site_location: '',
        description:   '',
    });

    const selectedProject = projects.find(p => String(p.id) === String(form.data.project_id));

    function submit(e) {
        e.preventDefault();
        form.post(route('admin.variations.store'), {
            preserveScroll: true,
            onSuccess: () => { onClose(); form.reset(); },
        });
    }

    function handleClose() { onClose(); form.reset(); }

    const inputStyle = {
        background: '#F1F1EF', border: '1.5px solid #D1CDC7',
        borderRadius: 12, color: '#25282D',
    };

    return (
        <ModalShell show={show} onClose={handleClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '90vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Submit Variation</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                            Submitted on behalf of client
                        </p>
                    </div>
                    <button onClick={handleClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

                    {/* Project */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Project
                        </label>
                        <ProjectSelect
                            projects={projects}
                            value={form.data.project_id}
                            onChange={v => form.setData('project_id', v)}
                        />
                        {form.errors.project_id && <p className="mt-1 text-xs text-red-600">{form.errors.project_id}</p>}
                        {selectedProject && (
                            <p className="mt-1.5 text-xs" style={{ color: '#888480' }}>
                                Client: <span className="font-medium text-forest">{selectedProject.client_name}</span>
                            </p>
                        )}
                    </div>

                    {/* Staff member */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Staff Member
                        </label>
                        <input
                            value={form.data.staff_member}
                            onChange={e => form.setData('staff_member', e.target.value)}
                            placeholder="Name of staff member on site"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
                        />
                        {form.errors.staff_member && <p className="mt-1 text-xs text-red-600">{form.errors.staff_member}</p>}
                    </div>

                    {/* Site location */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Site Location
                        </label>
                        <input
                            value={form.data.site_location}
                            onChange={e => form.setData('site_location', e.target.value)}
                            placeholder="Area or location on site"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
                        />
                        {form.errors.site_location && <p className="mt-1 text-xs text-red-600">{form.errors.site_location}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                            Description
                        </label>
                        <textarea
                            rows={5}
                            value={form.data.description}
                            onChange={e => form.setData('description', e.target.value)}
                            placeholder="Describe the variation work required…"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                            style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
                        />
                        {form.errors.description && <p className="mt-1 text-xs text-red-600">{form.errors.description}</p>}
                    </div>

                    <p className="text-xs pb-1" style={{ color: '#888480' }}>
                        The client will be notified and the variation will appear in their portal.
                    </p>

                    <div className="flex gap-2.5 pt-1">
                        <button type="button" onClick={handleClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={form.processing}
                            className="py-3.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
                            style={{ flex: 2, background: '#25282D', color: '#fff' }}>
                            {form.processing ? 'Submitting…' : 'Submit Variation'}
                        </button>
                    </div>
                </form>
            </div>
        </ModalShell>
    );
}

// ── Review Modal ───────────────────────────────────────────────────────────────

function ReviewModal({ show, variation, onClose }) {
    const [status, setStatus] = useState(variation.status === 'pending' ? '' : variation.status);
    const [notes,  setNotes]  = useState(variation.admin_notes ?? '');
    const [busy,   setBusy]   = useState(false);

    const isPending = variation.status === 'pending';

    function submit(e) {
        e.preventDefault();
        if (!status) return;
        setBusy(true);
        router.put(route('admin.variations.review', variation.id),
            { status, admin_notes: notes },
            { onSuccess: () => onClose(), onFinish: () => setBusy(false) }
        );
    }

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '90vh' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Variation Request</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                            {variation.project_name} · {variation.submitted_by}
                            {variation.source === 'admin' && <span style={{ color: '#6d28d9' }}> (via admin)</span>}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    {/* Details */}
                    <div>
                        <p className="text-base font-bold text-forest mb-1">{variation.title}</p>
                        <p className="text-xs mb-3" style={{ color: '#888480' }}>Submitted {variation.submitted_at}</p>
                        <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>{variation.description}</p>
                    </div>

                    {/* Staff / location meta */}
                    {(variation.staff_member || variation.site_location) && (
                        <div className="grid grid-cols-2 gap-2">
                            {variation.staff_member && (
                                <div className="px-3 py-2 rounded-xl" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#888480' }}>Staff Member</p>
                                    <p className="text-sm text-forest">{variation.staff_member}</p>
                                </div>
                            )}
                            {variation.site_location && (
                                <div className="px-3 py-2 rounded-xl" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                                    <p className="text-xs font-semibold mb-0.5" style={{ color: '#888480' }}>Site Location</p>
                                    <p className="text-sm text-forest">{variation.site_location}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {variation.estimated_cost && (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                            style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <span className="text-xs font-semibold" style={{ color: '#888480' }}>Estimated cost</span>
                            <span className="text-sm font-bold text-forest ml-auto">£{Number(variation.estimated_cost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Current status (if already reviewed) */}
                    {!isPending && variation.admin_notes && (
                        <div className="px-3 py-2.5 rounded-xl" style={{ background: '#F1F1EF', border: '1px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#888480' }}>Admin notes</p>
                            <p className="text-sm" style={{ color: '#4a3f30' }}>{variation.admin_notes}</p>
                        </div>
                    )}

                    {/* Decision form */}
                    <form onSubmit={submit} className="space-y-3 pt-1">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#4A4A4A' }}>
                                Decision
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['approved', 'rejected'].map(val => {
                                    const isSelected = status === val;
                                    const isDisabled = !isPending && !isSelected;
                                    return (
                                        <button key={val} type="button"
                                            onClick={() => !isDisabled && setStatus(val)}
                                            disabled={isDisabled}
                                            className="py-3 rounded-xl text-sm font-semibold transition-all"
                                            style={isDisabled
                                                ? { background: '#f0ece6', color: '#c4b8a8', border: '1.5px solid #D1CDC7', cursor: 'not-allowed', opacity: 0.55 }
                                                : isSelected
                                                    ? val === 'approved'
                                                        ? { background: '#25282D', color: '#fff', border: '1.5px solid #25282D' }
                                                        : { background: '#7f1d1d', color: '#fca5a5', border: '1.5px solid #7f1d1d' }
                                                    : { background: '#F1F1EF', color: '#4A4A4A', border: '1.5px solid #D1CDC7' }
                                            }>
                                            {val === 'approved' ? 'Approve' : 'Decline'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#4A4A4A' }}>
                                Notes to client <span style={{ color: '#888480', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                            </label>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                                placeholder="Reason for decision, next steps…"
                                className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                                style={{ background: '#F1F1EF', border: '1.5px solid #D1CDC7' }}
                                onFocus={e => e.target.style.borderColor = '#25282D'}
                                onBlur={e => e.target.style.borderColor = '#D1CDC7'}
                            />
                        </div>


                        <div className="flex gap-2.5 pt-1 pb-1">
                            <button type="button" onClick={onClose}
                                className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                                style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={busy || !status}
                                className="py-3.5 rounded-xl text-sm font-semibold transition-opacity"
                                style={{
                                    flex: 2,
                                    background: !status || busy ? '#a0b8a8' : '#25282D',
                                    color: '#FFFFFF',
                                    cursor: !status || busy ? 'not-allowed' : 'pointer',
                                }}>
                                {busy ? 'Saving…' : 'Save Decision'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </ModalShell>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VariationsIndex({ variations, projects }) {
    const [reviewing,   setReviewing]   = useState(null);
    const [showCreate,  setShowCreate]  = useState(false);

    const pending  = variations.filter(v => v.status === 'pending').length;
    const approved = variations.filter(v => v.status === 'approved').length;
    const rejected = variations.filter(v => v.status === 'rejected').length;

    return (
        <AuthenticatedLayout title="Variations" breadcrumb="All variation requests">

            {reviewing && (
                <ReviewModal show variation={reviewing} onClose={() => setReviewing(null)} />
            )}

            <CreateModal show={showCreate} projects={projects} onClose={() => setShowCreate(false)} />

            <div className="w-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-xl font-semibold text-forest">Variation Requests</h1>
                        <p className="text-sm mt-0.5" style={{ color: '#888480' }}>
                            {variations.length} total · {pending} pending · {approved} approved · {rejected} declined
                        </p>
                    </div>
                    <button onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-opacity hover:opacity-80"
                        style={{ background: '#25282D', color: '#fff' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
                        </svg>
                        Submit Variation
                    </button>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #D1CDC7' }}>
                    {variations.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                                style={{ background: '#F1F1EF' }}>
                                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-forest mb-1">No variation requests</p>
                            <p className="text-xs" style={{ color: '#888480' }}>Requests submitted by clients or admins will appear here.</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Table header (desktop) ── */}
                            <div className="hidden sm:grid px-4 sm:px-6 py-2.5"
                                style={{
                                    gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr) minmax(0,2fr) 80px minmax(0,2fr) minmax(0,1.5fr)',
                                    background: '#faf8f5',
                                    borderBottom: '0.5px solid #e8e3db',
                                }}>
                                {['Variation', 'Project', 'Submitted by', 'Source', 'Status', 'Action'].map(h => (
                                    <span key={h} className="text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: '#888480', fontSize: 10 }}>{h}</span>
                                ))}
                            </div>

                            <ul>
                                {variations.map((v, i) => (
                                    <li key={v.id}
                                        className="px-4 sm:px-6 py-4"
                                        style={{ borderTop: i === 0 ? 'none' : '0.5px solid #f0ebe3' }}>

                                        {/* Mobile layout */}
                                        <div className="flex flex-col sm:hidden gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-forest">{v.title}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                                                        {v.project_name} · {v.submitted_at}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs" style={{ color: '#4A4A4A' }}>
                                                    By: <span className="font-medium">{v.submitted_by ?? '—'}</span>
                                                </span>
                                                <SourceBadge source={v.source} />
                                                <StatusBadge status={v.status} />
                                                <AgreementBadge status={v.agreement_status} />
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {v.status === 'approved' && (
                                                    <a href={route('admin.agreements.index') + `?type=variation_agreement&variation_id=${v.id}`}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                                        style={{ background: 'rgba(201,168,76,0.10)', color: '#a07a20', border: '1px solid #c9a84c' }}>
                                                        + Agreement
                                                    </a>
                                                )}
                                                <button onClick={() => setReviewing(v)}
                                                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold"
                                                    style={{ background: v.status === 'pending' ? '#25282D' : '#F1F1EF', color: v.status === 'pending' ? '#fff' : '#4A4A4A' }}>
                                                    {v.status === 'pending' ? 'Review' : 'View'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Desktop layout */}
                                        <div className="hidden sm:grid items-center gap-3"
                                            style={{ gridTemplateColumns: 'minmax(0,3fr) minmax(0,2fr) minmax(0,2fr) 80px minmax(0,2fr) minmax(0,1.5fr)' }}>

                                            {/* Variation */}
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-forest truncate">{v.title}</p>
                                                <p className="text-xs mt-0.5 truncate" style={{ color: '#888480' }}>
                                                    Submitted {v.submitted_at}
                                                </p>
                                            </div>

                                            {/* Project */}
                                            <div className="text-sm text-forest truncate">
                                                {v.project_name ?? '—'}
                                            </div>

                                            {/* Submitted by */}
                                            <div className="text-sm truncate" style={{ color: '#4A4A4A' }}>
                                                {v.submitted_by ?? '—'}
                                            </div>

                                            {/* Source */}
                                            <div><SourceBadge source={v.source} /></div>

                                            {/* Status */}
                                            <div className="flex flex-wrap gap-1 items-center">
                                                <StatusBadge status={v.status} />
                                                {v.agreement_status && <AgreementBadge status={v.agreement_status} />}
                                            </div>

                                            {/* Action */}
                                            <div className="flex flex-wrap gap-1.5 items-center">
                                                <button onClick={() => setReviewing(v)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-opacity"
                                                    style={{ background: v.status === 'pending' ? '#25282D' : '#F1F1EF', color: v.status === 'pending' ? '#fff' : '#4A4A4A' }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                                    {v.status === 'pending' ? 'Review' : 'View'}
                                                </button>
                                                {v.status === 'approved' && (
                                                    <a href={route('admin.agreements.index') + `?type=variation_agreement&variation_id=${v.id}`}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap"
                                                        style={{ background: 'rgba(201,168,76,0.10)', color: '#a07a20', border: '1px solid #c9a84c' }}>
                                                        + Agreement
                                                    </a>
                                                )}
                                            </div>
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
