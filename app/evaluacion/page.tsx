import { Suspense } from "react";

import { EvaluationWizard } from "@/components/evaluation/evaluation-wizard";

export default function EvaluationPage() {
  return (
    <Suspense fallback={null}>
      <EvaluationWizard />
    </Suspense>
  );
}
