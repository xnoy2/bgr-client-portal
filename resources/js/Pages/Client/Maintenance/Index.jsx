import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const SUB_STATUS_STYLES = {
    active: { bg: '#D1FAE5', color: '#065F46', label: 'Active' },
    paused: { bg: '#FEF3C7', color: '#92400E', label: 'Paused' },
};

// ── Enquire modal ─────────────────────────────────────────────────────────────

function EnquireModal({ plan, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        plan:    plan.key,
        message: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('client.maintenance.enquire'), {
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
                style={{ border: '0.5px solid #D1CDC7' }}>
                {/* Header */}
                <div className="px-6 py-5" style={{ borderBottom: '0.5px solid #E8E6E2' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-forest">
                                Enquire — {plan.name} Plan
                            </h2>
                            <p className="text-sm mt-0.5" style={{ color: '#8a7e6e' }}>
                                £{plan.price.toLocaleString()} / yr
                            </p>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: '#F1F1EF', color: '#6b6259' }}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none"
                                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="3" y1="3" x2="13" y2="13"/>
                                <line x1="13" y1="3" x2="3" y2="13"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={submit} className="px-6 py-5 space-y-4">
                    {/* Plan summary */}
                    <div className="rounded-xl p-4" style={{ background: '#F8F7F5', border: '0.5px solid #E8E6E2' }}>
                        <p className="text-xs font-medium text-forest mb-2">What's included:</p>
                        <ul className="space-y-1.5">
                            {plan.features.map(f => (
                                <li key={f.label} className="flex items-center gap-2 text-xs" style={{ color: '#6b6259' }}>
                                    <span style={{ color: '#B2945B' }}>—</span>
                                    {f.label}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-medium text-forest mb-1.5">
                            Message <span style={{ color: '#b0a090' }}>(optional)</span>
                        </label>
                        <textarea rows={3} value={data.message}
                            onChange={e => setData('message', e.target.value)}
                            placeholder="Any questions or specific requirements..."
                            className="w-full rounded-xl px-3 py-2.5 text-sm resize-none outline-none"
                            style={{
                                background: '#F8F7F5',
                                border: errors.message ? '1px solid #dc2626' : '0.5px solid #D1CDC7',
                                color: '#25282D',
                            }} />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                            style={{ background: '#F1F1EF', color: '#6b6259', border: '0.5px solid #D1CDC7' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={processing}
                            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity"
                            style={{ background: '#B2945B', color: '#fff', opacity: processing ? 0.7 : 1 }}>
                            {processing ? 'Sending…' : 'Send Enquiry'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan, onEnquire, activeSlug }) {
    const isActive = activeSlug === plan.key;

    return (
        <div className="flex flex-col h-full" style={{ paddingTop: 16 }}>
            <div className="relative flex flex-col flex-1 h-full rounded-2xl bg-white"
                style={{
                    border: plan.popular ? '1.5px solid #B2945B' : '0.5px solid #D1CDC7',
                    boxShadow: plan.popular
                        ? '0 8px 32px rgba(178,148,91,0.14)'
                        : '0 2px 12px rgba(0,0,0,0.04)',
                }}>

                {plan.popular && (
                    <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -13 }}>
                        <span className="inline-block px-3 py-0.5 rounded-full text-white font-semibold uppercase"
                            style={{ background: '#B2945B', fontSize: 9, letterSpacing: '0.09em' }}>
                            Most Popular
                        </span>
                    </div>
                )}

                <div className="flex flex-col flex-1 px-5 pt-5 pb-5">
                    <h3 className="text-center font-semibold text-forest mb-3"
                        style={{ fontSize: 15, letterSpacing: '-0.01em' }}>
                        {plan.name}
                    </h3>

                    <div className="text-center mb-3">
                        <span style={{
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: 34, fontWeight: 300, color: '#25282D', lineHeight: 1,
                        }}>
                            £{plan.price.toLocaleString()}
                        </span>
                        <span className="ml-1 text-xs" style={{ color: '#8a7e6e' }}>/ yr</span>
                    </div>

                    <div className="mb-3" style={{ borderTop: '0.5px solid #E8E6E2' }} />

                    <ul className="flex-1 space-y-2 mb-4">
                        {plan.features.map(f => (
                            <li key={f.label} className="flex items-center gap-2 text-xs"
                                style={{ color: '#5a5248' }}>
                                <span className="flex-shrink-0 font-medium"
                                    style={{ color: '#B2945B' }}>—</span>
                                {f.label}
                            </li>
                        ))}
                    </ul>

                    {isActive ? (
                        <div className="w-full py-2 rounded-xl text-xs font-semibold text-center"
                            style={{ background: '#D1FAE5', color: '#065F46' }}>
                            ✓ Your Current Plan
                        </div>
                    ) : (
                        <button onClick={() => onEnquire(plan)}
                            className="w-full rounded-xl font-semibold transition-all"
                            style={{
                                padding: '9px 0', fontSize: 13,
                                ...(plan.popular
                                    ? { background: '#B2945B', color: '#fff', border: 'none' }
                                    : { background: 'transparent', color: '#25282D', border: '0.5px solid #CECCCA' }
                                ),
                            }}
                            onMouseEnter={e => { if (!plan.popular) e.currentTarget.style.background = '#F5F3F1'; }}
                            onMouseLeave={e => { if (!plan.popular) e.currentTarget.style.background = 'transparent'; }}>
                            Enquire
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MaintenanceIndex({ plans = [], subscription }) {
    const [enquiringPlan, setEnquiringPlan] = useState(null);
    const subStyle = subscription ? (SUB_STATUS_STYLES[subscription.status] ?? SUB_STATUS_STYLES.active) : null;

    return (
        <AuthenticatedLayout title="Maintenance Plans" breadcrumb="Annual maintenance plans for your garden room">
            <Head title="Maintenance Plans" />

            <div className="max-w-4xl mx-auto">
                {/* Active subscription banner */}
                {subscription && (
                    <div className="rounded-xl px-4 py-2.5 mb-3 flex items-center gap-3 flex-wrap"
                        style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: '#065F46' }}>
                                You have an active maintenance subscription
                            </p>
                            <p className="text-xs" style={{ color: '#047857' }}>
                                {subscription.plan_name} Plan
                                {subscription.price && ` — ${subscription.price}`}
                                {subscription.renewal_date && ` · Renews ${subscription.renewal_date}`}
                            </p>
                        </div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                            style={{ background: subStyle.bg, color: subStyle.color }}>
                            {subStyle.label}
                        </span>
                    </div>
                )}

                {/* Section header */}
                <div className="glass-card rounded-xl px-5 py-4 mb-3">
                    <p className="text-xs uppercase tracking-widest mb-1 font-medium"
                        style={{ color: '#B2945B', letterSpacing: '0.1em', fontSize: 9 }}>
                        Annual Maintenance Plans
                    </p>
                    <h1 className="text-base font-semibold text-forest mb-0.5">
                        Keep your garden room in perfect condition year-round.
                    </h1>
                    <p className="text-xs" style={{ color: '#8a7e6e' }}>
                        Choose a plan that suits your needs. All plans include scheduled visits by our qualified team.
                    </p>
                </div>

                {/* Plan cards */}
                {plans.length === 0 ? (
                    <div className="glass-card rounded-xl px-8 py-12 text-center">
                        <p className="text-sm" style={{ color: '#8a7e6e' }}>
                            No maintenance plans are currently available. Please check back soon.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ paddingTop: 8 }}>
                        {plans.map(plan => (
                            <PlanCard key={plan.key} plan={plan}
                                onEnquire={setEnquiringPlan}
                                activeSlug={subscription?.plan} />
                        ))}
                    </div>
                )}

                <p className="text-center text-xs mt-4" style={{ color: '#b0a090' }}>
                    All prices include VAT · Billed annually · Contact us for custom arrangements.
                </p>
            </div>

            {enquiringPlan && (
                <EnquireModal plan={enquiringPlan} onClose={() => setEnquiringPlan(null)} />
            )}
        </AuthenticatedLayout>
    );
}
