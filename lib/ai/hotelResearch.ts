import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { createGeminiClient, describeGeminiError, isGeminiConfigured, parseGeminiJson } from "@/lib/ai/gemini";
import { buildFallbackResearchReport, HOTEL_DESTINATION_PROFILES } from "@/lib/hotel/data";
import type {
  HotelAttraction,
  HotelCaseInput,
  HotelCompetitor,
  HotelEvidencePoint,
  HotelForecastSummary,
  HotelResearchReport,
  HotelRoomRates,
  HotelSepteFactor,
  HotelStrategicPlan,
  HotelTouristStat,
  ResearchSource
} from "@/types";

const touristStatSchema = z.object({
  label: z.string().min(4),
  value: z.string().min(4),
  note: z.string().min(12),
  asOf: z.string().min(4).optional(),
  sourceTitle: z.string().min(3),
  sourceUrl: z.string().url()
});

const evidencePointSchema = z.object({
  label: z.string().min(3),
  value: z.string().min(2),
  note: z.string().min(10),
  asOf: z.string().min(4).optional(),
  sourceTitle: z.string().min(3),
  sourceUrl: z.string().url()
});

const attractionSchema = z.object({
  name: z.string().min(4),
  relevance: z.string().min(12),
  sourceTitle: z.string().min(3),
  sourceUrl: z.string().url()
});

const roomRatesSchema = z.object({
  single: z.number().min(1),
  double: z.number().min(1),
  triple: z.number().min(1),
  suite: z.number().min(1)
});

const competitorSchema = z.object({
  name: z.string().min(3),
  area: z.string().min(3),
  positioning: z.string().min(12),
  services: z.array(z.string().min(3)).min(2).max(6),
  facilities: z.array(z.string().min(3)).min(2).max(6),
  rates: roomRatesSchema,
  note: z.string().min(16)
});

const hotelResearchSchema = z.object({
  destinationDiagnosis: z.string().min(80),
  septeFactors: z.array(
    z.object({
      id: z.enum(["social", "economic", "political", "technological", "ecological", "legal"]),
      label: z.string().min(3),
      analysis: z.string().min(30),
      implication: z.string().min(24),
      evidence: z.array(evidencePointSchema).max(2)
    })
  ).min(1).max(6),
  competitionSummary: z.string().min(60),
  attractions: z.array(attractionSchema).min(4).max(8),
  touristStats: z.array(touristStatSchema).min(3).max(5),
  marketRateReference: roomRatesSchema,
  competitors: z.array(competitorSchema).min(1).max(5),
  strategicPlan: z.object({
    objective: z.string().min(20),
    positioning: z.string().min(20),
    goals: z.array(z.string().min(12)).min(3).max(5),
    actions: z.array(z.string().min(12)).min(3).max(6),
    commercialRationale: z.string().min(30),
    pricingRationale: z.string().min(30)
  })
});

