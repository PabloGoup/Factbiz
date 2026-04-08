import { NextResponse } from "next/server";
import { z } from "zod";

import { runAcademicResearch } from "@/lib/ai/research";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { mergeProjectDraft } from "@/lib/project-draft";
import type { EvaluationSnapshot, ProjectDraft, ProjectWeights } from "@/types";

const weightsSchema = z.object({
  septe: z.number(),
  porter: z.number(),
  foda: z.number(),
  mercado: z.number(),
  finanzas: z.number(),
  operacionLegalidad: z.number()
});

const requestSchema = z.object({
  query: z.string().min(12),
  draft: z.record(z.any()).optional(),
  weights: weightsSchema
});

function isUsableSnapshot(snapshot: unknown): snapshot is EvaluationSnapshot {
  if (!snapshot || typeof snapshot !== "object") return false;

  const candidate = snapshot as Partial<EvaluationSnapshot> & {
    input?: { projectName?: unknown; city?: unknown; country?: unknown };
    context?: { narrative?: unknown };
    scoreBreakdown?: { finalScore?: unknown; blocks?: unknown };
    insights?: { executiveSummary?: unknown };
    generatedAt?: unknown;
  };

  return Boolean(
    candidate.input &&
      typeof candidate.input.projectName === "string" &&
      typeof candidate.input.city === "string" &&
      typeof candidate.input.country === "string" &&
      candidate.context &&
      typeof candidate.context.narrative === "string" &&
      candidate.scoreBreakdown &&
      typeof candidate.scoreBreakdown.finalScore === "number" &&
      Number.isFinite(candidate.scoreBreakdown.finalScore) &&
      Array.isArray(candidate.scoreBreakdown.blocks) &&
      candidate.insights &&
      typeof candidate.insights.executiveSummary === "string" &&
      candidate.generatedAt &&
      typeof candidate.generatedAt === "string"
  );
}

function buildSafeSnapshot(draft: ProjectDraft | undefined, weights: ProjectWeights) {
  return buildEvaluationSnapshot(mergeProjectDraft(draft ?? {}), weights);
}

export async function POST(request: Request) {
  let payload:
    | {
        query: string;
        draft?: ProjectDraft;
        weights: ProjectWeights;
      }
    | null = null;

  try {
    payload = requestSchema.parse(await request.json()) as {
      query: string;
      draft?: ProjectDraft;
      weights: ProjectWeights;
    };

    const snapshot = await runAcademicResearch(payload.draft ?? {}, payload.weights, payload.query);

    if (!isUsableSnapshot(snapshot)) {
      return NextResponse.json({
        snapshot: buildSafeSnapshot(payload.draft, payload.weights),
        warning: "La investigación se degradó y se reconstruyó una evaluación base válida.",
        mode: "fallback"
      });
    }

    return NextResponse.json({
      snapshot
    });
  } catch (error) {
    console.error("[research] route fallback", error);

    if (payload) {
      const fallbackSnapshot = buildSafeSnapshot(payload.draft, payload.weights);
      return NextResponse.json({
        snapshot: fallbackSnapshot,
        warning: error instanceof Error ? error.message : "No fue posible investigar el proyecto.",
        mode: "fallback"
      });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible investigar el proyecto."
      },
      { status: 500 }
    );
  }
}
