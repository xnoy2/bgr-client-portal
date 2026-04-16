import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function WorkerDashboard() {
    return (
        <AuthenticatedLayout title="Dashboard" breadcrumb="Worker portal">
            <Head title="Worker Dashboard" />

            <div className="rounded-2xl p-6 mb-5 flex items-start justify-between"
                style={{ background: '#1a3c2e', border: '0.5px solid rgba(201,168,76,0.15)' }}>
                <div>
                    <h1 className="text-2xl text-white font-serif font-normal mb-1">Worker Dashboard</h1>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your assigned projects and tasks
                    </p>
                </div>
                <span className="text-sm font-medium px-3 py-1.5 rounded-full mt-1"
                    style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.25)' }}>
                    Active
                </span>
            </div>

            <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #e4ddd2' }}>
                <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#e4ddd2" strokeWidth="1.2" strokeLinecap="round" className="mx-auto mb-3">
                    <polygon points="8,2 14,5.5 8,9 2,5.5"/><path d="M2 9.5l6 3.5 6-3.5"/><path d="M2 12l6 3.5 6-3.5"/>
                </svg>
                <p className="text-sm font-medium text-forest mb-1">Stage Manager coming soon</p>
                <p className="text-xs" style={{ color: '#8a7e6e' }}>Project assignments, progress updates, and media uploads will appear here.</p>
            </div>
        </AuthenticatedLayout>
    );
}
