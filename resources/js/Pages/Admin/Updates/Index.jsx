import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function UpdatesIndex({ updates }) {
    return (
        <AuthenticatedLayout title="Updates" breadcrumb="All progress updates across projects">
            <div className="max-w-4xl">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-semibold text-forest">Progress Updates</h1>
                    <p className="text-sm mt-0.5" style={{ color: '#8a7e6e' }}>
                        {updates.length} update{updates.length !== 1 ? 's' : ''} across all projects
                    </p>
                </div>

                {/* Updates list */}
                <div className="bg-white rounded-2xl" style={{ border: '0.5px solid #e4ddd2' }}>
                    {updates.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm" style={{ color: '#8a7e6e' }}>
                            No progress updates yet.
                        </div>
                    ) : (
                        <div>
                            <div className="px-6 pt-5 pb-3">
                                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#8a7e6e', fontSize: 10 }}>
                                    Progress Updates
                                </span>
                            </div>
                            <ul>
                                {updates.map((update, i) => (
                                    <li key={update.id}
                                        className="flex gap-4 px-6 py-4"
                                        style={{
                                            borderTop: i === 0 ? 'none' : '0.5px solid #f0ebe3',
                                        }}
                                    >
                                        {/* Dot */}
                                        <div className="flex-shrink-0 mt-1.5">
                                            <span
                                                className="block w-2 h-2 rounded-full"
                                                style={{ background: i === 0 ? '#c9a84c' : '#d1c9be' }}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    {update.project_id ? (
                                                        <Link
                                                            href={route('admin.projects.show', update.project_id)}
                                                            className="text-sm font-medium hover:underline"
                                                            style={{ color: '#1a3a2a' }}
                                                        >
                                                            {update.title}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-sm font-medium" style={{ color: '#1a3a2a' }}>
                                                            {update.title}
                                                        </span>
                                                    )}
                                                    <div className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>
                                                        {[update.project_name, update.stage_name, update.author_name]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </div>
                                                </div>
                                                <span
                                                    className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
                                                    style={{ background: '#f5f0e8', color: '#8a7e6e', fontSize: 11 }}
                                                >
                                                    {update.date}
                                                </span>
                                            </div>
                                            {update.body && (
                                                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#5a5040' }}>
                                                    {update.body}
                                                </p>
                                            )}
                                            {update.photos?.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {update.photos.map((url, idx) => (
                                                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                            <img
                                                                src={url}
                                                                alt=""
                                                                className="w-16 h-16 object-cover rounded-lg"
                                                                style={{ border: '0.5px solid #e4ddd2' }}
                                                            />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
