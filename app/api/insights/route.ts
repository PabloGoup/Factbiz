import { NextResponse } from "next/server";
import { z } from "zod";

import { generateMockAiInsights } from "@/lib/ai/aiInsights";
import { describeGeminiError, generateGeminiInsights, isGeminiConfigured } from "@/lib/ai/gemini";
import type { LocationContext, ProjectInput, ScoreBreakdown } from "@/types";

const blockIdSchema = z.enum(["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"]);

const requestSchema = z.object({
  input: z.object({
    projectName: z.string(),
    businessType: z.string(),
    sector: z.string(),
    country: z.string(),
    region: z.string(),
    city: z.string(),
    description: z.string(),
    targetAudience: z.string(),
    priceRange: z.enum(["económico", "medio", "premium"]),
    differentiationLevel: z.number()
  }).passthrough(),
  context: z.object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    narrative: z.string()
  }).passthrough(),
  scoreBreakdown: z.object({
    finalScore: z.number(),
    classification: z.enum(["No factible", "Factible con riesgos", "Factible"]),
    interpretation: z.string(),
    strengths: z.array(z.string()),
    opportunities: z.array(z.string()),
    risks: z.array(
      z.object({
        title: z.string(),
        severity: z.enum(["alta", "media", "baja"]),
        detail: z.string(),
        relatedBlock: blockIdSchema
      })
    ),
    blocks: z.array(
      z.object({
        id: blockIdSchema,
        label: z.string(),
        weight: z.number(),
        score: z.number(),
        contribution: z.number(),
        summary: z.string(),
        positives: z.array(z.string()),
        risks: z.array(z.string()),
        factors: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            score: z.number(),
            note: z.string()
          })
        )
      })
    )
  }).passthrough()
});

export async function POST(request: Request) {
  try {
    const payload = requestSchema.parse(await request.json()) as {
      input: ProjectInput;
      context: LocationContext;
      scoreBreakdown: ScoreBreakdown;
    };

    if (!isGeminiConfigured()) {
      const fallbackInsights = generateMockAiInsights(payload.input, payload.context, payload.scoreBreakdown);

      return NextResponse.json({
        insights: {
          ...fallbackInsights,
          fallbackReason: "GEMINI_API_KEY no está configurada en el servidor."
        },
        mode: "mock"
      });
    }

    try {
      const insights = await generateGeminiInsights(payload.input, payload.context, payload.scoreBreakdown);

      return NextResponse.json({
        insights,
        mode: "gemini"
      });
    } catch (providerError) {
      const fallbackInsights = generateMockAiInsights(payload.input, payload.context, payload.scoreBreakdown);

      return NextResponse.json({
        insights: {
          ...fallbackInsights,
          fallbackReason: describeGeminiError(providerError)
        },
        mode: "mock"
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Solicitud inválida para generación de insights.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "No fue posible generar insights."
      },
      { status: 500 }
    );
  }
}
