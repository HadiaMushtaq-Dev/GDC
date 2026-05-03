import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db } from "./firestore.js";

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

const DEMO_USERS = [];

let writeQueue = Promise.resolve();
let seedPromise = null;

function isProdDemoAuth() {
  return false;
}

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "founder-brain-demo-session-secret";
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signSessionPayload(payload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function verifySessionToken(token) {
  const [encodedPayload, signature] = String(token || "").split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto.createHmac("sha256", getSessionSecret()).update(encodedPayload).digest("base64url");
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return null;
  }
}

function getDemoUserByEmail(email) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return DEMO_USERS.find((user) => user.email === normalizedEmail) || null;
}

function getDemoUserById(userId) {
  return DEMO_USERS.find((user) => user.id === userId) || null;
}

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

function firestoreCollection(name) {
  return collection(db, name);
}

function normalizeDoc(snapshot) {
  return { id: snapshot.id, ...snapshot.data() };
}

async function listCollection(name) {
  const snapshot = await getDocs(firestoreCollection(name));
  return snapshot.docs.map(normalizeDoc);
}

async function setCollectionDoc(name, payload) {
  await setDoc(doc(db, name, payload.id), payload, { merge: true });
  return payload;
}

async function deleteCollectionDoc(name, id) {
  await deleteDoc(doc(db, name, id));
}

async function updateCollectionDoc(name, id, updates) {
  const reference = doc(db, name, id);
  const existing = await getDoc(reference);
  if (!existing.exists()) return null;
  await updateDoc(reference, updates);
  return { id: existing.id, ...existing.data(), ...updates };
}

async function deleteByPredicate(name, predicate) {
  const items = await listCollection(name);
  await Promise.all(items.filter(predicate).map((item) => deleteCollectionDoc(name, item.id)));
}

async function seedFirestoreFromState() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const [projectsSnapshot, logsSnapshot, conflictsSnapshot] = await Promise.all([
        getDocs(firestoreCollection("projects")),
        getDocs(firestoreCollection("logs")),
        getDocs(firestoreCollection("conflicts")),
      ]);

      if (!projectsSnapshot.empty || !logsSnapshot.empty || !conflictsSnapshot.empty) {
        return;
      }

      const state = await readState();
      const seeds = [
        ...state.projects.map((item) => ({ collectionName: "projects", item })),
        ...state.logs.map((item) => ({ collectionName: "logs", item })),
        ...state.conflicts.map((item) => ({ collectionName: "conflicts", item })),
      ];

      await Promise.all(seeds.map(({ collectionName, item }) => setCollectionDoc(collectionName, item)));
    })();
  }

  return seedPromise;
}

export async function registerUser({ email, password, name, organization, role }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password || !name || !organization || !role) {
    throw new Error("Missing required fields");
  }

  if (!["Owner", "Tech Lead"].includes(role)) {
    throw new Error("Role must be Owner or Tech Lead");
  }

  const state = await readState();

  if (state.users.some((user) => user.email === normalizedEmail)) {
    const error = new Error("Email already registered");
    error.code = "email-already-in-use";
    throw error;
  }

  const { salt, hash } = hashPassword(password);
  const user = {
    id: newId("user"),
    email: normalizedEmail,
    name,
    organization,
    role,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: new Date().toISOString(),
  };

  state.users.push(user);
  await writeState(state);
  return sanitizeUser(user);
}

export async function authenticateUser({ email, password }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (isProdDemoAuth()) {
    const demoUser = getDemoUserByEmail(normalizedEmail);
    if (!demoUser || demoUser.password !== String(password)) {
      const error = new Error("Invalid email or password");
      error.code = "invalid-credential";
      throw error;
    }

    return sanitizeUser(demoUser);
  }

  const state = await readState();
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
  if (isProdDemoAuth()) {
    const payload = {
      sub: userId,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    };
    return signSessionPayload(payload);
  }

  const state = await readState();
  const token = crypto.randomUUID();
  state.sessions[token] = userId;
  await writeState(state);
  return token;
}

