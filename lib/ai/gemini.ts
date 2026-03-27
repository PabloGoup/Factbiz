import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

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
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
      }),
      porter: z.object({
        summary: z.string().min(20),
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
      }),
      foda: z.object({
        summary: z.string().min(20),
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
      }),
      mercado: z.object({
        summary: z.string().min(20),
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
      }),
      finanzas: z.object({
        summary: z.string().min(20),
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
      }),
      operacionLegalidad: z.object({
        summary: z.string().min(20),
        detailedAnalysis: z.string().min(80),
        positives: z.array(z.string()).min(1).max(3),
        risks: z.array(z.string()).min(1).max(3),
        recommendation: z.string().min(12),
        factorNarratives: z.array(
          z.object({
            label: z.string().min(3),
            headline: z.string().min(12),
            assessment: z.string().min(30),
            impact: z.string().min(20)
          })
        ).min(1).max(6)
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

const coreInsightSchema = z.object({
  executiveSummary: z.string().min(40),
  scoreExplanation: z.string().min(30),
  mainFindings: z.array(z.string()).min(3),
  opportunities: z.array(z.string()).min(3),
  recommendations: z.array(z.string()).min(3),
  principalRisks: z
    .array(
      z.object({
        title: z.string(),
        severity: z.enum(["alta", "media", "baja"]),
        detail: z.string(),
        relatedBlock: z.enum(["septe", "porter", "foda", "mercado", "finanzas", "operacionLegalidad"])
      })
    )
    .min(3),
  conclusion: z.string().min(20),
  methodologyNote: z.string().min(20)
});

const coreResponseSchema = {
  type: "OBJECT",
  properties: {
    executiveSummary: { type: "STRING" },
    scoreExplanation: { type: "STRING" },
    mainFindings: { type: "ARRAY", items: { type: "STRING" } },
    opportunities: { type: "ARRAY", items: { type: "STRING" } },
    recommendations: { type: "ARRAY", items: { type: "STRING" } },
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
    methodologyNote: { type: "STRING" }
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

const narrativeSectionSchema = z.object({
  scoreSummary: z.string().min(30),
  methodology: z.string().min(30),
  contextSummary: z.string().min(30),
  chartsSummary: z.string().min(20)
});

const narrativeSectionResponseSchema = {
  type: "OBJECT",
  properties: {
    scoreSummary: { type: "STRING" },
    methodology: { type: "STRING" },
    contextSummary: { type: "STRING" },
    chartsSummary: { type: "STRING" }
  },
  required: ["scoreSummary", "methodology", "contextSummary", "chartsSummary"]
} as const;

const blockNarrativeSchema = z.object({
  summary: z.string().min(20),
  detailedAnalysis: z.string().min(80),
  positives: z.array(z.string()).min(1),
  risks: z.array(z.string()).min(1),
  recommendation: z.string().min(12),
  factorNarratives: z.array(
    z.object({
      label: z.string().min(3),
      headline: z.string().min(12),
      assessment: z.string().min(30),
      impact: z.string().min(20)
    })
  ).min(1)
});

const blockNarrativeResponseSchema = {
  type: "OBJECT",
  properties: {
    summary: { type: "STRING" },
    detailedAnalysis: { type: "STRING" },
    positives: { type: "ARRAY", items: { type: "STRING" } },
    risks: { type: "ARRAY", items: { type: "STRING" } },
    recommendation: { type: "STRING" },
    factorNarratives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          headline: { type: "STRING" },
          assessment: { type: "STRING" },
          impact: { type: "STRING" }
        },
        required: ["label", "headline", "assessment", "impact"]
      }
    }
  },
  required: ["summary", "detailedAnalysis", "positives", "risks", "recommendation", "factorNarratives"]
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

function buildCompactInsightPayload(input: ProjectInput, context: LocationContext, scoreBreakdown: ScoreBreakdown) {
  return JSON.stringify(
    {
      proyecto: {
        nombre: input.projectName,
        tipo: input.businessType,
        rubro: input.sector,
        ubicacion: `${input.city}, ${input.region}, ${input.country}`,
        publicoObjetivo: input.targetAudience,
        rangoPrecio: input.priceRange,
        inversion: input.initialInvestment,
        ventasMensuales: input.monthlySalesProjection
      },
      contexto: {
        ubicacion: `${context.city}, ${context.region}, ${context.country}`,
        turismo: context.tourismLevel,
        flujoComercial: context.commercialFlow,
        presionCompetitiva: context.competitivePressure,
        estabilidadEconomica: context.economicStability,
        sensibilidadPrecio: context.priceSensitivity,
        facilidadRegulatoria: context.regulatoryEase,
        digitalizacion: context.digitalizationLevel,
        atractivoMercado: context.marketAttractiveness,
        narrativa: context.narrative,
        fuente: context.source
      },
      score: {
        final: scoreBreakdown.finalScore,
        clasificacion: scoreBreakdown.classification,
        interpretacion: scoreBreakdown.interpretation,
        fortalezas: scoreBreakdown.strengths.slice(0, 4),
        oportunidades: scoreBreakdown.opportunities.slice(0, 4),
        riesgos: scoreBreakdown.risks.slice(0, 5)
      },
      bloques: scoreBreakdown.blocks.map((block) => ({
        id: block.id,
        label: block.label,
        weight: block.weight,
        score: block.score,
        summary: block.summary,
        positives: block.positives.slice(0, 3),
        risks: block.risks.slice(0, 3),
        factors: block.factors.slice(0, 4).map((factor) => ({
          label: factor.label,
          score: factor.score,
          note: factor.note
        }))
      }))
    },
    null,
    2
  );
}

function normalizeInsightPayload(payload: z.infer<typeof geminiInsightSchema>) {
  return {
    ...payload,
    mainFindings: payload.mainFindings.slice(0, 5),
    opportunities: payload.opportunities.slice(0, 5),
    recommendations: payload.recommendations.slice(0, 6),
    principalRisks: payload.principalRisks.slice(0, 6),
    reportNarrative: {
      ...payload.reportNarrative,
      blockNarratives: Object.fromEntries(
        Object.entries(payload.reportNarrative.blockNarratives).map(([blockId, value]) => [
          blockId,
          {
            ...value,
            positives: value.positives.slice(0, 3),
            risks: value.risks.slice(0, 3),
            factorNarratives: value.factorNarratives.slice(0, 6)
          }
        ])
      ) as z.infer<typeof geminiInsightSchema>["reportNarrative"]["blockNarratives"]
    }
  };
}

function stripCodeFence(text: string) {
  return text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function extractBalancedJson(text: string) {
  const cleaned = stripCodeFence(text);
  const start = cleaned.search(/[\[{]/);

  if (start === -1) {
    return cleaned;
  }

  const opening = cleaned[start];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const char = cleaned[index];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }

      if (char === "\\") {
        escaping = true;
        continue;
      }

      if (char === "\"") {
        inString = false;
      }

      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
      continue;
    }

    if (char === closing) {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, index + 1);
      }
    }
  }

  return cleaned.slice(start).trim();
}

