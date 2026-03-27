import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { parseGeminiJson } from "@/lib/ai/gemini";
import { EMPTY_PROJECT } from "@/lib/constants";
import type { ChatMessage, InterviewTurnResult, ProjectDraft } from "@/types";
import { draftCompletionSummary } from "@/lib/project-draft";

const interviewTurnSchema = z.object({
  assistantMessage: z.string().min(20),
  didacticTip: z.string().min(12),
  completionScore: z.number().min(0).max(100),
  readyForReport: z.boolean(),
  recommendedNextFocus: z.string().min(8),
  missingFields: z.array(z.string()).max(8),
  quickReplies: z.array(z.string()).max(4),
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
    .default({})
});

const responseSchema = {
  type: "object",
  properties: {
    assistantMessage: { type: "string" },
    didacticTip: { type: "string" },
    completionScore: { type: "number", minimum: 0, maximum: 100 },
    readyForReport: { type: "boolean" },
    recommendedNextFocus: { type: "string" },
    missingFields: {
      type: "array",
      items: { type: "string" },
      maxItems: 8
    },
    quickReplies: {
      type: "array",
      items: { type: "string" },
      maxItems: 4
    },
    projectPatch: {
      type: "object",
      properties: {
        projectName: { type: "string", nullable: true },
        businessType: { type: "string", nullable: true },
        sector: { type: "string", nullable: true },
        country: { type: "string", nullable: true },
        region: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        description: { type: "string", nullable: true },
        targetAudience: { type: "string", nullable: true },
        priceRange: { type: "string", nullable: true, enum: ["económico", "medio", "premium"] },
        marketSize: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        expectedDemand: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        segmentationClarity: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        customerFit: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        footTraffic: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        tourismLevel: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        digitalizationLevel: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        consumerBehavior: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        competitorCount: { type: "number", nullable: true, minimum: 0, maximum: 25 },
        differentiationLevel: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        customerPower: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        supplierDependency: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        substituteThreat: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        newEntrantsThreat: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        initialInvestment: { type: "number", nullable: true, minimum: 1000 },
        fixedCosts: { type: "number", nullable: true, minimum: 100 },
        variableCostRate: { type: "number", nullable: true, minimum: 1, maximum: 90 },
        averageTicket: { type: "number", nullable: true, minimum: 1 },
        monthlySalesProjection: { type: "number", nullable: true, minimum: 100 },
        expectedMarginPercent: { type: "number", nullable: true, minimum: 1, maximum: 80 },
        operationalComplexity: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        personnelRequired: { type: "number", nullable: true, minimum: 1, maximum: 40 },
        logisticsComplexity: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        legalDifficulty: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        permitComplexity: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        entryBarriers: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        sustainabilityReadiness: { type: "number", nullable: true, minimum: 1, maximum: 10 },
        knownStrengths: { type: "string", nullable: true },
        knownRisks: { type: "string", nullable: true }
      }
    }
  },
  required: [
    "assistantMessage",
    "didacticTip",
    "completionScore",
    "readyForReport",
    "recommendedNextFocus",
    "missingFields",
    "quickReplies",
    "projectPatch"
  ]
} as const;

const systemPrompt = `
Eres Factibiz AI, un consultor de negocios didáctico que entrevista al usuario para evaluar la factibilidad de su proyecto.
Tu objetivo es hacer una entrevista práctica, clara y amigable.
Debes:
- hacer una o dos preguntas por turno, no más
- explicar brevemente por qué esas preguntas importan
- inferir y normalizar datos estructurados cuando el usuario entregue información
- avanzar aunque no tenga todos los números exactos, usando estimaciones razonables cuando se puedan inferir
- indicar cuándo ya hay suficiente información para generar un primer informe
- no repetir preguntas sobre datos que ya estén capturados en el borrador actual
- trabajar por bloques: idea, ubicación, cliente, mercado, competencia, finanzas y operación/legalidad
- si el usuario ya entregó un dato en turnos anteriores, pasa al siguiente bloque pendiente
- responder siempre en español
No devuelvas markdown ni texto fuera del JSON.
`;

