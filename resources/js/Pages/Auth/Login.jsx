import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), { onFinish: () => reset('password') });
    };

    return (
        <>
            <Head title="Client Portal — BGR Garden Rooms" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html, body, #app { height: 100%; background: #F1F1EF; }

                .bgr-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px 16px;
                    font-family: 'Inter', sans-serif;
                    position: relative;
                    background: radial-gradient(ellipse at 30% 20%, #E8DFD0 0%, #F1F1EF 55%, #E8E6E2 100%);
                }
                .bgr-grid { display: none; }
                .bgr-card {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    max-width: 440px;
                    background: #fff;
                    border-radius: 20px;
                    overflow: hidden;
                    box-shadow: 0 24px 80px rgba(0,0,0,0.12), 0 4px 20px rgba(0,0,0,0.06);
                    border: none;
                    outline: none;
                }
                .bgr-card-top {
                    background: #25282D;
                    padding: 32px 36px 28px;
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                .bgr-card-top::after {
                    content: '';
                    position: absolute;
                    bottom: -1px;
                    left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #B2945B, transparent);
                }
                .bgr-card-body {
                    padding: 32px 36px 36px;
                }
                .bgr-input {
                    width: 100%;
                    padding: 12px 16px;
                    border: 1.5px solid #D1CDC7;
                    border-radius: 8px;
                    font-size: 14px;
                    font-family: 'Inter', sans-serif;
                    color: #25282D;
                    background: #fafaf9;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
                }
                .bgr-input:focus {
                    border-color: #25282D;
                    background: #fff;
                    box-shadow: 0 0 0 3px rgba(178,148,91,0.15);
                }
                .bgr-input.has-error { border-color: #dc2626; }
                .bgr-btn {
                    width: 100%;
                    padding: 13px 24px;
                    background: #25282D;
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    font-family: 'Inter', sans-serif;
                    cursor: pointer;
                    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                }
                .bgr-btn:hover:not(:disabled) {
                    background: #2a2e33;
                    box-shadow: 0 4px 16px rgba(26,26,26,0.2);
                }
                .bgr-btn:active:not(:disabled) { transform: translateY(1px); }
                .bgr-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .bgr-card { animation: fadeIn 0.4s ease; }
            `}</style>

            <div className="bgr-page">

                <div className="bgr-card">

                    {/* ── Card top: logo + tagline ── */}
                    <div className="bgr-card-top">
                        <img src="/bgr-logo-dark-bg-min.png" alt="BGR Garden Rooms"
                            style={{ height: 150, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 18px' }} />
                        <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', color: '#B2945B', textTransform: 'uppercase', marginBottom: 6 }}>
                            Client Portal
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', fontWeight: 300 }}>
                            Track your project from design to completion
                        </p>
                    </div>

                    {/* ── Card body: form ── */}   
                    <div className="bgr-card-body">

                        {/* Heading */}
                        <div style={{ marginBottom: 24 }}>
                            <p style={{ fontSize: 13, color: '#8a8a82' }}>Sign in to your account</p>
                        </div>

                        {/* Status */}
                        {status && (
                            <div style={{ marginBottom: 20, padding: '11px 14px', borderRadius: 8, background: 'rgba(26,26,26,0.05)', border: '1px solid rgba(26,26,26,0.12)', color: '#25282D', fontSize: 13, fontWeight: 500 }}>
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* Email */}
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
                                    autoComplete="username"
                                    autoFocus
                                    placeholder="you@example.com"
                                    onChange={e => setData('email', e.target.value)}
                                    className={`bgr-input${errors.email ? ' has-error' : ''}`}
                                />
                                {errors.email && (
                                    <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <label htmlFor="password"
                                        style={{ fontSize: 13, fontWeight: 500, color: '#3a3a32' }}>
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <Link href={route('password.request')}
                                            style={{ fontSize: 12, color: '#25282D', fontWeight: 500, textDecoration: 'none' }}
                                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="••••••••"
                                        onChange={e => setData('password', e.target.value)}
                                        className={`bgr-input${errors.password ? ' has-error' : ''}`}
                                        style={{ paddingRight: 44 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 4 }}>
                                        {showPassword ? (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                                                <line x1="2" y1="2" x2="14" y2="14"/>
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                                                <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.password}</p>
                                )}
                            </div>

                            {/* Remember me */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <div style={{ position: 'relative', width: 18, height: 18, flexShrink: 0 }}>
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={e => setData('remember', e.target.checked)}
                                        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', margin: 0 }}
                                    />
                                    <div style={{
                                        width: 18, height: 18, borderRadius: 4,
                                        border: `1.5px solid ${data.remember ? '#25282D' : '#D1CDC7'}`,
                                        background: data.remember ? '#25282D' : '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all 0.15s',
                                    }}>
                                        {data.remember && (
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                                                <polyline points="1.5,5 4,7.5 8.5,2.5"/>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span style={{ fontSize: 13, color: '#5a5a52' }}>Keep me signed in</span>
                            </label>

                            {/* Submit */}
                            <button type="submit" disabled={processing} className="bgr-btn" style={{ marginTop: 4 }}>
                                {processing ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            style={{ animation: 'spin 0.8s linear infinite' }}>
                                            <path d="M8 2a6 6 0 0 1 0 12A6 6 0 0 1 8 2" strokeOpacity="0.3"/>
                                            <path d="M8 2a6 6 0 0 1 6 6"/>
                                        </svg>
                                        Signing in…
                                    </span>
                                ) : 'Sign In'}
                            </button>

                        </form>

                        {/* Trust badges */}
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
                            {[
                                { icon: '🔒', text: 'SSL Encrypted' },
                                { icon: '✓', text: 'ISO 9001' },
                                { icon: '✓', text: 'ISO 14001' },
                            ].map(b => (
                                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, background: '#f7f6f3', border: '0.5px solid #e8e6df' }}>
                                    <span style={{ fontSize: 10 }}>{b.icon}</span>
                                    <span style={{ fontSize: 11, color: '#8a8a82', fontWeight: 500 }}>{b.text}</span>
                                </div>
                            ))}
                        </div>

                        {/* Footer link */}
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#b0afaa', marginTop: 20 }}>
                            Not a client yet?{' '}
                            <a href="https://bespokegardenroomsballycastle.co.uk/" target="_blank" rel="noreferrer"
                                style={{ color: '#25282D', fontWeight: 500, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                Visit our website
                            </a>
                        </p>

                    </div>
                </div>
            </div>
        </>
    );
}
