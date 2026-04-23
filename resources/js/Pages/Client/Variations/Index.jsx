import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ModalShell from '@/Components/ModalShell';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

// ── Parse variation fields (handles old concatenated format) ──────────────────

function parseVariation(v) {
    if (v.staff_member || v.site_location) {
        return { description: v.description, staffMember: v.staff_member, siteLocation: v.site_location };
    }
    const raw = v.description ?? '';
    const staffMatch = raw.match(/Staff Member:\s*([^\n]+)/);
    const locMatch   = raw.match(/Site Location:\s*([^\n]+)/);
    const desc = raw.replace(/\n\n(Staff Member:|Site Location:)[^\n]*/g, '').trim();
    return {
        description:  desc || raw,
        staffMember:  staffMatch?.[1]?.trim() ?? null,
        siteLocation: locMatch?.[1]?.trim()   ?? null,
    };
}

function isImage(url) {
    return /\.(jpg|jpeg|png|gif)(\?|$)/i.test(url);
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS = {
    pending:  { label: 'Under review', dot: '#25282D', bg: 'rgba(201,168,76,0.10)', color: '#9a7520' },
    approved: { label: 'Approved',     dot: '#22c55e', bg: 'rgba(34,197,94,0.09)',  color: '#15803d' },
    rejected: { label: 'Declined',     dot: '#ef4444', bg: 'rgba(239,68,68,0.09)',  color: '#b91c1c' },
};

function StatusBadge({ status }) {
    const s = STATUS[status] ?? STATUS.pending;
    return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ background: s.bg, color: s.color }}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            {s.label}
        </span>
    );
}

// ── Detail modal ──────────────────────────────────────────────────────────────

