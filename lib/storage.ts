import { STORAGE_KEYS } from "@/lib/constants";
import type { EvaluationSnapshot, InterviewSession, ProjectInput, ProjectWeights } from "@/types";

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function readStorage<T>(key: StorageKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: StorageKey, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStorage(key: StorageKey) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function isEvaluationSnapshotLike(value: unknown): value is EvaluationSnapshot {
  if (!value || typeof value !== "object") return false;

  const snapshot = value as Partial<EvaluationSnapshot> & {
    scoreBreakdown?: { finalScore?: unknown; classification?: unknown; blocks?: unknown };
    input?: { projectName?: unknown; city?: unknown; country?: unknown };
    context?: { narrative?: unknown };
    insights?: { executiveSummary?: unknown; source?: unknown };
  };

  return Boolean(
    snapshot.input &&
      typeof snapshot.input.projectName === "string" &&
      typeof snapshot.input.city === "string" &&
      typeof snapshot.input.country === "string" &&
      snapshot.context &&
      typeof snapshot.context.narrative === "string" &&
      snapshot.scoreBreakdown &&
      typeof snapshot.scoreBreakdown.finalScore === "number" &&
      Array.isArray(snapshot.scoreBreakdown.blocks) &&
      snapshot.insights &&
      typeof snapshot.insights.executiveSummary === "string" &&
      typeof snapshot.generatedAt === "string"
  );
}

export function getStoredProject(fallback: ProjectInput) {
  return readStorage<ProjectInput>(STORAGE_KEYS.project, fallback);
}

export function setStoredProject(input: ProjectInput) {
  writeStorage(STORAGE_KEYS.project, input);
}

export function getStoredWeights(fallback: ProjectWeights) {
  return readStorage<ProjectWeights>(STORAGE_KEYS.weights, fallback);
}

export function setStoredWeights(weights: ProjectWeights) {
  writeStorage(STORAGE_KEYS.weights, weights);
}

export function getStoredEvaluation() {
  const snapshot = readStorage<EvaluationSnapshot | null>(STORAGE_KEYS.evaluation, null);

  if (snapshot && !isEvaluationSnapshotLike(snapshot)) {
    removeStorage(STORAGE_KEYS.evaluation);
    return null;
  }

  return snapshot;
}

export function setStoredEvaluation(snapshot: EvaluationSnapshot) {
  writeStorage(STORAGE_KEYS.evaluation, snapshot);
}

export function getStoredInterview() {
  return readStorage<InterviewSession | null>(STORAGE_KEYS.interview, null);
}

export function setStoredInterview(session: InterviewSession) {
  writeStorage(STORAGE_KEYS.interview, session);
}
