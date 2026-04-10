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

export type ResearchSectionId =
  | "macroMicro"
  | "foda"
  | "competitiveAdvantage"
  | "marketStudy"
  | "competitionStudy"
  | "promotionPlan"
  | "operationAndHR"
  | "legalBarriers"
  | "conclusion";

export type ResearchSource = {
  title: string;
  url: string;
  note: string;
};

export type ResearchFinding = {
  section: ResearchSectionId;
  title: string;
  summary: string;
  evidence: string;
  sourceTitles: string[];
};

export type ScoringInference = {
  variable: string;
  value: string | number;
  rationale: string;
  sourceTitles: string[];
};

export type ResearchDossier = {
  query: string;
  projectSummary: string;
  sections: Record<ResearchSectionId, string>;
  findings: ResearchFinding[];
  sources: ResearchSource[];
  scoringInferences: ScoringInference[];
  inferredProjectPatch: Partial<ProjectInput>;
  inferredLocationSignals: Partial<
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
  assumptions: string[];
  provider?: string;
  model?: string;
  generatedAt: string;
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
  research?: ResearchDossier;
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

export type HotelDestinationId =
  | "patagonia-chilena"
  | "puerto-varas"
  | "villarrica"
  | "san-pedro-de-atacama"
  | "papudo";

export type HotelSalesChannelId = "tourOperators" | "onlineAgencies" | "direct" | "corporate";

export type HotelRoomMix = {
  single: number;
  double: number;
  triple: number;
  suite: number;
};

export type HotelRoomRates = {
  single: number;
  double: number;
  triple: number;
  suite: number;
};

export type HotelChannelConfig = {
  share: number;
  commission: number;
};

export type HotelChannelMap = Record<HotelSalesChannelId, HotelChannelConfig>;

export type HotelCaseInput = {
  hotelName: string;
  destination: HotelDestinationId;
  region: string;
  country: string;
  category: string;
  concept: string;
  services: string;
  differentiation: string;
  totalRooms: number;
  roomMix: HotelRoomMix;
  roomRates: HotelRoomRates;
  previousAverageRate: number;
  targetAverageRate: number;
  guestFactor: number;
  breakfastPriceCurrent: number;
  breakfastPriceProposed: number;
  occupancyJanuary: number;
  occupancyFebruary: number;
  channels: HotelChannelMap;
};

export type HotelTouristStat = {
  label: string;
  value: string;
  note: string;
  asOf?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type HotelEvidencePoint = {
  label: string;
  value: string;
  note: string;
  asOf?: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type HotelAttraction = {
  name: string;
  relevance: string;
  sourceTitle?: string;
  sourceUrl?: string;
};

export type HotelCompetitor = {
  name: string;
  area: string;
  positioning: string;
  services: string[];
  facilities: string[];
  rates: HotelRoomRates;
  note: string;
};

export type HotelReferenceHotel = {
  id: string;
  destination: HotelDestinationId;
  name: string;
  country: string;
  region: string;
  municipality: string;
  area: string;
  hotelType: string;
  stars: number;
  positioning: string;
  services: string[];
  facilities: string[];
  rates: HotelRoomRates;
  note: string;
  differentiationIdeas: string[];
  sourceTitle?: string;
  sourceUrl?: string;
};

export type HotelBenchmarkSearchInput = {
  country: string;
  region: string;
  municipality: string;
  hotelType: string;
  stars?: number | null;
};

export type HotelBenchmarkReport = {
  query: HotelBenchmarkSearchInput;
  overview: string;
  hotels: HotelReferenceHotel[];
  marketSignals: HotelTouristStat[];
  commonPatterns: string[];
  differentiationIdeas: string[];
  sources: ResearchSource[];
  mode: "mock" | "gemini";
  warning?: string;
};

export type HotelSepteFactorId =
  | "social"
  | "economic"
  | "political"
  | "technological"
  | "ecological"
  | "legal";

export type HotelSepteFactor = {
  id: HotelSepteFactorId;
  label: string;
  analysis: string;
  implication: string;
  evidence: HotelEvidencePoint[];
};

export type HotelStrategicPlan = {
  objective: string;
  positioning: string;
  goals: string[];
  actions: string[];
  commercialRationale: string;
  pricingRationale: string;
};

export type HotelResearchReport = {
  destinationLabel: string;
  destinationDiagnosis: string;
  septeFactors: HotelSepteFactor[];
  competitionSummary: string;
  competitors: HotelCompetitor[];
  attractions: HotelAttraction[];
  touristStats: HotelTouristStat[];
  marketRateReference: HotelRoomRates;
  strategicPlan: HotelStrategicPlan;
  sources: ResearchSource[];
  mode: "mock" | "gemini";
  warning?: string;
};

export type HotelRoomTypeResult = {
  type: keyof HotelRoomMix;
  availableRooms: number;
  soldRoomNights: number;
  rate: number;
  revenue: number;
};

export type HotelChannelResult = {
  channel: HotelSalesChannelId;
  share: number;
  commission: number;
  occupiedRoomNights: number;
  grossRevenue: number;
  commissionCost: number;
  netRevenue: number;
  netAdr: number;
};

export type HotelMonthlyForecast = {
  month: "Enero 2027" | "Febrero 2027";
  days: number;
  availableRoomNights: number;
  occupiedRoomNights: number;
  occupancyRate: number;
  totalGuests: number;
  achievedAdr: number;
  grossRoomRevenue: number;
  breakfastRevenueCurrent: number;
  breakfastRevenueProposed: number;
  breakfastRevenueDelta: number;
  commissionsTotal: number;
  netRoomRevenue: number;
  roomTypeResults: HotelRoomTypeResult[];
  channelResults: HotelChannelResult[];
};

export type HotelForecastSummary = {
  totalGrossRoomRevenue: number;
  totalNetRoomRevenue: number;
  totalBreakfastRevenueCurrent: number;
  totalBreakfastRevenueProposed: number;
  totalBreakfastDelta: number;
  totalCommissions: number;
  weightedAverageAdr: number;
  adrTargetMet: boolean;
  adrGap: number;
  mostProfitableChannel: HotelSalesChannelId;
  largestNetContributor: HotelSalesChannelId;
  warnings: string[];
  recommendations: HotelRecommendation[];
};

export type HotelRecommendation = {
  title: string;
  text: string;
  tone?: "emerald" | "amber" | "slate";
};

export type HotelCaseResult = {
  input: HotelCaseInput;
  research: HotelResearchReport;
  monthlyForecasts: HotelMonthlyForecast[];
  summary: HotelForecastSummary;
  generatedAt: string;
};

export type SavedHotelCaseRecord = {
  id: string;
  userId: string | null;
  hotelName: string;
  destination: HotelDestinationId;
  region: string;
  country: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "solved";
  caseInput: HotelCaseInput;
  caseResult: HotelCaseResult | null;
};

export type SavedHotelCaseListItem = {
  id: string;
  hotelName: string;
  destination: HotelDestinationId;
  region: string;
  country: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "solved";
  weightedAverageAdr?: number;
  mostProfitableChannel?: HotelSalesChannelId;
};
