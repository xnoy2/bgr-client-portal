import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';

// ── Design-system helpers ──────────────────────────────────────────────────

function Btn({ variant = 'default', size = 'sm', className = '', ...props }) {
    const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50 whitespace-nowrap';
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
    const styles = {
        default: { background: '#fff',      color: '#1a3c2e', border: '0.5px solid #e4ddd2' },
        primary: { background: '#1a3c2e',   color: '#fff',    border: '0.5px solid #142e23' },
        gold:    { background: '#c9a84c',   color: '#0e2019', border: '0.5px solid #b8943c' },
        danger:  { background: '#fef2f2',   color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' },
        ghost:   { background: 'transparent', color: '#6b5e4a', border: '0.5px solid #e4ddd2' },
    };
    return (
        <button className={`${base} ${sizes[size]} ${className}`} style={styles[variant]} {...props} />
    );
}

function Field({ label, children, error }) {
    return (
        <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b5e4a', letterSpacing: '0.03em' }}>
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '0.5px solid #e4ddd2', background: '#fff', color: '#1a3c2e' }}
            onFocus={e => e.target.style.borderColor = '#c9a84c'}
            onBlur={e  => e.target.style.borderColor = '#e4ddd2'}
            {...props}
        />
    );
}

function Select({ children, ...props }) {
    return (
        <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ border: '0.5px solid #e4ddd2', background: '#fff', color: '#1a3c2e' }}
            onFocus={e => e.target.style.borderColor = '#c9a84c'}
            onBlur={e  => e.target.style.borderColor = '#e4ddd2'}
            {...props}
        >
            {children}
        </select>
    );
}

// ── Status + Stage badges ───────────────────────────────────────────────────

