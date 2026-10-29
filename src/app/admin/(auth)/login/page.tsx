"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { loginAdmin } from "@/actions/auth";
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Users,
  BarChart3,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    } else {
      setErrorMessage(result.message || "Failed to authenticate administrator.");
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .admin-login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #0b1d3e;
        }

        /* ─── LEFT PANEL ─── */
        .admin-login-left {
          flex: 1;
          background: linear-gradient(145deg, #060e21 0%, #0b1d3e 35%, #0f2d6b 70%, #1346b0 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem 3rem;
          overflow: hidden;
          min-width: 0;
        }

        .admin-login-left::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 68%);
          border-radius: 50%;
          pointer-events: none;
        }
        .admin-login-left::after {
          content: '';
          position: absolute;
          bottom: -120px;
          left: -80px;
          width: 460px;
          height: 460px;
          background: radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 68%);
          border-radius: 50%;
          pointer-events: none;
        }

        .admin-orb {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%);
          bottom: 15%;
          right: 8%;
          pointer-events: none;
        }

        .admin-left-logo { position: relative; z-index: 1; }

        .admin-left-hero {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0;
        }

        .admin-hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #38bdf8;
          margin-bottom: 0.85rem;
          opacity: 0.9;
        }

        .admin-left-title {
          font-size: clamp(1.7rem, 3vw, 2.6rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.18;
          margin: 0 0 0.25rem;
        }

        .admin-left-title .accent { color: #38bdf8; }

        .admin-left-sub {
          font-size: 0.875rem;
          color: #93c5fd;
          font-weight: 400;
          margin: 0.8rem 0 2.5rem;
          max-width: 340px;
          line-height: 1.65;
        }

        .admin-features { display: flex; gap: 1.5rem; flex-wrap: wrap; }

        .admin-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          max-width: 130px;
        }

        .admin-feature-icon {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7dd3fc;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.12);
        }

        .admin-feature-text { padding-top: 2px; }

        .admin-feature-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #e0f2fe;
          line-height: 1.2;
        }

        .admin-feature-desc {
          font-size: 0.67rem;
          color: #93c5fd;
          line-height: 1.45;
          margin: 0.18rem 0 0;
        }

        .shield-badge {
          position: absolute;
          top: 50%;
          right: 3rem;
          transform: translateY(-52%);
          z-index: 1;
          text-align: center;
          pointer-events: none;
        }

        .shield-badge-inner {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          color: rgba(56,189,248,0.55);
        }

        .shield-badge-label {
          font-size: 0.65rem;
          color: rgba(255,255,255,0.35);
          margin-top: 0.5rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .admin-left-tagline {
          position: relative;
          z-index: 1;
          font-style: italic;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.38);
          line-height: 1.55;
        }

        /* ─── RIGHT PANEL ─── */
        .admin-login-right {
          width: 500px;
          min-width: 360px;
          background: #0f1f42;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 2.5rem;
          position: relative;
        }

        .admin-dot-grid {
          position: absolute;
          opacity: 0.18;
          pointer-events: none;
        }
        .admin-dot-grid.top-right { top: 1.5rem; right: 1.5rem; }
        .admin-dot-grid.bottom-left { bottom: 1.5rem; left: 1.5rem; }

        .admin-login-card {
          width: 100%;
          max-width: 400px;
          background: #172040;
          border-radius: 20px;
          box-shadow:
            0 0 0 1px rgba(56,189,248,0.08),
            0 24px 60px rgba(0,0,0,0.45),
            0 4px 16px rgba(0,0,0,0.3);
          padding: 2.25rem 2rem 1.75rem;
          position: relative;
          z-index: 1;
        }

        .admin-card-logo-row { display: flex; justify-content: center; margin-bottom: 1.5rem; }

        .admin-card-title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.3rem;
        }

        .admin-card-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          line-height: 1.2;
        }

        .admin-card-title .accent { color: #38bdf8; }

        .admin-card-desc {
          font-size: 0.775rem;
          color: #7aa3c4;
          margin: 0 0 1.65rem;
          line-height: 1.6;
        }

        .admin-form-group { margin-bottom: 1rem; }

        .admin-form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #cbd5e1;
          margin-bottom: 0.38rem;
        }
        .admin-form-label .req { color: #f87171; margin-left: 2px; }

        .admin-input-wrap { position: relative; display: flex; align-items: center; }

        .admin-input-icon {
          position: absolute;
          left: 12px;
          color: #4a7da8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .admin-form-input {
          width: 100%;
          padding: 0.65rem 0.875rem 0.65rem 2.5rem;
          border: 1.5px solid rgba(56,130,246,0.2);
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          color: #e2e8f0;
          background: rgba(11,29,62,0.7);
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
        }

        .admin-form-input::placeholder { color: #2d4a6a; }

        .admin-form-input:focus {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
        }

        .admin-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #4a7da8;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .admin-eye-btn:hover { color: #94a3b8; }

        .admin-forgot-link {
          display: block;
          text-align: right;
          margin-top: 0.45rem;
          font-size: 0.775rem;
          font-weight: 500;
          color: #38bdf8;
          text-decoration: none;
          transition: color 0.15s;
        }
        .admin-forgot-link:hover { color: #7dd3fc; text-decoration: underline; }

        .admin-error-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.65rem 0.875rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          font-size: 0.775rem;
          color: #fca5a5;
          margin-bottom: 1rem;
          line-height: 1.45;
        }

        .admin-submit-btn {
          width: 100%;
          padding: 0.82rem 1.25rem;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 18px rgba(14,165,233,0.38);
          letter-spacing: 0.015em;
        }
        .admin-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%);
          box-shadow: 0 6px 24px rgba(14,165,233,0.52);
          transform: translateY(-1px);
        }
        .admin-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .admin-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .admin-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: admin-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes admin-spin { to { transform: rotate(360deg); } }

        .admin-card-divider {
          border: none;
          border-top: 1px solid rgba(56,130,246,0.12);
          margin: 1.25rem 0 1rem;
        }

        .admin-candidate-link-row { display: flex; justify-content: center; }

        .admin-candidate-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: #7aa3c4;
          text-decoration: none;
          transition: color 0.15s;
          font-weight: 500;
        }
        .admin-candidate-link:hover { color: #38bdf8; }

        .admin-audit-note {
          text-align: center;
          font-size: 0.685rem;
          color: #3d5f7f;
          line-height: 1.6;
          margin-top: 1.25rem;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .admin-login-left { display: none; }
          .admin-login-right {
            width: 100%;
            min-width: 0;
            padding: 1.5rem 1rem;
            background: #0b1d3e;
          }
        }
      `}</style>

      <div className="admin-login-root">
        {/* ── LEFT PANEL ── */}
        <div className="admin-login-left">
          <div className="admin-orb" />

          <div className="admin-left-logo">
            <Link href="/">
              <Logo
                variant="full"
                size="md"
                className="[&_.text-navy-900]:!text-white [&_.text-navy-500]:!text-slate-300 [&_.text-brand-700]:!text-blue-200 [&_.bg-brand-50]:!bg-white/10 [&_.border-brand-200]:!border-white/20"
              />
            </Link>
          </div>

          <div className="admin-left-hero">
            <div className="admin-hero-eyebrow">
              <ShieldCheck size={13} />
              Secure Admin Access
            </div>
            <h1 className="admin-left-title">
              Welcome Back,
              <br />
              <span className="accent">Admin Portal</span>
            </h1>
            <p className="admin-left-sub">
              Secure access for system administrators and talent leadership.
            </p>

            <div className="admin-features">
              <div className="admin-feature-item">
                <div className="admin-feature-icon">
                  <ShieldCheck size={18} />
                </div>
                <div className="admin-feature-text">
                  <p className="admin-feature-label">Secure</p>
                  <p className="admin-feature-desc">Your data, our priority</p>
                </div>
              </div>
              <div className="admin-feature-item">
                <div className="admin-feature-icon">
                  <Users size={18} />
                </div>
                <div className="admin-feature-text">
                  <p className="admin-feature-label">Manage</p>
                  <p className="admin-feature-desc">Users &amp; Operations</p>
                </div>
              </div>
              <div className="admin-feature-item">
                <div className="admin-feature-icon">
                  <BarChart3 size={18} />
                </div>
                <div className="admin-feature-text">
                  <p className="admin-feature-label">Drive</p>
                  <p className="admin-feature-desc">Better Outcomes</p>
                </div>
              </div>
            </div>

            {/* Shield badge */}
            <div className="shield-badge">
              <div className="shield-badge-inner">
                <ShieldCheck size={38} />
              </div>
              <p className="shield-badge-label">Admin Only</p>
            </div>
          </div>

          <p className="admin-left-tagline">
            Powered by People.
            <br />
            Driven by Process.
          </p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="admin-login-right">
          <svg className="admin-dot-grid top-right" width="80" height="80" viewBox="0 0 80 80">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`tr-${r}-${c}`} cx={c * 16 + 8} cy={r * 16 + 8} r="2" fill="#38bdf8" />
              ))
            )}
          </svg>
          <svg className="admin-dot-grid bottom-left" width="80" height="80" viewBox="0 0 80 80">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`bl-${r}-${c}`} cx={c * 16 + 8} cy={r * 16 + 8} r="2" fill="#38bdf8" />
              ))
            )}
          </svg>

          <div className="admin-login-card">
            <div className="admin-card-logo-row">
              <Logo
                variant="full"
                size="sm"
                className="[&_.text-navy-900]:!text-white [&_.text-navy-500]:!text-slate-400 [&_.text-brand-700]:!text-blue-300 [&_.bg-brand-50]:!bg-white/10 [&_.border-brand-200]:!border-white/20"
              />
            </div>

            <div className="admin-card-title-row">
              <ShieldCheck size={22} color="#38bdf8" strokeWidth={2.5} />
              <h2 className="admin-card-title">
                <span className="accent">Admin</span> Login
              </h2>
            </div>
            <p className="admin-card-desc">
              Sign in with your administrator credentials
              <br />
              to access the E2E platform.
            </p>

            {errorMessage && (
              <div className="admin-error-alert" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label htmlFor="admin-email" className="admin-form-label">
                  Admin Email Address <span className="req">*</span>
                </label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon">
                    <Mail size={15} />
                  </span>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    required
                    placeholder="REC-001"
                    autoComplete="email"
                    className="admin-form-input"
                  />
                </div>
              </div>

              <div className="admin-form-group">
                <label htmlFor="admin-password" className="admin-form-label">
                  Password <span className="req">*</span>
                </label>
                <div className="admin-input-wrap">
                  <span className="admin-input-icon">
                    <Lock size={15} />
                  </span>
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="admin-form-input"
                  />
                  <button
                    type="button"
                    className="admin-eye-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Link href="/forgot-password" className="admin-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                id="admin-login-submit"
                type="submit"
                disabled={isLoading}
                className="admin-submit-btn"
              >
                {isLoading ? (
                  <><span className="admin-spinner" /> Authenticating&hellip;</>
                ) : (
                  <><ShieldCheck size={16} /> Authenticate as Admin <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <hr className="admin-card-divider" />
            <div className="admin-candidate-link-row">
              <Link href="/login" className="admin-candidate-link">
                <ShieldCheck size={13} />
                Candidate Access Portal
              </Link>
            </div>
          </div>

          <p className="admin-audit-note">
            All administrative actions are logged in the immutable audit trail
            <br />
            for security compliance.
          </p>
        </div>
      </div>
    </>
  );
}
