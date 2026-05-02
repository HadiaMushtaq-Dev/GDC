import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "state.json");

const EMPTY_STATE = {
  users: [],
  sessions: {},
  projects: [],
  logs: [],
  conflicts: [],
};

let writeQueue = Promise.resolve();

async function ensureStateFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_STATE, null, 2), "utf8");
  }
}

async function readState() {
  await ensureStateFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return { ...EMPTY_STATE, ...JSON.parse(raw || "{}") };
}

async function writeState(nextState) {
  writeQueue = writeQueue.then(async () => {
    await ensureStateFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(nextState, null, 2), "utf8");
    return nextState;
  });
  return writeQueue;
}

export function newId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, hash) {
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}

export function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...safeUser } = user;
  return safeUser;
}

export function classifyTone(content) {
  const text = String(content || "").toLowerCase();
  const positiveWords = ["ship", "launch", "ready", "approved", "done", "build", "go", "green light", "release"];
  const negativeWords = ["delay", "blocked", "not", "cannot", "can't", "revise", "change", "postpone", "cancel", "hold", "risk"];

  const positive = positiveWords.some((word) => text.includes(word));
  const negative = negativeWords.some((word) => text.includes(word));

  if (positive && !negative) return "positive";
  if (negative && !positive) return "negative";
  if (positive && negative) return "mixed";
  return "neutral";
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function registerUser({ email, password, founder }) {
  const state = await readState();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password || !founder) {
    throw new Error("Missing email, password, or founder");
  }

  if (!["Paul", "Sam"].includes(founder)) {
    throw new Error("Founder must be Paul or Sam");
  }

  if (state.users.some((user) => user.email === normalizedEmail)) {
    const error = new Error("Email already registered");
    error.code = "email-already-in-use";
    throw error;
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: newId("user"),
    email: normalizedEmail,
    founder,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };

  state.users.push(user);
  await writeState(state);
  return sanitizeUser(user);
}

export async function authenticateUser({ email, password }) {
  const state = await readState();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = state.users.find((item) => item.email === normalizedEmail);

  if (!user) {
    const error = new Error("Invalid email or password");
    error.code = "invalid-credential";
    throw error;
  }

  const valid = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!valid) {
    const error = new Error("Invalid email or password");
    error.code = "invalid-credential";
    throw error;
  }

  return sanitizeUser(user);
}

export async function createSession(userId) {
  const state = await readState();
  const token = crypto.randomUUID();
  state.sessions[token] = userId;
  await writeState(state);
  return token;
}

export async function removeSession(token) {
  const state = await readState();
  if (token && state.sessions[token]) {
    delete state.sessions[token];
    await writeState(state);
  }
}

export async function getUserFromSession(token) {
  if (!token) return null;
  const state = await readState();
  const userId = state.sessions[token];
  if (!userId) return null;
  return sanitizeUser(state.users.find((user) => user.id === userId));
}

export async function listProjects() {
  const state = await readState();
  return sortNewestFirst(state.projects.filter((project) => project.status !== "deleted"));
}

export async function createProject(name) {
  const state = await readState();
  const project = {
    id: newId("project"),
    name,
    status: "open",
    timestamp: new Date().toISOString(),
  };
  state.projects.push(project);
  await writeState(state);
  return project;
}

export async function updateProject(projectId, updates) {
  const state = await readState();
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) return null;
  Object.assign(project, updates);
  await writeState(state);
  return project;
}

export async function deleteProject(projectId) {
  const state = await readState();
  state.projects = state.projects.map((project) => (project.id === projectId ? { ...project, status: "deleted" } : project));
  state.logs = state.logs.filter((log) => log.projectId !== projectId);
  state.conflicts = state.conflicts.filter((conflict) => conflict.projectId !== projectId);
  await writeState(state);
}

export async function clearProject(projectId) {
  const state = await readState();
  if (projectId) {
    state.logs = state.logs.filter((log) => log.projectId !== projectId);
    state.conflicts = state.conflicts.filter((conflict) => conflict.projectId !== projectId);
  } else {
    state.logs = [];
    state.conflicts = [];
    state.projects = state.projects.filter((project) => project.status === "deleted");
  }
  await writeState(state);
}

