"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [founder, setFounder] = useState("Paul");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

      router.push("/dashboard");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-8 sm:p-10 lg:p-12 rounded-3xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <svg viewBox="0 0 64 64" className="h-16 w-16 drop-shadow-[0_0_20px_rgba(180,142,255,0.6)]" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="brainGradient" x1="0" y1="0" x2="64" y2="64">
                    <stop offset="0%" stopColor="#d0b9ff" />
                    <stop offset="50%" stopColor="#9b7cff" />
                    <stop offset="100%" stopColor="#7a5cff" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path
                  d="M32 8c8 0 14 6 14 14 0 3-1 6-2 8 0 0 4 4 6 8 2 4 2 8 2 10 0 8-6 14-14 14-8 0-14-6-14-14 0-2 0-6 2-10 2-4 6-8 6-8-1-2-2-5-2-8 0-8 6-14 14-14z"
                  stroke="url(#brainGradient)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#glow)"
                />
                <circle cx="26" cy="20" r="1.2" fill="url(#brainGradient)" opacity="0.9" />
                <circle cx="38" cy="20" r="1.2" fill="url(#brainGradient)" opacity="0.9" />
                <circle cx="30" cy="32" r="1" fill="url(#brainGradient)" opacity="0.8" />
                <circle cx="34" cy="32" r="1" fill="url(#brainGradient)" opacity="0.8" />
                <path d="M28 28 Q32 30 36 28" stroke="url(#brainGradient)" strokeWidth="1" opacity="0.7" />
                <path d="M24 36 Q32 38 40 36" stroke="url(#brainGradient)" strokeWidth="1.2" opacity="0.7" />
                <circle cx="32" cy="28" r="1.5" fill="url(#brainGradient)" opacity="1" filter="url(#glow)" />
              </svg>
            </div>
            <h1 className="ui-title text-[var(--foreground)]">Founder Brain</h1>
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