const GHL_STATUS = {
    open:      { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8',  label: 'Open'      },
    won:       { bg: 'rgba(34,197,94,0.1)',   color: '#15803d',  label: 'Won'       },
    lost:      { bg: 'rgba(239,68,68,0.1)',   color: '#b91c1c',  label: 'Lost'      },
    abandoned: { bg: 'rgba(156,163,175,0.15)',color: '#6b7280',  label: 'Abandoned' },
};

function GHLStatusBadge({ status }) {
    const s = GHL_STATUS[status] ?? GHL_STATUS.open;
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.color}33` }}>
            {s.label}
        </span>
    );
}

function StageBadge({ name }) {
    if (!name) return <span className="text-xs" style={{ color: '#b0a090' }}>—</span>;
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#b8943c', border: '0.5px solid rgba(201,168,76,0.3)' }}>
            {name}
        </span>
    );
}

function formatValue(val) {
    if (!val) return null;
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(val);
}

function formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Flash banner ────────────────────────────────────────────────────────────

function Flash({ flash }) {
    if (!flash?.success && !flash?.error) return null;
    const isSuccess = !!flash.success;
    return (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={isSuccess
                ? { background: 'rgba(34,197,94,0.08)', color: '#15803d', border: '0.5px solid rgba(34,197,94,0.2)' }
                : { background: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.2)' }}>
            {flash.success ?? flash.error}
        </div>
    );
}

// ── Opportunity card ────────────────────────────────────────────────────────

function OpportunityCard({ opp, onCreateProject, onView }) {
    const value = formatValue(opp.value);
    const linked = !!opp.local_project;

    return (
        <div className="bg-white rounded-xl p-5 flex flex-col gap-3"
            style={{ border: '0.5px solid #e4ddd2' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e4ddd2'}>

            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-forest truncate">{opp.name}</h3>
                    {opp.contact?.name && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#8a7e6e' }}>
                            {opp.contact.name}
                            {opp.contact.email && <span style={{ color: '#b0a090' }}> · {opp.contact.email}</span>}
                        </p>
                    )}
                </div>
                <GHLStatusBadge status={opp.status} />
            </div>

            {/* Stage + Value */}
            <div className="flex items-center gap-3 flex-wrap">
                <StageBadge name={opp.stage_name} />
                {value && (
                    <span className="text-xs font-semibold" style={{ color: '#1a3c2e' }}>{value}</span>
                )}
            </div>

            {/* Local project info or link prompt */}
            {linked ? (
                <div className="rounded-lg px-3 py-2 text-xs flex items-center gap-2"
                    style={{ background: 'rgba(26,60,46,0.05)', border: '0.5px solid rgba(26,60,46,0.12)' }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#1a3c2e" strokeWidth="2" strokeLinecap="round">
                        <polyline points="2,8 6,12 14,4"/>
                    </svg>
                    <span style={{ color: '#1a3c2e' }}>
                        Project linked
                        {opp.local_project.client && <span style={{ color: '#6b5e4a' }}> · {opp.local_project.client.name}</span>}
                        {opp.local_project.workers_count > 0 && (
                            <span style={{ color: '#6b5e4a' }}> · {opp.local_project.workers_count} worker{opp.local_project.workers_count !== 1 ? 's' : ''}</span>
                        )}
                    </span>
                </div>
            ) : (
                <div className="text-xs" style={{ color: '#b0a090' }}>No project linked yet</div>
            )}

            {/* GHL meta */}
            <div className="text-xs" style={{ color: '#b0a090' }}>
                Created {formatDate(opp.created_at)}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t" style={{ borderColor: '#f5f0e8' }}>
                {linked ? (
                    <Btn variant="primary" size="sm" onClick={() => onView(opp.local_project.id)}>
                        View Project
                    </Btn>
                ) : (
                    <Btn variant="gold" size="sm" onClick={() => onCreateProject(opp)}>
                        Create Project
                    </Btn>
                )}
                <Btn variant="ghost" size="sm" onClick={() => onView(opp.local_project?.id, opp.id)}>
                    Details
                </Btn>
            </div>
        </div>
    );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsIndex({ opportunities, ghl_meta, clients, workers, flash }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search,       setSearch]       = useState('');
    const [showCreate,   setShowCreate]   = useState(false);
    const [prefillGHL,   setPrefillGHL]   = useState(null);   // GHL opp used to prefill create form

    const createForm = useForm({
        name:                 '',
        client_id:            '',
        ghl_opportunity_id:   '',
        description:          '',
        address:              '',
        start_date:           '',
        estimated_completion: '',
        status:               'pending',
    });

    const filtered = useMemo(() => {
        return (opportunities ?? []).filter(opp => {
            if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return opp.name.toLowerCase().includes(q)
                    || (opp.contact?.name  ?? '').toLowerCase().includes(q)
                    || (opp.contact?.email ?? '').toLowerCase().includes(q);
            }
            return true;
        });
    }, [opportunities, statusFilter, search]);

    const stats = useMemo(() => ({
        total:    opportunities?.length ?? 0,
        open:     (opportunities ?? []).filter(o => o.status === 'open').length,
        won:      (opportunities ?? []).filter(o => o.status === 'won').length,
        linked:   (opportunities ?? []).filter(o => o.local_project).length,
    }), [opportunities]);

    const openCreate = (opp = null) => {
        setPrefillGHL(opp);
        createForm.setData({
            name:                 opp?.name ?? '',
            client_id:            '',
            ghl_opportunity_id:   opp?.id   ?? '',
            description:          '',
            address:              '',
            start_date:           '',
            estimated_completion: '',
            status:               'pending',
        });
        setShowCreate(true);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.projects.store'), {
            onSuccess: () => { setShowCreate(false); createForm.reset(); },
        });
    };

    const viewProject = (localId, ghlId) => {
        if (localId) {
            router.visit(route('admin.projects.show', localId));
        }
    };

    const refreshGHL = () => {
        router.post(route('admin.projects.refresh-pipeline'), {}, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout title="Projects" breadcrumb="GHL pipeline opportunities and linked projects">
            <Head title="Projects" />

            <Flash flash={flash} />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'Total Opportunities', value: stats.total,  left: '#e4ddd2' },
                    { label: 'Open',                value: stats.open,   left: '#3b82f6' },
                    { label: 'Won',                 value: stats.won,    left: '#22c55e' },
                    { label: 'Linked to Projects',  value: stats.linked, left: '#c9a84c' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4"
                        style={{ border: '0.5px solid #e4ddd2', borderLeft: `4px solid ${s.left}` }}>
                        <p className="text-2xl font-semibold text-forest">{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Status filter pills */}
                    {['all', 'open', 'won', 'lost', 'abandoned'].map(s => (
                        <button key={s}
                            onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize"
                            style={statusFilter === s
                                ? { background: '#1a3c2e', color: '#fff', border: '0.5px solid #142e23' }
                                : { background: '#fff',    color: '#6b5e4a', border: '0.5px solid #e4ddd2' }}>
                            {s === 'all' ? 'All' : s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 sm:w-56">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13"
                            viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round">
                            <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
                        </svg>
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search opportunities…"
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ border: '0.5px solid #e4ddd2', background: '#fff', color: '#1a3c2e' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e  => e.target.style.borderColor = '#e4ddd2'}
                        />
                    </div>
                    <Btn variant="ghost" size="sm" onClick={refreshGHL} title="Refresh from GHL">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 4C2.5 1.5 5.5 0 9 1c3 .8 5 3.5 5 6.5"/><polyline points="1,1 1,4 4,4"/>
                            <path d="M15 12c-1.5 2.5-4.5 4-8 3-3-.8-5-3.5-5-6.5"/><polyline points="15,15 15,12 12,12"/>
                        </svg>
                        Refresh
                    </Btn>
                    <Btn variant="primary" size="sm" onClick={() => openCreate()}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
                        </svg>
                        New Project
                    </Btn>
                </div>
            </div>

            {/* Opportunities grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl py-16 text-center"
                    style={{ border: '0.5px solid #e4ddd2' }}>
                    <p className="text-sm" style={{ color: '#b0a090' }}>
                        {opportunities?.length === 0
                            ? 'No opportunities found in GHL pipeline.'
                            : 'No opportunities match your filters.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(opp => (
                        <OpportunityCard
                            key={opp.id}
                            opp={opp}
                            onCreateProject={openCreate}
                            onView={viewProject}
                        />
                    ))}
                </div>
            )}

            {ghl_meta?.total > 0 && (
                <p className="mt-4 text-xs text-center" style={{ color: '#b0a090' }}>
                    Showing {filtered.length} of {ghl_meta.total} total opportunities · Cached for 5 minutes
                </p>
            )}

            {/* ── Create Project Modal ── */}
            <Modal show={showCreate} onClose={() => { setShowCreate(false); createForm.reset(); }} maxWidth="md">
                <form onSubmit={submitCreate} className="p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-forest mb-1">Create Project</h2>
                    {prefillGHL && (
                        <p className="text-xs mb-4" style={{ color: '#8a7e6e' }}>
                            Linking to GHL opportunity: <span className="font-medium text-forest">{prefillGHL.name}</span>
                        </p>
                    )}

                    <div className="space-y-4">
                        <Field label="Project Name" error={createForm.errors.name}>
                            <Input value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="e.g. Smith Residence Renovation" autoFocus />
                        </Field>

                        <Field label="Client" error={createForm.errors.client_id}>
                            <Select value={createForm.data.client_id}
                                onChange={e => createForm.setData('client_id', e.target.value)}>
                                <option value="">— Select client —</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                                ))}
                            </Select>
                        </Field>

                        <Field label="Address" error={createForm.errors.address}>
                            <Input value={createForm.data.address}
                                onChange={e => createForm.setData('address', e.target.value)}
                                placeholder="Site address" />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Start Date" error={createForm.errors.start_date}>
                                <Input type="date" value={createForm.data.start_date}
                                    onChange={e => createForm.setData('start_date', e.target.value)} />
                            </Field>
                            <Field label="Est. Completion" error={createForm.errors.estimated_completion}>
                                <Input type="date" value={createForm.data.estimated_completion}
                                    onChange={e => createForm.setData('estimated_completion', e.target.value)} />
                            </Field>
                        </div>

                        <Field label="GHL Opportunity ID" error={createForm.errors.ghl_opportunity_id}>
                            <Input value={createForm.data.ghl_opportunity_id}
                                onChange={e => createForm.setData('ghl_opportunity_id', e.target.value)}
                                placeholder="e.g. 1fMm4Yzp5Mzzl0J1PX57"
                                className="font-mono" />
                        </Field>
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                        <Btn type="button" onClick={() => { setShowCreate(false); createForm.reset(); }}>Cancel</Btn>
                        <Btn variant="primary" type="submit" disabled={createForm.processing}>
                            {createForm.processing ? 'Creating…' : 'Create Project'}
                        </Btn>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
