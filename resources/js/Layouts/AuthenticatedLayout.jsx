import { Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// ── Toast system ───────────────────────────────────────────────────────────────

function Toast({ toasts, remove }) {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
            style={{ maxWidth: 360 }}>
            {toasts.map(t => (
                <div key={t.id}
                    className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-lg pointer-events-auto"
                    style={{
                        background: t.type === 'success' ? '#1e2226' : '#7f1d1d',
                        border: `0.5px solid ${t.type === 'success' ? 'rgba(255,255,255,0.1)' : 'rgba(239,68,68,0.3)'}`,
                        animation: 'toast-in 0.25s ease',
                        minWidth: 260,
                    }}>
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                        {t.type === 'success' ? (
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round">
                                <polyline points="2,8 6,12 14,4"/>
                            </svg>
                        ) : (
                            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="#fca5a5" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        )}
                    </div>
                    {/* Message */}
                    <p className="flex-1 text-sm font-medium leading-snug"
                        style={{ color: t.type === 'success' ? 'rgba(255,255,255,0.9)' : '#fecaca' }}>
                        {t.message}
                    </p>
                    {/* Dismiss */}
                    <button onClick={() => remove(t.id)}
                        className="flex-shrink-0 mt-0.5 opacity-50 hover:opacity-100 transition-opacity">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                            stroke={t.type === 'success' ? 'rgba(255,255,255,0.6)' : '#fca5a5'}
                            strokeWidth="2.5" strokeLinecap="round">
                            <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    );
}

// Global styles injected once
if (typeof document !== 'undefined' && !document.getElementById('toast-style')) {
    const s = document.createElement('style');
    s.id = 'toast-style';
    s.textContent = [
        `@keyframes toast-in { from { opacity:0; transform:translateX(24px); } to { opacity:1; transform:translateX(0); } }`,
        `.glass-card { background: rgba(255,255,255,0.75) !important; backdrop-filter: blur(16px) !important; -webkit-backdrop-filter: blur(16px) !important; border: 0.5px solid rgba(255,255,255,0.9) !important; box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.8) !important; }`,
        `.glass-card:hover { background: rgba(255,255,255,0.88) !important; box-shadow: 0 8px 32px rgba(0,0,0,0.09), 0 1px 0 rgba(255,255,255,0.9) !important; }`,
        `body { font-family: 'Inter', system-ui, sans-serif; }`,
    ].join('\n');
    document.head.appendChild(s);
}

// ── SVG Icon primitive ─────────────────────────────────────────────────────
const paths = {
    grid:      <><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></>,
    briefcase: <><rect x="2" y="5" width="12" height="9" rx="1.5"/><path d="M5 5V3.5A1.5 1.5 0 016.5 2h3A1.5 1.5 0 0111 3.5V5"/><line x1="2" y1="9" x2="14" y2="9"/></>,
    users:     <><path d="M10 8a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2 14a5 5 0 0110 0"/><path d="M12 6a2 2 0 110-4 2 2 0 010 4M14 13a4 4 0 00-3-3.87"/></>,
    layers:    <><polygon points="8,2 14,5.5 8,9 2,5.5"/><path d="M2 9.5l6 3.5 6-3.5"/><path d="M2 12l6 3.5 6-3.5"/></>,
    list:      <><line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="10" y2="12"/></>,
    image:     <><rect x="2" y="3" width="12" height="10" rx="1.5"/><circle cx="6" cy="7" r="1.2"/><path d="M2 11l3-3 2.5 2.5 2-2.5L14 11"/></>,
    file:      <><path d="M4 1h6l3 3v10H4V1z"/><path d="M10 1v3h3M6 7h4M6 10h3"/></>,
    edit:      <><path d="M11 2l3 3-8 8H3v-3l8-8z"/></>,
    tool:      <><path d="M10 2a4 4 0 01-1.2 7l-6 6a1 1 0 01-1.4-1.4l6-6A4 4 0 0110 2z"/></>,
    logout:    <><path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3"/><polyline points="7 10 10 7 7 4"/><line x1="10" y1="7" x2="3" y2="7"/></>,
    menu:      <><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="14" y2="12"/></>,
    close:     <><line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/></>,
    bell:      <><path d="M8 2a5 5 0 015 5v2l1 2H2l1-2V7a5 5 0 015-5z"/><path d="M6.5 13a1.5 1.5 0 003 0"/></>,
    user:      <><path d="M8 8a3 3 0 100-6 3 3 0 000 6z"/><path d="M2 14a6 6 0 0112 0"/></>,
};
const Icon = ({ name, size = 15 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
        className="flex-shrink-0">
        {paths[name]}
    </svg>
);

// ── Nav per role ───────────────────────────────────────────────────────────
function getNav(role) {
    if (role === 'admin') return [
        { label: 'Dashboard',     icon: 'grid',      href: () => route('admin.dashboard'),      active: () => route().current('admin.dashboard') },
        { label: 'Projects',      icon: 'briefcase', href: () => route('admin.projects.index'), active: () => route().current('admin.projects.*') },
        { label: 'Users',         icon: 'users',     href: () => route('admin.users.index'),    active: () => route().current('admin.users.*') },
        { label: 'Updates',       icon: 'list',      href: () => route('admin.updates.index'),  active: () => route().current('admin.updates.*') },
        { label: 'Variations',    icon: 'edit',      href: () => route('admin.variations.index'), active: () => route().current('admin.variations.*') },
        { label: 'Proposals',     icon: 'file',      href: () => route('admin.proposals.index'),  active: () => route().current('admin.proposals.*') },
    ];
    if (role === 'worker') return [
        { label: 'My Projects',   icon: 'briefcase', href: () => route('worker.dashboard'),   active: () => route().current('worker.dashboard') || route().current('worker.projects.*') },
    ];
    return [
        { label: 'My Projects', icon: 'briefcase', href: () => route('client.dashboard'),        active: () => route().current('client.dashboard') || route().current('client.projects.*') },
        { label: 'Documents',   icon: 'file',      href: () => route('client.documents.index'),  active: () => route().current('client.documents.*') },
        { label: 'Variations',  icon: 'edit',      href: () => route('client.variations.index'), active: () => route().current('client.variations.*') },
        { label: 'Proposals',   icon: 'file',      href: () => route('client.proposals.index'),  active: () => route().current('client.proposals.*') },
    ];
}

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

// ── Sidebar content (shared between desktop + mobile drawer) ───────────────
function SidebarContent({ user, role, nav, onNavigate }) {
    const logout = (e) => { e.preventDefault(); router.post(route('logout')); };

    return (
        <>
            {/* Brand */}
            <div style={{ padding: '24px 20px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                        style={{ background: 'rgba(178,148,91,0.15)', border: '0.5px solid rgba(178,148,91,0.3)' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 1.5L13 4.5V10.5L8 13.5L3 10.5V4.5L8 1.5Z" stroke="#B2945B" strokeWidth="1.2" fill="rgba(178,148,91,0.1)"/>
                            <circle cx="8" cy="7.5" r="1.8" fill="#B2945B"/>
                        </svg>
                    </div>
                    <div>
                        <div className="text-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.9)', letterSpacing: '0.04em' }}>
                            BGR Client Portal
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'rgba(178,148,91,0.65)' }}>Ballycastle</div>
                    </div>
                </div>
                <div className="text-xs uppercase tracking-widest mt-2 pl-11" style={{ color: 'rgba(255,255,255,0.22)', fontSize: 10 }}>
                    {role === 'admin' ? 'Admin Panel' : role === 'worker' ? 'Worker Portal' : 'Client Portal'}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto p-3 flex flex-col" style={{ gap: 1 }}>
                {nav.map((item) => {
                    const href     = typeof item.href === 'function' ? item.href() : item.href;
                    const isActive = item.active ? item.active() : false;

                    return (
                        <Link key={item.label} href={href}
                            onClick={(e) => {
                                if (item.soon) { e.preventDefault(); return; }
                                onNavigate?.();
                            }}
                            title={item.soon ? 'Coming soon' : undefined}
                            className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm transition-all duration-150 relative select-none"
                            style={isActive
                                ? { background: 'rgba(178,148,91,0.12)', color: '#B2945B', fontWeight: 500 }
                                : { color: item.soon ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.42)' }
                            }
                            onMouseEnter={e => !isActive && !item.soon && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                            onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}
                        >
                            {isActive && (
                                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r"
                                    style={{ background: '#B2945B' }} />
                            )}
                            <Icon name={item.icon} />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                                <span className="text-xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                                    style={{ background: 'rgba(178,148,91,0.2)', color: '#B2945B', fontSize: 9 }}>
                                    {item.badge}
                                </span>
                            )}
                            {item.soon && (
                                <span className="flex-shrink-0" style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>soon</span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '12px', borderTop: '0.5px solid rgba(255,255,255,0.07)' }}>
                <Link href={route('profile.edit')} onClick={onNavigate}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all duration-150 mb-0.5"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 text-xs font-semibold"
                        style={{ background: 'rgba(178,148,91,0.15)', border: '1px solid rgba(178,148,91,0.3)', color: '#B2945B' }}>
                        {initials(user?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{user?.name}</div>
                        <div className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.28)' }}>{role}</div>
                    </div>
                </Link>
                <button onClick={logout}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg w-full text-left transition-all duration-150"
                    style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon name="logout" />
                    <span>Log out</span>
                </button>
            </div>
        </>
    );
}

// ── Main layout ────────────────────────────────────────────────────────────
export default function AuthenticatedLayout({ title, breadcrumb, children }) {
    const { auth, flash } = usePage().props;
    const user  = auth.user;
    const role  = user?.roles?.[0] ?? 'client';
    const nav   = getNav(role);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notifOpen,  setNotifOpen]  = useState(false);
    const notifRef = useRef(null);

    const [toasts, setToasts] = useState([]);
    const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));
    const addToast = (message, type) => {
        const id = Date.now() + Math.random();
        setToasts(t => [...t, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    };

    // Fire toast whenever flash changes
    useEffect(() => {
        if (flash?.success) addToast(flash.success, 'success');
        if (flash?.error)   addToast(flash.error,   'error');
    }, [flash?.success, flash?.error]);

    // Close drawer on Inertia navigation
    useEffect(() => {
        const close = () => setDrawerOpen(false);
        document.addEventListener('inertia:navigate', close);
        return () => document.removeEventListener('inertia:navigate', close);
    }, []);

    // Lock body scroll when drawer open
    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    // Close notif on outside click
    useEffect(() => {
        const handler = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Escape key closes both
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') { setDrawerOpen(false); setNotifOpen(false); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const sidebarStyle = { width: 240, background: '#25282D', borderRight: '0.5px solid rgba(255,255,255,0.06)' };

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: 'linear-gradient(135deg, #F1F1EF 0%, #E8E6E2 100%)' }}>

            {/* ── Desktop sidebar (always visible ≥ lg) ── */}
            <aside className="hidden lg:flex flex-col flex-shrink-0" style={sidebarStyle}>
                <SidebarContent user={user} role={role} nav={nav} />
            </aside>

            {/* ── Mobile drawer backdrop ── */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity duration-300 ${
                    drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                onClick={() => setDrawerOpen(false)}
            />

            {/* ── Mobile sidebar drawer ── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col lg:hidden
                    transition-transform duration-300 ease-in-out
                    ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={sidebarStyle}
            >
                {/* Close button */}
                <button
                    onClick={() => setDrawerOpen(false)}
                    className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)' }}
                    aria-label="Close menu"
                >
                    <Icon name="close" size={13} />
                </button>
                <SidebarContent user={user} role={role} nav={nav} onNavigate={() => setDrawerOpen(false)} />
            </aside>

            {/* ── Main content area ── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">

                {/* Topbar */}
                <header
                    className="flex items-center gap-3 px-4 sm:px-6 flex-shrink-0"
                    style={{ height: 60, background: 'rgba(241,241,239,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(209,205,199,0.7)', boxShadow: '0 1px 0 rgba(255,255,255,0.8)' }}
                >
                    {/* Hamburger — mobile only */}
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 transition-colors"
                        style={{ background: '#E8E6E2', border: '0.5px solid #D1CDC7', color: '#4A4A4A' }}
                        aria-label="Open menu"
                    >
                        <Icon name="menu" size={15} />
                    </button>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-forest truncate">{title ?? 'Dashboard'}</div>
                        {breadcrumb && (
                            <div className="text-xs truncate hidden sm:block" style={{ color: '#8a7e6e' }}>{breadcrumb}</div>
                        )}
                    </div>

                    {/* Bell */}
                    <div className="relative flex-shrink-0" ref={notifRef}>
                        <button
                            onClick={() => setNotifOpen(o => !o)}
                            className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
                            style={{ background: '#E8E6E2', border: '0.5px solid #D1CDC7', color: '#4A4A4A' }}
                            aria-label="Notifications"
                        >
                            <Icon name="bell" size={16} />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                                style={{ background: '#B2945B', border: '1.5px solid #F1F1EF' }} />
                        </button>

                        {notifOpen && (
                            <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-xl z-50"
                                style={{ border: '0.5px solid #D1CDC7' }}>
                                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '0.5px solid #D1CDC7' }}>
                                    <span className="text-sm font-medium text-forest">Notifications</span>
                                    <button className="text-xs" style={{ color: '#B2945B' }}>Mark all read</button>
                                </div>
                                <div className="flex gap-2.5 px-4 py-3">
                                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#B2945B' }} />
                                    <div>
                                        <div className="text-xs text-forest leading-snug">Welcome to the BGR Client Portal</div>
                                        <div className="text-xs mt-1" style={{ color: '#8a7e6e' }}>Just now</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <Toast toasts={toasts} remove={removeToast} />

                {/* Scrollable content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
