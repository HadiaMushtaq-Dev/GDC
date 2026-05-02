"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [founder, setFounder] = useState("Paul");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = "night";
  }, []);

  function formatAuthError(err) {
    if (err?.code === "configuration-not-found") {
      return "Auth configuration is missing for this demo store.";
    }

    if (err?.code === "email-already-in-use") {
      return "This email is already registered. Switch to Sign In or use a different email.";
    }

    if (err?.code === "invalid-credential") {
      return "Invalid email or password. Check your details and try again.";
    }

    return err?.message || "Authentication failed";
  }

  async function handleAuth(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: isLogin ? "login" : "signup",
          email,
          password,
          founder,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const error = new Error(json?.error || `HTTP ${res.status}`);
        error.code = json?.code;
        throw error;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[var(--background)] overflow-hidden">
      {/* Abstract Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-[var(--accent)] opacity-[0.12] blur-[100px] animate-blob" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[#bf4a72] opacity-[0.1] blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute w-[700px] h-[700px] rounded-full bg-[var(--paul-accent)] opacity-[0.12] blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-card p-8 sm:p-10 lg:p-12 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <svg viewBox="0 0 64 64" className="h-16 w-16 drop-shadow-[0_0_25px_rgba(180,142,255,0.7)]" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d0b9ff" />
                    <stop offset="50%" stopColor="#9b7cff" />
                    <stop offset="100%" stopColor="#5f4dff" />
                  </linearGradient>
                  <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <g filter="url(#logoGlow)">
                  <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" stroke="url(#logoGradient)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(155, 124, 255, 0.05)" />
                  <path d="M32 4 L32 32 M8 18 L32 32 M56 18 L32 32 M8 46 L32 32 M56 46 L32 32 M32 60 L32 32" stroke="url(#logoGradient)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                  <circle cx="32" cy="32" r="5" fill="url(#logoGradient)" />
                  <circle cx="32" cy="4" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="56" cy="18" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="56" cy="46" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="32" cy="60" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="8" cy="46" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="8" cy="18" r="3" fill="#fff" opacity="0.8" />
                  <circle cx="32" cy="32" r="8" stroke="url(#logoGradient)" strokeWidth="1" fill="none" opacity="0.5">
                    <animate attributeName="r" values="5;12;5" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
                  </circle>
                </g>
              </svg>
            </div>
            <h1 className="ui-title text-[var(--foreground)] tracking-tight">Founder Brain</h1>
            <p className="text-sm text-[var(--muted)] mt-2">AI Coordination Intelligence</p>
          </div>

          {/* Mode Toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                isLogin
                  ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] text-white shadow-md"
                  : "bg-[var(--background-subtle)] text-[var(--muted)] border border-[var(--border)]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                !isLogin
                  ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] text-white shadow-md"
                  : "bg-[var(--background-subtle)] text-[var(--muted)] border border-[var(--border)]"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Founder Selection (only for signup) */}
          {!isLogin && (
            <div className="mb-6">
              <label className="ui-label block mb-2">Select Founder</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFounder("Paul")}
                  type="button"
                  className={`py-3 px-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    founder === "Paul"
                      ? "bg-gradient-to-br from-[var(--paul-accent)] to-[#5a7eff] text-white shadow-md"
                      : "bg-[var(--background-subtle)] text-[var(--muted)] border border-[var(--border)]"
                  }`}
                >
                  <span className="text-base">🏢</span> Paul<br/>
                  <span className="text-xs opacity-70">Business</span>
                </button>
                <button
                  onClick={() => setFounder("Sam")}
                  type="button"
                  className={`py-3 px-3 rounded-2xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                    founder === "Sam"
                      ? "bg-gradient-to-br from-[var(--sam-accent)] to-[#3ad5b4] text-white shadow-md"
                      : "bg-[var(--background-subtle)] text-[var(--muted)] border border-[var(--border)]"
                  }`}
                >
                  <span className="text-base">💻</span> Sam<br/>
                  <span className="text-xs opacity-70">Technical</span>
                </button>
              </div>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label className="ui-label block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-2xl px-4 py-3.5 border border-[var(--border)] bg-[var(--background-subtle)] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus-ring"
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label className="ui-label block mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl px-4 py-3.5 border border-[var(--border)] bg-[var(--background-subtle)] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus-ring"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[var(--danger-glow)] text-[var(--danger)] text-sm border border-[var(--danger-border)]">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleAuth}
            disabled={loading || !email || !password}
            className="w-full py-3 px-4 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] text-white font-semibold rounded-2xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Loading…
              </span>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </div>

        {/* Info Text */}
      
      </div>
    </div>
  );
}
