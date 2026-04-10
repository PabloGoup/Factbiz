import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { createGeminiClient, describeGeminiError, isGeminiConfigured, parseGeminiJson } from "@/lib/ai/gemini";
import { buildFallbackBenchmarkReport, inferHotelDestinationFromSearch } from "@/lib/hotel/data";
import type {
  HotelBenchmarkReport,
  HotelBenchmarkSearchInput,
  HotelReferenceHotel,
  HotelRoomRates,
  HotelTouristStat,
  ResearchSource
} from "@/types";

const roomRatesSchema = z.object({
  single: z.number().min(0),
  double: z.number().min(0),
  triple: z.number().min(0),
  suite: z.number().min(0)
});

const hotelSchema = z.object({
  name: z.string().min(3),
  municipality: z.string().min(2),
  area: z.string().min(2),
  hotelType: z.string().min(4),
  stars: z.number().min(1).max(5),
  positioning: z.string().min(12),
  services: z.array(z.string().min(3)).min(2).max(5),
  facilities: z.array(z.string().min(3)).min(2).max(5),
  rates: roomRatesSchema,
  rateCurrency: z.string().min(3).default("USD"),
  rateBasis: z.string().min(6),
  rateAsOf: z.string().min(4),
  rateConfidence: z.enum(["published", "package", "estimated", "unverified"]),
  rateSourceTitle: z.string().min(3),
  rateSourceUrl: z.string().url(),
  rateNote: z.string().min(10),
  note: z.string().min(16),
  differentiationIdeas: z.array(z.string().min(12)).min(2).max(4),
  sourceTitle: z.string().min(3),
  sourceUrl: z.string().url()
});

const touristStatSchema = z.object({
  label: z.string().min(4),
  value: z.string().min(3),
  note: z.string().min(10),
  asOf: z.string().min(4).optional(),
  sourceTitle: z.string().min(3),
  sourceUrl: z.string().url()
});

const benchmarkSchema = z.object({
  overview: z.string().min(60),
  hotels: z.array(hotelSchema).min(2).max(8),
  marketSignals: z.array(touristStatSchema).min(2).max(4),
  commonPatterns: z.array(z.string().min(10)).min(3).max(5),
  differentiationIdeas: z.array(z.string().min(12)).min(3).max(5)
});

const benchmarkResponseSchema = {
  type: "OBJECT",
  properties: {
    overview: { type: "STRING" },
    hotels: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          municipality: { type: "STRING" },
          area: { type: "STRING" },
          hotelType: { type: "STRING" },
          stars: { type: "NUMBER" },
          positioning: { type: "STRING" },
          services: { type: "ARRAY", items: { type: "STRING" } },
          facilities: { type: "ARRAY", items: { type: "STRING" } },
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
          rateCurrency: { type: "STRING" },
          rateBasis: { type: "STRING" },
          rateAsOf: { type: "STRING" },
          rateConfidence: { type: "STRING", enum: ["published", "package", "estimated", "unverified"] },
          rateSourceTitle: { type: "STRING" },
          rateSourceUrl: { type: "STRING" },
          rateNote: { type: "STRING" },
          note: { type: "STRING" },
          differentiationIdeas: { type: "ARRAY", items: { type: "STRING" } },
          sourceTitle: { type: "STRING" },
          sourceUrl: { type: "STRING" }
        },
        required: [
          "name",
          "municipality",
          "area",
          "hotelType",
          "stars",
          "positioning",
          "services",
          "facilities",
          "rates",
          "rateCurrency",
          "rateBasis",
          "rateAsOf",
          "rateConfidence",
          "rateSourceTitle",
          "rateSourceUrl",
          "rateNote",
          "note",
          "differentiationIdeas",
          "sourceTitle",
          "sourceUrl"
        ]
      }
    },
    marketSignals: {
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
    commonPatterns: { type: "ARRAY", items: { type: "STRING" } },
    differentiationIdeas: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["overview", "hotels", "marketSignals", "commonPatterns", "differentiationIdeas"]
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

      if (!title || !url || seen.has(url)) return null;
      seen.add(url);

      return {
        title,
        url,
        note: "Fuente capturada desde búsqueda web asistida para la comparativa hotelera."
      };
    })
    .filter((item): item is ResearchSource => Boolean(item))
    .slice(0, 12);
}