export async function removeSession(token) {
  if (isProdDemoAuth()) {
    return;
  }

  const state = await readState();
  if (token && state.sessions[token]) {
    delete state.sessions[token];
    await writeState(state);
  }
}

export async function getUserFromSession(token) {
  if (!token) return null;

  if (isProdDemoAuth()) {
    const payload = verifySessionToken(token);
    if (!payload?.sub || !payload?.exp || Date.now() > payload.exp) return null;
    return sanitizeUser(getDemoUserById(payload.sub));
  }

  const state = await readState();
  const userId = state.sessions[token];
  if (!userId) return null;
  return sanitizeUser(state.users.find((user) => user.id === userId));
}

export async function listProjects(organization) {
  await seedFirestoreFromState();
  const projects = await listCollection("projects");
  return sortNewestFirst(projects.filter((project) => project.status !== "deleted" && project.organization === organization));
}

export async function createProject(name, organization) {
  await seedFirestoreFromState();
  const project = {
    id: newId("project"),
    name,
    organization,
    status: "open",
    timestamp: new Date().toISOString(),
  };
  await setCollectionDoc("projects", project);
  return project;
}

export async function updateProject(projectId, updates) {
  await seedFirestoreFromState();
  return updateCollectionDoc("projects", projectId, updates);
}

export async function deleteProject(projectId, organization) {
  await seedFirestoreFromState();
  const projectSnapshot = await getDoc(doc(db, "projects", projectId));
  const project = projectSnapshot.exists() ? projectSnapshot.data() : null;
  if (!project || project.organization !== organization) return;

  const updatedProject = await updateCollectionDoc("projects", projectId, { status: "deleted" });
  if (!updatedProject) return;

  await deleteByPredicate("logs", (log) => log.projectId === projectId);
  await deleteByPredicate("conflicts", (conflict) => conflict.projectId === projectId);
}

export async function clearProject(projectId, organization) {
  await seedFirestoreFromState();
  if (projectId) {
    const projectSnapshot = await getDoc(doc(db, "projects", projectId));
    const project = projectSnapshot.exists() ? projectSnapshot.data() : null;
    if (!project || project.organization !== organization) return;

    await deleteByPredicate("logs", (log) => log.projectId === projectId);
    await deleteByPredicate("conflicts", (conflict) => conflict.projectId === projectId);
    return;
  }

  await deleteByPredicate("logs", (log) => log.organization === organization);
  await deleteByPredicate("conflicts", (conflict) => conflict.organization === organization);
}

function makeConflict({ name, role, content, otherLog, projectId, organization, currentLogId }) {
  return {
    id: newId("conflict"),
    projectId,
    organization,
    summary: `${name} (${role}) updated the plan in a way that conflicts with ${otherLog.name} (${otherLog.role})'s recent direction: “${otherLog.content}”.`,
    resolution: `Align ${role} and ${otherLog.role} on the same decision path before continuing. Confirm the current owner, timeline, and scope in one shared note.`,
    triggerLogId: currentLogId,
    triggerName: name,
    triggerRole: role,
    triggerContent: content,
    relatedLogIds: [otherLog.id],
    status: "active",
    timestamp: new Date().toISOString(),
  };
}

