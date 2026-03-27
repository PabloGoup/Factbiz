import { EMPTY_PROJECT } from "@/lib/constants";
import type { ProjectDraft, ProjectInput } from "@/types";

export function mergeProjectDraft(draft: ProjectDraft): ProjectInput {
  return {
    ...EMPTY_PROJECT,
    ...draft
  };
}

export function draftCompletionSummary(draft: ProjectDraft) {
  const relevantChecks = [
    Boolean(draft.projectName),
    Boolean(draft.businessType),
    Boolean(draft.sector),
    Boolean(draft.country),
    Boolean(draft.city),
    Boolean(draft.description),
    Boolean(draft.targetAudience),
    typeof draft.marketSize === "number",
    typeof draft.expectedDemand === "number",
    typeof draft.competitorCount === "number",
    typeof draft.initialInvestment === "number",
    typeof draft.monthlySalesProjection === "number",
    typeof draft.operationalComplexity === "number",
    typeof draft.legalDifficulty === "number"
  ];

  const completed = relevantChecks.filter(Boolean).length;
  return Math.round((completed / relevantChecks.length) * 100);
}
