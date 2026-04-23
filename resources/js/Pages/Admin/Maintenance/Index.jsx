import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────

const ENQUIRY_STATUS_STYLES = {
    pending:   { bg: '#FEF3C7', color: '#92400E', label: 'Pending'   },
    reviewed:  { bg: '#DBEAFE', color: '#1E40AF', label: 'Reviewed'  },
    converted: { bg: '#D1FAE5', color: '#065F46', label: 'Converted' },
};

const SUB_STATUS_STYLES = {
    active:    { bg: '#D1FAE5', color: '#065F46', label: 'Active'    },
    paused:    { bg: '#FEF3C7', color: '#92400E', label: 'Paused'    },
    cancelled: { bg: '#FEE2E2', color: '#991B1B', label: 'Cancelled' },
};

const fieldStyle = { background: '#F8F7F5', border: '0.5px solid #D1CDC7', color: '#25282D' };

// ── Shared primitives ─────────────────────────────────────────────────────────

function Field({ label, children }) {
    return (
        <div>
            <label className="block text-xs font-medium text-forest mb-1">{label}</label>
            {children}
        </div>
    );
}

function Sel({ value, onChange, children }) {
    return (
        <select value={value} onChange={onChange} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle}>
            {children}
        </select>
    );
}

function Inp({ type = 'text', value, onChange, placeholder }) {
    return (
        <input type={type} value={value} onChange={onChange} placeholder={placeholder}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
    );
}

// ── Convert enquiry modal ─────────────────────────────────────────────────────

