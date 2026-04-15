import { Head } from '@inertiajs/react'

export default function ClientDashboard() {
    return (
        <>
            <Head title="My Project" />
            <div style={{ padding: '2rem', fontFamily: 'DM Sans, sans-serif' }}>
                <h1 style={{ color: '#1a3c2e', marginBottom: '0.5rem' }}>
                    Client portal
                </h1>
                <p style={{ color: '#8a7e6e' }}>
                    Phase 1 scaffold complete. Build Phase 11 for the full dashboard.
                </p>
            </div>
        </>
    )
}