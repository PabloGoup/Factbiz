import type { EvaluationSnapshot } from "@/types";

export function printCurrentPage() {
  if (typeof window === "undefined") return;
  window.print();
}

export function downloadEvaluationJson(snapshot: EvaluationSnapshot) {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = snapshot.input.projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  link.href = url;
  link.download = `${safeName || "factibiz"}-evaluacion.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}
