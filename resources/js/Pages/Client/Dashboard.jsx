import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function ClientDashboard() {
    return (
        <AuthenticatedLayout title="My Project" breadcrumb="Client portal">
            <Head title="My Project" />

            <div className="rounded-2xl p-6 mb-5 flex items-start justify-between"
                style={{ background: '#1a3c2e', border: '0.5px solid rgba(201,168,76,0.15)' }}>
                <div>
                    <h1 className="text-2xl text-white font-serif font-normal mb-1">Welcome back</h1>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your project &nbsp;·&nbsp; <span style={{ color: 'rgba(201,168,76,0.8)' }}>Project manager assigned</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: 'rgba(201,168,76,0.6)', fontSize: 9 }}>Current stage</p>
                    <span className="text-sm font-medium px-3 py-1.5 rounded-full"
                        style={{ color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '0.5px solid rgba(201,168,76,0.25)' }}>
                        In Progress
                    </span>
                </div>
            </div>

            <div className="bg-white rounded-xl p-8 text-center" style={{ border: '0.5px solid #e4ddd2' }}>
                <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#e4ddd2" strokeWidth="1.2" strokeLinecap="round" className="mx-auto mb-3">
                    <rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="7" r="1.2"/><path d="M2 11l3-3 2.5 2.5 2-2.5L14 11"/>
                </svg>
                <p className="text-sm font-medium text-forest mb-1">Your project portal is being set up</p>
                <p className="text-xs" style={{ color: '#8a7e6e' }}>Progress updates, photos, documents, and variation requests will appear here once your project is active.</p>
            </div>
        </AuthenticatedLayout>
    );
}
