import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { buildAiInsightPrompt } from "@/lib/ai/aiInsights";
import type { InsightReport, LocationContext, ProjectInput, ScoreBreakdown } from "@/types";

const geminiInsightSchema = z.object({
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
  methodologyNote: z.string().min(20),
  reportNarrative: z.object({
    scoreSummary: z.string().min(30),
    methodology: z.string().min(30),
    contextSummary: z.string().min(30),
    chartsSummary: z.string().min(20),
    blockNarratives: z.object({
      septe: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      }),
      porter: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      }),
      foda: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      }),
      mercado: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      }),
      finanzas: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      }),
      operacionLegalidad: z.object({
        summary: z.string().min(20),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12)
      })
    })
  })
});

const responseSchema = {
  type: "OBJECT",
  properties: {
    executiveSummary: { type: "STRING" },
    scoreExplanation: { type: "STRING" },
    mainFindings: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    opportunities: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    recommendations: {
      type: "ARRAY",
      items: { type: "STRING" }
    },
    principalRisks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING" },
          severity: { type: "STRING", enum: ["alta", "media", "baja"] },
          detail: { type: "STRING" },
          relatedBlock: {
            type: "STRING",
            enum: ["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"]
          }
        },
        required: ["title", "severity", "detail", "relatedBlock"]
      }
    },
    conclusion: { type: "STRING" },
    methodologyNote: { type: "STRING" },
    reportNarrative: {
      type: "OBJECT",
      properties: {
        scoreSummary: { type: "STRING" },
        methodology: { type: "STRING" },
        contextSummary: { type: "STRING" },
        chartsSummary: { type: "STRING" },
        blockNarratives: {
          type: "OBJECT",
          properties: {
            septe: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            },
            porter: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            },
            foda: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            },
            mercado: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            },
            finanzas: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            },
            operacionLegalidad: {
              type: "OBJECT",
              properties: {
                summary: { type: "STRING" },
                positives: { type: "ARRAY", items: { type: "STRING" } },
                risks: { type: "ARRAY", items: { type: "STRING" } },
                recommendation: { type: "STRING" }
              },
              required: ["summary", "positives", "risks", "recommendation"]
            }
          },
          required: ["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"]
        }
      },
      required: ["scoreSummary", "methodology", "contextSummary", "chartsSummary", "blockNarratives"]
    }
  },
  required: [
    "executiveSummary",
    "scoreExplanation",
    "mainFindings",
    "opportunities",
    "recommendations",
    "principalRisks",
    "conclusion",
    "methodologyNote",
    "reportNarrative"
  ]
} as const;

const systemPrompt = `
Eres un analista senior de factibilidad de negocios.
Redacta en español profesional, sobrio y ejecutivo.
No inventes datos fuera de la entrada recibida.
No contradigas el score ni la clasificación.
Debes responder solo con JSON válido y útil para una presentación universitaria.
Evita frases vacías, lenguaje promocional y consejos genéricos.
La salida debe servir para construir un informe completo con resumen ejecutivo, lectura del score, metodología, contexto territorial, detalle por bloque, gráficos clave, conclusión y recomendaciones.
`;

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function describeGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("404") ||
    normalized.includes("not_found") ||
    normalized.includes("no longer available to new users") ||
    normalized.includes("update your code to use a newer model")
  ) {
    return "El modelo configurado de Gemini ya no está disponible. Se usó simulación local.";
  }

  if (
    normalized.includes("429") ||
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota") ||
    normalized.includes("rate limit")
  ) {
    return "Gemini no estuvo disponible por límite de cuota. Se usó simulación local.";
  }

  if (normalized.includes("401") || normalized.includes("403") || normalized.includes("api key")) {
    return "Gemini no pudo autenticarse con la credencial configurada. Se usó simulación local.";
  }

  if (normalized.includes("network") || normalized.includes("fetch") || normalized.includes("timeout")) {
    return "Gemini no respondió por un problema de red o tiempo de espera. Se usó simulación local.";
  }

  return "Gemini no respondió correctamente. Se usó simulación local.";
}

export async function generateGeminiInsights(
  input: ProjectInput,
  context: LocationContext,
  scoreBreakdown: ScoreBreakdown
): Promise<InsightReport> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const response = await client.models.generateContent({
    model,
    contents: `${systemPrompt.trim()}\n\nGenera un informe ejecutivo estructurado a partir de este caso:\n\n${buildAiInsightPrompt(
      input,
      context,
      scoreBreakdown
    )}`,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.6,
      maxOutputTokens: 1400
    }
  });

  const rawOutput = typeof response.text === "string" ? response.text.trim() : "";
  if (!rawOutput) {
    throw new Error("Gemini no devolvió contenido estructurado.");
  }

  const parsed = geminiInsightSchema.parse(JSON.parse(rawOutput));

  return {
    ...parsed,
    source: "gemini",
    provider: "gemini",
    model,
    generatedAt: new Date().toISOString()
  };
}
