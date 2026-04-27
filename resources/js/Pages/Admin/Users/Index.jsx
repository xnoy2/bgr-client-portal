import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';

// ── Helpers ────────────────────────────────────────────────────────────────
const ROLE_STYLE = {
    admin:  { bg: 'rgba(139,92,246,0.1)',  color: '#6d28d9', border: 'rgba(139,92,246,0.3)'  },
    worker: { bg: 'rgba(59,130,246,0.1)',  color: '#1d4ed8', border: 'rgba(59,130,246,0.3)'  },
    client: { bg: 'rgba(34,197,94,0.1)',   color: '#15803d', border: 'rgba(34,197,94,0.3)'   },
};

function RoleBadge({ role }) {
    const s = ROLE_STYLE[role] ?? { bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
    return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            style={{ background: s.bg, color: s.color, border: `0.5px solid ${s.border}` }}>
            {role ?? '—'}
        </span>
    );
}

function StatusBadge({ active }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={active
                ? { background: 'rgba(34,197,94,0.1)', color: '#15803d', border: '0.5px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(239,68,68,0.1)',  color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#22c55e' : '#ef4444' }} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function CopyButton({ value }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <button onClick={copy} className="ml-2 text-xs underline transition-colors"
            style={{ color: copied ? '#15803d' : '#25282D' }}>
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

const AVATAR_COLORS = ['#6d28d9', '#1d4ed8', '#15803d', '#b45309', '#be123c', '#0e7490'];
function avatarColor(id) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }

// ── Design primitives ──────────────────────────────────────────────────────
function Field({ label, children, error }) {
    return (
        <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A4A4A', letterSpacing: '0.03em' }}>
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
            {...props}
        />
    );
}

function Select({ children, ...props }) {
    return (
        <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#25282D' }}
            onFocus={e => e.target.style.borderColor = '#25282D'}
            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
            {...props}>
            {children}
        </select>
    );
}

function Btn({ variant = 'default', className = '', ...props }) {
    const styles = {
        default: { background: '#fff',     color: '#25282D', border: '0.5px solid #D1CDC7' },
        primary: { background: '#25282D',  color: '#fff',    border: '0.5px solid #25282D' },
        danger:  { background: '#fef2f2',  color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' },
        ghost:   { background: 'transparent', color: '#888480', border: 'none' },
    };
    return (
        <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50 whitespace-nowrap ${className}`}
            style={styles[variant]}
            {...props}
        />
    );
}

// ── Sort icon ──────────────────────────────────────────────────────────────
function SortIcon({ col, sortCol, sortDir }) {
    const active = sortCol === col;
    return (
        <span className="ml-1 inline-flex flex-col gap-0.5" style={{ opacity: active ? 1 : 0.3 }}>
            <svg width="7" height="5" viewBox="0 0 7 5" fill={active && sortDir === 'asc' ? '#25282D' : '#888480'}>
                <path d="M3.5 0L7 5H0z"/>
            </svg>
            <svg width="7" height="5" viewBox="0 0 7 5" fill={active && sortDir === 'desc' ? '#25282D' : '#888480'}>
                <path d="M3.5 5L0 0h7z"/>
            </svg>
        </span>
    );
}

// ── Page sizes ─────────────────────────────────────────────────────────────
const PAGE_SIZES = [10, 25, 50, 100];

// ── Page ───────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles }) {
    const { flash } = usePage().props;

    const [showCreate,      setShowCreate]      = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials,     setCredentials]     = useState(null);
    const [editingUser,     setEditingUser]      = useState(null);
    const [confirmDeact,    setConfirmDeact]     = useState(null);

    // DataTable state
    const [search,   setSearch]   = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortCol,  setSortCol]  = useState('name');
    const [sortDir,  setSortDir]  = useState('asc');
    const [page,     setPage]     = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const createForm    = useForm({ name: '', email: '', role: 'client' });
    const editForm      = useForm({ name: '', email: '', role: 'client', is_active: true });
    const resetForm     = useForm({});
    const deactivateForm = useForm({});

    useEffect(() => {
        if (flash?.created) {
            setCredentials(flash.created);
            setShowCreate(false);
            setShowCredentials(true);
            createForm.reset();
        }
    }, [flash?.created]);

    // Reset to page 1 when filters change
    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, sortCol, sortDir, pageSize]);

    const submitCreate = (e) => {
        e.preventDefault();
        createForm.post(route('admin.users.store'), { preserveScroll: true });
    };

    const openEdit = (user) => {
        setEditingUser(user);
        editForm.setData({ name: user.name, email: user.email, role: user.role ?? 'client', is_active: user.is_active });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(route('admin.users.update', editingUser.id), {
            preserveScroll: true,
            onSuccess: () => setEditingUser(null),
        });
    };

    const handleResetPassword = (user) => {
        if (!confirm(`Reset password for ${user.name}?`)) return;
        resetForm.post(route('admin.users.reset-password', user.id), { preserveScroll: true });
    };

    function toggleSort(col) {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    }

    // Filter + sort
    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return users
            .filter(u => {
                if (roleFilter !== 'all' && u.role !== roleFilter) return false;
                if (statusFilter === 'active' && !u.is_active) return false;
                if (statusFilter === 'inactive' && u.is_active) return false;
                if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
                return true;
            })
            .sort((a, b) => {
                let av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
                if (typeof av === 'string') av = av.toLowerCase();
                if (typeof bv === 'string') bv = bv.toLowerCase();
                if (av < bv) return sortDir === 'asc' ? -1 : 1;
                if (av > bv) return sortDir === 'asc' ? 1 : -1;
                return 0;
            });
    }, [users, search, roleFilter, statusFilter, sortCol, sortDir]);

    const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize);
    const fromRow     = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
    const toRow       = Math.min(page * pageSize, filtered.length);

    const counts = {
        total:  users.length,
        admin:  users.filter(u => u.role === 'admin').length,
        worker: users.filter(u => u.role === 'worker').length,
        client: users.filter(u => u.role === 'client').length,
    };

    const statCards = [
        { label: 'Total Users', value: counts.total,  left: '#D1CDC7' },
        { label: 'Admins',      value: counts.admin,  left: '#8b5cf6' },
        { label: 'Workers',     value: counts.worker, left: '#3b82f6' },
        { label: 'Clients',     value: counts.client, left: '#22c55e' },
    ];

    const thClass = "text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider select-none cursor-pointer whitespace-nowrap";
    const thStyle = { color: '#888480' };

    return (
        <AuthenticatedLayout title="User Management" breadcrumb="Create and manage all portal accounts">
            <Head title="Users" />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {statCards.map(s => (
                    <div key={s.label} className="glass-card rounded-xl p-4"
                        style={{ border: '0.5px solid #D1CDC7', borderLeft: `4px solid ${s.left}` }}>
                        <p className="text-2xl font-semibold text-forest">{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="glass-card rounded-xl overflow-hidden">

                {/* ── Toolbar ── */}
                <div className="px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{ borderBottom: '0.5px solid #E8E3DB' }}>

                    {/* Search */}
                    <div className="relative flex-1 max-w-xs">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                            width="13" height="13" viewBox="0 0 16 16" fill="none"
                            stroke="#aaa49e" strokeWidth="2" strokeLinecap="round">
                            <circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/>
                        </svg>
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or email…"
                            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                            style={{ background: '#faf8f5', border: '0.5px solid #E8E3DB', color: '#25282D' }}
                            onFocus={e => e.target.style.borderColor = '#25282D'}
                            onBlur={e => e.target.style.borderColor = '#E8E3DB'}
                        />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                                style={{ color: '#aaa49e' }}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: '#faf8f5', border: '0.5px solid #E8E3DB', color: '#4A4A4A' }}>
                            <option value="all">All Roles</option>
                            {roles.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                        </select>

                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
                            style={{ background: '#faf8f5', border: '0.5px solid #E8E3DB', color: '#4A4A4A' }}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
                            <button onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                                className="px-2.5 py-1.5 rounded-lg text-xs"
                                style={{ background: '#fef2f2', color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.25)' }}>
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="sm:ml-auto">
                        <Btn variant="primary" onClick={() => setShowCreate(true)}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
                            </svg>
                            New User
                        </Btn>
                    </div>
                </div>

                {/* ── Desktop table ── */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ background: '#faf8f5', borderBottom: '0.5px solid #E8E3DB' }}>
                                <th className={thClass} style={thStyle} onClick={() => toggleSort('name')}>
                                    Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir}/>
                                </th>
                                <th className={thClass} style={thStyle} onClick={() => toggleSort('email')}>
                                    Email <SortIcon col="email" sortCol={sortCol} sortDir={sortDir}/>
                                </th>
                                <th className={thClass} style={thStyle} onClick={() => toggleSort('role')}>
                                    Role <SortIcon col="role" sortCol={sortCol} sortDir={sortDir}/>
                                </th>
                                <th className={thClass} style={thStyle} onClick={() => toggleSort('is_active')}>
                                    Status <SortIcon col="is_active" sortCol={sortCol} sortDir={sortDir}/>
                                </th>
                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider w-px whitespace-nowrap"
                                    style={{ color: '#888480' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D1CDC7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                            </svg>
                                            <p className="text-sm font-medium" style={{ color: '#888480' }}>No users match your filters</p>
                                            <button onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                                                className="text-xs underline mt-1" style={{ color: '#25282D' }}>
                                                Clear filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginated.map((user, i) => (
                                <tr key={user.id}
                                    style={{
                                        borderBottom: i < paginated.length - 1 ? '0.5px solid #f5f0ea' : 'none',
                                        opacity: user.is_active ? 1 : 0.5,
                                        transition: 'background 0.1s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fdfcfa'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                                    <td className="px-4 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                                                style={{ background: avatarColor(user.id) }}>
                                                {initials(user.name)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-forest leading-tight">{user.name}</div>
                                                {user.must_change_password && (
                                                    <span className="text-xs" style={{ color: '#d97706' }}>Temp password</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3.5 text-sm" style={{ color: '#4A4A4A' }}>
                                        {user.email}
                                    </td>

                                    <td className="px-4 py-3.5">
                                        <RoleBadge role={user.role} />
                                    </td>

                                    <td className="px-4 py-3.5">
                                        <StatusBadge active={user.is_active} />
                                    </td>

                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Btn onClick={() => openEdit(user)}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 2a1.5 1.5 0 012 2L4 13H2v-2L11 2z"/>
                                                </svg>
                                                Edit
                                            </Btn>
                                            <Btn onClick={() => handleResetPassword(user)}>
                                                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M2 8a6 6 0 1010.93-3.25"/><polyline points="11 2 14 5 11 8"/>
                                                </svg>
                                                Reset PW
                                            </Btn>
                                            {user.is_active && (
                                                <Btn variant="danger" onClick={() => setConfirmDeact(user)}>
                                                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                        <circle cx="8" cy="8" r="6"/><line x1="5" y1="8" x2="11" y2="8"/>
                                                    </svg>
                                                    Deactivate
                                                </Btn>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Mobile cards ── */}
                <div className="md:hidden">
                    {paginated.length === 0 ? (
                        <div className="py-14 text-center">
                            <p className="text-sm" style={{ color: '#888480' }}>No users match your filters.</p>
                            <button onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); }}
                                className="text-xs underline mt-2" style={{ color: '#25282D' }}>
                                Clear filters
                            </button>
                        </div>
                    ) : paginated.map((user, i) => (
                        <div key={user.id} className="px-4 py-4"
                            style={{ borderBottom: i < paginated.length - 1 ? '0.5px solid #f5f0ea' : 'none', opacity: user.is_active ? 1 : 0.5 }}>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                                    style={{ background: avatarColor(user.id) }}>
                                    {initials(user.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-forest">{user.name}</span>
                                        <RoleBadge role={user.role} />
                                        <StatusBadge active={user.is_active} />
                                    </div>
                                    <div className="text-xs mt-0.5 truncate" style={{ color: '#888480' }}>{user.email}</div>
                                    {user.must_change_password && (
                                        <span className="text-xs mt-0.5 block" style={{ color: '#d97706' }}>Temp password</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                <Btn onClick={() => openEdit(user)}>Edit</Btn>
                                <Btn onClick={() => handleResetPassword(user)}>Reset PW</Btn>
                                {user.is_active && (
                                    <Btn variant="danger" onClick={() => setConfirmDeact(user)}>Deactivate</Btn>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Pagination footer ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5"
                    style={{ borderTop: '0.5px solid #E8E3DB', background: '#faf8f5' }}>

                    <div className="flex items-center gap-2 text-xs" style={{ color: '#888480' }}>
                        <span>Show</span>
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}
                            className="px-2 py-1 rounded-lg outline-none text-xs"
                            style={{ background: '#fff', border: '0.5px solid #E8E3DB', color: '#4A4A4A' }}>
                            {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span>
                            {filtered.length === 0
                                ? 'No results'
                                : `Showing ${fromRow}–${toRow} of ${filtered.length} user${filtered.length !== 1 ? 's' : ''}`
                            }
                            {filtered.length !== users.length && ` (filtered from ${users.length})`}
                        </span>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <Btn variant="ghost" disabled={page === 1} onClick={() => setPage(1)}
                                className="!px-2 !py-1" title="First">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="10,3 4,8 10,13"/><line x1="3" y1="3" x2="3" y2="13"/>
                                </svg>
                            </Btn>
                            <Btn variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="!px-2 !py-1" title="Previous">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="10,3 4,8 10,13"/>
                                </svg>
                            </Btn>

                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                                .reduce((acc, n, idx, arr) => {
                                    if (idx > 0 && n - arr[idx - 1] > 1) acc.push('…');
                                    acc.push(n);
                                    return acc;
                                }, [])
                                .map((n, i) => n === '…'
                                    ? <span key={`ellipsis-${i}`} className="px-1.5 text-xs" style={{ color: '#aaa49e' }}>…</span>
                                    : <button key={n} onClick={() => setPage(n)}
                                        className="w-7 h-7 rounded-lg text-xs font-medium transition-colors"
                                        style={page === n
                                            ? { background: '#25282D', color: '#fff' }
                                            : { background: 'transparent', color: '#4A4A4A' }}>
                                        {n}
                                    </button>
                                )
                            }

                            <Btn variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                className="!px-2 !py-1" title="Next">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="6,3 12,8 6,13"/>
                                </svg>
                            </Btn>
                            <Btn variant="ghost" disabled={page === totalPages} onClick={() => setPage(totalPages)}
                                className="!px-2 !py-1" title="Last">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="6,3 12,8 6,13"/><line x1="13" y1="3" x2="13" y2="13"/>
                                </svg>
                            </Btn>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Create Modal ── */}
            <Modal show={showCreate} onClose={() => { setShowCreate(false); createForm.reset(); }} maxWidth="md">
                <form onSubmit={submitCreate} className="p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-forest mb-4">Create New User</h2>
                    <div className="space-y-4">
                        <Field label="Full Name" error={createForm.errors.name}>
                            <Input value={createForm.data.name}
                                onChange={e => createForm.setData('name', e.target.value)}
                                placeholder="e.g. John Smith" autoFocus />
                        </Field>
                        <Field label="Email Address" error={createForm.errors.email}>
                            <Input type="email" value={createForm.data.email}
                                onChange={e => createForm.setData('email', e.target.value)}
                                placeholder="john@example.com" />
                        </Field>
                        <Field label="Role" error={createForm.errors.role}>
                            <Select value={createForm.data.role}
                                onChange={e => createForm.setData('role', e.target.value)}>
                                {roles.map(r => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </Select>
                        </Field>
                        <p className="text-xs" style={{ color: '#888480' }}>
                            A temporary password is auto-generated. The user must change their password on first login.
                        </p>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <Btn type="button" onClick={() => { setShowCreate(false); createForm.reset(); }}>Cancel</Btn>
                        <Btn variant="primary" type="submit" disabled={createForm.processing}>
                            {createForm.processing ? 'Creating…' : 'Create User'}
                        </Btn>
                    </div>
                </form>
            </Modal>

            {/* ── Credentials Modal ── */}
            <Modal show={showCredentials} onClose={() => setShowCredentials(false)} closeable={false} maxWidth="md">
                <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                            style={{ background: 'rgba(34,197,94,0.1)' }}>
                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round">
                                <polyline points="2,8 6,12 14,4"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-base font-semibold text-forest">User Created</h2>
                            <p className="text-xs" style={{ color: '#888480' }}>Share these credentials with {credentials?.name}</p>
                        </div>
                    </div>

                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#F1F1EF', border: '0.5px solid #D1CDC7' }}>
                        {[
                            { label: 'Email',              value: credentials?.email },
                            { label: 'Temporary Password', value: credentials?.password },
                        ].map(({ label, value }) => (
                            <div key={label}>
                                <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#888480', fontSize: 9 }}>{label}</p>
                                <div className="flex items-center gap-2">
                                    <code className="font-mono text-sm text-forest flex-1 break-all">{value}</code>
                                    <CopyButton value={value ?? ''} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="mt-3 text-xs" style={{ color: '#d97706' }}>
                        This password is shown once only. The user will be prompted to change it on first login.
                    </p>

                    <div className="mt-5 flex justify-end">
                        <Btn variant="primary" onClick={() => setShowCredentials(false)}>Done</Btn>
                    </div>
                </div>
            </Modal>

            {/* ── Edit Modal ── */}
            <Modal show={!!editingUser} onClose={() => setEditingUser(null)} maxWidth="md">
                <form onSubmit={submitEdit} className="p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-forest mb-4">Edit User</h2>
                    <div className="space-y-4">
                        <Field label="Full Name" error={editForm.errors.name}>
                            <Input value={editForm.data.name} onChange={e => editForm.setData('name', e.target.value)} />
                        </Field>
                        <Field label="Email Address" error={editForm.errors.email}>
                            <Input type="email" value={editForm.data.email} onChange={e => editForm.setData('email', e.target.value)} />
                        </Field>
                        <Field label="Role" error={editForm.errors.role}>
                            <Select value={editForm.data.role} onChange={e => editForm.setData('role', e.target.value)}>
                                {roles.map(r => (
                                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                                ))}
                            </Select>
                        </Field>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                            <input type="checkbox" checked={editForm.data.is_active}
                                onChange={e => editForm.setData('is_active', e.target.checked)}
                                className="rounded" style={{ accentColor: '#25282D' }} />
                            <span className="text-xs font-medium" style={{ color: '#4A4A4A' }}>Account Active</span>
                        </label>
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                        <Btn type="button" onClick={() => setEditingUser(null)}>Cancel</Btn>
                        <Btn variant="primary" type="submit" disabled={editForm.processing}>
                            {editForm.processing ? 'Saving…' : 'Save Changes'}
                        </Btn>
                    </div>
                </form>
            </Modal>

            {/* ── Deactivate Confirm ── */}
            <Modal show={!!confirmDeact} onClose={() => setConfirmDeact(null)} maxWidth="sm">
                <div className="p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-forest mb-2">Deactivate User</h2>
                    <p className="text-sm" style={{ color: '#4A4A4A' }}>
                        Are you sure you want to deactivate <strong>{confirmDeact?.name}</strong>?
                        They will no longer be able to log in.
                    </p>
                    <div className="mt-5 flex justify-end gap-2">
                        <Btn onClick={() => setConfirmDeact(null)}>Cancel</Btn>
                        <Btn variant="danger"
                            onClick={() => deactivateForm.delete(route('admin.users.destroy', confirmDeact.id), {
                                preserveScroll: true,
                                onSuccess: () => setConfirmDeact(null),
                            })}>
                            Deactivate
                        </Btn>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
