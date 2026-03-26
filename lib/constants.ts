import type { BlockId, ProjectInput, ProjectWeights } from "@/types";

export const STORAGE_KEYS = {
  project: "factibiz.project",
  weights: "factibiz.weights",
  evaluation: "factibiz.evaluation"
} as const;

export const BLOCK_LABELS: Record<BlockId, string> = {
  septe: "SEPTE",
  porter: "Porter",
  foda: "FODA",
  mercado: "Mercado",
  finanzas: "Finanzas",
  operacionLegalidad: "Operación y legalidad"
};

export const DEFAULT_WEIGHTS: ProjectWeights = {
  septe: 25,
  porter: 20,
  foda: 10,
  mercado: 20,
  finanzas: 15,
  operacionLegalidad: 10
};

export const EMPTY_PROJECT: ProjectInput = {
  projectName: "",
  businessType: "",
  sector: "",
  country: "Chile",
  region: "",
  city: "",
  description: "",
  targetAudience: "",
  priceRange: "medio",
  marketSize: 6,
  expectedDemand: 6,
  segmentationClarity: 6,
  customerFit: 6,
  footTraffic: 6,
  tourismLevel: 5,
  digitalizationLevel: 6,
  consumerBehavior: 6,
  competitorCount: 5,
  differentiationLevel: 6,
  customerPower: 5,
  supplierDependency: 5,
  substituteThreat: 5,
  newEntrantsThreat: 5,
  initialInvestment: 50000,
  fixedCosts: 8000,
  variableCostRate: 35,
  averageTicket: 30,
  monthlySalesProjection: 18000,
  expectedMarginPercent: 18,
  operationalComplexity: 5,
  personnelRequired: 6,
  logisticsComplexity: 5,
  legalDifficulty: 4,
  permitComplexity: 4,
  entryBarriers: 5,
  sustainabilityReadiness: 6,
  knownStrengths: "",
  knownRisks: ""
};

export const STEP_TITLES = [
  "Datos generales",
  "Ubicación y entorno",
  "Mercado y cliente",
  "Competencia",
  "Finanzas",
  "Operación y legalidad",
  "Revisión final"
] as const;
