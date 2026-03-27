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
  return readStorage<EvaluationSnapshot | null>(STORAGE_KEYS.evaluation, null);
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
