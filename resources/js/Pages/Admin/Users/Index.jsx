import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={active
                ? { background: 'rgba(34,197,94,0.1)', color: '#15803d', border: '0.5px solid rgba(34,197,94,0.3)' }
                : { background: 'rgba(239,68,68,0.1)',  color: '#b91c1c', border: '0.5px solid rgba(239,68,68,0.3)' }}>
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
        <button onClick={copy}
            className="ml-2 text-xs underline transition-colors"
            style={{ color: copied ? '#15803d' : '#121417' }}>
            {copied ? 'Copied!' : 'Copy'}
        </button>
    );
}

function initials(name = '') {
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
}

// ── Field component ────────────────────────────────────────────────────────
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
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#121417' }}
            onFocus={e => e.target.style.borderColor = '#121417'}
            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
            {...props}
        />
    );
}

function Select({ children, ...props }) {
    return (
        <select
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{ border: '0.5px solid #D1CDC7', background: '#fff', color: '#121417' }}
            onFocus={e => e.target.style.borderColor = '#121417'}
            onBlur={e => e.target.style.borderColor = '#D1CDC7'}
            {...props}
        >
            {children}
        </select>
    );
}

function Btn({ variant = 'default', className = '', ...props }) {
    const styles = {
        default: { background: '#fff', color: '#121417', border: '0.5px solid #D1CDC7' },
        primary: { background: '#121417', color: '#fff',     border: '0.5px solid #0e1012' },
        gold:    { background: '#121417', color: '#fff',  border: '0.5px solid #121417' },
        danger:  { background: '#fef2f2', color: '#b91c1c',  border: '0.5px solid rgba(239,68,68,0.3)' },
    };
    return (
        <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity disabled:opacity-50 whitespace-nowrap ${className}`}
            style={styles[variant]}
            {...props}
        />
    );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function UsersIndex({ users, roles }) {
    const { flash } = usePage().props;

    const [showCreate,      setShowCreate]      = useState(false);
    const [showCredentials, setShowCredentials] = useState(false);
    const [credentials,     setCredentials]     = useState(null);
    const [editingUser,     setEditingUser]      = useState(null);
    const [confirmDeact,    setConfirmDeact]     = useState(null);

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

    return (
        <AuthenticatedLayout title="User Management" breadcrumb="Create and manage all portal accounts">
            <Head title="Users" />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {statCards.map(s => (
                    <div key={s.label} className="bg-white rounded-xl p-4"
                        style={{ border: '0.5px solid #D1CDC7', borderLeft: `4px solid ${s.left}` }}>
                        <p className="text-2xl font-semibold text-forest">{s.value}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#888480' }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #D1CDC7' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4"
                    style={{ borderBottom: '0.5px solid #D1CDC7' }}>
                    <h3 className="text-sm font-medium text-forest">All Users</h3>
                    <Btn variant="primary" onClick={() => setShowCreate(true)}>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <line x1="8" y1="2" x2="8" y2="14"/><line x1="2" y1="8" x2="14" y2="8"/>
                        </svg>
                        New User
                    </Btn>
                </div>

                {/* ── Desktop table (md+) ── */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '0.5px solid #D1CDC7', background: '#F9F8F6' }}>
                                {['Name', 'Username', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider"
                                        style={{ color: '#888480' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr key={user.id}
                                    style={{
                                        borderBottom: i < users.length - 1 ? '0.5px solid #F9F8F6' : 'none',
                                        opacity: user.is_active ? 1 : 0.45,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#fdfcfa'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                                style={{ background: 'rgba(18,20,23,0.06)', color: '#121417' }}>
                                                {initials(user.name)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-forest">{user.name}</div>
                                                {user.must_change_password && (
                                                    <span className="text-xs" style={{ color: '#d97706' }}>Temp password</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 font-mono text-xs" style={{ color: '#4A4A4A' }}>
                                        {user.username ?? '—'}
                                    </td>
                                    <td className="px-5 py-3.5 text-sm" style={{ color: '#4A4A4A' }}>
                                        {user.email}
                                    </td>
                                    <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                                    <td className="px-5 py-3.5"><StatusBadge active={user.is_active} /></td>
                                    <td className="px-5 py-3.5 whitespace-nowrap w-px">
                                        <div className="flex items-center gap-2">
                                            <Btn onClick={() => openEdit(user)}>Edit</Btn>
                                            <Btn onClick={() => handleResetPassword(user)}>Reset PW</Btn>
                                            {user.is_active && (
                                                <Btn variant="danger" onClick={() => setConfirmDeact(user)}>
                                                    Deactivate
                                                </Btn>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-sm" style={{ color: '#888480' }}>
                                        No users yet. Create one above.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Mobile cards (< md) ── */}
                <div className="md:hidden divide-y" style={{ borderColor: '#F9F8F6' }}>
                    {users.length === 0 && (
                        <div className="px-4 py-10 text-center text-sm" style={{ color: '#888480' }}>
                            No users yet. Tap New User above.
                        </div>
                    )}
                    {users.map(user => (
                        <div key={user.id} className="p-4"
                            style={{ borderBottom: '0.5px solid #F9F8F6', opacity: user.is_active ? 1 : 0.45 }}>
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                                    style={{ background: 'rgba(18,20,23,0.06)', color: '#121417' }}>
                                    {initials(user.name)}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-forest">{user.name}</span>
                                        <RoleBadge role={user.role} />
                                        <StatusBadge active={user.is_active} />
                                    </div>
                                    <div className="text-xs mt-1 truncate" style={{ color: '#888480' }}>{user.email}</div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="font-mono text-xs" style={{ color: '#888480' }}>{user.username ?? '—'}</span>
                                        {user.must_change_password && (
                                            <span className="text-xs ml-1" style={{ color: '#d97706' }}>· Temp password</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Actions */}
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
                            Username and temporary password are auto-generated. The user must change their password on first login.
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

                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#F9F8F6', border: '0.5px solid #D1CDC7' }}>
                        {[
                            { label: 'Username',          value: credentials?.username },
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
                                className="rounded" style={{ accentColor: '#121417' }} />
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
