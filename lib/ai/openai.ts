import OpenAI from "openai";
import { z } from "zod";

import { buildAiInsightPrompt } from "@/lib/ai/aiInsights";
import type { InsightReport, LocationContext, ProjectInput, ScoreBreakdown } from "@/types";

const openAiInsightSchema = z.object({
  executiveSummary: z.string().min(40),
  scoreExplanation: z.string().min(30),
  mainFindings: z.array(z.string()).min(3).max(5),
  opportunities: z.array(z.string()).min(3).max(5),
  recommendations: z.array(z.string()).min(3).max(6),
  principalRisks: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["alta", "media", "baja"]),
        detail: z.string(),
        relatedBlock: z.enum(["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"])
      })
    )
    .min(3)
    .max(6),
  conclusion: z.string().min(20),
  methodologyNote: z.string().min(20)
});

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executiveSummary: { type: "string" },
    scoreExplanation: { type: "string" },
    mainFindings: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" }
    },
    opportunities: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: { type: "string" }
    },
    recommendations: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: { type: "string" }
    },
    principalRisks: {
      type: "array",
      minItems: 3,
      maxItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          severity: { type: "string", enum: ["alta", "media", "baja"] },
          detail: { type: "string" },
          relatedBlock: {
            type: "string",
            enum: ["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"]
          }
        },
        required: ["title", "severity", "detail", "relatedBlock"]
      }
    },
    conclusion: { type: "string" },
    methodologyNote: { type: "string" }
  },
  required: [
    "executiveSummary",
    "scoreExplanation",
    "mainFindings",
    "opportunities",
    "recommendations",
    "principalRisks",
    "conclusion",
    "methodologyNote"
  ]
} as const;

const systemPrompt = `
Eres un analista senior de factibilidad de negocios.
Redacta en español profesional, sobrio y ejecutivo.
No inventes datos fuera de la entrada recibida.
No contradigas el score ni la clasificación.
Debes responder solo con JSON válido y útil para una presentación universitaria.
Evita frases vacías, lenguaje promocional y consejos genéricos.
`;

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function generateOpenAiInsights(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown
): Promise<InsightReport> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY no está configurada.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await client.responses.create({
    model,
    instructions: systemPrompt.trim(),
    input: `Genera un informe ejecutivo estructurado a partir de este caso:\n\n${buildAiInsightPrompt(
      input,
      context,
      scoreBreakdown
    )}`,
    max_output_tokens: 1400,
    text: {
      format: {
        type: "json_schema",
        name: "factibiz_insight_report",
        strict: true,
        schema: responseSchema
      }
    }
  });

  const rawOutput = response.output_text?.trim();
  if (!rawOutput) {
    throw new Error("La respuesta del modelo no devolvió contenido estructurado.");
  }

  const parsed = openAiInsightSchema.parse(JSON.parse(rawOutput));

  return {
    ...parsed,
    source: "openai",
    provider: "openai",
    model,
    generatedAt: new Date().toISOString()
  };
}
