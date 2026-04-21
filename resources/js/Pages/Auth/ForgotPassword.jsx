import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <>
            <Head title="Forgot Password — BGR Client Portal" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body, #app { height: 100%; background: #F1F1EF; }
                .bgr-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; background: radial-gradient(ellipse at 30% 20%, #E8DFD0 0%, #F1F1EF 55%, #E8E6E2 100%); font-family: 'Inter', sans-serif; }
                .bgr-card { width: 100%; max-width: 440px; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 24px 80px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06); animation: fadeIn 0.4s ease; }
                .bgr-card-top { background: #25282D; padding: 28px 36px 24px; text-align: center; position: relative; }
                .bgr-card-top::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, #B2945B, transparent); }
                .bgr-card-body { padding: 32px 36px 36px; }
                .bgr-input { width: 100%; padding: 12px 16px; border: 1.5px solid #D1CDC7; border-radius: 8px; font-size: 14px; font-family: 'Inter', sans-serif; color: #25282D; background: #fafaf9; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
                .bgr-input:focus { border-color: #B2945B; background: #fff; box-shadow: 0 0 0 3px rgba(178,148,91,0.15); }
                .bgr-input.has-error { border-color: #dc2626; }
                .bgr-btn { width: 100%; padding: 13px 24px; background: #25282D; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; cursor: pointer; transition: background 0.2s, box-shadow 0.2s; letter-spacing: 0.08em; text-transform: uppercase; }
                .bgr-btn:hover:not(:disabled) { background: #2a2e33; box-shadow: 0 4px 16px rgba(26,26,26,0.2); }
                .bgr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="bgr-page">
                <div className="bgr-card">

                    <div className="bgr-card-top">
                        <img src="/bgr-logo-dark-bg-min.png" alt="BGR Garden Rooms"
                            style={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 14px' }} />
                        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', color: '#B2945B', textTransform: 'uppercase' }}>
                            Client Portal
                        </p>
                    </div>

                    <div className="bgr-card-body">
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#25282d', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
                                Forgot your password?
                            </h2>
                            <p style={{ fontSize: 13, color: '#8a8a82', lineHeight: 1.6 }}>
                                Enter your email address and we'll send you a reset link.
                            </p>
                        </div>

                        {status && (
                            <div style={{ marginBottom: 20, padding: '11px 14px', borderRadius: 8, background: 'rgba(26,26,26,0.05)', border: '1px solid rgba(26,26,26,0.12)', color: '#25282D', fontSize: 13, fontWeight: 500 }}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            <div>
                                <label htmlFor="email"
                                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a32', marginBottom: 6 }}>
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoFocus
                                    placeholder="you@example.com"
                                    onChange={e => setData('email', e.target.value)}
                                    className={`bgr-input${errors.email ? ' has-error' : ''}`}
                                />
                                {errors.email && (
                                    <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.email}</p>
                                )}
                            </div>

                            <button type="submit" disabled={processing} className="bgr-btn">
                                {processing ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            style={{ animation: 'spin 0.8s linear infinite' }}>
                                            <path d="M8 2a6 6 0 0 1 0 12A6 6 0 0 1 8 2" strokeOpacity="0.3"/>
                                            <path d="M8 2a6 6 0 0 1 6 6"/>
                                        </svg>
                                        Sending…
                                    </span>
                                ) : 'Send Reset Link'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: 13, color: '#b0afaa', marginTop: 24 }}>
                            Remember your password?{' '}
                            <Link href={route('login')}
                                style={{ color: '#25282D', fontWeight: 500, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                Back to sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