const responseSchema = {
  type: "OBJECT",
  properties: {
    destinationDiagnosis: { type: "STRING" },
    septeFactors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: {
            type: "STRING",
            enum: ["social", "economic", "political", "technological", "ecological", "legal"]
          },
          label: { type: "STRING" },
          analysis: { type: "STRING" },
          implication: { type: "STRING" },
          evidence: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                label: { type: "STRING" },
                value: { type: "STRING" },
                note: { type: "STRING" },
                asOf: { type: "STRING" },
                sourceTitle: { type: "STRING" },
                sourceUrl: { type: "STRING" }
              },
              required: ["label", "value", "note", "sourceTitle", "sourceUrl"]
            }
          }
        },
        required: ["id", "label", "analysis", "implication", "evidence"]
      }
    },
    competitionSummary: { type: "STRING" },
    attractions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          relevance: { type: "STRING" },
          sourceTitle: { type: "STRING" },
          sourceUrl: { type: "STRING" }
        },
        required: ["name", "relevance", "sourceTitle", "sourceUrl"]
      }
    },
    touristStats: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          label: { type: "STRING" },
          value: { type: "STRING" },
          note: { type: "STRING" },
          asOf: { type: "STRING" },
          sourceTitle: { type: "STRING" },
          sourceUrl: { type: "STRING" }
        },
        required: ["label", "value", "note", "sourceTitle", "sourceUrl"]
      }
    },
    marketRateReference: {
      type: "OBJECT",
      properties: {
        single: { type: "NUMBER" },
        double: { type: "NUMBER" },
        triple: { type: "NUMBER" },
        suite: { type: "NUMBER" }
      },
      required: ["single", "double", "triple", "suite"]
    },
    competitors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          area: { type: "STRING" },
          positioning: { type: "STRING" },
          services: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          facilities: {
            type: "ARRAY",
            items: { type: "STRING" }
          },
          rates: {
            type: "OBJECT",
            properties: {
              single: { type: "NUMBER" },
              double: { type: "NUMBER" },
              triple: { type: "NUMBER" },
              suite: { type: "NUMBER" }
            },
            required: ["single", "double", "triple", "suite"]
          },
          note: { type: "STRING" }
        },
        required: ["name", "area", "positioning", "services", "facilities", "rates", "note"]
      }
    },
    strategicPlan: {
      type: "OBJECT",
      properties: {
        objective: { type: "STRING" },
        positioning: { type: "STRING" },
        goals: { type: "ARRAY", items: { type: "STRING" } },
        actions: { type: "ARRAY", items: { type: "STRING" } },
        commercialRationale: { type: "STRING" },
        pricingRationale: { type: "STRING" }
      },
      required: ["objective", "positioning", "goals", "actions", "commercialRationale", "pricingRationale"]
    }
  },
  required: [
    "destinationDiagnosis",
    "septeFactors",
    "competitionSummary",
    "attractions",
    "touristStats",
    "marketRateReference",
    "competitors",
    "strategicPlan"
  ]
} as const;
const overviewSectionSchema = z.object({
  destinationDiagnosis: z.string().min(80),
  competitionSummary: z.string().min(60),
  attractions: z.array(attractionSchema).min(4).max(8),
  touristStats: z.array(touristStatSchema).min(3).max(5),
  marketRateReference: roomRatesSchema
});

const septeSectionSchema = z.object({
  septeFactors: z.array(
    z.object({
      id: z.enum(["social", "economic", "political", "technological", "ecological", "legal"]),
      label: z.string().min(3),
      analysis: z.string().min(30),
      implication: z.string().min(24),
      evidence: z.array(evidencePointSchema).max(2)
    })
  ).min(1).max(6)
});

const competitorsSectionSchema = z.object({
  competitors: z.array(competitorSchema).min(1).max(5)
});

const planSectionSchema = z.object({
  strategicPlan: z.object({
    objective: z.string().min(20),
    positioning: z.string().min(20),
    goals: z.array(z.string().min(12)).min(3).max(5),
    actions: z.array(z.string().min(12)).min(3).max(6),
    commercialRationale: z.string().min(30),
    pricingRationale: z.string().min(30)
  })
});

const overviewResponseSchema = {
  type: "OBJECT",
  properties: {
    destinationDiagnosis: { type: "STRING" },
    competitionSummary: { type: "STRING" },
    attractions: responseSchema.properties.attractions,
    touristStats: responseSchema.properties.touristStats,
    marketRateReference: responseSchema.properties.marketRateReference
  },
  required: ["destinationDiagnosis", "competitionSummary", "attractions", "touristStats", "marketRateReference"]
} as const;

const septeResponseSchema = {
  type: "OBJECT",
  properties: {
    septeFactors: responseSchema.properties.septeFactors
  },
  required: ["septeFactors"]
} as const;

const competitorsResponseSchema = {
  type: "OBJECT",
  properties: {
    competitors: responseSchema.properties.competitors
  },
  required: ["competitors"]
} as const;

const planResponseSchema = {
  type: "OBJECT",
  properties: {
    strategicPlan: responseSchema.properties.strategicPlan
  },
  required: ["strategicPlan"]
} as const;

