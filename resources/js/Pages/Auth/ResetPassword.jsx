import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token,
        email,
        password: '',
        password_confirmation: '',
    });

    const [showPassword, setShowPassword]     = useState(false);
    const [showConfirm,  setShowConfirm]      = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), { onFinish: () => reset('password', 'password_confirmation') });
    };

    const EyeIcon = ({ visible }) => visible ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
            <line x1="2" y1="2" x2="14" y2="14"/>
        </svg>
    ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
        </svg>
    );

    return (
        <>
            <Head title="Reset Password — BGR Client Portal" />

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
                .eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #aaa; padding: 4px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div className="bgr-page">
                <div className="bgr-card">

                    <div className="bgr-card-top">
                        <img src="/bgr-logo-dark-bg-min.png" alt="BGR Garden Rooms"
                            style={{ height: 80, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block', margin: '0 auto 14px' }} />
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: '#B2945B', textTransform: 'uppercase' }}>
                            Client Portal
                        </p>
                    </div>

                    <div className="bgr-card-body">
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: 22, fontWeight: 600, color: '#25282d', fontFamily: "'Playfair Display', serif", marginBottom: 8 }}>
                                Choose a new password
                            </h2>
                            <p style={{ fontSize: 13, color: '#8a8a82' }}>
                                Enter and confirm your new password below.
                            </p>
                        </div>

                        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                            {/* Email (read-only) */}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a32', marginBottom: 6 }}>
                                    Email address
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="bgr-input"
                                    autoComplete="username"
                                />
                                {errors.email && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.email}</p>}
                            </div>

                            {/* New password */}
                            <div>
                                <label htmlFor="password"
                                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a32', marginBottom: 6 }}>
                                    New password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoFocus
                                        placeholder="••••••••"
                                        onChange={e => setData('password', e.target.value)}
                                        className={`bgr-input${errors.password ? ' has-error' : ''}`}
                                        style={{ paddingRight: 44 }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="eye-btn" tabIndex={-1}
                                        onClick={() => setShowPassword(v => !v)}>
                                        <EyeIcon visible={showPassword} />
                                    </button>
                                </div>
                                {errors.password && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.password}</p>}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label htmlFor="password_confirmation"
                                    style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#3a3a32', marginBottom: 6 }}>
                                    Confirm new password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        id="password_confirmation"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        placeholder="••••••••"
                                        onChange={e => setData('password_confirmation', e.target.value)}
                                        className={`bgr-input${errors.password_confirmation ? ' has-error' : ''}`}
                                        style={{ paddingRight: 44 }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" className="eye-btn" tabIndex={-1}
                                        onClick={() => setShowConfirm(v => !v)}>
                                        <EyeIcon visible={showConfirm} />
                                    </button>
                                </div>
                                {errors.password_confirmation && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 5 }}>{errors.password_confirmation}</p>}
                            </div>

                            <button type="submit" disabled={processing} className="bgr-btn" style={{ marginTop: 4 }}>
                                {processing ? (
                                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                            style={{ animation: 'spin 0.8s linear infinite' }}>
                                            <path d="M8 2a6 6 0 0 1 0 12A6 6 0 0 1 8 2" strokeOpacity="0.3"/>
                                            <path d="M8 2a6 6 0 0 1 6 6"/>
                                        </svg>
                                        Saving…
                                    </span>
                                ) : 'Reset Password'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: 13, color: '#b0afaa', marginTop: 24 }}>
                            <Link href={route('login')}
                                style={{ color: '#25282D', fontWeight: 500, textDecoration: 'none' }}
                                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                                ← Back to sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
