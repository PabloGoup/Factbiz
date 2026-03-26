import { generateMockAiInsights } from "@/lib/ai/aiInsights";
import { getLocationContext } from "@/lib/context/locationContextService";
import { DEFAULT_WEIGHTS } from "@/lib/constants";
import { evaluateProject } from "@/lib/scoring/engine";
import type { EvaluationSnapshot, ProjectInput, ProjectWeights } from "@/types";

export function buildEvaluationSnapshot(
  input: ProjectInput,
  weights: ProjectWeights = DEFAULT_WEIGHTS
): EvaluationSnapshot {
  const context = getLocationContext(input);
  const scoreBreakdown = evaluateProject(input, context, weights);
  const insights = generateMockAiInsights(input, context, scoreBreakdown);

  return {
    input,
    context,
    scoreBreakdown,
    insights,
    generatedAt: new Date().toISOString()
  };
}
