import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { parseGeminiJson } from "@/lib/ai/gemini";
import type { LocationContext, ProjectInput } from "@/types";

const groundedContextSchema = z.object({
  tourismLevel: z.number().min(1).max(10),
  commercialFlow: z.number().min(1).max(10),
  competitivePressure: z.number().min(1).max(10),
  economicStability: z.number().min(1).max(10),
  priceSensitivity: z.number().min(1).max(10),
  regulatoryEase: z.number().min(1).max(10),
  digitalizationLevel: z.number().min(1).max(10),
  marketAttractiveness: z.number().min(1).max(10),
  narrative: z.string().min(60)
});

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function extractResponseText(response: unknown) {
  if (response && typeof response === "object" && "text" in response && typeof response.text === "string") {
    const directText = response.text.trim();
    if (directText) return directText;
  }

  const candidates = (response as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })?.candidates ?? [];

  const candidateText = candidates
    .flatMap((candidate) => candidate.content?.parts ?? [])
    .map((part) => (typeof part.text === "string" ? part.text.trim() : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  return candidateText;
}

export async function getGroundedLocationContext(input: Pick<ProjectInput, "country" | "region" | "city" | "businessType" | "sector" | "targetAudience">): Promise<LocationContext> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY no está configurada.");
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
  });
  const researchModel = process.env.GEMINI_RESEARCH_MODEL ?? "gemini-2.5-flash";
  const scoringModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
  const locationLabel = `${input.city}, ${input.region}, ${input.country}`;

  const groundedResponse = await client.models.generateContent({
    model: researchModel,
    contents: `Investiga el entorno actual de ${locationLabel} para un proyecto de ${input.businessType} del rubro ${input.sector}, orientado a ${input.targetAudience}. Usa Google Search y entrega un brief factual en español, breve pero sustantivo, sobre turismo, flujo comercial, presión competitiva, estabilidad económica, sensibilidad al precio, facilidad regulatoria, digitalización y atractivo del mercado. No inventes cifras exactas si no están respaldadas.`,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.2,
      maxOutputTokens: 700
    }
  });

  const groundedBrief = extractResponseText(groundedResponse);

  if (!groundedBrief) {
    throw new Error("Gemini no devolvió un brief grounded para la ubicación.");
  }

  const response = await client.models.generateContent({
    model: scoringModel,
    contents: `Convierte este brief grounded en un JSON útil para scoring de factibilidad.\n\nUbicación: ${locationLabel}\n\nBrief:\n${groundedBrief}\n\nDevuelve exclusivamente JSON con estos campos: tourismLevel, commercialFlow, competitivePressure, economicStability, priceSensitivity, regulatoryEase, digitalizationLevel, marketAttractiveness, narrative. Todos los puntajes deben ir del 1 al 10. El narrative debe resumir en 2 a 4 frases qué señales del entorno afectan realmente al proyecto.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
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
        },
        required: [
          "tourismLevel",
          "commercialFlow",
          "competitivePressure",
          "economicStability",
          "priceSensitivity",
          "regulatoryEase",
          "digitalizationLevel",
          "marketAttractiveness",
          "narrative"
        ]
      },
      temperature: 0.2,
      maxOutputTokens: 700
    }
  });

  const rawOutput = extractResponseText(response);

  if (!rawOutput) {
    throw new Error("Gemini no devolvió contexto estructurado para la ubicación.");
  }

  const parsed = groundedContextSchema.parse(parseGeminiJson(rawOutput));
  const key = [normalize(input.country), normalize(input.region), normalize(input.city)].join("|");

  return {
    key,
    country: input.country,
    region: input.region,
    city: input.city,
    ...parsed,
    source: "grounded"
  };
}
