"use client";
"use client";

import { useEffect, useMemo, useState } from "react";
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
        <linearGradient id="brainGradient" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#d0b9ff" />
          <stop offset="50%" stopColor="#9b7cff" />
          <stop offset="100%" stopColor="#7a5cff" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d="M32 8c8 0 14 6 14 14 0 3-1 6-2 8 0 0 4 4 6 8 2 4 2 8 2 10 0 8-6 14-14 14-8 0-14-6-14-14 0-2 0-6 2-10 2-4 6-8 6-8-1-2-2-5-2-8 0-8 6-14 14-14z" stroke="url(#brainGradient)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
      <circle cx="26" cy="20" r="1.2" fill="url(#brainGradient)" opacity="0.9" />
      <circle cx="38" cy="20" r="1.2" fill="url(#brainGradient)" opacity="0.9" />
      <circle cx="30" cy="32" r="1" fill="url(#brainGradient)" opacity="0.8" />
      <circle cx="34" cy="32" r="1" fill="url(#brainGradient)" opacity="0.8" />
      <path d="M28 28 Q32 30 36 28" stroke="url(#brainGradient)" strokeWidth="1" opacity="0.7" />
      <path d="M24 36 Q32 38 40 36" stroke="url(#brainGradient)" strokeWidth="1.2" opacity="0.7" />
      <circle cx="32" cy="28" r="1.5" fill="url(#brainGradient)" opacity="1" filter="url(#glow)" />
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
  const { user, founder, loading, logout } = useAuth();
  const [content, setContent] = useState("");
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [logs, setLogs] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

    if (user) loadProjects();
  }, [user]);

  useEffect(() => {
    if (!currentProject?.id) {
      setLogs([]);
      setConflicts([]);
      return;
    }

    let active = true;

    async function refreshState() {
      const res = await fetch(`/api/state?projectId=${encodeURIComponent(currentProject.id)}`, { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      if (!active) return;
      setLogs(json.logs || []);
      setConflicts(json.conflicts || []);
    }

    refreshState();
    const interval = setInterval(refreshState, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentProject?.id]);

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

  async function deleteCurrentProject() {
    if (!currentProject?.id) return;
    if (!confirm(`Delete ${currentProject.name}?`)) return;

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "delete", projectId: currentProject.id }),
    });

    if (res.ok) {
      setProjects((current) => current.filter((project) => project.id !== currentProject.id));
      setCurrentProject(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim() || !currentProject?.id || !founder || !user) return;

    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);

    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          founder,
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
  }

  async function clearProjectData() {
    if (!currentProject?.id) return;
    if (!confirm("Clear logs and conflicts for this project?")) return;
    await fetch("/api/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ projectId: currentProject.id }),
    });
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
              <h1 className="ui-title font-extrabold text-[var(--foreground)]">Founder Brain</h1>
              <p className="ui-body mt-1 max-w-lg text-[var(--muted)]">{founder} – shared project coordination</p>
            </div>
          </div>

          <button onClick={async () => { await logout(); router.push("/login"); }} className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-glow)] px-4 py-2 text-sm font-semibold text-[var(--danger)] transition-all duration-200 hover:bg-[rgba(191,74,114,0.12)]">
            Logout
          </button>
        </div>
      </header>

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
                <button type="button" onClick={deleteCurrentProject} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[var(--danger-border)] bg-[linear-gradient(135deg,rgba(191,74,114,0.14),rgba(191,74,114,0.08))] px-4 py-2.5 text-[0.96rem] font-semibold text-[var(--danger)] transition-all duration-200 hover:-translate-y-0.5 sm:w-auto">
                  <TrashIcon />
                  Delete
                </button>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="New project name" className="focus-ring w-full min-w-0 cursor-text rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] px-3 py-2.5 text-[0.98rem] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 sm:min-w-[300px] lg:min-w-[340px]" />
                <button type="button" onClick={createProject} className="btn-glow flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-light)] px-4 py-2.5 text-[0.96rem] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 sm:w-auto">
                  <PlusIcon />
                  Create
                </button>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="p-3 rounded-2xl border border-[var(--accent)] bg-[var(--accent-glow)]">
                <p className="text-sm font-semibold text-[var(--accent-light)]">{founder === "Paul" ? "🏢 Paul - Business" : "💻 Sam - Technical"}</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
                <div className="relative">
                  <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder={founder === "Paul" ? "Write Paul's update here..." : "Write Sam's update here..."} rows={5} className="focus-ring w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--background-subtle)] p-4 text-[0.98rem] leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)]/40 transition-all duration-200 focus:border-[var(--accent)]/50 focus:bg-[var(--background)]" />
                  <div className="absolute bottom-3 right-3 font-mono text-[10px] text-[var(--muted)]/40">{content.length > 0 ? `${content.length} chars` : ""}</div>
                </div>

                {submitError && <div className="rounded-xl border border-[var(--danger-border)] bg-[var(--danger-glow)] p-3 text-sm text-[var(--danger)]">{submitError}</div>}

                <button type="submit" disabled={isSubmitting || !content.trim()} className={`btn-glow w-full rounded-2xl py-3.5 text-[0.98rem] font-bold tracking-wide transition-all duration-250 ${isSubmitting ? "cursor-wait bg-[var(--card-hover)] text-[var(--muted)]" : submitSuccess ? "bg-[var(--success)] text-[#06060a]" : "bg-gradient-to-r from-[var(--accent)] to-[#5f4dff] text-white disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"}`}>
                  {isSubmitting ? "Saving..." : submitSuccess ? "✓ Logged" : "Submit to Founder Brain →"}
                </button>
              </form>
            </div>

            <div className="glass-card flex min-h-[280px] flex-1 flex-col overflow-hidden p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="ui-label">Activity Timeline</h2>
                <button type="button" onClick={clearProjectData} className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--background-subtle)]">Clear</button>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="py-10 text-center">
                    <div className="empty-state-icon bg-[var(--glass)]">📝</div>
                    <p className="ui-body font-medium text-[var(--muted)]">No activity yet</p>
                    <p className="ui-small mt-1 text-[var(--muted)]/50">Paul and Sam will both see messages here.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="group flex items-start gap-3 rounded-xl border border-transparent bg-[var(--background-subtle)] p-3 transition-all duration-200 hover:border-[var(--border-strong)]">
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${log.founder === "Paul" ? "bg-[var(--paul-bg)] text-[var(--paul-accent)]" : "bg-[var(--sam-bg)] text-[var(--sam-accent)]"}`}>{log.founder === "Paul" ? "P" : "S"}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--foreground)]">{log.founder}</span>
                          <span className={`inline-block h-1 w-1 rounded-full ${log.founder === "Paul" ? "bg-[var(--paul-accent)]" : "bg-[var(--sam-accent)]"}`} />
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
            <div className="glass-card flex min-h-[400px] flex-1 flex-col overflow-hidden p-5">
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
                    <p className="mt-1.5 max-w-xs text-center text-xs text-[var(--muted)]">No coordination gaps detected yet. Post a conflicting Paul or Sam update to generate one.</p>
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

                      <button onClick={() => resolveConflict(conflict.id)} className="focus-ring w-full rounded-xl border border-[rgba(45,212,160,0.15)] bg-[var(--success-glow)] py-2.5 text-xs font-bold text-[var(--success)] transition-all duration-200 hover:bg-[rgba(45,212,160,0.18)]">
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
          <p className="hidden text-sm text-[var(--muted)] sm:block">Built for Paul and Sam.</p>
        </div>
      </footer>
    </div>
  );
}
