import { STORAGE_KEYS } from "@/lib/constants";
import type {
  EvaluationSnapshot,
  HotelBenchmarkReport,
  HotelBenchmarkSearchInput,
  HotelCaseInput,
  HotelCaseResult,
  InterviewSession,
  ProjectInput,
  ProjectWeights
} from "@/types";

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

function isHotelCaseResultLike(value: unknown): value is HotelCaseResult {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<HotelCaseResult> & {
    input?: { hotelName?: unknown; destination?: unknown };
    summary?: { weightedAverageAdr?: unknown; recommendations?: unknown };
    monthlyForecasts?: unknown;
  };

  return Boolean(
    candidate.input &&
      typeof candidate.input.hotelName === "string" &&
      typeof candidate.input.destination === "string" &&
      candidate.summary &&
      typeof candidate.summary.weightedAverageAdr === "number" &&
      Array.isArray(candidate.summary.recommendations) &&
      candidate.summary.recommendations.every(
        (item) => item && typeof item === "object" && "title" in item && "text" in item
      ) &&
      Array.isArray(candidate.monthlyForecasts) &&
      typeof candidate.generatedAt === "string"
  );
}

function isHotelBenchmarkReportLike(value: unknown): value is HotelBenchmarkReport {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<HotelBenchmarkReport> & {
    query?: { region?: unknown; country?: unknown };
    hotels?: unknown;
    marketSignals?: unknown;
  };

  return Boolean(
    candidate.query &&
      typeof candidate.query.region === "string" &&
      typeof candidate.query.country === "string" &&
      Array.isArray(candidate.hotels) &&
      Array.isArray(candidate.marketSignals) &&
      typeof candidate.overview === "string"
  );
}

export function getStoredHotelCase(fallback: HotelCaseInput) {
  return readStorage<HotelCaseInput>(STORAGE_KEYS.hotelCase, fallback);
}

export function setStoredHotelCase(input: HotelCaseInput) {
  writeStorage(STORAGE_KEYS.hotelCase, input);
}

export function getStoredHotelResult() {
  const result = readStorage<HotelCaseResult | null>(STORAGE_KEYS.hotelResult, null);

  if (result && !isHotelCaseResultLike(result)) {
    removeStorage(STORAGE_KEYS.hotelResult);
    return null;
  }

  return result;
}

export function setStoredHotelResult(result: HotelCaseResult) {
  writeStorage(STORAGE_KEYS.hotelResult, result);
}

export function clearStoredHotelResult() {
  removeStorage(STORAGE_KEYS.hotelResult);
}

export function getStoredHotelBenchmarkFilters(fallback: HotelBenchmarkSearchInput) {
  return readStorage<HotelBenchmarkSearchInput>(STORAGE_KEYS.hotelBenchmarkFilters, fallback);
}

export function setStoredHotelBenchmarkFilters(filters: HotelBenchmarkSearchInput) {
  writeStorage(STORAGE_KEYS.hotelBenchmarkFilters, filters);
}

export function getStoredHotelBenchmarkResult() {
  const result = readStorage<HotelBenchmarkReport | null>(STORAGE_KEYS.hotelBenchmarkResult, null);

  if (result && !isHotelBenchmarkReportLike(result)) {
    removeStorage(STORAGE_KEYS.hotelBenchmarkResult);
    return null;
  }

  return result;
}

export function setStoredHotelBenchmarkResult(result: HotelBenchmarkReport) {
  writeStorage(STORAGE_KEYS.hotelBenchmarkResult, result);
}
