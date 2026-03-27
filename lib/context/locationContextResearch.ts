import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

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

function extractInteractionText(interaction: unknown) {
  const outputs = (interaction as { outputs?: unknown[] })?.outputs ?? [];

  const texts = outputs.flatMap((output) => {
    if (!output || typeof output !== "object") return [];

    if ("text" in output && typeof output.text === "string") {
      return [output.text];
    }

    if ("parts" in output && Array.isArray(output.parts)) {
      return output.parts
        .flatMap((part) => {
          if (!part || typeof part !== "object") return [];
          return "text" in part && typeof part.text === "string" ? [part.text] : [];
        })
        .filter(Boolean);
    }

    if ("content" in output && output.content && typeof output.content === "object" && "parts" in output.content) {
      const parts = Array.isArray(output.content.parts) ? output.content.parts : [];
      return parts
        .flatMap((part) => {
          if (!part || typeof part !== "object") return [];
          return "text" in part && typeof part.text === "string" ? [part.text] : [];
        })
        .filter(Boolean);
    }

    return [];
  });

  return texts.join("\n").trim();
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

  const groundedInteraction = await client.interactions.create({
    model: researchModel,
    input: `Investiga con Google Search el entorno actual de ${locationLabel} para un proyecto de ${input.businessType} del rubro ${input.sector}, orientado a ${input.targetAudience}. Necesito un brief factual en español, corto pero sustantivo, sobre turismo, flujo comercial, presión competitiva, estabilidad económica, sensibilidad al precio, facilidad regulatoria, digitalización y atractivo del mercado. No inventes datos ni uses frases vacías.`,
    tools: [{ type: "google_search" }]
  });

  const groundedBrief = extractInteractionText(groundedInteraction);

  if (!groundedBrief) {
    throw new Error("Gemini no devolvió un brief grounded para la ubicación.");
  }

  const response = await client.models.generateContent({
    model: scoringModel,
    contents: `Convierte este brief grounded en un JSON para scoring de factibilidad.\n\nUbicación: ${locationLabel}\n\nBrief:\n${groundedBrief}\n\nDevuelve exclusivamente JSON con estos campos numéricos del 1 al 10: tourismLevel, commercialFlow, competitivePressure, economicStability, priceSensitivity, regulatoryEase, digitalizationLevel, marketAttractiveness, y un narrative ejecutivo de 2 a 4 frases.`,
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
      maxOutputTokens: 500
    }
  });

  const rawOutput = typeof response.text === "string" ? response.text.trim() : "";

  if (!rawOutput) {
    throw new Error("Gemini no devolvió contexto estructurado para la ubicación.");
  }

  const parsed = groundedContextSchema.parse(JSON.parse(rawOutput));
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