function isUsableSourceUrl(url?: string) {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.hostname === "example.com" || parsed.hostname.endsWith(".example.com")) return false;
    if (parsed.hostname === "localhost" || parsed.hostname.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

function normalizeRates(input: HotelRoomRates, fallback: HotelRoomRates): HotelRoomRates {
  const rawRates = {
    single: Number.isFinite(input.single) && input.single > 0 ? input.single : 0,
    double: Number.isFinite(input.double) && input.double > 0 ? input.double : 0,
    triple: Number.isFinite(input.triple) && input.triple > 0 ? input.triple : 0,
    suite: Number.isFinite(input.suite) && input.suite > 0 ? input.suite : 0
  };
  const anchor = rawRates.double || (rawRates.single ? rawRates.single / 0.8 : 0) || (rawRates.triple ? rawRates.triple / 1.25 : 0) || (rawRates.suite ? rawRates.suite / 1.75 : 0) || fallback.double;

  return {
    single: Math.round(rawRates.single || fallback.single || anchor * 0.8),
    double: Math.round(rawRates.double || fallback.double || anchor),
    triple: Math.round(rawRates.triple || fallback.triple || anchor * 1.25),
    suite: Math.round(rawRates.suite || fallback.suite || anchor * 1.75)
  };
}

function mergeSources(primary: ResearchSource[], secondary: ResearchSource[]) {
  return [...primary, ...secondary].reduce<ResearchSource[]>((accumulator, source) => {
    if (!source.title || !isUsableSourceUrl(source.url)) return accumulator;
    if (accumulator.some((item) => item.url === source.url)) return accumulator;
    accumulator.push(source);
    return accumulator;
  }, []);
}

async function repairBenchmarkPayload(client: GoogleGenAI, model: string, rawOutput: string, maxOutputTokens: number) {
  const repairResponse = await client.models.generateContent({
    model,
    contents:
      "El siguiente contenido intentó ser un JSON estructurado para una búsqueda comparativa hotelera, pero quedó inválido o truncado. Reescríbelo como JSON válido que cumpla exactamente el esquema requerido. No agregues markdown ni explicación. Devuelve solo JSON.\n\nContenido defectuoso:\n" +
      rawOutput,
    config: {
      responseMimeType: "application/json",
      responseSchema: benchmarkResponseSchema,
      temperature: 0.1,
      maxOutputTokens
    }
  });

  const repairedOutput = extractResponseText(repairResponse);

  if (!repairedOutput) {
    throw new Error("El proveedor de IA no devolvió una reparación válida para el benchmark hotelero.");
  }

  return parseGeminiJson(repairedOutput);
}

async function generateStructuredBenchmark(client: GoogleGenAI, model: string, prompt: string) {
  const runStructuredCall = async (contents: string, outputTokens: number, temperature = 0.2) => {
    const response = await client.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: benchmarkResponseSchema,
        temperature,
        maxOutputTokens: outputTokens
      }
    });

    const rawOutput = extractResponseText(response);

    if (!rawOutput) {
      throw new Error("El proveedor de IA no devolvió una respuesta estructurada para el benchmark hotelero.");
    }

    return rawOutput;
  };

  const rawOutput = await runStructuredCall(prompt, 1800);

  try {
    return benchmarkSchema.parse(parseGeminiJson(rawOutput));
  } catch {
    try {
      const repaired = await repairBenchmarkPayload(client, model, rawOutput, 1800);
      return benchmarkSchema.parse(repaired);
    } catch {
      const compactPrompt = `${prompt}

IMPORTANTE:
- Devuelve una versión compacta y estricta.
- No excedas el mínimo útil de texto por campo.
- No agregues explicación fuera del JSON.
- Prioriza JSON válido sobre extensión.`;

      const compactRawOutput = await runStructuredCall(compactPrompt, 1200, 0.1);

      try {
        return benchmarkSchema.parse(parseGeminiJson(compactRawOutput));
      } catch {
        const repairedCompact = await repairBenchmarkPayload(client, model, compactRawOutput, 1200);
        return benchmarkSchema.parse(repairedCompact);
      }
    }
  }
}

