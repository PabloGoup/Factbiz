import { ConversationalEvaluation } from "@/components/evaluation/conversational-evaluation";
import { EvaluationWizard } from "@/components/evaluation/evaluation-wizard";

export default function EvaluationPage({
  searchParams
}: {
  searchParams?: {
    modo?: string;
    demo?: string;
  };
}) {
  const mode = searchParams?.modo;
  const demoId = searchParams?.demo;

  if (mode === "formulario") {
    return <EvaluationWizard demoId={demoId} />;
  }

  return <ConversationalEvaluation demoId={demoId} />;
}
