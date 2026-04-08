import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { mergeProjectDraft } from "@/lib/project-draft";
import type { EvaluationSnapshot, ProjectDraft, ProjectInput } from "@/types";

type ParsedImportResult =
  | {
      kind: "snapshot";
      snapshot: EvaluationSnapshot;
      note: string;
    }
  | {
      kind: "text";
      text: string;
      note: string;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isEvaluationSnapshotLike(value: unknown): value is EvaluationSnapshot {
  if (!isObject(value)) return false;

  const snapshot = value as Partial<EvaluationSnapshot> & {
    scoreBreakdown?: { finalScore?: unknown; blocks?: unknown };
    input?: { projectName?: unknown; city?: unknown; country?: unknown };
    context?: { narrative?: unknown };
    insights?: { executiveSummary?: unknown };
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

function isProjectInputLike(value: unknown): value is ProjectInput {
  if (!isObject(value)) return false;

  return (
    typeof value.projectName === "string" &&
    typeof value.businessType === "string" &&
    typeof value.sector === "string" &&
    typeof value.country === "string" &&
    typeof value.city === "string"
  );
}

function isProjectDraftLike(value: unknown): value is ProjectDraft {
  if (!isObject(value)) return false;

  return [
    "projectName",
    "businessType",
    "sector",
    "country",
    "city",
    "description",
    "targetAudience"
  ].some((key) => typeof value[key] === "string");
}

function toSnapshotFromJson(value: unknown): EvaluationSnapshot | null {
  if (isEvaluationSnapshotLike(value)) {
    return value;
  }

  if (isObject(value) && isProjectInputLike(value.input)) {
    return buildEvaluationSnapshot(value.input);
  }

  if (isProjectInputLike(value)) {
    return buildEvaluationSnapshot(value);
  }

  if (isProjectDraftLike(value)) {
    return buildEvaluationSnapshot(mergeProjectDraft(value));
  }

  return null;
}

async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
  }

  return pdfjs;
}

async function extractTextFromPdf(file: File) {
  const pdfjs = await loadPdfJs();
  const data = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pages.push(pageText);
    }
  }

  return pages.join("\n\n");
}

function tryParseJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function parseImportedProjectFile(file: File): Promise<ParsedImportResult> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".json")) {
    const raw = await file.text();
    const parsed = toSnapshotFromJson(tryParseJson(raw));

    if (!parsed) {
      throw new Error("El JSON no corresponde a un informe ni a un proyecto compatible.");
    }

    return {
      kind: "snapshot",
      snapshot: parsed,
      note: "Se cargó una evaluación estructurada desde JSON."
    };
  }

  if (lowerName.endsWith(".pdf")) {
    const text = await extractTextFromPdf(file);

    if (!text.trim()) {
      throw new Error("No se pudo extraer texto utilizable del PDF.");
    }

    return {
      kind: "text",
      text,
      note: "Se extrajo texto del PDF para reconstruir el proyecto."
    };
  }

  const raw = await file.text();
  const parsedJson = toSnapshotFromJson(tryParseJson(raw));

  if (parsedJson) {
    return {
      kind: "snapshot",
      snapshot: parsedJson,
      note: "Se interpretó el archivo como JSON estructurado."
    };
  }

  if (!raw.trim()) {
    throw new Error("El archivo está vacío o no contiene texto legible.");
  }

  return {
    kind: "text",
    text: raw,
    note: "Se usará el contenido textual del archivo para generar el proyecto."
  };
}
