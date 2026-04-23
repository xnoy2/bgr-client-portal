import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatValue(val) {
    if (!val) return null;
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

function formatBytes(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ── Design primitives ─────────────────────────────────────────────────────────

function Btn({ variant = 'default', size = 'sm', className = '', ...props }) {
    const base  = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50 whitespace-nowrap';
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
    const styles = {
        default: { background: '#fff',    color: '#25282D', border: '0.5px solid #D1CDC7' },
        primary: { background: '#25282D', color: '#fff',    border: '0.5px solid #25282D' },
        ghost:   { background: 'transparent', color: '#4A4A4A', border: '0.5px solid #D1CDC7' },
        danger:  { background: '#fef2f2', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' },
    };
    return <button className={`${base} ${sizes[size]} ${className}`} style={styles[variant]} {...props} />;
}

function Field({ label, children, error }) {
    return (
        <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A4A4A', letterSpacing: '0.03em' }}>
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e  => e.target.style.borderColor = '#D1CDC7'}
            {...props} />
    );
}

function Select({ children, ...props }) {
    return (
        <select className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e  => e.target.style.borderColor = '#D1CDC7'}
            {...props}>{children}</select>
    );
}

// ── Multi-select dropdown for workers ─────────────────────────────────────────

function WorkerMultiSelect({ workers, selectedIds, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    function toggle(id) {
        onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
    }

    const selected = workers.filter(w => selectedIds.includes(w.id));

    return (
        <div ref={ref}>
            {/* Trigger */}
            <button type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left"
                style={{
                    border: `0.5px solid ${open ? '#25282D' : '#D1CDC7'}`,
                    background: '#fff',
                    color: selected.length === 0 ? '#888480' : '#25282D',
                    outline: 'none',
                    borderBottomLeftRadius: open ? 0 : undefined,
                    borderBottomRightRadius: open ? 0 : undefined,
                }}>
                <span className="truncate pr-2">
                    {selected.length === 0 ? 'Select workers…' : selected.map(w => w.name).join(', ')}
                </span>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                    stroke="#888480" strokeWidth="2" strokeLinecap="round"
                    style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <polyline points="3,5 8,11 13,5"/>
                </svg>
            </button>

            {/* Inline option list — renders in flow so the modal scrolls, not clips */}
            {open && (
                <div className="w-full rounded-b-lg overflow-hidden"
                    style={{ border: '0.5px solid #25282D', borderTop: 'none', background: '#fff' }}>
                    {workers.length === 0 ? (
                        <p className="px-3 py-3 text-xs" style={{ color: '#888480' }}>No workers in system.</p>
                    ) : workers.map(w => {
                        const checked = selectedIds.includes(w.id);
                        return (
                            <button key={w.id} type="button"
                                onClick={() => toggle(w.id)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left"
                                style={{
                                    borderTop: '0.5px solid #f0ebe3',
                                    background: checked ? 'rgba(26,60,46,0.04)' : '#fff',
                                    color: '#25282D',
                                }}>
                                <span className="flex-shrink-0 flex items-center justify-center rounded"
                                    style={{
                                        width: 16, height: 16,
                                        background: checked ? '#25282D' : '#fff',
                                        border: `1.5px solid ${checked ? '#25282D' : '#d0c8bc'}`,
                                    }}>
                                    {checked && (
                                        <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="#25282D" strokeWidth="2.8" strokeLinecap="round">
                                            <polyline points="2,8 6,12 14,4"/>
                                        </svg>
                                    )}
                                </span>
                                {w.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected pills */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {selected.map(w => (
                        <span key={w.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: 'rgba(26,26,26,0.05)', color: '#25282D', border: '0.5px solid rgba(26,60,46,0.15)' }}>
                            {w.name}
                            <button type="button" onClick={() => toggle(w.id)}
                                className="flex items-center justify-center"
                                style={{ color: '#4A4A4A', lineHeight: 1 }}>
                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                </svg>
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Status badges ─────────────────────────────────────────────────────────────

const PROJECT_STATUS = {
    pending:   { bg: 'rgba(156,163,175,0.12)', color: '#6b7280',  label: 'Pending'   },
    active:    { bg: 'rgba(59,130,246,0.1)',   color: '#1d4ed8',  label: 'Active'    },
    on_hold:   { bg: 'rgba(245,158,11,0.1)',   color: '#b45309',  label: 'On Hold'   },
    completed: { bg: 'rgba(34,197,94,0.1)',    color: '#15803d',  label: 'Completed' },
    cancelled: { bg: 'rgba(239,68,68,0.08)',   color: '#b91c1c',  label: 'Cancelled' },
};

function ProjectStatusBadge({ status }) {
    const s = PROJECT_STATUS[status] ?? PROJECT_STATUS.pending;
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.color}33` }}>
            {s.label}
        </span>
    );
}

const GHL_STATUS = {
    open:      { color: '#1d4ed8', label: 'Open'      },
    won:       { color: '#15803d', label: 'Won'       },
    lost:      { color: '#b91c1c', label: 'Lost'      },
    abandoned: { color: '#6b7280', label: 'Abandoned' },
};

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
    return (
        <div className="flex p-1 rounded-2xl mb-6" style={{ background: '#ebe5dc' }}>
            {tabs.map(t => (
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

// ── Stage row ─────────────────────────────────────────────────────────────────

const STAGE_STYLE = {
    pending:     { bg: '#F1F1EF',                  color: '#888480', dot: '#D1CDC7'  },
    in_progress: { bg: 'rgba(26,26,26,0.06)',    color: '#25282D', dot: '#25282D' },
    completed:   { bg: 'rgba(26,26,26,0.05)',      color: '#25282D', dot: '#25282D' },
};

function StageRow({ stage, onUpdateStatus }) {
    const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
    return (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: s.bg, border: `0.5px solid ${s.dot}33` }}>
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: s.color }}>{stage.name}</div>
                {(stage.start_date || stage.end_date) && (
                    <div className="text-xs mt-0.5" style={{ color: '#888480' }}>
                        {formatDate(stage.start_date)} — {formatDate(stage.end_date)}
                    </div>
                )}
            </div>
            <select value={stage.status} onChange={e => onUpdateStatus(stage.id, e.target.value)}
                className="text-xs rounded-lg px-2 py-1 outline-none"
                style={{ border: `0.5px solid ${s.dot}55`, background: '#fff', color: s.color }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
            </select>
        </div>
    );
}

// ── File type icon ────────────────────────────────────────────────────────────

function FileIcon({ mimeType, size = 40 }) {
    const ext = (mimeType ?? '').toLowerCase();
    let color = '#888480', label = 'FILE';

    if (ext.includes('pdf'))                              { color = '#e53e3e'; label = 'PDF'; }
    else if (ext.includes('word') || ext.includes('doc')){ color = '#2b6cb0'; label = 'DOC'; }
    else if (ext.includes('sheet') || ext.includes('excel') || ext.includes('xls')) { color = '#276749'; label = 'XLS'; }
    else if (ext.includes('presentation') || ext.includes('powerpoint') || ext.includes('ppt')) { color = '#c05621'; label = 'PPT'; }
    else if (ext.includes('image') || ext.includes('png') || ext.includes('jpg') || ext.includes('jpeg')) { color = '#6b46c1'; label = 'IMG'; }
    else if (ext.includes('zip') || ext.includes('rar') || ext.includes('archive')) { color = '#b7791f'; label = 'ZIP'; }
    else if (ext.includes('text') || ext.includes('plain')) { color = '#4a5568'; label = 'TXT'; }

    return (
        <div className="flex flex-col items-center justify-center rounded-xl relative"
            style={{ width: size, height: size, background: `${color}14`, border: `1.5px solid ${color}28` }}>
            <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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

// ── Tab: Project Details ──────────────────────────────────────────────────────

function ProjectDetailsTab({ project }) {
    return (
        <div className="space-y-5">
            <div className="glass-card rounded-xl p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>
                    Project Details
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
                    <div>
                        <p className="text-xs" style={{ color: '#888480' }}>Client</p>
                        <p className="font-medium text-forest mt-0.5">{project.client?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: '#888480' }}>Start Date</p>
                        <p className="font-medium text-forest mt-0.5">{formatDate(project.start_date)}</p>
                    </div>
                    <div>
                        <p className="text-xs" style={{ color: '#888480' }}>Est. Completion</p>
                        <p className="font-medium text-forest mt-0.5">{formatDate(project.estimated_completion)}</p>
                    </div>
                    {project.address && (
                        <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs" style={{ color: '#888480' }}>Address</p>
                            <p className="mt-0.5 font-medium text-forest">{project.address}</p>
                        </div>
                    )}
                    {project.description && (
                        <div className="col-span-2 sm:col-span-3">
                            <p className="text-xs" style={{ color: '#888480' }}>Description</p>
                            <p className="mt-0.5" style={{ color: '#4A4A4A' }}>{project.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Assigned Workers */}
            <div className="glass-card rounded-xl p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#888480' }}>
                    Assigned Workers
                </h2>
                {project.workers?.length === 0 ? (
                    <p className="text-sm" style={{ color: '#888480' }}>No workers assigned. Edit the project to assign workers.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {project.workers?.map(w => (
                            <div key={w.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                    style={{ background: 'rgba(26,26,26,0.05)', color: '#25282D' }}>
                                    {w.name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-forest">{w.name}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Tab: Construction Stages ──────────────────────────────────────────────────

function StagesTab({ project, onUpdateStatus }) {
    const completedStages = project.stages?.filter(s => s.status === 'completed').length ?? 0;
    const totalStages     = project.stages?.length ?? 0;
    const progressPct     = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    const currentStage    = project.stages?.find(s => s.status === 'in_progress');

    return (
        <div className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>
                    Construction Stages
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-forest">{progressPct}%</span>
                    <span className="text-xs" style={{ color: '#888480' }}>{completedStages}/{totalStages} complete</span>
                </div>
            </div>

            <div className="h-1.5 rounded-full mb-4 overflow-hidden" style={{ background: '#F1F1EF' }}>
                <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, #25282D, #25282D)' }} />
            </div>

            {currentStage && (
                <p className="text-xs mb-4" style={{ color: '#888480' }}>
                    Currently: <span className="font-semibold" style={{ color: '#25282D' }}>{currentStage.name}</span>
                </p>
            )}

            <div className="space-y-2">
                {project.stages?.map(stage => (
                    <StageRow key={stage.id} stage={stage} onUpdateStatus={onUpdateStatus} />
                ))}
            </div>
        </div>
    );
}

// ── Tab: GHL Opportunity ──────────────────────────────────────────────────────

function GHLTab({ ghl, onRefresh }) {
    if (!ghl) {
        return (
            <div className="glass-card rounded-xl p-5 text-center">
                <p className="text-sm" style={{ color: '#888480' }}>No GHL opportunity linked.</p>
                <p className="text-xs mt-1" style={{ color: '#888480' }}>Edit the project to add a GHL Opportunity ID.</p>
            </div>
        );
    }

    const value     = formatValue(ghl.value);
    const ghlStatus = GHL_STATUS[ghl.status] ?? GHL_STATUS.open;

    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: '0.5px solid #D1CDC7', background: '#F1F1EF' }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>
                        GHL Opportunity
                    </span>
                    <span className="text-xs font-medium" style={{ color: ghlStatus.color }}>
                        · {ghlStatus.label}
                    </span>
                </div>
                <Btn variant="ghost" size="sm" onClick={onRefresh}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M1 4C2.5 1.5 5.5 0 9 1c3 .8 5 3.5 5 6.5"/><polyline points="1,1 1,4 4,4"/>
                        <path d="M15 12c-1.5 2.5-4.5 4-8 3-3-.8-5-3.5-5-6.5"/><polyline points="15,15 15,12 12,12"/>
                    </svg>
                    Refresh
                </Btn>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <p className="text-base font-semibold text-forest">{ghl.name}</p>
                    {value && <p className="text-sm font-semibold mt-0.5" style={{ color: '#25282D' }}>{value}</p>}
                </div>

                {ghl.stage_name && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium" style={{ color: '#888480' }}>Pipeline Stage:</span>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                            style={{ background: 'rgba(26,26,26,0.06)', color: '#25282D', border: '0.5px solid rgba(26,26,26,0.12)' }}>
                            {ghl.stage_name}
                        </span>
                    </div>
                )}

                {ghl.contact && (
                    <div className="rounded-xl p-3 space-y-1.5" style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480', fontSize: 9 }}>Contact</p>
                        <p className="text-sm font-medium text-forest">{ghl.contact.name}</p>
                        {ghl.contact.email && <p className="text-xs" style={{ color: '#4A4A4A' }}>{ghl.contact.email}</p>}
                        {ghl.contact.phone && <p className="text-xs" style={{ color: '#4A4A4A' }}>{ghl.contact.phone}</p>}
                    </div>
                )}

                {ghl.custom_fields?.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480', fontSize: 9 }}>Custom Fields</p>
                        {ghl.custom_fields.map((cf, i) => (
                            <div key={i} className="flex justify-between gap-3 text-xs">
                                <span style={{ color: '#888480' }}>{cf.fieldKey ?? cf.id}</span>
                                <span className="text-right font-medium" style={{ color: '#25282D', maxWidth: '60%', wordBreak: 'break-word' }}>
                                    {Array.isArray(cf.value) ? cf.value.join(', ') : (cf.value ?? '—')}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p style={{ color: '#888480' }}>Created</p>
                        <p className="font-medium text-forest">{formatDate(ghl.created_at)}</p>
                    </div>
                    <div>
                        <p style={{ color: '#888480' }}>Updated</p>
                        <p className="font-medium text-forest">{formatDate(ghl.updated_at)}</p>
                    </div>
                </div>

                <div className="text-xs font-mono pt-1" style={{ color: '#d0c8bc' }}>{ghl.id}</div>
            </div>
        </div>
    );
}

// ── Tab: Documents ────────────────────────────────────────────────────────────

function DocumentsTab({ documents, ghlId }) {
    const fileRef  = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [deleting,  setDeleting]  = useState(null);

    function upload(e) {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', files[0]);
        router.post(route('admin.projects.documents.upload', ghlId), fd, {
            forceFormData: true,
            onFinish:  () => { setUploading(false); e.target.value = ''; },
        });
    }

    function deleteDoc(id) {
        setDeleting(id);
        router.delete(route('admin.projects.documents.delete', { ghlId, document: id }), {
            preserveScroll: true,
            onFinish: () => setDeleting(null),
        });
    }

    return (
        <div className="space-y-4">
            {/* Upload area */}
            <div
                className="glass-card rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                style={{ border: '1.5px dashed #D1CDC7', minHeight: 120 }}
                onClick={() => !uploading && fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = '#25282D'; }}
                onDragLeave={e => { e.currentTarget.style.borderColor = '#D1CDC7'; }}
                onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = '#D1CDC7';
                    const file = e.dataTransfer.files[0];
                    if (!file) return;
                    setUploading(true);
                    const fd = new FormData();
                    fd.append('file', file);
                    router.post(route('admin.projects.documents.upload', ghlId), fd, {
                        forceFormData: true,
                        onFinish: () => setUploading(false),
                    });
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
                        <p className="text-xs mt-1" style={{ color: '#888480' }}>PDF, Word, Excel, images — up to 20 MB</p>
                    </>
                )}
                <input ref={fileRef} type="file" className="hidden" onChange={upload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.webp" />
            </div>

            {/* Document table */}
            {documents.length > 0 ? (
                <div className="glass-card rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '0.5px solid #D1CDC7', background: '#F1F1EF' }}>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>File</th>
                                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Type</th>
                                <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Size</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#888480' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {documents.map((doc, i) => (
                                <tr key={doc.id}
                                    style={{ borderBottom: i < documents.length - 1 ? '0.5px solid #F1F1EF' : 'none' }}
                                    className="hover:bg-stone-50 transition-colors">
                                    <td className="px-4 py-3 min-w-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex-shrink-0">
                                                <FileIcon mimeType={doc.mime_type} size={32} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium text-forest truncate" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                {/* Size shown inline on mobile */}
                                                <p className="sm:hidden text-xs mt-0.5" style={{ color: '#888480' }}>
                                                    {doc.file_size ? formatBytes(doc.file_size) : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 py-3">
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                                            style={{ background: 'rgba(26,26,26,0.05)', color: '#4A4A4A' }}>
                                            {doc.mime_type?.split('/')[1]?.toUpperCase() ?? 'FILE'}
                                        </span>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 py-3 text-xs" style={{ color: '#888480' }}>
                                        {doc.file_size ? formatBytes(doc.file_size) : '—'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <a href={route('admin.projects.documents.download', { ghlId, document: doc.id })}
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
                        <p className="text-xs" style={{ color: '#888480' }}>Upload contracts, plans, or reports above.</p>
                    </div>
                )
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = ['Project Details', 'Construction Stages', 'GHL Opportunity', 'Documents'];

export default function ProjectShow({ project, ghl, workers, clients, documents }) {
    const [tab,      setTab]      = useState('Project Details');
    const [showEdit, setShowEdit] = useState(false);

    const editForm = useForm({
        name:                 project.name                  ?? '',
        description:          project.description           ?? '',
        address:              project.address               ?? '',
        status:               project.status                ?? 'pending',
        start_date:           project.start_date            ?? '',
        estimated_completion: project.estimated_completion  ?? '',
        ghl_opportunity_id:   project.ghl_opportunity_id   ?? '',
        client_id:            project.client?.id            ?? '',
        worker_ids:           project.workers?.map(w => w.id) ?? [],
    });

    const ghlId = project.ghl_opportunity_id;

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.projects.update', ghlId), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(false),
        });
    };

    const updateStageStatus = (stageId, status) => {
        router.put(route('admin.projects.stage.update', ghlId), { stage_id: stageId, status }, { preserveScroll: true });
    };

    const refreshGHL = () => {
        router.post(route('admin.projects.refresh-ghl', ghlId), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            title={project.name}
            breadcrumb={
                <span>
                    <Link href={route('admin.projects.index')} className="hover:underline" style={{ color: '#888480' }}>Projects</Link>
                    <span style={{ color: '#d0c8bc' }}> / </span>
                    <span style={{ color: '#25282D' }}>{project.name}</span>
                </span>
            }>
            <Head title={project.name} />

            {/* Page header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl font-semibold text-forest">{project.name}</h1>
                        <ProjectStatusBadge status={project.status} />
                    </div>
                    {project.address && (
                        <p className="text-sm mt-0.5 flex items-center gap-1.5" style={{ color: '#888480' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                            </svg>
                            {project.address}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <Btn variant="ghost" size="sm" onClick={() => router.visit(route('admin.projects.index'))}>
                        ← Projects
                    </Btn>
                    <Btn variant="primary" size="sm" onClick={() => setShowEdit(true)}>
                        Edit Project
                    </Btn>
                </div>
            </div>

            {/* Tab bar */}
            <TabBar tabs={TABS} active={tab} onChange={setTab} />

            {/* Tab content */}
            {tab === 'Project Details'      && <ProjectDetailsTab project={project} />}
            {tab === 'Construction Stages'  && <StagesTab project={project} onUpdateStatus={updateStageStatus} />}
            {tab === 'GHL Opportunity'      && <GHLTab ghl={ghl} onRefresh={refreshGHL} />}
            {tab === 'Documents'            && <DocumentsTab documents={documents ?? []} ghlId={ghlId} />}

            {/* Edit Modal */}
            <Modal show={showEdit} onClose={() => setShowEdit(false)} maxWidth="lg">
                <form onSubmit={submitEdit} className="p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-forest mb-4">Edit Project</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Project Name" error={editForm.errors.name}>
                                <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                            </Field>
                            <Field label="Status" error={editForm.errors.status}>
                                <Select value={editForm.data.status} onChange={e => editForm.setData('status', e.target.value)}>
                                    {['pending','active','on_hold','completed','cancelled'].map(s => (
                                        <option key={s} value={s}>{s.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                        <Field label="Client" error={editForm.errors.client_id}>
                            <Select value={editForm.data.client_id} onChange={e => editForm.setData('client_id', e.target.value)}>
                                <option value="">— No client assigned —</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                            </Select>
                        </Field>
                        <Field label="Address" error={editForm.errors.address}>
                            <Input value={editForm.data.address} onChange={e => editForm.setData('address', e.target.value)} placeholder="Site address" />
                        </Field>
                        <Field label="Description" error={editForm.errors.description}>
                            <textarea value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)}
                                rows={3} className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                                style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#25282D' }}
                                onFocus={e => e.target.style.borderColor = '#25282D'}
                                onBlur={e  => e.target.style.borderColor = '#D1CDC7'} />
                        </Field>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Start Date" error={editForm.errors.start_date}>
                                <Input type="date" value={editForm.data.start_date} onChange={e => editForm.setData('start_date', e.target.value)} />
                            </Field>
                            <Field label="Est. Completion" error={editForm.errors.estimated_completion}>
                                <Input type="date" value={editForm.data.estimated_completion} onChange={e => editForm.setData('estimated_completion', e.target.value)} />
                            </Field>
                        </div>
                        <Field label="Assigned Workers" error={editForm.errors.worker_ids}>
                            <WorkerMultiSelect
                                workers={workers}
                                selectedIds={editForm.data.worker_ids}
                                onChange={ids => editForm.setData('worker_ids', ids)}
                            />
                        </Field>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <Btn type="button" onClick={() => setShowEdit(false)}>Cancel</Btn>
                        <Btn variant="primary" type="submit" disabled={editForm.processing}>
                            {editForm.processing ? 'Saving…' : 'Save Changes'}
                        </Btn>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
