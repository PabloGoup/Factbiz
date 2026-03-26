import type { LocationContext, ProjectInput } from "@/types";
import { clamp } from "@/lib/utils";

const presetContexts: Record<string, Omit<LocationContext, "country" | "region" | "city" | "key">> = {
  "argentina|ciudad autónoma de buenos aires|buenos aires": {
    tourismLevel: 7,
    commercialFlow: 9,
    competitivePressure: 9,
    economicStability: 4,
    priceSensitivity: 8,
    regulatoryEase: 5,
    digitalizationLevel: 8,
    marketAttractiveness: 8,
    narrative:
      "Buenos Aires combina alto flujo comercial y madurez digital, pero exige una propuesta muy afinada por inflación, promociones agresivas y saturación competitiva.",
    source: "preset"
  },
  "chile|región metropolitana|santiago": {
    tourismLevel: 6,
    commercialFlow: 8,
    competitivePressure: 8,
    economicStability: 7,
    priceSensitivity: 6,
    regulatoryEase: 7,
    digitalizationLevel: 9,
    marketAttractiveness: 8,
    narrative:
      "Santiago ofrece un ecosistema empresarial formal, alta digitalización y una regulación relativamente clara, con competencia intensa en zonas consolidadas.",
    source: "preset"
  },
  "colombia|bogotá d.c.|bogotá": {
    tourismLevel: 6,
    commercialFlow: 8,
    competitivePressure: 8,
    economicStability: 6,
    priceSensitivity: 7,
    regulatoryEase: 6,
    digitalizationLevel: 8,
    marketAttractiveness: 8,
    narrative:
      "Bogotá presenta masa crítica de demanda y adopción digital sólida, aunque el precio sigue siendo un filtro relevante y la rivalidad es alta.",
    source: "preset"
  },
  "perú|loreto|iquitos": {
    tourismLevel: 9,
    commercialFlow: 6,
    competitivePressure: 4,
    economicStability: 5,
    priceSensitivity: 5,
    regulatoryEase: 5,
    digitalizationLevel: 5,
    marketAttractiveness: 7,
    narrative:
      "Iquitos favorece proyectos vinculados al turismo de experiencia, con menor presión competitiva, aunque la logística y los permisos demandan más capacidad operativa.",
    source: "preset"
  },
  "perú|lima|lima": {
    tourismLevel: 7,
    commercialFlow: 9,
    competitivePressure: 8,
    economicStability: 6,
    priceSensitivity: 6,
    regulatoryEase: 6,
    digitalizationLevel: 8,
    marketAttractiveness: 8,
    narrative:
      "Lima concentra demanda, proveedores y tráfico comercial, pero penaliza proyectos poco diferenciados por su rivalidad y exigencia operacional.",
    source: "preset"
  }
};

function normalize(text: string) {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function inferMetroBoost(city: string, region: string) {
  const joined = `${city} ${region}`;
  if (/(santiago|buenos aires|bogota|bogotá|lima|mexico|sao paulo|medellin)/i.test(joined)) {
    return 2;
  }

  if (/(capital|metropolitana)/i.test(joined)) {
    return 1;
  }

  return 0;
}

export function getLocationContext(input: Pick<ProjectInput, "country" | "region" | "city">): LocationContext {
  const key = [normalize(input.country), normalize(input.region), normalize(input.city)].join("|");
  const preset = presetContexts[key];

  if (preset) {
    return {
      key,
      country: input.country,
      region: input.region,
      city: input.city,
      ...preset
    };
  }

  const metroBoost = inferMetroBoost(input.city, input.region);
  const tourismBias = /(playa|selva|amazonia|patagonia|costa|centro historico|historico)/i.test(
    `${input.city} ${input.region}`
  )
    ? 2
    : 0;
  const countryNormalized = normalize(input.country);
  const stabilityBase = countryNormalized.includes("chile") ? 7 : countryNormalized.includes("per") ? 6 : 5;
  const digitalBase = 6 + metroBoost;

  const tourismLevel = clamp(5 + tourismBias);
  const commercialFlow = clamp(5 + metroBoost);
  const competitivePressure = clamp(4 + metroBoost);
  const economicStability = clamp(stabilityBase);
  const priceSensitivity = clamp(7 - metroBoost * 0.5);
  const regulatoryEase = clamp(5 + (countryNormalized.includes("chile") ? 2 : 0));
  const digitalizationLevel = clamp(digitalBase);
  const marketAttractiveness = clamp((tourismLevel + commercialFlow + economicStability + digitalizationLevel) / 4);

  return {
    key,
    country: input.country,
    region: input.region,
    city: input.city,
    tourismLevel,
    commercialFlow,
    competitivePressure,
    economicStability,
    priceSensitivity,
    regulatoryEase,
    digitalizationLevel,
    marketAttractiveness,
    narrative:
      "Se aplicó una heurística de mercado por ciudad y país. El análisis asume condiciones urbanas medias, con ajustes por turismo, madurez comercial y facilidad regulatoria.",
    source: "heuristic"
  };
}
