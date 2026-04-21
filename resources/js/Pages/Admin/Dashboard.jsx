import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats = {} }) {
    const {
        total_users    = 0,
        total_workers  = 0,
        total_clients  = 0,
        total_projects = 0,
    } = stats;

    const statCards = [
        { label: 'Total Projects', value: total_projects, border: '#6366f1', icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round">
                <rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5"/><line x1="2" y1="9" x2="14" y2="9"/>
            </svg>
        )},
        { label: 'Clients', value: total_clients, border: '#22c55e', icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round">
                <path d="M10 8a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2 14a5 5 0 0110 0"/>
                <path d="M12 6a2 2 0 110-4 2 2 0 010 4M14 13a4 4 0 00-3-3.87"/>
            </svg>
        )},
        { label: 'Workers', value: total_workers, border: '#3b82f6', icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6z"/><path d="M2 14a6 6 0 0112 0"/>
            </svg>
        )},
        { label: 'Total Users', value: total_users, border: '#6b7280', icon: (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round">
                <path d="M10 8a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2 14a5 5 0 0110 0"/>
                <path d="M12 6a2 2 0 110-4 2 2 0 010 4M14 13a4 4 0 00-3-3.87"/>
            </svg>
        )},
    ];

    const quickLinks = [
        {
            label: 'Manage Users',
            href: route('admin.users.index'),
            desc: 'Create and manage admin, worker, and client accounts.',
            icon: (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                    <path d="M10 8a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2 14a5 5 0 0110 0"/>
                    <path d="M12 6a2 2 0 110-4 2 2 0 010 4M14 13a4 4 0 00-3-3.87"/>
                </svg>
            ),
        },
    ];

    return (
        <AuthenticatedLayout title="Dashboard" breadcrumb="Welcome back">
            <Head title="Admin Dashboard" />

            {/* Welcome banner */}
            <div className="rounded-2xl p-6 mb-5 flex items-start justify-between"
                style={{ background: '#1A1A1A', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                <div>
                    <h1 className="text-2xl text-white font-serif font-normal mb-1" style={{ letterSpacing: '-0.01em' }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        BGR Client Portal &nbsp;·&nbsp; <span style={{ color: '#B2945B' }}>Administration</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9 }}>Portal</p>
                    <span className="text-sm font-medium px-3 py-1.5 rounded-full" style={{ color: '#B2945B', background: 'rgba(178,148,91,0.12)', border: '0.5px solid rgba(178,148,91,0.3)' }}>
                        Active
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-5">
                {statCards.map(s => (
                    <div key={s.label} className="glass-card rounded-xl p-5 flex items-center justify-between"
                        style={{ borderLeft: `3px solid ${s.border}` }}>
                        <div>
                            <p className="text-3xl font-semibold text-forest">{s.value}</p>
                            <p className="text-xs mt-1" style={{ color: '#8a7e6e' }}>{s.label}</p>
                        </div>
                        {s.icon}
                    </div>
                ))}
            </div>

            {/* Quick actions */}
            <div>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#8a7e6e', fontSize: 9 }}>Quick Actions</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickLinks.map(link => (
                        <Link key={link.label} href={link.href}
                            className="group glass-card rounded-xl p-5 transition-all flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                                style={{ background: 'rgba(26,26,26,0.05)', border: '0.5px solid #D1CDC7', color: '#1A1A1A' }}>
                                {link.icon}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-forest group-hover:text-gold transition-colors">{link.label}</p>
                                <p className="text-xs mt-1" style={{ color: '#8a7e6e' }}>{link.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
