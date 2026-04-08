import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { describeGeminiError, generateGeminiInsights, isGeminiConfigured, parseGeminiJson } from "@/lib/ai/gemini";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { mergeProjectDraft } from "@/lib/project-draft";
import { clamp } from "@/lib/utils";
import type { EvaluationSnapshot, ProjectDraft, PriceRange } from "@/types";

const projectImportSchema = z.object({
  projectPatch: z
    .object({
      projectName: z.string().nullable().optional(),
      businessType: z.string().nullable().optional(),
      sector: z.string().nullable().optional(),
      country: z.string().nullable().optional(),
      region: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      targetAudience: z.string().nullable().optional(),
      priceRange: z.enum(["económico", "medio", "premium"]).nullable().optional(),
      marketSize: z.number().min(1).max(10).nullable().optional(),
      expectedDemand: z.number().min(1).max(10).nullable().optional(),
      segmentationClarity: z.number().min(1).max(10).nullable().optional(),
      customerFit: z.number().min(1).max(10).nullable().optional(),
      footTraffic: z.number().min(1).max(10).nullable().optional(),
      tourismLevel: z.number().min(1).max(10).nullable().optional(),
      digitalizationLevel: z.number().min(1).max(10).nullable().optional(),
      consumerBehavior: z.number().min(1).max(10).nullable().optional(),
      competitorCount: z.number().min(0).max(25).nullable().optional(),
      differentiationLevel: z.number().min(1).max(10).nullable().optional(),
      customerPower: z.number().min(1).max(10).nullable().optional(),
      supplierDependency: z.number().min(1).max(10).nullable().optional(),
      substituteThreat: z.number().min(1).max(10).nullable().optional(),
      newEntrantsThreat: z.number().min(1).max(10).nullable().optional(),
      initialInvestment: z.number().min(1000).nullable().optional(),
      fixedCosts: z.number().min(100).nullable().optional(),
      variableCostRate: z.number().min(1).max(90).nullable().optional(),
      averageTicket: z.number().min(1).nullable().optional(),
      monthlySalesProjection: z.number().min(100).nullable().optional(),
      expectedMarginPercent: z.number().min(1).max(80).nullable().optional(),
      operationalComplexity: z.number().min(1).max(10).nullable().optional(),
      personnelRequired: z.number().min(1).max(40).nullable().optional(),
      logisticsComplexity: z.number().min(1).max(10).nullable().optional(),
      legalDifficulty: z.number().min(1).max(10).nullable().optional(),
      permitComplexity: z.number().min(1).max(10).nullable().optional(),
      entryBarriers: z.number().min(1).max(10).nullable().optional(),
      sustainabilityReadiness: z.number().min(1).max(10).nullable().optional(),
      knownStrengths: z.string().nullable().optional(),
      knownRisks: z.string().nullable().optional()
    })
    .default({}),
  confidenceNote: z.string().min(12),
  missingFields: z.array(z.string()).max(8)
});

const responseSchema = {
  type: "OBJECT",
  properties: {
    projectPatch: {
      type: "OBJECT",
      properties: {
        projectName: { type: "STRING", nullable: true },
        businessType: { type: "STRING", nullable: true },
        sector: { type: "STRING", nullable: true },
        country: { type: "STRING", nullable: true },
        region: { type: "STRING", nullable: true },
        city: { type: "STRING", nullable: true },
        description: { type: "STRING", nullable: true },
        targetAudience: { type: "STRING", nullable: true },
        priceRange: { type: "STRING", nullable: true, enum: ["económico", "medio", "premium"] },
        marketSize: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        expectedDemand: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        segmentationClarity: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        customerFit: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        footTraffic: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        tourismLevel: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        digitalizationLevel: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        consumerBehavior: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        competitorCount: { type: "NUMBER", nullable: true, minimum: 0, maximum: 25 },
        differentiationLevel: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        customerPower: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        supplierDependency: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        substituteThreat: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        newEntrantsThreat: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        initialInvestment: { type: "NUMBER", nullable: true, minimum: 1000 },
        fixedCosts: { type: "NUMBER", nullable: true, minimum: 100 },
        variableCostRate: { type: "NUMBER", nullable: true, minimum: 1, maximum: 90 },
        averageTicket: { type: "NUMBER", nullable: true, minimum: 1 },
        monthlySalesProjection: { type: "NUMBER", nullable: true, minimum: 100 },
        expectedMarginPercent: { type: "NUMBER", nullable: true, minimum: 1, maximum: 80 },
        operationalComplexity: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        personnelRequired: { type: "NUMBER", nullable: true, minimum: 1, maximum: 40 },
        logisticsComplexity: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        legalDifficulty: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        permitComplexity: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        entryBarriers: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        sustainabilityReadiness: { type: "NUMBER", nullable: true, minimum: 1, maximum: 10 },
        knownStrengths: { type: "STRING", nullable: true },
        knownRisks: { type: "STRING", nullable: true }
      }
    },
    confidenceNote: { type: "STRING" },
    missingFields: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  },
  required: ["projectPatch", "confidenceNote", "missingFields"]
} as const;

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactPatch(rawPatch: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(rawPatch).filter(([, value]) => value !== null && value !== undefined && value !== "")
  ) as ProjectDraft;
}

