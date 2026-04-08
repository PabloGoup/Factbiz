import type { EvaluationSnapshot } from "@/types";
import { slugify } from "@/lib/utils";

export function printCurrentPage(projectName?: string) {
  if (typeof window === "undefined") return;

  const previousTitle = window.document.title;

  if (projectName) {
    window.document.title = `${slugify(projectName) || "factibiz"}-informe-completo`;
  }

  window.print();

  if (projectName) {
    window.setTimeout(() => {
      window.document.title = previousTitle;
    }, 250);
  }
}

export function downloadEvaluationJson(snapshot: EvaluationSnapshot) {
  if (typeof window === "undefined") return;

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json"
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = slugify(snapshot.input.projectName);

  link.href = url;
  link.download = `${safeName || "factibiz"}-evaluacion.json`;
  link.click();
  window.URL.revokeObjectURL(url);
}