function extractResponseText(response: unknown) {
  if (response && typeof response === "object" && "text" in response && typeof response.text === "string") {
    const directText = response.text.trim();
    if (directText) return directText;
  }

  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates ?? [];

  return candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function extractGroundingSources(response: unknown) {
  const candidates = (
    response as {
      candidates?: Array<{
        groundingMetadata?: {
          groundingChunks?: Array<{
            web?: { title?: string; uri?: string };
            retrievedContext?: { title?: string; uri?: string };
          }>;
        };
      }>;
    }
  )?.candidates ?? [];

  const seen = new Set<string>();

  return candidates
    .flatMap((candidate) => candidate.groundingMetadata?.groundingChunks ?? [])
    .map((chunk) => {
      const source = chunk.web ?? chunk.retrievedContext;
      const title = source?.title?.trim();
      const url = source?.uri?.trim();

      if (!title || !url) return null;
      if (seen.has(url)) return null;

      seen.add(url);

      return {
        title,
        url,
        note: "Fuente capturada desde búsqueda grounded de Gemini para el caso hotelero."
      };
    })
    .filter((item): item is ResearchSource => Boolean(item))
    .slice(0, 8);
}

function normalizeSepte(septeFactors: HotelSepteFactor[], fallback: HotelSepteFactor[] = []) {
  const sanitizeEvidence = (evidence: HotelEvidencePoint[]) =>
    evidence.filter((item) => isUsableSourceUrl(item.sourceUrl)).slice(0, 2);

  const order = ["social", "economic", "political", "technological", "ecological", "legal"] as const;

  return order.map((id) => {
    const factor = septeFactors.find((item) => item.id === id);
    const fallbackFactor = fallback.find((item) => item.id === id);
    const sanitizedEvidence = sanitizeEvidence(factor?.evidence ?? []);
    const fallbackEvidence = sanitizeEvidence(fallbackFactor?.evidence ?? []);

    return (
      (factor
        ? {
            ...factor,
            evidence: sanitizedEvidence.length ? sanitizedEvidence : fallbackEvidence
          }
        : fallbackFactor
          ? {
              ...fallbackFactor,
              evidence: fallbackEvidence
            }
          : null) ?? {
        id,
        label: id.charAt(0).toUpperCase() + id.slice(1),
        analysis: "No se pudo generar una lectura especifica para este factor.",
        implication: "Se recomienda validar este punto manualmente antes de la decision final.",
        evidence: []
      }
    );
  });
}

function isUsableSourceUrl(url?: string) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.hostname === "example.com" || parsed.hostname.endsWith(".example.com")) return false;
    if (parsed.hostname === "ejemplo.com" || parsed.hostname.endsWith(".ejemplo.com")) return false;
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeTouristStats(input: HotelTouristStat[], fallback: HotelTouristStat[]) {
  if (!input.length) return fallback;

  const officialBase = fallback.slice(0, 4);
  const extraStats = input
    .filter((stat) => isUsableSourceUrl(stat.sourceUrl) && /\d/.test(stat.value))
    .filter((stat) => !officialBase.some((item) => item.label.toLowerCase() === stat.label.toLowerCase()))
    .slice(0, Math.max(0, 5 - officialBase.length));

  return [...officialBase, ...extraStats];
}

function normalizeAttractions(input: HotelAttraction[], fallback: HotelAttraction[]) {
  if (!input.length) return fallback;

  return input.slice(0, 8).map((attraction, index) => {
    const fallbackAttraction = fallback[index];
    if (!isUsableSourceUrl(attraction.sourceUrl)) {
      return fallbackAttraction ?? attraction;
    }

    return {
      ...attraction,
      sourceTitle:
        attraction.sourceTitle && isUsableSourceUrl(attraction.sourceUrl)
          ? attraction.sourceTitle
          : fallbackAttraction?.sourceTitle,
      sourceUrl: attraction.sourceUrl
    };
  });
}

function normalizeRates(input: HotelRoomRates, fallback: HotelRoomRates): HotelRoomRates {
  return {
    single: Number.isFinite(input.single) && input.single > 0 ? input.single : fallback.single,
    double: Number.isFinite(input.double) && input.double > 0 ? input.double : fallback.double,
    triple: Number.isFinite(input.triple) && input.triple > 0 ? input.triple : fallback.triple,
    suite: Number.isFinite(input.suite) && input.suite > 0 ? input.suite : fallback.suite
  };
}

