import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';

// ── Design-system helpers ──────────────────────────────────────────────────

function Btn({ variant = 'default', size = 'sm', className = '', ...props }) {
    const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition-opacity disabled:opacity-50 whitespace-nowrap';
    const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
    const styles = {
        default: { background: '#fff',        color: '#1a3c2e', border: '0.5px solid #e4ddd2' },
        primary: { background: '#1a3c2e',     color: '#fff',    border: '0.5px solid #142e23' },
        gold:    { background: '#c9a84c',     color: '#0e2019', border: '0.5px solid #b8943c' },
        ghost:   { background: 'transparent', color: '#6b5e4a', border: '0.5px solid #e4ddd2' },
    };
    return <button className={`${base} ${sizes[size]} ${className}`} style={styles[variant]} {...props} />;
}

// ── Badges ─────────────────────────────────────────────────────────────────

const GHL_STATUS = {
    open:      { bg: 'rgba(59,130,246,0.1)',   color: '#1d4ed8', label: 'Open'      },
    won:       { bg: 'rgba(34,197,94,0.1)',    color: '#15803d', label: 'Won'       },
    lost:      { bg: 'rgba(239,68,68,0.1)',    color: '#b91c1c', label: 'Lost'      },
    abandoned: { bg: 'rgba(156,163,175,0.15)', color: '#6b7280', label: 'Abandoned' },
};

