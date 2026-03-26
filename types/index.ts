export type BlockId =
  | "septe"
  | "porter"
  | "foda"
  | "mercado"
  | "finanzas"
  | "operacionLegalidad";

export type FactibilityClass = "No factible" | "Factible con riesgos" | "Factible";

export type PriceRange = "económico" | "medio" | "premium";

export type ProjectWeights = Record<BlockId, number>;

export type ProjectInput = {
  projectName: string;
  businessType: string;
  sector: string;
  country: string;
  region: string;
  city: string;
  description: string;
  targetAudience: string;
  priceRange: PriceRange;
  marketSize: number;
  expectedDemand: number;
  segmentationClarity: number;
  customerFit: number;
  footTraffic: number;
  tourismLevel: number;
  digitalizationLevel: number;
  consumerBehavior: number;
  competitorCount: number;
  differentiationLevel: number;
  customerPower: number;
  supplierDependency: number;
  substituteThreat: number;
  newEntrantsThreat: number;
  initialInvestment: number;
  fixedCosts: number;
  variableCostRate: number;
  averageTicket: number;
  monthlySalesProjection: number;
  expectedMarginPercent: number;
  operationalComplexity: number;
  personnelRequired: number;
  logisticsComplexity: number;
  legalDifficulty: number;
  permitComplexity: number;
  entryBarriers: number;
  sustainabilityReadiness: number;
  knownStrengths: string;
  knownRisks: string;
};

export type LocationContext = {
  key: string;
  country: string;
  region: string;
  city: string;
  tourismLevel: number;
  commercialFlow: number;
  competitivePressure: number;
  economicStability: number;
  priceSensitivity: number;
  regulatoryEase: number;
  digitalizationLevel: number;
  marketAttractiveness: number;
  narrative: string;
  source: "preset" | "heuristic";
};

export type FactorScore = {
  id: string;
  label: string;
  score: number;
  note: string;
};

export type BlockScore = {
  id: BlockId;
  label: string;
  weight: number;
  score: number;
  contribution: number;
  summary: string;
  factors: FactorScore[];
  positives: string[];
  risks: string[];
};

export type ScoreBreakdown = {
  finalScore: number;
  classification: FactibilityClass;
  interpretation: string;
  weights: ProjectWeights;
  blocks: BlockScore[];
  strengths: string[];
  opportunities: string[];
  risks: RiskItem[];
  salesProjection: { month: string; sales: number }[];
};

export type RiskItem = {
  title: string;
  severity: "alta" | "media" | "baja";
  detail: string;
  relatedBlock: BlockId;
};

export type InsightReport = {
  executiveSummary: string;
  scoreExplanation: string;
  mainFindings: string[];
  opportunities: string[];
  recommendations: string[];
  principalRisks: RiskItem[];
  conclusion: string;
  methodologyNote: string;
  source: "mock" | "openai";
  provider?: string;
  model?: string;
  generatedAt?: string;
  fallbackReason?: string;
};

export type ChartData = {
  name: string;
  value: number;
  fill?: string;
};

export type EvaluationSnapshot = {
  input: ProjectInput;
  context: LocationContext;
  scoreBreakdown: ScoreBreakdown;
  insights: InsightReport;
  generatedAt: string;
};