function makeConflict({ founder, content, otherLog, projectId, currentLogId }) {
  return {
    id: newId("conflict"),
    projectId,
    summary: `${founder} updated the plan in a way that conflicts with ${otherLog.founder}'s recent direction: “${otherLog.content}”.`,
    resolution: `Align Paul and Sam on the same decision path before continuing. Confirm the current owner, timeline, and scope in one shared note.`,
    triggerLogId: currentLogId,
    triggerFounder: founder,
    triggerContent: content,
    relatedLogIds: [otherLog.id],
    status: "active",
    timestamp: new Date().toISOString(),
  };
}

export async function ingestLog({ founder, content, projectId, userId }) {
  const state = await readState();
  const project = state.projects.find((item) => item.id === projectId && item.status !== "deleted");

  if (!project) {
    throw new Error("Project not found");
  }

  const log = {
    id: newId("log"),
    founder,
    content,
    projectId,
    userId,
    status: "active",
    timestamp: new Date().toISOString(),
  };

  state.logs.push(log);

  const recentLogs = sortNewestFirst(
    state.logs.filter((item) => item.projectId === projectId && item.status === "active")
  ).slice(0, 8);

  const previousOtherLog = recentLogs.find((item) => item.id !== log.id && item.founder !== founder);
  let hasConflict = false;
  let summary = "";
  let resolution = "";
  let aiUsed = false;

  if (previousOtherLog) {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `You are a conflict detection AI. You are monitoring a project for coordination drift between two founders.
Founder 1 (${previousOtherLog.founder}) said: "${previousOtherLog.content}"
Founder 2 (${founder}) just said: "${content}"

Determine if there is a conflict or coordination drift between these two statements.
Return ONLY a JSON object with the following schema, with no markdown formatting:
{
  "hasConflict": boolean,
  "summary": "String explaining the conflict briefly (if hasConflict is true)",
  "resolution": "String suggesting a resolution (if hasConflict is true)"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const aiResponse = JSON.parse(text);
        
        hasConflict = aiResponse.hasConflict;
        if (hasConflict) {
          summary = aiResponse.summary;
          resolution = aiResponse.resolution;
        }
        aiUsed = true;
      } catch (err) {
        console.error("Gemini AI error:", err);
      }
    }
    
    if (!aiUsed) {
      // Robust Fallback logic
      const currentTone = classifyTone(content);
      const otherTone = classifyTone(previousOtherLog.content);
      const conflictingTone = currentTone !== "neutral" && otherTone !== "neutral" && currentTone !== otherTone;
      const conflictSignals = [
        "delay", "blocked", "change", "cancel", "postpone", "revise", "hold", "risk", "not", "can't", "cannot", 
        "no", "disagree", "but", "instead", "wrong", "issue", "problem", "wait", "pause", "stop", "however", "rethink", "different"
      ];
      const signalHit = conflictSignals.some((word) => content.toLowerCase().includes(word));
      
      if (conflictingTone || signalHit) {
        hasConflict = true;
        summary = `${founder} updated the plan in a way that may conflict with ${previousOtherLog.founder}'s recent direction: “${previousOtherLog.content}”.`;
        resolution = `Align Paul and Sam on the same decision path before continuing. Confirm the current owner, timeline, and scope in one shared note.`;
      }
    }

    if (hasConflict) {
      state.conflicts.push({
        id: newId("conflict"),
        projectId,
        summary,
        resolution,
        triggerLogId: log.id,
        triggerFounder: founder,
        triggerContent: content,
        relatedLogIds: [previousOtherLog.id],
        status: "active",
        timestamp: new Date().toISOString(),
      });
    }
  }

  await writeState(state);
  return { log, createdConflict: hasConflict };
}

export async function listProjectState(projectId) {
  const state = await readState();
  const logs = sortNewestFirst(state.logs.filter((log) => log.projectId === projectId && log.status === "active"));
  const conflicts = sortNewestFirst(state.conflicts.filter((conflict) => conflict.projectId === projectId));
  return { logs, conflicts };
}

export async function resolveConflict(conflictId) {
  const state = await readState();
  const conflict = state.conflicts.find((item) => item.id === conflictId);
  if (!conflict) return null;

  conflict.status = "resolved";
  conflict.resolvedAt = new Date().toISOString();

  for (const logId of conflict.relatedLogIds || []) {
    const log = state.logs.find((item) => item.id === logId);
    if (log) {
      log.status = "resolved";
      log.resolvedAt = new Date().toISOString();
    }
  }

  const triggerLog = state.logs.find((item) => item.id === conflict.triggerLogId);
  if (triggerLog) {
    triggerLog.status = "resolved";
    triggerLog.resolvedAt = new Date().toISOString();
  }

  await writeState(state);
  return conflict;
}