function buildConversationPrompt(messages: ChatMessage[], draft: ProjectDraft) {
  return JSON.stringify(
    {
      objetivo: "Entrevistar al usuario para preparar un informe de factibilidad y un score ejecutivo.",
      borradorActual: {
        ...EMPTY_PROJECT,
        ...draft
      },
      progresoEstimado: draftCompletionSummary(draft),
      conversacion: messages.map((message) => ({
        role: message.role,
        content: message.content
      })),
      instruccionesDeSalida: {
        assistantMessage:
          "Mensaje didáctico, claro y corto. Resume lo entendido, muestra el bloque actual y formula la siguiente pregunta prioritaria sin repetir datos ya capturados.",
        didacticTip: "Microexplicación de por qué el dato pedido importa para evaluar factibilidad.",
        completionScore: "0 a 100",
        readyForReport: "true si ya existe información suficiente para generar un informe inicial útil",
        recommendedNextFocus: "Tema más importante a seguir",
        missingFields: "Lista corta de campos relevantes aún no cubiertos",
        quickReplies: "2 a 4 respuestas sugeridas cortas que ayuden a seguir la conversación",
        projectPatch:
          "Solo los campos nuevos o corregidos que puedas inferir con confianza a partir del último mensaje del usuario y del contexto previo"
      }
    },
    null,
    2
  );
}

