import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(val) {
    if (!val) return null;
    return new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PROJECT_STATUS = {
    pending:   { color: '#6b7280', label: 'Pending'    },
    active:    { color: '#1d4ed8', label: 'Active'     },
    on_hold:   { color: '#b45309', label: 'On Hold'    },
    completed: { color: '#15803d', label: 'Completed'  },
    cancelled: { color: '#b91c1c', label: 'Cancelled'  },
};

const GHL_STATUS = {
    open:      { color: '#1d4ed8', label: 'Open'      },
    won:       { color: '#15803d', label: 'Won'        },
    lost:      { color: '#b91c1c', label: 'Lost'       },
    abandoned: { color: '#6b7280', label: 'Abandoned'  },
};

function StatusPill({ status, map }) {
    const s = map[status] ?? { color: '#6b7280', label: status ?? '—' };
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ background: `${s.color}18`, color: s.color, border: `0.5px solid ${s.color}33` }}>
            {s.label}
        </span>
    );
}

// ── Project card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }) {
    const open = () => router.visit(route('client.projects.show', project.ghl_opportunity_id));

    return (
        <div onClick={open}
            className="bg-white rounded-2xl overflow-hidden cursor-pointer"
            style={{ border: '0.5px solid #e4ddd2', transition: 'border-color .15s, box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a84c'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(201,168,76,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4ddd2'; e.currentTarget.style.boxShadow = 'none'; }}>

            {/* Progress bar header */}
            <div className="h-1.5" style={{ background: '#f5f0e8' }}>
                <div className="h-full transition-all duration-700"
                    style={{
                        width: `${project.progress_pct}%`,
                        background: project.progress_pct === 100
                            ? 'linear-gradient(90deg, #15803d, #22c55e)'
                            : 'linear-gradient(90deg, #1a3c2e, #c9a84c)',
                    }} />
            </div>

            <div className="p-5">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-forest leading-snug flex-1">{project.name}</h3>
                    <StatusPill status={project.ghl_status ?? project.status} map={GHL_STATUS} />
                </div>

                {/* Current stage */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: project.current_stage ? '#c9a84c' : '#e4ddd2' }} />
                    <span className="text-sm" style={{ color: project.current_stage ? '#b8943c' : '#b0a090' }}>
                        {project.current_stage
                            ? <><span style={{ color: '#8a7e6e' }}>Currently: </span>{project.current_stage}</>
                            : project.ghl_stage ?? 'Not started'}
                    </span>
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: '#8a7e6e' }}>Progress</span>
                    <span className="text-xs font-semibold text-forest">{project.progress_pct}%</span>
                </div>
                <div className="h-1 rounded-full mb-4" style={{ background: '#f5f0e8' }}>
                    <div className="h-full rounded-full"
                        style={{
                            width: `${project.progress_pct}%`,
                            background: 'linear-gradient(90deg, #1a3c2e, #c9a84c)',
                        }} />
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: '#b0a090' }}>
                    {project.address && (
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                            </svg>
                            {project.address}
                        </span>
                    )}
                    {project.estimated_completion && (
                        <span className="flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <rect x="2" y="3" width="12" height="11" rx="1.5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/>
                            </svg>
                            Est. {formatDate(project.estimated_completion)}
                        </span>
                    )}
                    {project.workers_count > 0 && (
                        <span className="flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-3 2-4.5 5-4.5s5 1.5 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M14 13.5c.5-.5.8-1.2.8-2 0-1.5-1-2.5-2.5-2.5"/>
                            </svg>
                            {project.workers_count} worker{project.workers_count !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 flex items-center justify-between"
                style={{ borderTop: '0.5px solid #f5f0e8', background: '#fdfcfa' }}>
                <span className="text-xs" style={{ color: '#8a7e6e' }}>
                    {project.ghl_stage && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                            style={{ background: 'rgba(201,168,76,0.1)', color: '#b8943c' }}>
                            {project.ghl_stage}
                        </span>
                    )}
                </span>
                <span className="text-xs font-medium" style={{ color: '#c9a84c' }}>View details →</span>
            </div>
        </div>
    );
}

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: '0.5px solid #e4ddd2' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#f5f0e8' }}>
                <svg width="24" height="24" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round">
                    <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                    <line x1="5" y1="7" x2="11" y2="7"/><line x1="5" y1="9.5" x2="8.5" y2="9.5"/>
                </svg>
            </div>
            <p className="text-base font-medium text-forest mb-1">No projects yet</p>
            <p className="text-sm" style={{ color: '#8a7e6e' }}>
                Your projects will appear here once your account manager links them.
            </p>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDashboard({ projects }) {
    const { auth } = usePage().props;
    const firstName = auth.user.name.split(' ')[0];

    return (
        <AuthenticatedLayout title="My Projects" breadcrumb="Your active and completed projects">
            <Head title="My Projects" />

            {/* Welcome banner */}
            <div className="rounded-2xl p-6 mb-6 flex items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #142e23 100%)', border: '0.5px solid rgba(201,168,76,0.15)' }}>
                <div>
                    <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(201,168,76,0.7)', fontSize: 10 }}>
                        BGR Client Portal
                    </p>
                    <h1 className="text-2xl text-white font-serif font-normal">
                        Welcome back, {firstName}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        {projects.length === 0
                            ? 'No active projects yet'
                            : `${projects.length} project${projects.length !== 1 ? 's' : ''} · ${projects.filter(p => p.status === 'active').length} active`}
                    </p>
                </div>
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl hidden sm:flex items-center justify-center"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.2)' }}>
                    <svg width="28" height="28" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="1.2" strokeLinecap="round">
                        <rect x="1" y="4" width="14" height="10" rx="1.5"/>
                        <path d="M5 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/>
                        <line x1="8" y1="8" x2="8" y2="11"/><line x1="6.5" y1="9.5" x2="9.5" y2="9.5"/>
                    </svg>
                </div>
            </div>

            {/* Projects */}
            {projects.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