function DetailModal({ show, variation, onClose }) {

    const s = STATUS[variation.status] ?? STATUS.pending;
    const { description, staffMember, siteLocation } = parseVariation(variation);
    const photos = variation.photos ?? [];

    return (
        <ModalShell show={show} onClose={onClose} position="bottom">
            <div className="w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
                style={{ maxHeight: '88vh', border: '0.5px solid #D1CDC7' }}>

                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#d0c8bc' }} />
                </div>

                <div className="flex items-start justify-between px-5 pt-4 pb-3 flex-shrink-0"
                    style={{ borderBottom: '0.5px solid #f0ebe3' }}>
                    <div className="min-w-0 flex-1 pr-4">
                        <p className="text-base font-semibold text-forest leading-snug">{variation.title}</p>
                        <p className="text-xs mt-1" style={{ color: '#888480' }}>
                            Submitted {variation.submitted_at}
                            {variation.project_name && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full font-medium"
                                    style={{ background: 'rgba(26,60,46,0.07)', color: '#25282D' }}>
                                    {variation.project_name}
                                </span>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{ background: '#F1F1EF', color: '#888480' }}>
                        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                    <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: s.bg }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
                        <p className="text-sm font-semibold" style={{ color: s.color }}>{s.label}</p>
                    </div>

                    <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid #E8E4DF' }}>
                        {staffMember && (
                            <div className="flex gap-3 px-4 py-3" style={{ borderBottom: '0.5px solid #F1F1EF' }}>
                                <span className="text-xs font-semibold w-32 flex-shrink-0 pt-0.5" style={{ color: '#888480' }}>Staff Member</span>
                                <span className="text-sm" style={{ color: '#25282D' }}>{staffMember}</span>
                            </div>
                        )}
                        {siteLocation && (
                            <div className="flex gap-3 px-4 py-3" style={{ borderBottom: '0.5px solid #F1F1EF' }}>
                                <span className="text-xs font-semibold w-32 flex-shrink-0 pt-0.5" style={{ color: '#888480' }}>Site Location</span>
                                <span className="text-sm" style={{ color: '#25282D' }}>{siteLocation}</span>
                            </div>
                        )}
                        {description && (
                            <div className="flex gap-3 px-4 py-3" style={{ borderBottom: photos.length ? '0.5px solid #F1F1EF' : 'none' }}>
                                <span className="text-xs font-semibold w-32 flex-shrink-0 pt-0.5" style={{ color: '#888480' }}>Description</span>
                                <span className="text-sm leading-relaxed" style={{ color: '#25282D' }}>{description}</span>
                            </div>
                        )}
                        {photos.length > 0 && (
                            <div className="flex gap-3 px-4 py-3">
                                <span className="text-xs font-semibold w-32 flex-shrink-0 pt-0.5" style={{ color: '#888480' }}>Photos</span>
                                <div className="flex flex-wrap gap-2">
                                    {photos.map((url, i) => (
                                        isImage(url) ? (
                                            <a key={i} href={url} target="_blank" rel="noreferrer">
                                                <img src={url} alt={`Photo ${i + 1}`}
                                                    className="w-16 h-16 object-cover rounded-lg"
                                                    style={{ border: '0.5px solid #D1CDC7' }} />
                                            </a>
                                        ) : (
                                            <a key={i} href={url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                                style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z"/>
                                                    <polyline points="9,2 9,6 13,6"/>
                                                </svg>
                                                File {i + 1}
                                            </a>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {variation.estimated_cost && (
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                            <span className="text-xs font-semibold" style={{ color: '#888480' }}>Estimated cost</span>
                            <span className="text-sm font-bold text-forest">
                                ${Number(variation.estimated_cost).toLocaleString()}
                            </span>
                        </div>
                    )}

                    {variation.admin_notes && (
                        <div className="px-4 py-3 rounded-xl" style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                            <p className="text-xs font-semibold mb-1.5" style={{ color: '#888480' }}>Notes from BGR</p>
                            <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>{variation.admin_notes}</p>
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '0.5px solid #f0ebe3' }}>
                    <button onClick={onClose}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}>
                        Close
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message = 'Request submitted successfully', onDismiss }) {
    useEffect(() => {
        const t = setTimeout(onDismiss, 4000);
        return () => clearTimeout(t);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-6 left-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl"
            style={{
                transform: 'translateX(-50%)',
                background: '#25282D',
                border: '0.5px solid rgba(255,255,255,0.1)',
                minWidth: 240,
                animation: 'fadeSlideUp 0.25s ease',
            }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(178,148,91,0.2)' }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#B2945B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3,8 7,12 13,4"/>
                </svg>
            </div>
            <span className="text-sm font-semibold text-white">{message}</span>
            <button onClick={onDismiss} className="ml-auto flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                </svg>
            </button>
            <style>{`@keyframes fadeSlideUp { from { opacity:0; transform:translateX(-50%) translateY(12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
        </div>
    );
}

// ── Request Form Modal (create + edit) ────────────────────────────────────────

function VariationModal({ show, projects, user, editing, onClose, onSuccess }) {
    const isEdit = !!editing;
    const today  = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const fileRef = useRef(null);

    // Parse stored data — handles both new (separate columns) and old (concatenated) records
    const parsed = editing ? parseVariation(editing) : null;

    // Existing uploaded photos (URLs) — only relevant when editing
    const [existingPhotos, setExistingPhotos] = useState(editing?.photos ?? []);

    const { data, setData, post, processing, errors, reset } = useForm({
        project_id:      isEdit ? String(editing.project_id) : (projects.length === 1 ? String(projects[0].id) : ''),
        staff_member:    parsed?.staffMember  ?? '',
        site_location:   parsed?.siteLocation ?? '',
        description:     parsed?.description  ?? '',
        photos:          [],
        existing_photos: editing?.photos ?? [],
    });

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    useEffect(() => {
        const h = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [onClose]);

    function handleFiles(files) {
        const arr = Array.from(files);
        setData('photos', [...(data.photos ?? []), ...arr]);
    }

    function removeNewPhoto(index) {
        const updated = data.photos.filter((_, i) => i !== index);
        setData('photos', updated);
    }

    function removeExistingPhoto(url) {
        const updated = existingPhotos.filter(u => u !== url);
        setExistingPhotos(updated);
        setData('existing_photos', updated);
    }

    function handleDrop(e) {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    }

    function submit(e) {
        e.preventDefault();
        const opts = {
            forceFormData: true,
            onSuccess: () => { reset(); onClose(); onSuccess(isEdit ? 'updated' : 'submitted'); },
        };
        if (isEdit) {
            post(route('client.variations.update', editing.id), opts);
        } else {
            post(route('client.variations.store'), opts);
        }
    }

    const inp     = "w-full px-3 py-2.5 rounded-lg text-sm border outline-none transition-colors";
    const inpSty  = { borderColor: '#D1CDC7', color: '#25282D' };
    const roSty   = { borderColor: '#E8E4DF', background: '#F8F7F5', color: '#4A4A4A' };
    const lbl     = "block text-sm font-semibold mb-1.5";
    const lblC    = { color: '#25282D' };
    const errC    = { color: '#ef4444' };

    const allPhotosCount = existingPhotos.length + (data.photos?.length ?? 0);

    return (
        <ModalShell show={show} onClose={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-y-auto"
                style={{ border: '0.5px solid #D1CDC7', maxHeight: '92vh' }}>

                    {/* Header */}
                    <div className="relative flex items-center justify-center px-6 py-4"
                        style={{ borderBottom: '1px solid #E8E4DF' }}>
                        <h2 className="text-base font-bold" style={{ color: '#25282D' }}>
                            {isEdit ? 'Edit Change Request' : 'Client Change Request Form'}
                        </h2>
                        <button onClick={onClose}
                            className="absolute right-4 w-7 h-7 flex items-center justify-center rounded-full"
                            style={{ background: '#F1F1EF', color: '#888480' }}>
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={submit} className="px-6 py-5 space-y-6 max-h-[80vh] overflow-y-auto">

                        {/* ── Section 1: Client & Project Details ── */}
                        <div>
                            <p className="text-sm font-bold mb-4" style={{ color: '#25282D' }}>
                                Client &amp; Project Details
                            </p>

                            {projects.length > 1 && (
                                <div className="mb-4">
                                    <label className={lbl} style={lblC}>Select Project *</label>
                                    <select value={data.project_id} onChange={e => setData('project_id', e.target.value)}
                                        className={inp} style={inpSty}>
                                        <option value="">Choose a project…</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    {errors.project_id && <p className="text-xs mt-1" style={errC}>{errors.project_id}</p>}
                                </div>
                            )}

                            {/* Row 1: Client Name | Staff Member */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={lbl} style={lblC}>Client Name *</label>
                                    <input type="text" value={user.name} readOnly className={inp} style={roSty} />
                                </div>
                                <div>
                                    <label className={lbl} style={lblC}>Staff Member Recording Request: *</label>
                                    <input type="text" value={data.staff_member}
                                        onChange={e => setData('staff_member', e.target.value)}
                                        placeholder="Staff member name" className={inp} style={inpSty} />
                                    {errors.staff_member && <p className="text-xs mt-1" style={errC}>{errors.staff_member}</p>}
                                </div>
                            </div>

                            {/* Row 2: Site Location | Date of Request */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={lbl} style={lblC}>Project Address/Site Location *</label>
                                    <input type="text" value={data.site_location}
                                        onChange={e => setData('site_location', e.target.value)}
                                        placeholder="Enter site address" className={inp} style={inpSty} />
                                    {errors.site_location && <p className="text-xs mt-1" style={errC}>{errors.site_location}</p>}
                                </div>
                                <div>
                                    <label className={lbl} style={lblC}>Date of Request *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#888480' }}>
                                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                                <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
                                                <line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/>
                                                <line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/>
                                            </svg>
                                        </span>
                                        <input type="text" value={today} readOnly
                                            className={inp} style={{ ...roSty, paddingLeft: '2rem' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Section 2: Details of Requested Work ── */}
                        <div>
                            <p className="text-sm font-bold mb-4" style={{ color: '#25282D' }}>
                                Details of Requested Work
                            </p>

                            {/* Photo upload zone */}
                            <div className="mb-4">
                                <label className="block text-sm mb-1.5" style={{ color: '#25282D' }}>
                                    Photos (if applicable):
                                </label>

                                {/* Drop zone */}
                                <div
                                    className="rounded-lg border-2 border-dashed py-6 text-center cursor-pointer transition-colors"
                                    style={{ borderColor: '#D1CDC7' }}
                                    onClick={() => fileRef.current?.click()}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleDrop}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#25282D'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#D1CDC7'}>
                                    <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                        stroke="#888480" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="16 16 12 12 8 16"/>
                                        <line x1="12" y1="12" x2="12" y2="21"/>
                                        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                                    </svg>
                                    <p className="text-xs font-medium mb-0.5" style={{ color: '#25282D' }}>
                                        Click to upload or drag &amp; drop
                                    </p>
                                    <p className="text-xs" style={{ color: '#888480' }}>
                                        PDF, DOC/DOCX, XLS/CSV, JPG/JPEG, PNG, GIF — max 10MB each
                                    </p>
                                    <input ref={fileRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.csv,.jpg,.jpeg,.png,.gif"
                                        className="hidden"
                                        onChange={e => handleFiles(e.target.files)} />
                                </div>

                                {/* File chips */}
                                {allPhotosCount > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {/* Existing photos (when editing) */}
                                        {existingPhotos.map((url, i) => (
                                            <div key={`ex-${i}`}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                                style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7', color: '#25282D' }}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                                    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z"/>
                                                    <polyline points="9,2 9,6 13,6"/>
                                                </svg>
                                                <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                                                    File {i + 1}
                                                </a>
                                                <button type="button" onClick={() => removeExistingPhoto(url)}
                                                    className="ml-0.5" style={{ color: '#888480' }}>
                                                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                        <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                        {/* New files */}
                                        {(data.photos ?? []).map((file, i) => (
                                            <div key={`new-${i}`}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
                                                style={{ background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.4)', color: '#25282D' }}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round">
                                                    <path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6z"/>
                                                    <polyline points="9,2 9,6 13,6"/>
                                                </svg>
                                                <span className="max-w-[120px] truncate">{file.name}</span>
                                                <button type="button" onClick={() => removeNewPhoto(i)}
                                                    className="ml-0.5" style={{ color: '#888480' }}>
                                                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                        <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {errors['photos.0'] && <p className="text-xs mt-1" style={errC}>{errors['photos.0']}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className={lbl} style={lblC}>Description of Change or Extra Work Requested *</label>
                                <textarea value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={4} placeholder="Describe the change or additional work requested…"
                                    className={inp} style={{ ...inpSty, resize: 'vertical' }} />
                                {errors.description && <p className="text-xs mt-1" style={errC}>{errors.description}</p>}
                            </div>
                        </div>

                        {/* ── Section 3: Client Agreement ── */}
                        <div>
                            <p className="text-sm font-bold mb-3" style={{ color: '#C9A84C' }}>Client Agreement</p>

                            <div className="text-sm mb-5 leading-relaxed" style={{ color: '#4a3f30' }}>
                                <p className="mb-2">
                                    I confirm that I have requested the above changes, upgrades, or additional works,
                                    which were <strong>not included in the original quotation or invoice.</strong>
                                </p>
                                <p className="mb-2">I understand that:</p>
                                <ol className="list-decimal ml-5 space-y-1">
                                    <li style={{ color: '#C9A84C' }}><span style={{ color: '#4a3f30' }}>The final cost for these works will be provided by the office.</span></li>
                                    <li style={{ color: '#C9A84C' }}><span style={{ color: '#4a3f30' }}>No additional work will proceed until I confirm acceptance of the cost.</span></li>
                                    <li style={{ color: '#C9A84C' }}><span style={{ color: '#4a3f30' }}>This signed form serves as my authorization for the office to prepare a revised invoice if I approve the quoted amount.</span></li>
                                </ol>
                            </div>

                            {/* Row 3: Full Name | Email */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={lbl} style={lblC}>Full Name</label>
                                    <input type="text" value={user.name} readOnly className={inp} style={roSty} />
                                </div>
                                <div>
                                    <label className={lbl} style={lblC}>Email *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#888480' }}>
                                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                                <rect x="1" y="3" width="14" height="10" rx="1.5"/>
                                                <polyline points="1,3 8,9 15,3"/>
                                            </svg>
                                        </span>
                                        <input type="email" value={user.email} readOnly
                                            className={inp} style={{ ...roSty, paddingLeft: '2rem' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Date Signed */}
                            <div className="w-1/2">
                                <label className={lbl} style={lblC}>Date Signed *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#888480' }}>
                                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                                            <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
                                            <line x1="5" y1="1" x2="5" y2="4"/><line x1="11" y1="1" x2="11" y2="4"/>
                                            <line x1="1.5" y1="6.5" x2="14.5" y2="6.5"/>
                                        </svg>
                                    </span>
                                    <input type="text" value={today} readOnly
                                        className={inp} style={{ ...roSty, paddingLeft: '2rem' }} />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" disabled={processing}
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ background: '#25282D', color: '#fff', opacity: processing ? 0.65 : 1 }}>
                            {processing ? (isEdit ? 'Saving…' : 'Submitting…') : (isEdit ? 'Save Changes' : 'Submit')}
                        </button>
                    </form>
                </div>
        </ModalShell>
    );
}

// ── Variation row ─────────────────────────────────────────────────────────────

function VariationRow({ variation, onView, onEdit, isLast }) {
    return (
        <div className="flex items-center gap-4 px-5 py-4"
            style={{ borderBottom: isLast ? 'none' : '0.5px solid #F1F1EF' }}>

            {/* Icon */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: STATUS[variation.status]?.bg ?? 'rgba(201,168,76,0.10)' }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"
                    stroke={STATUS[variation.status]?.dot ?? '#25282D'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                </svg>
            </div>

            {/* Info — clickable to view detail */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onView(variation)}>
                <p className="text-sm font-semibold text-forest truncate leading-snug">{variation.title}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: '#888480' }}>
                    Submitted {variation.submitted_at}
                    {variation.project_name && <span className="ml-1">· {variation.project_name}</span>}
                </p>
            </div>

            {/* Status + actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={variation.status} />

                {/* Edit button — only for pending */}
                {variation.status === 'pending' && (
                    <button onClick={() => onEdit(variation)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                        style={{ background: '#F1F1EF', color: '#4A4A4A' }}
                        title="Edit request"
                        onMouseEnter={e => e.currentTarget.style.background = '#E8E4DF'}
                        onMouseLeave={e => e.currentTarget.style.background = '#F1F1EF'}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                        </svg>
                    </button>
                )}

                <button onClick={() => onView(variation)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                    style={{ color: '#c4b8a8' }}>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="6,3 11,8 6,13"/>
                    </svg>
                </button>
            </div>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VariationsIndex({ variations, projects }) {
    const { auth } = usePage().props;
    const [viewing,  setViewing]  = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editing,  setEditing]  = useState(null);
    const [toast,    setToast]    = useState(null);

    const pending = variations.filter(v => v.status === 'pending').length;

    function openEdit(variation) {
        setEditing(variation);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditing(null);
    }

    return (
        <AuthenticatedLayout title="Variations" breadcrumb="Change requests for your project">
            <Head title="Variations" />

            {viewing && <DetailModal show variation={viewing} onClose={() => setViewing(null)} />}

            {showForm && (
                <VariationModal
                    show
                    projects={projects}
                    user={auth.user}
                    editing={editing}
                    onClose={closeForm}
                    onSuccess={(type) => { setToast(type); closeForm(); }}
                />
            )}

            {toast && (
                <Toast
                    message={toast === 'updated' ? 'Request updated successfully' : 'Request submitted successfully'}
                    onDismiss={() => setToast(null)}
                />
            )}

            {/* Pending notice */}
            {pending > 0 && (
                <div className="mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(26,26,26,0.04), rgba(201,168,76,0.04))',
                        border: '0.5px solid rgba(201,168,76,0.35)',
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(26,26,26,0.05)' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2" strokeLinecap="round">
                            <circle cx="8" cy="8" r="6.5"/>
                            <line x1="8" y1="5" x2="8" y2="8"/>
                            <circle cx="8" cy="11" r="0.5" fill="#25282D"/>
                        </svg>
                    </div>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                        <span className="font-semibold" style={{ color: '#25282D' }}>
                            {pending} request{pending !== 1 ? 's' : ''} under review.
                        </span>
                        {' '}BGR will respond shortly.
                    </p>
                </div>
            )}

            {/* Card */}
            <div className="glass-card rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '0.5px solid #D1CDC7', background: '#fdfcfa' }}>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>
                            Variation Requests
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>
                            {variations.length === 0
                                ? 'No requests submitted yet'
                                : `${variations.length} request${variations.length !== 1 ? 's' : ''} submitted`}
                        </p>
                    </div>
                    {projects.length > 0 && (
                        <button onClick={() => setShowForm(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{ background: '#25282D', color: '#fff' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                            </svg>
                            New Request
                        </button>
                    )}
                </div>

                {variations.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-forest mb-1">No requests yet</p>
                        <p className="text-xs mb-5" style={{ color: '#888480' }}>
                            Submit a variation to request a change to your project scope.
                        </p>
                        {projects.length > 0 && (
                            <button onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold"
                                style={{ background: '#25282D', color: '#fff' }}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                                </svg>
                                Submit your first request
                            </button>
                        )}
                    </div>
                ) : (
                    variations.map((v, i) => (
                        <VariationRow
                            key={v.id}
                            variation={v}
                            onView={setViewing}
                            onEdit={openEdit}
                            isLast={i === variations.length - 1}
                        />
                    ))
                )}
            </div>
        </AuthenticatedLayout>
    );
}
