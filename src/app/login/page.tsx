"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { loginCandidate } from "@/actions/auth";
import {
  User,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  GraduationCap,
  BadgeCheck,
  Briefcase,
} from "lucide-react";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginCandidate(formData);

    if (result.success && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    } else {
      setErrorMessage(result.message || "Failed to authenticate.");
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', sans-serif;
          background: #eef2ff;
        }

        /* ─── LEFT PANEL ─── */
        .login-left {
          flex: 1;
          background: linear-gradient(145deg, #0b1d3e 0%, #0f2d6b 40%, #1346b0 75%, #1a56c9 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2.5rem 3rem;
          overflow: hidden;
          min-width: 0;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(59,130,246,0.22) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .login-left::after {
          content: '';
          position: absolute;
          bottom: -100px;
          left: -60px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .left-logo-area { position: relative; z-index: 1; }

        .left-hero {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2rem 0;
        }

        .left-hero-title {
          font-size: clamp(1.6rem, 3vw, 2.55rem);
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 0.25rem;
        }

        .left-hero-title .accent { color: #38bdf8; }

        .left-hero-sub {
          font-size: 0.875rem;
          color: #93c5fd;
          font-weight: 400;
          margin: 0.75rem 0 2.25rem;
          max-width: 320px;
          line-height: 1.65;
        }

        .left-features { display: flex; gap: 1.5rem; flex-wrap: wrap; }

        .feature-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.4rem;
          max-width: 115px;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background: rgba(255,255,255,0.10);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7dd3fc;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.14);
        }

        .feature-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #e0f2fe;
          line-height: 1.2;
        }

        .feature-desc {
          font-size: 0.68rem;
          color: #93c5fd;
          line-height: 1.45;
          margin: 0;
        }

        .smarter-badge {
          position: absolute;
          top: 50%;
          right: 3rem;
          transform: translateY(-55%);
          z-index: 1;
          text-align: center;
          color: rgba(255,255,255,0.82);
          font-size: 1rem;
          font-style: italic;
          font-weight: 600;
          line-height: 1.35;
          pointer-events: none;
        }

        .smarter-badge .curve { color: #38bdf8; }

        .smarter-arrow {
          display: block;
          margin: 0.3rem auto 0;
          width: 42px;
          opacity: 0.65;
        }

        .left-tagline {
          position: relative;
          z-index: 1;
          font-style: italic;
          font-size: 1rem;
          color: rgba(255,255,255,0.45);
          line-height: 1.55;
        }

        /* ─── RIGHT PANEL ─── */
        .login-right {
          width: 490px;
          min-width: 360px;
          background: #eef2ff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 2.5rem;
          position: relative;
        }

        .dot-grid {
          position: absolute;
          opacity: 0.15;
          pointer-events: none;
        }
        .dot-grid.top-right { top: 1.5rem; right: 1.5rem; }
        .dot-grid.bottom-left { bottom: 1.5rem; left: 1.5rem; }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 8px 36px rgba(15,23,42,0.09), 0 2px 8px rgba(15,23,42,0.05);
          padding: 2.25rem 2rem 1.75rem;
          position: relative;
          z-index: 1;
        }

        .card-logo-row { display: flex; justify-content: center; margin-bottom: 1.5rem; }

        .card-title {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.3rem;
          line-height: 1.25;
        }

        .card-desc {
          font-size: 0.775rem;
          color: #64748b;
          margin: 0 0 1.65rem;
          line-height: 1.6;
        }

        .form-group { margin-bottom: 1rem; }

        .form-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.38rem;
        }
        .form-label .req { color: #ef4444; margin-left: 2px; }

        .input-wrap { position: relative; display: flex; align-items: center; }

        .input-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 0.65rem 0.875rem 0.65rem 2.4rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          color: #0f172a;
          background: #ffffff;
          transition: border-color 0.18s, box-shadow 0.18s;
          outline: none;
        }

        .form-input::placeholder { color: #cbd5e1; }

        .form-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
        }

        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          padding: 0;
          transition: color 0.15s;
        }
        .eye-btn:hover { color: #475569; }

        .forgot-link {
          display: block;
          text-align: right;
          margin-top: 0.45rem;
          font-size: 0.775rem;
          font-weight: 500;
          color: #2563eb;
          text-decoration: none;
          transition: color 0.15s;
        }
        .forgot-link:hover { color: #1d4ed8; text-decoration: underline; }

        .error-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.65rem 0.875rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          font-size: 0.775rem;
          color: #b91c1c;
          margin-bottom: 1rem;
          line-height: 1.45;
        }

        .submit-btn {
          width: 100%;
          padding: 0.8rem 1.25rem;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
          box-shadow: 0 4px 14px rgba(37,99,235,0.32);
          letter-spacing: 0.01em;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
          box-shadow: 0 6px 20px rgba(37,99,235,0.42);
          transform: translateY(-1px);
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.68; cursor: not-allowed; }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .admin-divider {
          border: none;
          border-top: 1px solid #f1f5f9;
          margin: 1.2rem 0 1rem;
        }

        .admin-link-row { display: flex; justify-content: center; }

        .admin-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          color: #64748b;
          text-decoration: none;
          transition: color 0.15s;
        }
        .admin-link .admin-cta {
          color: #2563eb;
          font-weight: 600;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .admin-link:hover .admin-cta { color: #1d4ed8; }

        .provision-note {
          text-align: center;
          font-size: 0.685rem;
          color: #94a3b8;
          line-height: 1.6;
          margin-top: 1.5rem;
        }

        @media (max-width: 768px) {
          .login-left { display: none; }
          .login-right { width: 100%; min-width: 0; padding: 1.5rem 1rem; }
        }
      `}</style>

      <div className="login-root">
        {/* ── LEFT PANEL ── */}
        <div className="login-left">
          <div className="left-logo-area">
            <Link href="/">
              <Logo variant="full" size="md" className="[&_.text-navy-900]:!text-white [&_.text-navy-500]:!text-slate-300 [&_.text-brand-700]:!text-blue-200 [&_.bg-brand-50]:!bg-white/10 [&_.border-brand-200]:!border-white/20" />
            </Link>
          </div>

          <div className="left-hero">
            <h1 className="left-hero-title">
              Your Partner in
              <br />
              <span className="accent">Talent Acquisition</span>
              <br />
              &amp; Recruitment
            </h1>
            <p className="left-hero-sub">
              Access your Recruiter Academy training and certified operations workspace
            </p>

            <div className="left-features">
              <div className="feature-item">
                <div className="feature-icon"><GraduationCap size={20} /></div>
                <p className="feature-label">Learn &amp; Grow</p>
                <p className="feature-desc">Complete your training modules</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon"><BadgeCheck size={20} /></div>
                <p className="feature-label">Get Certified</p>
                <p className="feature-desc">Track your progress and achievements</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon"><Briefcase size={20} /></div>
                <p className="feature-label">Build Your Career</p>
                <p className="feature-desc">Access tools and resources</p>
              </div>
            </div>

            {/* Smarter Hiring badge */}
            <div className="smarter-badge">
              <span>Smarter<br />Hiring<br /><span className="curve">Starts Here</span></span>
              <svg className="smarter-arrow" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 5 C 10 2, 30 2, 35 18 M 30 14 L 35 18 L 31 22" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <p className="left-tagline">Powered by People.<br />Driven by Process.</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="login-right">
          <svg className="dot-grid top-right" width="80" height="80" viewBox="0 0 80 80">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`tr-${r}-${c}`} cx={c * 16 + 8} cy={r * 16 + 8} r="2" fill="#3b82f6" />
              ))
            )}
          </svg>
          <svg className="dot-grid bottom-left" width="80" height="80" viewBox="0 0 80 80">
            {Array.from({ length: 5 }).map((_, r) =>
              Array.from({ length: 5 }).map((_, c) => (
                <circle key={`bl-${r}-${c}`} cx={c * 16 + 8} cy={r * 16 + 8} r="2" fill="#3b82f6" />
              ))
            )}
          </svg>

          <div className="login-card">
            <div className="card-logo-row">
              <Logo variant="full" size="sm" />
            </div>

            <h2 className="card-title">Sign in to your account</h2>
            <p className="card-desc">
              Enter your registered Email Address OR Candidate ID<br />(e.g. E2E-REC-001)
            </p>

            {errorMessage && (
              <div className="error-alert" role="alert">
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="identifier" className="form-label">
                  Email or Candidate ID <span className="req">*</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon"><User size={15} /></span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    required
                    placeholder="REC-001"
                    autoComplete="username"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="req">*</span>
                </label>
                <div className="input-wrap">
                  <span className="input-icon"><Lock size={15} /></span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Link href="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={isLoading}
                className="submit-btn"
              >
                {isLoading ? (
                  <><span className="spinner" /> Signing in…</>
                ) : (
                  <>Sign In to Academy <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <hr className="admin-divider" />
            <div className="admin-link-row">
              <Link href="/admin/login" className="admin-link">
                <ShieldCheck size={14} />
                Administrator?&nbsp;<span className="admin-cta">Access Admin Portal</span>
              </Link>
            </div>

            <p className="provision-note">
              Accounts are provisioned by E2E Procurement Administrators.<br />
              No public self-registration.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
