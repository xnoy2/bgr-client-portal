import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(val) {
    if (!val) return '—';
    return new Date(val).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

// ── Stage step ───────────────────────────────────────────────────────────────

const STAGE_ICON = {
    pending:     { fill: '#e4ddd2', stroke: '#b0a090', text: '#b0a090' },
    in_progress: { fill: '#c9a84c', stroke: '#b8943c', text: '#fff'    },
    completed:   { fill: '#1a3c2e', stroke: '#142e23', text: '#fff'    },
};

function StageStep({ stage, isLast }) {
    const s = STAGE_ICON[stage.status] ?? STAGE_ICON.pending;
    const label = { pending: 'Upcoming', in_progress: 'In Progress', completed: 'Complete' }[stage.status];

    return (
        <div className="flex items-start gap-4">
            {/* Icon + connector */}
            <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all"
                    style={{ background: s.fill, border: `2px solid ${s.stroke}`, color: s.text }}>
                    {stage.status === 'completed' ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="2,8 6,12 14,4"/>
                        </svg>
                    ) : stage.status === 'in_progress' ? (
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="6.5"/>
                        </svg>
                    ) : (
                        <span style={{ color: '#d0c8bc', fontSize: 11, fontWeight: 600 }}>{stage.order}</span>
                    )}
                </div>
                {!isLast && (
                    <div className="w-0.5 flex-1 mt-1 min-h-[28px]"
                        style={{ background: stage.status === 'completed' ? '#1a3c2e' : '#e4ddd2' }} />
                )}
            </div>

            {/* Label */}
            <div className="pb-7">
                <p className="text-sm font-medium leading-tight"
                    style={{ color: stage.status === 'pending' ? '#b0a090' : '#1a3c2e' }}>
                    {stage.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: stage.status === 'in_progress' ? '#b8943c' : '#b0a090' }}>
                    {label}
                </p>
            </div>
        </div>
    );
}

// ── Flash banner ──────────────────────────────────────────────────────────────