function compactPatch(rawPatch: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(rawPatch).filter(([, value]) => value !== null && value !== undefined && value !== "")
  ) as ProjectDraft;
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractNumber(text: string) {
  const cleaned = text.replace(/\./g, "").replace(/,/g, ".");
  const match = cleaned.match(/(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

function extractAmountAfterKeyword(text: string, keywords: string[]) {
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

function extractScoreAfterKeyword(text: string, keywords: string[]) {
  const normalized = normalizeText(text);

  for (const keyword of keywords) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const direct = new RegExp(`${escaped}[^\\d]*(\\d{1,2})(?:\\s*de\\s*10)?`, "i").exec(normalized);
    if (direct) {
      return Math.max(1, Math.min(10, Number(direct[1])));
    }
  }

  return null;
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
  if (normalized.includes("pizzeria") || normalized.includes("pizza")) {
    return { businessType: "Pizzería", sector: "Gastronomía" };
  }
  return {};
}

function inferPriceRange(text: string) {
  const normalized = normalizeText(text);
  if (normalized.includes("premium") || normalized.includes("alto ingreso") || normalized.includes("alto valor")) {
    return "premium" as const;
  }
  if (normalized.includes("economico") || normalized.includes("barato") || normalized.includes("bajo precio")) {
    return "económico" as const;
  }
  if (normalized.includes("ticket medio") || normalized.includes("precio medio") || normalized.includes("medio")) {
    return "medio" as const;
  }
  return undefined;
}

function inferProjectName(message: string) {
  const explicitPatterns = [
    /se llamara\s+["']?([^"'.\n,]+)["']?/i,
    /se llamará\s+["']?([^"'.\n,]+)["']?/i,
    /nombre(?:\s+tentativo)?\s*[:\-]\s*["']?([^"'.\n,]+)["']?/i
  ];

  for (const pattern of explicitPatterns) {
    const match = pattern.exec(message);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function inferAudience(message: string) {
  const normalized = normalizeText(message);

  if (/(\d{1,2})\s*(?:a|-)\s*(\d{1,2})\s*anos?/.test(normalized)) {
    const match = /(\d{1,2})\s*(?:a|-)\s*(\d{1,2})\s*anos?/.exec(normalized);
    if (match) {
      return `Personas de ${match[1]} a ${match[2]} años`;
    }
  }

  if (normalized.includes("universitario")) return "Estudiantes universitarios";
  if (normalized.includes("turista")) return "Turistas";
  if (normalized.includes("mascotas")) return "Dueños de mascotas";
  if (normalized.includes("domicilio") || normalized.includes("delivery") || normalized.includes("despacho")) {
    return "Consumidores que priorizan comida a domicilio";
  }

  return undefined;
}

function inferLocationPatch(message: string, draft: ProjectDraft) {
  const normalized = normalizeText(message);
  const patch: ProjectDraft = {};

  if (normalized.includes("chile") && !draft.country) patch.country = "Chile";
  if (normalized.includes("peru") && !draft.country) patch.country = "Perú";
  if (normalized.includes("colombia") && !draft.country) patch.country = "Colombia";
  if (normalized.includes("argentina") && !draft.country) patch.country = "Argentina";

  if (normalized.includes("region metropolitana") && !draft.region) {
    patch.region = "Región Metropolitana";
    patch.country = patch.country ?? draft.country ?? "Chile";
  }

  if (normalized.includes("huechuraba")) {
    patch.city = "Santiago";
    patch.region = "Huechuraba";
    patch.country = patch.country ?? draft.country ?? "Chile";
  } else if (normalized.includes("santiago")) {
    patch.city = "Santiago";
    patch.region = patch.region ?? draft.region ?? "Región Metropolitana";
    patch.country = patch.country ?? draft.country ?? "Chile";
  } else if (normalized.includes("pucon") || normalized.includes("pucón")) {
    patch.city = "Pucón";
    patch.region = "La Araucanía";
    patch.country = patch.country ?? draft.country ?? "Chile";
  }

  return patch;
}

function inferPatchFromMessage(message: string, draft: ProjectDraft): ProjectDraft {
  const normalized = normalizeText(message);
  const patch: ProjectDraft = {};

  if (!draft.businessType || !draft.sector) {
    Object.assign(patch, inferBusinessType(message));
  }

  if (!draft.projectName) {
    const inferredProjectName = inferProjectName(message);
    if (inferredProjectName) {
      patch.projectName = inferredProjectName;
    }
  }

  if (!draft.projectName && !patch.projectName && patch.businessType) {
    patch.projectName =
      patch.businessType === "Cafetería"
        ? "Cafetería Universitaria"
        : patch.businessType === "Pizzería y sushi"
          ? "Pizza and Roll"
        : patch.businessType === "Hotel boutique"
          ? "Hotel Boutique"
          : patch.businessType === "Tienda online"
            ? "Tienda Online"
            : "Nuevo Proyecto";
  }

  if (!draft.targetAudience) {
    const inferredAudience = inferAudience(message);
    if (inferredAudience) {
      patch.targetAudience = inferredAudience;
    }
  }

  if (!draft.city || !draft.region || !draft.country) {
    Object.assign(patch, inferLocationPatch(message, draft));
  }

  const inferredPriceRange = inferPriceRange(message);
  if (!draft.priceRange && inferredPriceRange) {
    patch.priceRange = inferredPriceRange;
  }

  if (/(inversion|invertir|capital inicial)/i.test(message) && !draft.initialInvestment) {
    const amount = extractNumber(message);
    if (amount) {
      patch.initialInvestment = normalized.includes("millones") ? amount * 1_000_000 : amount;
    }
  }

  if (/(vender|ventas|facturar|facturacion|facturación)/i.test(message) && !draft.monthlySalesProjection) {
    const amount = extractNumber(message);
    if (amount) {
      patch.monthlySalesProjection = normalized.includes("millones") ? amount * 1_000_000 : amount;
    }
  }

  if (/(ticket)/i.test(message) && !draft.averageTicket) {
    if (normalized.includes("medio")) patch.averageTicket = 7000;
    if (normalized.includes("premium")) patch.averageTicket = 12000;
    if (normalized.includes("economico")) patch.averageTicket = 4000;
  }

  if (!draft.description && (patch.businessType || draft.businessType)) {
    patch.description =
      patch.businessType === "Cafetería" || draft.businessType === "Cafetería"
        ? "Cafetería orientada a estudiantes universitarios, con propuesta de conveniencia, ticket medio y foco en flujo de demanda recurrente."
        : patch.businessType === "Pizzería y sushi" || draft.businessType === "Pizzería y sushi"
          ? "Negocio gastronómico híbrido con foco en pizza, sushi y despacho a domicilio, orientado a demanda frecuente y operación de delivery."
        : patch.businessType === "Hotel boutique" || draft.businessType === "Hotel boutique"
          ? "Proyecto hotelero boutique orientado a experiencia diferencial y turismo segmentado."
          : patch.businessType === "Tienda online" || draft.businessType === "Tienda online"
            ? "Tienda online enfocada en nicho específico, con operación digital y crecimiento escalable."
            : draft.description;
  }

  return patch;
}

type InterviewStage = {
  key: string;
  title: string;
  tip: string;
  ready: (draft: ProjectDraft) => boolean;
  missing: string[];
  prompt: (draft: ProjectDraft) => string;
  quickReplies: string[];
};

const interviewStages: InterviewStage[] = [
  {
    key: "idea",
    title: "Definición del proyecto",
    tip: "Primero necesito una tesis de negocio clara: qué vas a vender, para quién y con qué formato.",
    ready: (draft) => Boolean(draft.businessType && draft.targetAudience && draft.projectName),
    missing: ["nombre del proyecto", "tipo de negocio", "público objetivo"],
    prompt: (draft) => {
      const pending = [];
      if (!draft.projectName) pending.push("nombre o nombre tentativo");
      if (!draft.businessType) pending.push("tipo de negocio");
      if (!draft.targetAudience) pending.push("cliente principal");

      return pending.length === 1
        ? `Paso 1 de 6. Ya tengo la base del negocio. Solo me falta ${pending[0]}.`
        : `Paso 1 de 6. Necesito cerrar la idea base. En un solo mensaje dime: ${pending.join(", ")}.`;
    },
    quickReplies: [
      "Se llamará Café Nodo, será una cafetería para universitarios",
      "Quiero un hotel boutique para turistas premium",
      "Será una tienda online para dueños de mascotas"
    ]
  },
  {
    key: "ubicacion",
    title: "Ubicación y entorno",
    tip: "La ubicación cambia flujo, competencia, permisos y atractivo del mercado. No sirve evaluar sin ese contexto.",
    ready: (draft) => Boolean(draft.country && draft.city && draft.region),
    missing: ["ciudad", "región / comuna", "país"],
    prompt: (draft) => {
      if (draft.country && draft.region && !draft.city) {
        return "Paso 2 de 6. Ya tengo país y región. Ahora dime la ciudad o comuna exacta donde operarás.";
      }

      if (draft.country && !draft.region && !draft.city) {
        return "Paso 2 de 6. Ahora necesito bajar la ubicación. Indica ciudad y región o comuna.";
      }

      return "Paso 2 de 6. Ahora necesito la ubicación exacta. Indica ciudad, comuna o zona, y país. Si ya tienes local o barrio estimado, inclúyelo.";
    },
    quickReplies: [
      "Santiago, Huechuraba, Chile",
      "Pucón, La Araucanía, Chile",
      "Lima, Miraflores, Perú"
    ]
  },
  {
    key: "mercado",
    title: "Mercado y propuesta comercial",
    tip: "Aquí validamos si la demanda y el posicionamiento tienen sentido para el cliente elegido.",
    ready: (draft) => Boolean(draft.priceRange && draft.averageTicket && draft.expectedDemand),
    missing: ["posicionamiento", "ticket promedio", "demanda esperada"],
    prompt: (draft) => {
      if (draft.priceRange && draft.averageTicket && !draft.expectedDemand) {
        return "Paso 3 de 6. Ya tengo posicionamiento y ticket. Ahora dime qué tan alta ves la demanda del 1 al 10.";
      }

      if (draft.priceRange && !draft.averageTicket) {
        return "Paso 3 de 6. Ya tengo el posicionamiento. Ahora necesito ticket promedio estimado y demanda esperada del 1 al 10.";
      }

      return "Paso 3 de 6. Quiero cerrar la propuesta comercial. Dime: 1) si el negocio será económico, medio o premium, 2) ticket promedio estimado, 3) qué tan alta ves la demanda del 1 al 10.";
    },
    quickReplies: [
      "Posicionamiento medio, ticket 7000 CLP, demanda 8 de 10",
      "Premium, ticket 120000 CLP, demanda 6 de 10",
      "Económico, ticket 4000 CLP, demanda 7 de 10"
    ]
  },
  {
    key: "competencia",
    title: "Competencia y diferenciación",
    tip: "No basta con tener demanda; necesito saber cuán defendible es la propuesta frente a rivales y sustitutos.",
    ready: (draft) => Boolean(draft.competitorCount !== undefined && draft.differentiationLevel && draft.substituteThreat),
    missing: ["cantidad de competidores", "diferenciación", "amenaza de sustitutos"],
    prompt: (draft) => {
      if (draft.competitorCount !== undefined && draft.differentiationLevel && !draft.substituteThreat) {
        return "Paso 4 de 6. Ya tengo competidores y diferenciación. Falta solo la amenaza de sustitutos: ¿qué tan fácil es que el cliente te reemplace por otra opción del 1 al 10?";
      }

      return "Paso 4 de 6. Hablemos de competencia. Responde: 1) cuántos competidores directos ves cerca, 2) qué tan distinta será tu propuesta del 1 al 10, 3) qué tan fácil es que el cliente te reemplace por otra opción del 1 al 10.";
    },
    quickReplies: [
      "Veo 6 competidores, diferenciación 7, sustitutos 8",
      "Veo 3 competidores, diferenciación 8, sustitutos 4",
      "Hay muchos competidores, diferenciación 5, sustitutos 7"
    ]
  },
  {
    key: "finanzas",
    title: "Viabilidad financiera",
    tip: "Sin una unidad económica mínima, el proyecto puede verse atractivo pero no ser sostenible.",
    ready: (draft) =>
      Boolean(draft.initialInvestment && draft.monthlySalesProjection && draft.fixedCosts && draft.expectedMarginPercent),
    missing: ["inversión inicial", "ventas mensuales", "costos fijos", "margen esperado"],
    prompt: (draft) => {
      if (draft.initialInvestment && draft.monthlySalesProjection && !draft.fixedCosts) {
        return "Paso 5 de 6. Ya tengo inversión y ventas mensuales. Ahora necesito costos fijos mensuales y, si lo tienes, margen esperado.";
      }

      return "Paso 5 de 6. Ahora necesito cerrar números básicos. Indica: 1) inversión inicial, 2) ventas mensuales estimadas, 3) costos fijos mensuales, 4) margen esperado en porcentaje si lo tienes.";
    },
    quickReplies: [
      "Inversión 25 millones CLP, ventas 8 millones, costos fijos 2 millones, margen 18%",
      "Inversión 120 millones, ventas 14 millones, costos fijos 4 millones, margen 22%",
      "Aún no sé el margen, pero invertiría 18 millones y vendería 6 millones al mes"
    ]
  },
  {
    key: "operacion",
    title: "Operación y legalidad",
    tip: "La factibilidad también depende de si el negocio puede abrir y operar sin una complejidad excesiva.",
    ready: (draft) =>
      Boolean(draft.operationalComplexity && draft.personnelRequired && draft.legalDifficulty && draft.permitComplexity),
    missing: ["complejidad operativa", "personal requerido", "dificultad legal", "permisos"],
    prompt: (draft) => {
      if (draft.operationalComplexity && draft.legalDifficulty && draft.permitComplexity && !draft.personnelRequired) {
        return "Paso 6 de 6. Ya tengo la lectura operativa y legal. Falta solo cuántas personas necesitarías al inicio.";
      }

      return "Paso 6 de 6. Cierro con operación y legalidad. Indica del 1 al 10: complejidad operativa, dificultad legal y complejidad de permisos. Además dime cuántas personas necesitarías al inicio.";
    },
    quickReplies: [
      "Complejidad 5, legal 4, permisos 4 y 4 personas",
      "Complejidad 8, legal 6, permisos 7 y 12 personas",
      "Operación simple, legal 3, permisos 4 y 3 personas"
    ]
  }
];

function maybeParseScale(message: string, labels: string[]) {
  const normalized = normalizeText(message);
  const results: Record<string, number> = {};

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const direct = new RegExp(`${escaped}\\s*(?:de)?\\s*(\\d{1,2})`, "i").exec(normalized);
    if (direct) {
      results[label] = Number(direct[1]);
    }
  }

  return results;
}

function enrichPatchFromQuantifiedAnswers(message: string, draft: ProjectDraft, patch: ProjectDraft) {
  const normalized = normalizeText(message);
  const singleNumber = extractNumber(message);
  const ticketAmount = extractAmountAfterKeyword(message, ["ticket"]);
  const investmentAmount = extractAmountAfterKeyword(message, ["inversion", "invertir", "capital inicial"]);
  const salesAmount = extractAmountAfterKeyword(message, ["ventas", "vender", "facturar", "facturacion", "facturación"]);
  const fixedCostsAmount = extractAmountAfterKeyword(message, ["costos fijos", "costo fijo"]);
  const demandScore = extractScoreAfterKeyword(message, ["demanda"]);
  const competitorCount = extractScoreAfterKeyword(message, ["competidores", "competidor"]);
  const differentiationScore = extractScoreAfterKeyword(message, ["diferenciacion"]);
  const substituteScore = extractScoreAfterKeyword(message, ["sustitutos", "sustituto"]);
  const operationalScore = extractScoreAfterKeyword(message, ["complejidad operativa", "complejidad"]);
  const legalScore = extractScoreAfterKeyword(message, ["dificultad legal", "legal"]);
  const permitScore = extractScoreAfterKeyword(message, ["permisos", "permiso"]);
  const marginScore = extractScoreAfterKeyword(message, ["margen"]);

  if (!draft.expectedDemand && demandScore !== null) {
    patch.expectedDemand = demandScore;
  }
  if (!draft.marketSize && /(mercado)/i.test(normalized) && singleNumber) {
    patch.marketSize = Math.max(1, Math.min(10, singleNumber));
  }
  if (!draft.competitorCount && competitorCount !== null) {
    patch.competitorCount = Math.max(0, Math.min(25, Math.round(competitorCount)));
  }
  if (!draft.personnelRequired && /(persona|personal|trabajador|empleado)/i.test(normalized) && singleNumber !== null) {
    patch.personnelRequired = Math.max(1, Math.min(40, Math.round(singleNumber)));
  }

  if (!draft.differentiationLevel && differentiationScore !== null) patch.differentiationLevel = Math.min(10, differentiationScore);
  if (!draft.substituteThreat && substituteScore !== null) patch.substituteThreat = Math.min(10, substituteScore);
  if (!draft.operationalComplexity && operationalScore !== null) patch.operationalComplexity = Math.min(10, operationalScore);
  if (!draft.legalDifficulty && legalScore !== null) patch.legalDifficulty = Math.min(10, legalScore);
  if (!draft.permitComplexity && permitScore !== null) patch.permitComplexity = Math.min(10, permitScore);
  if (!draft.expectedMarginPercent && marginScore !== null) patch.expectedMarginPercent = Math.min(80, marginScore);

  if (!draft.fixedCosts && fixedCostsAmount) {
    patch.fixedCosts = fixedCostsAmount;
  }
  if (!draft.initialInvestment && investmentAmount) {
    patch.initialInvestment = investmentAmount;
  }
  if (!draft.monthlySalesProjection && salesAmount) {
    patch.monthlySalesProjection = salesAmount;
  }
  if (!draft.averageTicket && ticketAmount) {
    patch.averageTicket = ticketAmount;
  }
}

function applyDefaultScores(draft: ProjectDraft): ProjectDraft {
  return {
    segmentationClarity: draft.segmentationClarity ?? (draft.targetAudience ? 8 : undefined),
    customerFit: draft.customerFit ?? (draft.targetAudience ? 8 : undefined),
    footTraffic: draft.footTraffic ?? (draft.businessType === "Cafetería" ? 8 : undefined),
    tourismLevel: draft.tourismLevel ?? (draft.businessType === "Hotel boutique" ? 8 : undefined),
    digitalizationLevel: draft.digitalizationLevel ?? (draft.businessType === "Tienda online" ? 9 : 6),
    consumerBehavior: draft.consumerBehavior ?? 7,
    marketSize: draft.marketSize ?? 7,
    customerPower: draft.customerPower ?? 6,
    supplierDependency: draft.supplierDependency ?? 5,
    newEntrantsThreat: draft.newEntrantsThreat ?? 6,
    logisticsComplexity: draft.logisticsComplexity ?? (draft.businessType === "Tienda online" ? 6 : 5),
    entryBarriers: draft.entryBarriers ?? 5,
    sustainabilityReadiness: draft.sustainabilityReadiness ?? 6,
    variableCostRate: draft.variableCostRate ?? (draft.businessType === "Cafetería" ? 38 : 35)
  };
}

function buildProgressBasedReadyForReport(draft: ProjectDraft) {
  return Boolean(
    draft.projectName &&
      draft.businessType &&
      draft.city &&
      draft.targetAudience &&
      draft.initialInvestment &&
      draft.monthlySalesProjection &&
      draft.priceRange &&
      draft.competitorCount !== undefined &&
      draft.operationalComplexity
  );
}

function summarizeCapturedData(draft: ProjectDraft) {
  const summary = [];
  if (draft.businessType) summary.push(`negocio: ${draft.businessType}`);
  if (draft.city) summary.push(`ubicación: ${draft.city}${draft.region ? `, ${draft.region}` : ""}`);
  if (draft.targetAudience) summary.push(`cliente: ${draft.targetAudience}`);
  if (draft.initialInvestment) summary.push(`inversión: ${Math.round(draft.initialInvestment).toLocaleString("es-CL")}`);
  if (draft.monthlySalesProjection) summary.push(`ventas: ${Math.round(draft.monthlySalesProjection).toLocaleString("es-CL")} mensuales`);
  return summary.slice(0, 4).join(" · ");
}

function summarizePatchUpdate(patch: ProjectDraft) {
  const labels: Record<string, string> = {
    projectName: "nombre",
    businessType: "tipo de negocio",
    targetAudience: "cliente principal",
    country: "país",
    region: "región",
    city: "ciudad",
    priceRange: "posicionamiento",
    averageTicket: "ticket",
    expectedDemand: "demanda",
    competitorCount: "competidores",
    differentiationLevel: "diferenciación",
    substituteThreat: "sustitutos",
    initialInvestment: "inversión",
    monthlySalesProjection: "ventas mensuales",
    fixedCosts: "costos fijos",
    expectedMarginPercent: "margen esperado",
    operationalComplexity: "complejidad operativa",
    personnelRequired: "personal requerido",
    legalDifficulty: "dificultad legal",
    permitComplexity: "permisos"
  };

  return Object.keys(patch)
    .filter((key) => labels[key])
    .slice(0, 4)
    .map((key) => labels[key])
    .join(", ");
}

function buildDeterministicTurn(
  source: "mock" | "gemini",
  model: string | undefined,
  draft: ProjectDraft,
  patch: ProjectDraft
): InterviewTurnResult {
  const nextDraft = {
    ...draft,
    ...patch
  };
  const enrichedDraft = {
    ...nextDraft,
    ...applyDefaultScores(nextDraft)
  };
  const currentStage = interviewStages.find((stage) => !stage.ready(enrichedDraft));
  const completionScore = Math.max(draftCompletionSummary(enrichedDraft), 18);
  const readyForReport = buildProgressBasedReadyForReport(enrichedDraft);
  const captured = summarizeCapturedData(enrichedDraft);
  const updatedFields = summarizePatchUpdate(patch);

  const assistantMessage = currentStage
    ? `${updatedFields ? `Registré ${updatedFields}. ` : captured ? `Ya tengo ${captured}. ` : ""}${currentStage.prompt(enrichedDraft)}`
    : `${captured ? `Ya tengo ${captured}. ` : ""}La base ya es suficiente para generar un informe inicial sólido. Si quieres, puedo pasar directo al informe o hacer una última revisión de riesgos.`;

  return {
    assistantMessage,
    didacticTip: currentStage?.tip ?? "La base ya es suficiente para proyectar un informe con tesis, riesgos y recomendaciones.",
    completionScore,
    readyForReport,
    recommendedNextFocus: currentStage?.title ?? "Generar informe ejecutivo",
    missingFields: readyForReport ? [] : currentStage?.missing ?? [],
    quickReplies:
      currentStage?.quickReplies ?? ["Genera el informe", "Quiero revisar riesgos", "Haz el análisis más conservador"],
    projectPatch: {
      ...patch,
      ...applyDefaultScores(nextDraft)
    },
    source,
    model
  };
}

export function createWelcomeTurn(): InterviewTurnResult {
  return {
    assistantMessage:
      "Vamos a construir tu proyecto paso a paso. Cuéntame primero la idea en una frase: qué negocio quieres lanzar, en qué ciudad y para qué tipo de cliente.",
    didacticTip:
      "Con esa base puedo definir rubro, mercado inicial y el tipo de preguntas que realmente importan para el informe.",
    completionScore: 8,
    readyForReport: false,
    recommendedNextFocus: "Definir la idea base del negocio",
    missingFields: ["nombre del proyecto", "tipo de negocio", "ciudad", "público objetivo"],
    quickReplies: [
      "Quiero abrir una cafetería para universitarios en Santiago",
      "Estoy pensando en un hotel boutique en Pucón",
      "Quiero lanzar una tienda online de productos para mascotas"
    ],
    projectPatch: {},
    source: "mock"
  };
}

export function generateMockInterviewTurn(messages: ChatMessage[], draft: ProjectDraft): InterviewTurnResult {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const inferredPatch = inferPatchFromMessage(lastUserMessage, draft);
  enrichPatchFromQuantifiedAnswers(lastUserMessage, draft, inferredPatch);

  return buildDeterministicTurn("mock", undefined, draft, inferredPatch);
}

export async function runInterviewTurn(messages: ChatMessage[], draft: ProjectDraft): Promise<InterviewTurnResult> {
  if (!process.env.GEMINI_API_KEY) {
    return generateMockInterviewTurn(messages, draft);
  }

  const lastUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const heuristicPatch = inferPatchFromMessage(lastUserMessage, draft);
  enrichPatchFromQuantifiedAnswers(lastUserMessage, draft, heuristicPatch);

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const response = await client.models.generateContent({
    model,
    contents: `${systemPrompt.trim()}\n\n${buildConversationPrompt(messages, draft)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.3,
      maxOutputTokens: 1600
    }
  });

  const rawOutput = typeof response.text === "string" ? response.text.trim() : "";
  if (!rawOutput) {
    throw new Error("Gemini no devolvió contenido para la entrevista.");
  }

  const parsed = interviewTurnSchema.parse(parseGeminiJson(rawOutput));
  const geminiPatch = compactPatch(parsed.projectPatch as Record<string, unknown>);
  const mergedPatch = {
    ...geminiPatch,
    ...heuristicPatch
  };

  return buildDeterministicTurn("gemini", model, draft, mergedPatch);
}
