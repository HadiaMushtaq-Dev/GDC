"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function BrainLogo() {
  return (
    <svg viewBox="0 0 64 64" className="h-12 w-12 sm:h-14 sm:w-14 drop-shadow-[0_0_20px_rgba(180,142,255,0.6)]" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logoGradientDash" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d0b9ff" />
          <stop offset="50%" stopColor="#9b7cff" />
          <stop offset="100%" stopColor="#5f4dff" />
        </linearGradient>
        <filter id="logoGlowDash" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter="url(#logoGlowDash)">
        <path d="M32 4 L56 18 L56 46 L32 60 L8 46 L8 18 Z" stroke="url(#logoGradientDash)" strokeWidth="2.5" strokeLinejoin="round" fill="rgba(155, 124, 255, 0.05)" />
        <path d="M32 4 L32 32 M8 18 L32 32 M56 18 L32 32 M8 46 L32 32 M56 46 L32 32 M32 60 L32 32" stroke="url(#logoGradientDash)" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
        <circle cx="32" cy="32" r="5" fill="url(#logoGradientDash)" />
        <circle cx="32" cy="4" r="3" fill="#fff" opacity="0.8" />
        <circle cx="56" cy="18" r="3" fill="#fff" opacity="0.8" />
        <circle cx="56" cy="46" r="3" fill="#fff" opacity="0.8" />
        <circle cx="32" cy="60" r="3" fill="#fff" opacity="0.8" />
        <circle cx="8" cy="46" r="3" fill="#fff" opacity="0.8" />
        <circle cx="8" cy="18" r="3" fill="#fff" opacity="0.8" />
        <circle cx="32" cy="32" r="8" stroke="url(#logoGradientDash)" strokeWidth="1" fill="none" opacity="0.5">
          <animate attributeName="r" values="5;12;5" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString();
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [content, setContent] = useState("");
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [logs, setLogs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = "night";
  }, []);

  useEffect(() => {
    async function loadProjects() {
      const res = await fetch("/api/projects", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setProjects(json.projects || []);
      setCurrentProject((prev) => prev || json.projects?.[0] || null);
    }

    if (user) {
      loadProjects();
    }
  }, [user]);
  const refreshState = useCallback(async () => {
    if (!currentProject?.id) {
      setLogs([]);
      setConflicts([]);
      return;
    }
    const res = await fetch(`/api/state?projectId=${encodeURIComponent(currentProject.id)}`, { credentials: "include" });
    if (!res.ok) return;
    const json = await res.json();
    setLogs(json.logs || []);
    setConflicts(json.conflicts || []);
  }, [currentProject?.id]);

  useEffect(() => {
    refreshState();
    
    const onFocus = () => refreshState();
    window.addEventListener("focus", onFocus);
    
    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshState]);

  const activeConflicts = useMemo(() => conflicts.filter((item) => item.status === "active"), [conflicts]);
  const resolvedConflicts = useMemo(() => conflicts.filter((item) => item.status === "resolved"), [conflicts]);

  async function createProject() {
    if (!newProjectName.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "create", name: newProjectName.trim() }),
    });

    if (res.ok) {
      const json = await res.json();
      setProjects((current) => [json.project, ...current]);
      setCurrentProject(json.project);
      setNewProjectName("");
    }
  }

  function deleteCurrentProject() {
    if (!currentProject?.id) return;
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteProject() {
    if (!currentProject?.id) return;

    const projectId = currentProject.id;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "delete", projectId }),
    });

    if (res.ok) {
      setProjects((current) => current.filter((project) => project.id !== projectId));
      setCurrentProject((current) => {
        if (current?.id !== projectId) return current;
        const remaining = projects.filter((project) => project.id !== projectId);
        return remaining[0] || null;
      });
      setShowDeleteConfirm(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !currentProject?.id || !user) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          projectId: currentProject.id,
          userId: user.id,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.error || `HTTP ${res.status}`);
      }

      setContent("");
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 1500);
      refreshState();
    } catch (error) {
      setSubmitError(error?.message || String(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function resolveConflict(id) {
    await fetch(`/api/conflicts/${id}`, {
      method: "PATCH",
      credentials: "include",
    });
    refreshState();
  }

  async function clearProjectData() {
    if (!currentProject?.id) return;
    await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ projectId: currentProject.id }),
    });
    refreshState();
    setShowClearConfirm(false);
  }

  if (loading || !user) return null;

  return (
    <div className="app-shell flex min-h-screen flex-col bg-[var(--background)]">
      <header className="header-gradient border-b border-[var(--border)] px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative rounded-[1.4rem] border border-[rgba(180,142,255,0.22)] bg-[rgba(255,255,255,0.02)] p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_16px_40px_rgba(0,0,0,0.2)]">
              <BrainLogo />
              <div className="dot-pulse absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--background)] bg-[var(--success)]" />
            </div>
            <div>
              <h1 className="ui-title font-extrabold text-[var(--foreground)]">{user.organization} - Founder Brain</h1>
              <p className="ui-body mt-1 max-w-lg text-[var(--muted)]">{user.name} ({user.role}) – shared project coordination</p>
            </div>
          </div>

          <button onClick={async () => { await logout(); router.push("/login"); }} className="cursor-pointer rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-glow)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition-all duration-200 hover:bg-[rgba(191,74,114,0.12)]">
            Logout
          </button>
        </div>
      </header>

      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(191,74,114,0.15)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--danger-glow)] border border-[var(--danger-border)]">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="ui-title mb-2 text-xl font-bold text-[var(--foreground)]">Clear Project Data?</h3>
            <p className="ui-body mb-8 text-sm text-[var(--muted)]">This will permanently delete all logs and active conflicts for this project. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="cursor-pointer flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border-strong)]">Cancel</button>
              <button onClick={clearProjectData} className="cursor-pointer flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:shadow-red-500/40 hover:-translate-y-0.5">Yes, Clear It</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(191,74,114,0.15)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--danger-border)] bg-[var(--danger-glow)]">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="ui-title mb-2 text-xl font-bold text-[var(--foreground)]">Delete Project?</h3>
            <p className="ui-body mb-8 text-sm text-[var(--muted)]">This will permanently delete the project, its logs, and its conflicts. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="cursor-pointer flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] py-3 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--border-strong)]">Cancel</button>
              <button onClick={confirmDeleteProject} className="cursor-pointer flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 transition-all hover:-translate-y-0.5 hover:shadow-red-500/40">Yes, Delete It</button>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-5 lg:col-span-5">
            <div className="glass-card p-5">
              <h2 className="ui-label">Project</h2>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.7fr)_auto] sm:items-center">
                <select value={currentProject?.id || ""} onChange={(e) => setCurrentProject(projects.find((project) => project.id === e.target.value) || null)} className="focus-ring w-full min-w-0 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] px-3 py-2.5 text-[0.98rem] text-[var(--foreground)] sm:min-w-[300px] lg:min-w-[340px]">
                  <option value="">Select project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} {project.status ? `(${project.status})` : ""}</option>
                  ))}
                </select>
                <button type="button" onClick={deleteCurrentProject} className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--danger-border)] bg-[linear-gradient(135deg,rgba(191,74,114,0.14),rgba(191,74,114,0.08))] px-4 py-2.5 text-[0.96rem] font-semibold text-[var(--danger)] transition-all duration-200 hover:-translate-y-0.5 sm:w-auto">
                  <TrashIcon />
                  Delete
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="New project name" className="focus-ring w-full min-w-0 cursor-text rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] px-3 py-2.5 text-[0.98rem] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 sm:min-w-[300px] lg:min-w-[340px]" />
                <button type="button" onClick={createProject} className="cursor-pointer btn-glow flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] px-4 py-2.5 text-[0.96rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 sm:w-auto">
                  <PlusIcon />
                  Create
                </button>
              </div>
            </div>

            <div className="glass-card p-5 relative overflow-hidden">
              <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-[var(--accent)] to-transparent opacity-[0.15] blur-[50px] animate-blob pointer-events-none" />
              <div className="absolute bottom-[-30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-[var(--sam-accent)] to-transparent opacity-[0.15] blur-[50px] animate-blob animation-delay-2000 pointer-events-none" />

              <div className="p-3 rounded-2xl border border-[var(--accent)] bg-[var(--accent-glow)] relative z-10">
                <p className="text-sm font-semibold text-[var(--accent-light)]">{user.role === "Owner" ? `🏢 ${user.name} - Business` : `💻 ${user.name} - Technical`}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 relative z-10">
                <div className="relative">
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Write ${user.name}'s update here...`} rows={5} className="focus-ring w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] p-4 text-[0.98rem] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)]/40 transition-all duration-200 focus:border-[var(--accent)]/50 focus:bg-[var(--background)]" />
                  <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[var(--muted)]/40">{content.length > 0 ? `${content.length} chars` : ""}</div>
                </div>

                {submitError && <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-glow)] p-3 text-sm text-[var(--danger)]">{submitError}</div>}

                <button type="submit" disabled={isSubmitting || !content.trim()} className={`cursor-pointer btn-glow w-full rounded-2xl py-3.5 text-[0.98rem] font-bold tracking-wide transition-all duration-250 ${isSubmitting ? "cursor-wait bg-[var(--card-hover)] text-[var(--muted)]" : submitSuccess ? "bg-[var(--success)] text-[#06060a]" : "bg-gradient-to-r from-[var(--accent)] to-[#5f4dff] text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"}`}>
                  {isSubmitting ? "Saving..." : submitSuccess ? "✓ Logged" : "Submit to Founder Brain →"}
                </button>
              </form>
            </div>

            <div className="glass-card flex max-h-[500px] min-h-[280px] flex-1 flex-col overflow-hidden p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="ui-label">Activity Timeline</h2>
                <button type="button" onClick={() => setShowClearConfirm(true)} className="cursor-pointer rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--background-subtle)]">Clear</button>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="empty-state-icon bg-[var(--glass)]">📝</div>
                    <p className="ui-body font-medium text-[var(--muted)]">No activity yet</p>
                    <p className="ui-small mt-1 text-[var(--muted)]/50">Your team will see messages here.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-3 rounded-xl border border-transparent bg-[var(--background-subtle)] p-3 transition-all duration-200 hover:border-[var(--border-strong)]">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${log.role === "Owner" ? "bg-[var(--paul-bg)] text-[var(--paul-accent)]" : "bg-[var(--sam-bg)] text-[var(--sam-accent)]"}`}>{(log.name || "U").charAt(0).toUpperCase()}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--foreground)]">{log.name || "Unknown"}</span>
                          <span className={`inline-block h-1 w-1 rounded-full ${log.role === "Owner" ? "bg-[var(--paul-accent)]" : "bg-[var(--sam-accent)]"}`} />
                          <span className="font-mono text-[11px] text-[var(--muted)]">{relativeTime(log.timestamp)}</span>
                        </div>
                        <p className="ui-body mt-1 break-words leading-relaxed text-[var(--foreground-secondary)]">{log.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="glass-card flex max-h-[600px] min-h-[400px] flex-1 flex-col overflow-hidden p-5">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--danger-glow)]"><span className="text-sm">🚨</span></div>
                  <h2 className="ui-label text-[var(--foreground)]">Active Conflicts</h2>
                </div>
                {activeConflicts.length > 0 && <span className="badge-danger">{activeConflicts.length} DRIFT{activeConflicts.length !== 1 ? "S" : ""}</span>}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {activeConflicts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="empty-state-icon border border-[rgba(45,212,160,0.15)] bg-[var(--success-glow)]">✓</div>
                    <p className="text-sm font-semibold text-[var(--success)]">All Clear</p>
                    <p className="mt-1.5 max-w-xs text-center text-xs text-[var(--muted)]">No coordination gaps detected yet. Post a conflicting update to generate one.</p>
                  </div>
                ) : (
                  activeConflicts.map((conflict) => (
                    <div key={conflict.id} className="conflict-pulse rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-glow)] p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--danger)] opacity-50"></span><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--danger)]"></span></span>
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger)]">Coordination Gap Detected</span>
                        </div>
                        <span className="font-mono text-[11px] text-[var(--muted)]">{relativeTime(conflict.timestamp)}</span>
                      </div>

                      <p className="ui-body mb-4 leading-relaxed text-[var(--foreground)]">{conflict.summary}</p>

                      <div className="resolution-card mb-4 p-4">
                        <div className="mb-2 flex items-center gap-1.5">
                          <span className="text-xs">💡</span>
                          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--accent-light)]">AI Suggested Resolution</p>
                        </div>
                        <p className="ui-small leading-relaxed text-[var(--foreground-secondary)]">{conflict.resolution}</p>
                      </div>

                      <button onClick={() => resolveConflict(conflict.id)} className="cursor-pointer focus-ring w-full rounded-xl border border-[rgba(45,212,160,0.15)] bg-[var(--success-glow)] py-2.5 text-xs font-bold text-[var(--success)] transition-all duration-200 hover:bg-[rgba(45,212,160,0.18)]">
                        ✓ Mark as Resolved
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {resolvedConflicts.length > 0 && (
              <div className="glass-card flex max-h-56 flex-col overflow-hidden p-5">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--success-glow)]"><span className="text-sm">✅</span></div>
                  <h2 className="ui-label">Resolved</h2>
                  <span className="ml-auto font-mono text-[11px] text-[var(--muted)]">{resolvedConflicts.length} item{resolvedConflicts.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                  {resolvedConflicts.map((conflict) => (
                    <div key={conflict.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-subtle)] p-3 opacity-50 transition-opacity duration-200 hover:opacity-70">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]">✓</span>
                        <p className="ui-small line-through text-[var(--muted)]">{conflict.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm font-medium text-[var(--muted)]">Founder Brain · Coordination Intelligence</p>
          <p className="hidden text-sm text-[var(--muted)] sm:block">Built for {user.organization}.</p>
        </div>
      </footer>
    </div>
  );
}