export function parseGeminiJson<T>(rawOutput: string): T {
  const directCandidate = rawOutput.trim();

  try {
    return JSON.parse(directCandidate) as T;
  } catch {
    const extractedCandidate = extractBalancedJson(directCandidate);
    return JSON.parse(extractedCandidate) as T;
  }
}

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

async function repairGeminiInsightsPayload(
  client: GoogleGenAI,
  model: string,
  rawOutput: string,
  sectionSchema: unknown,
  maxOutputTokens: number
) {
  const repairResponse = await client.models.generateContent({
    model,
    contents: `${systemPrompt.trim()}\n\nEl siguiente contenido intentó ser un JSON estructurado para un informe de factibilidad, pero quedó inválido o truncado. Reescríbelo como JSON válido que cumpla exactamente el esquema requerido. No agregues markdown ni explicación. Devuelve solo JSON.\n\nContenido defectuoso:\n${rawOutput}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: sectionSchema,
      temperature: 0.1,
      maxOutputTokens
    }
  });

  const repairedOutput = typeof repairResponse.text === "string" ? repairResponse.text.trim() : "";

  if (!repairedOutput) {
    throw new Error("Gemini no devolvió una reparación válida del JSON de insights.");
  }

  return parseGeminiJson(repairedOutput);
}

async function generateStructuredSection<T>(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  sectionSchema: unknown,
  validator: z.ZodType<T>,
  maxOutputTokens: number
) {
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: sectionSchema,
      temperature: 0.2,
      maxOutputTokens
    }
  });

  const rawOutput = typeof response.text === "string" ? response.text.trim() : "";

  if (!rawOutput) {
    throw new Error("Gemini no devolvió contenido estructurado.");
  }

  try {
    return validator.parse(parseGeminiJson(rawOutput));
  } catch {
    const repaired = await repairGeminiInsightsPayload(client, model, rawOutput, sectionSchema, maxOutputTokens);
    return validator.parse(repaired);
  }
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
  const compactPayload = buildCompactInsightPayload(input, context, scoreBreakdown);

  const core = await generateStructuredSection(
    client,
    model,
    `${systemPrompt.trim()}\n\nA partir de este caso, genera solo el núcleo ejecutivo del informe en JSON.\n\n${compactPayload}`,
    coreResponseSchema,
    coreInsightSchema,
    1400
  );

  const narrativeSections = await generateStructuredSection(
    client,
    model,
    `${systemPrompt.trim()}\n\nA partir de este caso, genera solo las secciones narrativas generales del informe en JSON: lectura del score final, metodología usada, contexto territorial y gráficos clave.\n\n${compactPayload}`,
    narrativeSectionResponseSchema,
    narrativeSectionSchema,
    1200
  );

  const blockNarrativesEntries = await Promise.all(
    scoreBreakdown.blocks.map(async (block) => {
      const blockPayload = JSON.stringify(
        {
          proyecto: {
            nombre: input.projectName,
            tipo: input.businessType,
            rubro: input.sector,
            ubicacion: `${input.city}, ${input.region}, ${input.country}`,
            publicoObjetivo: input.targetAudience
          },
          contexto: {
            narrativa: context.narrative,
            fuente: context.source
          },
          bloque: {
            id: block.id,
            label: block.label,
            weight: block.weight,
            score: block.score,
            summary: block.summary,
            positives: block.positives.slice(0, 3),
            risks: block.risks.slice(0, 3),
            factors: block.factors.slice(0, 5).map((factor) => ({
              label: factor.label,
              score: factor.score,
              note: factor.note
            }))
          },
          scoreFinal: {
            final: scoreBreakdown.finalScore,
            clasificacion: scoreBreakdown.classification
          }
        },
        null,
        2
      );

      const blockNarrative = await generateStructuredSection(
        client,
        model,
        `${systemPrompt.trim()}\n\nGenera solo el detalle del bloque ${block.label} en JSON.\n\nInstrucciones extra:\n- Redacta un análisis aplicado directamente al proyecto, no un comentario genérico.\n- Usa explícitamente la ubicación, el público objetivo, la propuesta comercial y las señales del contexto territorial cuando aporten valor.\n- Si el bloque es Porter, analiza cada fuerza como presión competitiva concreta para este negocio y explica su impacto en la factibilidad.\n- Si el bloque es SEPTE, Mercado, Finanzas u Operación, desarrolla cada subdimensión recibida en factors con una lectura clara y situada.\n- En factorNarratives debes devolver una entrada por cada subdimensión/fuerza relevante del bloque.\n- Cada assessment debe ser sustantivo, directo y conectado al proyecto.\n- Cada impact debe explicar cómo esa subdimensión afecta la viabilidad del negocio.\n\n${blockPayload}`,
        blockNarrativeResponseSchema,
        blockNarrativeSchema,
        1400
      );

      return [block.id, blockNarrative] as const;
    })
  );

  const parsed = geminiInsightSchema.parse(normalizeInsightPayload({
    ...core,
    reportNarrative: {
      ...narrativeSections,
      blockNarratives: Object.fromEntries(
        blockNarrativesEntries
      ) as z.infer<typeof geminiInsightSchema>["reportNarrative"]["blockNarratives"]
    }
  }));

  return {
    ...parsed,
    source: "gemini",
    provider: "gemini",
    model,
    generatedAt: new Date().toISOString()
  };
}