function Flash({ flash }) {
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ClientProjectShow({ project, ghl, flash }) {
    const currentStage  = project.stages?.find(s => s.status === 'in_progress');
    const completedCount = project.stages?.filter(s => s.status === 'completed').length ?? 0;
    const totalCount     = project.stages?.length ?? 0;

    return (
        <AuthenticatedLayout
            title={project.name}
            breadcrumb={
                <span>
                    <Link href={route('client.dashboard')} className="hover:underline" style={{ color: '#8a7e6e' }}>
                        My Projects
                    </Link>
                    <span style={{ color: '#d0c8bc' }}> / </span>
                    <span style={{ color: '#1a3c2e' }}>{project.name}</span>
                </span>
            }>
            <Head title={project.name} />

            <Flash flash={flash} />

            {/* ── Hero banner ── */}
            <div className="rounded-2xl p-6 mb-6"
                style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #142e23 100%)', border: '0.5px solid rgba(201,168,76,0.15)' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(201,168,76,0.7)', fontSize: 10 }}>
                            {ghl?.stage_name ?? 'Your Project'}
                        </p>
                        <h1 className="text-2xl text-white font-serif font-normal leading-tight">{project.name}</h1>
                        {project.address && (
                            <p className="text-xs mt-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/><circle cx="8" cy="6" r="1.5"/>
                                </svg>
                                {project.address}
                            </p>
                        )}
                    </div>

                    {/* Progress circle */}
                    <div className="flex-shrink-0 text-center">
                        <div className="relative w-16 h-16">
                            <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6"/>
                                <circle cx="32" cy="32" r="26" fill="none"
                                    stroke="#c9a84c" strokeWidth="6"
                                    strokeDasharray={`${2 * Math.PI * 26}`}
                                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - project.progress_pct / 100)}`}
                                    strokeLinecap="round"
                                    style={{ transition: 'stroke-dashoffset 1s ease' }}/>
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                                {project.progress_pct}%
                            </span>
                        </div>
                        <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {completedCount}/{totalCount} stages
                        </p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${project.progress_pct}%`,
                            background: 'linear-gradient(90deg, rgba(201,168,76,0.6), #c9a84c)',
                        }} />
                </div>
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Left: stage timeline (2/3) ── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* Stage timeline */}
                    <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #e4ddd2' }}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: '#8a7e6e' }}>
                            Construction Stages
                        </h2>
                        <div>
                            {project.stages?.map((stage, i) => (
                                <StageStep
                                    key={stage.id}
                                    stage={stage}
                                    isLast={i === project.stages.length - 1}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Project details */}
                    <div className="bg-white rounded-2xl p-6" style={{ border: '0.5px solid #e4ddd2' }}>
                        <h2 className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#8a7e6e' }}>
                            Project Details
                        </h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                            <div>
                                <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Start Date</p>
                                <p className="text-sm font-medium text-forest">{formatDate(project.start_date)}</p>
                            </div>
                            <div>
                                <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Estimated Completion</p>
                                <p className="text-sm font-medium text-forest">{formatDate(project.estimated_completion)}</p>
                            </div>
                            {project.address && (
                                <div className="col-span-2">
                                    <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Site Address</p>
                                    <p className="text-sm font-medium text-forest">{project.address}</p>
                                </div>
                            )}
                            {ghl?.source && (
                                <div className="col-span-2">
                                    <p className="text-xs mb-1" style={{ color: '#b0a090' }}>Enquiry Source</p>
                                    <p className="text-sm font-medium text-forest">{ghl.source}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Right col: team + GHL contact ── */}
                <div className="space-y-5">

                    {/* Current stage callout */}
                    {currentStage && (
                        <div className="rounded-2xl p-5"
                            style={{ background: 'rgba(201,168,76,0.07)', border: '0.5px solid rgba(201,168,76,0.25)' }}>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#b8943c', fontSize: 9 }}>
                                Currently In Progress
                            </p>
                            <p className="text-base font-semibold text-forest">{currentStage.name}</p>
                            <p className="text-xs mt-1" style={{ color: '#8a7e6e' }}>Our team is actively working on this stage.</p>
                        </div>
                    )}

                    {/* Your team */}
                    {project.workers?.length > 0 && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>
                                Your Project Team
                            </h2>
                            <div className="space-y-3">
                                {project.workers.map(w => (
                                    <div key={w.id} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                            style={{ background: 'rgba(201,168,76,0.12)', color: '#b8943c' }}>
                                            {initials(w.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-forest">{w.name}</p>
                                            <p className="text-xs" style={{ color: '#b0a090' }}>Site Worker</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact info (from GHL) */}
                    {ghl?.contact && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>
                                Your Details On File
                            </h2>
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                                        style={{ background: 'rgba(26,60,46,0.06)', color: '#1a3c2e' }}>
                                        {initials(ghl.contact.name ?? '')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-forest">{ghl.contact.name}</p>
                                        {ghl.contact.email && (
                                            <p className="text-xs truncate" style={{ color: '#8a7e6e' }}>{ghl.contact.email}</p>
                                        )}
                                    </div>
                                </div>
                                {ghl.contact.phone && (
                                    <p className="text-xs pl-11" style={{ color: '#8a7e6e' }}>{ghl.contact.phone}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Custom fields from GHL (e.g. project type) */}
                    {ghl?.custom_fields?.length > 0 && (
                        <div className="bg-white rounded-2xl p-5" style={{ border: '0.5px solid #e4ddd2' }}>
                            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#8a7e6e' }}>
                                Project Specifications
                            </h2>
                            <div className="space-y-3">
                                {ghl.custom_fields.map((cf, i) => {
                                    const val = cf.fieldValueArray?.join(', ')
                                        ?? cf.fieldValueString
                                        ?? cf.value
                                        ?? null;
                                    if (!val) return null;
                                    return (
                                        <div key={i} className="flex items-start gap-2">
                                            <svg className="flex-shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round">
                                                <polyline points="2,8 6,12 14,4"/>
                                            </svg>
                                            <span className="text-sm text-forest">{val}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Back link */}
                    <button onClick={() => router.visit(route('client.dashboard'))}
                        className="w-full text-center py-2.5 rounded-xl text-xs font-medium transition-colors"
                        style={{ border: '0.5px solid #e4ddd2', color: '#8a7e6e', background: '#fff' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = '#e4ddd2'}>
                        ← Back to My Projects
                    </button>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
