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
  source: "preset" | "heuristic" | "grounded";
};

export type ReportBlockNarrative = {
  summary: string;
  detailedAnalysis: string;
  positives: string[];
  risks: string[];
  recommendation: string;
  factorNarratives: {
    label: string;
    headline: string;
    assessment: string;
    impact: string;
  }[];
};

export type ReportNarrative = {
  scoreSummary: string;
  methodology: string;
  contextSummary: string;
  chartsSummary: string;
  blockNarratives: Record<BlockId, ReportBlockNarrative>;
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
  reportNarrative: ReportNarrative;
  source: "mock" | "gemini";
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

export type ChatRole = "assistant" | "user";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
};

export type ProjectDraft = Partial<ProjectInput>;

export type InterviewTurnResult = {
  assistantMessage: string;
  didacticTip: string;
  completionScore: number;
  readyForReport: boolean;
  recommendedNextFocus: string;
  missingFields: string[];
  quickReplies: string[];
  projectPatch: ProjectDraft;
  source: "gemini" | "mock";
  model?: string;
};

export type InterviewSession = {
  messages: ChatMessage[];
  draft: ProjectDraft;
  completionScore: number;
  readyForReport: boolean;
  missingFields: string[];
  quickReplies: string[];
  didacticTip?: string;
  recommendedNextFocus?: string;
  lastModel?: string;
};