function cleanText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function extractAmountAfterKeywords(text: string, keywords: string[]) {
  const normalized = normalizeText(text).replace(/\./g, "").replace(/,/g, ".");

  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`${escaped}[^\\d]*(\\d+(?:\\.\\d+)?)`, "i").exec(normalized);

    if (match) {
      let value = Number(match[1]);
      if (normalized.includes("millones")) {
        value *= 1_000_000;
      }
      return value;
    }
  }

  return null;
}

function extractScoreAfterKeywords(text: string, keywords: string[]) {
  const normalized = normalizeText(text);

  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = new RegExp(`${escaped}[^\\d]*(\\d{1,2})(?:\\s*(?:\\/|de)\\s*10)?`, "i").exec(normalized);

    if (match) {
      return clamp(Number(match[1]), 1, 10);
    }
  }

  return null;
}

function inferProjectName(text: string) {
  const patterns = [
    /proyecto\s*[:\-]\s*([^\n.]+)/i,
    /nombre(?: del proyecto)?\s*[:\-]\s*([^\n.]+)/i,
    /se llamara\s+["']?([^"'.\n,]+)["']?/i,
    /se llamará\s+["']?([^"'.\n,]+)["']?/i
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.[1]) {
      return cleanText(match[1]);
    }
  }

  return undefined;
}

function inferBusinessType(text: string) {
  const normalized = normalizeText(text);

  if ((normalized.includes("pizza") || normalized.includes("pizzeria")) && normalized.includes("sushi")) {
    return { businessType: "Pizzería y sushi", sector: "Gastronomía" };
  }
  if (normalized.includes("cafeter")) return { businessType: "Cafetería", sector: "Gastronomía" };
  if (normalized.includes("hotel") || normalized.includes("boutique")) {
    return { businessType: "Hotel boutique", sector: "Turismo y hospitalidad" };
  }
  if (normalized.includes("tienda online") || normalized.includes("ecommerce") || normalized.includes("e-commerce")) {
    return { businessType: "Tienda online", sector: "Comercio electrónico" };
  }
  if (normalized.includes("restaurante")) return { businessType: "Restaurante", sector: "Gastronomía" };
  if (normalized.includes("app") || normalized.includes("software") || normalized.includes("saas")) {
    return { businessType: "Solución digital", sector: "Tecnología" };
  }

  return {};
}

function inferAudience(text: string) {
  const normalized = normalizeText(text);

  if (normalized.includes("universitario")) return "Estudiantes universitarios";
  if (normalized.includes("turista")) return "Turistas";
  if (normalized.includes("mascotas")) return "Dueños de mascotas";
  if (normalized.includes("familia")) return "Familias";
  if (normalized.includes("empresa") || normalized.includes("pyme")) return "Empresas y pymes";

  return undefined;
}

function inferPriceRange(text: string): PriceRange | undefined {
  const normalized = normalizeText(text);

  if (normalized.includes("premium") || normalized.includes("alto valor")) return "premium";
  if (normalized.includes("economico") || normalized.includes("barato")) return "económico";
  if (normalized.includes("ticket medio") || normalized.includes("precio medio") || normalized.includes("medio")) {
    return "medio";
  }

  return undefined;
}

