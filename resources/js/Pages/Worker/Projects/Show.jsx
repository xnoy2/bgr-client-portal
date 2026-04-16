import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGE_LABELS = {
    completed:   'Completed',
    in_progress: 'In Progress',
    pending:     'Pending',
};

const STAGE_STYLE = {
    completed:   { bg: '#1a3c2e', border: '#1a3c2e', text: '#fff', line: '#1a3c2e' },
    in_progress: { bg: '#c9a84c', border: '#b8943c', text: '#fff', line: '#e4ddd2' },
    pending:     { bg: '#f5f0e8', border: '#ddd5c8', text: '#b0a090', line: '#e4ddd2' },
};

// ── Icons ─────────────────────────────────────────────────────────────────────

function CheckIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,8 7,12 13,4"/>
        </svg>
    );
}

function DotIcon() {
    return <span className="w-2.5 h-2.5 rounded-full block" style={{ background: 'white' }} />;
}

function StageIcon({ status }) {
    if (status === 'completed')   return <CheckIcon />;
    if (status === 'in_progress') return <DotIcon />;
    return null;
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 64, stroke = 5 }) {
    const r    = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute inset-0 -rotate-90">
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke}/>
                <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#c9a84c" strokeWidth={stroke}
                    strokeDasharray={circ}
                    strokeDashoffset={circ - (pct / 100) * circ}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }}/>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-white leading-none">{pct}%</span>
            </div>
        </div>
    );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange }) {
    return (
        <div className="flex p-1 rounded-2xl mb-6" style={{ background: '#ebe5dc' }}>
            {tabs.map(t => (
                <button key={t} onClick={() => onChange(t)}
                    className="flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200"
                    style={active === t
                        ? { background: '#fff', color: '#1a3c2e', boxShadow: '0 2px 8px rgba(0,0,0,0.10)' }
                        : { color: '#9a8d7e' }
                    }>
                    {t}
                </button>
            ))}
        </div>
    );
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ photos, startIndex, onClose }) {
    const [idx, setIdx] = useState(startIndex);

    const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
    const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

    // Keyboard navigation
    useEffect(() => {
        function onKey(e) {
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape')     onClose();
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [prev, next, onClose]);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const hasPrev = photos.length > 1;
    const hasNext = photos.length > 1;

    return (
        <div className="fixed inset-0 z-[60] flex flex-col"
            style={{ background: 'rgba(5,12,8,0.95)', backdropFilter: 'blur(8px)' }}>

            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {idx + 1} / {photos.length}
                </span>
                <div className="flex items-center gap-2">
                    <a href={photos[idx]} download target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                        title="Open full size">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M8 2v8M5 7l3 3 3-3"/><path d="M3 13h10"/>
                        </svg>
                    </a>
                    <button onClick={onClose}
                        className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Main image area */}
            <div className="flex-1 flex items-center justify-center relative min-h-0 px-14">
                {/* Prev button */}
                {hasPrev && (
                    <button onClick={prev}
                        className="absolute left-2 flex items-center justify-center w-10 h-10 rounded-full transition-all z-10"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="10,3 5,8 10,13"/>
                        </svg>
                    </button>
                )}

                {/* Image */}
                <img
                    key={idx}
                    src={photos[idx]}
                    alt={`Photo ${idx + 1}`}
                    className="max-w-full max-h-full rounded-xl object-contain"
                    style={{ maxHeight: 'calc(100vh - 160px)', userSelect: 'none' }}
                />

                {/* Next button */}
                {hasNext && (
                    <button onClick={next}
                        className="absolute right-2 flex items-center justify-center w-10 h-10 rounded-full transition-all z-10"
                        style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6,3 11,8 6,13"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
                <div className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto">
                    {photos.map((src, i) => (
                        <button key={i} onClick={() => setIdx(i)}
                            className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
                            style={{
                                width: 48, height: 48,
                                opacity: i === idx ? 1 : 0.4,
                                border: i === idx ? '2px solid #c9a84c' : '2px solid transparent',
                                transform: i === idx ? 'scale(1.08)' : 'scale(1)',
                            }}>
                            <img src={src} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Camera Capture ────────────────────────────────────────────────────────────

function CameraCapture({ onCapture, onClose }) {
    const videoRef  = useRef(null);
    const canvasRef = useRef(null);
    const [facing, setFacing] = useState('environment');
    const [error,  setError]  = useState(null);
    const [ready,  setReady]  = useState(false);

    useEffect(() => {
        let stream = null;
        setReady(false);
        setError(null);

        async function start() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false,
                });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => setReady(true);
                }
            } catch {
                setError('Camera access was denied. Please allow camera permissions in your browser and try again.');
            }
        }

        start();
        return () => { stream?.getTracks().forEach(t => t.stop()); };
    }, [facing]);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    function shoot() {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || !ready) return;
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(blob => {
            const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
            onClose();
        }, 'image/jpeg', 0.92);
    }

    return (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#000' }}>
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 z-10"
                style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)' }}>
                <button onClick={onClose}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                    </svg>
                </button>
                <span className="text-white text-sm font-semibold opacity-80">Camera</span>
                <button onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                    title="Flip camera">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                        <path d="M1 4l3-3 3 3M4 1v8"/><path d="M15 12l-3 3-3-3M12 15V7"/>
                        <rect x="1" y="6" width="6" height="5" rx="1" opacity="0.4"/><rect x="9" y="5" width="6" height="5" rx="1" opacity="0.4"/>
                    </svg>
                </button>
            </div>

            {/* Viewfinder */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {error ? (
                    <div className="text-center px-8">
                        <svg width="40" height="40" viewBox="0 0 16 16" fill="none" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-4">
                            <path d="M1 5.5A1.5 1.5 0 012.5 4H4l1-2h6l1 2h1.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z"/>
                            <circle cx="8" cy="9" r="2.5"/><line x1="8" y1="7.5" x2="8" y2="9" stroke="#fca5a5"/><circle cx="8" cy="10.5" r="0.3" fill="#fca5a5" stroke="none"/>
                        </svg>
                        <p className="text-white text-sm leading-relaxed opacity-80">{error}</p>
                    </div>
                ) : (
                    <video ref={videoRef} autoPlay playsInline muted
                        className="w-full h-full object-cover" />
                )}
            </div>

            {/* Controls */}
            {!error && (
                <div className="flex-shrink-0 flex items-center justify-center py-8"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
                    <button onClick={shoot} disabled={!ready}
                        className="w-18 h-18 rounded-full flex items-center justify-center transition-transform active:scale-95"
                        style={{
                            width: 72, height: 72,
                            background: ready ? '#fff' : 'rgba(255,255,255,0.3)',
                            border: '4px solid rgba(255,255,255,0.5)',
                            boxShadow: ready ? '0 0 0 3px rgba(201,168,76,0.5)' : 'none',
                        }}>
                        <svg width="22" height="22" viewBox="0 0 16 16" fill="none"
                            stroke={ready ? '#1a3c2e' : 'rgba(255,255,255,0.5)'}
                            strokeWidth="1.8" strokeLinecap="round">
                            <path d="M1 5.5A1.5 1.5 0 012.5 4H4l1-2h6l1 2h1.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z"/>
                            <circle cx="8" cy="9" r="2.5"/>
                        </svg>
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}

// ── Post Update Modal ─────────────────────────────────────────────────────────

function PostUpdateModal({ ghlId, stages, initialStageId, onClose }) {
    const [title,       setTitle]      = useState('');
    const [body,        setBody]       = useState('');
    const [stageId,     setStageId]    = useState(initialStageId ?? '');
    const [photos,      setPhotos]     = useState([]);
    const [previews,    setPreviews]   = useState([]);
    const [busy,        setBusy]       = useState(false);
    const [showCamera,  setShowCamera] = useState(false);
    const fileRef = useRef(null);

    function addFiles(files) {
        const arr = Array.from(files);
        setPhotos(p => [...p, ...arr]);
        arr.forEach(f => {
            const r = new FileReader();
            r.onload = e => setPreviews(p => [...p, e.target.result]);
            r.readAsDataURL(f);
        });
    }

    function remove(i) {
        setPhotos(p => p.filter((_, j) => j !== i));
        setPreviews(p => p.filter((_, j) => j !== i));
    }

    function submit(e) {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setBusy(true);
        const fd = new FormData();
        fd.append('title', title);
        fd.append('body',  body);
        if (stageId) fd.append('stage_id', stageId);
        photos.forEach((f, i) => fd.append(`photos[${i}]`, f));
        router.post(route('worker.projects.update.post', ghlId), fd, {
            forceFormData: true,
            onSuccess: () => { onClose(); },
            onFinish:  () => setBusy(false),
        });
    }

    if (showCamera) return (
        <CameraCapture
            onCapture={file => addFiles([file])}
            onClose={() => setShowCamera(false)}
        />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'rgba(14,32,25,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full sm:max-w-lg bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
                style={{ maxHeight: '92vh' }}>

                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#ddd5c8' }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Post Update</h2>
                        {stageId && stages?.find(s => String(s.id) === stageId)?.name && (
                            <p className="text-xs mt-0.5 flex items-center gap-1.5" style={{ color: '#8a7e6e' }}>
                                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#c9a84c' }}/>
                                {stages.find(s => String(s.id) === stageId).name}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                        style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                {/* Scrollable form */}
                <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Title <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Groundworks complete"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'}
                        />
                    </div>

                    {/* Stage picker */}
                    {stages?.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                                Stage
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {stages.map(s => {
                                    const active = stageId === String(s.id);
                                    const dot = s.status === 'completed' ? '#1a3c2e' : s.status === 'in_progress' ? '#c9a84c' : '#d4c9b7';
                                    return (
                                        <button key={s.id} type="button"
                                            onClick={() => setStageId(active ? '' : String(s.id))}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                            style={active
                                                ? { background: '#1a3c2e', color: '#c9a84c', border: '1.5px solid #1a3c2e' }
                                                : { background: '#f8f5f0', color: '#6b5e4a', border: '1.5px solid #ede8df' }
                                            }>
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? '#c9a84c' : dot }} />
                                            {s.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            What was done <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <textarea rows={4} value={body} onChange={e => setBody(e.target.value)}
                            placeholder="Describe what was completed, any issues, next steps…"
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'}
                        />
                    </div>

                    {/* Photos */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                                Photos
                            </label>
                            <span className="text-xs" style={{ color: photos.length >= 10 ? '#c9a84c' : '#a09487' }}>
                                {photos.length}/10
                            </span>
                        </div>

                        {/* Previews grid */}
                        {previews.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mb-3">
                                {previews.map((src, i) => (
                                    <div key={i} className="relative rounded-xl overflow-hidden"
                                        style={{ aspectRatio: '1', border: '1px solid #ede8df' }}>
                                        <img src={src} alt="" className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => remove(i)}
                                            className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{ background: 'rgba(0,0,0,0.55)' }}>
                                            <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add buttons — always visible while under limit */}
                        {photos.length < 10 && (
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-colors"
                                    style={{ border: '1.5px dashed #d4c9b7', background: '#fafaf8', color: '#6b5e4a' }}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <rect x="2" y="3" width="12" height="10" rx="1.5"/>
                                        <circle cx="6" cy="7" r="1.2"/>
                                        <path d="M2 11l3-3 2.5 2.5 2-2.5L14 11"/>
                                    </svg>
                                    {previews.length > 0 ? 'Add More' : 'Gallery'}
                                </button>
                                <button type="button" onClick={() => setShowCamera(true)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-colors"
                                    style={{ border: '1.5px dashed #d4c9b7', background: '#fafaf8', color: '#6b5e4a' }}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <path d="M1 5.5A1.5 1.5 0 012.5 4H4l1-2h6l1 2h1.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z"/>
                                        <circle cx="8" cy="9" r="2.5"/>
                                    </svg>
                                    Camera
                                </button>
                            </div>
                        )}

                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1 pb-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={busy || !title.trim() || !body.trim()}
                            className="flex-2 py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                            style={{
                                flex: 2,
                                background: busy || !title.trim() || !body.trim() ? '#a0b8a8' : '#1a3c2e',
                                color: '#c9a84c',
                                cursor: busy || !title.trim() || !body.trim() ? 'not-allowed' : 'pointer',
                            }}>
                            {busy ? (
                                <>
                                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                                    </svg>
                                    Posting…
                                </>
                            ) : 'Post Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Edit Update Modal ─────────────────────────────────────────────────────────

function EditUpdateModal({ ghlId, update, stages, onClose }) {
    const [title,      setTitle]     = useState(update.title);
    const [body,       setBody]      = useState(update.body);
    const [stageId,    setStageId]   = useState(update.stage_id ? String(update.stage_id) : '');
    const [keptPhotos, setKept]      = useState(update.photos ?? []);
    const [newPhotos,  setNewPhotos] = useState([]);
    const [previews,   setPreviews]  = useState([]);
    const [busy,       setBusy]      = useState(false);
    const [showCamera, setShowCamera]= useState(false);
    const fileRef = useRef(null);

    function addFiles(files) {
        const arr = Array.from(files);
        setNewPhotos(p => [...p, ...arr]);
        arr.forEach(f => {
            const r = new FileReader();
            r.onload = e => setPreviews(p => [...p, e.target.result]);
            r.readAsDataURL(f);
        });
    }

    function removeKept(url) { setKept(p => p.filter(u => u !== url)); }
    function removeNew(i) {
        setNewPhotos(p => p.filter((_, j) => j !== i));
        setPreviews(p => p.filter((_, j) => j !== i));
    }

    const totalPhotos = keptPhotos.length + newPhotos.length;

    function submit(e) {
        e.preventDefault();
        if (!title.trim() || !body.trim()) return;
        setBusy(true);
        const fd = new FormData();
        fd.append('title', title);
        fd.append('body',  body);
        fd.append('_method', 'PUT');
        if (stageId) fd.append('stage_id', stageId);
        keptPhotos.forEach((url, i) => fd.append(`kept_photos[${i}]`, url));
        newPhotos.forEach((f, i)   => fd.append(`new_photos[${i}]`, f));
        router.post(route('worker.projects.update.edit', { ghlId, updateId: update.id }), fd, {
            forceFormData: true,
            onSuccess: () => onClose(),
            onFinish:  () => setBusy(false),
        });
    }

    if (showCamera) return (
        <CameraCapture onCapture={file => addFiles([file])} onClose={() => setShowCamera(false)} />
    );

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ background: 'rgba(14,32,25,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className="w-full sm:max-w-lg bg-white flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden"
                style={{ maxHeight: '92vh' }}>

                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full" style={{ background: '#ddd5c8' }} />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid #f0ebe3' }}>
                    <div>
                        <h2 className="text-base font-bold text-forest">Edit Update</h2>
                        <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>Changes visible to client immediately</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full"
                        style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Title <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'} />
                    </div>

                    {/* Stage picker */}
                    {stages?.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>Stage</label>
                            <div className="flex flex-wrap gap-2">
                                {stages.map(s => {
                                    const active = stageId === String(s.id);
                                    const dot = s.status === 'completed' ? '#1a3c2e' : s.status === 'in_progress' ? '#c9a84c' : '#d4c9b7';
                                    return (
                                        <button key={s.id} type="button"
                                            onClick={() => setStageId(active ? '' : String(s.id))}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                                            style={active
                                                ? { background: '#1a3c2e', color: '#c9a84c', border: '1.5px solid #1a3c2e' }
                                                : { background: '#f8f5f0', color: '#6b5e4a', border: '1.5px solid #ede8df' }}>
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: active ? '#c9a84c' : dot }} />
                                            {s.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div>
                        <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: '#6b5e4a' }}>
                            Remarks <span style={{ color: '#c9a84c' }}>*</span>
                        </label>
                        <textarea rows={4} value={body} onChange={e => setBody(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl text-sm text-forest outline-none resize-none"
                            style={{ background: '#f8f5f0', border: '1.5px solid #ede8df' }}
                            onFocus={e => e.target.style.borderColor = '#c9a84c'}
                            onBlur={e => e.target.style.borderColor = '#ede8df'} />
                    </div>

                    {/* Photos */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6b5e4a' }}>Photos</label>
                            <span className="text-xs" style={{ color: totalPhotos >= 10 ? '#c9a84c' : '#a09487' }}>{totalPhotos}/10</span>
                        </div>

                        {/* Existing photos */}
                        {keptPhotos.length > 0 && (
                            <>
                                <p className="text-xs mb-1.5" style={{ color: '#a09487' }}>Existing — tap × to remove</p>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {keptPhotos.map((url, i) => (
                                        <div key={i} className="relative rounded-xl overflow-hidden"
                                            style={{ aspectRatio: '1', border: '1px solid #ede8df' }}>
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeKept(url)}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: 'rgba(0,0,0,0.55)' }}>
                                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* New photo previews */}
                        {previews.length > 0 && (
                            <>
                                <p className="text-xs mb-1.5" style={{ color: '#a09487' }}>New photos</p>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {previews.map((src, i) => (
                                        <div key={i} className="relative rounded-xl overflow-hidden"
                                            style={{ aspectRatio: '1', border: '1px solid #ede8df' }}>
                                            <img src={src} alt="" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeNew(i)}
                                                className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                                style={{ background: 'rgba(0,0,0,0.55)' }}>
                                                <svg width="8" height="8" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                                                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {totalPhotos < 10 && (
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => fileRef.current?.click()}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold"
                                    style={{ border: '1.5px dashed #d4c9b7', background: '#fafaf8', color: '#6b5e4a' }}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="7" r="1.2"/><path d="M2 11l3-3 2.5 2.5 2-2.5L14 11"/>
                                    </svg>
                                    Add Photos
                                </button>
                                <button type="button" onClick={() => setShowCamera(true)}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold"
                                    style={{ border: '1.5px dashed #d4c9b7', background: '#fafaf8', color: '#6b5e4a' }}>
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                        <path d="M1 5.5A1.5 1.5 0 012.5 4H4l1-2h6l1 2h1.5A1.5 1.5 0 0115 5.5v7A1.5 1.5 0 0113.5 14h-11A1.5 1.5 0 011 12.5v-7z"/><circle cx="8" cy="9" r="2.5"/>
                                    </svg>
                                    Camera
                                </button>
                            </div>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-1 pb-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-sm font-semibold"
                            style={{ background: '#f5f0e8', color: '#6b5e4a' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={busy || !title.trim() || !body.trim()}
                            className="py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity"
                            style={{
                                flex: 2,
                                background: busy || !title.trim() || !body.trim() ? '#a0b8a8' : '#1a3c2e',
                                color: '#c9a84c',
                                cursor: busy || !title.trim() || !body.trim() ? 'not-allowed' : 'pointer',
                            }}>
                            {busy ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ project, ghl }) {
    const rows = [
        { label: 'Status',          value: project.status?.replace('_', ' ') || '—', capitalize: true },
        { label: 'Address',         value: project.address || '—' },
        { label: 'Client',          value: project.client?.name || '—' },
        { label: 'Start date',      value: project.start_date || '—' },
        { label: 'Est. completion', value: project.estimated_completion || '—' },
        { label: 'GHL stage',       value: ghl?.stage_name || '—' },
    ];

    return (
        <div className="space-y-3">
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0ebe3' }}>
                {rows.map((r, i) => (
                    <div key={r.label} className="flex items-start gap-3 px-4 py-3.5"
                        style={{ borderBottom: i < rows.length - 1 ? '1px solid #f8f4ef' : 'none' }}>
                        <span className="text-xs font-medium flex-shrink-0 mt-0.5 w-28" style={{ color: '#a09487' }}>
                            {r.label}
                        </span>
                        <span className="text-sm font-semibold text-forest capitalize flex-1">{r.value}</span>
                    </div>
                ))}
            </div>

            {project.workers?.length > 0 && (
                <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ebe3' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#a09487' }}>Team</p>
                    <div className="flex flex-wrap gap-2">
                        {project.workers.map(w => (
                            <div key={w.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                                style={{ background: 'rgba(26,60,46,0.06)', border: '1px solid rgba(26,60,46,0.12)' }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                    style={{ background: '#1a3c2e', color: '#c9a84c', fontSize: 9 }}>
                                    {w.name[0]?.toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-forest">{w.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Stages tab ────────────────────────────────────────────────────────────────

function StagesTab({ project, onPostUpdate }) {
    const [saving, setSaving] = useState(false);

    function advance(order) {
        if (saving) return;
        setSaving(true);
        router.put(
            route('worker.projects.stage.update', project.ghl_opportunity_id),
            { stage_order: order },
            { onFinish: () => setSaving(false) }
        );
    }

    const currentOrder = project.stages?.find(s => s.status === 'in_progress')?.order ?? 0;
    const currentStage = project.stages?.find(s => s.status === 'in_progress');

    return (
        <div className="space-y-3">
            {/* Timeline card */}
            <div className="bg-white rounded-2xl p-4" style={{ border: '1px solid #f0ebe3' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#a09487' }}>
                    Pipeline
                </p>
                {/* Mobile vertical */}
                <div className="flex flex-col sm:hidden">
                    {project.stages?.map((stage, i) => {
                        const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                        const isLast = i === (project.stages.length - 1);
                        return (
                            <div key={stage.id} className="flex gap-3">
                                <div className="flex flex-col items-center" style={{ width: 32 }}>
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ background: s.bg, border: `2px solid ${s.border}` }}>
                                        <StageIcon status={stage.status} />
                                        {stage.status === 'pending' && (
                                            <span style={{ fontSize: 10, fontWeight: 700, color: s.text }}>{stage.order}</span>
                                        )}
                                    </div>
                                    {!isLast && (
                                        <div className="w-0.5 flex-1 my-1" style={{ background: s.line, minHeight: 20 }} />
                                    )}
                                </div>
                                <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-4'}`} style={{ paddingTop: 4 }}>
                                    <p className="text-sm font-semibold leading-tight" style={{ color: stage.status === 'pending' ? '#a09487' : '#1a3c2e' }}>
                                        {stage.name}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: stage.status === 'in_progress' ? '#b8943c' : '#b0a090' }}>
                                        {STAGE_LABELS[stage.status]}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {/* Desktop horizontal */}
                <div className="hidden sm:flex items-start">
                    {project.stages?.map((stage, i) => {
                        const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                        const isLast = i === (project.stages.length - 1);
                        return (
                            <div key={stage.id} className="flex items-start flex-1 min-w-0">
                                <div className="flex flex-col items-center flex-1 min-w-0 px-1">
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                                        style={{ background: s.bg, border: `2px solid ${s.border}` }}>
                                        <StageIcon status={stage.status} />
                                        {stage.status === 'pending' && (
                                            <span style={{ fontSize: 10, fontWeight: 700, color: s.text }}>{stage.order}</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-center font-semibold leading-tight"
                                        style={{ color: stage.status === 'pending' ? '#a09487' : '#1a3c2e' }}>
                                        {stage.name}
                                    </p>
                                    <p className="text-xs text-center mt-0.5"
                                        style={{ color: stage.status === 'in_progress' ? '#b8943c' : '#b0a090' }}>
                                        {STAGE_LABELS[stage.status]}
                                    </p>
                                </div>
                                {!isLast && (
                                    <div className="flex-shrink-0 h-0.5 mt-4"
                                        style={{ width: 20, background: stage.status === 'completed' ? '#1a3c2e' : '#e4ddd2' }} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stage action cards */}
            {project.stages?.map(stage => {
                const s       = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                const isActive = stage.status === 'in_progress';
                const canStart = stage.status === 'pending' && stage.order === currentOrder + 1;
                if (!isActive && !canStart) return null;

                return (
                    <div key={stage.id} className="rounded-2xl p-4"
                        style={{
                            background: isActive ? 'linear-gradient(135deg, rgba(201,168,76,0.08), rgba(201,168,76,0.04))' : '#fff',
                            border: isActive ? '1.5px solid rgba(201,168,76,0.35)' : '1px solid #f0ebe3',
                        }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: s.bg, border: `2px solid ${s.border}` }}>
                                <StageIcon status={stage.status} />
                                {stage.status === 'pending' && (
                                    <span style={{ fontSize: 11, fontWeight: 700, color: s.text }}>{stage.order}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                {isActive && (
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#c9a84c' }}/>
                                        <span className="text-xs font-semibold" style={{ color: '#b8943c' }}>In Progress</span>
                                    </div>
                                )}
                                <p className="text-sm font-bold text-forest leading-tight">{stage.name}</p>
                                <p className="text-xs mt-0.5" style={{ color: '#a09487' }}>Stage {stage.order} of {project.stages.length}</p>
                            </div>
                            <div className="flex-shrink-0">
                                {isActive && stage.order < 5 && (
                                    <button onClick={() => advance(stage.order + 1)} disabled={saving}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity"
                                        style={{ background: '#1a3c2e', color: '#c9a84c', opacity: saving ? 0.5 : 1 }}>
                                        {saving ? '…' : 'Complete ✓'}
                                    </button>
                                )}
                                {canStart && (
                                    <button onClick={() => advance(stage.order)} disabled={saving}
                                        className="px-4 py-2 rounded-xl text-xs font-bold transition-opacity"
                                        style={{ background: 'rgba(201,168,76,0.15)', color: '#b8943c', border: '1px solid rgba(201,168,76,0.3)', opacity: saving ? 0.5 : 1 }}>
                                        {saving ? '…' : 'Start →'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* All other stages (read-only) */}
            {project.stages?.filter(s => s.status !== 'in_progress' && !(s.status === 'pending' && s.order === currentOrder + 1)).map(stage => {
                const s = STAGE_STYLE[stage.status] ?? STAGE_STYLE.pending;
                return (
                    <div key={stage.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
                        style={{ border: '1px solid #f0ebe3' }}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: s.bg, border: `2px solid ${s.border}` }}>
                            <StageIcon status={stage.status} />
                            {stage.status === 'pending' && (
                                <span style={{ fontSize: 10, fontWeight: 700, color: s.text }}>{stage.order}</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold leading-tight"
                                style={{ color: stage.status === 'pending' ? '#a09487' : '#1a3c2e' }}>
                                {stage.name}
                            </p>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                            style={stage.status === 'completed'
                                ? { background: 'rgba(26,60,46,0.08)', color: '#1a3c2e' }
                                : { background: '#f5f0e8', color: '#a09487' }
                            }>
                            {STAGE_LABELS[stage.status]}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Facebook-style photo grid ─────────────────────────────────────────────────

function PhotoGrid({ photos, onOpen }) {
    const count = photos.length;
    if (count === 0) return null;

    const overflow = count - 4;

    const wrap = {
        borderRadius: 12,
        overflow: 'hidden',
        border: '1.5px solid #e4ddd2',
        background: '#e4ddd2',
    };

    function Cell({ src, idx, moreCount }) {
        return (
            <div className="relative overflow-hidden"
                style={{ cursor: 'pointer', height: '100%' }}
                onClick={() => onOpen(idx)}
                onMouseEnter={e => e.currentTarget.querySelector('img').style.transform = 'scale(1.04)'}
                onMouseLeave={e => e.currentTarget.querySelector('img').style.transform = 'scale(1)'}>
                <img src={src} alt=""
                    className="w-full h-full object-cover block"
                    style={{ transition: 'transform 0.2s' }} />
                {moreCount > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                        style={{ background: 'rgba(0,0,0,0.55)' }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                            <rect x="1" y="3" width="9" height="7" rx="1.2"/><rect x="6" y="6" width="9" height="7" rx="1.2"/>
                        </svg>
                        <span className="text-white font-bold leading-none" style={{ fontSize: 22 }}>+{moreCount}</span>
                        <span className="text-white font-medium" style={{ fontSize: 11, opacity: 0.85 }}>View more</span>
                    </div>
                )}
            </div>
        );
    }

    // 1 photo — centered, contained
    if (count === 1) return (
        <div style={{ ...wrap, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f5f0e8', minHeight: 160, maxHeight: 260, overflow: 'hidden', padding: 8 }}
            onClick={() => onOpen(0)}>
            <img src={photos[0]} alt=""
                style={{ maxWidth: '100%', maxHeight: 244, objectFit: 'contain', borderRadius: 8, cursor: 'pointer', display: 'block' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
        </div>
    );

    // 2 photos — side by side
    if (count === 2) return (
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, aspectRatio: '2/1' }}>
            <Cell src={photos[0]} idx={0} />
            <Cell src={photos[1]} idx={1} />
        </div>
    );

    // 3 photos — big left, two stacked right
    if (count === 3) return (
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, aspectRatio: '4/3' }}>
            <div style={{ gridRow: 'span 2' }}><Cell src={photos[0]} idx={0} /></div>
            <Cell src={photos[1]} idx={1} />
            <Cell src={photos[2]} idx={2} />
        </div>
    );

    // 4+ photos — 2×2, last cell shows +N if more
    return (
        <div style={{ ...wrap, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2, aspectRatio: '4/3' }}>
            <Cell src={photos[0]} idx={0} />
            <Cell src={photos[1]} idx={1} />
            <Cell src={photos[2]} idx={2} />
            <Cell src={photos[3]} idx={3} moreCount={overflow > 0 ? overflow : 0} />
        </div>
    );
}

// ── Updates tab ───────────────────────────────────────────────────────────────

function UpdatesTab({ updates, onPostUpdate, ghlId, stages }) {
    const [lightbox,   setLightbox]  = useState(null);
    const [editUpdate, setEditUpdate]= useState(null); // update object being edited

    return (
        <div className="space-y-3">
            {lightbox && (
                <Lightbox
                    photos={lightbox.photos}
                    startIndex={lightbox.index}
                    onClose={() => setLightbox(null)}
                />
            )}

            {editUpdate && (
                <EditUpdateModal
                    ghlId={ghlId}
                    update={editUpdate}
                    stages={stages}
                    onClose={() => setEditUpdate(null)}
                />
            )}

            {/* CTA */}

            <button onClick={() => onPostUpdate(null)}
                className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: '#1a3c2e', color: '#c9a84c' }}
                onMouseEnter={e => e.currentTarget.style.background = '#142e23'}
                onMouseLeave={e => e.currentTarget.style.background = '#1a3c2e'}>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>
                </svg>
                Post New Update
            </button>

            {updates?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
            {updates.map(u => {
                const photos = u.photos ?? [];
                return (
                    <div key={u.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0ebe3' }}>

                        {/* Post header */}
                        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #1a3c2e, #2d5a42)', color: '#c9a84c' }}>
                                    {(u.author ?? 'T')[0]?.toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold leading-tight text-forest">
                                        {u.author ?? 'Project Team'}
                                    </p>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <p className="text-xs" style={{ color: '#a09487' }}>{u.created_at}</p>
                                        {u.stage_name && (
                                            <>
                                                <span style={{ color: '#d4c9b7', fontSize: 10 }}>·</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                                                    style={{ background: 'rgba(201,168,76,0.12)', color: '#b8943c' }}>
                                                    {u.stage_name}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {u.is_mine && (
                                <button
                                    onClick={() => setEditUpdate(u)}
                                    className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-colors"
                                    style={{ background: '#f5f0e8' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.15)'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#f5f0e8'}
                                    title="Edit update">
                                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#8a7e6e" strokeWidth="2" strokeLinecap="round">
                                        <path d="M11 2l3 3-8 8H3v-3l8-8z"/>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Title + body */}
                        <div className="px-4 pb-3">
                            <p className="text-base font-semibold text-forest mb-1">{u.title}</p>
                            <p className="text-sm leading-relaxed" style={{ color: '#4a3f30' }}>{u.body}</p>
                        </div>

                        {/* Photo grid — full bleed */}
                        {photos.length > 0 && (
                            <PhotoGrid photos={photos} onOpen={idx => setLightbox({ photos, index: idx })} />
                        )}

                        {/* Footer */}
                        <div className="px-4 py-3 flex items-center gap-1.5"
                            style={{ borderTop: photos.length > 0 ? '0.5px solid #f5f0e8' : 'none' }}>
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#b0a090" strokeWidth="1.5" strokeLinecap="round">
                                <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                            </svg>
                            <span className="text-xs" style={{ color: '#b0a090' }}>Project update from BGR Building</span>
                        </div>
                    </div>
                );
            })}
            </div>
            ) : (
                <div className="bg-white rounded-2xl p-10 text-center" style={{ border: '1px solid #f0ebe3' }}>
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                        style={{ background: '#f5f0e8' }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round">
                            <path d="M14 10c0 .6-.4 1-1 1H4l-2 3V3c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v7z"/>
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-forest mb-1">No updates yet</p>
                    <p className="text-xs" style={{ color: '#a09487' }}>Tap the button above to post your first update.</p>
                </div>
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TABS = ['Overview', 'Stages', 'Updates'];

export default function WorkerProjectShow({ project, ghl, updates }) {
    const [tab,            setTab]         = useState('Stages');
    const [modalOpen,      setModal]       = useState(false);
    const [initialStageId, setInitialStage] = useState(null);

    function openModal(stageId) { setInitialStage(stageId ? String(stageId) : null); setModal(true); }

    return (
        <AuthenticatedLayout
            title={project.name}
            breadcrumb={
                <span className="flex items-center gap-1.5 text-xs">
                    <Link href={route('worker.dashboard')} style={{ color: '#c9a84c' }}>My Projects</Link>
                    <span style={{ color: '#d0c8bc' }}>/</span>
                    <span className="truncate" style={{ color: '#6b5e4a' }}>{project.name}</span>
                </span>
            }>
            <Head title={project.name} />


            {/* Hero */}
            <div className="rounded-2xl p-5 mb-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #0e2019 100%)' }}>
                {/* Subtle texture */}
                <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle at 80% 20%, #c9a84c 0%, transparent 60%)',
                }} />

                <div className="relative flex items-start gap-4">
                    <ProgressRing pct={project.progress_pct} size={64} stroke={5} />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(201,168,76,0.6)', fontSize: 9 }}>
                            {ghl?.stage_name ?? 'Your Project'}
                        </p>
                        <h1 className="text-lg font-bold text-white leading-snug mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                            {project.name}
                        </h1>
                        {project.address && (
                            <p className="text-xs mb-2 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z"/>
                                    <circle cx="8" cy="6" r="1.5"/>
                                </svg>
                                {project.address}
                            </p>
                        )}
                        {/* Progress bar */}
                        <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${project.progress_pct}%`, background: 'linear-gradient(90deg, rgba(201,168,76,0.6), #c9a84c)' }} />
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs font-bold" style={{ color: '#c9a84c' }}>
                                {project.completed_stages ?? 0}/{project.total_stages ?? 0} stages
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <TabBar tabs={TABS} active={tab} onChange={setTab} />

            {tab === 'Overview' && <OverviewTab project={project} ghl={ghl} />}
            {tab === 'Stages'   && <StagesTab   project={project} onPostUpdate={openModal} />}
            {tab === 'Updates'  && <UpdatesTab  updates={updates} onPostUpdate={openModal} ghlId={project.ghl_opportunity_id} stages={project.stages} />}

            {modalOpen && (
                <PostUpdateModal
                    ghlId={project.ghl_opportunity_id}
                    stages={project.stages}
                    initialStageId={initialStageId}
                    onClose={() => setModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}