function StatusBadge({ status }) {
    const s = GHL_STATUS[status] ?? GHL_STATUS.open;
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.color}33` }}>
            {s.label}
        </span>
    );
}

function StageBadge({ name }) {
    if (!name) return null;
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
    if (!iso) return null;
    return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Flash banner ────────────────────────────────────────────────────────────

function Flash() {
    const { flash } = usePage().props;
    if (!flash?.success && !flash?.error) return null;
    const ok = !!flash.success;
    return (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={ok
                ? { background: 'rgba(34,197,94,0.08)', color: '#15803d', border: '0.5px solid rgba(34,197,94,0.2)' }
                : { background: 'rgba(239,68,68,0.08)', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.2)' }}>
            {flash.success ?? flash.error}
        </div>
    );
}

// ── Opportunity card ────────────────────────────────────────────────────────

function OpportunityCard({ opp }) {
    const value    = formatValue(opp.value);
    const created  = formatDate(opp.created_at);
    const hasLocal = !!opp.local;

    const open = () => router.visit(route('admin.projects.show', opp.id));

    return (
        <div
            onClick={open}
            className="bg-white rounded-xl p-5 flex flex-col gap-3 cursor-pointer"
            style={{ border: '0.5px solid #e4ddd2', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(201,168,76,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4ddd2'; e.currentTarget.style.boxShadow = 'none'; }}>

            {/* Header row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-forest leading-snug">{opp.name}</h3>
                    {opp.contact?.name && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#8a7e6e' }}>
                            {opp.contact.name}
                            {opp.contact.email && (
                                <span style={{ color: '#b0a090' }}> · {opp.contact.email}</span>
                            )}
                        </p>
                    )}
                </div>
                <StatusBadge status={opp.status} />
            </div>

            {/* Stage + value */}
            <div className="flex items-center gap-3 flex-wrap">
                <StageBadge name={opp.stage_name} />
                {value && <span className="text-xs font-semibold text-forest">{value}</span>}
            </div>

            {/* Local project info */}
            {hasLocal ? (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                    style={{ background: 'rgba(26,60,46,0.05)', border: '0.5px solid rgba(26,60,46,0.12)' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="#1a3c2e" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="2,8 6,12 14,4"/>
                    </svg>
                    <span style={{ color: '#1a3c2e' }}>
                        Project open
                        {opp.local.client && <span style={{ color: '#6b5e4a' }}> · {opp.local.client.name}</span>}
                        {opp.local.workers_count > 0 && (
                            <span style={{ color: '#6b5e4a' }}> · {opp.local.workers_count} worker{opp.local.workers_count !== 1 ? 's' : ''}</span>
                        )}
                    </span>
                </div>
            ) : (
                <div className="text-xs" style={{ color: '#b0a090' }}>Not yet opened as project</div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t" style={{ borderColor: '#f5f0e8' }}>
                {created && <span className="text-xs" style={{ color: '#b0a090' }}>{created}</span>}
                <span className="text-xs font-medium ml-auto" style={{ color: '#c9a84c' }}>
                    Open →
                </span>
            </div>
        </div>
    );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function ProjectsIndex({ opportunities, ghl_meta }) {
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const filtered = useMemo(() => {
        return (opportunities ?? []).filter(opp => {
            if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
            if (search) {
                const q = search.toLowerCase();
                return (
                    opp.name.toLowerCase().includes(q) ||
                    (opp.contact?.name  ?? '').toLowerCase().includes(q) ||
                    (opp.contact?.email ?? '').toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [opportunities, statusFilter, search]);

    const stats = useMemo(() => ({
        total:  opportunities?.length ?? 0,
        open:   (opportunities ?? []).filter(o => o.status === 'open').length,
        won:    (opportunities ?? []).filter(o => o.status === 'won').length,
        opened: (opportunities ?? []).filter(o => o.local).length,
    }), [opportunities]);

    const refresh = () => {
        setRefreshing(true);
        router.post(route('admin.projects.refresh-pipeline'), {}, {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
        });
    };

    return (
        <AuthenticatedLayout title="Projects" breadcrumb="GHL pipeline — click any opportunity to open it as a project">
            <Head title="Projects" />
            <Flash />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                    { label: 'Total',          value: stats.total,  accent: '#e4ddd2' },
                    { label: 'Open',           value: stats.open,   accent: '#3b82f6' },
                    { label: 'Won',            value: stats.won,    accent: '#22c55e' },
                    { label: 'Projects Opened', value: stats.opened, accent: '#c9a84c' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4"
                        style={{ border: '0.5px solid #e4ddd2', borderLeft: `4px solid ${s.accent}` }}>
                        <p className="text-2xl font-semibold text-forest">{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                {/* Status filters */}
                <div className="flex items-center gap-2 flex-wrap">
                    {['all', 'open', 'won', 'lost', 'abandoned'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors"
                            style={statusFilter === s
                                ? { background: '#1a3c2e', color: '#fff',    border: '0.5px solid #142e23' }
                                : { background: '#fff',    color: '#6b5e4a', border: '0.5px solid #e4ddd2' }}>
                            {s === 'all' ? 'All' : s}
                        </button>
                    ))}
                </div>

                {/* Search + refresh */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-56">
                        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="13" height="13"
                            viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="2" strokeLinecap="round">
                            <circle cx="6.5" cy="6.5" r="4.5"/><line x1="10" y1="10" x2="14" y2="14"/>
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search opportunities…"
                            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none"
                            style={{ border: '0.5px solid #e4ddd2', background: '#fff', color: '#1a3c2e' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e  => e.target.style.borderColor = '#e4ddd2'} />
                    </div>
                    <Btn variant="ghost" size="sm" onClick={refresh} disabled={refreshing}>
                        <svg className={refreshing ? 'animate-spin' : ''} width="12" height="12" viewBox="0 0 16 16"
                            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M1 4C2.5 1.5 5.5 0 9 1c3 .8 5 3.5 5 6.5"/><polyline points="1,1 1,4 4,4"/>
                            <path d="M15 12c-1.5 2.5-4.5 4-8 3-3-.8-5-3.5-5-6.5"/><polyline points="15,15 15,12 12,12"/>
                        </svg>
                        Refresh
                    </Btn>
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl py-16 text-center" style={{ border: '0.5px solid #e4ddd2' }}>
                    <p className="text-sm" style={{ color: '#b0a090' }}>
                        {(opportunities?.length ?? 0) === 0
                            ? 'No opportunities in GHL pipeline.'
                            : 'No opportunities match your filters.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filtered.map(opp => <OpportunityCard key={opp.id} opp={opp} />)}
                </div>
            )}

            {ghl_meta?.total > 0 && (
                <p className="mt-4 text-xs text-center" style={{ color: '#b0a090' }}>
                    {filtered.length} of {ghl_meta.total} opportunities · cached 5 min
                </p>
            )}
        </AuthenticatedLayout>
    );
}