function normalizeCompetitors(input: HotelCompetitor[], fallback: HotelCompetitor[]) {
  if (!input.length) return fallback;

  const normalized = input.slice(0, 5).map((competitor, index) => ({
    ...competitor,
    services: competitor.services.slice(0, 6),
    facilities: competitor.facilities.slice(0, 6),
    rates: normalizeRates(competitor.rates, fallback[index]?.rates ?? fallback[0].rates)
  }));

  let fallbackIndex = 0;
  while (normalized.length < 3 && fallbackIndex < fallback.length) {
    const candidate = fallback[fallbackIndex];
    if (!normalized.some((item) => item.name === candidate.name)) {
      normalized.push(candidate);
    }
    fallbackIndex += 1;
  }

  return normalized;
}

function mergeSources(groundedSources: ResearchSource[], fallbackSources: ResearchSource[]) {
  return [...groundedSources, ...fallbackSources].reduce<ResearchSource[]>((acc, source) => {
    if (!source.title || !isUsableSourceUrl(source.url)) return acc;
    if (acc.some((item) => item.url === source.url)) return acc;
    acc.push(source);
    return acc;
  }, []).slice(0, 10);
}

function collectResearchSources(
  septeFactors: HotelSepteFactor[],
  touristStats: HotelTouristStat[],
  attractions: HotelAttraction[]
) {
  const collected: ResearchSource[] = [];

  for (const factor of septeFactors) {
    for (const evidence of factor.evidence ?? []) {
      const sourceUrl = evidence.sourceUrl;
      if (evidence.sourceTitle && sourceUrl && isUsableSourceUrl(sourceUrl)) {
        collected.push({
          title: evidence.sourceTitle,
          url: sourceUrl,
          note: evidence.asOf ? `Dato citado para SEPTE. Periodo o fecha: ${evidence.asOf}.` : "Dato citado para SEPTE."
        });
      }
    }
  }

  for (const stat of touristStats) {
    const sourceUrl = stat.sourceUrl;
    if (stat.sourceTitle && sourceUrl && isUsableSourceUrl(sourceUrl)) {
      collected.push({
        title: stat.sourceTitle,
        url: sourceUrl,
        note: stat.asOf ? `Dato de demanda. Periodo o fecha: ${stat.asOf}.` : "Dato de demanda citado en el analisis."
      });
    }
  }

  for (const attraction of attractions) {
    const sourceUrl = attraction.sourceUrl;
    if (attraction.sourceTitle && sourceUrl && isUsableSourceUrl(sourceUrl)) {
      collected.push({
        title: attraction.sourceTitle,
        url: sourceUrl,
        note: "Fuente oficial o de referencia para el atractivo del destino."
      });
    }
  }

  return collected;
}

