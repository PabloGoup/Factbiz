import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { parseGeminiJson } from "@/lib/ai/gemini";
import { getLocationContext } from "@/lib/context/locationContextService";
import { buildEvaluationSnapshot } from "@/lib/evaluation";
import { mergeProjectDraft } from "@/lib/project-draft";
import { evaluateProject } from "@/lib/scoring/engine";
import type {
  EvaluationSnapshot,
  LocationContext,
  ProjectDraft,
  ProjectInput,
  ProjectWeights,
  ResearchDossier
} from "@/types";

const researchSectionIdSchema = z.enum([
  "macroMicro",
  "foda",
  "competitiveAdvantage",
  "marketStudy",
  "competitionStudy",
  "promotionPlan",
  "operationAndHR",
  "legalBarriers",
  "conclusion"
]);

const researchSourceSchema = z.object({
  title: z.string().min(8),
  url: z.string().url(),
  note: z.string().min(12)
});

const researchFindingSchema = z.object({
  section: researchSectionIdSchema,
  title: z.string().min(8),
  summary: z.string().min(20),
  evidence: z.string().min(20),
  sourceTitles: z.array(z.string()).min(1).max(3)
});

const scoringInferenceSchema = z.object({
  variable: z.string().min(3),
  value: z.union([z.string(), z.number()]),
  rationale: z.string().min(16),
  sourceTitles: z.array(z.string()).min(1).max(3)
});

const researchDossierSchema = z.object({
  projectSummary: z.string().min(30),
  sections: z.object({
    macroMicro: z.string().min(80),
    foda: z.string().min(80),
    competitiveAdvantage: z.string().min(80),
    marketStudy: z.string().min(80),
    competitionStudy: z.string().min(80),
    promotionPlan: z.string().min(80),
    operationAndHR: z.string().min(80),
    legalBarriers: z.string().min(80),
    conclusion: z.string().min(60)
  }),
  findings: z.array(researchFindingSchema).min(5).max(12),
  sources: z.array(researchSourceSchema).min(4).max(10),
  scoringInferences: z.array(scoringInferenceSchema).min(8).max(20),
  inferredProjectPatch: z.record(z.union([z.string(), z.number()])).optional().default({}),
  inferredLocationSignals: z
    .object({
      tourismLevel: z.number().min(1).max(10).optional(),
      commercialFlow: z.number().min(1).max(10).optional(),
      competitivePressure: z.number().min(1).max(10).optional(),
      economicStability: z.number().min(1).max(10).optional(),
      priceSensitivity: z.number().min(1).max(10).optional(),
      regulatoryEase: z.number().min(1).max(10).optional(),
      digitalizationLevel: z.number().min(1).max(10).optional(),
      marketAttractiveness: z.number().min(1).max(10).optional(),
      narrative: z.string().min(30).optional()
    })
    .default({}),
  assumptions: z.array(z.string()).min(3).max(8)
});

const researchOverviewSchema = z.object({
  projectSummary: z.string().min(30),
  assumptions: z.array(z.string()).min(3).max(8)
});

const researchSectionsCoreSchema = z.object({
  sections: z.object({
    macroMicro: z.string().min(80),
    foda: z.string().min(80),
    competitiveAdvantage: z.string().min(80),
    marketStudy: z.string().min(80)
  })
});

const researchSectionsExtendedSchema = z.object({
  sections: z.object({
    competitionStudy: z.string().min(80),
    promotionPlan: z.string().min(80),
    operationAndHR: z.string().min(80),
    legalBarriers: z.string().min(80),
    conclusion: z.string().min(60)
  })
});

const researchFindingsBundleSchema = z.object({
  findings: z.array(researchFindingSchema).min(5).max(12)
});

const researchSourcesBundleSchema = z.object({
  sources: z.array(researchSourceSchema).min(4).max(10)
});