export async function ingestLog({ name, role, organization, content, projectId, userId }) {
  await seedFirestoreFromState();

  const projectSnapshot = await getDoc(doc(db, "projects", projectId));
  const project = projectSnapshot.exists() ? projectSnapshot.data() : null;

  if (!project || project.status === "deleted") {
    throw new Error("Project not found");
  }
  if (project.organization !== organization) {
    throw new Error("Unauthorized project access");
  }

  const log = {
    id: newId("log"),
    name,
    role,
    organization,
    content,
    projectId,
    userId,
    status: "active",
    timestamp: new Date().toISOString(),
  };

  await setCollectionDoc("logs", log);

  const logs = sortNewestFirst((await listCollection("logs")).filter((item) => item.projectId === projectId && item.status === "active"));
  const previousOtherLog = logs.find((item) => item.id !== log.id && item.role !== role);
  let hasConflict = false;
  let summary = "";
  let resolution = "";
  let aiUsed = false;

  if (previousOtherLog) {
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const prompt = `You are a conflict detection AI. You are monitoring a project for coordination drift between two founders.
Founder 1 (${previousOtherLog.name} - ${previousOtherLog.role}) said: "${previousOtherLog.content}"
Founder 2 (${name} - ${role}) just said: "${content}"

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
      const currentTone = classifyTone(content);
      const otherTone = classifyTone(previousOtherLog.content);
      const conflictingTone = currentTone !== "neutral" && otherTone !== "neutral" && currentTone !== otherTone;
      const conflictSignals = [
        "delay",
        "blocked",
        "change",
        "cancel",
        "postpone",
        "revise",
        "hold",
        "risk",
        "not",
        "can't",
        "cannot",
        "no",
        "disagree",
        "but",
        "instead",
        "wrong",
        "issue",
        "problem",
        "wait",
        "pause",
        "stop",
        "however",
        "rethink",
        "different",
      ];
      const signalHit = conflictSignals.some((word) => content.toLowerCase().includes(word));

      if (conflictingTone || signalHit) {
        hasConflict = true;
        summary = `${name} updated the plan in a way that may conflict with ${previousOtherLog.name}'s recent direction: “${previousOtherLog.content}”.`;
        resolution = `Align Owner and Tech Lead on the same decision path before continuing. Confirm the current owner, timeline, and scope in one shared note.`;
      }
    }

    if (hasConflict) {
      const conflict = makeConflict({
        name,
        role,
        organization,
        content,
        otherLog: previousOtherLog,
        projectId,
        currentLogId: log.id,
      });
      conflict.summary = summary;
      conflict.resolution = resolution;
      await setCollectionDoc("conflicts", conflict);
    }
  }

  return { log, createdConflict: hasConflict };
}

export async function listProjectState(projectId, organization) {
  await seedFirestoreFromState();

  const projectSnapshot = await getDoc(doc(db, "projects", projectId));
  const project = projectSnapshot.exists() ? projectSnapshot.data() : null;

  if (!project || project.status === "deleted" || project.organization !== organization) {
    throw new Error("Project not found or unauthorized");
  }

  const logs = sortNewestFirst((await listCollection("logs")).filter((log) => log.projectId === projectId && log.status === "active"));
  const conflicts = sortNewestFirst((await listCollection("conflicts")).filter((conflict) => conflict.projectId === projectId));
  return { logs, conflicts };
}

export async function resolveConflict(conflictId, organization) {
  await seedFirestoreFromState();
  const conflictSnapshot = await getDoc(doc(db, "conflicts", conflictId));
  if (!conflictSnapshot.exists()) return null;

  const conflict = conflictSnapshot.data();
  if (conflict.organization !== organization) return null;

  const resolvedAt = new Date().toISOString();
  await updateCollectionDoc("conflicts", conflictId, { status: "resolved", resolvedAt });

  for (const logId of conflict.relatedLogIds || []) {
    const logSnapshot = await getDoc(doc(db, "logs", logId));
    if (logSnapshot.exists()) {
      await updateCollectionDoc("logs", logId, { status: "resolved", resolvedAt });
    }
  }

  if (conflict.triggerLogId) {
    const triggerSnapshot = await getDoc(doc(db, "logs", conflict.triggerLogId));
    if (triggerSnapshot.exists()) {
      await updateCollectionDoc("logs", conflict.triggerLogId, { status: "resolved", resolvedAt });
    }
  }

  return { id: conflictId, ...conflict, status: "resolved", resolvedAt };
}