function collectSources(hotels: HotelReferenceHotel[], signals: HotelTouristStat[]) {
  const collected: ResearchSource[] = [];

  for (const hotel of hotels) {
    const sourceUrl = hotel.sourceUrl;
    if (hotel.sourceTitle && sourceUrl && isUsableSourceUrl(sourceUrl)) {
      collected.push({
        title: hotel.sourceTitle,
        url: sourceUrl,
        note: `Fuente de referencia para ${hotel.name} dentro del benchmark comparativo.`
      });
    }

    if (hotel.rateSourceTitle && hotel.rateSourceUrl && isUsableSourceUrl(hotel.rateSourceUrl)) {
      collected.push({
        title: hotel.rateSourceTitle,
        url: hotel.rateSourceUrl,
        note: hotel.rateAsOf
          ? `Fuente de tarifa para ${hotel.name}. Base: ${hotel.rateBasis ?? "no especificada"}. Fecha/base: ${hotel.rateAsOf}.`
          : `Fuente de tarifa para ${hotel.name}. Base: ${hotel.rateBasis ?? "no especificada"}.`
      });
    }
  }

  for (const signal of signals) {
    const sourceUrl = signal.sourceUrl;
    if (signal.sourceTitle && sourceUrl && isUsableSourceUrl(sourceUrl)) {
      collected.push({
        title: signal.sourceTitle,
        url: sourceUrl,
        note: signal.asOf ? `Dato de mercado. Periodo o fecha: ${signal.asOf}.` : "Dato de mercado usado en la comparativa."
      });
    }
  }

  return collected;
}

