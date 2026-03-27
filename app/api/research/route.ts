import { NextResponse } from "next/server";
import { z } from "zod";

import { runAcademicResearch } from "@/lib/ai/research";
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
  try {
    const payload = requestSchema.parse(await request.json()) as {
      query: string;
      draft?: ProjectDraft;
      weights: ProjectWeights;
    };

    const snapshot = await runAcademicResearch(payload.draft ?? {}, payload.weights, payload.query);

    return NextResponse.json({
      snapshot
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible investigar el proyecto."
      },
      { status: 500 }
    );
  }
}
