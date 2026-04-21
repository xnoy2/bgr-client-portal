import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const STATUS_COLOR = {
    active:    { bg: 'rgba(26,26,26,0.06)',   border: 'rgba(26,26,26,0.15)',   text: '#25282D'  },
    completed: { bg: 'rgba(21,128,61,0.08)',  border: 'rgba(21,128,61,0.2)',   text: '#15803d'  },
    on_hold:   { bg: 'rgba(180,80,60,0.08)',  border: 'rgba(180,80,60,0.25)',  text: '#b44c3c'  },
};

function ProgressRing({ pct, size = 40, stroke = 3 }) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#D1CDC7" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="#B2945B" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
        </svg>
    );
}

function ProjectCard({ project }) {
    const s = STATUS_COLOR[project.status] ?? STATUS_COLOR.active;

    return (
        <Link href={route('worker.projects.show', project.ghl_opportunity_id)}
            className="block glass-card rounded-xl p-5 transition-shadow duration-200"
            style={{}}>


            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-forest leading-snug truncate">{project.name}</h3>
                    {project.client_name && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#8a7e6e' }}>{project.client_name}</p>
                    )}
                    {project.address && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: '#a09487' }}>{project.address}</p>
                    )}
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 capitalize"
                    style={{ background: s.bg, border: `0.5px solid ${s.border}`, color: s.text }}>
                    {project.status?.replace('_', ' ')}
                </span>
            </div>

            {/* Progress row */}
            <div className="flex items-center gap-3">
                <ProgressRing pct={project.progress_pct} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-sm font-bold text-forest">{project.progress_pct}%</span>
                        <span className="text-xs" style={{ color: '#8a7e6e' }}>complete</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E8E6E2' }}>
                        <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${project.progress_pct}%`, background: '#B2945B' }} />
                    </div>
                </div>
                <div className="text-right flex-shrink-0">
                    <div className="text-xs font-medium text-forest">
                        {project.completed_stages}/{project.total_stages}
                    </div>
                    <div className="text-xs" style={{ color: '#8a7e6e' }}>stages</div>
                </div>
            </div>

            {/* Current stage */}
            {project.current_stage && (
                <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '0.5px solid #ede8df' }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#B2945B' }} />
                    <span className="text-xs" style={{ color: '#6b5e4a' }}>
                        Currently: <span className="font-medium text-forest">{project.current_stage}</span>
                    </span>
                </div>
            )}
        </Link>
    );
}

export default function WorkerDashboard({ projects }) {
    return (
        <AuthenticatedLayout title="My Projects" breadcrumb="Your assigned projects">
            <Head title="Worker Dashboard" />

            {/* Header */}
            <div className="rounded-2xl p-6 mb-5 flex items-start justify-between"
                style={{ background: '#25282D', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div>
                    <h1 className="text-2xl text-white font-serif font-normal mb-1">My Projects</h1>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {projects?.length ?? 0} project{(projects?.length ?? 0) !== 1 ? 's' : ''} assigned to you
                    </p>
                </div>
                <span className="text-sm font-medium px-3 py-1.5 rounded-full mt-1"
                    style={{ color: '#B2945B', background: 'rgba(178,148,91,0.12)', border: '0.5px solid rgba(178,148,91,0.3)' }}>
                    Worker
                </span>
            </div>

            {/* Project grid */}
            {projects?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {projects.map(p => <ProjectCard key={p.id} project={p} />)}
                </div>
            ) : (
                <div className="glass-card rounded-xl p-10 text-center">
                    <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#D1CDC7" strokeWidth="1.2"
                        strokeLinecap="round" className="mx-auto mb-3">
                        <rect x="2" y="5" width="12" height="9" rx="1.5"/>
                        <path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5"/>
                        <line x1="2" y1="9" x2="14" y2="9"/>
                    </svg>
                    <p className="text-sm font-medium text-forest mb-1">No projects assigned yet</p>
                    <p className="text-xs" style={{ color: '#8a7e6e' }}>
                        Projects assigned to you by an admin will appear here.
                    </p>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