async function generateStructuredHotelResearch(
  client: GoogleGenAI,
  model: string,
  promptBase: string,
  fallback: HotelResearchReport
) {
  const generateSection = async <T>(
    prompt: string,
    schema: unknown,
    validator: z.ZodTypeAny,
    maxOutputTokens: number
  ): Promise<T> => {
    const runStructuredCall = async (contents: string, outputTokens: number, temperature = 0.2) => {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature,
          maxOutputTokens: outputTokens
        }
      });

      const text = extractResponseText(response);

      if (!text) {
        throw new Error("Gemini no devolvió una respuesta estructurada para el caso hotelero.");
      }

      return text;
    };

    const repairStructuredPayload = async (rawOutput: string, outputTokens: number) => {
      const repairResponse = await client.models.generateContent({
        model,
        contents: `El siguiente contenido intentó ser un JSON estructurado para un informe hotelero, pero quedó inválido, incompleto o truncado. Reescríbelo como JSON válido que cumpla exactamente el esquema requerido. No agregues markdown ni explicación. Devuelve solo JSON.\n\nContenido defectuoso:\n${rawOutput}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.1,
          maxOutputTokens: outputTokens
        }
      });

      const repairedOutput = extractResponseText(repairResponse);

      if (!repairedOutput) {
        throw new Error("Gemini no devolvió una reparación válida para el informe hotelero.");
      }

      return parseGeminiJson(repairedOutput);
    };

    const rawOutput = await runStructuredCall(prompt, maxOutputTokens);

    try {
      return validator.parse(parseGeminiJson(rawOutput)) as T;
    } catch {
      try {
        const repaired = await repairStructuredPayload(rawOutput, maxOutputTokens);
        return validator.parse(repaired) as T;
      } catch {
        const compactPrompt = `${prompt}

IMPORTANTE:
- Devuelve una versión compacta y estricta.
- No excedas el mínimo útil de texto por campo.
- No agregues explicación fuera del JSON.
- Si una lista puede ser breve, hazla breve.
- Prioriza JSON válido sobre extensión.`;

        const compactRawOutput = await runStructuredCall(compactPrompt, Math.min(maxOutputTokens, 900), 0.1);

        try {
          return validator.parse(parseGeminiJson(compactRawOutput)) as T;
        } catch {
          const repairedCompact = await repairStructuredPayload(compactRawOutput, Math.min(maxOutputTokens, 900));
          return validator.parse(repairedCompact) as T;
        }
      }
    }
  };

  const fallbackSections = {
    overview: {
      destinationDiagnosis: fallback.destinationDiagnosis,
      competitionSummary: fallback.competitionSummary,
      attractions: fallback.attractions,
      touristStats: fallback.touristStats,
      marketRateReference: fallback.marketRateReference
    },
    septe: {
      septeFactors: fallback.septeFactors
    },
    competitors: {
      competitors: fallback.competitors
    },
    plan: {
      strategicPlan: fallback.strategicPlan
    }
  };

  const sectionConfigs = [
    {
      key: "overview",
      label: "overview",
      prompt: `${promptBase}

Devuelve solo estas claves:
- destinationDiagnosis
- competitionSummary
- attractions
- touristStats
- marketRateReference

Limites:
- destinationDiagnosis: 2 o 3 frases.
- competitionSummary: 2 o 3 frases.
- attractions: 4 a 6 items con name, relevance, sourceTitle y sourceUrl. Usa atractivos reales del destino.
- touristStats: 3 o 4 items con metricas exactas, value, note, asOf, sourceTitle y sourceUrl.
- marketRateReference: valores utiles en USD.`,
      schema: overviewResponseSchema,
      validator: overviewSectionSchema,
      maxOutputTokens: 1000,
      fallback: fallbackSections.overview
    },
    {
      key: "septe",
      label: "SEPTE",
      prompt: `${promptBase}

Devuelve solo la clave septeFactors.
Reglas:
- exactamente 6 factores
- analysis e implication breves y concretos
- cada factor debe incluir exactamente 1 evidencia con metrica exacta, fecha o periodo cuando exista y fuente visible
- aplicado al hotel, no genérico`,
      schema: septeResponseSchema,
      validator: septeSectionSchema,
      maxOutputTokens: 1000,
      fallback: fallbackSections.septe
    },
    {
      key: "competitors",
      label: "competencia",
      prompt: `${promptBase}

Devuelve solo la clave competitors.
Reglas:
- exactamente 3 comparables premium o 5 estrellas
- services y facilities maximo 4 items por lista
- tarifas de referencia en USD
- note breve`,
      schema: competitorsResponseSchema,
      validator: competitorsSectionSchema,
      maxOutputTokens: 1200,
      fallback: fallbackSections.competitors
    },
    {
      key: "plan",
      label: "plan estrategico",
      prompt: `${promptBase}

Devuelve solo la clave strategicPlan.
Reglas:
- objetivo y posicionamiento breves
- goals: 3 a 5 metas concretas
- actions: 3 a 6 acciones concretas
- commercialRationale y pricingRationale breves`,
      schema: planResponseSchema,
      validator: planSectionSchema,
      maxOutputTokens: 1000,
      fallback: fallbackSections.plan
    }
  ] as const;

  const results = await Promise.allSettled(
    sectionConfigs.map((section) =>
      generateSection(section.prompt, section.schema, section.validator, section.maxOutputTokens)
    )
  );

  const merged: Record<string, unknown> = {};
  const warnings: string[] = [];

  results.forEach((result, index) => {
    const section = sectionConfigs[index];

    if (result.status === "fulfilled") {
      Object.assign(merged, result.value);
      return;
    }

    Object.assign(merged, section.fallback);
    warnings.push(`Se uso referencia base del destino en ${section.label} porque Gemini devolvio JSON invalido o truncado.`);
  });

  return {
    parsed: hotelResearchSchema.parse(merged),
    warnings
  };
}

export async function generateHotelResearch(
  input: HotelCaseInput,
  summary: HotelForecastSummary,
  options?: {
    requireGemini?: boolean;
  }
): Promise<HotelResearchReport> {
  const fallback = buildFallbackResearchReport(input);
  const requireGemini = options?.requireGemini ?? false;

  if (!isGeminiConfigured()) {
    if (requireGemini) {
      throw new Error("Gemini no está configurado en el servidor. Define GEMINI_API_KEY o GOOGLE_API_KEY y reinicia Next.js.");
    }

    return fallback;
  }

  try {
    const profile = HOTEL_DESTINATION_PROFILES[input.destination];
    const client = createGeminiClient();
    const researchModel = process.env.GEMINI_RESEARCH_MODEL ?? "gemini-2.5-flash";
    const model =
      process.env.GEMINI_HOTEL_MODEL ??
      process.env.GEMINI_RESEARCH_MODEL ??
      process.env.GEMINI_MODEL ??
      "gemini-2.5-flash";

    const researchPrompt = `
Investiga el siguiente caso hotelero usando Google Search y redacta un memo factual en español.

Caso:
${JSON.stringify(input, null, 2)}

Objetivo:
- diagnosticar el destino ${profile.label}
- identificar competencia 5 estrellas o premium comparable
- revisar servicios, instalaciones y tarifas de referencia
- resumir atractivos principales del destino
- identificar señales de demanda turistica con datos duros: turistas que entran a Chile, actividad o flujo regional, pernoctaciones, ocupacion y ADR cuando existan fuentes visibles
- entregar insumos para un SEPTE y para una estrategia comercial hotelera

Reglas:
- prioriza fuentes oficiales, hoteles oficiales, organismos publicos y referencias turisticas confiables
- si no encuentras una cifra exacta, explica la senal sin inventar y evita completar ese dato con aproximaciones falsas
- si el contexto base ya trae una metrica oficial, úsala como mínimo y no la reemplaces por una cifra menos confiable
- incorpora las tensiones entre ADR, ocupacion, canales y comisiones
- cuando cites metricas, anota periodo exacto o fecha absoluta si esta disponible
- mantente aplicado a este hotel y a enero/febrero 2027 como caso de forecast`;

    const researchMemoResponse = await client.models.generateContent({
      model: researchModel,
      contents: researchPrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
        maxOutputTokens: 2200
      }
    });

    const researchMemo = extractResponseText(researchMemoResponse);
    const groundedSources = extractGroundingSources(researchMemoResponse);
    const effectiveResearchMemo =
      researchMemo ||
      [
        `Destino: ${profile.label}.`,
        fallback.destinationDiagnosis,
        fallback.competitionSummary,
        `Atractivos base: ${fallback.attractions.map((attraction) => attraction.name).join(", ")}.`,
        `Senales turisticas base: ${fallback.touristStats.map((stat) => `${stat.label}: ${stat.value}`).join(" | ")}.`,
        `Meta ADR: US$${input.targetAverageRate}. ADR proyectado: US$${summary.weightedAverageAdr}.`
      ].join("\n");

    const compactStructuredContext = JSON.stringify(
      {
        caso: {
          hotel: input.hotelName,
          destino: profile.label,
          region: input.region,
          categoria: input.category,
          concepto: input.concept,
          servicios: input.services,
          diferenciacion: input.differentiation
        },
        objetivoFinanciero: {
          adrMeta: input.targetAverageRate,
          adrHistorico: input.previousAverageRate,
          ocupacionEnero: input.occupancyJanuary,
          ocupacionFebrero: input.occupancyFebruary,
          canalRentable: summary.mostProfitableChannel,
          comisiones: summary.totalCommissions,
          adrLogrado: summary.weightedAverageAdr
        },
        referenciaDestino: {
          atractivosBase: profile.attractions.slice(0, 4),
          tarifasBase: profile.marketRateReference,
          metricasOficialesBase: fallback.touristStats.map((stat) => ({
            indicador: stat.label,
            valor: stat.value,
            fecha: stat.asOf,
            fuente: stat.sourceTitle,
            url: stat.sourceUrl
          })),
          evidenciaSepteBase: fallback.septeFactors.map((factor) => ({
            factor: factor.label,
            evidencia: (factor.evidence ?? []).map((item) => ({
              label: item.label,
              value: item.value,
              asOf: item.asOf,
              sourceTitle: item.sourceTitle,
              sourceUrl: item.sourceUrl
            }))
          }))
        }
      },
      null,
      2
    );

    const memoForStructuring = effectiveResearchMemo.slice(0, 7000);

    const structuredPrompt = `
Eres un consultor senior hotelero.
Debes devolver solo JSON valido en español, aplicado al caso.
No inventes cifras exactas si el memo no las sustenta.
Usa el memo grounded y el perfil base para estructurar un informe accionable.

Contexto resumido:
${compactStructuredContext}

Memo grounded:
${memoForStructuring}

Instrucciones:
- destinationDiagnosis: 2 o 3 frases, maximo 420 caracteres.
- septeFactors: exactamente 6 factores. analysis e implication deben ser breves y concretos. Cada factor debe incluir exactamente 1 evidencia con label, value, note, asOf, sourceTitle y sourceUrl.
- competitionSummary: 2 o 3 frases, maximo 380 caracteres.
- attractions: 4 a 6 items reales con name, relevance, sourceTitle y sourceUrl. Prioriza fuentes oficiales del destino.
- touristStats: 3 o 4 metricas reales con label, value, note, asOf, sourceTitle y sourceUrl. Deben incluir, cuando exista en el contexto, llegadas de turistas a Chile y volumen o desempeño turistico regional con pernoctaciones, ocupacion o ADR. Prioriza INE, Subsecretaria de Turismo, SERNATUR u organismos oficiales.
- marketRateReference: estimacion util para el modelo, en USD.
- competitors: exactamente 3 comparables premium o 5 estrellas. services y facilities maximo 4 items por lista. note breve.
- strategicPlan: debe explicar metas, acciones y relacion entre canales, ADR y ocupacion con textos cortos.
- Si el contexto base ya trae metrica oficial y fuente valida, preservala y usala dentro del JSON final.
- Prioriza brevedad, claridad y JSON valido por sobre extension.`;

    const { parsed, warnings } = await generateStructuredHotelResearch(client, model, structuredPrompt, fallback);
    const normalizedSepte = normalizeSepte(parsed.septeFactors, fallback.septeFactors);
    const normalizedTouristStats = normalizeTouristStats(parsed.touristStats as HotelTouristStat[], fallback.touristStats);
    const normalizedAttractions = normalizeAttractions(parsed.attractions as HotelAttraction[], fallback.attractions);

    return {
      destinationLabel: profile.label,
      destinationDiagnosis: parsed.destinationDiagnosis,
      septeFactors: normalizedSepte,
      competitionSummary: parsed.competitionSummary,
      competitors: normalizeCompetitors(parsed.competitors, fallback.competitors),
      attractions: normalizedAttractions,
      touristStats: normalizedTouristStats,
      marketRateReference: normalizeRates(parsed.marketRateReference, fallback.marketRateReference),
      strategicPlan: parsed.strategicPlan as HotelStrategicPlan,
      sources: mergeSources(
        [
          ...groundedSources,
          ...collectResearchSources(normalizedSepte, normalizedTouristStats, normalizedAttractions)
        ],
        fallback.sources
      ),
      mode: "gemini",
      warning: warnings.length > 0 ? warnings.join(" ") : undefined
    };
  } catch (error) {
    console.error("[hotelResearch] Gemini error:", error);

    if (requireGemini) {
      throw new Error(describeGeminiError(error, { fallbackUsed: false }));
    }

    return {
      ...fallback,
      warning: describeGeminiError(error)
    };
  }
}