export async function searchHotelBenchmarks(
  input: HotelBenchmarkSearchInput,
  options?: { requireGemini?: boolean }
): Promise<HotelBenchmarkReport> {
  const fallback = buildFallbackBenchmarkReport(input);
  const requireGemini = options?.requireGemini ?? false;

  if (!isGeminiConfigured()) {
    if (requireGemini) {
      throw new Error("La IA no está configurada en el servidor. Revisa la credencial del proveedor y reinicia Next.js.");
    }

    return fallback;
  }

  try {
    const client = createGeminiClient();
    const researchModel = process.env.GEMINI_RESEARCH_MODEL ?? "gemini-2.5-flash";
    const model =
      process.env.GEMINI_HOTEL_MODEL ??
      process.env.GEMINI_RESEARCH_MODEL ??
      process.env.GEMINI_MODEL ??
      "gemini-2.5-flash";

    const destinationId = inferHotelDestinationFromSearch(input);
    const memoResponse = await client.models.generateContent({
      model: researchModel,
      contents: `Investiga hoteles comparables para una búsqueda hotelera en español usando Google Search.

Filtros del usuario:
${JSON.stringify(input, null, 2)}

Objetivo:
- encontrar hoteles premium comparables realmente relevantes para la zona
- priorizar hoteles del mismo destino o entorno inmediato
- identificar tipo de hotel, estrellas, servicios, instalaciones y tarifas públicas de referencia en USD cuando existan
- levantar 2 a 4 señales de mercado o turismo con fuente visible
- detectar patrones comunes del set competitivo
- proponer 3 a 5 ideas concretas de diferenciación para un nuevo proyecto hotelero

Reglas:
- prioriza fuentes oficiales del hotel, Chile Travel, SERNATUR, INE, Subsecretaría de Turismo y OTA solo como apoyo si falta dato directo
- no inventes tarifas ni estrellas exactas si no están sustentadas
- las tarifas deben venir de página oficial de reservas del hotel u OTA reconocida; si el hotel solo publica paquetes all-inclusive o tarifa por persona, indícalo como package y explica la base
- si no encuentras tarifa pública exacta para single/doble/triple/suite, estima una tarifa competitiva de referencia usando comparables del destino, pero marca rateConfidence="estimated" y explica el método
- si la fuente es paquete por persona o all-inclusive, usa el valor público como referencia competitiva y marca rateConfidence="package"
- nunca devuelvas 0 en tarifas: este benchmark debe servir para comparar competencia de mercado con números
- si un dato no aparece, deja la señal breve y concreta sin rellenar con ficción
- enfócate en hoteles comparables con ${input.stars ? `${input.stars} estrellas` : "categoría premium"} y tipo ${input.hotelType || "similar al filtro"}
- piensa esta salida para una tabla comparativa y decisiones de benchmarking.`,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
        maxOutputTokens: 2600
      }
    });

    const memo = extractResponseText(memoResponse);
    const groundingSources = extractGroundingSources(memoResponse);
    const effectiveMemo = memo || fallback.overview;

    const structuredPrompt = `Eres un consultor senior hotelero.
Debes devolver solo JSON válido en español para una búsqueda comparativa hotelera.
No agregues markdown ni explicación externa.

Filtros del usuario:
${JSON.stringify(input, null, 2)}

Memo grounded:
${effectiveMemo.slice(0, 8000)}

Instrucciones:
- overview: 2 o 3 frases sobre cómo se ve el benchmark de esta zona.
- hotels: 3 a 6 hoteles comparables reales. municipality y area deben ser concretos. hotelType debe ser corto. stars debe ser numérico. rates debe usar USD y contener una referencia competitiva para single/doble/triple/suite. Nunca uses 0. Si no hay tarifa exacta por habitación, estima desde el set competitivo y explícalo en rateNote. rateConfidence debe ser:
  - "published" si es tarifa pública por habitación/noche.
  - "package" si la fuente muestra paquete, all-inclusive o tarifa por persona/noche.
  - "estimated" solo si el memo entrega una estimación clara y sustentada.
  - "unverified" solo si la fuente es débil, pero igualmente debes entregar una referencia numérica competitiva.
  rateBasis debe decir si es por habitación/noche, por persona/noche, paquete, all-inclusive, fecha de búsqueda o base equivalente. rateSourceTitle y rateSourceUrl deben apuntar a la fuente específica de tarifa. rateNote debe explicar límites del dato. services y facilities máximo 4 ítems cada uno. differentiationIdeas: 2 a 4 ideas breves por hotel. sourceTitle y sourceUrl obligatorios.
- marketSignals: 2 a 4 señales reales del mercado con fuente visible. Prioriza INE, Subsecretaría de Turismo, SERNATUR o fuentes oficiales.
- commonPatterns: 3 a 5 patrones repetidos del benchmark.
- differentiationIdeas: 3 a 5 propuestas globales para diferenciar un nuevo hotel frente a este set.
- Prioriza brevedad, claridad y validez JSON.`;

    const parsed = await generateStructuredBenchmark(client, model, structuredPrompt);

    const hotels: HotelReferenceHotel[] = parsed.hotels.map((hotel, index) => ({
      id: `gemini-${index + 1}-${hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      destination: destinationId,
      name: hotel.name,
      country: input.country,
      region: input.region,
      municipality: hotel.municipality,
      area: hotel.area,
      hotelType: hotel.hotelType,
      stars: hotel.stars,
      positioning: hotel.positioning,
      services: hotel.services.slice(0, 5),
      facilities: hotel.facilities.slice(0, 5),
      rates: normalizeRates(hotel.rates, fallback.hotels[index]?.rates ?? fallback.hotels[0]?.rates ?? {
        single: 200,
        double: 300,
        triple: 380,
        suite: 520
      }),
      rateCurrency: hotel.rateCurrency || "USD",
      rateBasis: hotel.rateBasis,
      rateAsOf: hotel.rateAsOf,
      rateConfidence: hotel.rateConfidence,
      rateSourceTitle: hotel.rateSourceTitle,
      rateSourceUrl: isUsableSourceUrl(hotel.rateSourceUrl) ? hotel.rateSourceUrl : undefined,
      rateNote: hotel.rateNote,
      note: hotel.note,
      differentiationIdeas: hotel.differentiationIdeas.slice(0, 4),
      sourceTitle: hotel.sourceTitle,
      sourceUrl: isUsableSourceUrl(hotel.sourceUrl) ? hotel.sourceUrl : undefined
    }));

    const marketSignals = parsed.marketSignals.map((signal, index) => ({
      ...signal,
      sourceUrl: isUsableSourceUrl(signal.sourceUrl) ? signal.sourceUrl : fallback.marketSignals[index]?.sourceUrl,
      sourceTitle:
        signal.sourceTitle && isUsableSourceUrl(signal.sourceUrl) ? signal.sourceTitle : fallback.marketSignals[index]?.sourceTitle
    }));

    return {
      query: input,
      overview: parsed.overview,
      hotels: hotels.length ? hotels : fallback.hotels,
      marketSignals: marketSignals.length ? marketSignals : fallback.marketSignals,
      commonPatterns: parsed.commonPatterns.slice(0, 5),
      differentiationIdeas: parsed.differentiationIdeas.slice(0, 5),
      sources: mergeSources([...groundingSources, ...collectSources(hotels, marketSignals)], fallback.sources).slice(0, 12),
      mode: "gemini"
    };
  } catch (error) {
    const warning = describeGeminiError(error);

    if (requireGemini && !warning.toLowerCase().includes("json")) {
      return {
        ...fallback,
        warning
      };
    }

    return {
      ...fallback,
      warning
    };
  }
}