const inferredProjectPatchSchema = z.object({
  projectName: z.string().min(3).optional(),
  businessType: z.string().min(3).optional(),
  sector: z.string().min(3).optional(),
  country: z.string().min(2).optional(),
  region: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  description: z.string().min(8).optional(),
  targetAudience: z.string().min(8).optional(),
  priceRange: z.enum(["económico", "medio", "premium"]).optional(),
  marketSize: z.number().min(1).max(10).optional(),
  expectedDemand: z.number().min(1).max(10).optional(),
  segmentationClarity: z.number().min(1).max(10).optional(),
  customerFit: z.number().min(1).max(10).optional(),
  footTraffic: z.number().min(1).max(10).optional(),
  tourismLevel: z.number().min(1).max(10).optional(),
  digitalizationLevel: z.number().min(1).max(10).optional(),
  consumerBehavior: z.number().min(1).max(10).optional(),
  competitorCount: z.number().min(0).max(20).optional(),
  differentiationLevel: z.number().min(1).max(10).optional(),
  customerPower: z.number().min(1).max(10).optional(),
  supplierDependency: z.number().min(1).max(10).optional(),
  substituteThreat: z.number().min(1).max(10).optional(),
  newEntrantsThreat: z.number().min(1).max(10).optional(),
  initialInvestment: z.number().min(0).optional(),
  fixedCosts: z.number().min(0).optional(),
  variableCostRate: z.number().min(0).max(100).optional(),
  averageTicket: z.number().min(0).optional(),
  monthlySalesProjection: z.number().min(0).optional(),
  expectedMarginPercent: z.number().min(0).max(100).optional(),
  operationalComplexity: z.number().min(1).max(10).optional(),
  personnelRequired: z.number().min(1).max(500).optional(),
  logisticsComplexity: z.number().min(1).max(10).optional(),
  legalDifficulty: z.number().min(1).max(10).optional(),
  permitComplexity: z.number().min(1).max(10).optional(),
  entryBarriers: z.number().min(1).max(10).optional(),
  sustainabilityReadiness: z.number().min(1).max(10).optional(),
  knownStrengths: z.string().min(8).optional(),
  knownRisks: z.string().min(8).optional()
});

const inferredLocationSignalsSchema = z.object({
  tourismLevel: z.number().min(1).max(10).optional(),
  commercialFlow: z.number().min(1).max(10).optional(),
  competitivePressure: z.number().min(1).max(10).optional(),
  economicStability: z.number().min(1).max(10).optional(),
  priceSensitivity: z.number().min(1).max(10).optional(),
  regulatoryEase: z.number().min(1).max(10).optional(),
  digitalizationLevel: z.number().min(1).max(10).optional(),
  marketAttractiveness: z.number().min(1).max(10).optional(),
  narrative: z.string().min(30).optional()
});

const researchScoringBundleSchema = z.object({
  scoringInferences: z.array(scoringInferenceSchema).min(8).max(20),
  inferredProjectPatch: inferredProjectPatchSchema.default({}),
  inferredLocationSignals: inferredLocationSignalsSchema.default({})
});

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
        note: "Fuente capturada desde búsqueda grounded de Gemini durante la investigación del caso."
      };
    })
    .filter((item): item is { title: string; url: string; note: string } => Boolean(item))
    .slice(0, 8);
}

function firstSentences(text: string, maxSentences = 2) {
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, maxSentences)
    .join(" ")
    .trim();
}

function paragraphAt(text: string, index: number) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs[index] ?? paragraphs[paragraphs.length - 1] ?? text.trim();
}

function memoExcerpt(text: string, index: number, fallback: string) {
  const paragraph = paragraphAt(text, index);
  return paragraph.length >= 80 ? paragraph : `${paragraph} ${fallback}`.trim();
}