function inferLocationPatch(text: string) {
  const normalized = normalizeText(text);
  const patch: ProjectDraft = {};

  if (normalized.includes("chile")) patch.country = "Chile";
  if (normalized.includes("argentina")) patch.country = "Argentina";
  if (normalized.includes("colombia")) patch.country = "Colombia";
  if (normalized.includes("peru")) patch.country = "Perú";

  if (normalized.includes("santiago")) {
    patch.city = "Santiago";
    patch.region = "Región Metropolitana";
    patch.country = patch.country ?? "Chile";
  } else if (normalized.includes("pucon") || normalized.includes("pucón")) {
    patch.city = "Pucón";
    patch.region = "La Araucanía";
    patch.country = patch.country ?? "Chile";
  } else if (normalized.includes("buenos aires")) {
    patch.city = "Buenos Aires";
    patch.region = "Buenos Aires";
    patch.country = patch.country ?? "Argentina";
  } else if (normalized.includes("lima")) {
    patch.city = "Lima";
    patch.region = "Lima";
    patch.country = patch.country ?? "Perú";
  }

  return patch;
}

function inferDescription(text: string, businessType?: string) {
  const explicitMatch = /descripcion\s*[:\-]\s*([^\n]+)/i.exec(text);
  if (explicitMatch?.[1]) {
    return cleanText(explicitMatch[1]);
  }

  if (businessType === "Cafetería") {
    return "Cafetería con foco en conveniencia, recurrencia de consumo y propuesta adaptada al flujo del sector.";
  }
  if (businessType === "Hotel boutique") {
    return "Proyecto hotelero orientado a experiencia diferencial, ocupación turística y ticket de valor agregado.";
  }
  if (businessType === "Tienda online") {
    return "Proyecto de comercio digital enfocado en nicho definido, operación escalable y adquisición online.";
  }

  const firstSentence = cleanText(text).split(/[.!?]/)[0];
  return firstSentence.length > 40 ? firstSentence : undefined;
}

function applyDefaults(draft: ProjectDraft) {
  const withDefaults: ProjectDraft = { ...draft };

  withDefaults.projectName = withDefaults.projectName ?? withDefaults.businessType ?? "Proyecto importado";
  withDefaults.targetAudience = withDefaults.targetAudience ?? "Segmento objetivo por validar";
  withDefaults.priceRange = withDefaults.priceRange ?? "medio";
  withDefaults.description = withDefaults.description ?? "Proyecto importado desde documento o texto libre.";

  withDefaults.marketSize = withDefaults.marketSize ?? 6;
  withDefaults.expectedDemand = withDefaults.expectedDemand ?? 6;
  withDefaults.segmentationClarity = withDefaults.segmentationClarity ?? (withDefaults.targetAudience ? 7 : 6);
  withDefaults.customerFit = withDefaults.customerFit ?? 6;
  withDefaults.footTraffic = withDefaults.footTraffic ?? 6;
  withDefaults.tourismLevel = withDefaults.tourismLevel ?? 5;
  withDefaults.digitalizationLevel = withDefaults.digitalizationLevel ?? 6;
  withDefaults.consumerBehavior = withDefaults.consumerBehavior ?? 6;
  withDefaults.competitorCount = withDefaults.competitorCount ?? 5;
  withDefaults.differentiationLevel = withDefaults.differentiationLevel ?? 6;
  withDefaults.customerPower = withDefaults.customerPower ?? 5;
  withDefaults.supplierDependency = withDefaults.supplierDependency ?? 5;
  withDefaults.substituteThreat = withDefaults.substituteThreat ?? 5;
  withDefaults.newEntrantsThreat = withDefaults.newEntrantsThreat ?? 5;
  withDefaults.initialInvestment = withDefaults.initialInvestment ?? 50000;
  withDefaults.fixedCosts = withDefaults.fixedCosts ?? 8000;
  withDefaults.variableCostRate = withDefaults.variableCostRate ?? 35;
  withDefaults.averageTicket = withDefaults.averageTicket ?? 30;
  withDefaults.monthlySalesProjection = withDefaults.monthlySalesProjection ?? 18000;
  withDefaults.expectedMarginPercent = withDefaults.expectedMarginPercent ?? 18;
  withDefaults.operationalComplexity = withDefaults.operationalComplexity ?? 5;
  withDefaults.personnelRequired = withDefaults.personnelRequired ?? 6;
  withDefaults.logisticsComplexity = withDefaults.logisticsComplexity ?? 5;
  withDefaults.legalDifficulty = withDefaults.legalDifficulty ?? 4;
  withDefaults.permitComplexity = withDefaults.permitComplexity ?? 4;
  withDefaults.entryBarriers = withDefaults.entryBarriers ?? 5;
  withDefaults.sustainabilityReadiness = withDefaults.sustainabilityReadiness ?? 6;

  return withDefaults;
}

