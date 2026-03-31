import { NextResponse } from "next/server";
import { z } from "zod";

import { runAcademicResearch } from "@/lib/ai/research";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { mergeProjectDraft } from "@/lib/project-draft";
import type { ProjectDraft, ProjectWeights } from "@/types";

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

    return NextResponse.json({
      snapshot
    });
  } catch (error) {
    console.error("[research] route fallback", error);

    if (payload) {
      const fallbackSnapshot = buildEvaluationSnapshot(mergeProjectDraft(payload.draft ?? {}), payload.weights);
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