function ConvertModal({ enquiry, planLabels, onClose }) {
    const { data, setData, post, processing } = useForm({
        start_date:   '',
        renewal_date: '',
        notes:        '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.maintenance.enquiries.convert', enquiry.id), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                style={{ border: '0.5px solid #D1CDC7' }}>
                <div className="px-6 py-5" style={{ borderBottom: '0.5px solid #E8E6E2' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-forest">Convert to Subscription</h2>
                            <p className="text-xs mt-0.5" style={{ color: '#8a7e6e' }}>
                                {enquiry.client?.name} · {planLabels[enquiry.plan] ?? enquiry.plan}
                            </p>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#F1F1EF', color: '#6b6259' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/><line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    {/* Info banner */}
                    <div className="rounded-xl p-3 text-xs" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#065F46' }}>
                        This will create an <strong>Active</strong> subscription for this client and send them a notification. The enquiry will be marked as <strong>Converted</strong>.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Start Date">
                            <Inp type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                        </Field>
                        <Field label="Renewal Date">
                            <Inp type="date" value={data.renewal_date} onChange={e => setData('renewal_date', e.target.value)} />
                        </Field>
                    </div>
                    <Field label="Internal Notes (optional)">
                        <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                            placeholder="Any notes about this subscription…"
                            className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none" style={fieldStyle} />
                    </Field>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                            style={{ background: '#F1F1EF', color: '#6b6259', border: '0.5px solid #D1CDC7' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ background: '#065F46', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Converting…' : 'Confirm & Activate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Enquiry row ───────────────────────────────────────────────────────────────

function EnquiryRow({ enquiry, planLabels }) {
    const [open, setOpen]           = useState(false);
    const [converting, setConverting] = useState(false);

    const { data, setData, put, processing } = useForm({
        status:      enquiry.status === 'converted' ? 'reviewed' : enquiry.status,
        admin_notes: enquiry.admin_notes ?? '',
    });

    const statusStyle  = ENQUIRY_STATUS_STYLES[enquiry.status] ?? ENQUIRY_STATUS_STYLES.pending;
    const planName     = planLabels[enquiry.plan] ?? enquiry.plan;
    const isConverted  = enquiry.status === 'converted';

    const save = (e) => {
        e.preventDefault();
        put(route('admin.maintenance.enquiries.update', enquiry.id), {
            preserveScroll: true, onSuccess: () => setOpen(false),
        });
    };

    return (
        <>
            <div className="rounded-xl bg-white" style={{ border: '0.5px solid #E8E6E2' }}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-forest">{enquiry.client?.name}</span>
                            <span className="text-xs" style={{ color: '#8a7e6e' }}>{enquiry.client?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs font-medium" style={{ color: '#B2945B' }}>{planName}</span>
                            <span className="text-xs" style={{ color: '#b0a090' }}>{enquiry.created_at}</span>
                        </div>
                        {enquiry.message && (
                            <p className="text-xs mt-1 line-clamp-2 sm:truncate" style={{ color: '#6b6259' }}>
                                "{enquiry.message}"
                            </p>
                        )}
                        {enquiry.admin_notes && (
                            <p className="text-xs mt-1 italic" style={{ color: '#8a7e6e' }}>
                                Note: {enquiry.admin_notes}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                            style={{ background: statusStyle.bg, color: statusStyle.color }}>
                            {statusStyle.label}
                        </span>
                        {!isConverted && (
                            <>
                                <button onClick={() => setOpen(v => !v)}
                                    className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                                    style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                                    {open ? 'Close' : 'Review'}
                                </button>
                                <button onClick={() => setConverting(true)}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap"
                                    style={{ background: '#065F46', color: '#fff' }}>
                                    Convert →
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {open && !isConverted && (
                    <form onSubmit={save} className="px-4 sm:px-5 pb-5 pt-3 space-y-3"
                        style={{ borderTop: '0.5px solid #F0EDE9' }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Status">
                                <Sel value={data.status} onChange={e => setData('status', e.target.value)}>
                                    <option value="pending">Pending — not reviewed yet</option>
                                    <option value="reviewed">Reviewed — in discussion</option>
                                </Sel>
                            </Field>
                            <Field label="Admin Notes">
                                <Inp value={data.admin_notes} onChange={e => setData('admin_notes', e.target.value)} placeholder="Internal notes…" />
                            </Field>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={processing}
                                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                                style={{ background: '#B2945B', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                                {processing ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {converting && (
                <ConvertModal
                    enquiry={enquiry}
                    planLabels={planLabels}
                    onClose={() => setConverting(false)}
                />
            )}
        </>
    );
}

// ── Subscription row ──────────────────────────────────────────────────────────

function SubscriptionRow({ sub, plans, onDelete }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing } = useForm({
        plan:         sub.plan,
        status:       sub.status,
        start_date:   sub.start_date   ?? '',
        renewal_date: sub.renewal_date ?? '',
        notes:        sub.notes        ?? '',
    });

    const statusStyle = SUB_STATUS_STYLES[sub.status] ?? SUB_STATUS_STYLES.active;
    const planName    = plans.find(p => p.slug === sub.plan)?.name ?? sub.plan;

    const save = (e) => {
        e.preventDefault();
        put(route('admin.maintenance.subscriptions.update', sub.id), {
            preserveScroll: true, onSuccess: () => setOpen(false),
        });
    };

    return (
        <div className="rounded-xl bg-white" style={{ border: '0.5px solid #E8E6E2' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-forest">{sub.client?.name}</span>
                        <span className="text-xs" style={{ color: '#8a7e6e' }}>{sub.client?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: '#B2945B' }}>{planName}</span>
                        {sub.renewal_date && <span className="text-xs" style={{ color: '#b0a090' }}>Renews {sub.renewal_date}</span>}
                        <span className="text-xs" style={{ color: '#b0a090' }}>{sub.created_at}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {statusStyle.label}
                    </span>
                    <button onClick={() => setOpen(v => !v)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                        style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                        {open ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={() => onDelete(sub.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                        style={{ background: '#FEE2E2', color: '#991B1B', border: '0.5px solid #FECACA' }}>
                        Remove
                    </button>
                </div>
            </div>

            {open && (
                <form onSubmit={save} className="px-4 sm:px-5 pb-5 pt-3 space-y-3"
                    style={{ borderTop: '0.5px solid #F0EDE9' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Plan">
                            <Sel value={data.plan} onChange={e => setData('plan', e.target.value)}>
                                {plans.map(p => (
                                    <option key={p.slug} value={p.slug}>{p.name} — £{p.price}/yr</option>
                                ))}
                            </Sel>
                        </Field>
                        <Field label="Status">
                            <Sel value={data.status} onChange={e => setData('status', e.target.value)}>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="cancelled">Cancelled</option>
                            </Sel>
                        </Field>
                        <Field label="Start Date">
                            <Inp type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                        </Field>
                        <Field label="Renewal Date">
                            <Inp type="date" value={data.renewal_date} onChange={e => setData('renewal_date', e.target.value)} />
                        </Field>
                        <div className="sm:col-span-2">
                            <Field label="Notes">
                                <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                                    placeholder="Internal notes…"
                                    className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none" style={fieldStyle} />
                            </Field>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={processing}
                            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                            style={{ background: '#B2945B', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ── New subscription form ─────────────────────────────────────────────────────

function NewSubscriptionForm({ clients, plans }) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        client_id:    '',
        plan:         plans[0]?.slug ?? '',
        status:       'active',
        start_date:   '',
        renewal_date: '',
        notes:        '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.maintenance.subscriptions.store'), {
            preserveScroll: true, onSuccess: () => { reset(); setOpen(false); },
        });
    };

    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#B2945B', color: '#fff' }}>
                + Add Subscription
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-4 sm:p-5 space-y-4"
            style={{ border: '1.5px solid #B2945B' }}>
            <h3 className="text-sm font-semibold text-forest">New Subscription</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                    <Field label="Client">
                        <Sel value={data.client_id} onChange={e => setData('client_id', e.target.value)}>
                            <option value="">Select a client…</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
                        </Sel>
                    </Field>
                </div>
                <Field label="Plan">
                    <Sel value={data.plan} onChange={e => setData('plan', e.target.value)}>
                        {plans.map(p => <option key={p.slug} value={p.slug}>{p.name} — £{p.price}/yr</option>)}
                    </Sel>
                </Field>
                <Field label="Status">
                    <Sel value={data.status} onChange={e => setData('status', e.target.value)}>
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                    </Sel>
                </Field>
                <Field label="Start Date">
                    <Inp type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                </Field>
                <Field label="Renewal Date">
                    <Inp type="date" value={data.renewal_date} onChange={e => setData('renewal_date', e.target.value)} />
                </Field>
                <div className="sm:col-span-2">
                    <Field label="Notes">
                        <textarea rows={2} value={data.notes} onChange={e => setData('notes', e.target.value)}
                            placeholder="Optional internal notes…"
                            className="w-full rounded-lg px-3 py-2 text-sm resize-none outline-none" style={fieldStyle} />
                    </Field>
                </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: '#F1F1EF', color: '#6b6259', border: '0.5px solid #D1CDC7' }}>
                    Cancel
                </button>
                <button type="submit" disabled={processing}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                    style={{ background: '#B2945B', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                    {processing ? 'Creating…' : 'Create Subscription'}
                </button>
            </div>
        </form>
    );
}

// ── Plan row ──────────────────────────────────────────────────────────────────

function PlanRow({ plan, onDelete }) {
    const [open, setOpen] = useState(false);
    const { data, setData, put, processing } = useForm({
        name:       plan.name,
        slug:       plan.slug,
        price:      plan.price,
        is_popular: plan.is_popular,
        is_active:  plan.is_active,
        sort_order: plan.sort_order,
        features:   plan.features ?? [],
    });

    const save = (e) => {
        e.preventDefault();
        put(route('admin.maintenance.plans.update', plan.id), {
            preserveScroll: true, onSuccess: () => setOpen(false),
        });
    };

    const addFeature    = () => setData('features', [...data.features, '']);
    const removeFeature = (i) => setData('features', data.features.filter((_, idx) => idx !== i));
    const setFeature    = (i, v) => setData('features', data.features.map((f, idx) => idx === i ? v : f));

    return (
        <div className="rounded-xl bg-white" style={{ border: '0.5px solid #E8E6E2' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-forest">{plan.name}</span>
                        <span className="text-xs font-mono" style={{ color: '#b0a090' }}>{plan.slug}</span>
                        {plan.is_popular && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: 'rgba(178,148,91,0.15)', color: '#B2945B' }}>
                                Popular
                            </span>
                        )}
                        {!plan.is_active && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: '#F1F1EF', color: '#8a7e6e' }}>
                                Inactive
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs font-medium" style={{ color: '#B2945B' }}>
                            £{plan.price.toLocaleString()}/yr
                        </span>
                        <span className="text-xs" style={{ color: '#b0a090' }}>
                            {plan.features.length} feature{plan.features.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs" style={{ color: '#b0a090' }}>
                            Order: {plan.sort_order}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setOpen(v => !v)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                        style={{ background: '#F1F1EF', color: '#25282D', border: '0.5px solid #D1CDC7' }}>
                        {open ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={() => onDelete(plan.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap"
                        style={{ background: '#FEE2E2', color: '#991B1B', border: '0.5px solid #FECACA' }}>
                        Delete
                    </button>
                </div>
            </div>

            {open && (
                <form onSubmit={save} className="px-4 sm:px-5 pb-5 pt-3 space-y-4"
                    style={{ borderTop: '0.5px solid #F0EDE9' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Plan Name">
                            <Inp value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Premium" />
                        </Field>
                        <Field label="Slug (URL key)">
                            <Inp value={data.slug} onChange={e => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))} placeholder="e.g. premium" />
                        </Field>
                        <Field label="Price (£/yr)">
                            <Inp type="number" value={data.price} onChange={e => setData('price', parseInt(e.target.value) || 0)} placeholder="299" />
                        </Field>
                        <Field label="Display Order">
                            <Inp type="number" value={data.sort_order} onChange={e => setData('sort_order', parseInt(e.target.value) || 0)} placeholder="1" />
                        </Field>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={data.is_popular}
                                    onChange={e => setData('is_popular', e.target.checked)}
                                    className="rounded" />
                                <span className="text-xs font-medium text-forest">Most Popular badge</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="rounded" />
                                <span className="text-xs font-medium text-forest">Active (visible to clients)</span>
                            </label>
                        </div>
                    </div>

                    {/* Features */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-forest">Features</label>
                            <button type="button" onClick={addFeature}
                                className="text-xs font-medium px-2.5 py-1 rounded-lg"
                                style={{ background: 'rgba(178,148,91,0.12)', color: '#B2945B' }}>
                                + Add feature
                            </button>
                        </div>
                        <div className="space-y-2">
                            {data.features.map((f, i) => (
                                <div key={i} className="flex gap-2">
                                    <input value={f} onChange={e => setFeature(i, e.target.value)}
                                        placeholder={`Feature ${i + 1}`}
                                        className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
                                    <button type="button" onClick={() => removeFeature(i)}
                                        className="flex-shrink-0 px-2.5 py-2 rounded-lg text-xs"
                                        style={{ background: '#FEE2E2', color: '#991B1B' }}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {data.features.length === 0 && (
                                <p className="text-xs py-2" style={{ color: '#b0a090' }}>No features yet. Click "+ Add feature" to add one.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity"
                            style={{ background: '#B2945B', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Saving…' : 'Save Plan'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}

// ── New plan form ─────────────────────────────────────────────────────────────

function NewPlanForm() {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        name:       '',
        slug:       '',
        price:      '',
        is_popular: false,
        is_active:  true,
        sort_order: 0,
        features:   [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.maintenance.plans.store'), {
            preserveScroll: true, onSuccess: () => { reset(); setOpen(false); },
        });
    };

    const addFeature    = () => setData('features', [...data.features, '']);
    const removeFeature = (i) => setData('features', data.features.filter((_, idx) => idx !== i));
    const setFeature    = (i, v) => setData('features', data.features.map((f, idx) => idx === i ? v : f));

    if (!open) {
        return (
            <button onClick={() => setOpen(true)}
                className="w-full py-3 rounded-xl text-sm font-semibold"
                style={{ background: '#25282D', color: '#fff' }}>
                + Create New Plan
            </button>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-xl bg-white p-4 sm:p-5 space-y-4"
            style={{ border: '1.5px solid #25282D' }}>
            <h3 className="text-sm font-semibold text-forest">New Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Plan Name">
                    <Inp value={data.name}
                        onChange={e => {
                            setData('name', e.target.value);
                            setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
                        }}
                        placeholder="e.g. Premium" />
                </Field>
                <Field label="Slug">
                    <Inp value={data.slug}
                        onChange={e => setData('slug', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        placeholder="e.g. premium" />
                </Field>
                <Field label="Price (£/yr)">
                    <Inp type="number" value={data.price} onChange={e => setData('price', e.target.value)} placeholder="299" />
                </Field>
                <Field label="Display Order">
                    <Inp type="number" value={data.sort_order} onChange={e => setData('sort_order', parseInt(e.target.value) || 0)} placeholder="1" />
                </Field>
                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_popular} onChange={e => setData('is_popular', e.target.checked)} className="rounded" />
                        <span className="text-xs font-medium text-forest">Most Popular</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded" />
                        <span className="text-xs font-medium text-forest">Active</span>
                    </label>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-forest">Features</label>
                    <button type="button" onClick={addFeature}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: 'rgba(178,148,91,0.12)', color: '#B2945B' }}>
                        + Add feature
                    </button>
                </div>
                <div className="space-y-2">
                    {data.features.map((f, i) => (
                        <div key={i} className="flex gap-2">
                            <input value={f} onChange={e => setFeature(i, e.target.value)}
                                placeholder={`Feature ${i + 1}`}
                                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={fieldStyle} />
                            <button type="button" onClick={() => removeFeature(i)}
                                className="flex-shrink-0 px-2.5 py-2 rounded-lg text-xs"
                                style={{ background: '#FEE2E2', color: '#991B1B' }}>
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                    style={{ background: '#F1F1EF', color: '#6b6259', border: '0.5px solid #D1CDC7' }}>
                    Cancel
                </button>
                <button type="submit" disabled={processing}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                    style={{ background: '#25282D', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                    {processing ? 'Creating…' : 'Create Plan'}
                </button>
            </div>
        </form>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMaintenanceIndex({ enquiries, subscriptions, plans, clients }) {
    const [tab, setTab] = useState('enquiries');

    const planLabels = Object.fromEntries(plans.map(p => [p.slug, `${p.name} — £${p.price}/yr`]));
    const activePlans = plans.filter(p => p.is_active);

    const deleteSub  = (id) => { if (!confirm('Remove this subscription?')) return; router.delete(route('admin.maintenance.subscriptions.destroy', id), { preserveScroll: true }); };
    const deletePlan = (id) => { if (!confirm('Delete this plan? It will no longer appear to clients.')) return; router.delete(route('admin.maintenance.plans.destroy', id), { preserveScroll: true }); };

    const pendingCount = enquiries.filter(e => e.status === 'pending').length;
    const activeCount  = subscriptions.filter(s => s.status === 'active').length;

    const TABS = [
        { key: 'enquiries',     label: `Enquiries${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        { key: 'subscriptions', label: `Subscriptions (${subscriptions.length})` },
        { key: 'plans',         label: `Plans (${plans.length})` },
    ];

    return (
        <AuthenticatedLayout title="Maintenance" breadcrumb="Manage client maintenance plans">
            <Head title="Maintenance" />

            <div className="max-w-4xl mx-auto space-y-5">
                {/* Header */}
                <div className="glass-card rounded-2xl px-5 sm:px-8 py-6 sm:py-8">
                    <p className="text-xs uppercase tracking-widest mb-2 font-medium"
                        style={{ color: '#B2945B', letterSpacing: '0.1em', fontSize: 10 }}>
                        Maintenance Plans
                    </p>
                    <h1 className="text-lg sm:text-xl font-semibold text-forest mb-3">
                        Enquiries & Subscriptions
                    </h1>
                    <div className="flex gap-6 flex-wrap">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-light text-forest">{enquiries.length}</span>
                            <span className="text-xs" style={{ color: '#8a7e6e' }}>total enquiries</span>
                            {pendingCount > 0 && (
                                <span className="inline-block px-1.5 py-0.5 rounded-full text-xs font-semibold"
                                    style={{ background: '#FEF3C7', color: '#92400E', fontSize: 10 }}>
                                    {pendingCount} pending
                                </span>
                            )}
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-light text-forest">{activeCount}</span>
                            <span className="text-xs" style={{ color: '#8a7e6e' }}>active subscriptions</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-light text-forest">{activePlans.length}</span>
                            <span className="text-xs" style={{ color: '#8a7e6e' }}>active plans</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 rounded-xl w-full sm:inline-flex" style={{ background: '#F1F1EF' }}>
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={tab === t.key
                                ? { background: '#fff', color: '#25282D', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                                : { color: '#8a7e6e' }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Enquiries tab */}
                {tab === 'enquiries' && (
                    <div className="space-y-3">
                        {enquiries.length === 0 ? (
                            <div className="glass-card rounded-2xl px-6 py-12 text-center">
                                <p className="text-sm" style={{ color: '#8a7e6e' }}>No enquiries yet.</p>
                            </div>
                        ) : enquiries.map(e => <EnquiryRow key={e.id} enquiry={e} planLabels={planLabels} />)}
                    </div>
                )}

                {/* Subscriptions tab */}
                {tab === 'subscriptions' && (
                    <div className="space-y-3">
                        <NewSubscriptionForm clients={clients} plans={activePlans} />
                        {subscriptions.length === 0 ? (
                            <div className="glass-card rounded-2xl px-6 py-12 text-center">
                                <p className="text-sm" style={{ color: '#8a7e6e' }}>No subscriptions yet.</p>
                            </div>
                        ) : subscriptions.map(s => (
                            <SubscriptionRow key={s.id} sub={s} plans={plans} onDelete={deleteSub} />
                        ))}
                    </div>
                )}

                {/* Plans tab */}
                {tab === 'plans' && (
                    <div className="space-y-3">
                        <NewPlanForm />
                        {plans.length === 0 ? (
                            <div className="glass-card rounded-2xl px-6 py-12 text-center">
                                <p className="text-sm" style={{ color: '#8a7e6e' }}>No plans yet. Create one above.</p>
                            </div>
                        ) : plans.map(p => (
                            <PlanRow key={p.id} plan={p} onDelete={deletePlan} />
                        ))}
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