function buildHeuristicDraft(content: string) {
  const patch: ProjectDraft = {};
  const businessTypePatch = inferBusinessType(content);

  Object.assign(patch, businessTypePatch);
  Object.assign(patch, inferLocationPatch(content));

  patch.projectName = inferProjectName(content) ?? patch.projectName ?? businessTypePatch.businessType;
  patch.targetAudience = inferAudience(content);
  patch.priceRange = inferPriceRange(content);
  patch.description = inferDescription(content, businessTypePatch.businessType);

  patch.initialInvestment = extractAmountAfterKeywords(content, ["inversion", "invertir", "capital inicial"]) ?? undefined;
  patch.fixedCosts = extractAmountAfterKeywords(content, ["costos fijos", "costo fijo"]) ?? undefined;
  patch.monthlySalesProjection = extractAmountAfterKeywords(content, ["ventas", "facturacion", "facturación"]) ?? undefined;
  patch.averageTicket = extractAmountAfterKeywords(content, ["ticket"]) ?? undefined;
  patch.competitorCount = extractScoreAfterKeywords(content, ["competidores", "competidor"]) ?? undefined;
  patch.expectedDemand = extractScoreAfterKeywords(content, ["demanda"]) ?? undefined;
  patch.differentiationLevel = extractScoreAfterKeywords(content, ["diferenciacion", "diferenciación"]) ?? undefined;
  patch.substituteThreat = extractScoreAfterKeywords(content, ["sustitutos", "sustituto"]) ?? undefined;
  patch.operationalComplexity = extractScoreAfterKeywords(content, ["complejidad operativa", "operacion"]) ?? undefined;
  patch.legalDifficulty = extractScoreAfterKeywords(content, ["dificultad legal", "legal"]) ?? undefined;
  patch.permitComplexity = extractScoreAfterKeywords(content, ["permisos", "permiso"]) ?? undefined;
  patch.expectedMarginPercent = extractScoreAfterKeywords(content, ["margen"]) ?? undefined;

  return compactPatch(applyDefaults(patch) as Record<string, unknown>);
}

async function inferDraftWithGemini(content: string, heuristicDraft: ProjectDraft) {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });

  const prompt = `
Eres un analista que transforma descripciones o informes en un proyecto evaluable.
Debes extraer solo lo que pueda inferirse con respaldo razonable desde el texto.
Si un dato no aparece, déjalo fuera del patch.
No inventes ubicaciones, montos ni porcentajes.
Responde siempre en español y solo con JSON.

Texto base:
${content.slice(0, 24000)}

Base heurística previa:
${JSON.stringify(heuristicDraft, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.2
    }
  });

  return projectImportSchema.parse(parseGeminiJson(response.text ?? ""));
}

export async function importProjectFromText(
  content: string
): Promise<{
  snapshot: EvaluationSnapshot;
  note: string;
  mode: "gemini" | "fallback";
  missingFields: string[];
}> {
  const heuristicDraft = buildHeuristicDraft(content);
  let draft = heuristicDraft;
  let note = "Proyecto reconstruido con inferencias locales a partir del contenido importado.";
  let missingFields = ["ubicación específica", "supuestos financieros finos", "detalle operativo"];
  let mode: "gemini" | "fallback" = "fallback";

  if (isGeminiConfigured()) {
    try {
      const aiResult = await inferDraftWithGemini(content, heuristicDraft);
      draft = {
        ...draft,
        ...compactPatch(aiResult.projectPatch)
      };
      note = aiResult.confidenceNote;
      missingFields = aiResult.missingFields;
      mode = "gemini";
    } catch (error) {
      note = `Se usó extracción local porque Gemini no pudo estructurar el documento: ${describeGeminiError(error)}`;
    }
  }

  let snapshot = buildEvaluationSnapshot(mergeProjectDraft(draft));

  if (isGeminiConfigured()) {
    try {
      snapshot = {
        ...snapshot,
        insights: await generateGeminiInsights(snapshot.input, snapshot.context, snapshot.scoreBreakdown)
      };
    } catch {
      // Keep the locally generated insight package if Gemini fails at this step.
    }
  }

  return {
    snapshot,
    note,
    mode,
    missingFields
  };
}
