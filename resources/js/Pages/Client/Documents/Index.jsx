import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024)        return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function mimeLabel(mimeType) {
    const m = (mimeType ?? '').toLowerCase();
    if (m.includes('pdf'))                                              return { label: 'PDF',  color: '#e53e3e' };
    if (m.includes('word') || m.includes('doc'))                       return { label: 'DOC',  color: '#2b6cb0' };
    if (m.includes('sheet') || m.includes('excel') || m.includes('xls')) return { label: 'XLS', color: '#276749' };
    if (m.includes('presentation') || m.includes('ppt'))               return { label: 'PPT',  color: '#c05621' };
    if (m.includes('image') || m.includes('png') || m.includes('jpg')) return { label: 'IMG',  color: '#6b46c1' };
    if (m.includes('zip') || m.includes('rar'))                        return { label: 'ZIP',  color: '#b7791f' };
    if (m.includes('text') || m.includes('plain'))                     return { label: 'TXT',  color: '#4a5568' };
    return { label: 'FILE', color: '#888480' };
}

function FileTypeBadge({ mimeType }) {
    const { label, color } = mimeLabel(mimeType);
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: `${color}14`, color, border: `0.5px solid ${color}33` }}>
            {label}
        </span>
    );
}

function FileIcon({ mimeType }) {
    const { color } = mimeLabel(mimeType);
    return (
        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}12`, border: `1px solid ${color}22` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
            </svg>
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientDocumentsIndex({ documents }) {
    return (
        <AuthenticatedLayout title="Documents" breadcrumb="Files shared by your project manager">
            <Head title="Documents" />

            <div className="max-w-4xl mx-auto">
                {/* Header card */}
                <div className="glass-card rounded-2xl px-6 sm:px-8 py-6 mb-5">
                    <p className="text-xs uppercase tracking-widest mb-1 font-medium"
                        style={{ color: '#B2945B', letterSpacing: '0.1em', fontSize: 10 }}>
                        Project Documents
                    </p>
                    <h1 className="text-lg font-semibold text-forest">
                        Files &amp; Documents
                    </h1>
                    <p className="text-xs mt-1" style={{ color: '#8a7e6e' }}>
                        Documents shared by your project manager. Click Download to save any file.
                    </p>
                </div>

                {documents.length === 0 ? (
                    <div className="glass-card rounded-2xl px-8 py-16 text-center">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: '#F1F1EF' }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#888480" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-forest mb-1">No documents yet</p>
                        <p className="text-xs" style={{ color: '#888480' }}>
                            Documents shared by your project manager will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {/* Table header */}
                        <div className="hidden sm:grid px-5 py-3"
                            style={{
                                gridTemplateColumns: '1fr 80px 80px 110px',
                                borderBottom: '0.5px solid #E8E6E2',
                                background: '#FDFCFA',
                            }}>
                            {['FILE', 'TYPE', 'SIZE', 'ACTIONS'].map(h => (
                                <span key={h} className="text-xs font-semibold uppercase tracking-wider"
                                    style={{ color: '#888480', letterSpacing: '0.06em' }}>
                                    {h}
                                </span>
                            ))}
                        </div>

                        {/* Rows */}
                        {documents.map((doc, i) => (
                            <div key={doc.id}
                                className="flex sm:grid items-center gap-3 px-5 py-4 flex-wrap sm:flex-nowrap"
                                style={{
                                    gridTemplateColumns: '1fr 80px 80px 110px',
                                    borderBottom: i < documents.length - 1 ? '0.5px solid #F1F1EF' : 'none',
                                }}>
                                {/* File */}
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <FileIcon mimeType={doc.mime_type} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-forest truncate leading-snug">
                                            {doc.filename}
                                        </p>
                                        {doc.project_name && (
                                            <p className="text-xs mt-0.5 truncate" style={{ color: '#8a7e6e' }}>
                                                {doc.project_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Type */}
                                <div className="flex-shrink-0">
                                    <FileTypeBadge mimeType={doc.mime_type} />
                                </div>

                                {/* Size */}
                                <div className="flex-shrink-0">
                                    <span className="text-xs" style={{ color: '#888480' }}>
                                        {formatBytes(doc.file_size)}
                                    </span>
                                </div>

                                {/* Download */}
                                <div className="flex-shrink-0">
                                    <a href={doc.download_url}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                        style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"
                                            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 13h10"/>
                                        </svg>
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