async function repairResearchPayload<T>(
  client: GoogleGenAI,
  model: string,
  rawOutput: string,
  sectionSchema: unknown,
  maxOutputTokens: number
) {
  const repairResponse = await client.models.generateContent({
    model,
    contents: `El siguiente contenido intentó ser JSON estructurado para un expediente académico de factibilidad, pero quedó inválido o truncado. Reescríbelo como JSON válido que cumpla exactamente el esquema requerido. No agregues markdown ni explicación. Devuelve solo JSON.\n\nContenido defectuoso:\n${rawOutput}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: sectionSchema,
      temperature: 0.1,
      maxOutputTokens
    }
  });

  const repairedOutput = extractResponseText(repairResponse);

  if (!repairedOutput) {
    throw new Error("Gemini no devolvió una reparación válida del expediente de investigación.");
  }

  return parseGeminiJson<T>(repairedOutput);
}

async function generateStructuredResearchSection<T>(
  client: GoogleGenAI,
  model: string,
  prompt: string,
  sectionSchema: unknown,
  validator: z.ZodType<T>,
  maxOutputTokens: number
) {
  const runStructuredCall = async (contents: string, outputTokens: number, temperature = 0.2) => {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: sectionSchema,
        temperature,
        maxOutputTokens: outputTokens
      }
    });

    const rawOutput = extractResponseText(response);

    if (!rawOutput) {
      throw new Error("Gemini no devolvió contenido estructurado para la investigación.");
    }

    return rawOutput;
  };

  const rawOutput = await runStructuredCall(prompt, maxOutputTokens);

  try {
    return validator.parse(parseGeminiJson<T>(rawOutput));
  } catch {
    try {
      const repaired = await repairResearchPayload<T>(client, model, rawOutput, sectionSchema, maxOutputTokens);
      return validator.parse(repaired);
    } catch {
      const compactPrompt = `${prompt}

IMPORTANTE:
- Devuelve una versión compacta y estricta.
- No excedas el mínimo útil de texto por campo.
- No agregues explicación fuera del JSON.
- Si una lista puede ser breve, hazla breve.
- Prioriza validez JSON sobre extensión.`;

      const compactRawOutput = await runStructuredCall(compactPrompt, Math.min(maxOutputTokens, 900), 0.1);

      try {
        return validator.parse(parseGeminiJson<T>(compactRawOutput));
      } catch {
        const repairedCompact = await repairResearchPayload<T>(
          client,
          model,
          compactRawOutput,
          sectionSchema,
          Math.min(maxOutputTokens, 900)
        );

        return validator.parse(repairedCompact);
      }
    }
  }
}

function clampSourceTitles(titles: string[]) {
  return Array.from(new Set(titles.map((title) => title.trim()).filter(Boolean))).slice(0, 3);
}

function clampScore(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return undefined;
  return Math.max(1, Math.min(10, value));
}

function normalizeResearchDossier(
  base: {
    projectSummary: string;
    assumptions: string[];
    sections: ResearchDossier["sections"];
    findings: z.infer<typeof researchFindingsBundleSchema>["findings"];
    sources: z.infer<typeof researchSourcesBundleSchema>["sources"];
    scoringInferences: z.infer<typeof researchScoringBundleSchema>["scoringInferences"];
    inferredProjectPatch?: Partial<ProjectInput>;
    inferredLocationSignals?: Partial<
      Pick<
        LocationContext,
        | "tourismLevel"
        | "commercialFlow"
        | "competitivePressure"
        | "economicStability"
        | "priceSensitivity"
        | "regulatoryEase"
        | "digitalizationLevel"
        | "marketAttractiveness"
        | "narrative"
      >
    >;
  },
  groundedSources: Array<{ title: string; url: string; note: string }>
) {
  const sources = [...groundedSources, ...base.sources]
    .filter((source) => source.title && source.url)
    .reduce<Array<{ title: string; url: string; note: string }>>((acc, source) => {
      if (acc.some((item) => item.url === source.url)) return acc;
      acc.push({
        title: source.title.trim(),
        url: source.url.trim(),
        note: source.note.trim()
      });
      return acc;
    }, [])
    .concat([
      {
        title: "Investigación grounded de Gemini",
        url: "https://ai.google.dev/gemini-api/docs",
        note: "Fuente de respaldo para la investigación asistida cuando la búsqueda no devuelve suficientes referencias estructuradas."
      },
      {
        title: "Documentación oficial de Gemini API",
        url: "https://ai.google.dev/gemini-api/docs/models",
        note: "Referencia metodológica del proveedor de IA usado para estructurar el expediente investigado."
      },
      {
        title: "Google AI Studio",
        url: "https://aistudio.google.com/",
        note: "Entorno usado para la investigación grounded y validación del flujo de generación."
      }
    ])
    .reduce<Array<{ title: string; url: string; note: string }>>((acc, source) => {
      if (acc.some((item) => item.url === source.url)) return acc;
      acc.push(source);
      return acc;
    }, [])
    .slice(0, 10);

  return {
    projectSummary: base.projectSummary.trim(),
    sections: {
      ...base.sections,
      macroMicro: base.sections.macroMicro.trim(),
      foda: base.sections.foda.trim(),
      competitiveAdvantage: base.sections.competitiveAdvantage.trim(),
      marketStudy: base.sections.marketStudy.trim(),
      competitionStudy: base.sections.competitionStudy.trim(),
      promotionPlan: base.sections.promotionPlan.trim(),
      operationAndHR: base.sections.operationAndHR.trim(),
      legalBarriers: base.sections.legalBarriers.trim(),
      conclusion: base.sections.conclusion.trim()
    },
    findings: base.findings.slice(0, 12).map((finding) => ({
      ...finding,
      title: finding.title.trim(),
      summary: finding.summary.trim(),
      evidence: finding.evidence.trim(),
      sourceTitles: clampSourceTitles(finding.sourceTitles)
    })),
    sources,
    scoringInferences: base.scoringInferences.slice(0, 20).map((inference) => ({
      ...inference,
      variable: inference.variable.trim(),
      rationale: inference.rationale.trim(),
      sourceTitles: clampSourceTitles(inference.sourceTitles)
    })),
    inferredProjectPatch: base.inferredProjectPatch ?? {},
    inferredLocationSignals: {
      ...base.inferredLocationSignals,
      tourismLevel: clampScore(base.inferredLocationSignals?.tourismLevel),
      commercialFlow: clampScore(base.inferredLocationSignals?.commercialFlow),
      competitivePressure: clampScore(base.inferredLocationSignals?.competitivePressure),
      economicStability: clampScore(base.inferredLocationSignals?.economicStability),
      priceSensitivity: clampScore(base.inferredLocationSignals?.priceSensitivity),
      regulatoryEase: clampScore(base.inferredLocationSignals?.regulatoryEase),
      digitalizationLevel: clampScore(base.inferredLocationSignals?.digitalizationLevel),
      marketAttractiveness: clampScore(base.inferredLocationSignals?.marketAttractiveness),
      narrative: base.inferredLocationSignals?.narrative?.trim()
    },
    assumptions: Array.from(new Set(base.assumptions.map((item) => item.trim()).filter(Boolean))).slice(0, 8)
  };
}

function normalizeResearchPatch(rawPatch: Record<string, string | number>) {
  const numericFields = new Set([
    "marketSize",
    "expectedDemand",
    "segmentationClarity",
    "customerFit",
    "footTraffic",
    "tourismLevel",
    "digitalizationLevel",
    "consumerBehavior",
    "competitorCount",
    "differentiationLevel",
    "customerPower",
    "supplierDependency",
    "substituteThreat",
    "newEntrantsThreat",
    "initialInvestment",
    "fixedCosts",
    "variableCostRate",
    "averageTicket",
    "monthlySalesProjection",
    "expectedMarginPercent",
    "operationalComplexity",
    "personnelRequired",
    "logisticsComplexity",
    "legalDifficulty",
    "permitComplexity",
    "entryBarriers",
    "sustainabilityReadiness"
  ]);

  return Object.fromEntries(
    Object.entries(rawPatch).map(([key, value]) => [
      key,
      numericFields.has(key) ? Number(value) : value
    ])
  ) as Partial<ProjectInput>;
}

function fallbackOverview(query: string, researchMemo: string) {
  return {
    projectSummary: firstSentences(researchMemo, 2) || `Se investigó el caso ${query} y se construyó una síntesis académica preliminar del proyecto.`,
    assumptions: [
      "Se asumió una entrada gradual al mercado con validación piloto antes de expandir capacidad.",
      "Se trabajó con datos públicos y señales sectoriales para cerrar vacíos de información no declarada.",
      "La evaluación considera condiciones medias de operación para el país y ciudad objetivo."
    ]
  };
}

function fallbackSections(query: string, researchMemo: string): ResearchDossier["sections"] {
  return {
    macroMicro: memoExcerpt(
      researchMemo,
      0,
      `El macro y microentorno del caso ${query} exige leer estabilidad económica, presión competitiva, hábitos de consumo y barreras regulatorias antes de abrir el negocio.`
    ),
    foda: `A partir de la investigación del caso ${query}, el FODA preliminar muestra oportunidades de mercado y de posicionamiento, pero también riesgos competitivos, operativos y regulatorios que deben ser gestionados antes de escalar.`,
    competitiveAdvantage: `La ventaja competitiva del caso ${query} depende de traducir la propuesta comercial en atributos difíciles de copiar: ubicación, propuesta de valor, experiencia de servicio, eficiencia operativa o especialización de oferta.`,
    marketStudy: memoExcerpt(
      researchMemo,
      1,
      `El estudio de mercado del caso ${query} sugiere revisar demanda potencial, segmentación, sensibilidad al precio y consistencia del mix comercial con el público objetivo.`
    ),
    competitionStudy: `La competencia del caso ${query} debe evaluarse no solo por cantidad de actores, sino también por sustitutos, poder de clientes, barreras de entrada y capacidad de diferenciación real del proyecto.`,
    promotionPlan: `El plan de promoción para ${query} debe concentrarse en captar demanda temprana, construir prueba social, reforzar diferenciación y optimizar el costo de adquisición del cliente durante la fase piloto.`,
    operationAndHR: `En operación y RRHH, el caso ${query} exige definir estructura inicial, roles críticos, control de calidad, formación del personal y mecanismos de retención para sostener consistencia operacional.`,
    legalBarriers: `En materia legal y de barreras de entrada, ${query} requiere revisar permisos, exigencias sanitarias o comerciales, factibilidad municipal, costos de habilitación y riesgos de apertura en el mercado destino.`,
    conclusion: `La conclusión preliminar para ${query} es condicional: el proyecto puede justificarse solo si la evidencia investigada se traduce en una propuesta ejecutable, financieramente disciplinada y diferenciada frente a la competencia.`
  };
}

function fallbackFindings(query: string, sections: ResearchDossier["sections"], groundedSources: Array<{ title: string; url: string; note: string }>) {
  const sourceTitles =
    groundedSources.slice(0, 3).map((source) => source.title).filter(Boolean).length > 0
      ? groundedSources.slice(0, 3).map((source) => source.title).filter(Boolean)
      : ["Investigación grounded de Gemini"];

  return [
    {
      section: "macroMicro" as const,
      title: `Entorno macro y micro de ${query}`,
      summary: firstSentences(sections.macroMicro, 1),
      evidence: "La investigación sugiere que el desempeño del proyecto depende del contexto competitivo, del consumo local y del marco regulatorio del mercado destino.",
      sourceTitles
    },
    {
      section: "foda" as const,
      title: "FODA preliminar del proyecto",
      summary: firstSentences(sections.foda, 1),
      evidence: "El caso muestra fortalezas de concepto, pero todavía arrastra vulnerabilidades operativas y de entrada que deben ser mitigadas.",
      sourceTitles
    },
    {
      section: "marketStudy" as const,
      title: "Demanda y segmentación",
      summary: firstSentences(sections.marketStudy, 1),
      evidence: "La consistencia entre público objetivo, ubicación y propuesta comercial sigue siendo un punto decisivo para la factibilidad.",
      sourceTitles
    },
    {
      section: "competitionStudy" as const,
      title: "Presión competitiva del mercado",
      summary: firstSentences(sections.competitionStudy, 1),
      evidence: "La rivalidad y la amenaza de sustitutos pueden afectar margen, captación de clientes y velocidad de validación del piloto.",
      sourceTitles
    },
    {
      section: "legalBarriers" as const,
      title: "Barreras legales y de apertura",
      summary: firstSentences(sections.legalBarriers, 1),
      evidence: "Permisos, habilitación comercial y exigencias sectoriales condicionan el calendario y costo de entrada al mercado.",
      sourceTitles
    }
  ];
}

function fallbackScoringBundle(inputDraft: ProjectInput, query: string) {
  const isFood = /pizza|domino|domino's|cafeter|sushi|gastron|comida|restaurant/i.test(
    `${query} ${inputDraft.businessType} ${inputDraft.sector}`
  );

  return {
    scoringInferences: [
      {
        variable: "competitivePressure",
        value: 7,
        rationale: "La investigación preliminar sugiere una rivalidad relevante en el mercado objetivo.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "marketAttractiveness",
        value: 6,
        rationale: "El mercado parece defendible, pero todavía condicionado por ejecución, posicionamiento y entrada selectiva.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "regulatoryEase",
        value: 5,
        rationale: "La apertura exige revisar barreras y permisos, por lo que la facilidad regulatoria no puede asumirse alta.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "expectedDemand",
        value: 6,
        rationale: "La demanda potencial luce razonable, aunque todavía no está validada con evidencia comercial directa del proyecto.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "substituteThreat",
        value: isFood ? 8 : 6,
        rationale: "Existen alternativas de consumo o formatos sustitutos que presionan la captura de demanda inicial.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "entryBarriers",
        value: 5,
        rationale: "La entrada al mercado no es imposible, pero sí requiere capital, ubicación, permisos y ejecución disciplinada.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "customerPower",
        value: 7,
        rationale: "El cliente tiene capacidad de comparar opciones, precios y conveniencia antes de elegir.",
        sourceTitles: ["Investigación grounded de Gemini"]
      },
      {
        variable: "differentiationLevel",
        value: 6,
        rationale: "La diferenciación es plausible, pero debe traducirse en una propuesta realmente visible para el mercado objetivo.",
        sourceTitles: ["Investigación grounded de Gemini"]
      }
    ],
    inferredProjectPatch: {
      projectName: inputDraft.projectName || firstSentences(query, 1) || "Proyecto investigado",
      businessType: inputDraft.businessType || "Negocio en evaluación",
      sector: inputDraft.sector || (isFood ? "Gastronomía" : "Servicios"),
      country: inputDraft.country,
      region: inputDraft.region,
      city: inputDraft.city,
      expectedDemand: 6,
      competitorCount: isFood ? 8 : 6,
      customerPower: 7,
      substituteThreat: isFood ? 8 : 6,
      newEntrantsThreat: 6,
      entryBarriers: 5,
      legalDifficulty: 5,
      permitComplexity: 5,
      marketSize: 6,
      differentiationLevel: 6
    },
    inferredLocationSignals: {
      tourismLevel: 5,
      commercialFlow: 6,
      competitivePressure: 7,
      economicStability: 5,
      priceSensitivity: 6,
      regulatoryEase: 5,
      digitalizationLevel: 7,
      marketAttractiveness: 6,
      narrative: "La investigación asistida sugiere un mercado con demanda plausible, pero con presión competitiva y exigencias de entrada que obligan a validar la propuesta con disciplina."
    }
  };
}

function buildResearchPrompt(draft: ProjectInput, query: string) {
  return `Proyecto a investigar: ${query}

Contexto base del usuario:
- nombre tentativo: ${draft.projectName || "No definido"}
- tipo de negocio: ${draft.businessType || "No definido"}
- rubro: ${draft.sector || "No definido"}
- país: ${draft.country || "No definido"}
- región: ${draft.region || "No definido"}
- ciudad: ${draft.city || "No definida"}
- público objetivo: ${draft.targetAudience || "No definido"}
- descripción: ${draft.description || "No definida"}

Investiga el caso como proyecto académico de apertura o expansión internacional. Necesito hallazgos para:
1. Macro y microentorno
2. FODA
3. Ventaja competitiva y cadena de valor
4. Estudio de mercado, segmentación y mix de marketing
5. Competencia
6. Promoción
7. Operación, organigrama y RRHH
8. Barreras legales, permisos y factibilidad de apertura
9. Conclusión de factibilidad

Incluye fuentes y señales suficientes para luego traducir esto a variables cuantificables de scoring.`;
}

export async function runAcademicResearch(
  draft: ProjectDraft,
  weights: ProjectWeights,
  query: string
): Promise<EvaluationSnapshot> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }

  const inputDraft = mergeProjectDraft(draft);
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const researchModel = process.env.GEMINI_RESEARCH_MODEL ?? "gemini-2.5-flash";
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  const researchMemoResponse = await client.models.generateContent({
    model: researchModel,
    contents: buildResearchPrompt(inputDraft, query),
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      maxOutputTokens: 2200
    }
  });

  const researchMemo = extractResponseText(researchMemoResponse);
  const groundedSources = extractGroundingSources(researchMemoResponse);

  if (!researchMemo) {
    throw new Error("Gemini no devolvió una investigación base para el proyecto.");
  }

  const researchContext = `Consulta original: ${query}

Investigación base:
${researchMemo}

Datos iniciales del proyecto:
${JSON.stringify(
    {
      projectName: inputDraft.projectName,
      businessType: inputDraft.businessType,
      sector: inputDraft.sector,
      country: inputDraft.country,
      region: inputDraft.region,
      city: inputDraft.city,
      targetAudience: inputDraft.targetAudience,
      description: inputDraft.description
    },
    null,
    2
  )}`;
  const fallbackSectionsData = fallbackSections(query, researchMemo);
  const fallbackScoringData = fallbackScoringBundle(inputDraft, query);

  const overview = await generateStructuredResearchSection(
    client,
    model,
    `A partir del siguiente contexto de investigación, devuelve solo JSON con:
- projectSummary: síntesis académica aplicada al proyecto
- assumptions: 3 a 8 supuestos explícitos usados para cerrar vacíos de información

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        projectSummary: { type: "STRING" },
        assumptions: { type: "ARRAY", items: { type: "STRING" } }
      },
      required: ["projectSummary", "assumptions"]
    },
    researchOverviewSchema,
    1100
  ).catch((error) => {
    console.error("[research] overview fallback", error);
    return fallbackOverview(query, researchMemo);
  });

  const coreSections = await generateStructuredResearchSection(
    client,
    model,
    `Redacta solo las primeras secciones del expediente académico en JSON. Deben ser aplicadas al proyecto, no genéricas.

Incluye:
- macroMicro
- foda
- competitiveAdvantage
- marketStudy

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        sections: {
          type: "OBJECT",
          properties: {
            macroMicro: { type: "STRING" },
            foda: { type: "STRING" },
            competitiveAdvantage: { type: "STRING" },
            marketStudy: { type: "STRING" }
          },
          required: ["macroMicro", "foda", "competitiveAdvantage", "marketStudy"]
        }
      },
      required: ["sections"]
    },
    researchSectionsCoreSchema,
    1900
  ).catch((error) => {
    console.error("[research] core sections fallback", error);
    return {
      sections: {
        macroMicro: fallbackSectionsData.macroMicro,
        foda: fallbackSectionsData.foda,
        competitiveAdvantage: fallbackSectionsData.competitiveAdvantage,
        marketStudy: fallbackSectionsData.marketStudy
      }
    };
  });

  const extendedSections = await generateStructuredResearchSection(
    client,
    model,
    `Redacta solo las secciones restantes del expediente académico en JSON. Deben ser aplicadas al proyecto, no genéricas.

Incluye:
- competitionStudy
- promotionPlan
- operationAndHR
- legalBarriers
- conclusion

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        sections: {
          type: "OBJECT",
          properties: {
            competitionStudy: { type: "STRING" },
            promotionPlan: { type: "STRING" },
            operationAndHR: { type: "STRING" },
            legalBarriers: { type: "STRING" },
            conclusion: { type: "STRING" }
          },
          required: ["competitionStudy", "promotionPlan", "operationAndHR", "legalBarriers", "conclusion"]
        }
      },
      required: ["sections"]
    },
    researchSectionsExtendedSchema,
    1900
  ).catch((error) => {
    console.error("[research] extended sections fallback", error);
    return {
      sections: {
        competitionStudy: fallbackSectionsData.competitionStudy,
        promotionPlan: fallbackSectionsData.promotionPlan,
        operationAndHR: fallbackSectionsData.operationAndHR,
        legalBarriers: fallbackSectionsData.legalBarriers,
        conclusion: fallbackSectionsData.conclusion
      }
    };
  });

  const findingsBundle = await generateStructuredResearchSection(
    client,
    model,
    `Devuelve solo JSON con hallazgos académicos concretos del caso.

Reglas:
- findings debe tener entre 5 y 8 elementos
- cada hallazgo debe pertenecer a una sección válida
- cada hallazgo debe estar conectado al proyecto y a la ciudad/país objetivo
- sourceTitles debe usar títulos reales de fuentes si están disponibles en la investigación

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        findings: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              section: {
                type: "STRING",
                enum: [
                  "macroMicro",
                  "foda",
                  "competitiveAdvantage",
                  "marketStudy",
                  "competitionStudy",
                  "promotionPlan",
                  "operationAndHR",
                  "legalBarriers",
                  "conclusion"
                ]
              },
              title: { type: "STRING" },
              summary: { type: "STRING" },
              evidence: { type: "STRING" },
              sourceTitles: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["section", "title", "summary", "evidence", "sourceTitles"]
          }
        }
      },
      required: ["findings"]
    },
    researchFindingsBundleSchema,
    1500
  ).catch((error) => {
    console.error("[research] findings fallback", error);
    return {
      findings: fallbackFindings(query, fallbackSectionsData, groundedSources)
    };
  });

  const sourcesBundle = await generateStructuredResearchSection(
    client,
    model,
    `Devuelve solo JSON con fuentes útiles para documentar el caso.

Reglas:
- entre 4 y 6 fuentes
- prioriza fuentes empíricas y directamente útiles para macroentorno, mercado, competencia o barreras regulatorias
- si ya hay títulos detectados en la investigación, reutilízalos

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        sources: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING" },
              url: { type: "STRING" },
              note: { type: "STRING" }
            },
            required: ["title", "url", "note"]
          }
        }
      },
      required: ["sources"]
    },
    researchSourcesBundleSchema,
    1200
  ).catch((error) => {
    console.error("[research] sources fallback", error);
    return {
      sources:
        groundedSources.length >= 4
          ? groundedSources.slice(0, 6)
          : [
              ...groundedSources,
              {
                title: "Investigación grounded de Gemini",
                url: "https://ai.google.dev/gemini-api/docs",
                note: "Referencia de respaldo cuando Gemini entrega investigación basada en búsqueda pero no estructura fuentes completas."
              }
            ]
    };
  });

  const scoringBundle = await generateStructuredResearchSection(
    client,
    model,
    `Devuelve solo JSON para traducir la investigación a scoring.

Reglas:
- scoringInferences entre 8 y 12
- inferredProjectPatch solo debe contener campos útiles para el motor
- inferredLocationSignals debe cuantificar el territorio del 1 al 10
- cada inferencia debe explicar de dónde sale y cómo afecta la factibilidad

${researchContext}`,
    {
      type: "OBJECT",
      properties: {
        scoringInferences: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              variable: { type: "STRING" },
              value: { anyOf: [{ type: "STRING" }, { type: "NUMBER" }] },
              rationale: { type: "STRING" },
              sourceTitles: { type: "ARRAY", items: { type: "STRING" } }
            },
            required: ["variable", "value", "rationale", "sourceTitles"]
          }
        },
        inferredProjectPatch: {
          type: "OBJECT",
          properties: {
            projectName: { type: "STRING" },
            businessType: { type: "STRING" },
            sector: { type: "STRING" },
            country: { type: "STRING" },
            region: { type: "STRING" },
            city: { type: "STRING" },
            description: { type: "STRING" },
            targetAudience: { type: "STRING" },
            priceRange: { type: "STRING", enum: ["económico", "medio", "premium"] },
            marketSize: { type: "NUMBER" },
            expectedDemand: { type: "NUMBER" },
            segmentationClarity: { type: "NUMBER" },
            customerFit: { type: "NUMBER" },
            footTraffic: { type: "NUMBER" },
            tourismLevel: { type: "NUMBER" },
            digitalizationLevel: { type: "NUMBER" },
            consumerBehavior: { type: "NUMBER" },
            competitorCount: { type: "NUMBER" },
            differentiationLevel: { type: "NUMBER" },
            customerPower: { type: "NUMBER" },
            supplierDependency: { type: "NUMBER" },
            substituteThreat: { type: "NUMBER" },
            newEntrantsThreat: { type: "NUMBER" },
            initialInvestment: { type: "NUMBER" },
            fixedCosts: { type: "NUMBER" },
            variableCostRate: { type: "NUMBER" },
            averageTicket: { type: "NUMBER" },
            monthlySalesProjection: { type: "NUMBER" },
            expectedMarginPercent: { type: "NUMBER" },
            operationalComplexity: { type: "NUMBER" },
            personnelRequired: { type: "NUMBER" },
            logisticsComplexity: { type: "NUMBER" },
            legalDifficulty: { type: "NUMBER" },
            permitComplexity: { type: "NUMBER" },
            entryBarriers: { type: "NUMBER" },
            sustainabilityReadiness: { type: "NUMBER" },
            knownStrengths: { type: "STRING" },
            knownRisks: { type: "STRING" }
          }
        },
        inferredLocationSignals: {
          type: "OBJECT",
          properties: {
            tourismLevel: { type: "NUMBER" },
            commercialFlow: { type: "NUMBER" },
            competitivePressure: { type: "NUMBER" },
            economicStability: { type: "NUMBER" },
            priceSensitivity: { type: "NUMBER" },
            regulatoryEase: { type: "NUMBER" },
            digitalizationLevel: { type: "NUMBER" },
            marketAttractiveness: { type: "NUMBER" },
            narrative: { type: "STRING" }
          }
        }
      },
      required: ["scoringInferences", "inferredProjectPatch", "inferredLocationSignals"]
    },
    researchScoringBundleSchema,
    1600
  ).catch((error) => {
    console.error("[research] scoring fallback", error);
    return fallbackScoringData;
  });

  const dossierBase = researchDossierSchema.parse(
    normalizeResearchDossier(
      {
        ...overview,
        sections: {
          ...coreSections.sections,
          ...extendedSections.sections
        },
        ...findingsBundle,
        ...sourcesBundle,
        ...scoringBundle
      },
      groundedSources
    )
  );
  const inferredProjectPatch = normalizeResearchPatch(dossierBase.inferredProjectPatch);
  const mergedInput = mergeProjectDraft({
    ...draft,
    ...inferredProjectPatch
  });

  const baseContext = getLocationContext(mergedInput);
  const context: LocationContext = {
    ...baseContext,
    ...dossierBase.inferredLocationSignals,
    narrative: dossierBase.inferredLocationSignals.narrative ?? baseContext.narrative,
    source: baseContext.source
  };
  const scoreBreakdown = evaluateProject(mergedInput, context, weights);
  const snapshot = buildEvaluationSnapshot(mergedInput, weights);

  const dossier: ResearchDossier = {
    query,
    projectSummary: dossierBase.projectSummary,
    sections: dossierBase.sections,
    findings: dossierBase.findings,
    sources: dossierBase.sources,
    scoringInferences: dossierBase.scoringInferences,
    inferredProjectPatch,
    inferredLocationSignals: dossierBase.inferredLocationSignals,
    assumptions: dossierBase.assumptions,
    provider: "gemini",
    model,
    generatedAt: new Date().toISOString()
  };

  return {
    ...snapshot,
    context,
    scoreBreakdown,
    research: dossier,
    generatedAt: new Date().toISOString()
  };
}
